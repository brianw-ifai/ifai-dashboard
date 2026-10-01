"use client";

import {
  ProfileSettingsPanel,
  type ProfileSettingsPanelProps,
} from "@/components/auth/ProfileSettingsPanel";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = ProfileSettingsPanelProps & {
  open: boolean;
  onClose: () => void;
  variant: "canvas" | "portal";
  lightTheme?: boolean;
};

export function ProfileSettingsModal({
  open,
  onClose,
  variant,
  lightTheme = false,
  ...panel
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onKeyDown, open]);

  if (!mounted || !open) return null;

  const themeClass =
    variant === "canvas"
      ? `profile-modal-theme-canvas${lightTheme ? " is-light" : ""}`
      : "profile-modal-theme-portal";

  return createPortal(
    <div className={`profile-modal-root ${themeClass}`}>
      <button
        type="button"
        className="profile-modal-backdrop"
        aria-label="Close profile settings"
        onClick={onClose}
      />
      <div
        className="profile-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="profile-modal-header">
          <h1 id={titleId}>Profile</h1>
          <button
            ref={closeRef}
            type="button"
            className="profile-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="profile-modal-body">
          <ProfileSettingsPanel {...panel} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
