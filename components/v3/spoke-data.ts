import { buildNarrativeSpokes } from "@/lib/fender-canvas/spoke-narrative";

export type { SpokeDefinition, SpokeId } from "@/components/v3/spoke-data-types";

/** Narrative copy and tab HTML templates (`data/fender-v3-spec.json`). */
export const spokeData = buildNarrativeSpokes();
