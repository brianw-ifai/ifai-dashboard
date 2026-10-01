import {
  COMMAND_AVATAR_BUCKET,
  COMMAND_AVATAR_SIGNED_URL_TTL_SEC,
} from "@/lib/command/constants";
import { createClient } from "@/lib/supabase/server";

export async function signedAvatarUrl(avatarPath: string | null | undefined) {
  if (!avatarPath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(COMMAND_AVATAR_BUCKET)
    .createSignedUrl(avatarPath, COMMAND_AVATAR_SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function avatarObjectPath(userId: string, extension: string) {
  const safeExt = extension.replace(/^\./, "").toLowerCase();
  return `${userId}/avatar.${safeExt}`;
}
