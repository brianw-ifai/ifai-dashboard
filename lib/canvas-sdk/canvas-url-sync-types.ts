import type { CanvasPanelLayout } from "@/lib/canvas-sdk/canvas-url-state";

export type CanvasUrlSyncSnapshot = {
  spokeId: string | null;
  activeTab: number;
  tabLabels: string[];
  panelView: "spoke" | "command";
  panelLayout: CanvasPanelLayout;
  tourActive: boolean;
  tourStep: number;
  tourSuspended: boolean;
  menuOpen: boolean;
  profileOpen: boolean;
};
