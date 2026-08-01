import { z } from "zod";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  journeys,
  journeyPhotos,
  journeyStops,
  journeyChapters,
  journeyLikes,
  routeReplications,
} from "@db/schema";
import { TRPCError } from "@trpc/server";
import { mediaProxyUrl, verifyMediaCapability } from "./ai/media";
import { toPublicJourney, toPublicPhoto } from "./journey-public";
import { PhotoUpload } from "@contracts/constants";

async function attachRelations(
  j: typeof journeys.$inferSelect,
  userId?: number
) {
  const db = getDb();
  const [photos, stops, chapters, likeRow, repRow] = await Promise.all([
    db
      .select()
      .from(journeyPhotos)
      .where(eq(journeyPhotos.journeyId, j.id))
      .orderBy(journeyPhotos.sortOrder),
    db
      .select()
      .from(journeyStops)
      .where(eq(journeyStops.journeyId, j.id))
      .orderBy(journeyStops.day, journeyStops.stopOrder),
    db
      .select()
      .from(journeyChapters)
      .where(eq(journeyChapters.journeyId, j.id))
      .orderBy(journeyChapters.chapterOrder),
    userId
      ? db
          .select()
          .from(journeyLikes)
          .where(
            and(
              eq(journeyLikes.journeyId, j.id),
              eq(journeyLikes.userId, userId)
            )
          )
      : Promise.resolve([]),
    userId
      ? db
          .select()
          .from(routeReplications)
          .where(
            and(
              eq(routeReplications.journeyId, j.id),
              eq(routeReplications.userId, userId)
            )
          )
      : Promise.resolve([]),
  ]);
  const publicPhotos = photos.map(toPublicPhoto);
  return {
    ...toPublicJourney(j),
    coverUrl: publicPhotos[0]?.url || j.coverUrl,
    photos: publicPhotos,
    stops,
    chapters,
    likedByMe: likeRow.length > 0,
    replicatedByMe: repRow.length > 0,
    landmarks: safeParseLandmarks(j.landmarks),
  };
}

function safeParseLandmarks(
  raw: string | null
): { name: string; note: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const journeyRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          q: z.string().optional(),
          mood: z.string().optional(),
          featured: z.boolean().optional(),
          limit: z.number().min(1).max(50).default(24),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conds = [];
      if (input?.q) {
        const q = `%${input.q}%`;
        conds.push(
          sql`(${journeys.title} LIKE ${q} OR ${journeys.destination} LIKE ${q} OR ${journeys.country} LIKE ${q} OR ${journeys.summary} LIKE ${q})`
        );
      }
      if (input?.mood && input.mood !== "all") {
        conds.push(eq(journeys.mood, input.mood));
      }
      if (input?.featured) conds.push(eq(journeys.featured, true));
      const rows = await db
        .select()
        .from(journeys)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(
          desc(journeys.featured),
          desc(journeys.likesCount),
          desc(journeys.createdAt)
        )
        .limit(input?.limit ?? 24);
      return rows.map(j => ({
        ...toPublicJourney(j),
        landmarks: safeParseLandmarks(j.landmarks),
      }));
    }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [j] = await db
        .select()
        .from(journeys)
        .where(eq(journeys.slug, input.slug));
      if (!j)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Journey not found",
        });
      // fire-and-forget view bump
      db.update(journeys)
        .set({ viewsCount: sql`${journeys.viewsCount} + 1` })
        .where(eq(journeys.id, j.id))
        .catch(() => {});
      return attachRelations(j, ctx.user?.id);
    }),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [j] = await db
        .select()
        .from(journeys)
        .where(eq(journeys.id, input.id));
      if (!j)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Journey not found",
        });
      return attachRelations(j, ctx.user?.id);
    }),

  mine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, ctx.user.id))
      .orderBy(desc(journeys.createdAt));
  }),

  create: authedQuery
    .input(
      z.object({
        slug: z.string().min(3).max(191),
        title: z.string().min(1).max(255),
        destination: z.string().min(1).max(255),
        country: z.string().max(255).default(""),
        summary: z.string().default(""),
        story: z.string().default(""),
        landmarks: z
          .array(z.object({ name: z.string(), note: z.string() }))
          .default([]),
        mood: z.string().max(64).default("wanderlust"),
        coverUrl: z.string().optional(),
        daysCount: z.number().min(1).max(365).default(1),
        photos: z
          .array(
            z.object({
              url: z.string().min(1).max(2048),
              fileId: z.string().min(1).max(512).optional(),
              caption: z.string().max(500).optional(),
              day: z.number().min(1).default(1),
              lat: z.number().optional(),
              lng: z.number().optional(),
              takenAt: z.date().optional(),
            })
          )
          .max(PhotoUpload.maxPhotos)
          .default([]),
        stops: z
          .array(
            z.object({
              name: z.string().max(255),
              note: z.string().max(500).optional(),
              day: z.number().min(1).default(1),
              lat: z.number().optional(),
              lng: z.number().optional(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const uploadCapabilities = input.photos.flatMap(photo =>
        photo.fileId ? [photo.fileId] : []
      );
      if (new Set(uploadCapabilities).size !== uploadCapabilities.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Each uploaded photo may be published only once per journey",
        });
      }
      const db = getDb();
      const persistedPhotos = input.photos.map(photo => {
        if (!photo.fileId) return photo;
        const storageFileId = verifyMediaCapability(photo.fileId, ctx.user.id);
        return {
          ...photo,
          fileId: storageFileId,
          url: mediaProxyUrl(storageFileId),
        };
      });
      const existing = await db
        .select({ id: journeys.id })
        .from(journeys)
        .where(eq(journeys.slug, input.slug));
      const slug = existing.length
        ? `${input.slug}-${Date.now() % 100000}`
        : input.slug;
      const [result] = await db.insert(journeys).values({
        userId: ctx.user.id,
        slug,
        title: input.title,
        destination: input.destination,
        country: input.country,
        summary: input.summary,
        story: input.story,
        landmarks: JSON.stringify(input.landmarks),
        mood: input.mood,
        coverUrl: persistedPhotos[0]?.url || input.coverUrl || null,
        daysCount: input.daysCount,
        photosCount: input.photos.length,
        authorName: ctx.user.name || "Atlas Explorer",
        authorAvatar: ctx.user.avatar || null,
      });
      const journeyId = Number(result.insertId);
      if (persistedPhotos.length) {
        await db.insert(journeyPhotos).values(
          persistedPhotos.map((p, i) => ({
            journeyId,
            url: p.url,
            fileId: p.fileId || null,
            caption: p.caption || null,
            day: p.day,
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            takenAt: p.takenAt || null,
            sortOrder: i,
          }))
        );
      }
      if (input.stops.length) {
        await db.insert(journeyStops).values(
          input.stops.map((s, i) => ({
            journeyId,
            name: s.name,
            note: s.note || null,
            day: s.day,
            stopOrder: i,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
          }))
        );
      }
      return { id: journeyId, slug };
    }),

  updateMedia: authedQuery
    .input(
      z.object({
        id: z.number(),
        bannerUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        narrationUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [j] = await db
        .select()
        .from(journeys)
        .where(eq(journeys.id, input.id));
      if (!j) throw new TRPCError({ code: "NOT_FOUND" });
      if (j.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db
        .update(journeys)
        .set({
          ...(input.bannerUrl ? { bannerUrl: input.bannerUrl } : {}),
          ...(input.videoUrl ? { videoUrl: input.videoUrl } : {}),
          ...(input.narrationUrl ? { narrationUrl: input.narrationUrl } : {}),
        })
        .where(eq(journeys.id, input.id));
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [j] = await db
        .select()
        .from(journeys)
        .where(eq(journeys.id, input.id));
      if (!j) throw new TRPCError({ code: "NOT_FOUND" });
      if (j.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await Promise.all([
        db.delete(journeyPhotos).where(eq(journeyPhotos.journeyId, input.id)),
        db.delete(journeyStops).where(eq(journeyStops.journeyId, input.id)),
        db
          .delete(journeyChapters)
          .where(eq(journeyChapters.journeyId, input.id)),
        db.delete(journeyLikes).where(eq(journeyLikes.journeyId, input.id)),
        db
          .delete(routeReplications)
          .where(eq(routeReplications.journeyId, input.id)),
      ]);
      await db.delete(journeys).where(eq(journeys.id, input.id));
      return { ok: true };
    }),

  toggleLike: authedQuery
    .input(z.object({ journeyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(journeyLikes)
        .where(
          and(
            eq(journeyLikes.journeyId, input.journeyId),
            eq(journeyLikes.userId, ctx.user.id)
          )
        );
      if (existing.length) {
        await db
          .delete(journeyLikes)
          .where(eq(journeyLikes.id, existing[0].id));
        await db
          .update(journeys)
          .set({ likesCount: sql`GREATEST(0, ${journeys.likesCount} - 1)` })
          .where(eq(journeys.id, input.journeyId));
        return { liked: false };
      }
      await db
        .insert(journeyLikes)
        .values({ journeyId: input.journeyId, userId: ctx.user.id });
      await db
        .update(journeys)
        .set({ likesCount: sql`${journeys.likesCount} + 1` })
        .where(eq(journeys.id, input.journeyId));
      return { liked: true };
    }),

  replicateRoute: authedQuery
    .input(z.object({ journeyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(routeReplications)
        .where(
          and(
            eq(routeReplications.journeyId, input.journeyId),
            eq(routeReplications.userId, ctx.user.id)
          )
        );
      if (existing.length) {
        await db
          .delete(routeReplications)
          .where(eq(routeReplications.id, existing[0].id));
        await db
          .update(journeys)
          .set({
            replicatesCount: sql`GREATEST(0, ${journeys.replicatesCount} - 1)`,
          })
          .where(eq(journeys.id, input.journeyId));
        return { replicated: false };
      }
      await db
        .insert(routeReplications)
        .values({ journeyId: input.journeyId, userId: ctx.user.id });
      await db
        .update(journeys)
        .set({ replicatesCount: sql`${journeys.replicatesCount} + 1` })
        .where(eq(journeys.id, input.journeyId));
      return { replicated: true };
    }),

  myReplications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ journey: journeys })
      .from(routeReplications)
      .innerJoin(journeys, eq(routeReplications.journeyId, journeys.id))
      .where(eq(routeReplications.userId, ctx.user.id))
      .orderBy(desc(routeReplications.createdAt));
    return rows.map(r => r.journey);
  }),

  moods: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .selectDistinct({ mood: journeys.mood })
      .from(journeys)
      .where(ne(journeys.mood, ""));
    return rows.map(r => r.mood);
  }),
});
