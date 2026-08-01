import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { plannedTrips, journeys, journeyPhotos, routeReplications } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { composeDna } from "./ai/composer";
import { inArray } from "drizzle-orm";

export const plannerRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(plannedTrips)
      .where(eq(plannedTrips.userId, ctx.user.id))
      .orderBy(desc(plannedTrips.createdAt));
    return rows.map((t) => ({
      ...t,
      itinerary: safeParse(t.itinerary),
    }));
  }),

  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [t] = await db.select().from(plannedTrips).where(eq(plannedTrips.id, input.id));
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(plannedTrips).where(eq(plannedTrips.id, input.id));
      return { ok: true };
    }),
});

function safeParse(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const dnaRouter = createRouter({
  /** Aggregated Travel DNA for the signed-in explorer. */
  mine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myJourneys = await db
      .select()
      .from(journeys)
      .where(eq(journeys.userId, ctx.user.id))
      .orderBy(desc(journeys.createdAt));

    const journeyIds = myJourneys.map((j) => j.id);
    let photosCount = 0;
    if (journeyIds.length) {
      const photos = await db
        .select({ id: journeyPhotos.id })
        .from(journeyPhotos)
        .where(inArray(journeyPhotos.journeyId, journeyIds));
      photosCount = photos.length;
    }

    const replicated = await db
      .select({ journey: journeys })
      .from(routeReplications)
      .innerJoin(journeys, eq(routeReplications.journeyId, journeys.id))
      .where(eq(routeReplications.userId, ctx.user.id));

    const countries = new Set(
      [...myJourneys.map((j) => j.country), ...replicated.map((r) => r.journey.country)].filter(
        Boolean,
      ),
    );
    const destinations = [
      ...new Set([
        ...myJourneys.map((j) => j.destination),
        ...replicated.map((r) => r.journey.destination),
      ]),
    ];
    const days =
      myJourneys.reduce((s, j) => s + j.daysCount, 0) +
      replicated.reduce((s, r) => s + r.journey.daysCount, 0);
    const moods = [...new Set(myJourneys.map((j) => j.mood).filter(Boolean))];

    const dna = composeDna({
      name: ctx.user.name || "Explorer",
      countries: countries.size,
      cities: destinations.length,
      days,
      photos: photosCount,
      journeys: myJourneys.length,
      moods,
      destinations,
    });

    return {
      stats: {
        countries: countries.size,
        cities: destinations.length,
        days,
        photos: photosCount,
        journeys: myJourneys.length,
        replicated: replicated.length,
      },
      dna,
      journeys: myJourneys,
      replicatedJourneys: replicated.map((r) => r.journey),
      destinations,
    };
  }),
});
