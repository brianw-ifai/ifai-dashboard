"use client";

import {
  type ProfileActionState,
  updateDisplayName,
  uploadAvatar,
} from "@/app/settings/profile/actions";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export type ProfileSettingsPanelProps = {
  displayName: string;
  email: string;
  organizationName: string | null;
  roleLabel: string | null;
  avatarUrl: string | null;
};

export function ProfileSettingsPanel({
  displayName,
  email,
  organizationName,
  roleLabel,
  avatarUrl,
}: ProfileSettingsPanelProps) {
  const router = useRouter();
  const [nameState, nameAction, namePending] = useActionState(updateDisplayName, null);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, null);

  useEffect(() => {
    if (nameState && "notice" in nameState) router.refresh();
  }, [nameState, router]);

  useEffect(() => {
    if (avatarState && "notice" in avatarState) router.refresh();
  }, [avatarState, router]);

  return (
    <div className="profile-settings-panel">
      <p className="profile-settings-sub">{email}</p>
      {organizationName ? (
        <p className="profile-settings-meta">
          {organizationName}
          {roleLabel ? ` · ${roleLabel}` : ""}
        </p>
      ) : null}

      <section className="profile-settings-section">
        <h2>Photo</h2>
        <div className="profile-settings-avatar-row">
          <div className="profile-settings-avatar">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" width={64} height={64} />
            ) : (
              <span aria-hidden>No photo</span>
            )}
          </div>
          <form action={avatarAction} className="profile-settings-form">
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp,image/gif" />
            <button type="submit" className="profile-settings-btn" disabled={avatarPending}>
              {avatarPending ? "Uploading…" : "Upload photo"}
            </button>
            <ActionMessage state={avatarState} />
          </form>
        </div>
      </section>

      <section className="profile-settings-section">
        <h2>Display name</h2>
        <form action={nameAction} className="profile-settings-form">
          <input
            type="text"
            name="displayName"
            defaultValue={displayName}
            maxLength={80}
            autoComplete="nickname"
            required
          />
          <button type="submit" className="profile-settings-btn" disabled={namePending}>
            {namePending ? "Saving…" : "Save name"}
          </button>
          <ActionMessage state={nameState} />
        </form>
      </section>
    </div>
  );
}

function ActionMessage({ state }: { state: ProfileActionState }) {
  if (!state) return null;
  if ("error" in state) {
    return <p className="profile-settings-error">{state.error}</p>;
  }
  return <p className="profile-settings-notice">{state.notice}</p>;
}
