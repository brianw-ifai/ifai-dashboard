"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ACTIVE_ORGANIZATION_SETTINGS_KEY,
  membershipForOrganization,
} from "@/lib/command/active-organization";
import { getCommandSession } from "@/lib/command/session";
import { createClient, getAuthUserId } from "@/lib/supabase/server";

export async function setActiveOrganization(formData: FormData) {
  const userId = await getAuthUserId();
  if (!userId) redirect("/");

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  if (!organizationId) return;

  const session = await getCommandSession();
  if (!session) redirect("/");

  const membership = membershipForOrganization(session.memberships, organizationId);
  if (!membership || membership.organization.isPlatformOrg) return;

  const supabase = await createClient();
  const settings = {
    ...session.profile.settings,
    [ACTIVE_ORGANIZATION_SETTINGS_KEY]: organizationId,
  };

  const { error } = await supabase
    .schema("command")
    .from("user_profiles")
    .upsert({ id: userId, settings }, { onConflict: "id" });

  if (error) return;

  revalidatePath("/");
  revalidatePath("/settings/profile");
}
