import type { Metadata } from "next";
import { connection } from "next/server";
import { BundleUnavailableFor } from "@/components/dashboard-v2/BundleUnavailable";
import { DashboardV2Canvas } from "@/components/dashboard-v2/DashboardV2Canvas";
import { loadBundle } from "@/lib/dashboard-v2/data/reads";
import { bundleFailed } from "@/lib/dashboard-v2/data/types";

export const metadata: Metadata = {
  title: "IntoFocus dashboard v2",
  description: "Brand readings from the sandbox schema",
};

/**
 * Server Component. `connection()` opts the page into dynamic rendering so every request reads
 * the sandbox fresh and the sandbox credentials are read at runtime, on the server only.
 *
 * The static export (GitHub Pages) cannot run this file; scripts/prepare-static-export.mjs swaps
 * in page.static.tsx, which fetches the exported bundle JSON on the client instead.
 */
export default async function DashboardV2Page() {
  await connection();
  const bundle = await loadBundle();

  if (bundleFailed(bundle)) {
    return <BundleUnavailableFor bundle={bundle} />;
  }

  return <DashboardV2Canvas bundle={bundle} />;
}
