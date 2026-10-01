import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/paths";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const query = new URLSearchParams({ auth: "signup" });
  if (next !== "/") query.set("next", next);
  redirect(`/?${query.toString()}`);
}
