import type { CanvasSpec } from "@/lib/canvas-sdk/types";

function GraphStage({ spec }: { spec: CanvasSpec }) {
  if (spec.appearance !== "iom") return null;
  const hub = spec.nodes?.find((node) => node.variant === "hub");
  const cx = hub?.x ?? 800;
  const cy = hub?.y ?? 500;
  // Swirl occupies the upper mark; pin that center on the hub and clip the wordmark off.
  const swirlWidth = 720;
  const imgW = swirlWidth / 0.366;
  const imgH = imgW * (4500 / 8000);
  const imgX = cx - imgW / 2;
  const imgY = cy - imgH * 0.4436;

  return (
    <g className="graph-stage" pointerEvents="none">
      <g className="stage-washes stage-washes-dark">
        <ellipse cx={cx} cy={cy} rx={980} ry={680} fill="url(#iomStageCore)" />
        <ellipse cx={cx - 560} cy={cy - 350} rx={720} ry={540} fill="url(#iomStageBlue)" />
        <ellipse cx={cx + 560} cy={cy + 350} rx={800} ry={580} fill="url(#iomStageLilac)" />
      </g>
      <g className="stage-washes stage-washes-light">
        <ellipse cx={cx} cy={cy} rx={980} ry={680} fill="url(#iomStageCoreLight)" />
        <ellipse cx={cx - 560} cy={cy - 350} rx={720} ry={540} fill="url(#iomStageBlueLight)" />
        <ellipse cx={cx + 560} cy={cy + 350} rx={800} ry={580} fill="url(#iomStageLilacLight)" />
      </g>
      <g clipPath="url(#iomWatermarkClip)">
        <image
          href="/intofocus-ai-logo-stacked-full-color.png"
          x={imgX}
          y={imgY}
          width={imgW}
          height={imgH}
          opacity={0.13}
        />
      </g>
    </g>
  );
}

/** Full-map washes and watermark. Hidden in the column rail. */
export function IomGraphBackdrop({ spec }: { spec: CanvasSpec }) {
  if (spec.appearance !== "iom") return null;
  const hub = spec.nodes?.find((node) => node.variant === "hub");
  const mapViewBox = spec.viewBox ?? { w: 1600, h: 1000 };
  return (
    <svg
      className="canvas-stage"
      viewBox={`0 0 ${mapViewBox.w} ${mapViewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="iomStageCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#143458" stopOpacity="0.62" />
          <stop offset="72%" stopColor="#143458" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iomStageBlue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iomStageLilac" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.12" />
          <stop offset="65%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iomStageCoreLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
          <stop offset="72%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iomStageBlueLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iomStageLilacLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.16" />
          <stop offset="65%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
        <clipPath id="iomWatermarkClip">
          <rect x={(hub?.x ?? 800) - 400} y={(hub?.y ?? 500) - 300} width={800} height={580} />
        </clipPath>
      </defs>
      <GraphStage spec={spec} />
    </svg>
  );
}
