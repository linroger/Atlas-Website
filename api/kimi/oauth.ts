import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions } from "hono/utils/cookie";
import { Paths } from "@contracts/constants";

const OAUTH_STATE_BYTES = 32;
const OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_TRANSACTION_COOKIE_LENGTH = 4096;
const SAFE_REDIRECT_BASE = "https://atlas.invalid";

export const OAuth = {
  startPath: "/api/oauth/start",
  stateCookieName: "atlas_oauth_state",
  stateTtlSeconds: 10 * 60,
} as const;

type RandomBytesSource = (size: number) => Uint8Array;

type OAuthTransaction = {
  v: 1;
  state: string;
  callbackUri: string;
  returnTo: string;
  expiresAt: number;
};

export type OAuthTransactionValidation =
  | { ok: true; transaction: OAuthTransaction }
  | {
      ok: false;
      reason:
        | "missing"
        | "malformed"
        | "tampered"
        | "state_mismatch"
        | "callback_mismatch"
        | "expired";
    };

type ResolveCallbackOptions = {
  configuredCallbackUri?: string | null;
  forwardedProto?: string | null;
};

type CreateTransactionOptions = {
  state: string;
  callbackUri: string;
  returnTo?: string | null;
  secret: string;
  nowMs?: number;
};

type ValidateTransactionOptions = {
  cookieValue?: string | null;
  returnedState?: string | null;
  callbackUri: string;
  secret: string;
  nowMs?: number;
};

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function requireSecret(secret: string): void {
  if (!secret) {
    throw new Error("APP_SECRET is required for OAuth state protection");
  }
}

function containsControlCharacters(value: string): boolean {
  return Array.from(value).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
}

function signatureFor(payload: string, secret: string): string {
  requireSecret(secret);
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function normalizeCallbackUri(callbackUri: string): string {
  let parsed: URL;
  try {
    parsed = new URL(callbackUri);
  } catch {
    throw new Error("OAuth callback URI must be an absolute URL");
  }

  const isLocalHttp =
    parsed.protocol === "http:" && isLoopbackHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLocalHttp) {
    throw new Error("OAuth callback URI must use HTTPS outside localhost");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(
      "OAuth callback URI cannot contain credentials or parameters"
    );
  }
  if (parsed.pathname !== Paths.oauthCallback) {
    throw new Error(`OAuth callback URI must use ${Paths.oauthCallback}`);
  }

  return `${parsed.origin}${Paths.oauthCallback}`;
}

/**
 * Builds the one callback URI the server will use for both authorization and
 * token exchange. A configured URI is an exact allowlist entry. Otherwise the
 * URI is derived from the current request origin and the fixed callback path.
 */
export function resolveOAuthCallbackUri(
  requestUrl: string,
  options: ResolveCallbackOptions = {}
): string {
  const configured = options.configuredCallbackUri?.trim();
  if (configured) {
    return normalizeCallbackUri(configured);
  }

  const request = new URL(requestUrl);
  if (request.username || request.password) {
    throw new Error("OAuth request URL cannot contain credentials");
  }

  const forwardedProto = options.forwardedProto
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  const publicProtocol =
    request.protocol === "https:" || forwardedProto === "https"
      ? "https:"
      : isLoopbackHostname(request.hostname)
        ? "http:"
        : "https:";

  return normalizeCallbackUri(
    `${publicProtocol}//${request.host}${Paths.oauthCallback}`
  );
}

/** Only same-origin, root-relative application paths may survive login. */
export function getSafeRedirectPath(candidate?: string | null): string {
  if (!candidate || candidate.length > 2048) {
    return "/";
  }
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    containsControlCharacters(candidate)
  ) {
    return "/";
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return "/";
  }
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    containsControlCharacters(decoded)
  ) {
    return "/";
  }

  const parsed = new URL(candidate, SAFE_REDIRECT_BASE);
  if (parsed.origin !== SAFE_REDIRECT_BASE) {
    return "/";
  }
  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (normalized.startsWith("//") || normalized.includes("\\")) {
    return "/";
  }
  return normalized;
}

export function getOAuthStateCookieOptions(requestUrl: string): CookieOptions {
  const request = new URL(requestUrl);
  return {
    httpOnly: true,
    path: Paths.oauthCallback,
    sameSite: "Lax",
    secure:
      request.protocol === "https:" || !isLoopbackHostname(request.hostname),
    maxAge: OAuth.stateTtlSeconds,
  };
}

export function createOAuthState(
  getRandomBytes: RandomBytesSource = size => randomBytes(size)
): string {
  const bytes = getRandomBytes(OAUTH_STATE_BYTES);
  if (bytes.byteLength !== OAUTH_STATE_BYTES) {
    throw new Error(
      `OAuth state source must return ${OAUTH_STATE_BYTES} bytes`
    );
  }
  return Buffer.from(bytes).toString("base64url");
}

export function createOAuthTransactionCookie({
  state,
  callbackUri,
  returnTo,
  secret,
  nowMs = Date.now(),
}: CreateTransactionOptions): string {
  if (!OAUTH_STATE_PATTERN.test(state)) {
    throw new Error("OAuth state must contain 256 bits of base64url entropy");
  }

  const transaction: OAuthTransaction = {
    v: 1,
    state,
    callbackUri: normalizeCallbackUri(callbackUri),
    returnTo: getSafeRedirectPath(returnTo),
    expiresAt: nowMs + OAuth.stateTtlSeconds * 1000,
  };
  const payload = Buffer.from(JSON.stringify(transaction), "utf8").toString(
    "base64url"
  );
  return `${payload}.${signatureFor(payload, secret)}`;
}

function parseTransaction(
  cookieValue: string,
  secret: string
): OAuthTransactionValidation {
  if (cookieValue.length > MAX_TRANSACTION_COOKIE_LENGTH) {
    return { ok: false, reason: "malformed" };
  }
  const pieces = cookieValue.split(".");
  if (pieces.length !== 2 || !pieces[0] || !pieces[1]) {
    return { ok: false, reason: "malformed" };
  }

  const [payload, signature] = pieces;
  const expectedSignature = signatureFor(payload, secret);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { ok: false, reason: "tampered" };
  }

  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!value || typeof value !== "object") {
    return { ok: false, reason: "malformed" };
  }

  const transaction = value as Partial<OAuthTransaction>;
  if (
    transaction.v !== 1 ||
    typeof transaction.state !== "string" ||
    !OAUTH_STATE_PATTERN.test(transaction.state) ||
    typeof transaction.callbackUri !== "string" ||
    typeof transaction.returnTo !== "string" ||
    getSafeRedirectPath(transaction.returnTo) !== transaction.returnTo ||
    !Number.isSafeInteger(transaction.expiresAt)
  ) {
    return { ok: false, reason: "malformed" };
  }

  try {
    if (
      normalizeCallbackUri(transaction.callbackUri) !== transaction.callbackUri
    ) {
      return { ok: false, reason: "malformed" };
    }
  } catch {
    return { ok: false, reason: "malformed" };
  }

  return { ok: true, transaction: transaction as OAuthTransaction };
}

export function validateOAuthTransaction({
  cookieValue,
  returnedState,
  callbackUri,
  secret,
  nowMs = Date.now(),
}: ValidateTransactionOptions): OAuthTransactionValidation {
  if (!cookieValue || !returnedState) {
    return { ok: false, reason: "missing" };
  }

  const parsed = parseTransaction(cookieValue, secret);
  if (!parsed.ok) {
    return parsed;
  }
  if (!constantTimeEqual(parsed.transaction.state, returnedState)) {
    return { ok: false, reason: "state_mismatch" };
  }
  if (parsed.transaction.callbackUri !== normalizeCallbackUri(callbackUri)) {
    return { ok: false, reason: "callback_mismatch" };
  }
  if (nowMs >= parsed.transaction.expiresAt) {
    return { ok: false, reason: "expired" };
  }

  return parsed;
}
