"use client";

import { css } from "@/lib/intofocus-portal/css";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useState } from "react";

type HoverButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  hoverStyle?: string;
  children: ReactNode;
};

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
  const merged: CSSProperties = {
    ...(typeof style === "object" && style ? style : {}),
    ...(hovered && hoverStyle ? css(hoverStyle) : {}),
  };

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
