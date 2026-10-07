import { DASHBOARD_PATH } from "@/lib/auth/dashboard-path";

/** Keep post-login redirects inside this app. */
export function safeNextPath(value: string | null | undefined, origin?: string): string {
  if (!value) return DASHBOARD_PATH;
  try {
    const base = origin ?? "http://localhost";
    const url = new URL(value, base);
    if (origin && url.origin !== new URL(origin).origin) return DASHBOARD_PATH;
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return DASHBOARD_PATH;
    if (url.pathname === "/login" || url.pathname === "/signup") return DASHBOARD_PATH;
    return `${url.pathname}${url.search}`;
  } catch {
    return DASHBOARD_PATH;
  }
}
