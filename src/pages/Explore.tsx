import { useState } from "react";
import { trpc } from "@/providers/trpc";
import JourneyCard from "@/components/JourneyCard";
import { Search, Compass, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router";
import {
  DEMO_MOODS,
  filterDemoJourneys,
  type JourneyCardData,
} from "@/data/demoJourneys";
import { IS_STATIC_DEMO } from "@/lib/staticDemo";

export default function Explore() {
  return IS_STATIC_DEMO ? <StaticExplore /> : <LiveExplore />;
}

function StaticExplore() {
  const [q, setQ] = useState("");
  const [mood, setMood] = useState("all");

  return (
    <ExploreContent
      q={q}
      mood={mood}
      moods={DEMO_MOODS}
      journeys={filterDemoJourneys({ q, mood, limit: 24 })}
      isLoading={false}
      onQueryChange={setQ}
      onMoodChange={setMood}
    />
  );
}

function LiveExplore() {
  const [q, setQ] = useState("");
  const [mood, setMood] = useState("all");
  const { data: moods } = trpc.journey.moods.useQuery();
  const { data: journeys, isLoading } = trpc.journey.list.useQuery({
    q: q || undefined,
    mood,
    limit: 24,
  });

  return (
    <ExploreContent
      q={q}
      mood={mood}
      moods={moods}
      journeys={journeys}
      isLoading={isLoading}
      onQueryChange={setQ}
      onMoodChange={setMood}
    />
  );
}

function ExploreContent({
  q,
  mood,
  moods,
  journeys,
  isLoading,
  onQueryChange,
  onMoodChange,
}: {
  q: string;
  mood: string;
  moods?: string[];
  journeys?: JourneyCardData[];
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onMoodChange: (value: string) => void;
}) {

  return (
    <div className="bg-atlas-wash min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-28 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground/45">
            <Compass className="mr-1 inline h-3.5 w-3.5" /> Visual experience discovery
          </p>
          <h1 className="font-display mt-3 text-balance text-5xl leading-tight">
            Journeys you can <em className="text-atlas-gradient not-italic">step into</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            No star ratings, no listicles — real first-person trips with footage,
            photos, routes and AI-retold stories. See a destination before you go.
          </p>
        </div>

        {/* search + moods */}
        <div className="glass mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full p-2 pl-5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search destinations, journeys, feelings…"
            className="h-9 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["all", ...(moods || [])].map((m) => (
            <button
              key={m}
              onClick={() => onMoodChange(m)}
              className={cn(
                "chip capitalize transition-all",
                mood === m
                  ? "bg-foreground text-background"
                  : "glass text-foreground/65 hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* grid */}
        <div className="mt-10 grid gap-6 pb-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-80 animate-pulse rounded-atlas" />
            ))}
          {journeys?.map((j) => <JourneyCard key={j.id} journey={j} />)}
        </div>

        {journeys?.length === 0 && (
          <div className="glass mx-auto max-w-md rounded-atlas p-10 text-center">
            <p className="font-display text-2xl">No journeys found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another mood — or be the first to publish one.
            </p>
            <Link
              to="/create"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
            >
              <Sparkles className="h-4 w-4" /> Create with AI
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
