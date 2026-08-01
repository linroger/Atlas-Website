import { mediaProxyUrl } from "./ai/media";
import type { Journey } from "@db/schema";

type StoredPhoto = {
  id: number;
  journeyId: number;
  url: string;
  fileId: string | null;
  caption: string | null;
  day: number;
  sortOrder: number;
};

/** Public journey photos intentionally omit storage ids and precise EXIF fields. */
export function toPublicPhoto(photo: StoredPhoto) {
  return {
    id: photo.id,
    journeyId: photo.journeyId,
    url: photo.fileId ? mediaProxyUrl(photo.fileId) : photo.url,
    caption: photo.caption,
    day: photo.day,
    sortOrder: photo.sortOrder,
  };
}

/**
 * Allowlisted public projection. Keep internal ownership identifiers out of
 * unauthenticated list and detail responses even as the database row evolves.
 */
export function toPublicJourney(journey: Journey) {
  return {
    id: journey.id,
    slug: journey.slug,
    title: journey.title,
    destination: journey.destination,
    country: journey.country,
    summary: journey.summary,
    story: journey.story,
    landmarks: journey.landmarks,
    mood: journey.mood,
    coverUrl: journey.coverUrl,
    bannerUrl: journey.bannerUrl,
    videoUrl: journey.videoUrl,
    narrationUrl: journey.narrationUrl,
    daysCount: journey.daysCount,
    photosCount: journey.photosCount,
    distanceKm: journey.distanceKm,
    likesCount: journey.likesCount,
    replicatesCount: journey.replicatesCount,
    viewsCount: journey.viewsCount,
    authorName: journey.authorName,
    authorAvatar: journey.authorAvatar,
    featured: journey.featured,
    createdAt: journey.createdAt,
  };
}
