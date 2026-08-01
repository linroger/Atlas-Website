import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  double,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Atlas domain tables ─────────────────────────────────────────

/** A published travel journey (visual experience) in the community. */
export const journeys = mysqlTable("journeys", {
  id: serial("id").primaryKey(),
  /** null for Atlas-curated seed stories */
  userId: bigint("userId", { mode: "number", unsigned: true }),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  country: varchar("country", { length: 255 }).notNull(),
  /** AI-written short evocative summary */
  summary: text("summary"),
  /** AI-written long-form trip story */
  story: text("story"),
  /** AI landmark & attraction notes (JSON array) */
  landmarks: text("landmarks"),
  mood: varchar("mood", { length: 64 }).default("wanderlust").notNull(),
  coverUrl: text("coverUrl"),
  /** AI-generated banner image */
  bannerUrl: text("bannerUrl"),
  /** AI-generated trip film */
  videoUrl: text("videoUrl"),
  /** AI-generated narration audio */
  narrationUrl: text("narrationUrl"),
  daysCount: int("daysCount").default(1).notNull(),
  photosCount: int("photosCount").default(0).notNull(),
  distanceKm: double("distanceKm").default(0),
  likesCount: int("likesCount").default(0).notNull(),
  replicatesCount: int("replicatesCount").default(0).notNull(),
  viewsCount: int("viewsCount").default(0).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorAvatar: text("authorAvatar"),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Photos attached to a journey (stored via gateway file id; url cached). */
export const journeyPhotos = mysqlTable("journey_photos", {
  id: serial("id").primaryKey(),
  journeyId: bigint("journeyId", { mode: "number", unsigned: true }).notNull(),
  url: text("url").notNull(),
  /** agent-gw storage file id for re-signing, if uploaded */
  fileId: varchar("fileId", { length: 191 }),
  caption: varchar("caption", { length: 500 }),
  day: int("day").default(1).notNull(),
  lat: double("lat"),
  lng: double("lng"),
  takenAt: timestamp("takenAt"),
  sortOrder: int("sortOrder").default(0).notNull(),
});

/** Ordered route stops of a journey (the replicable route). */
export const journeyStops = mysqlTable("journey_stops", {
  id: serial("id").primaryKey(),
  journeyId: bigint("journeyId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  note: varchar("note", { length: 500 }),
  day: int("day").default(1).notNull(),
  stopOrder: int("stopOrder").default(0).notNull(),
  lat: double("lat"),
  lng: double("lng"),
  kind: varchar("kind", { length: 64 }).default("spot").notNull(),
});

/** Chapter narration for the immersive journey player. */
export const journeyChapters = mysqlTable("journey_chapters", {
  id: serial("id").primaryKey(),
  journeyId: bigint("journeyId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  chapterOrder: int("chapterOrder").default(0).notNull(),
  photoUrl: text("photoUrl"),
});

export const journeyLikes = mysqlTable(
  "journey_likes",
  {
    id: serial("id").primaryKey(),
    journeyId: bigint("journeyId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("likes_uq").on(t.journeyId, t.userId)],
);

/** One-click route replication ("experience their life"). */
export const routeReplications = mysqlTable(
  "route_replications",
  {
    id: serial("id").primaryKey(),
    journeyId: bigint("journeyId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("replications_uq").on(t.journeyId, t.userId)],
);

/** AI-planned trips from the Trip Planner. */
export const plannedTrips = mysqlTable("planned_trips", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  daysCount: int("daysCount").default(3).notNull(),
  vibes: varchar("vibes", { length: 255 }),
  budget: varchar("budget", { length: 64 }),
  /** AI-generated day-by-day itinerary (JSON) */
  itinerary: text("itinerary"),
  /** AI-written trip brief */
  brief: text("brief"),
  status: mysqlEnum("status", ["draft", "saved", "archived"])
    .default("saved")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Async AI jobs (film render, banner, narration) with polling. */
export const aiJobs = mysqlTable("ai_jobs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  kind: mysqlEnum("kind", ["film", "banner", "narration", "dna_art"]).notNull(),
  status: mysqlEnum("status", ["queued", "running", "done", "failed"])
    .default("queued")
    .notNull(),
  input: text("input"),
  result: text("result"),
  error: varchar("error", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Journey = typeof journeys.$inferSelect;
export type JourneyPhoto = typeof journeyPhotos.$inferSelect;
export type JourneyStop = typeof journeyStops.$inferSelect;
export type JourneyChapter = typeof journeyChapters.$inferSelect;
export type PlannedTrip = typeof plannedTrips.$inferSelect;
export type AiJob = typeof aiJobs.$inferSelect;
