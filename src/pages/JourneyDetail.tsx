import { useParams, Link, useLocation, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import RouteMap from "@/components/RouteMap";
import { AIBadge } from "@/components/Footer";
import { dayColor, moodHue } from "@/lib/journeyStyles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Route as RouteIcon,
  Play,
  Sparkles,
  MapPin,
  CalendarDays,
  Footprints,
  Camera,
  Volume2,
  ArrowLeft,
  Eye,
  Landmark,
  BookOpenText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { LOGIN_PATH } from "@/const";
import { findDemoJourney, type JourneyDetailData } from "@/data/demoJourneys";
import {
  backendFeaturePath,
  IS_STATIC_DEMO,
  publicAssetUrl,
} from "@/lib/staticDemo";
import { loginRedirectWithReturnTo } from "@/lib/authRedirect";

export default function JourneyDetail() {
  return IS_STATIC_DEMO ? <StaticJourneyDetail /> : <LiveJourneyDetail />;
}

function StaticJourneyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const journey = findDemoJourney(slug || "");

  if (!journey) return <JourneyNotFound />;

  return (
    <JourneyDetailContent
      journey={journey}
      onLike={() => navigate(backendFeaturePath("Journey likes and accounts"))}
      onReplicate={() =>
        navigate(backendFeaturePath("Route replication and saved trips"))
      }
    />
  );
}

function LiveJourneyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: j, isLoading } = trpc.journey.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: Boolean(slug) }
  );
  const utils = trpc.useUtils();
  const like = trpc.journey.toggleLike.useMutation({
    onSuccess: () => utils.journey.bySlug.invalidate({ slug: slug || "" }),
  });
  const replicate = trpc.journey.replicateRoute.useMutation({
    onSuccess: () => utils.journey.bySlug.invalidate({ slug: slug || "" }),
  });

  if (isLoading) {
    return (
      <div className="bg-atlas-wash min-h-screen px-4 pt-28 sm:px-6">
        <div className="glass mx-auto h-[60vh] max-w-6xl animate-pulse rounded-atlas-lg" />
      </div>
    );
  }
  if (!j) return <JourneyNotFound />;

  const requireAuth = (fn: () => void) => () => {
    if (!user) {
      navigate(loginRedirectWithReturnTo(LOGIN_PATH, location));
    } else fn();
  };

  return (
    <JourneyDetailContent
      journey={j}
      onLike={requireAuth(() => like.mutate({ journeyId: j.id }))}
      onReplicate={requireAuth(() => replicate.mutate({ journeyId: j.id }))}
    />
  );
}

function JourneyNotFound() {
  return (
    <div className="bg-atlas-wash flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-atlas p-10 text-center">
        <p className="font-display text-3xl">Journey not found</p>
        <Link
          to="/explore"
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Explore
        </Link>
      </div>
    </div>
  );
}

function JourneyDetailContent({
  journey: j,
  onLike,
  onReplicate,
}: {
  journey: JourneyDetailData;
  onLike: () => void;
  onReplicate: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingNarration, setPlayingNarration] = useState(false);

  const toggleNarration = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playingNarration) el.pause();
    else el.play();
    setPlayingNarration(!playingNarration);
  };

  const days = [...new Set(j.stops.map(stop => stop.day))].sort(
    (a, b) => a - b
  );

  return (
    <div className="bg-atlas-wash min-h-screen">
      {/* hero */}
      <section className="relative">
        <div className="relative h-[62vh] min-h-[420px] overflow-hidden">
          <img
            src={publicAssetUrl(
              j.bannerUrl || j.coverUrl || "/assets/hero-poster.jpg"
            )}
            alt={j.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,33%,98%)] via-transparent to-black/20" />
          {j.bannerUrl && (
            <span className="chip glass-strong absolute right-4 top-24 text-foreground/70 sm:right-6">
              <Sparkles className="h-3 w-3 text-[hsl(var(--atlas-lavender))]" />{" "}
              AI-painted banner
            </span>
          )}
        </div>

        <div className="mx-auto -mt-40 max-w-5xl px-4 sm:px-6">
          <div className="glass-strong relative rounded-atlas-lg p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="chip capitalize"
                style={{
                  background: `${moodHue(j.mood)}22`,
                  color: moodHue(j.mood),
                }}
              >
                ● {j.mood}
              </span>
              <AIBadge label="AI-retold journey" />
              {j.videoUrl && (
                <span className="chip bg-foreground/85 text-background">
                  <Play className="h-3 w-3" /> AI trip film
                </span>
              )}
            </div>
            <h1 className="font-display mt-4 text-balance text-4xl leading-tight sm:text-5xl">
              {j.title}
            </h1>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {j.destination} · {j.country}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                  <AvatarImage
                    src={
                      j.authorAvatar
                        ? publicAssetUrl(j.authorAvatar)
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-atlas-aurora font-bold text-white">
                    {(j.authorName || "A").slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">
                    {j.authorName || "Atlas Explorer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {j.daysCount} day{j.daysCount > 1 ? "s" : ""} ·{" "}
                    {j.photosCount} frames · {j.distanceKm} km
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ActionButton
                  active={j.likedByMe}
                  onClick={onLike}
                  icon={
                    <Heart
                      className={cn("h-4 w-4", j.likedByMe && "fill-current")}
                    />
                  }
                  label={String(j.likesCount)}
                />
                <ActionButton
                  active={j.replicatedByMe}
                  onClick={onReplicate}
                  icon={<RouteIcon className="h-4 w-4" />}
                  label={
                    j.replicatedByMe ? "Route replicated" : "Replicate route"
                  }
                  strong
                />
                {j.narrationUrl && (
                  <ActionButton
                    active={playingNarration}
                    onClick={toggleNarration}
                    icon={<Volume2 className="h-4 w-4" />}
                    label={playingNarration ? "Pause AI voice" : "AI narration"}
                  />
                )}
                <span className="chip glass-subtle text-muted-foreground">
                  <Eye className="h-3 w-3" /> {j.viewsCount.toLocaleString()}
                </span>
              </div>
            </div>
            {j.narrationUrl && (
              <audio
                ref={audioRef}
                src={publicAssetUrl(j.narrationUrl)}
                onEnded={() => setPlayingNarration(false)}
                className="hidden"
              />
            )}
          </div>
        </div>
      </section>

      {/* AI film */}
      {j.videoUrl && (
        <section className="mx-auto mt-12 max-w-5xl px-4 sm:px-6">
          <SectionTitle
            icon={<Play className="h-4 w-4" />}
            title="The AI trip film"
            ai
          />
          <div className="glass overflow-hidden rounded-atlas-lg p-2">
            <video
              src={publicAssetUrl(j.videoUrl)}
              poster={j.coverUrl ? publicAssetUrl(j.coverUrl) : undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-[1.35rem] object-cover"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Rendered by a video generation model from this journey's
            first-person footage
          </p>
        </section>
      )}

      {/* chapters */}
      {j.chapters.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <SectionTitle
            icon={<BookOpenText className="h-4 w-4" />}
            title="First-person chapters"
          />
          <div className="mt-6 space-y-6">
            {j.chapters.map((c, i) => (
              <div
                key={c.id}
                className={cn(
                  "glass flex flex-col gap-6 overflow-hidden rounded-atlas-lg p-5 sm:p-6 md:flex-row md:items-center",
                  i % 2 === 1 && "md:flex-row-reverse"
                )}
              >
                {c.photoUrl && (
                  <img
                    src={publicAssetUrl(c.photoUrl)}
                    alt={c.title}
                    className="h-48 w-full rounded-atlas object-cover md:h-44 md:w-72"
                    loading="lazy"
                  />
                )}
                <div className="flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    Chapter {i + 1}
                  </p>
                  <h3 className="font-display mt-1 text-2xl">{c.title}</h3>
                  <p className="mt-2 leading-relaxed text-foreground/70">
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI trip notes */}
      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="glass rounded-atlas-lg p-6 sm:p-8 lg:col-span-3">
            <SectionTitle
              icon={<Sparkles className="h-4 w-4" />}
              title="Atlas AI trip summary"
              ai
            />
            <p className="mt-4 font-semibold leading-relaxed">{j.summary}</p>
            <div className="mt-4 space-y-4 border-t border-foreground/5 pt-4">
              {(j.story || "").split(/\n{2,}/).map((p, i) => (
                <p key={i} className="leading-relaxed text-foreground/70">
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className="glass rounded-atlas-lg p-6 sm:p-8 lg:col-span-2">
            <SectionTitle
              icon={<Landmark className="h-4 w-4" />}
              title="Landmark notes"
              ai
            />
            <div className="mt-4 space-y-4">
              {j.landmarks.map(l => (
                <div key={l.name} className="rounded-2xl bg-white/50 p-4">
                  <p className="font-bold">{l.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {l.note}
                  </p>
                </div>
              ))}
              {j.landmarks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No landmark notes for this journey yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* gallery */}
      {j.photos.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <SectionTitle
            icon={<Camera className="h-4 w-4" />}
            title="Frames from the journey"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {j.photos.map(p => (
              <figure
                key={p.id}
                className="glass group relative overflow-hidden rounded-atlas"
              >
                <img
                  src={publicAssetUrl(p.url)}
                  alt={p.caption || j.title}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {p.caption}
                </figcaption>
                <span
                  className="chip absolute left-2.5 top-2.5 bg-white/80 text-[10px] backdrop-blur"
                  style={{ color: dayColor(p.day) }}
                >
                  Day {p.day}
                </span>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* route */}
      {j.stops.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle
              icon={<RouteIcon className="h-4 w-4" />}
              title="The replicable route"
            />
            <button
              onClick={onReplicate}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03]",
                j.replicatedByMe
                  ? "glass text-foreground"
                  : "bg-foreground text-background"
              )}
            >
              <RouteIcon className="h-4 w-4" />
              {j.replicatedByMe
                ? "Replicated to your trips"
                : "Replicate this route"}
            </button>
          </div>
          <div className="mt-6">
            <RouteMap stops={j.stops} height={320} />
          </div>
          <div className="mt-6 space-y-8">
            {days.map(day => (
              <div key={day}>
                <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                  <CalendarDays
                    className="h-4 w-4"
                    style={{ color: dayColor(day) }}
                  />{" "}
                  Day {day}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {j.stops
                    .filter(s => s.day === day)
                    .map((s, i) => (
                      <div
                        key={s.id}
                        className="glass flex items-start gap-3 rounded-2xl p-4"
                      >
                        <span
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                          style={{ background: dayColor(day) }}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-bold">
                            <MapPin className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                            {s.name}
                          </p>
                          {s.note && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {s.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* footer stat strip */}
      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <div className="glass flex flex-wrap items-center justify-around gap-6 rounded-atlas-lg p-8 text-center">
          <Stat
            icon={<Footprints className="h-5 w-5" />}
            value={`${j.distanceKm} km`}
            label="traced on foot & rail"
          />
          <Stat
            icon={<Camera className="h-5 w-5" />}
            value={String(j.photosCount)}
            label="frames kept"
          />
          <Stat
            icon={<Heart className="h-5 w-5" />}
            value={String(j.likesCount)}
            label="travelers moved"
          />
          <Stat
            icon={<RouteIcon className="h-5 w-5" />}
            value={String(j.replicatesCount)}
            label="routes replicated"
          />
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  strong?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "chip px-4 py-2.5 transition-transform hover:scale-[1.04]",
        strong
          ? active
            ? "bg-[hsl(var(--atlas-mint))]/20 text-foreground"
            : "bg-foreground text-background"
          : active
            ? "bg-[hsl(340,70%,72%)]/20 text-[hsl(340,70%,50%)]"
            : "glass-subtle text-foreground/70"
      )}
    >
      {icon} {label}
    </button>
  );
}

function SectionTitle({
  icon,
  title,
  ai,
}: {
  icon: React.ReactNode;
  title: string;
  ai?: boolean;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl",
          ai
            ? "bg-atlas-aurora text-white"
            : "bg-foreground/5 text-foreground/70"
        )}
      >
        {icon}
      </span>
      {title}
      {ai && <AIBadge />}
    </h2>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-foreground/60 shadow-sm">
        {icon}
      </span>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
