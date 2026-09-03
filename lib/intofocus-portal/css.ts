import type { CSSProperties } from "react";

const STYLE_CACHE = new Map<string, CSSProperties>();

/** Parse inline CSS string to React style object (cached). */
export function css(raw: string): CSSProperties {
  let cached = STYLE_CACHE.get(raw);
  if (cached) return cached;

  const style: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[camel] = value;
  }

  cached = style as CSSProperties;
  STYLE_CACHE.set(raw, cached);
  return cached;
}
