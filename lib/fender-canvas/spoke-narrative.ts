import type { ReactNode } from "react";
import narrative from "@/data/fender-v3-spec.json";
import type { SpokeDefinition, SpokeId } from "@/components/v3/spoke-data-types";
import { bindCopy } from "@/lib/fender-canvas/template-vars";

type NarrativeSpoke = {
  badge: string;
  title: string;
  desc: string;
  tabs: string[];
  navLabel: string;
  next: SpokeId;
  tabTemplates: string[];
};

/** Static narrative config (templates use `{metric_id}` placeholders filled at render). */
export function buildNarrativeSpokes(): Record<SpokeId, SpokeDefinition> {
  const out = {} as Record<SpokeId, SpokeDefinition>;
  const spokes = narrative.spokes as Record<SpokeId, NarrativeSpoke>;

  for (const id of Object.keys(spokes) as SpokeId[]) {
    const row = spokes[id];
    out[id] = {
      badge: row.badge,
      title: row.title,
      desc: row.desc,
      tabs: row.tabs,
      navLabel: row.navLabel,
      next: row.next,
      render: (tabIdx: number): ReactNode | string => row.tabTemplates[tabIdx] ?? "",
    };
  }
  return out;
}

export function bindNarrativeSpoke(
  spoke: SpokeDefinition,
  vars: Record<string, string>,
): SpokeDefinition {
  return {
    ...spoke,
    desc: bindCopy(spoke.desc, vars),
    tabs: spoke.tabs.map((t) => bindCopy(t, vars)),
    render: (tabIdx) => {
      const template = spoke.render(tabIdx);
      if (typeof template !== "string") return template;
      return bindCopy(template, vars);
    },
  };
}
