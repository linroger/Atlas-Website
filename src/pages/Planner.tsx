import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { AIBadge } from "@/components/Footer";
import { cn } from "@/lib/utils";
import {
  Map,
  Sparkles,
  Loader2,
  Sunrise,
  Sun,
  Moon,
  Lightbulb,
  Wallet,
  CalendarDays,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";

const VIBES = ["food", "culture", "nature", "nightlife", "slow", "adventure", "photography", "hidden gems"];

type Plan = {
  brief: string;
  days: {
    day: number;
    theme: string;
    morning: string;
    afternoon: string;
    evening: string;
    tip?: string;
  }[];
  tripId: number | null;
  places: string[];
  notes: string[];
  destination: string;
};

export default function Planner() {
  useAuth({ redirectOnUnauthenticated: true });
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [vibes, setVibes] = useState<string[]>(["food", "culture"]);
  const [budget, setBudget] = useState<"backpacker" | "comfort" | "luxury">("comfort");
  const [plan, setPlan] = useState<Plan | null>(null);

  const utils = trpc.useUtils();
  const { data: myTrips } = trpc.planner.list.useQuery();
  const removeTrip = trpc.planner.remove.useMutation({
    onSuccess: () => utils.planner.list.invalidate(),
  });

  const planTrip = trpc.ai.planTrip.useMutation({
    onSuccess: (data) => {
      setPlan({ ...data, destination });
      utils.planner.list.invalidate();
    },
  });

  return (
    <div className="bg-atlas-wash min-h-screen pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-28 sm:px-6">
        <div className="text-center">
          <AIBadge label="Conversational trip design" />
          <h1 className="font-display mt-3 text-balance text-5xl leading-tight">
            Tell Atlas <em className="text-atlas-gradient not-italic">where your heart points</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Real places from live research, shaped into a day-by-day plan that fits
            your mood and budget — ready to send to your glasses.
          </p>
        </div>

        {/* planner form */}
        <div className="glass mx-auto mt-10 max-w-3xl rounded-atlas-lg p-6 sm:p-8">
          <label className="text-sm font-bold text-foreground/70">Destination</label>
          <div className="glass-subtle mt-2 flex items-center gap-3 rounded-2xl px-4">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && destination && !planTrip.isPending && planTrip.mutate({ destination, days, vibes, budget })}
              placeholder="Kyoto, Iceland, Marrakech, Hoi An…"
              className="h-12 w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-foreground/70">
                <CalendarDays className="h-4 w-4" /> Days — {days}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-3 w-full accent-[hsl(var(--atlas-lavender))]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-foreground/70">
                <Wallet className="h-4 w-4" /> Budget
              </label>
              <div className="mt-2.5 flex rounded-full bg-white/60 p-1">
                {(["backpacker", "comfort", "luxury"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={cn(
                      "flex-1 rounded-full py-1.5 text-xs font-bold capitalize transition-colors",
                      budget === b ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="mt-5 block text-sm font-bold text-foreground/70">The vibe</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {VIBES.map((v) => {
              const on = vibes.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => setVibes((prev) => (on ? prev.filter((x) => x !== v) : [...prev, v]))}
                  className={cn(
                    "chip capitalize transition-colors",
                    on ? "bg-foreground text-background" : "glass-subtle text-foreground/65 hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>

          <button
            disabled={!destination || planTrip.isPending}
            onClick={() => planTrip.mutate({ destination, days, vibes, budget })}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition-transform enabled:hover:scale-[1.01] disabled:opacity-40"
          >
            {planTrip.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Atlas AI is researching {destination}…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Design my trip
              </>
            )}
          </button>
          {planTrip.isError && (
            <p className="mt-3 text-center text-sm font-semibold text-destructive">
              Planning hiccup — try again in a moment.
            </p>
          )}
        </div>

        {/* generated plan */}
        {plan && (
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="glass rounded-atlas-lg p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl">
                  {plan.days.length} days in {plan.destination}
                </h2>
                <AIBadge label="Saved to your trips" />
              </div>
              <p className="mt-3 leading-relaxed text-foreground/70">{plan.brief}</p>

              <div className="mt-6 space-y-4">
                {plan.days.map((d) => (
                  <div key={d.day} className="rounded-atlas bg-white/60 p-5">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                      Day {d.day}
                    </p>
                    <p className="font-display mt-0.5 text-xl">{d.theme}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <DaySlot icon={<Sunrise className="h-4 w-4 text-[hsl(var(--atlas-peach))]" />} label="Morning" text={d.morning} />
                      <DaySlot icon={<Sun className="h-4 w-4 text-[hsl(var(--atlas-sky))]" />} label="Afternoon" text={d.afternoon} />
                      <DaySlot icon={<Moon className="h-4 w-4 text-[hsl(var(--atlas-lavender))]" />} label="Evening" text={d.evening} />
                    </div>
                    {d.tip && (
                      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[hsl(var(--atlas-sky))]/10 p-3 text-xs font-semibold leading-relaxed text-foreground/70">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--atlas-sky))]" />
                        {d.tip}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {plan.places.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {plan.places.slice(0, 8).map((p) => (
                    <span key={p} className="chip glass-subtle text-foreground/60">
                      <MapPin className="h-3 w-3" /> {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* saved trips */}
        {myTrips && myTrips.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="flex items-center gap-2.5 text-xl font-extrabold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5">
                <Map className="h-4 w-4" />
              </span>
              Your planned trips
            </h2>
            <div className="mt-5 space-y-3">
              {myTrips.map((t) => (
                <SavedTrip key={t.id} trip={t} onRemove={() => removeTrip.mutate({ id: t.id })} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DaySlot({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{text}</p>
    </div>
  );
}

function SavedTrip({
  trip,
  onRemove,
}: {
  trip: {
    id: number;
    destination: string;
    daysCount: number;
    budget: string | null;
    vibes: string | null;
    brief: string | null;
    itinerary: unknown;
    createdAt: Date;
  };
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const days = Array.isArray(trip.itinerary) ? (trip.itinerary as Plan["days"]) : [];
  return (
    <div className="glass rounded-atlas p-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-atlas-aurora text-white">
            <MapPin className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-extrabold">{trip.destination}</span>
            <span className="block text-xs font-semibold text-muted-foreground">
              {trip.daysCount} days · {trip.budget} · {trip.vibes}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(!open)} className="rounded-full p-2 hover:bg-white/60">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onRemove} className="rounded-full p-2 text-destructive/70 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t border-foreground/5 pt-4">
          {trip.brief && <p className="text-sm leading-relaxed text-foreground/70">{trip.brief}</p>}
          {days.map((d) => (
            <div key={d.day} className="rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Day {d.day} — {d.theme}
              </p>
              <p className="mt-1 text-sm text-foreground/75">
                <strong>Morning:</strong> {d.morning}
              </p>
              <p className="text-sm text-foreground/75">
                <strong>Afternoon:</strong> {d.afternoon}
              </p>
              <p className="text-sm text-foreground/75">
                <strong>Evening:</strong> {d.evening}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
