"use client";

import { PortalView } from "@/components/intofocus-portal/PortalView";
import {
  usePortalLogic,
  type PortalProps,
} from "@/lib/intofocus-portal/usePortalLogic";
import { Suspense } from "react";

function IntoFocusPortalInner(props: PortalProps) {
  const v = usePortalLogic(props);
  return <PortalView v={v} />;
}

export function IntoFocusPortal(props: PortalProps = {}) {
  return (
    <Suspense fallback={null}>
      <IntoFocusPortalInner {...props} />
    </Suspense>
  );
}
