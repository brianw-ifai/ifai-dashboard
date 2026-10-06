import { Suspense } from "react";
import { ConfirmPageClient } from "@/app/auth/confirm/ConfirmPageClient";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Confirming your account…</div>}>
      <ConfirmPageClient />
    </Suspense>
  );
}
