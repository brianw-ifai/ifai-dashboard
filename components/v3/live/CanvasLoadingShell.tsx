"use client";

export function CanvasLoadingShell() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas, #0b0f17)",
        color: "var(--text-muted, #94a3b8)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid rgba(148,163,184,0.25)",
            borderTopColor: "var(--accent-purple, #6366f1)",
            animation: "ifai-spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ fontSize: 14, margin: 0 }}>Loading live canvas metrics…</p>
        <style>{`@keyframes ifai-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
