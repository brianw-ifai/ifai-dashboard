/**
 * Satellite hero faces (a title, one big value, a short label) at fixed, readable text
 * sizes. The circle grows to hold the text; the text never shrinks to fit the circle.
 */

export const SATELLITE_HERO_TEXT = { title: 13, value: 30, label: 12.5 } as const;

/** Width estimates per character, as a share of font size. Generous so text clears the ring. */
const WIDTH_PER_CHAR = { title: 0.6, value: 0.6, valueText: 0.58, label: 0.58 } as const;
const RING_PAD = 7;
const TITLE_GAP = 5;
const LABEL_GAP = 4;

type Row = { text: string; size: number; kind: keyof typeof WIDTH_PER_CHAR };

export type HeroRow = Row & { baseline: number };

export type HeroFaceLayout = {
  /** Smallest radius whose ring clears every row. */
  radius: number;
  rows: HeroRow[];
};

function rowWidth(row: Row): number {
  return row.text.length * row.size * WIDTH_PER_CHAR[row.kind];
}

function rowHeight(row: Row): number {
  return row.kind === "value" ? row.size * 0.82 : row.size * 1.12;
}

function twoLineSplits(text: string): string[][] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [];
  const splits: string[][] = [];
  for (let i = 1; i < words.length; i += 1) {
    splits.push([words.slice(0, i).join(" "), words.slice(i).join(" ")]);
  }
  return splits;
}

/** The most even two-line split of a worded value, or the text itself when it is one word. */
function splitWords(text: string): string[] {
  const [best] = twoLineSplits(text).sort(
    (a, b) => Math.max(a[0].length, a[1].length) - Math.max(b[0].length, b[1].length),
  );
  return best ?? [text.trim()];
}

function layoutRows(titleLines: string[], value: string, labelLines: string[]): HeroFaceLayout {
  // A worded empty state ("No resolved answers") reads at label size, not as a giant number.
  const valueRows: Row[] = /\s/.test(value.trim())
    ? splitWords(value).map((text) => ({ text, size: SATELLITE_HERO_TEXT.label, kind: "valueText" as const }))
    : [{ text: value, size: SATELLITE_HERO_TEXT.value, kind: "value" as const }];
  const rows: Row[] = [
    ...titleLines.map((text) => ({ text, size: SATELLITE_HERO_TEXT.title, kind: "title" as const })),
    ...valueRows,
    ...labelLines.map((text) => ({ text, size: SATELLITE_HERO_TEXT.label, kind: "label" as const })),
  ];
  const gaps = rows.map((row, index) => {
    if (index === 0) return 0;
    const prev = rows[index - 1];
    if (prev.kind === "title" && row.kind !== "title") return TITLE_GAP;
    if (prev.kind !== "label" && row.kind === "label") return LABEL_GAP;
    return 1;
  });
  const total = rows.reduce((sum, row, index) => sum + gaps[index] + rowHeight(row), 0);
  let top = -total / 2;
  let radius = 0;
  const placed: HeroRow[] = rows.map((row, index) => {
    top += gaps[index];
    const height = rowHeight(row);
    const bottom = top + height;
    const halfWidth = rowWidth(row) / 2 + RING_PAD;
    const edge = Math.max(Math.abs(top), Math.abs(bottom));
    radius = Math.max(radius, Math.hypot(halfWidth, edge));
    const baseline = row.kind === "value" ? bottom : top + row.size * 0.86;
    top = bottom;
    return { ...row, baseline };
  });
  return { radius: Math.ceil(radius), rows: placed };
}

/**
 * Lay out a satellite hero face around the circle's center. The title and the label may
 * each take one or two lines; whichever arrangement needs the smallest circle wins.
 */
export function satelliteHeroLayout(title: string, value: string, label: string): HeroFaceLayout {
  const titleOptions = [[title.trim()], ...twoLineSplits(title)];
  const labelOptions = [[label.trim()], ...twoLineSplits(label)];
  let best: HeroFaceLayout | null = null;
  let bestScore = Infinity;
  for (const titleLines of titleOptions) {
    for (const labelLines of labelOptions) {
      const next = layoutRows(titleLines, value, labelLines);
      // A one-line title and label read best; a wrap has to save real room to win.
      const score = next.radius * (1 + 0.12 * (titleLines.length - 1) + 0.12 * (labelLines.length - 1));
      if (score < bestScore) {
        best = next;
        bestScore = score;
      }
    }
  }
  return best!;
}

/** The radius a satellite needs: its stored radius, or larger when its hero text needs it. */
export function satelliteFitRadius(node: {
  r: number;
  title: string;
  heroValue?: { value: string; label: string };
}): number {
  if (!node.heroValue) return node.r;
  return Math.max(node.r, satelliteHeroLayout(node.title, node.heroValue.value, node.heroValue.label).radius);
}
