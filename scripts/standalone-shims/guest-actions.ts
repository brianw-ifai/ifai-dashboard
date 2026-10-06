import { GUEST_DASHBOARD_COOKIE } from "../../lib/auth/guest-dashboard.constants";

export async function enterGuestDashboard(): Promise<void> {
  try {
    localStorage.setItem(GUEST_DASHBOARD_COOKIE, "1");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent("ifai-guest-dashboard"));
}
