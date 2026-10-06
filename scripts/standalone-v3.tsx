import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DashboardAuthView } from "../components/dashboard/DashboardAuthView";
import { FenderBrandCanvas } from "../components/v3/FenderBrandCanvas";
import { GUEST_DASHBOARD_COOKIE } from "../lib/auth/guest-dashboard.constants";

function readGuestAccess(): boolean {
  try {
    return localStorage.getItem(GUEST_DASHBOARD_COOKIE) === "1";
  } catch {
    return false;
  }
}

function StandaloneFenderApp() {
  const [guest, setGuest] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGuest(readGuestAccess());
    setReady(true);
    const onGuest = () => setGuest(true);
    window.addEventListener("ifai-guest-dashboard", onGuest);
    return () => window.removeEventListener("ifai-guest-dashboard", onGuest);
  }, []);

  if (!ready) return null;

  if (!guest) {
    return <DashboardAuthView mode="login" />;
  }

  return <FenderBrandCanvas />;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<StandaloneFenderApp />);
