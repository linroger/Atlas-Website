import { Link } from "react-router";
import { Heart, Route, Play, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { JourneyCardData } from "@/data/demoJourneys";
import { publicAssetUrl } from "@/lib/staticDemo";
import { moodHue } from "@/lib/journeyStyles";

export default function JourneyCard({ journey }: { journey: JourneyCardData }) {
  return (
    <Link
      to={`/journey/${journey.slug}`}
      className="journey-card glass group block overflow-hidden rounded-atlas"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={publicAssetUrl(journey.coverUrl || "/assets/hero-poster.jpg")}
          alt={journey.title}
          className="journey-card-img h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className="chip bg-white/80 capitalize text-foreground/75 backdrop-blur"
            style={{ color: moodHue(journey.mood) }}
          >
            ● {journey.mood}
          </span>
          {journey.videoUrl && (
            <span className="chip bg-white/80 text-foreground/75 backdrop-blur">
              <Play className="h-3 w-3" /> AI film
            </span>
          )}
        </div>
        {journey.featured && (
          <span className="chip absolute right-3 top-3 bg-foreground/80 text-background backdrop-blur">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">
            {journey.destination} · {journey.country}
          </p>
          <h3 className="font-display mt-0.5 line-clamp-2 text-xl leading-snug">
            {journey.title}
          </h3>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="h-8 w-8 border border-white shadow-sm">
            <AvatarImage
              src={journey.authorAvatar ? publicAssetUrl(journey.authorAvatar) : undefined}
            />
            <AvatarFallback className="bg-atlas-aurora text-[10px] font-bold text-white">
              {(journey.authorName || "A").slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{journey.authorName || "Atlas Explorer"}</p>
            <p className="text-xs text-muted-foreground">{journey.daysCount} day{journey.daysCount > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {journey.likesCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Route className="h-3.5 w-3.5" /> {journey.replicatesCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
