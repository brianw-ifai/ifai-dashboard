import {
  clientMemberships,
  resolveActiveOrganization,
  roleForOrganization,
} from "@/lib/command/active-organization";
import { COMMAND_ROLE_LABELS } from "@/lib/command/constants";
import { signedAvatarUrl } from "@/lib/command/avatar";
import type {
  CommandMembership,
  CommandOrganization,
  CommandSession,
  CommandUserMenu,
  CommandUserProfile,
  OrganizationRole,
} from "@/lib/command/types";
import { createClient, getAuthUserId, getUserEmail } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  settings: Record<string, unknown> | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  is_platform_org: boolean;
};

type MembershipRow = {
  id: string;
  role: OrganizationRole;
  status: string;
  organizations: OrganizationRow | OrganizationRow[] | null;
};

function membershipOrganization(row: MembershipRow): OrganizationRow | null {
  const org = row.organizations;
  if (!org) return null;
  return Array.isArray(org) ? (org[0] ?? null) : org;
}

function mapProfile(row: ProfileRow): CommandUserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    settings: row.settings ?? {},
  };
}

function pickPrimaryMembership(
  memberships: CommandMembership[],
): CommandMembership | null {
  const clientMemberships = memberships.filter(
    (membership) => !membership.organization.isPlatformOrg,
  );
  if (clientMemberships.length === 1) return clientMemberships[0];
  if (memberships.length === 1) return memberships[0];
  return null;
}

function mapMembership(row: MembershipRow): CommandMembership | null {
  const org = membershipOrganization(row);
  if (!org) return null;
  return {
    id: row.id,
    role: row.role,
    status: row.status as CommandMembership["status"],
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      isPlatformOrg: org.is_platform_org,
    },
  };
}

function e2eFenderSession(): CommandSession {
  const organization = {
    id: "e2e-fender",
    name: "Fender",
    slug: "fender",
    isPlatformOrg: false,
  };
  return {
    userId: "e2e-user",
    email: "e2e@intofocus.ai",
    profile: {
      id: "e2e-user",
      displayName: "E2E",
      avatarPath: null,
      settings: {},
    },
    memberships: [
      {
        id: "e2e-membership",
        role: "intofocus_admin",
        status: "active",
        organization,
      },
    ],
    primaryOrganization: organization,
    primaryRole: "intofocus_admin",
    isIntoFocusAdmin: false,
    avatarSignedUrl: null,
  };
}

export async function getCommandSession(): Promise<CommandSession | null> {
  if (
    process.env.E2E_AUTH_BYPASS === "1" &&
    process.env.NODE_ENV !== "production"
  ) {
    return e2eFenderSession();
  }

  const [userId, email] = await Promise.all([getAuthUserId(), getUserEmail()]);
  if (!userId || !email) return null;

  const supabase = await createClient();

  const { data: profileRow, error: profileError } = await supabase
    .schema("command")
    .from("user_profiles")
    .select("id, display_name, avatar_path, settings")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return null;

  const profile = profileRow
    ? mapProfile(profileRow as ProfileRow)
    : {
        id: userId,
        displayName: null,
        avatarPath: null,
        settings: {},
      };

  const { data: membershipRows, error: membershipError } = await supabase
    .schema("command")
    .from("organization_memberships")
    .select(
      "id, role, status, organizations ( id, name, slug, is_platform_org )",
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) return null;

  const memberships =
    (membershipRows as MembershipRow[] | null)
      ?.map(mapMembership)
      .filter((row): row is CommandMembership => row !== null) ?? [];

  const primary = pickPrimaryMembership(memberships);
  const isIntoFocusAdmin = memberships.some(
    (m) => m.role === "intofocus_admin" && m.organization.isPlatformOrg,
  );
  const avatarSignedUrl = await signedAvatarUrl(profile.avatarPath);

  return {
    userId,
    email,
    profile,
    memberships,
    primaryOrganization: primary?.organization ?? null,
    primaryRole: primary?.role ?? null,
    isIntoFocusAdmin,
    avatarSignedUrl,
  };
}

export function commandSessionToUserMenu(
  session: CommandSession,
  activeOrganization: CommandOrganization | null = resolveActiveOrganization(session),
): CommandUserMenu {
  const role = roleForOrganization(session, activeOrganization);
  const organizations = clientMemberships(session.memberships).map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
  }));

  return {
    email: session.email,
    displayName: session.profile.displayName,
    avatarUrl: session.avatarSignedUrl,
    organizationName: activeOrganization?.name ?? null,
    roleLabel: role ? COMMAND_ROLE_LABELS[role] : null,
    organizations,
    activeOrganizationId: activeOrganization?.id ?? null,
  };
}
