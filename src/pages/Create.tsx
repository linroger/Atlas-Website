import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useAiJob } from "@/hooks/useAiJob";
import { AIBadge } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { PhotoUpload } from "@contracts/constants";
import {
  CloudUpload,
  Sparkles,
  Image as ImageIcon,
  Clapperboard,
  Volume2,
  MapPin,
  Wand2,
  CheckCircle2,
  Loader2,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Globe2,
  CalendarDays,
  Crosshair,
  RefreshCw,
} from "lucide-react";

type UploadedPhoto = {
  index: number;
  url: string;
  fileId: string;
  day: number;
  lat: number | null;
  lng: number | null;
  takenAt: Date | null;
  preview: string;
};

type Analysis = {
  photos: UploadedPhoto[];
  locatedCount: number;
  destination: string;
  country: string;
  daysCount: number;
  detectedPlace: { place: string; city: string; country: string } | null;
};

type Story = {
  title: string;
  summary: string;
  story: string;
  landmarks: { name: string; note: string }[];
  mood: string;
  intelNotes: string[];
  intelPlaces: string[];
};

const STEPS = ["Upload", "Analyze", "AI Story & Media", "Publish"];

export default function Create() {
  useAuth({ redirectOnUnauthenticated: true });
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // step 1
  const [files, setFiles] = useState<{ dataUrl: string; name: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // step 2
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // step 3
  const [story, setStory] = useState<Story | null>(null);
  const [stops, setStops] = useState<{ name: string; day: number }[]>([]);
  const [bannerJob, setBannerJob] = useState<number | null>(null);
  const [filmJob, setFilmJob] = useState<number | null>(null);
  const [narrationJob, setNarrationJob] = useState<number | null>(null);
  const banner = useAiJob(bannerJob);
  const film = useAiJob(filmJob);
  const narration = useAiJob(narrationJob);

  // step 4
  const [published, setPublished] = useState<{ id: number; slug: string } | null>(null);

  const analyze = trpc.ai.analyzePhotos.useMutation({
    onSuccess: (data) => {
      setAnalysis({
        photos: data.photos.map((p, i) => ({
          index: p.index,
          url: p.url,
          fileId: p.fileId,
          day: p.day,
          lat: p.lat,
          lng: p.lng,
          takenAt: p.takenAt ?? null,
          preview: files[i]?.dataUrl || p.url,
        })),
        locatedCount: data.locatedCount,
        destination: data.destination,
        country: data.country,
        daysCount: data.daysCount,
        detectedPlace: data.detectedPlace,
      });
      setStep(1);
    },
  });

  const writeStory = trpc.ai.writeStory.useMutation({
    onSuccess: (data) => {
      setStory(data);
    },
  });

  const startBanner = trpc.ai.startBanner.useMutation({
    onSuccess: (d) => setBannerJob(d.jobId),
  });
  const startFilm = trpc.ai.startFilm.useMutation({
    onSuccess: (d) => setFilmJob(d.jobId),
  });
  const startNarration = trpc.ai.startNarration.useMutation({
    onSuccess: (d) => setNarrationJob(d.jobId),
  });

  const updateMedia = trpc.journey.updateMedia.useMutation();
  const createJourney = trpc.journey.create.useMutation({
    onSuccess: (res) => {
      setPublished(res);
      setStep(3);
    },
  });

  const canAnalyze = files.length > 0 && !analyze.isPending;

  function onPickFiles(list: FileList | null) {
    if (!list) return;
    const availableSlots = PhotoUpload.maxPhotos - files.length;
    const candidates = Array.from(list);
    const picked = candidates.slice(0, availableSlots);
    const rejected: string[] = [];
    if (candidates.length > availableSlots) {
      rejected.push(`only ${availableSlots} remaining slot${availableSlots === 1 ? "" : "s"}`);
    }
    for (const f of picked) {
      if (!(PhotoUpload.allowedMimeTypes as readonly string[]).includes(f.type)) {
        rejected.push(`${f.name}: use JPEG, PNG, or WebP`);
        continue;
      }
      if (f.size > PhotoUpload.maxBytesPerPhoto) {
        rejected.push(
          `${f.name}: exceeds ${PhotoUpload.maxBytesPerPhoto / 1024 / 1024} MiB`,
        );
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFiles((prev) =>
          prev.length >= PhotoUpload.maxPhotos
            ? prev
            : [...prev, { dataUrl: String(reader.result), name: f.name }],
        );
      };
      reader.onerror = () => setUploadError(`${f.name}: could not be read`);
      reader.readAsDataURL(f);
    }
    setUploadError(rejected.length ? rejected.join(" · ") : null);
  }

  const filmPhotoFileIds = useMemo(
    () => (analysis ? analysis.photos.slice(0, 4).map((p) => p.fileId) : []),
    [analysis],
  );

  function publish() {
    if (!analysis || !story) return;
    const slugBase = story.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    createJourney.mutate({
      slug: slugBase || `journey-${Date.now()}`,
      title: story.title,
      destination: analysis.destination || "Unknown",
      country: analysis.country,
      summary: story.summary,
      story: story.story,
      landmarks: story.landmarks,
      mood: story.mood,
      coverUrl: analysis.photos[0]?.url,
      daysCount: analysis.daysCount,
      photos: analysis.photos.map((p) => ({
        url: p.url,
        fileId: p.fileId,
        caption: "",
        day: p.day,
        lat: p.lat ?? undefined,
        lng: p.lng ?? undefined,
        takenAt: p.takenAt ?? undefined,
      })),
      stops: stops.map((s) => ({ name: s.name, day: s.day })),
    });
  }

  // after publish, attach finished AI media
  function attachMedia() {
    if (!published) return;
    const payload: { id: number; bannerUrl?: string; videoUrl?: string; narrationUrl?: string } = {
      id: published.id,
    };
    if (banner.url) payload.bannerUrl = banner.url;
    if (film.url) payload.videoUrl = film.url;
    if (narration.url) payload.narrationUrl = narration.url;
    if (payload.bannerUrl || payload.videoUrl || payload.narrationUrl) {
      updateMedia.mutate(payload);
    }
  }

  return (
    <div className="bg-atlas-wash min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-4 pt-28 sm:px-6">
        <div className="text-center">
          <AIBadge label="Atlas AI Studio" />
          <h1 className="font-display mt-3 text-balance text-5xl leading-tight">
            Turn last trip's photos into a <em className="text-atlas-gradient not-italic">living journey</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Upload up to 9 photos. Atlas AI locates them, detects your trip window,
            writes the story, paints a banner and renders a cinematic film.
          </p>
        </div>

        {/* stepper */}
        <div className="mx-auto mt-8 flex max-w-xl items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-colors",
                    i < step
                      ? "bg-[hsl(var(--atlas-mint))] text-white"
                      : i === step
                        ? "bg-foreground text-background"
                        : "glass-subtle text-muted-foreground",
                  )}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("mt-1.5 text-[10px] font-bold", i === step ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="mx-2 mb-5 h-px w-8 bg-foreground/10 sm:w-14" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: upload ─────────────────────────────── */}
        {step === 0 && (
          <div className="glass mt-8 rounded-atlas-lg p-6 sm:p-10">
            <button
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center rounded-atlas border-2 border-dashed border-foreground/15 bg-white/40 px-6 py-14 text-center transition-colors hover:border-foreground/30 hover:bg-white/60"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-atlas-aurora text-white shadow-md">
                <CloudUpload className="h-6 w-6" />
              </span>
              <p className="mt-4 text-lg font-extrabold">Drop your vacation photos</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Up to {PhotoUpload.maxPhotos} images · JPEG/PNG/WebP · max{" "}
                {PhotoUpload.maxBytesPerPhoto / 1024 / 1024} MiB each
              </p>
              <p className="mt-1 max-w-lg text-xs text-muted-foreground/80">
                Photos and embedded GPS are sent to Atlas services for trip analysis;
                precise photo EXIF is excluded from public journey responses.
              </p>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={PhotoUpload.allowedMimeTypes.join(",")}
              multiple
              hidden
              onChange={(e) => onPickFiles(e.target.files)}
            />

            {files.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {files.map((f, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-2xl">
                    <img src={f.dataUrl} alt={f.name} className="aspect-square w-full object-cover" />
                    <button
                      onClick={() => setFiles((prev) => prev.filter((_, x) => x !== i))}
                      className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {files.length < PhotoUpload.maxPhotos && (
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-foreground/15 text-muted-foreground hover:border-foreground/30"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                )}
              </div>
            )}

            {uploadError && (
              <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                {uploadError}
              </p>
            )}

            <div className="mt-6">
              <label className="text-sm font-bold text-foreground/70">
                Where was this trip? <span className="font-semibold text-muted-foreground">(optional — AI can detect it from GPS)</span>
              </label>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g. Kyoto, Iceland, Marrakech…"
                className="glass-subtle mt-2 h-12 w-full rounded-2xl px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-[hsl(var(--atlas-sky))]"
              />
            </div>

            {analyze.isError && (
              <p className="mt-4 rounded-2xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                Analysis failed — please try again with smaller photos. ({analyze.error.message.slice(0, 120)})
              </p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                disabled={!canAnalyze}
                onClick={() => analyze.mutate({ photos: files.map((f) => f.dataUrl), destinationHint: hint || undefined })}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
              >
                {analyze.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Atlas AI is analyzing…
                  </>
                ) : (
                  <>
                    Analyze with AI <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            {analyze.isPending && (
              <p className="mt-3 text-right text-xs text-muted-foreground">
                Uploading to your Atlas cloud, reading EXIF GPS, detecting the trip window…
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: analysis results ───────────────────── */}
        {step === 1 && analysis && (
          <div className="mt-8 space-y-6">
            <div className="glass rounded-atlas-lg p-6 sm:p-8">
              <h2 className="flex items-center gap-2.5 text-xl font-extrabold">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-atlas-aurora text-white">
                  <Crosshair className="h-4 w-4" />
                </span>
                What Atlas AI found
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <Globe2 className="h-5 w-5 text-[hsl(var(--atlas-sky))]" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination</p>
                  <input
                    value={analysis.destination}
                    onChange={(e) => setAnalysis({ ...analysis, destination: e.target.value })}
                    className="mt-1 w-full bg-transparent text-lg font-extrabold outline-none"
                    placeholder="Name your destination"
                  />
                  <input
                    value={analysis.country}
                    onChange={(e) => setAnalysis({ ...analysis, country: e.target.value })}
                    className="w-full bg-transparent text-sm font-semibold text-muted-foreground outline-none"
                    placeholder="Country"
                  />
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <CalendarDays className="h-5 w-5 text-[hsl(var(--atlas-lavender))]" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trip window</p>
                  <p className="mt-1 text-lg font-extrabold">{analysis.daysCount} day{analysis.daysCount > 1 ? "s" : ""}</p>
                  <p className="text-sm font-semibold text-muted-foreground">detected from photo timestamps</p>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <MapPin className="h-5 w-5 text-[hsl(var(--atlas-peach))]" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">GPS located</p>
                  <p className="mt-1 text-lg font-extrabold">
                    {analysis.locatedCount}/{analysis.photos.length} photos
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {analysis.detectedPlace ? `near ${analysis.detectedPlace.place}` : "no GPS metadata — used your hint"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {analysis.photos.map((p) => (
                  <div key={p.index} className="relative overflow-hidden rounded-2xl">
                    <img src={p.url} alt="" className="aspect-square w-full object-cover" />
                    <span className="chip absolute left-1.5 top-1.5 bg-white/85 text-[10px]">Day {p.day}</span>
                    {p.lat != null && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/45 p-1 text-white">
                        <MapPin className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="chip glass px-5 py-2.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={() => {
                  setStep(2);
                  if (!story && !writeStory.isPending) {
                    writeStory.mutate({
                      destination: analysis.destination || "this journey",
                      country: analysis.country,
                      daysCount: analysis.daysCount,
                      stops: stops.map((s) => s.name),
                    });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.03]"
              >
                Write my story with AI <Wand2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: story & media ──────────────────────── */}
        {step === 2 && analysis && (
          <div className="mt-8 space-y-6">
            {/* story card */}
            <div className="glass rounded-atlas-lg p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-xl font-extrabold">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-atlas-aurora text-white">
                    <Wand2 className="h-4 w-4" />
                  </span>
                  The AI-written journey
                </h2>
                <AIBadge />
              </div>

              {writeStory.isPending && (
                <div className="ai-shimmer mt-5 space-y-3 rounded-2xl p-5">
                  <div className="h-6 w-2/3 rounded-lg bg-white/70" />
                  <div className="h-4 w-full rounded-lg bg-white/60" />
                  <div className="h-4 w-5/6 rounded-lg bg-white/60" />
                  <p className="pt-2 text-xs font-bold text-foreground/50">
                    Atlas AI is reading about {analysis.destination} and writing your story…
                  </p>
                </div>
              )}

              {story && (
                <div className="mt-5 space-y-4">
                  <input
                    value={story.title}
                    onChange={(e) => setStory({ ...story, title: e.target.value })}
                    className="font-display w-full bg-transparent text-3xl leading-tight outline-none"
                  />
                  <textarea
                    value={story.summary}
                    onChange={(e) => setStory({ ...story, summary: e.target.value })}
                    rows={2}
                    className="glass-subtle w-full rounded-2xl p-4 text-sm font-semibold leading-relaxed outline-none"
                  />
                  <textarea
                    value={story.story}
                    onChange={(e) => setStory({ ...story, story: e.target.value })}
                    rows={9}
                    className="glass-subtle w-full rounded-2xl p-4 text-sm leading-relaxed outline-none"
                  />
                  {story.landmarks.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {story.landmarks.map((l, i) => (
                        <div key={i} className="rounded-2xl bg-white/60 p-4">
                          <p className="text-sm font-bold">{l.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{l.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* suggested stops */}
                  {story.intelPlaces.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-foreground/70">
                        Add route stops from AI research:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {story.intelPlaces.slice(0, 8).map((place) => {
                          const added = stops.some((s) => s.name === place);
                          return (
                            <button
                              key={place}
                              disabled={added}
                              onClick={() => setStops((prev) => [...prev, { name: place, day: 1 }])}
                              className={cn(
                                "chip",
                                added ? "bg-[hsl(var(--atlas-mint))]/20 text-foreground/60" : "glass-subtle text-foreground/70 hover:bg-white/70",
                              )}
                            >
                              {added ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {place}
                            </button>
                          );
                        })}
                      </div>
                      {stops.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-bold text-foreground/60">Your route:</span>
                          {stops.map((s, i) => (
                            <span key={i} className="chip bg-foreground/85 text-background">
                              {i + 1}. {s.name}
                              <button onClick={() => setStops((prev) => prev.filter((_, x) => x !== i))}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* media generation cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <MediaCard
                icon={<ImageIcon className="h-5 w-5" />}
                title="AI banner"
                desc="An image model paints a cinematic banner from your trip."
                state={banner.status}
                onStart={() =>
                  startBanner.mutate({
                    destination: analysis.destination || "travel destination",
                    country: analysis.country,
                    mood: story?.mood,
                  })
                }
                starting={startBanner.isPending}
              >
                {banner.url && <img src={banner.url} alt="AI banner" className="mt-3 w-full rounded-xl object-cover" />}
              </MediaCard>

              <MediaCard
                icon={<Clapperboard className="h-5 w-5" />}
                title="AI trip film"
                desc="A video model animates your photos into a short film. Takes a few minutes."
                state={film.status}
                onStart={() =>
                  startFilm.mutate({
                    destination: analysis.destination || "travel destination",
                    photoFileIds: filmPhotoFileIds,
                    mood: story?.mood,
                    daysCount: analysis.daysCount,
                  })
                }
                starting={startFilm.isPending}
              >
                {film.url && (
                  <video src={film.url} controls playsInline className="mt-3 w-full rounded-xl" />
                )}
              </MediaCard>

              <MediaCard
                icon={<Volume2 className="h-5 w-5" />}
                title="AI narration"
                desc="A warm voiceover introduces your journey to listeners."
                state={narration.status}
                onStart={() =>
                  story &&
                  startNarration.mutate({
                    title: story.title,
                    destination: analysis.destination || "travel destination",
                    daysCount: analysis.daysCount,
                    summary: story.summary,
                  })
                }
                starting={startNarration.isPending}
              >
                {narration.url && <audio src={narration.url} controls className="mt-3 w-full" />}
              </MediaCard>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="chip glass px-5 py-2.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                disabled={!story || createJourney.isPending}
                onClick={publish}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-bold text-background transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
              >
                {createJourney.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Publish journey
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: published ──────────────────────────── */}
        {step === 3 && published && (
          <div className="glass mx-auto mt-8 max-w-xl rounded-atlas-lg p-10 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--atlas-mint))]/20">
              <CheckCircle2 className="h-8 w-8 text-[hsl(var(--atlas-mint))]" />
            </span>
            <h2 className="font-display mt-4 text-4xl">Your journey is live</h2>
            <p className="mt-3 text-muted-foreground">
              It's part of your Travel DNA now — and other travelers can watch it,
              love it, and replicate your route with one tap.
            </p>

            {(banner.status === "done" || film.status === "done" || narration.status === "done") && (
              <button
                onClick={attachMedia}
                disabled={updateMedia.isPending}
                className="chip glass mx-auto mt-5 px-5 py-2.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", updateMedia.isPending && "animate-spin")} />
                Attach finished AI media to the journey
              </button>
            )}
            {film.status === "running" || film.status === "queued" ? (
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                Your AI film is still rendering — check back on the journey page shortly.
              </p>
            ) : null}

            <div className="mt-7 flex justify-center gap-3">
              <button
                onClick={() => {
                  attachMedia();
                  navigate(`/journey/${published.slug}`);
                }}
                className="rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.03]"
              >
                View journey
              </button>
              <button onClick={() => navigate("/dna")} className="chip glass px-6 py-3">
                My Travel DNA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MediaCard({
  icon,
  title,
  desc,
  state,
  onStart,
  starting,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  state: "idle" | "queued" | "running" | "done" | "failed";
  onStart: () => void;
  starting: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-atlas p-5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-atlas-aurora text-white">
          {icon}
        </span>
        <p className="font-extrabold">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>

      {state === "idle" && (
        <button
          onClick={onStart}
          disabled={starting}
          className="chip mt-3 bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          {starting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate
        </button>
      )}
      {(state === "queued" || state === "running") && (
        <div className="ai-shimmer mt-3 rounded-xl p-3 text-center text-xs font-bold text-foreground/60">
          <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
          {state === "queued" ? "Queued…" : "Generating…"}
        </div>
      )}
      {state === "failed" && (
        <button onClick={onStart} className="chip mt-3 bg-destructive/10 px-4 py-2 text-destructive">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      )}
      {state === "done" && children}
    </div>
  );
}
