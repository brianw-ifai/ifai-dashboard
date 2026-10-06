import { buildMapLeakageHtml } from "@/components/v3/map-channel-drilldown";
import {
  fillRetailSlots,
  mapSatellite,
  retailBubble,
  type PortfolioRetailReading,
} from "@/components/v3/portfolio-retail-reading";
import type { CanvasSpec } from "@/lib/canvas-sdk/types";

const MAP_TAB_INDEX = 2;

export function applyPortfolioRetailReading(
  spec: CanvasSpec,
  reading: PortfolioRetailReading,
): CanvasSpec {
  const bubble = retailBubble(reading);
  const satellite = mapSatellite(reading);
  const ecommerce = spec.spokes.ecommerce;
  const hub = spec.spokes.hub;

  return {
    ...spec,
    commandCenter: spec.commandCenter
      ? {
          ...spec.commandCenter,
          summary: spec.commandCenter.summary
            ? fillRetailSlots(spec.commandCenter.summary, reading)
            : undefined,
          items: spec.commandCenter.items.map((item) => ({
            ...item,
            why: fillRetailSlots(item.why, reading),
            impact: item.impact ? fillRetailSlots(item.impact, reading) : undefined,
          })),
        }
      : undefined,
    nodes: spec.nodes?.map((node) => {
      if (node.id === "spoke-retail") {
        return {
          ...node,
          stats: [bubble.statA, bubble.statB],
          meta: bubble.meta,
          tooltip: { title: bubble.tooltipTitle, desc: bubble.tooltipDesc },
        };
      }
      if (node.id === "sat-map") {
        return {
          ...node,
          stats: [...satellite.stats],
          meta: satellite.meta,
          tooltip: { ...node.tooltip, desc: satellite.tooltipDesc },
        };
      }
      return node;
    }),
    spokes: {
      ...spec.spokes,
      ecommerce: ecommerce
        ? {
            ...ecommerce,
            desc: fillRetailSlots(ecommerce.desc, reading),
            render: (tabIdx) => {
              if (tabIdx === MAP_TAB_INDEX) return buildMapLeakageHtml(reading);
              const rendered = ecommerce.render(tabIdx);
              return typeof rendered === "string" ? fillRetailSlots(rendered, reading) : rendered;
            },
          }
        : ecommerce,
      hub: hub
        ? {
            ...hub,
            render: (tabIdx) => {
              const rendered = hub.render(tabIdx);
              return typeof rendered === "string" ? fillRetailSlots(rendered, reading) : rendered;
            },
          }
        : hub,
    },
    tour: spec.tour?.map((step) => ({
      ...step,
      displays: step.displays.map((line) => fillRetailSlots(line, reading)),
    })),
  };
}
