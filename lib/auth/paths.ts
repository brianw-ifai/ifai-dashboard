/** Keep post-login redirects inside this app. */
export function safeNextPath(value: string | null | undefined, origin?: string): string {
  if (!value) return "/";
  try {
    const base = origin ?? "http://localhost";
    const url = new URL(value, base);
    if (origin && url.origin !== new URL(origin).origin) return "/";
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return "/";
    if (url.pathname === "/login" || url.pathname === "/signup") return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
