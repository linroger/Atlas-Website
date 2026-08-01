import { describe, expect, it } from "vitest";
import { backendFeaturePath, joinBasePath } from "./staticDemo";

describe("joinBasePath", () => {
  it("prefixes root-relative public files with a repository base", () => {
    expect(joinBasePath("/Atlas-Website/", "/assets/hero-poster.jpg")).toBe(
      "/Atlas-Website/assets/hero-poster.jpg",
    );
  });

  it("normalizes missing slashes and does not duplicate an existing base", () => {
    expect(joinBasePath("Atlas-Website", "assets/covers/tokyo.jpg")).toBe(
      "/Atlas-Website/assets/covers/tokyo.jpg",
    );
    expect(
      joinBasePath("/Atlas-Website/", "/Atlas-Website/assets/covers/tokyo.jpg"),
    ).toBe("/Atlas-Website/assets/covers/tokyo.jpg");
  });

  it("leaves remote and data URLs untouched", () => {
    expect(joinBasePath("/Atlas-Website/", "https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
    expect(joinBasePath("/Atlas-Website/", "data:image/png;base64,abc")).toBe(
      "data:image/png;base64,abc",
    );
  });
});

describe("backendFeaturePath", () => {
  it("encodes the unavailable feature as a hash-router-safe location", () => {
    expect(backendFeaturePath("AI Studio & auth")).toBe(
      "/unavailable?feature=AI%20Studio%20%26%20auth",
    );
  });
});
