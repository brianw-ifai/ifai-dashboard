"use client";

import "@/components/sdk/sdk-view-toggle.css";
import { BookOpen, Waypoints } from "lucide-react";
import Link from "next/link";

export type SdkView = "canvas" | "docs";

export function SdkViewToggle({ view }: { view: SdkView }) {
  return (
    <div className="sdk-view-toggle" role="tablist" aria-label="SDK view">
      <Link href="/sdk" role="tab" aria-selected={view === "canvas"} scroll={false}>
        <Waypoints size={12} />
        Canvas
      </Link>
      <Link href="/sdk/docs" role="tab" aria-selected={view === "docs"}>
        <BookOpen size={12} />
        Docs
      </Link>
    </div>
  );
}
