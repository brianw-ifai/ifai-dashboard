"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GUEST_DASHBOARD_COOKIE,
  guestDashboardCookieOptions,
} from "@/lib/auth/guest-dashboard";

export async function enterGuestDashboard(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_DASHBOARD_COOKIE, "1", guestDashboardCookieOptions);
  redirect("/");
}
