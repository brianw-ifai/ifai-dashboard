/**
 * When false, the dashboard opens straight onto Fender's canvas.
 * Login, signup, and Skip Login stay in the repo; set this to true to require them again.
 */
export const DASHBOARD_LOGIN_REQUIRED: boolean = false;

/** Marks a browser as allowed to view the Fender demo canvas without signing in. */
export const GUEST_DASHBOARD_COOKIE = "ifai_guest_fender";

export const guestDashboardCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
