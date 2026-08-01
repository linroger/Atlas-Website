export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthStart: "/api/oauth/start",
  oauthCallback: "/api/oauth/callback",
} as const;

/**
 * Interim JSON/base64 upload limits. Nine 4 MiB images expand to roughly
 * 48 MiB, leaving headroom under the server's 50 MiB request limit.
 */
export const PhotoUpload = {
  maxPhotos: 9,
  maxBytesPerPhoto: 4 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;
