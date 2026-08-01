import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import JourneyCard from "@/components/JourneyCard";
import { AIBadge } from "@/components/Footer";
import {
  filterDemoJourneys,
  type JourneyCardData,
} from "@/data/demoJourneys";
import { IS_STATIC_DEMO, publicAssetUrl } from "@/lib/staticDemo";
import {
  ArrowRight,
  Clapperboard,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Play,
  ScanEye,
  Smartphone,
  Globe,
  Dna,
  Sparkles,
  Wand2,
  Route,
  BookOpenText,
} from "lucide-react";

const AI_TICKER = [
  "AI trip film rendering",
  "Photo → location intelligence",
  "AR merchant recognition",
  "One-click route replication",
  "AI travel journal",
  "Real-time guided narration",
  "AI banner generation",
  "Personal Travel DNA",
];

export default function Home() {
  return IS_STATIC_DEMO ? (
    <HomeContent featured={filterDemoJourneys({ featured: true, limit: 3 })} />
  ) : (
    <LiveHome />
  );
}

function LiveHome() {
  const { data: featured } = trpc.journey.list.useQuery({ featured: true, limit: 6 });

  return <HomeContent featured={featured} isLoading={!featured} />;
}

function HomeContent({
  featured,
  isLoading = false,
}: {
  featured?: JourneyCardData[];
  isLoading?: boolean;
}) {

  return (
    <div className="bg-atlas-wash">
      {/* ── Cinematic hero ─────────────────────────────────── */}
      <section className="video-vignette relative h-[100svh] min-h-[640px] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={publicAssetUrl("/assets/atlas-film-tokyo.mp4")}
          poster={publicAssetUrl("/assets/hero-poster.jpg")}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <div className="glass-strong animate-fade-up max-w-3xl rounded-atlas-lg px-6 py-10 sm:px-12 sm:py-14">
            <AIBadge label="AR glasses × AI × community" />
            <h1 className="font-display mt-5 text-balance text-5xl leading-[1.05] sm:text-7xl">
              See the world through{" "}
              <em className="text-atlas-gradient not-italic">each other's eyes</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-foreground/65 sm:text-lg">
              Atlas glasses record life first-person. Atlas AI turns it into films,
              stories and routes. The community lets you live someone else's journey —
              then replicate it with one tap.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.04]"
              >
                Explore journeys <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/create"
                className="glass-strong inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.04]"
              >
                <Sparkles className="h-4 w-4 text-[hsl(var(--atlas-lavender))]" />
                Create with AI
              </Link>
            </div>
          </div>

          {/* AI capability ticker */}
          <div className="absolute inset-x-0 bottom-8 overflow-hidden">
            <div className="animate-ticker flex w-max gap-3">
              {[...AI_TICKER, ...AI_TICKER].map((t, i) => (
                <span key={i} className="glass chip whitespace-nowrap px-4 py-2 text-foreground/70">
                  <Sparkles className="h-3 w-3 text-[hsl(var(--atlas-sky))]" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Product ecosystem trio ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionHeading
          kicker="The ecosystem"
          title="One journey, three surfaces"
          body="Capture on glasses, relive on mobile, share with the world on web. Every surface is wired to the same AI companion."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="glass group relative overflow-hidden rounded-atlas-lg p-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[hsl(var(--atlas-sky)/0.15)] blur-2xl" />
            <img
              src={publicAssetUrl("/assets/product/glasses-hero.png")}
              alt="Atlas Lens AR glasses"
              className="animate-float mx-auto h-40 object-contain drop-shadow-xl"
            />
            <h3 className="font-display mt-6 text-2xl">Atlas Lens</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Featherweight AR glasses with a first-person camera, waveguide display
              and an always-with-you AI that sees what you see.
            </p>
            <Link to="/glasses" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground/80 hover:text-foreground">
              Meet the hardware <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass relative overflow-hidden rounded-atlas-lg p-7">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[hsl(var(--atlas-peach)/0.18)] blur-2xl" />
            <div className="mx-auto flex h-40 items-center justify-center">
              <div className="glass-strong w-44 rounded-[2rem] p-3 shadow-lift">
                <div className="rounded-[1.5rem] bg-gradient-to-b from-[hsl(var(--atlas-sky)/0.25)] to-[hsl(var(--atlas-lavender)/0.25)] p-3">
                  <Smartphone className="mx-auto h-6 w-6 text-foreground/60" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 w-3/4 rounded-full bg-white/80" />
                    <div className="h-2 w-1/2 rounded-full bg-white/60" />
                    <div className="h-8 rounded-xl bg-white/70" />
                    <div className="h-2 w-2/3 rounded-full bg-white/60" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="font-display mt-6 text-2xl">Atlas Mobile</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your footage lands here in seconds. Auto-vlogs, trip timelines and the
              AI planner live in your pocket.
            </p>
            <span className="chip glass-subtle mt-4 text-foreground/60">iOS & Android</span>
          </div>

          <div className="glass relative overflow-hidden rounded-atlas-lg p-7">
            <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[hsl(var(--atlas-lavender)/0.2)] blur-2xl" />
            <div className="mx-auto flex h-40 items-center justify-center">
              <div className="glass-strong w-56 rounded-2xl p-3 shadow-lift">
                <div className="flex gap-1 pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[hsl(var(--atlas-peach)/0.25)] to-[hsl(var(--atlas-sky)/0.25)] p-3">
                  <Globe className="mx-auto h-6 w-6 text-foreground/60" />
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <div className="h-8 rounded-md bg-white/70" />
                    <div className="h-8 rounded-md bg-white/70" />
                    <div className="h-8 rounded-md bg-white/70" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="font-display mt-6 text-2xl">Atlas Web</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The public journey community. Watch first-person chapters, replicate
              routes, and let AI write the trip you took.
            </p>
            <Link to="/explore" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-foreground/80 hover:text-foreground">
              Open the community <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI wired throughout ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionHeading
          kicker="AI throughout"
          title="An AI companion at every step"
          body="Not a chatbot bolted on — Atlas AI is threaded through capture, planning, storytelling and memory."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AiFeatureCard
            icon={<Clapperboard className="h-5 w-5" />}
            hue="sky"
            title="Photos → AI trip film"
            body="Upload vacation photos; a video model renders a cinematic film of your trip in minutes."
            to="/create"
            cta="Make a film"
          />
          <AiFeatureCard
            icon={<ScanEye className="h-5 w-5" />}
            hue="lavender"
            title="Image intelligence"
            body="Atlas reads your photos — GPS, landmarks, trip window — then writes the story with notes on every attraction."
            to="/create"
            cta="Try the studio"
          />
          <AiFeatureCard
            icon={<Navigation className="h-5 w-5" />}
            hue="peach"
            title="AR guided tours"
            body="On the glasses: real-scene navigation, merchant recognition with ratings, and narrated history as you walk."
            to="/glasses"
            cta="See it in AR"
          />
          <AiFeatureCard
            icon={<Dna className="h-5 w-5" />}
            hue="mint"
            title="Travel DNA"
            body="Every trip compounds into a private visual identity — your archetype, your map, your life traces."
            to="/dna"
            cta="View your DNA"
          />
        </div>
      </section>

      {/* ── Community preview ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            kicker="The community"
            title="Journeys, lived first-person"
            body="Real travelers, real footage, AI-retold. Watch a life — then borrow the route."
            align="left"
          />
          <Link
            to="/explore"
            className="glass hidden shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold sm:inline-flex"
          >
            All journeys <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(featured || []).slice(0, 3).map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
        {isLoading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass h-80 animate-pulse rounded-atlas" />
            ))}
          </div>
        )}
      </section>

      {/* ── How a journey plays ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="glass relative overflow-hidden rounded-atlas-lg">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-72 overflow-hidden">
              <img
                src={publicAssetUrl("/assets/hero-poster.jpg")}
                alt="Tokyo sunset through Atlas glasses"
                className="animate-ken-burns absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
              <Link
                to="/journey/48-hours-in-tokyo"
                className="glass-strong absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
              >
                <Play className="h-4 w-4" /> Play this journey
              </Link>
            </div>
            <div className="p-8 sm:p-12">
              <AIBadge />
              <h3 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">
                “Best sunset begins in <em className="text-atlas-gradient not-italic">18 minutes</em>”
              </h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Mid-journey, the glasses surfaced a quiet AR card over Tokyo — computed
                from Maya's route, the weather and the sun's angle. She made the
                viewpoint with minutes to spare. That moment became the closing shot
                of her AI-generated film.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-semibold">
                <li className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-[hsl(var(--atlas-sky))]" /> Synchronized chapters with place context
                </li>
                <li className="flex items-center gap-2.5">
                  <Route className="h-4 w-4 text-[hsl(var(--atlas-lavender))]" /> An editable, replicable route
                </li>
                <li className="flex items-center gap-2.5">
                  <BookOpenText className="h-4 w-4 text-[hsl(var(--atlas-peach))]" /> AI journal with landmark notes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA band ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="relative overflow-hidden rounded-atlas-lg bg-foreground p-10 text-center text-background sm:p-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[hsl(var(--atlas-sky)/0.3)] blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[hsl(var(--atlas-peach)/0.3)] blur-3xl" />
          <Wand2 className="mx-auto h-8 w-8 text-[hsl(var(--atlas-lavender))]" />
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-balance text-4xl leading-tight sm:text-5xl">
            Your next trip is already a film. Let Atlas shoot it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            Upload last vacation's photos and watch Atlas AI locate them, write the
            story, paint a banner and render your trip film.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-transform hover:scale-[1.04]"
          >
            <ImageIcon className="h-4 w-4" /> Open the AI Studio
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  body,
  align = "center",
}: {
  kicker: string;
  title: string;
  body: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground/45">{kicker}</p>
      <h2 className="font-display mt-3 text-balance text-4xl leading-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 text-balance leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

const HUES: Record<string, string> = {
  sky: "hsl(var(--atlas-sky))",
  lavender: "hsl(var(--atlas-lavender))",
  peach: "hsl(var(--atlas-peach))",
  mint: "hsl(var(--atlas-mint))",
};

function AiFeatureCard({
  icon,
  hue,
  title,
  body,
  to,
  cta,
}: {
  icon: React.ReactNode;
  hue: string;
  title: string;
  body: string;
  to: string;
  cta: string;
}) {
  return (
    <Link to={to} className="glass group rounded-atlas p-6 transition-transform hover:-translate-y-1.5">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md"
        style={{ background: HUES[hue] }}
      >
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: HUES[hue] }}>
        {cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
