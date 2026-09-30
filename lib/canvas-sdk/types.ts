import type { MouseEvent, ReactNode, RefObject } from "react";

export type NodeStatus = "danger" | "warning" | "success" | "neutral";
export type EdgeKind = "default" | "critical" | "warning" | "active";
export type TickerTone = "danger" | "warning" | "success";
export type TickerIcon = "pulse" | "sparkles" | "trending";

export type CanvasNode = {
  id: string;
  x: number;
  y: number;
  r: number;
  status: NodeStatus;
  title: string;
  titleSize?: number;
  stats: string[];
  meta?: string;
  /** Opens this spoke on click. Omit to reset the camera. Set on the hub when it has its own drilldown. */
  spokeId?: string;
  subTab?: string;
  tooltip: {
    title: string;
    desc: string;
    hasMoreInfo?: boolean;
  };
  variant?: "bubble" | "hub";
  /** Wordmark drawn inside a centered hub. */
  logoSrc?: string;
};

export type CanvasEdge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind?: EdgeKind;
};

export type CanvasPath = {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export type CanvasBadge = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

export type SpokeContent = {
  badge: string;
  title: string;
  desc: string;
  tabs: string[];
  /** Short name for the breadcrumb and the "Next" footer. */
  navLabel?: string;
  /** Next spoke in left-to-right map order. The panel footer links here. */
  next?: string;
  render: (tabIdx: number) => ReactNode | string;
};

export type TourStep = {
  nodeId: string;
  targetX: number;
  targetY: number;
  radius: number;
  title: string;
  subtitle: string;
  category: string;
  displays: string[];
  value: string;
};

export type PriorityOwner = "intofocus" | "client" | "unassigned";
export type PrioritySeverity = "critical" | "high" | "moderate";

export type PriorityItem = {
  id: string;
  /** Plain-language headline. Keep it short enough to scan in one pass. */
  title: string;
  /** Why this sits at the top of the queue today. */
  why: string;
  /** Commercial consequence, shown as the item footer. */
  impact?: string;
  severity: PrioritySeverity;
  /** Deep-links into the drilldown when set. */
  spokeId?: string;
  subTab?: string;
  defaultOwner?: PriorityOwner;
};

export type CommandCenterSpec = {
  badge?: string;
  title: string;
  desc: string;
  /** AI-written standing summary shown above the queue. */
  summary?: string;
  items: PriorityItem[];
  /** Open the command center instead of a spoke on first paint. */
  openByDefault?: boolean;
  /** localStorage key for owner/done state. Placeholder until Supabase per-user state lands. */
  storageKey?: string;
};

export type CanvasTicker = {
  id: string;
  label: ReactNode;
  tone: TickerTone;
  spokeId?: string;
  subTab?: string;
  icon?: TickerIcon;
};

export type CanvasFilter = {
  value: string;
  label: string;
  /** Spoke to focus, or `"overview"` to reset. */
  target?: string | "overview";
};

export type SearchMatcher = {
  keywords: string[];
  spokeId: string;
};

export type CanvasHeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "default";
};

export type CanvasLegendItem = {
  status: Exclude<NodeStatus, "neutral">;
  label: string;
};

export type CanvasSpec = {
  brand: {
    name: string;
    subtitle: string;
    logoSrc?: string;
    badge?: string;
  };
  viewBox?: { w: number; h: number };
  focusScale?: number;
  drilldownWidth?: number;
  /** Width when the panel is expanded. Falls back to 68% of the viewport, capped at 1180px. */
  drilldownExpandedWidth?: number;
  /** Priority queue shown above the spokes. Omit to keep the panel spoke-only. */
  commandCenter?: CommandCenterSpec;
  /** Jargon -> plain-language definition, shown on hover in the panel copy. */
  glossary?: Record<string, string>;
  filters?: CanvasFilter[];
  tickers?: CanvasTicker[];
  search?: {
    placeholder?: string;
    matchers?: SearchMatcher[];
  };
  headerActions?: CanvasHeaderAction[];
  /** Extra header control, e.g. a view toggle. Rendered before search. */
  headerSlot?: ReactNode;
  legend?: CanvasLegendItem[];
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  paths?: CanvasPath[];
  badges?: CanvasBadge[];
  spokes: Record<string, SpokeContent>;
  /** Camera targets keyed by `spokeId` or `spokeId:subTab`. */
  focusTargets: Record<string, { x: number; y: number }>;
  tour?: TourStep[];
  showThemeToggle?: boolean;
  /** Visual system. `iom` uses the Internal Operating Maps map language. */
  appearance?: "default" | "iom";
};

export type CanvasRenderContext = {
  svgRef: RefObject<SVGSVGElement | null>;
  transform: string;
  tourActive: boolean;
  tourX: number;
  tourY: number;
  tourRadius: number;
  tourCategory: string;
  focusNode: (spokeId: string, subTab?: string) => void;
  resetView: () => void;
  overviewNonce: number;
  focusedSpokeId: string | null;
  columnLayout: boolean;
  showTooltip: (
    evt: MouseEvent,
    title: string,
    desc: string,
    hasMoreInfo?: boolean,
  ) => void;
  hideTooltip: () => void;
};

export function defineCanvas(spec: CanvasSpec): CanvasSpec {
  return spec;
}
