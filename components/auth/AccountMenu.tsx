import { UserMenuDropdown } from "@/components/auth/UserMenuDropdown";
import type { CanvasUserMenu } from "@/lib/canvas-sdk/types";

export function AccountMenu(props: CanvasUserMenu & { variant: "canvas" | "portal" }) {
  return <UserMenuDropdown {...props} />;
}
