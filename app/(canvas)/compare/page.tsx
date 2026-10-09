import type { Metadata } from "next";
import { CompareView } from "@/components/dashboard-v2/CompareView";

export const metadata: Metadata = {
  title: "Compare dashboards",
  description: "The current dashboard and dashboard v2, one at a time or side by side",
};

/** Works in both modes: it reads no server data, only links to the two dashboards. */
export default function ComparePage() {
  return <CompareView />;
}
