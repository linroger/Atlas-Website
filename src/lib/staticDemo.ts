export const IS_STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i;

/**
 * Join a public URL to Vite's deployment base without rewriting remote URLs.
 * Keeping this pure makes repository-subpath behavior easy to verify in tests.
 */
export function joinBasePath(basePath: string, value: string): string {
  if (
    !value ||
    value.startsWith("#") ||
    value.startsWith("//") ||
    ABSOLUTE_URL.test(value)
  ) {
    return value;
  }

  const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, "")}/`.replace(
    /^\/\/$/,
    "/",
  );
  if (normalizedBase !== "/" && value.startsWith(normalizedBase)) {
    return value;
  }

  return `${normalizedBase}${value.replace(/^\/+/, "")}`;
}

/** Resolve a file from Vite's public directory for root or project Pages sites. */
export function publicAssetUrl(value: string): string {
  return joinBasePath(import.meta.env.BASE_URL, value);
}

/** Route a static-demo interaction to the single, explicit backend notice. */
export function backendFeaturePath(feature: string): string {
  return `/unavailable?feature=${encodeURIComponent(feature)}`;
}
