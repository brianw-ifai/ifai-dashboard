"use client";

import "@/lib/canvas-sdk/canvas-sdk.css";
import {
  ActionCard,
  ConnLine,
  ContentBox,
  DataTable,
  GraphBubble,
  GraphHub,
  MetricCard,
  MetricGrid,
  TagBadge,
  TourSpotlight,
} from "@/lib/canvas-sdk";
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
import { useState, type ReactNode } from "react";

const noop = () => {};

function GalleryDefs() {
  return (
    <svg width={0} height={0} aria-hidden className="design-defs">
      <defs>
        <radialGradient id="brandHubGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <filter id="glow-danger" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-accent" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="nodeShadow" x="-60%" y="-60%" width="220%" height="240%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0b1220" floodOpacity="0.4" />
        </filter>
      </defs>
    </svg>
  );
}

function Stage({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="design-stage">
      <div className="design-stage-head">
        <h2 id={id}>{title}</h2>
        {note ? <p>{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, cssVar, value }: { name: string; cssVar: string; value: string }) {
  return (
    <div className="design-swatch">
      <span className="design-swatch-chip" style={{ background: `var(${cssVar})` }} />
      <div className="design-swatch-meta">
        <code>{name}</code>
        <span>{value}</span>
      </div>
    </div>
  );
}

const SATELLITE_SIZES = [48, 50, 51, 52, 54];
const SPOKE_SIZES = [70, 74, 78, 84];

export function DesignSystemContent() {
  const [lightTheme, setLightTheme] = useState(true);
  const [previewTab, setPreviewTab] = useState(0);
  const previewTabs = ["Overview", "SKUs", "Fixes"];

  return (
    <div className="sdk-docs-gallery-page">
      <p className="sdk-docs-eyebrow">Design system</p>
      <h1 id="overview">Visual language of the canvas</h1>
      <p className="sdk-docs-lede">
        Every creative element the SDK uses to display data — fonts, tokens, bubbles, pills, edges,
        topology, KPI cards, tables, and chrome — rendered from the same primitives as{" "}
        <a href="/dashboard">the client canvas</a>. There are no bar, line, or pie chart components; quantitative data
        lives in the graph, metric cards, tables, and progress bars below.
      </p>

      <div className={`ifai-canvas ifai-canvas-preview${lightTheme ? " light-theme" : ""}`}>
        <GalleryDefs />

        <div className="design-stage-head" style={{ marginBottom: 14 }}>
          <div className="sdk-docs-gallery-toolbar">
            <p style={{ margin: 0, padding: 0, color: "var(--text-muted)", fontSize: 12.5 }}>
              Live samples inherit canvas tokens. Toggle theme the same way the shell does.
            </p>
            <button
              className="hdr-btn"
              onClick={() => setLightTheme((value) => !value)}
              title="Toggle Light / Dark"
            >
              {lightTheme ? <Sun size={13} /> : <Moon size={13} />}
              <span>{lightTheme ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>

        <div className="design-inventory">
          <div>
            <strong>Foundation</strong> — Inter variable, mono stack, brand + semantic colors,
            radii 22 / 999
          </div>
          <div>
            <strong>Graph</strong> — hub, spokes, satellites, conn-lines, quadratic paths,
            correlation badges, tour spotlight
          </div>
          <div>
            <strong>Pills</strong> — node stats, tag badges, tickers, header buttons, tour step,
            filter, search
          </div>
          <div>
            <strong>Data UI</strong> — metric cards, tables, action cards, KPI target, cadence,
            workstream meta, progress
          </div>
        </div>

        <Stage
          id="fonts"
          title="Fonts"
          note="Inter is loaded as a variable face at /fonts/inter-latin-wght-normal.woff2. --font-sans is Inter + system fallbacks. --font-mono is the UI stack used by .mono in tables."
        >
          <div className="design-type-grid">
            <div className="design-type-card">
              <strong style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em" }}>
                Inter 800
              </strong>
              <span>22px metric values, 18px drilldown title</span>
            </div>
            <div className="design-type-card">
              <strong style={{ fontSize: 15, fontWeight: 800 }}>Hub 15 / Spoke 14.5</strong>
              <span>Curved node titles on the graph</span>
            </div>
            <div className="design-type-card">
              <strong style={{ fontSize: 13, fontWeight: 700 }}>UI 13 / 12.5 / 12</strong>
              <span>Filters, tabs, tables, action heads</span>
            </div>
            <div className="design-type-card">
              <strong style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
                MICRO 11–9.5
              </strong>
              <span>Pills, tickers, badges, HUD legend</span>
            </div>
            <div className="design-type-card">
              <strong className="mono" style={{ fontSize: 13 }}>
                0x7E / 68%
              </strong>
              <span>Monospace for compact numeric cells</span>
            </div>
          </div>
        </Stage>

        <Stage
          id="colors"
          title="Colors"
          note="Brand tokens stay fixed. Surface, text, border, and map tokens swap under .light-theme."
        >
          <p className="design-caption" style={{ marginTop: 0, marginBottom: 8 }}>
            Brand
          </p>
          <div className="design-swatch-grid">
            <Swatch name="midnight" cssVar="--color-midnight" value="#0b1220" />
            <Swatch name="sky" cssVar="--color-sky" value="#38bdf8" />
            <Swatch name="indigo" cssVar="--color-indigo" value="#4f46e5" />
            <Swatch name="amber" cssVar="--color-amber" value="#f59e0b" />
            <Swatch name="ink" cssVar="--color-ink" value="#111827" />
            <Swatch name="gray" cssVar="--color-gray" value="#6b7280" />
            <Swatch name="fog" cssVar="--color-fog" value="#f9fafb" />
            <Swatch name="white" cssVar="--color-white" value="#ffffff" />
          </div>
          <p className="design-caption">Surfaces & type (theme)</p>
          <div className="design-swatch-grid">
            <Swatch name="bg-primary" cssVar="--bg-primary" value="canvas" />
            <Swatch name="bg-surface" cssVar="--bg-surface" value="chrome" />
            <Swatch name="bg-card" cssVar="--bg-card" value="cards" />
            <Swatch name="text-main" cssVar="--text-main" value="copy" />
            <Swatch name="text-muted" cssVar="--text-muted" value="secondary" />
            <Swatch name="text-subtle" cssVar="--text-subtle" value="tertiary" />
            <Swatch name="map-bg" cssVar="--map-bg" value="viewport" />
            <Swatch name="map-node-bg" cssVar="--map-node-bg" value="bubbles" />
          </div>
          <p className="design-caption">Status</p>
          <div className="design-swatch-grid">
            <Swatch name="danger" cssVar="--danger-red" value="#ef4444" />
            <Swatch name="success" cssVar="--success-green" value="#10b981" />
            <Swatch name="warning" cssVar="--warning-amber" value="#f59e0b" />
            <Swatch name="accent" cssVar="--accent-purple" value="#4f46e5" />
            <Swatch name="cyan" cssVar="--accent-cyan" value="#38bdf8" />
            <Swatch name="danger-bg" cssVar="--danger-bg" value="tint" />
            <Swatch name="success-bg" cssVar="--success-bg" value="tint" />
            <Swatch name="warning-bg" cssVar="--warning-bg" value="tint" />
          </div>
        </Stage>

        <Stage
          id="bubbles"
          title="Bubbles"
          note="Satellites 48–54, spokes 70 / 74 / 78 / 84, hub core 98 (pulse ~140, mid ~118). Status is danger, warning, success, or neutral. Hub is variant: 'hub'."
        >
          <div className="design-svg-frame">
            <svg viewBox="0 0 760 200" width="100%" height="200">
              {SATELLITE_SIZES.map((r, idx) => (
                <GraphBubble
                  key={`sat-${r}`}
                  id={`gallery-sat-${r}`}
                  x={76 + idx * 152}
                  y={100}
                  r={r}
                  status="neutral"
                  title={`r ${r}`}
                  stats={[`${r}`]}
                  onClick={noop}
                  onMouseEnter={noop}
                  onMouseLeave={noop}
                />
              ))}
            </svg>
          </div>
          <p className="design-caption">Satellite radii used in production canvases: 48, 50, 51, 52, 54.</p>
          <div className="design-svg-frame" style={{ marginTop: 12 }}>
            <svg viewBox="0 0 900 230" width="100%" height="230">
              {SPOKE_SIZES.map((r, idx) => (
                <GraphBubble
                  key={`spoke-${r}`}
                  id={`gallery-spoke-${r}`}
                  x={110 + idx * 220}
                  y={115}
                  r={r}
                  status="warning"
                  title={`Spoke ${r}`}
                  stats={["68%", "risk"]}
                  meta="orbit"
                  onClick={noop}
                  onMouseEnter={noop}
                  onMouseLeave={noop}
                />
              ))}
            </svg>
          </div>
          <p className="design-caption">Spoke radii: 70, 74, 78, 84 — stacked stat pills plus optional meta.</p>

          <div className="design-split" style={{ marginTop: 12 }}>
            <div className="design-svg-frame">
              <svg viewBox="0 0 560 280" width="100%" height="260">
                {(["danger", "warning", "success", "neutral"] as const).map((status, idx) => (
                  <GraphBubble
                    key={status}
                    id={`gallery-status-${status}`}
                    x={80 + idx * 130}
                    y={140}
                    r={52}
                    status={status}
                    title={status}
                    stats={["stat"]}
                    onClick={noop}
                    onMouseEnter={noop}
                    onMouseLeave={noop}
                  />
                ))}
              </svg>
            </div>
            <div className="design-svg-frame">
              <svg viewBox="0 0 360 320" width="100%" height="260">
                <GraphHub
                  id="gallery-hub"
                  x={180}
                  y={160}
                  r={98}
                  status="success"
                  title="HUB"
                  stats={["92"]}
                  meta="portfolio"
                  onClick={noop}
                  onMouseEnter={noop}
                  onMouseLeave={noop}
                />
              </svg>
            </div>
          </div>
          <p className="design-caption">Status strokes on satellites. Hub with pulse ring and gradient wash.</p>
        </Stage>

        <Stage
          id="pills"
          title="Pills & badges"
          note="Stat pills sit inside bubbles. Tag badges, tickers, header buttons, tour step, filter, and search are chrome pills."
        >
          <div className="design-chip-row">
            <TagBadge tone="danger">Critical</TagBadge>
            <TagBadge tone="warning">Watch</TagBadge>
            <TagBadge tone="success">On track</TagBadge>
            <TagBadge tone="neutral">Neutral</TagBadge>
            <TagBadge tone="info">Info</TagBadge>
            <TagBadge tone="queued">Queued</TagBadge>
            <span className="tour-step-pill">STEP 2 OF 6</span>
            <span className="drilldown-badge">Retail spoke</span>
          </div>
          <div className="design-chip-row" style={{ marginTop: 10 }}>
            <div className="ticker-item ticker-badge-danger">
              <span className="pulse-dot" />
              <span>Buy box 68%</span>
            </div>
            <div className="ticker-item ticker-badge-warning">
              <Sparkles size={12} />
              <span>AI Search Visibility 41</span>
            </div>
            <div className="ticker-item ticker-badge-success">
              <TrendingUp size={12} />
              <span>Schema +12</span>
            </div>
            <div className="filter-selector">
              <Layers size={13} color="var(--accent-purple)" />
              <select aria-label="Sample filter" defaultValue="all">
                <option value="all">All spokes</option>
                <option value="retail">Retail</option>
              </select>
            </div>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={12} />
              <input className="search-input" placeholder="Search nodes…" readOnly />
            </div>
            <button className="hdr-btn hdr-btn-primary">
              <Compass size={12} />
              <span>Guided Tour</span>
            </button>
            <button className="hdr-btn">
              <ExternalLink size={12} />
              <span>Open home</span>
            </button>
          </div>
          <p className="design-caption">Node stat pills are SVG — see the bubble row above. Correlation badges live on edges in Graphs.</p>
        </Stage>

        <Stage
          id="lines"
          title="Lines"
          note="ConnLine kinds: default, critical, warning, active. Optional quadratic paths carry a custom stroke. Correlation badges annotate a relationship."
        >
          <div className="design-svg-frame">
            <svg viewBox="0 0 720 200" width="100%" height="200">
              <ConnLine x1={40} y1={36} x2={680} y2={36} kind="default" />
              <ConnLine x1={40} y1={72} x2={680} y2={72} kind="warning" />
              <ConnLine x1={40} y1={108} x2={680} y2={108} kind="critical" />
              <ConnLine x1={40} y1={144} x2={680} y2={144} kind="active" />
              <path
                d="M 40 176 Q 360 210 680 176"
                fill="none"
                stroke="var(--danger-red)"
                strokeWidth={2.5}
                opacity={0.85}
              />
              <text x={40} y={28} fontSize={10} fill="var(--text-subtle)">
                default · warning · critical · active · quadratic path
              </text>
              <g transform="translate(360, 108)">
                <rect
                  className="correlation-badge"
                  x={-54}
                  y={-11}
                  width={108}
                  height={22}
                  rx={11}
                  filter="url(#nodeShadow)"
                />
                <text className="correlation-badge-text" x="0" y="4" textAnchor="middle" fontSize="10.5">
                  −0.82 corr
                </text>
              </g>
            </svg>
          </div>
        </Stage>

        <Stage
          id="graphs"
          title="Graphs"
          note="The only chart the SDK ships is this hub-and-spoke topology: nodes, edges, paths, badges, and an optional tour spotlight. Compose it with CanvasGraph or the primitives below."
        >
          <div className="design-svg-frame">
            <svg viewBox="0 0 900 520" width="100%" height="420">
              <ConnLine x1={450} y1={260} x2={200} y2={150} kind="critical" />
              <ConnLine x1={450} y1={260} x2={700} y2={150} kind="warning" />
              <ConnLine x1={450} y1={260} x2={160} y2={400} kind="default" />
              <ConnLine x1={450} y1={260} x2={740} y2={400} kind="active" />
              <path
                d="M 200 150 Q 450 40 700 150"
                fill="none"
                stroke="var(--danger-red)"
                strokeWidth={2.5}
                opacity={0.7}
              />
              <GraphBubble
                id="gallery-graph-aeo"
                x={200}
                y={150}
                r={78}
                status="danger"
                title="AI Search Visibility"
                stats={["41", "crit"]}
                onClick={noop}
                onMouseEnter={noop}
                onMouseLeave={noop}
              />
              <GraphBubble
                id="gallery-graph-retail"
                x={700}
                y={150}
                r={84}
                status="warning"
                title="Retail"
                stats={["68%"]}
                onClick={noop}
                onMouseEnter={noop}
                onMouseLeave={noop}
              />
              <GraphBubble
                id="gallery-graph-sat-l"
                x={160}
                y={400}
                r={50}
                status="neutral"
                title="Citations"
                stats={["12"]}
                onClick={noop}
                onMouseEnter={noop}
                onMouseLeave={noop}
              />
              <GraphBubble
                id="gallery-graph-sat-r"
                x={740}
                y={400}
                r={52}
                status="success"
                title="Schema"
                stats={["88%"]}
                onClick={noop}
                onMouseEnter={noop}
                onMouseLeave={noop}
              />
              <g transform="translate(450, 90)">
                <rect
                  className="correlation-badge"
                  x={-70}
                  y={-12}
                  width={140}
                  height={24}
                  rx={12}
                  filter="url(#nodeShadow)"
                />
                <text className="correlation-badge-text" x="0" y="4" textAnchor="middle" fontSize="10.5">
                  heritage vs value
                </text>
              </g>
              <GraphHub
                id="gallery-graph-hub"
                x={450}
                y={260}
                r={98}
                status="success"
                title="BRAND"
                stats={["74"]}
                onClick={noop}
                onMouseEnter={noop}
                onMouseLeave={noop}
              />
              <TourSpotlight active x={200} y={150} radius={88} category="CRITICAL SPOKE" />
            </svg>
          </div>
        </Stage>

        <Stage
          id="charts"
          title="Data displays"
          note="No cartesian charts. Score, mix, and workstream data use metric cards, tables, action lists, KPI targets, cadence notes, and the tour progress bar."
        >
          <MetricGrid>
            <MetricCard label="Buy Box" value="68%" tone="danger" sub="Target 95%" />
            <MetricCard label="AI Search Visibility" value="41" tone="warning" sub="−11 pts / 30d" />
            <MetricCard label="Schema" value="88%" tone="success" sub="Catalog coverage" />
            <MetricCard label="Action Items" value="18" tone="accent" sub="Queued this sprint" />
          </MetricGrid>

          <ContentBox
            title="Tracked queries"
            extra={<TagBadge tone="danger">100 simulations</TagBadge>}
          >
            <DataTable
              headers={["Prompt", "Appearance", "Winner"]}
              rows={[
                [
                  <strong key="q1">Best electric under $900</strong>,
                  <span key="a1" className="mono" style={{ color: "var(--danger-red)", fontWeight: 700 }}>
                    28%
                  </span>,
                  "PRS SE / Yamaha",
                ],
                [
                  <strong key="q2">Travel acoustic</strong>,
                  <span key="a2" className="mono" style={{ color: "var(--danger-red)", fontWeight: 700 }}>
                    11%
                  </span>,
                  "Taylor GS Mini",
                ],
                [
                  <strong key="q3">Strat vs PRS SE</strong>,
                  <span key="a3" className="mono" style={{ color: "var(--success-green)", fontWeight: 700 }}>
                    82%
                  </span>,
                  "Player II",
                ],
              ]}
            />
            <p className="kpi-target">Target: 95% buy-box integrity by Q4</p>
            <div className="cadence-note">
              <strong>Cadence:</strong> refresh weekly from the citation crawl. Escalate when a
              heritage prompt drops below 70%.
            </div>
            <p className="workstream-meta">
              <strong>Owner</strong> · Catalog ops · next review Friday
            </p>
          </ContentBox>

          <ActionCard
            title="Restore buy-box on Amazon"
            details="18 SKUs lost the featured offer after MAP drift."
            impact="Est. $240k / quarter"
            extra={<TagBadge tone="danger">P0</TagBadge>}
            tone="critical"
          />
          <ActionCard
            title="Seed value-tier AEO pages"
            details="Non-heritage prompts cite competitors first."
            extra={<TagBadge tone="info">Content</TagBadge>}
            tone="info"
          />
          <ActionCard
            title="Ship remaining schema"
            extra={<TagBadge tone="success">On track</TagBadge>}
            tone="success"
          >
            <span className="workstream-meta">Coverage 88% · remaining 42 SKUs</span>
          </ActionCard>

          <div className="tour-progress-bar-wrap" style={{ marginTop: 4 }}>
            <div className="tour-progress-bar-fill" style={{ width: "50%" }} />
          </div>
          <p className="design-caption">Tour progress bar — the only linear chart in the kernel.</p>
        </Stage>

        <Stage
          id="sidebar"
          title="Sidebar & chrome"
          note="The data sidebar is the drilldown panel: badge, title, tabs, and body. HUD legend, zoom, tooltip, header, and tour modal complete the shell."
        >
          <header className="top-header">
            <div className="brand-section">
              <img src="/icon.png" alt="" className="brand-logo-icon" />
              <div className="brand-title-group">
                <div className="brand-name">
                  Brand Canvas
                  <span className="tag-badge tag-danger" style={{ fontSize: "9.5px" }}>
                    Live
                  </span>
                </div>
                <div className="brand-sub">Omnichannel health</div>
              </div>
              <div className="pill-divider" />
              <div className="filter-selector">
                <Layers size={13} color="var(--accent-purple)" />
                <select aria-label="Chrome filter" defaultValue="all">
                  <option value="all">All layers</option>
                </select>
              </div>
            </div>
            <div className="header-ticker">
              <div className="ticker-item ticker-badge-danger">
                <span className="pulse-dot" />
                <span>Buy box</span>
              </div>
            </div>
            <div className="header-controls">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={12} />
                <input className="search-input" placeholder="Search..." readOnly />
              </div>
              <button className="hdr-btn hdr-btn-primary">
                <Compass size={12} />
                <span>Guided Tour</span>
              </button>
            </div>
          </header>

          <div className="design-split" style={{ marginTop: 12 }}>
            <aside className="drilldown-panel open">
              <div className="drilldown-header">
                <div className="drilldown-title-wrap">
                  <span className="drilldown-badge">Critical spoke · retail</span>
                  <h2 className="drilldown-title">Buy Box Integrity</h2>
                  <p className="drilldown-desc">Listing health across Amazon, Guitar Center, and DTC.</p>
                </div>
                <button className="drilldown-close-btn" type="button" title="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="drilldown-tabs">
                {previewTabs.map((tab, idx) => (
                  <button
                    key={tab}
                    className={`drilldown-tab-btn${idx === previewTab ? " active" : ""}`}
                    type="button"
                    onClick={() => setPreviewTab(idx)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="drilldown-body">
                {previewTab === 0 ? (
                  <MetricGrid>
                    <MetricCard label="Integrity" value="68%" tone="danger" />
                    <MetricCard label="Open fixes" value="18" tone="warning" />
                  </MetricGrid>
                ) : null}
                {previewTab === 1 ? (
                  <DataTable
                    headers={["SKU", "Offer"]}
                    rows={[
                      ["Player Strat", "Lost"],
                      ["Telecaster", "Won"],
                    ]}
                  />
                ) : null}
                {previewTab === 2 ? (
                  <ActionCard title="Restore MAP" extra={<TagBadge tone="danger">P0</TagBadge>} tone="critical">
                    18 SKUs
                  </ActionCard>
                ) : null}
              </div>
            </aside>

            <div className="tour-modal-card">
              <div className="tour-modal-header">
                <div className="tour-badge-group">
                  <span className="tour-step-pill">STEP 1 OF 4</span>
                  <span className="tour-category-badge">RETAIL</span>
                </div>
                <button className="tour-close-btn" type="button">
                  <X size={15} />
                </button>
              </div>
              <div className="tour-progress-bar-wrap">
                <div className="tour-progress-bar-fill" style={{ width: "25%" }} />
              </div>
              <div className="tour-modal-body">
                <div className="tour-title-area">
                  <h3 className="tour-spoke-title">Buy Box</h3>
                  <p className="tour-spoke-subtitle">Where featured offer is leaking.</p>
                </div>
                <div className="tour-info-card">
                  <div className="tour-card-header">
                    <Layout size={13} color="var(--accent-purple)" />
                    <span>What this spoke displays</span>
                  </div>
                  <ul className="tour-card-list">
                    <li>Integrity score vs 95% target</li>
                    <li>Lost SKUs by marketplace</li>
                  </ul>
                </div>
                <div className="tour-info-card primary-value">
                  <div className="tour-card-header">
                    <Sparkles size={13} color="var(--success-green)" />
                    <span style={{ color: "var(--success-text)" }}>Executive value</span>
                  </div>
                  <div className="tour-value-text">Recover $240k / quarter by restoring MAP.</div>
                </div>
              </div>
              <div className="tour-modal-footer">
                <div className="tour-dots-indicator">
                  <div className="tour-dot active" />
                  <div className="tour-dot" />
                  <div className="tour-dot" />
                  <div className="tour-dot" />
                </div>
                <div className="tour-nav-btns">
                  <button className="tour-btn" type="button">
                    Back
                  </button>
                  <button className="tour-btn tour-btn-primary" type="button">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="design-hud-row" style={{ marginTop: 12 }}>
            <div className="canvas-hud-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ borderColor: "var(--danger-red)" }} />
                <span>Critical</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ borderColor: "var(--warning-amber)" }} />
                <span>At risk</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ borderColor: "var(--success-green)" }} />
                <span>On track</span>
              </div>
            </div>
            <div className="hud-btn-group">
              <button className="hud-btn" type="button" title="Zoom in">
                <Plus size={16} />
              </button>
              <button className="hud-btn" type="button" title="Zoom out">
                <Minus size={16} />
              </button>
              <button className="hud-btn" type="button" title="Center">
                <Compass size={16} />
              </button>
            </div>
            <div className="node-tooltip visible">
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Buy Box</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                18 SKUs lost the featured offer after MAP drift.
              </div>
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
            </div>
          </div>
        </Stage>
      </div>
    </div>
  );
}
