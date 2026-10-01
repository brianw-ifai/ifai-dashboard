import type {
  CommandMembership,
  CommandOrganization,
  CommandSession,
  CommandUserProfile,
} from "@/lib/command/types";

export const ACTIVE_ORGANIZATION_SETTINGS_KEY = "activeOrganizationId";

export function clientMemberships(
  memberships: CommandMembership[],
): CommandMembership[] {
  return memberships.filter((m) => !m.organization.isPlatformOrg);
}

export function membershipForOrganization(
  memberships: CommandMembership[],
  organizationId: string,
): CommandMembership | undefined {
  return memberships.find((m) => m.organization.id === organizationId);
}

function activeOrganizationIdFromSettings(
  profile: CommandUserProfile,
): string | null {
  const raw = profile.settings[ACTIVE_ORGANIZATION_SETTINGS_KEY];
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/** Org the user is viewing; must be one of their active memberships. */
export function resolveActiveOrganization(
  session: CommandSession,
): CommandOrganization | null {
  const clients = clientMemberships(session.memberships);
  const storedId = activeOrganizationIdFromSettings(session.profile);

  if (storedId) {
    const match = clients.find((m) => m.organization.id === storedId);
    if (match) return match.organization;
  }

  if (clients.length === 1) return clients[0].organization;
  return null;
}

export function roleForOrganization(
  session: CommandSession,
  organization: CommandOrganization | null,
): CommandMembership["role"] | null {
  if (!organization) return null;
  return membershipForOrganization(session.memberships, organization.id)?.role ?? null;
}
