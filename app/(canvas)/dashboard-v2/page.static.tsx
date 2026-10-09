import type { Metadata } from "next";
import { DashboardV2Static } from "@/components/dashboard-v2/DashboardV2Static";

export const metadata: Metadata = {
  title: "IntoFocus dashboard v2",
  description: "Brand readings from the sandbox schema",
};

/**
 * The static export's /dashboard-v2. scripts/prepare-static-export.mjs renames this file to
 * page.tsx for `npm run build:pages` and puts the Server Component page back afterward. It is
 * client-rendered: the bundle comes from the JSON that export-static-data.mjs wrote.
 */
export default function DashboardV2StaticPage() {
  return <DashboardV2Static />;
}
