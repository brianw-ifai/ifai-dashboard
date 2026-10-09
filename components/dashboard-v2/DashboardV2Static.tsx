"use client";

import { useEffect, useState } from "react";
import DashboardV2Loading from "@/app/(canvas)/dashboard-v2/loading";
import { apiUrl } from "@/lib/dashboard-v2/data/client-paths";
import { bundleErrors, bundleFailed, type SandboxBundle } from "@/lib/dashboard-v2/data/types";
import { BundleUnavailable } from "./BundleUnavailable";
import { DashboardV2Canvas } from "./DashboardV2Canvas";

/**
 * GitHub Pages / static export: there is no server, so the bundle the route handler would
 * serve is fetched as the JSON that scripts/dashboard-v2/export-static-data.mjs wrote at build
 * time. The loading shell shows while it loads; the unavailable section when it cannot load.
 */

type BundleBody = { ok: boolean; bundle?: SandboxBundle; error?: string | null; asOf?: string };

type State =
  | { status: "loading" }
  | { status: "ready"; bundle: SandboxBundle }
  | { status: "error"; errors: string[] };

export function DashboardV2Static() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const url = apiUrl("bundle");
    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        let body: BundleBody | null = null;
        try {
          body = (await response.json()) as BundleBody;
        } catch {
          body = null;
        }
        if (controller.signal.aborted) return;
        if (!body) {
          setState({ status: "error", errors: [`The exported bundle could not be read (status ${response.status}).`] });
          return;
        }
        if (body.bundle && !bundleFailed(body.bundle)) {
          setState({ status: "ready", bundle: body.bundle });
          return;
        }
        const errors = body.bundle ? bundleErrors(body.bundle) : [];
        if (body.error && !errors.includes(body.error)) errors.push(body.error);
        setState({ status: "error", errors: errors.length ? errors : [`The exported bundle could not be read (status ${response.status}).`] });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({ status: "error", errors: [error instanceof Error ? error.message : "The fetch failed."] });
      }
    })();
    return () => controller.abort();
  }, []);

  if (state.status === "loading") return <DashboardV2Loading />;
  if (state.status === "error") return <BundleUnavailable errors={state.errors} />;
  return <DashboardV2Canvas bundle={state.bundle} />;
}
