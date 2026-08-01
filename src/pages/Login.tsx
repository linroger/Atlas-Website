import { AtlasLogo } from "@/components/Nav";
import { Sparkles, Globe2, Clapperboard, Route } from "lucide-react";

function getOAuthStartUrl() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  if (!returnTo) {
    return "/api/oauth/start";
  }

  const query = new URLSearchParams({ returnTo });
  return `/api/oauth/start?${query.toString()}`;
}

export default function Login() {
  return (
    <div className="bg-atlas-wash flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="glass-strong w-full max-w-md rounded-atlas-lg p-8 text-center sm:p-10">
        <div className="flex justify-center">
          <AtlasLogo className="scale-125" />
        </div>
        <h1 className="font-display mt-6 text-4xl">Your journeys, your DNA</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in to publish journeys, render AI trip films, plan with the agent
          and grow your Travel DNA.
        </p>

        <a
          href={getOAuthStartUrl()}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" /> Sign in with Kimi
        </a>

        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          <Perk
            icon={<Globe2 className="h-4 w-4" />}
            label="Journey community"
          />
          <Perk
            icon={<Clapperboard className="h-4 w-4" />}
            label="AI trip films"
          />
          <Perk
            icon={<Route className="h-4 w-4" />}
            label="Route replication"
          />
        </div>
      </div>
    </div>
  );
}

function Perk({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="glass-subtle rounded-2xl p-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 text-foreground/60">
        {icon}
      </span>
      <p className="mt-2 text-xs font-bold leading-tight text-foreground/70">
        {label}
      </p>
    </div>
  );
}
