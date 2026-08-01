import "dotenv/config";
import fs from "node:fs";

if (process.env.ATLAS_RUN_PAID_E2E !== "1") {
  throw new Error(
    "Set ATLAS_RUN_PAID_E2E=1 to acknowledge paid provider calls"
  );
}
console.log("modules loading…");
const { appRouter } = await import("./api/router");
console.log("router loaded");
const fakeUser = {
  id: 999001,
  unionId: "test-user-1",
  name: "Test Explorer",
  email: "test@atlas.demo",
  avatar: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};
const caller = appRouter.createCaller({
  req: new Request("http://localhost:3000"),
  resHeaders: new Headers(),
  user: fakeUser,
});

const b64 = (p: string) =>
  `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;
console.log("→ analyzePhotos…");
const analysis = await caller.ai.analyzePhotos({
  photos: [
    b64("/tmp/atlas-test/photo1.jpg"),
    b64("/tmp/atlas-test/photo2.jpg"),
  ],
});
console.log(
  "  destination:",
  analysis.destination,
  "| country:",
  analysis.country,
  "| days:",
  analysis.daysCount,
  "| located:",
  analysis.locatedCount
);
console.log("  uploaded photos:", analysis.photos.length);

console.log("→ writeStory…");
const story = await caller.ai.writeStory({
  destination: analysis.destination,
  country: analysis.country,
  daysCount: analysis.daysCount,
  stops: ["Arashiyama Bamboo Grove", "Gion"],
});
console.log(
  "  title:",
  story.title,
  "| mood:",
  story.mood,
  "| landmarks:",
  story.landmarks.length
);

console.log("→ startBanner…");
const banner = await caller.ai.startBanner({
  destination: analysis.destination,
  country: analysis.country,
  mood: story.mood,
});
console.log("  banner job:", banner.jobId);

console.log("→ startNarration…");
const narr = await caller.ai.startNarration({
  title: story.title,
  destination: analysis.destination,
  daysCount: analysis.daysCount,
  summary: story.summary,
});
console.log(
  "  narration job:",
  narr.jobId,
  "| script:",
  narr.script.slice(0, 90)
);

// poll both
async function waitJob(jobId: number, label: string, timeoutMs: number) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await caller.ai.jobStatus({ jobId });
    if (s.status === "done") {
      console.log(`  ${label} DONE:`, s.result?.url?.slice(0, 90));
      return s.result?.url;
    }
    if (s.status === "failed") {
      console.log(`  ${label} FAILED:`, s.error);
      return null;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log(`  ${label} still running after ${timeoutMs / 1000}s`);
  return null;
}
const bannerUrl = await waitJob(banner.jobId, "banner", 180000);
const narrUrl = await waitJob(narr.jobId, "narration", 180000);
if (!bannerUrl || !narrUrl) {
  throw new Error(
    "Paid authenticated flow failed; journey creation was not attempted"
  );
}

console.log("→ journey.create…");
const created = await caller.journey.create({
  slug: `e2e-test-kyoto-${Date.now() % 100000}`,
  title: story.title,
  destination: analysis.destination,
  country: analysis.country,
  summary: story.summary,
  story: story.story,
  landmarks: story.landmarks,
  mood: story.mood,
  coverUrl: analysis.photos[0]?.url,
  daysCount: analysis.daysCount,
  photos: analysis.photos.map(p => ({
    url: p.url,
    fileId: p.fileId,
    day: p.day,
    lat: p.lat ?? undefined,
    lng: p.lng ?? undefined,
    takenAt: p.takenAt ?? undefined,
  })),
  stops: [
    { name: "Arashiyama Bamboo Grove", day: 1, lat: 35.017, lng: 135.6711 },
    { name: "Gion", day: 2, lat: 35.0037, lng: 135.7755 },
  ],
});
console.log("  created:", created);

if (bannerUrl) await caller.journey.updateMedia({ id: created.id, bannerUrl });
if (narrUrl)
  await caller.journey.updateMedia({ id: created.id, narrationUrl: narrUrl });
const fetched = await caller.journey.bySlug({ slug: created.slug });
console.log(
  "  fetched journey:",
  fetched.title,
  "| photos:",
  fetched.photos.length,
  "| banner:",
  Boolean(fetched.bannerUrl),
  "| narration:",
  Boolean(fetched.narrationUrl)
);

console.log("→ planTrip…");
const plan = await caller.ai.planTrip({
  destination: "Kyoto",
  days: 3,
  vibes: ["culture", "food"],
  budget: "comfort",
});
console.log(
  "  trip saved:",
  plan.tripId,
  "| days:",
  plan.days.length,
  "| places:",
  plan.places.slice(0, 4).join(", ")
);

console.log("→ dna.mine…");
const dna = await caller.dna.mine();
console.log(
  "  stats:",
  JSON.stringify(dna.stats),
  "| archetype:",
  dna.dna.archetype
);

console.log("→ like + replicate…");
await caller.journey.toggleLike({ journeyId: created.id });
await caller.journey.replicateRoute({ journeyId: created.id });
const after = await caller.journey.byId({ id: created.id });
console.log(
  "  likes:",
  after.likesCount,
  "| replicated:",
  after.replicatedByMe,
  "| replicates:",
  after.replicatesCount
);

// cleanup test journey
await caller.journey.remove({ id: created.id });
console.log("  cleanup: removed test journey");
console.log("\nALL AUTHED FLOWS OK");
