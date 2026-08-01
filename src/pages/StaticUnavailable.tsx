import { ArrowLeft, Compass, Server, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router";

export default function StaticUnavailable({ feature }: { feature?: string }) {
  const [searchParams] = useSearchParams();
  const requestedFeature = feature || searchParams.get("feature") || "This feature";

  return (
    <div className="bg-atlas-wash flex min-h-screen items-center justify-center px-4 pb-20 pt-28 sm:px-6">
      <section className="glass-strong relative max-w-2xl overflow-hidden rounded-atlas-lg p-8 text-center sm:p-12">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[hsl(var(--atlas-lavender)/0.18)] blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-[hsl(var(--atlas-sky)/0.18)] blur-3xl" />
        <span className="bg-atlas-aurora relative mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md">
          <Server className="h-6 w-6" />
        </span>
        <p className="relative mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-foreground/45">
          Read-only GitHub Pages demo
        </p>
        <h1 className="font-display relative mt-3 text-balance text-4xl leading-tight sm:text-5xl">
          Interactive features require the Atlas backend
        </h1>
        <p className="relative mx-auto mt-5 max-w-lg leading-relaxed text-muted-foreground">
          <strong className="text-foreground">{requestedFeature}</strong> uses Atlas services for
          accounts, saved trips, or AI generation. This public demo deliberately ships without
          credentials, private data, or a server, so those actions are unavailable here.
        </p>
        <p className="relative mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          You can still browse the embedded journey catalog, open every route, watch the local
          Tokyo film, and explore the complete read-only experience.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.03]"
          >
            <Compass className="h-4 w-4" /> Browse demo journeys
          </Link>
          <Link
            to="/"
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.03]"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas home
          </Link>
        </div>
        <span className="chip glass-subtle relative mt-7 text-foreground/55">
          <Sparkles className="h-3 w-3" /> No request was sent to an API
        </span>
      </section>
    </div>
  );
}
