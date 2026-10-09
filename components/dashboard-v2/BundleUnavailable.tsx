import { bundleErrors, type SandboxBundle } from "@/lib/dashboard-v2/data/types";

/**
 * The page when every read of the bundle failed. Shared by the Server Component page (normal
 * mode) and the client loader on the static export, so both say the same thing.
 */
export function BundleUnavailable({ errors }: { errors: string[] }) {
  return (
    <section className="dv2-unavailable" role="status" style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto", display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>The reading is unavailable</h1>
      <p style={{ margin: 0 }}>Every read of the sandbox failed, so there is nothing to show. The reasons:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </section>
  );
}

export function BundleUnavailableFor({ bundle }: { bundle: SandboxBundle }) {
  return <BundleUnavailable errors={bundleErrors(bundle)} />;
}
