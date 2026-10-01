"use server";

import { revalidatePath } from "next/cache";
import { avatarObjectPath } from "@/lib/command/avatar";
import { COMMAND_AVATAR_BUCKET } from "@/lib/command/constants";
import { getCommandSession } from "@/lib/command/session";
import { createClient, getAuthUserId } from "@/lib/supabase/server";

export type ProfileActionState = { error: string } | { notice: string } | null;

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export async function updateDisplayName(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "You must be signed in." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) return { error: "Enter a display name." };
  if (displayName.length > 80) return { error: "Display name is too long (max 80 characters)." };

  const supabase = await createClient();
  const { error } = await supabase
    .schema("command")
    .from("user_profiles")
    .upsert({ id: userId, display_name: displayName }, { onConflict: "id" });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/settings/profile");
  return { notice: "Display name saved." };
}

export async function uploadAvatar(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getCommandSession();
  if (!session) return { error: "You must be signed in." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!AVATAR_MIME.has(file.type)) {
    return { error: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "Image must be 2 MB or smaller." };
  }

  const objectPath = avatarObjectPath(session.userId, extensionForMime(file.type));
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(COMMAND_AVATAR_BUCKET)
    .upload(objectPath, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error: profileError } = await supabase
    .schema("command")
    .from("user_profiles")
    .upsert(
      {
        id: session.userId,
        avatar_path: objectPath,
        avatar_updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (profileError) return { error: profileError.message };

  revalidatePath("/");
  revalidatePath("/settings/profile");
  return { notice: "Profile photo updated." };
}
