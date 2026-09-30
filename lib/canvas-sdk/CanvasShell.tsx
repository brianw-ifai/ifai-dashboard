"use client";

import "@/lib/canvas-sdk/canvas-sdk.css";
import "@/lib/canvas-sdk/iom-theme.css";
import { CommandCenter } from "@/lib/canvas-sdk/CommandCenter";
import { MetricWidgets } from "@/lib/canvas-sdk/MetricWidgets";
import { usePanelInteractions } from "@/lib/canvas-sdk/panel-interactions";
import type {
  CanvasRenderContext,
  CanvasSpec,
  TickerIcon,
} from "@/lib/canvas-sdk/types";
import { IOM_GRAPH_RAIL_PX } from "@/lib/canvas-sdk/column-layout";
import { useCanvasCamera } from "@/lib/canvas-sdk/useCanvasCamera";
import {
  ChevronLeft,
  ChevronsRight,
  Compass,
  ExternalLink,
  Layers,
  Layout,
  ListChecks,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  Plus,
  Route,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

const DEFAULT_DRILLDOWN_WIDTH = 620;
const DEFAULT_FOCUS_SCALE = 1.55;
const EXPANDED_WIDTH_CAP = 1180;
const EXPANDED_WIDTH_RATIO = 0.68;
/** Never squeeze the graph rail below this. */
const MIN_GRAPH_RAIL = 260;
/** Footprint of .tour-modal-card (left + width + gutter), so the spotlight clears it. */
const TOUR_CARD_ZONE = 36 + 440 + 24;
/** Below this much clear space the offset would push the node off-screen. */
const TOUR_CARD_MIN_ROOM = 240;

type PanelLayout = "wide" | "narrow" | "hidden";

type TooltipState = {
  title: string;
  desc: string;
  x: number;
  y: number;
  hasMoreInfo: boolean;
};

type Props = {
  spec: CanvasSpec;
  children: ReactNode | ((ctx: CanvasRenderContext) => ReactNode);
};

function tickerIcon(kind?: TickerIcon) {
  if (kind === "sparkles") return <Sparkles size={12} />;
  if (kind === "trending") return <TrendingUp size={12} />;
  if (kind === "pulse") return <span className="pulse-dot" />;
  return null;
}

export function CanvasShell({ spec, children }: Props) {
  const baseDrilldownWidth = spec.drilldownWidth ?? DEFAULT_DRILLDOWN_WIDTH;
  const focusScale = spec.focusScale ?? DEFAULT_FOCUS_SCALE;
  const tourSteps = useMemo(() => spec.tour ?? [], [spec.tour]);
  const commandCenter = spec.commandCenter;
  const legend = spec.legend ?? [
    { status: "danger" as const, label: "Critical" },
    { status: "warning" as const, label: "At Risk" },
    { status: "success" as const, label: "On Track" },
  ];

  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drilldownBodyRef = useRef<HTMLDivElement>(null);
  const tourActiveRef = useRef(false);
  const tourSuspendedRef = useRef(false);
  const activeSpokeRef = useRef<string | null>(null);
  const tourStepRef = useRef(0);
  const panelViewRef = useRef<"spoke" | "command">("spoke");
  const tourOverlayRef = useRef<HTMLDivElement>(null);
  const columnLayoutRef = useRef(false);

  const { pan, transform, applyTransform, framePoint, frameOverview, zoomBy } =
    useCanvasCamera({
      viewBox: spec.viewBox,
      viewportRef,
      svgRef,
    });

  const iom = spec.appearance === "iom";
  const roadmapOnGraph = useMemo(
    () => Boolean(spec.nodes?.some((node) => node.spokeId === "roadmap")),
    [spec.nodes],
  );
  const [lightTheme, setLightTheme] = useState(!iom);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [activeSpoke, setActiveSpoke] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  /** Set when the tour is parked behind an open drilldown rather than ended. */
  const [tourSuspended, setTourSuspended] = useState(false);
  /** Step the user abandoned the tour on, so the header can offer a resume. */
  const [tourProgress, setTourProgress] = useState<number | null>(null);
  const [panelLayout, setPanelLayout] = useState<PanelLayout>(iom ? "hidden" : "wide");
  const panelLayoutBeforeHide = useRef<Exclude<PanelLayout, "hidden">>("wide");
  const [panelView, setPanelView] = useState<"spoke" | "command">(
    !iom && commandCenter?.openByDefault ? "command" : "spoke",
  );
  const [windowWidth, setWindowWidth] = useState(0);

  /* These refs exist so the document-level pointer/key listeners can read the
     latest values without being re-registered on every change. They are written
     after commit, which is before any user event can read them. */
  useEffect(() => {
    activeSpokeRef.current = activeSpoke;
    tourStepRef.current = tourStep;
    tourSuspendedRef.current = tourSuspended;
    panelViewRef.current = panelView;
  }, [activeSpoke, panelView, tourStep, tourSuspended]);

  useEffect(() => {
    let timer = 0;
    const onResize = () => {
      // Width eases on the expand toggle. A window resize should track the
      // viewport immediately, so the transition is suppressed until it settles.
      rootRef.current?.classList.add("is-resizing");
      setWindowWidth(window.innerWidth);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        rootRef.current?.classList.remove("is-resizing");
      }, 150);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      rootRef.current?.classList.remove("is-resizing");
    };
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const root = rootRef.current;
    if (!header || !root) return;

    const syncHeaderHeight = () => {
      root.style.setProperty("--canvas-header-height", `${header.offsetHeight}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Single source of truth for the panel width: CSS and the camera offset both read it.
  const tourOverlayVisibleForLayout = tourActive && !tourSuspended;
  const panelOpenForLayout =
    (panelView === "command" && Boolean(commandCenter)) ||
    Boolean(activeSpoke && spec.spokes[activeSpoke]);
  const columnLayout =
    iom &&
    panelOpenForLayout &&
    panelLayout !== "hidden" &&
    !tourOverlayVisibleForLayout;
  columnLayoutRef.current = columnLayout;

  useEffect(() => {
    if (!columnLayout) return;
    pan.current.isPanning = false;
    frameOverview();
  }, [columnLayout, frameOverview, pan]);

  const [columnScrollFade, setColumnScrollFade] = useState({ top: false, bottom: false });

  const syncColumnScrollFade = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    if (maxScroll <= 2) {
      setColumnScrollFade({ top: false, bottom: false });
      return;
    }
    setColumnScrollFade({
      top: viewport.scrollTop > 2,
      bottom: viewport.scrollTop < maxScroll - 2,
    });
  }, []);

  useEffect(() => {
    if (!columnLayout) {
      setColumnScrollFade({ top: false, bottom: false });
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) return;

    syncColumnScrollFade();
    viewport.addEventListener("scroll", syncColumnScrollFade, { passive: true });
    const resizeObserver = new ResizeObserver(syncColumnScrollFade);
    resizeObserver.observe(viewport);
    const list = viewport.querySelector(".column-bubble-list");
    if (list) resizeObserver.observe(list);

    return () => {
      viewport.removeEventListener("scroll", syncColumnScrollFade);
      resizeObserver.disconnect();
    };
  }, [columnLayout, syncColumnScrollFade, activeSpoke]);

  const drilldownWidth = (() => {
    if (panelLayout === "hidden") return 0;
    if (columnLayout && windowWidth > 0) {
      return Math.max(baseDrilldownWidth, windowWidth - IOM_GRAPH_RAIL_PX);
    }
    if (!iom && (panelLayout === "narrow" || windowWidth === 0)) return baseDrilldownWidth;
    if (iom && windowWidth === 0) return baseDrilldownWidth;
    const target =
      spec.drilldownExpandedWidth ??
      Math.round(Math.min(EXPANDED_WIDTH_CAP, windowWidth * EXPANDED_WIDTH_RATIO));
    return Math.max(baseDrilldownWidth, Math.min(target, windowWidth - MIN_GRAPH_RAIL));
  })();

  const hidePanel = useCallback(() => {
    if (panelLayout !== "hidden") {
      panelLayoutBeforeHide.current = panelLayout === "wide" ? "wide" : "narrow";
    }
    setPanelLayout("hidden");
    frameOverview();
  }, [frameOverview, panelLayout]);

  const showPanel = useCallback(() => {
    setPanelLayout(panelLayoutBeforeHide.current);
  }, []);

  const closeDrilldown = useCallback(() => {
    // A suspended tour resumes on close in every appearance, including iom
    // where the panel itself stays pinned open.
    if (tourSuspendedRef.current) {
      setTourSuspended(false);
      return;
    }
    // Leaving the command center falls back to the spoke view (iom keeps a
    // spoke pinned, so the panel stays populated rather than going blank).
    if (panelViewRef.current === "command") {
      setPanelView("spoke");
      if (!activeSpokeRef.current) frameOverview();
      return;
    }
    if (iom) return;
    setActiveSpoke(null);
    if (!tourActiveRef.current) frameOverview();
  }, [frameOverview, iom]);

  const [overviewNonce, setOverviewNonce] = useState(0);
  const resetCanvasView = useCallback(() => {
    if (!iom) setActiveSpoke(null);
    setOverviewNonce((nonce) => nonce + 1);
    frameOverview();
  }, [frameOverview, iom]);

  const focusNode = useCallback(
    (spokeId: string, subTab?: string) => {
      const spoke = spec.spokes[spokeId];
      if (!spoke) return;
      setActiveSpoke(spokeId);
      setPanelView("spoke");
      if (iom && panelLayout === "hidden") {
        setPanelLayout(panelLayoutBeforeHide.current);
      }
      if (subTab) {
        const found = spoke.tabs.findIndex((tab) =>
          tab.toLowerCase().includes(subTab.toLowerCase()),
        );
        setActiveTab(found >= 0 ? found : 0);
      } else {
        setActiveTab(0);
      }
      setTooltipVisible(false);
      if (iom) {
        if (spokeId === "hub") setOverviewNonce((nonce) => nonce + 1);
        frameOverview();
        return;
      }
      if (spokeId === "hub") {
        setOverviewNonce((nonce) => nonce + 1);
        frameOverview();
        return;
      }
      const key = subTab ? `${spokeId}:${subTab}` : spokeId;
      const pos = spec.focusTargets[key] ?? spec.focusTargets[spokeId];
      if (pos) framePoint(pos.x, pos.y, focusScale, drilldownWidth);
    },
    [
      drilldownWidth,
      focusScale,
      frameOverview,
      framePoint,
      iom,
      panelLayout,
      spec.focusTargets,
      spec.spokes,
    ],
  );

  /** `completed` clears the resume affordance; abandoning keeps the step. */
  const closeTour = useCallback(
    (completed = false) => {
      tourActiveRef.current = false;
      tourSuspendedRef.current = false;
      setTourActive(false);
      setTourSuspended(false);
      setTourProgress(completed ? null : tourStepRef.current);
      resetCanvasView();
    },
    [resetCanvasView],
  );

  const smoothPanToNode = useCallback(
    (targetX: number, targetY: number) => {
      // The tour card sits bottom-left, so bias the framing right of it when
      // there is room; a negative inset shifts the centre point rightwards.
      const width = viewportRef.current?.clientWidth ?? 0;
      const clearOfCard = width > TOUR_CARD_ZONE + TOUR_CARD_MIN_ROOM ? -TOUR_CARD_ZONE : 0;
      framePoint(targetX, targetY, 1.12, clearOfCard);
    },
    [framePoint],
  );

  const enterTour = useCallback(
    (stepIdx: number) => {
      if (!tourSteps.length) return;
      const safeStep = Math.min(Math.max(stepIdx, 0), tourSteps.length - 1);
      tourActiveRef.current = true;
      tourSuspendedRef.current = false;
      setTourActive(true);
      setTourSuspended(false);
      setTourStep(safeStep);
      setTourProgress(null);
      setTooltipVisible(false);
      if (!iom) setActiveSpoke(null);
      const step = tourSteps[safeStep];
      smoothPanToNode(step.targetX, step.targetY);
    },
    [iom, smoothPanToNode, tourSteps],
  );

  const startTour = useCallback(() => enterTour(0), [enterTour]);
  const resumeTour = useCallback(
    () => enterTour(tourProgress ?? 0),
    [enterTour, tourProgress],
  );

  /** Park the tour behind the drilldown instead of destroying it. */
  const suspendTour = useCallback(() => {
    tourSuspendedRef.current = true;
    setTourSuspended(true);
  }, []);

  useEffect(() => {
    if (!tourActive || tourSuspended) return;
    const step = tourSteps[tourStep];
    if (step) smoothPanToNode(step.targetX, step.targetY);
  }, [tourActive, tourSuspended, tourStep, smoothPanToNode, tourSteps]);

  /* Cut a hole in the dimmer over the node the step is describing, so the
     bubble stays lit instead of being dimmed with everything else. The ring is
     inside the panned/zoomed SVG and the camera eases over ~0.75s, so we track
     its rendered box per frame rather than deriving it from camera state —
     otherwise the hole would jump ahead of the bubble it is following. */
  useEffect(() => {
    const overlay = tourOverlayRef.current;
    const root = rootRef.current;
    if (!overlay || !root || !tourActive || tourSuspended) return;

    let frame = 0;
    const track = () => {
      const ring = svgRef.current?.querySelector("#tour-spotlight-ring");
      if (ring) {
        const box = ring.getBoundingClientRect();
        const host = root.getBoundingClientRect();
        const radius = box.width / 2;
        if (radius > 0) {
          overlay.style.setProperty(
            "--tour-hole-x",
            `${box.left + box.width / 2 - host.left}px`,
          );
          overlay.style.setProperty(
            "--tour-hole-y",
            `${box.top + box.height / 2 - host.top}px`,
          );
          overlay.style.setProperty("--tour-hole-r", `${Math.round(radius * 1.5)}px`);
        }
      }
      frame = requestAnimationFrame(track);
    };
    track();

    return () => {
      cancelAnimationFrame(frame);
      overlay.style.removeProperty("--tour-hole-x");
      overlay.style.removeProperty("--tour-hole-y");
      overlay.style.removeProperty("--tour-hole-r");
    };
  }, [svgRef, tourActive, tourStep, tourSuspended]);

  const showTooltip = useCallback(
    (evt: ReactMouseEvent, title: string, desc: string, hasMoreInfo = true) => {
      if (tourActiveRef.current && !tourSuspendedRef.current) return;
      setTooltip({ title, desc, x: evt.clientX, y: evt.clientY, hasMoreInfo });
      setTooltipVisible(true);
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false);
  }, []);

  useEffect(() => {
    if (drilldownBodyRef.current) drilldownBodyRef.current.scrollTop = 0;
  }, [activeTab, activeSpoke, panelView]);

  // Wires the authored panel HTML: deep links, filters, stars, collapsible explainers.
  usePanelInteractions({
    bodyRef: drilldownBodyRef,
    onOpen: focusNode,
    storageKey: `${commandCenter?.storageKey ?? "ifai"}:panel`,
    scope: `${activeSpoke ?? "none"}:${activeTab}:${panelView}`,
    glossary: spec.glossary,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const lockScroll = () => {
      root.scrollLeft = 0;
      root.scrollTop = 0;
      const layout = root.querySelector(".canvas-layout");
      if (layout instanceof HTMLElement) {
        layout.scrollLeft = 0;
        layout.scrollTop = 0;
      }
    };
    root.addEventListener("scroll", lockScroll, true);
    return () => root.removeEventListener("scroll", lockScroll, true);
  }, []);

  useEffect(() => {
    if (!iom) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onPointerMove = (event: PointerEvent) => {
      const box = viewport.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = ((event.clientX - box.left) / box.width) * 100;
      const y = ((event.clientY - box.top) / box.height) * 100;
      viewport.style.setProperty("--pointer-x", `${x}%`);
      viewport.style.setProperty("--pointer-y", `${y}%`);
    };
    viewport.addEventListener("pointermove", onPointerMove);
    return () => viewport.removeEventListener("pointermove", onPointerMove);
  }, [iom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onMouseDown(e: MouseEvent) {
      if (columnLayoutRef.current) return;
      const target = e.target as Element;
      if (
        target.closest(".graph-node") ||
        target.closest(".hud-btn-group") ||
        target.closest(".panel-toggle") ||
        target.closest(".drilldown-hide-btn") ||
        target.closest(".strategy-roadmap-btn")
      ) {
        return;
      }
      if (tourSuspendedRef.current) {
        closeDrilldown();
        return;
      }
      if (activeSpokeRef.current && spec.appearance !== "iom") {
        closeDrilldown();
        return;
      }
      pan.current.isPanning = true;
      pan.current.startX = e.clientX - pan.current.x;
      pan.current.startY = e.clientY - pan.current.y;
    }

    function onMouseMove(e: MouseEvent) {
      if (!pan.current.isPanning) return;
      pan.current.x = e.clientX - pan.current.startX;
      pan.current.y = e.clientY - pan.current.startY;
      applyTransform();
    }

    function onMouseUp() {
      pan.current.isPanning = false;
    }

    function onWheel(e: WheelEvent) {
      if (columnLayoutRef.current) return;
      e.preventDefault();
      const xs = (e.clientX - pan.current.x) / pan.current.scale;
      const ys = (e.clientY - pan.current.y) / pan.current.scale;
      const delta = -e.deltaY;
      pan.current.scale = delta > 0 ? pan.current.scale * 1.08 : pan.current.scale / 1.08;
      pan.current.scale = Math.min(Math.max(0.45, pan.current.scale), 3.0);
      pan.current.x = e.clientX - xs * pan.current.scale;
      pan.current.y = e.clientY - ys * pan.current.scale;
      applyTransform();
    }

    viewport.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      viewport.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, [applyTransform, closeDrilldown, pan, spec.appearance]);

  useEffect(() => {
    // Also runs while a tour is suspended so a click outside resumes it,
    // including in iom where the panel itself never closes.
    if (!tourSuspended && (!activeSpoke || spec.appearance === "iom")) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".drilldown-panel")) return;
      if (target.closest(".graph-node")) return;
      if (target.closest(".top-header")) return;
      if (target.closest(".canvas-metric-widgets")) return;
      if (target.closest(".tour-overlay-container")) return;
      closeDrilldown();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeSpoke, closeDrilldown, spec.appearance, tourSuspended]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // While suspended, Escape backs out of the panel and lands on the tour again.
        if (tourSuspendedRef.current) closeDrilldown();
        else if (tourActiveRef.current) closeTour();
        else closeDrilldown();
      } else if (tourActiveRef.current && !tourSuspendedRef.current) {
        if (e.key === "ArrowRight") {
          if (tourStepRef.current < tourSteps.length - 1) {
            setTourStep(tourStepRef.current + 1);
          } else {
            closeTour(true);
          }
        } else if (e.key === "ArrowLeft") {
          setTourStep((step) => Math.max(step - 1, 0));
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrilldown, closeTour, tourSteps.length]);

  function handleFilterChange(value: string) {
    const option = spec.filters?.find((item) => item.value === value);
    const target = option?.target ?? (value === "all" ? "overview" : undefined);
    if (!target || target === "overview") resetCanvasView();
    else focusNode(target);
  }

  function handleSearch(query: string) {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const match = spec.search?.matchers?.find((item) =>
      item.keywords.some((keyword) => q.includes(keyword.toLowerCase())),
    );
    if (match) focusNode(match.spokeId);
  }

  function nextTourStep() {
    if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
    else closeTour(true);
  }

  function prevTourStep() {
    if (tourStep > 0) setTourStep(tourStep - 1);
  }

  function openDrilldownFromTour() {
    const step = tourSteps[tourStep];
    if (!step || !spec.spokes[step.nodeId]) {
      closeTour();
      return;
    }
    // Suspend rather than close: the step is held so closing the panel returns here.
    suspendTour();
    focusNode(step.nodeId);
  }

  function openCommandCenter() {
    if (!commandCenter) return;
    // Leaving for the queue ends the tour but keeps the step, so the header
    // still offers a resume rather than forcing a restart.
    if (tourActiveRef.current) closeTour();
    setPanelView("command");
    setPanelLayout("wide");
  }

  const spoke = activeSpoke ? spec.spokes[activeSpoke] : null;
  const currentTour = tourSteps[tourStep];
  const spokeBody = spoke ? spoke.render(activeTab) : null;
  const showThemeToggle = spec.showThemeToggle !== false;
  const showingCommand = panelView === "command" && Boolean(commandCenter);
  const panelOpen = showingCommand || Boolean(spoke);
  const tourOverlayVisible = tourActive && !tourSuspended;
  const canResumeTour = !tourActive && tourProgress !== null && tourProgress > 0;

  const ctx: CanvasRenderContext = {
    svgRef,
    transform,
    tourActive,
    tourX: currentTour?.targetX ?? 800,
    tourY: currentTour?.targetY ?? 500,
    tourRadius: currentTour?.radius ?? 160,
    tourCategory: currentTour?.category ?? "",
    focusNode,
    resetView: resetCanvasView,
    overviewNonce,
    focusedSpokeId: activeSpoke,
    columnLayout,
    showTooltip,
    hideTooltip,
  };

  // `ctx` carries svgRef so the child can attach it to its own <svg>. The rule
  // cannot tell a forwarded ref from a read, and nothing reads .current here.
  // eslint-disable-next-line react-hooks/refs
  const viewport = typeof children === "function" ? children(ctx) : children;
  const legendColor: Record<(typeof legend)[number]["status"], string> = {
    danger: "var(--danger-red)",
    warning: "var(--warning-amber)",
    success: "var(--success-green)",
  };

  return (
    <div
      ref={rootRef}
      className={`ifai-canvas${iom ? " theme-iom" : ""}${lightTheme ? " light-theme" : ""}${columnLayout ? " column-layout" : ""}${panelOpen && panelLayout !== "hidden" && !tourOverlayVisible ? " panel-open" : ""}${(columnLayout || (panelLayout === "wide" && !tourOverlayVisible)) ? " panel-expanded" : ""}${panelLayout === "hidden" && !tourOverlayVisible ? " panel-hidden" : ""}${tourOverlayVisible ? " tour-running" : ""}`}
      style={{ "--drilldown-width": `${drilldownWidth}px` } as CSSProperties}
    >
      <div className="canvas-layout">
        <header className="top-header" ref={headerRef}>
          <div className="brand-section">
            <img
              src={spec.brand.logoSrc ?? "/icon.png"}
              alt={spec.brand.name}
              className="brand-logo-icon"
            />
            <div className="brand-title-group">
              <div className="brand-name">
                {spec.brand.name}
                {spec.brand.badge ? (
                  <span className="tag-badge tag-danger" style={{ fontSize: "9.5px" }}>
                    {spec.brand.badge}
                  </span>
                ) : null}
              </div>
              <div className="brand-sub">{spec.brand.subtitle}</div>
            </div>

            {spec.filters?.length ? (
              <>
                <div className="pill-divider" />
                <div className="filter-selector">
                  <Layers size={13} color="var(--accent-purple)" />
                  <select
                    aria-label="Canvas filter"
                    onChange={(e) => handleFilterChange(e.target.value)}
                  >
                    {spec.filters.map((filter) => (
                      <option key={filter.value} value={filter.value}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </div>

          {spec.tickers?.length ? (
            <div className="header-ticker">
              {spec.tickers.map((item) => (
                <div
                  key={item.id}
                  className={`ticker-item ticker-badge-${item.tone}`}
                  onClick={() => {
                    if (item.spokeId) focusNode(item.spokeId, item.subTab);
                  }}
                >
                  {tickerIcon(item.icon)}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="header-controls">
            {spec.headerSlot}

            {spec.search ? (
              <div className="search-input-wrapper">
                <Search className="search-icon" size={12} />
                <input
                  type="text"
                  className="search-input"
                  placeholder={spec.search.placeholder ?? "Search..."}
                  onInput={(e) => handleSearch(e.currentTarget.value)}
                />
              </div>
            ) : null}

            {commandCenter ? (
              <button
                className={`hdr-btn${showingCommand ? " hdr-btn-active" : ""}`}
                onClick={openCommandCenter}
                title="What do I need to worry about?"
              >
                <ListChecks size={12} />
                <span>Priorities</span>
                {commandCenter.items.length ? (
                  <span className="hdr-btn-count">{commandCenter.items.length}</span>
                ) : null}
              </button>
            ) : null}

            {tourSteps.length ? (
              <button
                className="hdr-btn hdr-btn-primary"
                onClick={canResumeTour ? resumeTour : startTour}
              >
                <Compass size={12} />
                <span>
                  {canResumeTour
                    ? `Resume Tour · ${(tourProgress ?? 0) + 1}/${tourSteps.length}`
                    : "Guided Tour"}
                </span>
              </button>
            ) : null}

            {spec.headerActions?.map((action) => {
              const className = `hdr-btn${action.variant === "primary" ? " hdr-btn-primary" : ""}`;
              const inner = (
                <>
                  <ExternalLink size={12} />
                  <span>{action.label}</span>
                </>
              );
              if (action.href) {
                return (
                  <a key={action.label} className={className} href={action.href}>
                    {inner}
                  </a>
                );
              }
              return (
                <button key={action.label} className={className} onClick={action.onClick}>
                  {inner}
                </button>
              );
            })}

            {showThemeToggle ? (
              <button
                className="hdr-btn"
                onClick={() => setLightTheme((value) => !value)}
                title="Toggle Light / Dark"
              >
                {lightTheme ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            ) : null}
          </div>
        </header>

        <div className="viewport-container" id="viewport" ref={viewportRef}>
          {iom ? <div className="canvas-pointer-wash" aria-hidden="true" /> : null}
          {iom && spec.spokes.roadmap && !roadmapOnGraph ? (
            <button
              type="button"
              className={`strategy-roadmap-btn${activeSpoke === "roadmap" ? " active" : ""}`}
              onClick={() => focusNode("roadmap")}
            >
              <Route size={16} strokeWidth={1.75} />
              Strategy Roadmap
            </button>
          ) : null}
          {viewport}
        </div>

        {columnLayout ? (
          <div className="column-scroll-edges" aria-hidden="true">
            <div className={`column-scroll-edge column-scroll-edge-top${columnScrollFade.top ? " visible" : ""}`} />
            <div
              className={`column-scroll-edge column-scroll-edge-bottom${columnScrollFade.bottom ? " visible" : ""}`}
            />
          </div>
        ) : null}

        {spec.metricWidgets ? (
          <MetricWidgets
            config={spec.metricWidgets}
            spokes={spec.spokes}
            onOpenMetric={focusNode}
          />
        ) : null}

        <div className="canvas-hud-legend">
          {legend.map((item) => (
            <div key={item.label} className="legend-item">
              <span className="legend-dot" style={{ borderColor: legendColor[item.status] }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {!columnLayout ? (
          <div className="canvas-hud-controls">
            <div className="hud-btn-group">
              <button className="hud-btn" onClick={() => zoomBy(1.2)} title="Zoom In (+)">
                <Plus size={16} />
              </button>
              <button className="hud-btn" onClick={() => zoomBy(1 / 1.2)} title="Zoom Out (-)">
                <Minus size={16} />
              </button>
              <button className="hud-btn" onClick={resetCanvasView} title="Center & Overview">
                <Compass size={16} />
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={`node-tooltip${tooltipVisible ? " visible" : ""}`}
          style={{ left: tooltip?.x ?? 0, top: tooltip?.y ?? 0 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip?.title ?? "Title"}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
            {tooltip?.desc ?? "Description"}
          </div>
          {tooltip?.hasMoreInfo ? (
            <div
              style={{
                marginTop: 6,
                color: "var(--accent-purple)",
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              CLICK FOR MORE INFO →
            </div>
          ) : null}
        </div>

        {panelOpen && panelLayout === "hidden" && !tourOverlayVisible ? (
          <button
            type="button"
            className="drilldown-panel-toggle panel-toggle"
            onClick={showPanel}
            title="Show sidebar"
            aria-label="Show sidebar"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        ) : null}

        <aside className={`drilldown-panel${panelOpen && !tourOverlayVisible ? " open" : ""}`}>
          <div className="drilldown-header">
            <div className="drilldown-title-wrap">
              {commandCenter && !showingCommand ? (
                <button className="drilldown-back-btn" onClick={openCommandCenter}>
                  <ChevronLeft size={12} />
                  Priorities
                </button>
              ) : null}
              <span className="drilldown-badge">
                {showingCommand
                  ? (commandCenter?.badge ?? "COMMAND CENTER")
                  : (spoke?.badge ?? "SPOKE")}
              </span>
              <h2 className="drilldown-title">
                {showingCommand ? commandCenter?.title : (spoke?.title ?? "")}
              </h2>
              <p className="drilldown-desc">
                {showingCommand ? commandCenter?.desc : (spoke?.desc ?? "")}
              </p>
            </div>

            <div className="drilldown-header-actions">
              {tourSuspended ? (
                <button
                  className="drilldown-resume-btn"
                  onClick={closeDrilldown}
                  title="Back to the guided tour"
                >
                  <Compass size={13} />
                  Resume tour · {tourStep + 1}/{tourSteps.length}
                </button>
              ) : null}
              {iom ? null : (
                <button
                  className="drilldown-expand-btn"
                  onClick={() =>
                    setPanelLayout((value) => (value === "wide" ? "narrow" : "wide"))
                  }
                  title={panelLayout === "wide" ? "Use narrow sidebar" : "Use wide sidebar"}
                  aria-pressed={panelLayout === "wide"}
                >
                  {panelLayout === "wide" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              )}
              <button
                className="drilldown-hide-btn"
                onClick={hidePanel}
                title={iom ? "Show full map" : "Hide sidebar"}
                aria-label={iom ? "Show full map" : "Hide sidebar"}
              >
                <ChevronsRight size={16} />
              </button>
              {iom ? null : (
                <button
                  className="drilldown-close-btn"
                  onClick={closeDrilldown}
                  title="Close panel"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {showingCommand || !spoke ? null : (
            <>
              <nav className="drilldown-crumb" aria-label="Location">
                <button
                  type="button"
                  onClick={() => {
                    if (commandCenter) openCommandCenter();
                    else resetCanvasView();
                    frameOverview();
                  }}
                >
                  Map
                </button>
                <span aria-hidden="true">›</span>
                <span>{spoke.navLabel ?? spoke.title}</span>
                <span aria-hidden="true">›</span>
                <span className="drilldown-crumb-here">{spoke.tabs[activeTab]}</span>
              </nav>
              <div className="drilldown-tabs" role="tablist">
                {spoke.tabs.map((tabName, idx) => (
                  <button
                    key={tabName}
                    role="tab"
                    aria-selected={idx === activeTab}
                    className={`drilldown-tab-btn${idx === activeTab ? " active" : ""}`}
                    onClick={() => setActiveTab(idx)}
                  >
                    {tabName}
                  </button>
                ))}
              </div>
            </>
          )}

          {showingCommand && commandCenter ? (
            <div ref={drilldownBodyRef} className="drilldown-body">
              <CommandCenter spec={commandCenter} onOpenItem={focusNode} />
            </div>
          ) : typeof spokeBody === "string" ? (
            <div
              ref={drilldownBodyRef}
              className="drilldown-body"
              dangerouslySetInnerHTML={{ __html: spokeBody }}
            />
          ) : (
            <div ref={drilldownBodyRef} className="drilldown-body">
              {spokeBody}
            </div>
          )}

        </aside>

        <div
          ref={tourOverlayRef}
          className={`tour-overlay-container${tourOverlayVisible ? " active" : ""}`}
        >
          <div className="tour-dimmer-backdrop" onClick={() => closeTour()} />

          {currentTour ? (
            <div
              className="tour-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tour-spoke-title"
            >
              <div className="tour-modal-header">
                <div className="tour-badge-group">
                  <span className="tour-step-pill">
                    STEP {tourStep + 1} OF {tourSteps.length}
                  </span>
                  <span className="tour-category-badge">{currentTour.category}</span>
                </div>
                <button
                  className="tour-close-btn"
                  onClick={() => closeTour()}
                  title="Close Tour (ESC)"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="tour-progress-bar-wrap">
                <div
                  className="tour-progress-bar-fill"
                  style={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>

              <div className="tour-modal-body">
                <div className="tour-title-area">
                  <h3 className="tour-spoke-title" id="tour-spoke-title">
                    {currentTour.title}
                  </h3>
                  <p className="tour-spoke-subtitle">{currentTour.subtitle}</p>
                </div>

                <div className="tour-info-card">
                  <div className="tour-card-header">
                    <Layout size={13} color="var(--accent-purple)" />
                    <span>What&apos;s Inside</span>
                  </div>
                  <ul className="tour-card-list">
                    {currentTour.displays.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                </div>

                <div className="tour-info-card primary-value">
                  <div className="tour-card-header">
                    <Sparkles size={13} color="var(--success-green)" />
                    <span style={{ color: "var(--success-text)" }}>
                      Client Value & Executive Intelligence
                    </span>
                  </div>
                  <div className="tour-value-text">{currentTour.value}</div>
                </div>

                <button className="tour-drilldown-link-btn" onClick={openDrilldownFromTour}>
                  <ExternalLink size={12} />
                  <span>Explore Full Deep-Dive Panel →</span>
                  <em className="tour-drilldown-hint">Tour pauses here — you&apos;ll come back</em>
                </button>
              </div>

              <div className="tour-modal-footer">
                <div className="tour-dots-indicator">
                  {tourSteps.map((step, idx) => (
                    <div
                      key={`${step.nodeId}-${idx}`}
                      className={`tour-dot${idx === tourStep ? " active" : ""}`}
                      onClick={() => setTourStep(idx)}
                    />
                  ))}
                </div>
                <div className="tour-nav-btns">
                  <button
                    className="tour-btn"
                    onClick={prevTourStep}
                    style={{ visibility: tourStep === 0 ? "hidden" : "visible" }}
                  >
                    Previous
                  </button>
                  <button className="tour-btn tour-btn-primary" onClick={nextTourStep}>
                    {tourStep === tourSteps.length - 1 ? "Finish Tour 🎯" : "Next Step →"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
