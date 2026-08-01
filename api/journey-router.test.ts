import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./context";
import { journeyRouter } from "./journey-router";
import { PhotoUpload } from "@contracts/constants";

const context: TrpcContext = {
  req: new Request("https://atlas.example/api/trpc"),
  resHeaders: new Headers(),
  user: {
    id: 9,
    unionId: "test-user",
    name: "Test User",
    email: null,
    avatar: null,
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    lastSignInAt: new Date("2026-01-01T00:00:00Z"),
  },
};

const baseJourney = {
  slug: "test-journey",
  title: "Test Journey",
  destination: "Shanghai",
};

describe("journey publication photo guardrails", () => {
  it("rejects more photos than the shared upload limit before database work", async () => {
    const photos = Array.from(
      { length: PhotoUpload.maxPhotos + 1 },
      (_, index) => ({
        url: `https://images.example/${index}.jpg`,
      })
    );

    await expect(
      journeyRouter.createCaller(context).create({ ...baseJourney, photos })
    ).rejects.toThrow();
  });

  it("rejects replaying one upload capability in the same journey", async () => {
    await expect(
      journeyRouter.createCaller(context).create({
        ...baseJourney,
        photos: [
          { url: "/api/media/private/a", fileId: "same-capability" },
          { url: "/api/media/private/a", fileId: "same-capability" },
        ],
      })
    ).rejects.toThrow(/only once/i);
  });
});
