"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/paths";

export function ConfirmPageClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");
      const next = safeNextPath(params.get("next"), window.location.origin);

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as "email",
          token_hash: tokenHash,
        });
        if (!error) {
          router.replace(next);
          return;
        }
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
      }

      router.replace("/login?error=confirm");
    })();
  }, [params, router]);

  return (
    <div style={{ padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      Confirming your account…
    </div>
  );
}
