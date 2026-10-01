"use client";

import { useEffect, type RefObject } from "react";

/** Dotted-underline jargon marks (see panel-interactions annotateGlossary). */
export const DEFINITION_TERM_SELECTOR = ".ifai-term[data-ifai-tooltip-desc]";

export function applyDefinitionTooltipAttrs(
  element: HTMLElement,
  title: string,
  description: string,
) {
  element.classList.add("ifai-term");
  element.dataset.ifaiTooltipTitle = title;
  element.dataset.ifaiTooltipDesc = description;
  element.tabIndex = 0;
  element.setAttribute("aria-label", `${title}: ${description}`);
}

type Options = {
  enabled: boolean;
  isBlocked: () => boolean;
  onShow: (target: Element) => void;
  onHide: () => void;
  /** Optional scope; defaults to document (covers portaled modals). */
  rootRef?: RefObject<HTMLElement | null>;
};

export function useDefinitionTooltips({
  enabled,
  isBlocked,
  onShow,
  onHide,
  rootRef,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const root = rootRef?.current ?? document;

    const termFromEvent = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      const term = target.closest(DEFINITION_TERM_SELECTOR);
      return term instanceof Element ? term : null;
    };

    const onPointerOver = (event: Event) => {
      if (isBlocked()) return;
      const term = termFromEvent(event);
      if (term) onShow(term);
    };

    const onPointerOut = (event: Event) => {
      const term = termFromEvent(event);
      if (!term) return;
      const related =
        event instanceof MouseEvent ? event.relatedTarget : null;
      if (related instanceof Node && term.contains(related)) return;
      onHide();
    };

    const onFocusIn = (event: Event) => {
      if (isBlocked()) return;
      const term = termFromEvent(event);
      if (term) onShow(term);
    };

    const onFocusOut = (event: Event) => {
      const term = termFromEvent(event);
      if (!term) return;
      const related =
        event instanceof FocusEvent ? event.relatedTarget : null;
      if (related instanceof Node && term.contains(related)) return;
      onHide();
    };

    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("pointerout", onPointerOut);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);

    return () => {
      root.removeEventListener("pointerover", onPointerOver);
      root.removeEventListener("pointerout", onPointerOut);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [enabled, isBlocked, onHide, onShow, rootRef]);
}
