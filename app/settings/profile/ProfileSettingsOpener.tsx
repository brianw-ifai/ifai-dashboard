"use client";

import { ProfileSettingsModal } from "@/components/auth/ProfileSettingsModal";
import type { ProfileSettingsPanelProps } from "@/components/auth/ProfileSettingsPanel";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function ProfileSettingsOpener(props: ProfileSettingsPanelProps) {
  const router = useRouter();
  const close = useCallback(() => {
    router.replace("/");
  }, [router]);

  return <ProfileSettingsModal open variant="canvas" onClose={close} {...props} />;
}
