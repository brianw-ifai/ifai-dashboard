"use client";

import { useSyncExternalStore } from "react";
import {
  getEvidenceFocus,
  subscribeEvidenceFocus,
  type EvidenceFocus,
} from "@/lib/ai-search/evidence-focus";

const serverSnapshot = () => null;

export function useEvidenceFocus(): EvidenceFocus | null {
  return useSyncExternalStore(subscribeEvidenceFocus, getEvidenceFocus, serverSnapshot);
}
