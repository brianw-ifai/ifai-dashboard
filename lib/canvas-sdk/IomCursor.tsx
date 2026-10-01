"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

const INTERACTIVE_SELECTOR = [
  "button:not(:disabled)",
  "a[href]",
  "[role='button']:not([aria-disabled='true'])",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "label",
  ".graph-node",
  ".hud-btn-group button",
  ".panel-toggle",
  ".drilldown-hide-btn",
  ".brand-home-btn",
  ".filter-selector",
  ".hdr-btn",
  ".user-menu-trigger",
  ".command-center button",
  ".tour-modal button",
  ".tour-dot",
  ".strategy-roadmap-btn",
  ".panel-tab",
  ".search-input-wrap",
  ".profile-modal-root button",
  ".profile-modal-root input",
  ".profile-modal-root select",
  ".profile-modal-root textarea",
  ".profile-modal-root label",
  ".auth-form-card",
  ".auth-form-card button",
  ".auth-form-card input",
  ".auth-form-card label",
  ".auth-form-card a",
].join(", ");

const CLICK_MS = 420;

/** Profile modal portals to document.body; include when opened from the IOM canvas. */
const CANVAS_PROFILE_MODAL = ".profile-modal-root.profile-modal-theme-canvas";

function isFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine) and (hover: hover)").matches;
}

function targetIsInteractive(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function pointInRect(x: number, y: number, rect: DOMRect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function pointerInActiveRegion(event: PointerEvent, root: HTMLElement | null) {
  const { clientX, clientY } = event;
  if (root) {
    const rootRect = root.getBoundingClientRect();
    if (pointInRect(clientX, clientY, rootRect)) return true;
  }
  const modal = document.querySelector(CANVAS_PROFILE_MODAL);
  if (modal instanceof HTMLElement) {
    return pointInRect(clientX, clientY, modal.getBoundingClientRect());
  }
  return false;
}

type Props = {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
};

export function IomCursor({ rootRef, enabled }: Props) {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!enabled || !isFinePointer()) return;

    const html = document.documentElement;
    html.classList.add("iom-custom-cursor-active");

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const root = rootRef.current;
      if (!pointerInActiveRegion(event, root)) {
        setVisible(false);
        setHover(false);
        return;
      }
      setPos({ x: event.clientX, y: event.clientY });
      setVisible(true);
      setHover(targetIsInteractive(event.target));
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const root = rootRef.current;
      if (!pointerInActiveRegion(event, root)) return;
      setClicking(true);
      setBurstKey((key) => key + 1);
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(() => setClicking(false), CLICK_MS);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    return () => {
      html.classList.remove("iom-custom-cursor-active");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, [enabled, rootRef]);

  if (!mounted || !enabled || !visible) return null;

  return createPortal(
    <div
      className="iom-cursor-portal"
      aria-hidden
      data-hover={hover ? "true" : undefined}
      data-click={clicking ? "true" : undefined}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
    >
      <span className="iom-cursor-burst" key={burstKey} />
      <span className="iom-cursor-reticle">
        <span className="iom-cursor-ring" />
        <span className="iom-cursor-core" />
        <span className="iom-cursor-tick iom-cursor-tick-n" />
        <span className="iom-cursor-tick iom-cursor-tick-e" />
        <span className="iom-cursor-tick iom-cursor-tick-s" />
        <span className="iom-cursor-tick iom-cursor-tick-w" />
      </span>
    </div>,
    document.body,
  );
}
