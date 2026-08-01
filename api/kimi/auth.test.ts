import { Hono } from "hono";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Paths } from "@contracts/constants";
import { OAuth, createOAuthState, createOAuthTransactionCookie } from "./oauth";

vi.mock("../queries/users", () => ({
  findUserByUnionId: vi.fn(),
  upsertUser: vi.fn(),
}));

const APP_SECRET = "handler-test-secret";
const CALLBACK_URI = "https://atlas.example/api/oauth/callback";
const STATE = createOAuthState(() => new Uint8Array(32).fill(0x3c));

let createOAuthCallbackHandler: typeof import("./auth").createOAuthCallbackHandler;
let createOAuthStartHandler: typeof import("./auth").createOAuthStartHandler;

beforeAll(async () => {
  vi.stubEnv("APP_ID", "atlas-test-client");
  vi.stubEnv("APP_SECRET", APP_SECRET);
  vi.stubEnv("KIMI_AUTH_URL", "https://auth.kimi.example");
  vi.stubEnv("KIMI_OPEN_URL", "https://open.kimi.example");
  ({ createOAuthCallbackHandler, createOAuthStartHandler } =
    await import("./auth"));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function createTestApp() {
  const app = new Hono();
  app.get(OAuth.startPath, createOAuthStartHandler());
  app.get(Paths.oauthCallback, createOAuthCallbackHandler());
  return app;
}

describe("OAuth HTTP handlers", () => {
  it("starts authorization on the server with a protected nonce cookie", async () => {
    const response = await createTestApp().request(
      "https://atlas.example/api/oauth/start?returnTo=%2F%2Fevil.example"
    );

    expect(response.status).toBe(302);
    const authorizationUrl = new URL(response.headers.get("location") ?? "");
    expect(authorizationUrl.origin).toBe("https://auth.kimi.example");
    expect(authorizationUrl.pathname).toBe("/api/oauth/authorize");
    expect(authorizationUrl.searchParams.get("client_id")).toBe(
      "atlas-test-client"
    );
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
      CALLBACK_URI
    );
    expect(authorizationUrl.searchParams.get("state")).toMatch(
      /^[A-Za-z0-9_-]{43}$/
    );

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${OAuth.stateCookieName}=`);
    expect(setCookie).toContain("Max-Age=600");
    expect(setCookie).toContain("Path=/api/oauth/callback");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("validates then consumes a callback cookie before honoring denial", async () => {
    const transactionCookie = createOAuthTransactionCookie({
      state: STATE,
      callbackUri: CALLBACK_URI,
      returnTo: "/planner",
      secret: APP_SECRET,
    });
    const callback = new URL(CALLBACK_URI);
    callback.searchParams.set("error", "access_denied");
    callback.searchParams.set("state", STATE);

    const response = await createTestApp().request(callback, {
      headers: {
        Cookie: `${OAuth.stateCookieName}=${transactionCookie}`,
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/planner");
    const deletion = response.headers.get("set-cookie") ?? "";
    expect(deletion).toContain(`${OAuth.stateCookieName}=;`);
    expect(deletion).toContain("Max-Age=0");
    expect(deletion).toContain("Path=/api/oauth/callback");
    expect(deletion).toContain("HttpOnly");
    expect(deletion).toContain("SameSite=Lax");

    const replayWithoutConsumedCookie = await createTestApp().request(callback);
    expect(replayWithoutConsumedCookie.status).toBe(400);
    await expect(replayWithoutConsumedCookie.json()).resolves.toEqual({
      error: "Invalid or expired OAuth state",
    });
  });

  it("clears malformed callback state without making an upstream request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await createTestApp().request(
      `${CALLBACK_URI}?code=attacker-code&state=attacker-state`,
      {
        headers: { Cookie: `${OAuth.stateCookieName}=malformed` },
      }
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
