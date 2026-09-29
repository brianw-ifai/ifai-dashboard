import { AccountMenu } from "@/components/auth/AccountMenu";
import { FenderBrandCanvas } from "@/components/v3/FenderBrandCanvas";
import { getUserEmail } from "@/lib/supabase/server";

export default async function Home() {
  const email = await getUserEmail();
  return <FenderBrandCanvas account={email ? <AccountMenu email={email} variant="canvas" /> : null} />;
}
