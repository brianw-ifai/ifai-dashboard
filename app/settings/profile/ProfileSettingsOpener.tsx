"use client";

import { ProfileSettingsModal } from "@/components/auth/ProfileSettingsModal";
import type { ProfileSettingsPanelProps } from "@/components/auth/ProfileSettingsPanel";
import { DASHBOARD_PATH } from "@/lib/auth/dashboard-path";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function ProfileSettingsOpener(props: ProfileSettingsPanelProps) {
  const router = useRouter();
  const close = useCallback(() => {
    router.replace(DASHBOARD_PATH);
  }, [router]);

  return <ProfileSettingsModal open variant="canvas" onClose={close} {...props} />;
}
