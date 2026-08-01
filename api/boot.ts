import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import {
  authenticateRequest,
  createOAuthCallbackHandler,
  createOAuthStartHandler,
} from "./kimi/auth";
import { OAuth } from "./kimi/oauth";
import { signStorageUrl } from "./ai/gateway";
import { verifyMediaCapability } from "./ai/media";
import { Paths } from "@contracts/constants";
import { getDb } from "./queries/connection";
import { journeys, journeyPhotos } from "@db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(OAuth.startPath, createOAuthStartHandler());
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Unsaved uploads require a short-lived capability bound to the current user.
app.get("/api/media/private/:capability", async c => {
  let fileId: string;
  try {
    const user = await authenticateRequest(c.req.raw.headers);
    fileId = verifyMediaCapability(c.req.param("capability"), user.id);
  } catch {
    // Collapse authentication and authorization failures to avoid revealing
    // whether a gateway object or upload capability exists.
    return c.json({ error: "media not found" }, 404);
  }
  const url = await signStorageUrl(fileId);
  if (!url) return c.json({ error: "media not found" }, 404);
  return c.redirect(url, 302);
});

// Published photos may be viewed without signing in, but only while their
// database association and parent journey still exist. Arbitrary gateway ids
// and stale links from deleted journeys are never passed to the signer.
app.get("/api/media/:fileId", async c => {
  const fileId = c.req.param("fileId");
  if (!fileId || fileId.length > 191) {
    return c.json({ error: "media not found" }, 404);
  }
  const [publishedPhoto] = await getDb()
    .select({ id: journeyPhotos.id })
    .from(journeyPhotos)
    .innerJoin(journeys, eq(journeys.id, journeyPhotos.journeyId))
    .where(eq(journeyPhotos.fileId, fileId))
    .limit(1);
  if (!publishedPhoto) return c.json({ error: "media not found" }, 404);
  const url = await signStorageUrl(fileId);
  if (!url) return c.json({ error: "media not found" }, 404);
  return c.redirect(url, 302);
});
app.use("/api/trpc/*", async c => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", c => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
