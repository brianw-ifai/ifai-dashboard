import type { AmazonSpecGap } from "@/lib/fender-canvas/portfolio-retail";

/** Plain labels for Amazon spec fields (24 characters or fewer). */
const SPEC_FIELD_LABELS: Record<string, string> = {
  scale_length: "Scale length",
  hand_orientation: "Handedness",
  item_weight: "Weight",
  item_dimensions: "Dimensions",
  number_of_strings: "Strings",
  fretboard_material_type: "Fretboard",
  guitar_bridge_system: "Bridge",
  guitar_pickup_configuration: "Pickups",
  neck_material_type: "Neck",
  manufacturer_part_number: "Part number",
  body_material_type: "Body",
  color: "Color",
  upc: "UPC",
};

export type SpecFieldFindingLine = {
  field: string;
  label: string;
  count: number;
};

export type SpecFieldFindings = {
  fillFirst: SpecFieldFindingLine[];
  howClose: {
    oneField: number;
    twoFields: number;
    mostOfTheSpec: number;
  };
};

const LABEL_MAX = 24;
const LABEL_ELLIPSIS_AT = 21;

/** Display label for a stored Amazon field name. */
export function specFieldLabel(field: string): string {
  const known = SPEC_FIELD_LABELS[field];
  if (known) return known;
  const titled = field
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
  if (titled.length <= LABEL_MAX) return titled;
  return `${titled.slice(0, LABEL_ELLIPSIS_AT).trimEnd()}...`;
}

/**
 * Rank missing Amazon spec fields across checked listings with gaps.
 * Count a field once per listing. Fill first is the top three by count, then label.
 */
export function specFieldFindings(gaps: AmazonSpecGap[]): SpecFieldFindings {
  const fieldCounts = new Map<string, number>();
  let oneField = 0;
  let twoFields = 0;
  let mostOfTheSpec = 0;

  for (const gap of gaps) {
    const fields = gap.missingFields;
    const unique = new Set(fields);
    for (const field of unique) {
      fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
    }
    const n = fields.length;
    if (n === 1) oneField += 1;
    else if (n === 2) twoFields += 1;
    else if (n >= 11) mostOfTheSpec += 1;
  }

  const fillFirst = [...fieldCounts.entries()]
    .map(([field, count]) => ({ field, label: specFieldLabel(field), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 3);

  return {
    fillFirst,
    howClose: { oneField, twoFields, mostOfTheSpec },
  };
}
