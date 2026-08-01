type RouteLocation = {
  pathname: string;
  search: string;
  hash: string;
};

/** Preserve the exact protected route so OAuth can resume it after sign-in. */
export function loginRedirectWithReturnTo(
  loginPath: string,
  location: RouteLocation
): string {
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const separator = loginPath.includes("?") ? "&" : "?";
  return `${loginPath}${separator}${new URLSearchParams({ returnTo }).toString()}`;
}
