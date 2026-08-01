import { describe, expect, it } from "vitest";
import { toPublicJourney, toPublicPhoto } from "./journey-public";

describe("public journey photo projection", () => {
  it("uses the stable media proxy and omits private storage and EXIF fields", () => {
    const projected = toPublicPhoto({
      id: 7,
      journeyId: 3,
      url: "https://signed.example/expired",
      fileId: "opaque/id",
      caption: "Sunrise",
      day: 2,
      sortOrder: 0,
    });

    expect(projected.url).toBe("/api/media/opaque%2Fid");
    expect(projected).not.toHaveProperty("fileId");
    expect(projected).not.toHaveProperty("lat");
    expect(projected).not.toHaveProperty("lng");
    expect(projected).not.toHaveProperty("takenAt");
  });
});

describe("public journey projection", () => {
  it("uses an allowlist that omits the internal account id", () => {
    const projected = toPublicJourney({
      id: 3,
      userId: 812,
      slug: "kyoto-autumn",
      title: "Kyoto Autumn",
      destination: "Kyoto",
      country: "Japan",
      summary: "Maple light",
      story: "A public story",
      landmarks: "[]",
      mood: "wonder",
      coverUrl: null,
      bannerUrl: null,
      videoUrl: null,
      narrationUrl: null,
      daysCount: 3,
      photosCount: 4,
      distanceKm: 12,
      likesCount: 8,
      replicatesCount: 2,
      viewsCount: 21,
      authorName: "Traveler",
      authorAvatar: null,
      featured: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(projected).not.toHaveProperty("userId");
    expect(projected.slug).toBe("kyoto-autumn");
    expect(projected.authorName).toBe("Traveler");
  });
});
