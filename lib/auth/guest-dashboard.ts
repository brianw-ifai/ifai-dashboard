import { cookies } from "next/headers";

/** Marks a browser as allowed to view the Fender demo canvas without signing in. */
export const GUEST_DASHBOARD_COOKIE = "ifai_guest_fender";

export const guestDashboardCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Playwright dev server sets `E2E_AUTH_BYPASS=1` so tests skip the login modal. */
export function e2eGuestDashboardBypass(): boolean {
  return process.env.E2E_AUTH_BYPASS === "1" && process.env.NODE_ENV !== "production";
}

export async function hasGuestDashboardAccess(): Promise<boolean> {
  if (e2eGuestDashboardBypass()) return true;
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_DASHBOARD_COOKIE)?.value === "1";
}
