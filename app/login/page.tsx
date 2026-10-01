import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/paths";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const query = new URLSearchParams();
  if (next !== "/") query.set("next", next);
  if (params.error) query.set("error", params.error);
  const suffix = query.size ? `?${query.toString()}` : "";
  redirect(`/${suffix}`);
}
