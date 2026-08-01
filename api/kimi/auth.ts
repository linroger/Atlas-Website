import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import type { TokenResponse } from "./types";
import {
  OAuth,
  createOAuthState,
  createOAuthTransactionCookie,
  getOAuthStateCookieOptions,
  getSafeRedirectPath,
  resolveOAuthCallbackUri,
  validateOAuthTransaction,
} from "./oauth";

async function exchangeAuthCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

const jwks = jose.createRemoteJWKSet(
  new URL(`${env.kimiAuthUrl}/api/.well-known/jwks.json`)
);

async function verifyAccessToken(
  accessToken: string
): Promise<{ userId: string; clientId: string }> {
  const { payload } = await jose.jwtVerify(accessToken, jwks);
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  return { userId, clientId };
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

function getCallbackUri(c: Context): string {
  return resolveOAuthCallbackUri(c.req.url, {
    configuredCallbackUri: process.env.OAUTH_CALLBACK_URL,
    forwardedProto: c.req.header("x-forwarded-proto"),
  });
}

function preventOAuthResponseCaching(c: Context): void {
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");
  c.header("Referrer-Policy", "no-referrer");
}

export function createOAuthStartHandler() {
  return (c: Context) => {
    preventOAuthResponseCaching(c);

    try {
      const callbackUri = getCallbackUri(c);
      const state = createOAuthState();
      const returnTo = getSafeRedirectPath(c.req.query("returnTo"));
      const transactionCookie = createOAuthTransactionCookie({
        state,
        callbackUri,
        returnTo,
        secret: env.appSecret,
      });

      setCookie(
        c,
        OAuth.stateCookieName,
        transactionCookie,
        getOAuthStateCookieOptions(callbackUri)
      );

      const authorizationUrl = new URL(
        `${env.kimiAuthUrl.replace(/\/$/, "")}/api/oauth/authorize`
      );
      authorizationUrl.searchParams.set("client_id", env.appId);
      authorizationUrl.searchParams.set("redirect_uri", callbackUri);
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", "profile");
      authorizationUrl.searchParams.set("state", state);

      return c.redirect(authorizationUrl.toString(), 302);
    } catch (error) {
      console.error("[OAuth] Failed to start authorization", error);
      return c.json({ error: "OAuth authorization is unavailable" }, 500);
    }
  };
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    preventOAuthResponseCaching(c);

    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");
    const transactionCookie = getCookie(c, OAuth.stateCookieName);

    // Clear the browser-held transaction before doing any validation or I/O.
    // A callback can therefore consume a browser transaction only once, even
    // when token exchange or profile lookup later fails.
    deleteCookie(
      c,
      OAuth.stateCookieName,
      getOAuthStateCookieOptions(c.req.url)
    );

    let callbackUri: string;
    let transaction: ReturnType<typeof validateOAuthTransaction>;
    try {
      callbackUri = getCallbackUri(c);
      transaction = validateOAuthTransaction({
        cookieValue: transactionCookie,
        returnedState: state,
        callbackUri,
        secret: env.appSecret,
      });
    } catch (validationError) {
      console.error("[OAuth] State validation could not run", validationError);
      return c.json({ error: "OAuth callback is unavailable" }, 500);
    }

    if (!transaction.ok) {
      console.warn(`[OAuth] Rejected callback state: ${transaction.reason}`);
      return c.json({ error: "Invalid or expired OAuth state" }, 400);
    }

    if (error) {
      if (error === "access_denied") {
        return c.redirect(transaction.transaction.returnTo, 302);
      }
      return c.json({ error, error_description: errorDescription }, 400);
    }

    if (!code) {
      return c.json({ error: "code is required" }, 400);
    }

    try {
      const tokenResp = await exchangeAuthCode(code, callbackUri);
      const { userId } = await verifyAccessToken(tokenResp.access_token);
      const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
      if (!userProfile) {
        throw new Error("Failed to fetch user profile from Kimi Open");
      }

      await upsertUser({
        unionId: userId,
        name: userProfile.name,
        avatar: userProfile.avatar_url,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({
        unionId: userId,
        clientId: env.appId,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect(transaction.transaction.returnTo, 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
