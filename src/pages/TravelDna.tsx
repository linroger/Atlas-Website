import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useAiJob } from "@/hooks/useAiJob";
import JourneyCard from "@/components/JourneyCard";
import { AIBadge } from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dna,
  Globe2,
  MapPin,
  CalendarDays,
  Camera,
  Footprints,
  Route as RouteIcon,
  Sparkles,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function TravelDna() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { data, isLoading } = trpc.dna.mine.useQuery();
  const [dnaJob, setDnaJob] = useState<number | null>(null);
  const art = useAiJob(dnaJob);
  const startArt = trpc.ai.startDnaArt.useMutation({
    onSuccess: (d) => setDnaJob(d.jobId),
  });

  if (isLoading || !data) {
    return (
      <div className="bg-atlas-wash min-h-screen px-4 pt-28 sm:px-6">
        <div className="glass mx-auto h-72 max-w-4xl animate-pulse rounded-atlas-lg" />
      </div>
    );
  }

  const { stats, dna, journeys, replicatedJourneys } = data;
  const empty = journeys.length === 0 && replicatedJourneys.length === 0;

  return (
    <div className="bg-atlas-wash min-h-screen pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-28 sm:px-6">
        {/* identity card */}
        <div className="glass relative overflow-hidden rounded-atlas-lg">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[hsl(var(--atlas-lavender)/0.25)] blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[hsl(var(--atlas-peach)/0.25)] blur-3xl" />
          <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="bg-atlas-aurora text-xl font-bold text-white">
                    {(user?.name || "E").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    Travel DNA of
                  </p>
                  <h1 className="text-2xl font-extrabold tracking-tight">{user?.name || "Explorer"}</h1>
                </div>
              </div>

              <div className="mt-7">
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  <Dna className="h-4 w-4 text-[hsl(var(--atlas-lavender))]" /> Archetype
                </p>
                <h2 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">
                  <em className="text-atlas-gradient not-italic">{dna.archetype}</em>
                </h2>
                <p className="mt-2 text-lg font-semibold text-foreground/70">{dna.tagline}</p>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{dna.narrative}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {dna.traits.map((t) => (
                    <span key={t} className="chip glass-subtle text-foreground/70">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* DNA art */}
            <div className="md:col-span-2">
              <div className="glass-strong flex h-full min-h-64 flex-col overflow-hidden rounded-atlas">
                {art.url ? (
                  <img src={art.url} alt="AI Travel DNA art" className="h-full w-full flex-1 object-cover" />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-atlas-aurora text-white shadow-md">
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <p className="mt-4 font-extrabold">Your DNA, painted by AI</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      An image model renders your archetype into a shareable identity card.
                    </p>
                    {art.status === "running" || art.status === "queued" ? (
                      <div className="ai-shimmer mt-4 w-full rounded-xl p-3 text-xs font-bold text-foreground/60">
                        <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Painting your DNA…
                      </div>
                    ) : (
                      <button
                        onClick={() => startArt.mutate({ archetype: dna.archetype })}
                        disabled={startArt.isPending}
                        className="chip mt-4 bg-foreground px-5 py-2.5 text-background disabled:opacity-50"
                      >
                        {startArt.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : art.status === "failed" ? (
                          <RefreshCw className="h-3.5 w-3.5" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {art.status === "failed" ? "Retry" : "Generate DNA art"}
                      </button>
                    )}
                  </div>
                )}
                {art.url && (
                  <div className="flex items-center justify-between p-3">
                    <AIBadge label="AI-generated identity" />
                    <button
                      onClick={() => setDnaJob(null)}
                      className="chip glass-subtle text-foreground/60"
                    >
                      <RefreshCw className="h-3 w-3" /> New
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
          <StatTile icon={<Globe2 className="h-4 w-4" />} value={stats.countries} label="countries" />
          <StatTile icon={<MapPin className="h-4 w-4" />} value={stats.cities} label="destinations" />
          <StatTile icon={<CalendarDays className="h-4 w-4" />} value={stats.days} label="days away" />
          <StatTile icon={<Camera className="h-4 w-4" />} value={stats.photos} label="frames kept" />
          <StatTile icon={<Footprints className="h-4 w-4" />} value={stats.journeys} label="journeys" />
          <StatTile icon={<RouteIcon className="h-4 w-4" />} value={stats.replicated} label="routes lived" />
        </div>

        {/* empty state */}
        {empty && (
          <div className="glass mx-auto mt-10 max-w-lg rounded-atlas-lg p-10 text-center">
            <p className="font-display text-3xl">Your DNA is still a blank map</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Publish your first journey from vacation photos — or replicate someone
              else's route and live it. Every trip sharpens your archetype.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/create" className="chip bg-foreground px-5 py-2.5 text-background">
                <Plus className="h-4 w-4" /> Create a journey
              </Link>
              <Link to="/explore" className="chip glass px-5 py-2.5">Explore routes</Link>
            </div>
          </div>
        )}

        {/* journeys */}
        {journeys.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold tracking-tight">Your journeys</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {journeys.map((j) => (
                <JourneyCard key={j.id} journey={j} />
              ))}
            </div>
          </section>
        )}

        {replicatedJourneys.length > 0 && (
          <section className="mt-12">
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
              Routes you're living <AIBadge label="Replicated" />
            </h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {replicatedJourneys.map((j) => (
                <JourneyCard key={j.id} journey={j} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className={cn("glass rounded-atlas p-4 text-center")}>
      <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-foreground/60 shadow-sm">
        {icon}
      </span>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
