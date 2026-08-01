import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { aiJobs, plannedTrips } from "@db/schema";
import {
  generateImage,
  generateVideo,
  generateSpeech,
  uploadStorage,
  signStorageUrl,
  aiEnabled,
} from "./ai/gateway";
import {
  composeJourneyStory,
  composeFilmPrompt,
  composeBannerPrompt,
  composeItinerary,
  composeNarrationScript,
  gatherIntel,
} from "./ai/composer";
import { extractExif, reverseGeocode, analyzeTripWindow } from "./ai/exif";
import { TRPCError } from "@trpc/server";
import { PhotoUpload } from "@contracts/constants";
import {
  decodeImageDataUrl,
  issueMediaCapability,
  privateMediaProxyUrl,
  verifyMediaCapability,
} from "./ai/media";

/**
 * Run one provider submission and update its DB record as it settles.
 *
 * Provider create calls are deliberately single-shot: retrying after an
 * ambiguous timeout can create duplicate paid image/video jobs.
 */
function runJob(jobId: number, task: () => Promise<{ url: string }>) {
  const db = getDb();
  db.update(aiJobs)
    .set({ status: "running" })
    .where(eq(aiJobs.id, jobId))
    .catch(() => {});
  void task()
    .then(result =>
      db
        .update(aiJobs)
        .set({ status: "done", result: JSON.stringify(result) })
        .where(eq(aiJobs.id, jobId))
    )
    .catch((err: Error) =>
      db
        .update(aiJobs)
        .set({ status: "failed", error: err.message.slice(0, 480) })
        .where(eq(aiJobs.id, jobId))
    )
    .catch(() => {});
}

export const aiRouter = createRouter({
  status: publicQuery.query(() => ({ enabled: aiEnabled() })),

  /**
   * AI Studio step 1+2 — upload vacation photos.
   * Atlas AI uploads them to cloud storage, reads EXIF (GPS + time),
   * detects the trip window and clusters photos into days.
   */
  analyzePhotos: authedQuery
    .input(
      z.object({
        photos: z.array(z.string()).min(1).max(PhotoUpload.maxPhotos),
        destinationHint: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const metas = [];
      const uploaded = [];
      for (let i = 0; i < input.photos.length; i++) {
        const { buf, mime } = await decodeImageDataUrl(input.photos[i]);
        const meta = extractExif(buf, i);
        const ext =
          mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
        // Storage writes are single-shot: an automatic retry after a timeout
        // could create an orphaned duplicate upload.
        const up = await uploadStorage(
          buf,
          `atlas-photo-${Date.now()}-${i}.${ext}`,
          mime
        );
        const capability = issueMediaCapability(up.fileId, ctx.user.id);
        metas.push(meta);
        uploaded.push({
          index: i,
          url: privateMediaProxyUrl(capability),
          fileId: capability,
          lat: meta.lat,
          lng: meta.lng,
          takenAt: meta.takenAt,
        });
      }

      const window = analyzeTripWindow(metas);
      let geo: { place: string; city: string; country: string } | null = null;
      if (window.centroid) {
        geo = await reverseGeocode(window.centroid.lat, window.centroid.lng);
      }
      const destination =
        input.destinationHint || geo?.city || geo?.place || "";
      const country = geo?.country || "";

      const dayByIndex: Record<number, number> = {};
      window.dayByIndex.forEach((v, k) => (dayByIndex[k] = v));

      return {
        photos: uploaded.map(p => ({ ...p, day: dayByIndex[p.index] ?? 1 })),
        locatedCount: window.locatedCount,
        centroid: window.centroid,
        detectedPlace: geo,
        destination,
        country,
        daysCount: Math.min(window.daysCount, 30),
        startDate: window.startDate,
        endDate: window.endDate,
      };
    }),

  /**
   * AI Studio step 3 — write the journey: title, summary, story,
   * landmark notes. Provider chain: LLM → composer w/ live search intel.
   */
  writeStory: authedQuery
    .input(
      z.object({
        destination: z.string().min(1),
        country: z.string().default(""),
        daysCount: z.number().min(1).max(60).default(3),
        stops: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const intel = await gatherIntel(
        `${input.destination} ${input.country}`.trim()
      );
      const draft = await composeJourneyStory({
        destination: input.destination,
        country: input.country,
        daysCount: input.daysCount,
        stops: input.stops,
        intel,
      });
      return { ...draft, intelNotes: intel.notes, intelPlaces: intel.places };
    }),

  /** Destination intelligence for chips/suggestions. */
  destinationIntel: publicQuery
    .input(z.object({ destination: z.string().min(1) }))
    .query(async ({ input }) => {
      const intel = await gatherIntel(input.destination);
      return { notes: intel.notes, places: intel.places };
    }),

  /** Start an AI banner job (image model) — poll jobStatus. */
  startBanner: authedQuery
    .input(
      z.object({
        destination: z.string().min(1),
        country: z.string().default(""),
        mood: z.string().default("wanderlust"),
        journeyId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const prompt = composeBannerPrompt(input);
      const [result] = await db.insert(aiJobs).values({
        userId: ctx.user.id,
        kind: "banner",
        input: JSON.stringify({ prompt }),
      });
      const jobId = Number(result.insertId);
      runJob(jobId, async () => ({
        url: await generateImage(prompt, { ratio: "3:2" }),
      }));
      return { jobId };
    }),

  /** Start an AI trip-film job (video model) from uploaded photo file ids. */
  startFilm: authedQuery
    .input(
      z.object({
        destination: z.string().min(1),
        photoFileIds: z.array(z.string().min(1).max(512)).min(1).max(4),
        mood: z.string().default("wanderlust"),
        daysCount: z.number().default(3),
        journeyId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Resolve only capabilities issued to this user; raw gateway ids and
      // another user's capabilities are rejected before signing.
      const storageFileIds = input.photoFileIds.map(capability =>
        verifyMediaCapability(capability, ctx.user.id)
      );
      const resolved = await Promise.all(
        storageFileIds.map(id => signStorageUrl(id))
      );
      const photoUrls = resolved.filter((u): u is string => Boolean(u));
      if (!photoUrls.length) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Photos are not available for film rendering yet",
        });
      }
      const prompt = composeFilmPrompt(input);
      const [result] = await db.insert(aiJobs).values({
        userId: ctx.user.id,
        kind: "film",
        input: JSON.stringify({ prompt, photos: photoUrls }),
      });
      const jobId = Number(result.insertId);
      runJob(jobId, async () => ({
        url: await generateVideo(prompt, photoUrls, { durationSeconds: 4 }),
      }));
      return { jobId };
    }),

  /** Start an AI narration job (speech model). */
  startNarration: authedQuery
    .input(
      z.object({
        title: z.string().min(1),
        destination: z.string().min(1),
        daysCount: z.number().default(3),
        summary: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const script = composeNarrationScript(input);
      const [result] = await db.insert(aiJobs).values({
        userId: ctx.user.id,
        kind: "narration",
        input: JSON.stringify({ script }),
      });
      const jobId = Number(result.insertId);
      runJob(jobId, async () => ({ url: await generateSpeech(script) }));
      return { jobId, script };
    }),

  /** Generate Travel DNA art (shareable identity card image). */
  startDnaArt: authedQuery
    .input(
      z.object({
        archetype: z.string(),
        palette: z.string().default("sky peach lavender"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const prompt =
        `Minimalist premium identity card artwork for a travel archetype called "${input.archetype}". ` +
        `Abstract horizon landscape built from soft ${input.palette} gradients, frosted glass panels, ` +
        `a thin orbital route line with tiny waypoint dots, airy negative space, elegant, no text.`;
      const [result] = await db.insert(aiJobs).values({
        userId: ctx.user.id,
        kind: "dna_art",
        input: JSON.stringify({ prompt }),
      });
      const jobId = Number(result.insertId);
      runJob(jobId, async () => ({
        url: await generateImage(prompt, { ratio: "3:2" }),
      }));
      return { jobId };
    }),

  jobStatus: authedQuery
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [job] = await db
        .select()
        .from(aiJobs)
        .where(eq(aiJobs.id, input.jobId));
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      let result: { url?: string } | null = null;
      try {
        result = job.result ? JSON.parse(job.result) : null;
      } catch {
        result = null;
      }
      return { status: job.status, result, error: job.error, kind: job.kind };
    }),

  /** AI trip planner — real places from search + composed itinerary. */
  planTrip: authedQuery
    .input(
      z.object({
        destination: z.string().min(1),
        days: z.number().min(1).max(14).default(3),
        vibes: z.array(z.string()).default([]),
        budget: z.enum(["backpacker", "comfort", "luxury"]).default("comfort"),
        save: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const intel = await gatherIntel(input.destination);
      const plan = await composeItinerary({
        destination: input.destination,
        days: input.days,
        vibes: input.vibes,
        budget: input.budget,
        intel,
      });
      let tripId: number | null = null;
      if (input.save) {
        const db = getDb();
        const [result] = await db.insert(plannedTrips).values({
          userId: ctx.user.id,
          destination: input.destination,
          daysCount: input.days,
          vibes: input.vibes.join(","),
          budget: input.budget,
          itinerary: JSON.stringify(plan.days),
          brief: plan.brief,
        });
        tripId = Number(result.insertId);
      }
      return { ...plan, tripId, places: intel.places, notes: intel.notes };
    }),
});
