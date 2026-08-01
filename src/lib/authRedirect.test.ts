import { describe, expect, it } from "vitest";
import { loginRedirectWithReturnTo } from "./authRedirect";

describe("protected-route login redirect", () => {
  it("preserves pathname, query, and hash through OAuth", () => {
    expect(
      loginRedirectWithReturnTo("/login", {
        pathname: "/create",
        search: "?draft=7",
        hash: "#photos",
      })
    ).toBe("/login?returnTo=%2Fcreate%3Fdraft%3D7%23photos");
  });

  it("appends to an existing login query", () => {
    expect(
      loginRedirectWithReturnTo("/login?source=nav", {
        pathname: "/planner",
        search: "",
        hash: "",
      })
    ).toBe("/login?source=nav&returnTo=%2Fplanner");
  });
});
