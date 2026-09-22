"use client";

import "@/lib/canvas-sdk/canvas-sdk.css";
import type {
  CanvasRenderContext,
  CanvasSpec,
  TickerIcon,
} from "@/lib/canvas-sdk/types";
import { useCanvasCamera } from "@/lib/canvas-sdk/useCanvasCamera";
import {
  Compass,
  ExternalLink,
  Layers,
  Layout,
  Minus,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

const DEFAULT_DRILLDOWN_WIDTH = 620;
const DEFAULT_FOCUS_SCALE = 1.55;

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
  const drilldownWidth = spec.drilldownWidth ?? DEFAULT_DRILLDOWN_WIDTH;
  const focusScale = spec.focusScale ?? DEFAULT_FOCUS_SCALE;
  const tourSteps = spec.tour ?? [];
  const legend = spec.legend ?? [
    { status: "danger" as const, label: "Critical" },
    { status: "warning" as const, label: "At Risk" },
    { status: "success" as const, label: "On Track" },
  ];

  const viewportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drilldownBodyRef = useRef<HTMLDivElement>(null);
  const tourActiveRef = useRef(false);
  const activeSpokeRef = useRef<string | null>(null);
  const tourStepRef = useRef(0);

  const { pan, transform, applyTransform, framePoint, frameOverview, zoomBy } =
    useCanvasCamera({
      viewBox: spec.viewBox,
      viewportRef,
      svgRef,
    });

  const [lightTheme, setLightTheme] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [activeSpoke, setActiveSpoke] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  activeSpokeRef.current = activeSpoke;
  tourStepRef.current = tourStep;

  const closeDrilldown = useCallback(() => {
    setActiveSpoke(null);
    if (!tourActiveRef.current) frameOverview();
  }, [frameOverview]);

  const resetCanvasView = useCallback(() => {
    setActiveSpoke(null);
    frameOverview();
  }, [frameOverview]);

  const focusNode = useCallback(
    (spokeId: string, subTab?: string) => {
      const spoke = spec.spokes[spokeId];
      if (!spoke) return;
      setActiveSpoke(spokeId);
      if (subTab) {
        const found = spoke.tabs.findIndex((tab) =>
          tab.toLowerCase().includes(subTab.toLowerCase()),
        );
        setActiveTab(found >= 0 ? found : 0);
      } else {
        setActiveTab(0);
      }
      setTooltipVisible(false);
      const key = subTab ? `${spokeId}:${subTab}` : spokeId;
      const pos = spec.focusTargets[key] ?? spec.focusTargets[spokeId];
      if (pos) framePoint(pos.x, pos.y, focusScale, drilldownWidth);
    },
    [drilldownWidth, focusScale, framePoint, spec.focusTargets, spec.spokes],
  );

  const closeTour = useCallback(() => {
    tourActiveRef.current = false;
    setTourActive(false);
    resetCanvasView();
  }, [resetCanvasView]);

  const smoothPanToNode = useCallback(
    (targetX: number, targetY: number) => {
      framePoint(targetX, targetY, 1.12);
    },
    [framePoint],
  );

  const startTour = useCallback(() => {
    if (!tourSteps.length) return;
    tourActiveRef.current = true;
    setTourActive(true);
    setTourStep(0);
    setTooltipVisible(false);
    closeDrilldown();
    const step = tourSteps[0];
    smoothPanToNode(step.targetX, step.targetY);
  }, [closeDrilldown, smoothPanToNode, tourSteps]);

  useEffect(() => {
    if (!tourActive) return;
    const step = tourSteps[tourStep];
    if (step) smoothPanToNode(step.targetX, step.targetY);
  }, [tourActive, tourStep, smoothPanToNode, tourSteps]);

  const showTooltip = useCallback(
    (evt: ReactMouseEvent, title: string, desc: string, hasMoreInfo = true) => {
      if (tourActiveRef.current) return;
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
  }, [activeTab, activeSpoke]);

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
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest(".graph-node") || target.closest(".hud-btn-group")) return;
      if (activeSpokeRef.current) {
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
  }, [applyTransform, closeDrilldown, pan]);

  useEffect(() => {
    if (!activeSpoke) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".drilldown-panel")) return;
      if (target.closest(".graph-node")) return;
      if (target.closest(".top-header")) return;
      if (target.closest(".tour-overlay-container")) return;
      closeDrilldown();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeSpoke, closeDrilldown]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (tourActiveRef.current) closeTour();
        else closeDrilldown();
      } else if (tourActiveRef.current) {
        if (e.key === "ArrowRight") {
          if (tourStepRef.current < tourSteps.length - 1) {
            setTourStep(tourStepRef.current + 1);
          } else {
            closeTour();
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
    if (tourStepRef.current < tourSteps.length - 1) setTourStep(tourStepRef.current + 1);
    else closeTour();
  }

  function prevTourStep() {
    if (tourStepRef.current > 0) setTourStep(tourStepRef.current - 1);
  }

  function openDrilldownFromTour() {
    const step = tourSteps[tourStep];
    if (!step || !spec.spokes[step.nodeId]) {
      closeTour();
      return;
    }
    const targetNode = step.nodeId;
    closeTour();
    focusNode(targetNode);
  }

  const spoke = activeSpoke ? spec.spokes[activeSpoke] : null;
  const currentTour = tourSteps[tourStep];
  const spokeBody = spoke ? spoke.render(activeTab) : null;
  const showThemeToggle = spec.showThemeToggle !== false;

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
    showTooltip,
    hideTooltip,
  };

  const viewport = typeof children === "function" ? children(ctx) : children;
  const legendColor: Record<(typeof legend)[number]["status"], string> = {
    danger: "var(--danger-red)",
    warning: "var(--warning-amber)",
    success: "var(--success-green)",
  };

  return (
    <div
      ref={rootRef}
      className={`ifai-canvas${lightTheme ? " light-theme" : ""}${spoke ? " panel-open" : ""}`}
      style={{ "--drilldown-width": `${drilldownWidth}px` } as CSSProperties}
    >
      <div className="canvas-layout">
        <header className="top-header">
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

            {tourSteps.length ? (
              <button className="hdr-btn hdr-btn-primary" onClick={startTour}>
                <Compass size={12} />
                <span>Guided Tour</span>
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
          {viewport}
        </div>

        <div className="canvas-hud-legend">
          {legend.map((item) => (
            <div key={item.label} className="legend-item">
              <span className="legend-dot" style={{ borderColor: legendColor[item.status] }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

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

        <aside className={`drilldown-panel${spoke ? " open" : ""}`}>
          <div className="drilldown-header">
            <div className="drilldown-title-wrap">
              <span className="drilldown-badge">{spoke?.badge ?? "SPOKE"}</span>
              <h2 className="drilldown-title">{spoke?.title ?? ""}</h2>
              <p className="drilldown-desc">{spoke?.desc ?? ""}</p>
            </div>
            <button className="drilldown-close-btn" onClick={closeDrilldown} title="Close (ESC)">
              <X size={18} />
            </button>
          </div>

          <div className="drilldown-tabs">
            {spoke?.tabs.map((tabName, idx) => (
              <button
                key={tabName}
                className={`drilldown-tab-btn${idx === activeTab ? " active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                {tabName}
              </button>
            ))}
          </div>

          {typeof spokeBody === "string" ? (
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

        <div className={`tour-overlay-container${tourActive ? " active" : ""}`}>
          <div className="tour-dimmer-backdrop" onClick={closeTour} />

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
                <button className="tour-close-btn" onClick={closeTour} title="Close Tour (ESC)">
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
                    <span>What This Spoke Displays</span>
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
