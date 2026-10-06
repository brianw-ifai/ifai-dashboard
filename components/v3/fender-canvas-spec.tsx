import { buildStaticFenderCanvasSpec } from "@/lib/fender-canvas/build-canvas-spec";

export {
  buildFenderCanvasSpec,
  buildStaticFenderCanvasSpec,
} from "@/lib/fender-canvas/build-canvas-spec";

/** Static fallback spec (legacy hardcoded nodes) for tests and offline builds. */
export const fenderCanvasSpec = buildStaticFenderCanvasSpec();
