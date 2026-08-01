import { describe, expect, it, vi } from "vitest";

vi.mock("./gateway", () => ({
  llmChat: vi.fn(async () => null),
  webSearch: vi.fn(async () => []),
}));

import { composeItinerary } from "./composer";

describe("composeItinerary deterministic fallback", () => {
  it("labels generic anchors instead of inventing named attractions", async () => {
    const itinerary = await composeItinerary({
      destination: "Example City",
      days: 2,
      vibes: ["culture"],
      budget: "comfort",
      intel: { notes: [], places: [] },
    });

    expect(itinerary.brief).toContain("did not return verifiable place names");
    expect(itinerary.brief).not.toContain("Example City Old Town");
    expect(itinerary.brief).not.toContain("Example City Central Market");
    expect(itinerary.days).toHaveLength(2);
  });

  it("describes supplied research places as research-backed", async () => {
    const itinerary = await composeItinerary({
      destination: "Example City",
      days: 1,
      vibes: [],
      budget: "backpacker",
      intel: { notes: [], places: ["Verified Museum"] },
    });

    expect(itinerary.brief).toContain("research-backed places");
    expect(itinerary.brief).toContain("Verified Museum");
  });
});
