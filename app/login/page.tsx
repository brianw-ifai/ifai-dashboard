import { AuthForm } from "@/components/auth/AuthForm";
import { safeNextPath } from "@/lib/auth/paths";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const banner =
    params.error === "confirm"
      ? "That confirmation link is invalid or has expired. Sign up again to get a new one."
      : undefined;

  return <AuthForm mode="login" next={safeNextPath(params.next)} banner={banner} />;
}
