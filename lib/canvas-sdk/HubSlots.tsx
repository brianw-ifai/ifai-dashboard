"use client";

import type { HubSlot, HubSlotChart, HubSlotFeed, HubSlotRole } from "@/lib/canvas-sdk/types";

const ROLE_LABEL: Record<HubSlotRole, string> = {
  gap: "Performance gap",
  opportunity: "Opportunity",
  action: "Next action",
};

type Props = {
  feeds: Record<string, HubSlotFeed>;
  bubbleId: string;
  onOpen: (spokeId: string, subTab?: string) => void;
};

function pieStyle(chart: HubSlotChart): string {
  const share = (chart.part / chart.total) * 360;
  const part = chart.part === chart.total ? "var(--accent-cyan)" : "var(--accent-cyan)";
  const rest = "color-mix(in srgb, var(--text-subtle) 55%, transparent)";
  if (chart.part <= 0) return rest;
  if (chart.part >= chart.total) return part;
  return `conic-gradient(${part} 0deg ${share}deg, ${rest} ${share}deg 360deg)`;
}

function SlotChart({ chart }: { chart: HubSlotChart }) {
  const rest = chart.total - chart.part;
  return (
    <div className="hub-slot-chart">
      <div
        className="hub-slot-pie"
        style={{ background: pieStyle(chart) }}
        role="img"
        aria-label={`${chart.part} ${chart.partLabel}. ${rest} ${chart.restLabel}. Total ${chart.total}.`}
      />
      <span>
        {chart.part} {chart.partLabel}
        <br />
        {rest} {chart.restLabel}
      </span>
    </div>
  );
}

function SlotCard({ slot, onOpen }: { slot: HubSlot; onOpen: Props["onOpen"] }) {
  return (
    <button
      type="button"
      className={`hub-slot tone-${slot.tone}`}
      data-hub-slot={slot.role}
      data-hub-slot-tab={slot.subTab ?? ""}
      onClick={() => onOpen(slot.spokeId, slot.subTab)}
    >
      <span className="hub-slot-role">{ROLE_LABEL[slot.role]}</span>
      <span className="hub-slot-status" data-hub-slot-status>
        {slot.statusWord}
      </span>
      <span className="hub-slot-figure" data-hub-slot-figure>
        {slot.figure}
      </span>
      <span className="hub-slot-label">{slot.label}</span>
      <span className="hub-slot-detail">{slot.detail}</span>
      {slot.chart ? <SlotChart chart={slot.chart} /> : null}
      <span className="hub-slot-note">{slot.note}</span>
    </button>
  );
}

export function HubSlots({ feeds, bubbleId, onOpen }: Props) {
  const feed = feeds[bubbleId] ?? feeds.hub;
  if (!feed) return null;
  return (
    <section className="hub-slots" aria-label="Bubble signals" data-hub-slots>
      <p className="hub-slot-source" data-hub-slot-source>
        {feed.title}
      </p>
      <p className="hub-slot-hint">Hover or focus a main bubble.</p>
      {feed.slots.map((slot) => (
        <SlotCard key={slot.role} slot={slot} onOpen={onOpen} />
      ))}
    </section>
  );
}
