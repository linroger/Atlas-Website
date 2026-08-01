import { authRouter } from "./auth-router";
import { journeyRouter } from "./journey-router";
import { aiRouter } from "./ai-router";
import { plannerRouter, dnaRouter } from "./planner-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  journey: journeyRouter,
  ai: aiRouter,
  planner: plannerRouter,
  dna: dnaRouter,
});

export type AppRouter = typeof appRouter;
