import { DashboardAuthView } from "@/components/dashboard/DashboardAuthView";
import { DashboardOrgPlaceholder } from "@/components/dashboard/DashboardOrgPlaceholder";
import { FenderBrandCanvas } from "@/components/v3/FenderBrandCanvas";
import { hasGuestDashboardAccess } from "@/lib/auth/guest-dashboard";
import { resolveActiveOrganization } from "@/lib/command/active-organization";
import { commandSessionToUserMenu, getCommandSession } from "@/lib/command/session";
import { safeNextPath } from "@/lib/auth/paths";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; auth?: string }>;
}) {
  const params = await searchParams;
  const session = await getCommandSession();

  if (!session) {
    if (await hasGuestDashboardAccess()) {
      return <FenderBrandCanvas />;
    }

    const banner =
      params.error === "confirm"
        ? "That confirmation link is invalid or has expired. Sign up again to get a new one."
        : undefined;
    const mode = params.auth === "signup" ? "signup" : "login";
    return (
      <DashboardAuthView
        mode={mode}
        next={safeNextPath(params.next)}
        banner={banner}
      />
    );
  }

  const activeOrganization = resolveActiveOrganization(session);
  const userMenu = commandSessionToUserMenu(session, activeOrganization);

  if (activeOrganization?.slug === "fender") {
    return (
      <FenderBrandCanvas userMenu={userMenu} viewerId={session.userId} />
    );
  }

  const hint =
    userMenu.organizations.length > 1
      ? "Open your profile menu and pick which organization you want to view."
      : userMenu.organizations.length === 1
        ? "This organization does not have a map view yet."
        : "You are not assigned to a client organization yet.";

  return (
    <DashboardOrgPlaceholder
      {...userMenu}
      hint={hint}
    />
  );
}
