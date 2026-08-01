import { Link } from "react-router";
import { AIBadge } from "@/components/Footer";
import {
  Navigation,
  ScanEye,
  BookOpenText,
  Clapperboard,
  CloudUpload,
  Star,
  ArrowRight,
  BatteryFull,
  Feather,
  Glasses as GlassesIcon,
  Wifi,
  Sparkles,
  Play,
} from "lucide-react";

export default function Glasses() {
  return (
    <div className="bg-atlas-wash">
      {/* hero */}
      <section className="relative overflow-hidden px-4 pt-32 sm:px-6">
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[hsl(var(--atlas-sky)/0.18)] blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-[hsl(var(--atlas-lavender)/0.2)] blur-3xl" />
        <div className="mx-auto max-w-6xl text-center">
          <AIBadge label="Atlas Lens · Gen 1" />
          <h1 className="font-display mx-auto mt-4 max-w-3xl text-balance text-5xl leading-[1.05] sm:text-7xl">
            The world, <em className="text-atlas-gradient not-italic">annotated</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance leading-relaxed text-muted-foreground">
            Featherweight AR glasses connected to large language models. They see
            what you see, record life first-person, and whisper the world's context
            right into your field of view.
          </p>
          <div className="relative mx-auto mt-6 max-w-3xl">
            <img
              src="/assets/product/glasses-hero.png"
              alt="Atlas Lens AR smart glasses"
              className="animate-float mx-auto w-full max-w-2xl drop-shadow-2xl"
            />
            <div className="glass chip absolute left-[12%] top-[30%] px-4 py-2 text-foreground/70 backdrop-blur-xl">
              <ScanEye className="h-3.5 w-3.5 text-[hsl(var(--atlas-sky))]" /> 12MP first-person camera
            </div>
            <div className="glass chip absolute right-[8%] top-[55%] px-4 py-2 text-foreground/70 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--atlas-lavender))]" /> Micro-LED waveguide AR
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link to="/create" className="rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.04]">
              Try the AI Studio
            </Link>
            <Link to="/explore" className="glass-strong rounded-full px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.04]">
              Watch journeys
            </Link>
          </div>
        </div>
      </section>

      {/* AR demo */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-center text-4xl leading-tight sm:text-5xl">
          See what the wearer sees
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Live AR cards layer navigation, merchant intel and narration over the real
          scene — captured here straight from the glasses.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* AR navigation + merchant */}
          <div className="glass overflow-hidden rounded-atlas-lg p-2">
            <div className="relative overflow-hidden rounded-[1.35rem]">
              <img src="/assets/gallery/tokyo-2.jpg" alt="Tokyo ramen alley" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute left-4 top-4 rounded-2xl bg-white/75 px-4 py-2.5 shadow-lg backdrop-blur-xl">
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground/80">
                  <Navigation className="h-3.5 w-3.5 text-[hsl(var(--atlas-sky))]" /> Ichiran Ramen · 120 m
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-amber-500">
                  <Star className="h-3 w-3 fill-current" /> 4.8 · 2,314 traveler videos
                </p>
                <span className="chip mt-2 bg-foreground/85 px-2.5 py-1 text-[10px] text-background">
                  <Play className="h-2.5 w-2.5" /> Watch Maya's clip
                </span>
              </div>
              <div className="absolute bottom-4 right-4 rounded-full bg-white/75 px-4 py-2 text-[11px] font-extrabold text-foreground/75 shadow-lg backdrop-blur-xl">
                Turn right in 30 m
              </div>
            </div>
            <div className="p-5">
              <p className="font-extrabold">Real-scene navigation & merchant recognition</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Look at a shopfront and Atlas shows its rating plus original videos shot
                by travelers inside — a real-scene local review platform.
              </p>
            </div>
          </div>

          {/* AR guided tour */}
          <div className="glass overflow-hidden rounded-atlas-lg p-2">
            <div className="relative overflow-hidden rounded-[1.35rem]">
              <img src="/assets/gallery/kyoto-1.jpg" alt="Arashiyama bamboo grove" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/75 p-4 shadow-lg backdrop-blur-xl">
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-foreground/80">
                  <BookOpenText className="h-3.5 w-3.5 text-[hsl(var(--atlas-lavender))]" /> Atlas Guide · Arashiyama
                </p>
                <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-foreground/65">
                  "These moso bamboo stalks grow a meter a month — this grove was
                  planted in the 14th century for the Tenryū-ji temple next door…"
                </p>
                <span className="chip mt-2 bg-[hsl(var(--atlas-lavender))]/20 px-2.5 py-1 text-[10px] text-foreground/70">
                  <Sparkles className="h-2.5 w-2.5" /> Generate immersive explainer video
                </span>
              </div>
            </div>
            <div className="p-5">
              <p className="font-extrabold">Real-time AI guided tours</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Historical narration as you walk, with immersive AI-generated explainer
                videos on demand — interactive, in any language.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* pipeline */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <PipelineCard
            icon={<Clapperboard className="h-5 w-5" />}
            step="01"
            title="All-day capture"
            body="First-person footage streams to your Atlas cloud. No phone, no vlogging rig — just live."
          />
          <PipelineCard
            icon={<CloudUpload className="h-5 w-5" />}
            step="02"
            title="Life traces accumulate"
            body="Every journey joins your private archive — routes, frames and moments that build your Travel DNA."
          />
          <PipelineCard
            icon={<Sparkles className="h-5 w-5" />}
            step="03"
            title="AI does the editing"
            body="Overnight, a video model cuts your day into a cinematic vlog with narration. Wake up to your own documentary."
          />
        </div>
      </section>

      {/* specs */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="glass overflow-hidden rounded-atlas-lg">
          <div className="grid items-center md:grid-cols-2">
            <div className="p-8 sm:p-12">
              <h2 className="font-display text-4xl leading-tight">Disappears on your face. <br />Never on a charge.</h2>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <Spec icon={<Feather className="h-5 w-5" />} value="38 g" label="featherweight frame" />
                <Spec icon={<BatteryFull className="h-5 w-5" />} value="14 h" label="all-day battery" />
                <Spec icon={<GlassesIcon className="h-5 w-5" />} value="25° FoV" label="waveguide display" />
                <Spec icon={<Wifi className="h-5 w-5" />} value="LLM-linked" label="cloud AI companion" />
              </div>
              <button className="mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.04]">
                Reserve Atlas Lens <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-xs text-muted-foreground">Concept preview — joining the waitlist requires no payment.</p>
            </div>
            <div className="relative min-h-72 bg-gradient-to-br from-[hsl(var(--atlas-sky)/0.12)] to-[hsl(var(--atlas-peach)/0.12)]">
              <img
                src="/assets/product/glasses-side.png"
                alt="Atlas Lens side profile"
                className="animate-float absolute inset-0 m-auto w-4/5 object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* agent strip */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-atlas-lg bg-foreground p-10 text-center text-background sm:p-14">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[hsl(var(--atlas-lavender)/0.35)] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-[hsl(var(--atlas-sky)/0.3)] blur-3xl" />
          <h2 className="font-display mx-auto max-w-2xl text-balance text-4xl leading-tight">
            “Atlas, book me a ryokan near the bamboo grove — and a table for two at eight.”
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            The AI agent schedules whole trips and handles one-tap booking of hotels,
            restaurants and venue tickets — straight from your glasses.
          </p>
          <Link to="/planner" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.04]">
            <Sparkles className="h-4 w-4" /> Plan a trip with the agent
          </Link>
        </div>
      </section>
    </div>
  );
}

function PipelineCard({
  icon,
  step,
  title,
  body,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="glass rounded-atlas p-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-atlas-aurora text-white shadow-md">
          {icon}
        </span>
        <span className="font-display text-3xl text-foreground/15">{step}</span>
      </div>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-foreground/60 shadow-sm">
        {icon}
      </span>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
