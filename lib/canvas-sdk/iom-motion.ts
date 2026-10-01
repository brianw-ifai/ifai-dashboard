/** IOM / v3 canvas motion multiplier (1 = default; lower = faster). */
export const IOM_MOTION_SCALE = 1;

export function iomMotionMs(baseMs: number): number {
  return Math.round(baseMs * IOM_MOTION_SCALE);
}

/** Map fade/slide — keep in sync with `iom-map-exit` / `iom-map-enter` in iom-theme.css (0.48s). */
export const IOM_MAP_EXIT_BASE_MS = 480;

/** Column rail slide — keep in sync with `iom-column-rail-in` / `iom-column-rail-out` (0.48s). */
export const IOM_RAIL_MOTION_BASE_MS = 480;
