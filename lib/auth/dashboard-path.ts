/** Canonical path for the Fender / brand intelligence canvas. */
export const DASHBOARD_PATH = "/dashboard";

export function isDashboardPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === DASHBOARD_PATH || normalized.endsWith(DASHBOARD_PATH);
}
