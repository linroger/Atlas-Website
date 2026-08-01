import "dotenv/config";
import fs from "node:fs";

if (process.env.ATLAS_RUN_PAID_E2E !== "1") {
  throw new Error(
    "Set ATLAS_RUN_PAID_E2E=1 to acknowledge paid provider calls"
  );
}
const { appRouter } = await import("./api/router");
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

const analysis = await caller.ai.analyzePhotos({
  photos: [
    b64("/tmp/atlas-test/photo1.jpg"),
    b64("/tmp/atlas-test/photo2.jpg"),
  ],
});
console.log("photos uploaded:", analysis.photos.length);

const banner = await caller.ai.startBanner({
  destination: "Kyoto",
  country: "Japan",
  mood: "serene",
});
const film = await caller.ai.startFilm({
  destination: "Kyoto",
  photoFileIds: analysis.photos.slice(0, 2).map(p => p.fileId),
  mood: "serene",
  daysCount: 3,
});
console.log("jobs:", banner.jobId, film.jobId);

async function waitJob(jobId: number, label: string, timeoutMs: number) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const s = await caller.ai.jobStatus({ jobId });
    if (s.status === "done") {
      console.log(
        `${label} DONE (${Math.round((Date.now() - t0) / 1000)}s):`,
        s.result?.url?.slice(0, 100)
      );
      return true;
    }
    if (s.status === "failed") {
      console.log(`${label} FAILED:`, s.error);
      return false;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log(`${label} TIMEOUT still running`);
  return false;
}
const results = await Promise.all([
  waitJob(banner.jobId, "banner", 300000),
  waitJob(film.jobId, "film", 540000),
]);
if (results.some(passed => !passed)) {
  throw new Error("One or more paid generation jobs failed or timed out");
}
