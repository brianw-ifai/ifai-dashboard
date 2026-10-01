import { AccountMenu } from "@/components/auth/AccountMenu";
import { IntoFocusPortal } from "@/components/intofocus-portal/IntoFocusPortal";
import { commandSessionToUserMenu, getCommandSession } from "@/lib/command/session";

export default async function PortalPage() {
  const session = await getCommandSession();
  const userMenu = session ? commandSessionToUserMenu(session) : undefined;
  return (
    <>
      {userMenu ? <AccountMenu {...userMenu} variant="portal" /> : null}
      <IntoFocusPortal />
    </>
  );
}
