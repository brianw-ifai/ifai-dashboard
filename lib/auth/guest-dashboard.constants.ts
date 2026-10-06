/** Marks a browser as allowed to view the Fender demo canvas without signing in. */
export const GUEST_DASHBOARD_COOKIE = "ifai_guest_fender";

export const guestDashboardCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
