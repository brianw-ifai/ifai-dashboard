import { logout } from "@/app/auth/actions";

export function AccountMenu({
  email,
  variant,
}: {
  email: string;
  variant: "canvas" | "portal";
}) {
  if (variant === "canvas") {
    return (
      <form action={logout} className="flex items-center gap-1.5">
        <span className="hdr-btn max-w-[180px] truncate" style={{ cursor: "default" }} title={email}>
          {email}
        </span>
        <button className="hdr-btn" type="submit">
          Log out
        </button>
      </form>
    );
  }

  return (
    <form
      action={logout}
      className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full border border-[#e8e8ec] bg-white px-3 py-1.5 text-[12px] shadow-sm"
    >
      <span className="max-w-[200px] truncate font-medium text-[#5c5c66]" title={email}>
        {email}
      </span>
      <button
        type="submit"
        className="rounded-full border border-[#e8e8ec] px-2.5 py-1 font-semibold text-[#16161a]"
      >
        Log out
      </button>
    </form>
  );
}
