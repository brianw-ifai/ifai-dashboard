"use client";

import { css } from "@/lib/intofocus-portal/css";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useState } from "react";

type HoverButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  hoverStyle?: string;
  children: ReactNode;
};

/** Merge base + hover styles without mixing border shorthand and borderColor. */
function mergeHoverStyle(base: CSSProperties, hoverRaw?: string): CSSProperties {
  if (!hoverRaw) return base;
  const hover = css(hoverRaw);
  if (!("borderColor" in hover) || !("border" in base)) {
    return { ...base, ...hover };
  }
  const { border, ...rest } = base;
  const parts = String(border).split(/\s+/);
  return {
    ...rest,
    ...hover,
    borderWidth: parts[0] ?? "1px",
    borderStyle: parts[1] ?? "solid",
    borderColor: hover.borderColor ?? parts.slice(2).join(" ") ?? "#e8e8ec",
  };
}

/** Button that applies optional hover styles from the original DC template. */
export function HoverButton({
  hoverStyle,
  style,
  onMouseEnter,
  onMouseLeave,
  children,
  ...rest
}: HoverButtonProps) {
  const [hovered, setHovered] = useState(false);
  const base = typeof style === "object" && style ? style : {};
  const merged = mergeHoverStyle(base, hovered ? hoverStyle : undefined);

  return (
    <button
      {...rest}
      style={merged}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}
