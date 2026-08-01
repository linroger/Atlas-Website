import { describe, expect, it } from "vitest";
import {
  DEMO_JOURNEYS,
  DEMO_MOODS,
  filterDemoJourneys,
  findDemoJourney,
} from "./demoJourneys";

describe("static journey catalog", () => {
  it("has unique, routable slugs and internally consistent media counts", () => {
    expect(new Set(DEMO_JOURNEYS.map(({ slug }) => slug)).size).toBe(
      DEMO_JOURNEYS.length,
    );
    for (const journey of DEMO_JOURNEYS) {
      expect(journey.photosCount).toBe(journey.photos.length);
      expect(findDemoJourney(journey.slug)?.id).toBe(journey.id);
    }
  });

  it("supports the same search, mood, featured, and limit inputs as Explore", () => {
    expect(filterDemoJourneys({ q: "kyoto" }).map(({ slug }) => slug)).toContain(
      "kyoto-slow-days",
    );
    expect(filterDemoJourneys({ mood: "epic" })).toHaveLength(1);
    expect(filterDemoJourneys({ featured: true, limit: 3 })).toHaveLength(3);
    expect(DEMO_MOODS).toEqual(expect.arrayContaining(["electric", "serene", "epic"]));
  });
});
