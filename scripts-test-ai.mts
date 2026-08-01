import "dotenv/config";
import fs from "node:fs";
const { extractExif, reverseGeocode, analyzeTripWindow } =
  await import("./api/ai/exif");
const { gatherIntel, composeJourneyStory, composeItinerary } =
  await import("./api/ai/composer");
const { uploadStorage } = await import("./api/ai/gateway");

const p1 = fs.readFileSync("/tmp/atlas-test/photo1.jpg");
const p2 = fs.readFileSync("/tmp/atlas-test/photo2.jpg");
const m1 = extractExif(p1, 0);
const m2 = extractExif(p2, 1);
const win = analyzeTripWindow([m1, m2]);
console.log("Trip window:", { located: win.locatedCount, days: win.daysCount });
if (win.centroid)
  console.log(
    "Geocode:",
    await reverseGeocode(win.centroid.lat, win.centroid.lng)
  );

const up = await uploadStorage(p1, "atlas-e2e.jpg", "image/jpeg");
console.log("Uploaded:", up.fileId);

const intel = await gatherIntel("Kyoto Japan");
console.log("Places:", intel.places.slice(0, 6).join(" | "));
const story = await composeJourneyStory({
  destination: "Kyoto",
  country: "Japan",
  daysCount: win.daysCount,
  stops: ["Arashiyama Bamboo Grove", "Gion"],
  intel,
});
console.log("\nTITLE:", story.title);
console.log("SUMMARY:", story.summary);
console.log("LANDMARKS:", story.landmarks.map(l => l.name).join(" | "));
console.log("MOOD:", story.mood);

const plan = await composeItinerary({
  destination: "Kyoto",
  days: 2,
  vibes: ["culture", "food"],
  budget: "comfort",
  intel,
});
console.log("\nBRIEF:", plan.brief.slice(0, 180));
console.log(
  "DAY1 theme:",
  plan.days[0]?.theme,
  "| morning:",
  plan.days[0]?.morning.slice(0, 80)
);
