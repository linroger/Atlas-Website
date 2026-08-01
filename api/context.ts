import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import type { AppError } from "@contracts/errors";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
  if (!cookies[Session.cookieName]) return ctx;

  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch (error) {
    if (!isAuthenticationError(error)) throw error;
    // An absent/invalid session is optional for public procedures.
  }
  return ctx;
}

function isAuthenticationError(error: unknown): error is AppError {
  if (!error || typeof error !== "object") return false;
  const candidate = error as Partial<AppError>;
  return (
    candidate.tag === "app_error" &&
    (candidate.status === 401 || candidate.status === 403)
  );
}
