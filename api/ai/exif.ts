/**
 * Photo forensics for Atlas AI analysis:
 * EXIF extraction (GPS, timestamps), trip-window detection and
 * reverse geocoding so uploaded photos self-organize into a journey.
 */
// exif-parser ships no type declarations; wrap it locally.
// @ts-expect-error — untyped CJS package
import exifParserModule from "exif-parser";

interface ExifTags {
  DateTimeOriginal?: number;
  CreateDate?: number;
  GPSLatitude?: number;
  GPSLongitude?: number;
  [key: string]: unknown;
}
const exifParser = exifParserModule as {
  create(buf: Buffer): { parse(): { tags: ExifTags } };
};

export type PhotoMeta = {
  index: number;
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
};

type PhotonResponse = {
  features?: Array<{
    properties?: {
      city?: string;
      district?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      country?: string;
      name?: string;
      street?: string;
    };
  }>;
};

type NominatimResponse = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

export function extractExif(buf: Buffer, index: number): PhotoMeta {
  try {
    const parser = exifParser.create(buf);
    const result = parser.parse();
    const tags = result.tags || {};
    const takenAt = tags.DateTimeOriginal
      ? new Date(tags.DateTimeOriginal * 1000)
      : tags.CreateDate
        ? new Date(tags.CreateDate * 1000)
        : null;
    const lat =
      typeof tags.GPSLatitude === "number" && tags.GPSLatitude !== 0
        ? tags.GPSLatitude
        : null;
    const lng =
      typeof tags.GPSLongitude === "number" && tags.GPSLongitude !== 0
        ? tags.GPSLongitude
        : null;
    return { index, takenAt, lat, lng };
  } catch {
    return { index, takenAt: null, lat: null, lng: null };
  }
}

/** Reverse geocode, best effort: Photon first, Nominatim fallback. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ place: string; city: string; country: string } | null> {
  try {
    const resp = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`,
      { headers: { "User-Agent": "AtlasTravel/1.0" } },
    );
    if (resp.ok) {
      const data = (await resp.json()) as PhotonResponse;
      const p = data?.features?.[0]?.properties;
      if (p) {
        const city =
          p.city || p.district || p.town || p.village || p.county || p.state || "";
        const country = p.country || "";
        const place = p.name || [p.street, p.district].filter(Boolean).join(", ") || city;
        if (city || country) return { place, city, country };
      }
    }
  } catch {
    /* fall through to nominatim */
  }
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=12`,
      { headers: { "User-Agent": "AtlasTravel/1.0 (atlas.demo)" } },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as NominatimResponse;
    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.county || addr.state || "";
    return {
      place: data.display_name?.split(",").slice(0, 2).join(",") || city,
      city,
      country: addr.country || "",
    };
  } catch {
    return null;
  }
}

/** Analyze a batch of photo metadata into a trip structure. */
export function analyzeTripWindow(photos: PhotoMeta[]): {
  locatedCount: number;
  centroid: { lat: number; lng: number } | null;
  startDate: Date | null;
  endDate: Date | null;
  daysCount: number;
  dayByIndex: Map<number, number>;
} {
  const located = photos.filter((p) => p.lat != null && p.lng != null);
  const centroid = located.length
    ? {
        lat: located.reduce((s, p) => s + (p.lat as number), 0) / located.length,
        lng: located.reduce((s, p) => s + (p.lng as number), 0) / located.length,
      }
    : null;

  const dates = photos
    .map((p) => p.takenAt)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime());

  const startDate = dates[0] || null;
  const endDate = dates[dates.length - 1] || null;

  let daysCount = 1;
  const dayByIndex = new Map<number, number>();
  if (startDate && endDate) {
    daysCount =
      Math.max(
        1,
        Math.round(
          (endDate.getTime() - startDate.getTime()) / 86_400_000,
        ) + 1,
      ) || 1;
    for (const p of photos) {
      if (!p.takenAt) {
        dayByIndex.set(p.index, 1);
        continue;
      }
      const day =
        Math.min(
          daysCount,
          Math.floor(
            (p.takenAt.getTime() - startDate.getTime()) / 86_400_000,
          ) + 1,
        ) || 1;
      dayByIndex.set(p.index, day);
    }
  } else {
    photos.forEach((p) => dayByIndex.set(p.index, 1));
  }

  return { locatedCount: located.length, centroid, startDate, endDate, daysCount, dayByIndex };
}
