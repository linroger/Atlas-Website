import { describe, expect, it } from "vitest";
import {
  OAuth,
  createOAuthState,
  createOAuthTransactionCookie,
  getOAuthStateCookieOptions,
  getSafeRedirectPath,
  resolveOAuthCallbackUri,
  validateOAuthTransaction,
} from "./oauth";

const NOW = Date.UTC(2026, 7, 2, 12, 0, 0);
const SECRET = "deterministic-test-secret";
const CALLBACK_URI = "https://atlas.example/api/oauth/callback";
const STATE = createOAuthState(() => new Uint8Array(32).fill(0xa5));

function transactionCookie(returnTo = "/planner?draft=42#route") {
  return createOAuthTransactionCookie({
    state: STATE,
    callbackUri: CALLBACK_URI,
    returnTo,
    secret: SECRET,
    nowMs: NOW,
  });
}

describe("OAuth state transactions", () => {
  it("creates a 256-bit base64url state from an injectable entropy source", () => {
    expect(STATE).toBe("paWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaU");
    expect(STATE).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("accepts the matching signed state before its deadline", () => {
    const result = validateOAuthTransaction({
      cookieValue: transactionCookie(),
      returnedState: STATE,
      callbackUri: CALLBACK_URI,
      secret: SECRET,
      nowMs: NOW + 1,
    });

    expect(result).toEqual({
      ok: true,
      transaction: {
        v: 1,
        state: STATE,
        callbackUri: CALLBACK_URI,
        returnTo: "/planner?draft=42#route",
        expiresAt: NOW + OAuth.stateTtlSeconds * 1000,
      },
    });
  });

  it("rejects missing, mismatched, expired, tampered, and cross-origin-bound state", () => {
    const cookieValue = transactionCookie();
    const base = {
      cookieValue,
      returnedState: STATE,
      callbackUri: CALLBACK_URI,
      secret: SECRET,
      nowMs: NOW,
    };

    expect(
      validateOAuthTransaction({ ...base, cookieValue: undefined })
    ).toEqual({ ok: false, reason: "missing" });
    expect(
      validateOAuthTransaction({
        ...base,
        returnedState: createOAuthState(() => new Uint8Array(32).fill(0x5a)),
      })
    ).toEqual({ ok: false, reason: "state_mismatch" });
    expect(
      validateOAuthTransaction({
        ...base,
        nowMs: NOW + OAuth.stateTtlSeconds * 1000,
      })
    ).toEqual({ ok: false, reason: "expired" });
    expect(
      validateOAuthTransaction({
        ...base,
        cookieValue: `${cookieValue.slice(0, -1)}x`,
      })
    ).toEqual({ ok: false, reason: "tampered" });
    expect(
      validateOAuthTransaction({
        ...base,
        callbackUri: "https://other.example/api/oauth/callback",
      })
    ).toEqual({ ok: false, reason: "callback_mismatch" });
  });
});

describe("OAuth callback and redirect policy", () => {
  it("derives the fixed callback path and upgrades public proxy requests", () => {
    expect(
      resolveOAuthCallbackUri(
        "http://atlas.example/api/oauth/start?returnTo=%2Fdna"
      )
    ).toBe(CALLBACK_URI);
    expect(
      resolveOAuthCallbackUri("http://localhost:3000/api/oauth/start")
    ).toBe("http://localhost:3000/api/oauth/callback");
    expect(
      resolveOAuthCallbackUri("http://atlas.example/api/oauth/start", {
        forwardedProto: "https, http",
      })
    ).toBe(CALLBACK_URI);
  });

  it("uses an exact configured callback and rejects unsafe callback URIs", () => {
    expect(
      resolveOAuthCallbackUri("http://localhost:3000/api/oauth/start", {
        configuredCallbackUri: CALLBACK_URI,
      })
    ).toBe(CALLBACK_URI);

    expect(() =>
      resolveOAuthCallbackUri("https://atlas.example/api/oauth/start", {
        configuredCallbackUri: "http://atlas.example/api/oauth/callback",
      })
    ).toThrow(/HTTPS/);
    expect(() =>
      resolveOAuthCallbackUri("https://atlas.example/api/oauth/start", {
        configuredCallbackUri:
          "https://atlas.example/api/oauth/callback?redirect=https://evil.example",
      })
    ).toThrow(/parameters/);
  });

  it("preserves only root-relative redirect paths", () => {
    expect(getSafeRedirectPath("/journey/alps?day=2#map")).toBe(
      "/journey/alps?day=2#map"
    );
    expect(getSafeRedirectPath("https://evil.example/steal")).toBe("/");
    expect(getSafeRedirectPath("//evil.example/steal")).toBe("/");
    expect(getSafeRedirectPath("/%2f%2fevil.example/steal")).toBe("/");
    expect(getSafeRedirectPath("/\\evil.example/steal")).toBe("/");
    expect(getSafeRedirectPath("/safe/..//evil.example/steal")).toBe("/");
  });
});

describe("OAuth nonce cookie policy", () => {
  it("is short-lived, HttpOnly, Lax, callback-scoped, and Secure on HTTPS", () => {
    expect(getOAuthStateCookieOptions(CALLBACK_URI)).toEqual({
      httpOnly: true,
      path: "/api/oauth/callback",
      sameSite: "Lax",
      secure: true,
      maxAge: 600,
    });
  });

  it("permits insecure cookies only on loopback development origins", () => {
    expect(
      getOAuthStateCookieOptions("http://localhost:3000/api/oauth/callback")
        .secure
    ).toBe(false);
    expect(
      getOAuthStateCookieOptions("http://127.0.0.1:3000/api/oauth/callback")
        .secure
    ).toBe(false);
    expect(
      getOAuthStateCookieOptions("http://atlas.example/api/oauth/callback")
        .secure
    ).toBe(true);
  });
});
