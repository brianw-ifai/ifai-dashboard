import { redirect } from "next/navigation";
import { ProfileSettingsOpener } from "@/app/settings/profile/ProfileSettingsOpener";
import { commandSessionToUserMenu, getCommandSession } from "@/lib/command/session";

export default async function ProfileSettingsPage() {
  const session = await getCommandSession();
  if (!session) redirect("/dashboard?profile=1");

  const menu = commandSessionToUserMenu(session);

  return (
    <ProfileSettingsOpener
      displayName={session.profile.displayName ?? ""}
      email={session.email}
      organizationName={menu.organizationName}
      roleLabel={menu.roleLabel}
      avatarUrl={session.avatarSignedUrl}
    />
  );
}
