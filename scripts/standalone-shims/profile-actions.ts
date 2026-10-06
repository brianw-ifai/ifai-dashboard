export type ProfileActionState = { error: string } | { notice: string } | null;

export async function updateDisplayName(): Promise<ProfileActionState> {
  return { error: "Profile settings are not available in this export." };
}

export async function uploadAvatar(): Promise<ProfileActionState> {
  return { error: "Profile settings are not available in this export." };
}
