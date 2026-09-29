import { AccountMenu } from "@/components/auth/AccountMenu";
import { IntoFocusPortal } from "@/components/intofocus-portal/IntoFocusPortal";
import { getUserEmail } from "@/lib/supabase/server";

export default async function PortalPage() {
  const email = await getUserEmail();
  return (
    <>
      {email ? <AccountMenu email={email} variant="portal" /> : null}
      <IntoFocusPortal />
    </>
  );
}
