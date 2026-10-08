"use client";

import { useCallback, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { NodeStatus } from "@/lib/canvas-sdk/types";
import { labelFor } from "@/lib/dashboard-v2/reading/labels";
import type { AllSelections } from "@/lib/dashboard-v2/selectors/index";
import { Explainer, type ExplainerTarget } from "./Explainer";

/**
 * An inline expandable evidence region (no modal). A chart mark, a reading card, a status chip,
 * or an estimate toggles it with aria-expanded; the drawer sits right under the surface it
 * explains and holds the registry row behind the figure.
 */

export function ExplainerDrawer({
  all,
  target,
  id,
  onClose,
}: {
  all: AllSelections;
  target: ExplainerTarget | null;
  id: string;
  onClose: () => void;
}) {
  if (!target) return null;
  return (
    <div className="dv2-drawer content-box" id={id} role="region" aria-label="Evidence behind this figure" data-testid="explainer-drawer">
      <div className="dv2-drawer-head">
        <span className="dv2-drawer-kicker">Evidence</span>
        <button type="button" className="segmented-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <Explainer all={all} target={target} />
    </div>
  );
}

/** One open target at a time, with a stable drawer id for aria-controls. */
export function useDrawer() {
  const id = useId();
  const drawerId = `dv2-drawer-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [open, setOpen] = useState<{ key: string; target: ExplainerTarget } | null>(null);
  const toggle = useCallback((nextKey: string, nextTarget: ExplainerTarget) => {
    setOpen((current) => (current?.key === nextKey ? null : { key: nextKey, target: nextTarget }));
  }, []);
  const close = useCallback(() => setOpen(null), []);
  return { drawerId, target: open?.target ?? null, openKey: open?.key ?? null, toggle, close };
}

/** Keyboard activation for a non-button element acting as a button (an SVG mark). */
export function activateOnKey(handler: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  };
}

export type ReadingCardModel = {
  id: string;
  registryId: string;
  label: string;
  value: string;
  sub: string;
  tone: NodeStatus;
  target?: Partial<ExplainerTarget>;
};

function toneClass(tone: NodeStatus): string {
  if (tone === "danger" || tone === "warning" || tone === "success") return ` tone-${tone}`;
  return "";
}

function statusWord(tone: NodeStatus, value: string): string {
  if (value.startsWith("unavailable")) return labelFor("reading_status", "unavailable");
  if (tone === "danger") return "needs attention";
  if (tone === "warning") return "watch";
  if (tone === "success") return "on track";
  return "no threshold";
}

function chipTone(tone: NodeStatus): string {
  if (tone === "danger") return "tag-danger";
  if (tone === "warning") return "tag-warning";
  if (tone === "success") return "tag-success";
  return "tag-neutral";
}

/** A metric card that is a button: it opens the registry row behind its figure. */
export function ReadingCard({
  card,
  open,
  controls,
  onToggle,
}: {
  card: ReadingCardModel;
  open: boolean;
  controls: string;
  onToggle: () => void;
}) {
  return (
    <div className={`metric-card-sm dv2-reading-card${open ? " dv2-reading-card-open" : ""}`} data-registry-id={card.registryId} data-card-id={card.id}>
      <button type="button" className="dv2-card-btn" aria-expanded={open} aria-controls={controls} onClick={onToggle}>
        <span className="metric-card-label">{card.label}</span>
        <span className={`metric-card-val${toneClass(card.tone)}`}>{card.value}</span>
        <span className="metric-card-sub">{card.sub}</span>
        <span className={`tag-badge dv2-status-chip ${chipTone(card.tone)}`}>{statusWord(card.tone, card.value)}</span>
      </button>
    </div>
  );
}

/** A grid of reading cards sharing one drawer, which opens full width under the card row. */
export function ReadingCards({ all, cards, children }: { all: AllSelections; cards: ReadingCardModel[]; children?: ReactNode }) {
  const drawer = useDrawer();
  return (
    <div className="metric-grid-2 dv2-card-grid">
      {cards.map((card) => (
        <ReadingCard
          key={card.id}
          card={card}
          open={drawer.openKey === card.id}
          controls={drawer.drawerId}
          onToggle={() => drawer.toggle(card.id, { registryId: card.registryId, ...card.target })}
        />
      ))}
      {drawer.target ? (
        <div className="dv2-card-drawer-slot">
          <ExplainerDrawer all={all} target={drawer.target} id={drawer.drawerId} onClose={drawer.close} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
