import type { Metadata } from "next";
import { connection } from "next/server";
import { DashboardV2Canvas } from "@/components/dashboard-v2/DashboardV2Canvas";
import { loadBundle } from "@/lib/dashboard-v2/data/reads";
import { bundleErrors, bundleFailed } from "@/lib/dashboard-v2/data/types";

export const metadata: Metadata = {
  title: "IntoFocus dashboard v2",
  description: "Brand readings from the sandbox schema",
};

/**
 * Server Component. `connection()` opts the page into dynamic rendering so every request reads
 * the sandbox fresh and the sandbox credentials are read at runtime, on the server only.
 */
export default async function DashboardV2Page() {
  await connection();
  const bundle = await loadBundle();

  if (bundleFailed(bundle)) {
    return (
      <section className="dv2-unavailable" role="status" style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>The reading is unavailable</h1>
        <p style={{ margin: 0 }}>Every read of the sandbox failed, so there is nothing to show. The reasons:</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {bundleErrors(bundle).map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    );
  }

  return <DashboardV2Canvas bundle={bundle} />;
}
