"use client";

import { UserMenuDropdown } from "@/components/auth/UserMenuDropdown";
import { DashboardIomShell } from "@/components/dashboard/DashboardIomShell";
import type { CanvasUserMenu } from "@/lib/canvas-sdk/types";

type Props = CanvasUserMenu & {
  hint: string;
};

export function DashboardOrgPlaceholder({
  hint,
  email,
  displayName,
  avatarUrl,
  organizationName,
  roleLabel,
  organizations,
  activeOrganizationId,
}: Props) {
  return (
    <DashboardIomShell className="dashboard-org-shell panel-hidden">
      <div className="canvas-body dashboard-org-body">
        <div className="canvas-pointer-wash" aria-hidden="true" />
        <header className="top-header">
          <div className="brand-section">
            <div className="brand-home-btn" aria-hidden>
              <span className="brand-name">IntoFocus</span>
              <span className="brand-sub">Command</span>
            </div>
          </div>
          <div className="header-controls">
            <UserMenuDropdown
              email={email}
              displayName={displayName}
              avatarUrl={avatarUrl}
              organizationName={organizationName}
              roleLabel={roleLabel}
              organizations={organizations}
              activeOrganizationId={activeOrganizationId}
              variant="canvas"
            />
          </div>
        </header>
        <div className="dashboard-org-empty">
          <p className="dashboard-org-empty-title">Choose an organization</p>
          <p className="dashboard-org-empty-desc">{hint}</p>
        </div>
      </div>
    </DashboardIomShell>
  );
}
