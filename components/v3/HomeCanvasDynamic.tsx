"use client";

import { useEffect, useState } from "react";
import { DashboardAuthView } from "@/components/dashboard/DashboardAuthView";
import { FenderBrandCanvas } from "@/components/v3/FenderBrandCanvas";
import { createClient } from "@/lib/supabase/client";
import { GUEST_DASHBOARD_COOKIE } from "@/lib/auth/guest-dashboard.constants";

function readGuestCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${GUEST_DASHBOARD_COOKIE}=1`));
}

export function HomeCanvasDynamic() {
  const [ready, setReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.user?.email) {
        setSessionEmail(data.session.user.email);
      } else if (readGuestCookie()) {
        setGuest(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  if (sessionEmail) {
    return <FenderBrandCanvas userMenu={{ email: sessionEmail }} viewerId={sessionEmail} />;
  }

  if (guest) return <FenderBrandCanvas />;

  return <DashboardAuthView mode="login" />;
}
