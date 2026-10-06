import { cookies } from "next/headers";
import {
  GUEST_DASHBOARD_COOKIE,
  guestDashboardCookieOptions,
} from "@/lib/auth/guest-dashboard.constants";

export { GUEST_DASHBOARD_COOKIE, guestDashboardCookieOptions };

/** Playwright dev server sets `E2E_AUTH_BYPASS=1` so tests skip the login modal. */
export function e2eGuestDashboardBypass(): boolean {
  return process.env.E2E_AUTH_BYPASS === "1" && process.env.NODE_ENV !== "production";
}

export async function hasGuestDashboardAccess(): Promise<boolean> {
  if (e2eGuestDashboardBypass()) return true;
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_DASHBOARD_COOKIE)?.value === "1";
}
