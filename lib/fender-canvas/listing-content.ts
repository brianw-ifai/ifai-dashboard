/**
 * Amazon A+ Matrix: listing content on live Amazon listings (public.canvas_listing_content).
 * Bullets come from Keepa product objects and match the live page.
 * A+ and video: 'present' is confirmed. 'none_reported' is unknown, so it is never counted as absent.
 * Only a confirmed 'absent' state (a live-page read) puts a listing in an A+ or video denominator.
 */

import type { PieDiscData } from "@/lib/ai-search/citation-pies";
import type { ShareHeroModel } from "@/components/v3/live/ShareHeroCard";
import { formatInt, formatPct, formatRatio } from "@/lib/fender-canvas/format";
import { getCanvasSupabase } from "@/lib/supabase/canvas-client";

/** Amazon's standard bullet slots on a listing. */
export const FULL_BULLETS = 5;

export const LISTING_CONTENT_COLUMNS =
  "asin,title,bullet_count,image_count,aplus_state,aplus_module_count,video_state,video_count,checked_at";

export type ListingContentRow = {
  asin: string;
  title: string | null;
  bullet_count: number | null;
  image_count: number | null;
  aplus_state: string | null;
  aplus_module_count: number | null;
  video_state: string | null;
  video_count: number | null;
  checked_at: string | null;
};

export type ContentHeroId = "bullets" | "aplus" | "video";

export type ListingContentSummary = {
  rows: ListingContentRow[];
  bulletsRead: number;
  fullBullets: number;
  aplusPresent: number;
  aplusAbsent: number;
  videoPresent: number;
  videoAbsent: number;
};

export function hasFullBullets(row: ListingContentRow): boolean {
  return (row.bullet_count ?? 0) >= FULL_BULLETS;
}

export function summarizeListingContent(rows: readonly ListingContentRow[]): ListingContentSummary {
  const count = (keep: (row: ListingContentRow) => boolean) => rows.filter(keep).length;
  return {
    rows: [...rows],
    bulletsRead: count((row) => row.bullet_count != null),
    fullBullets: count((row) => row.bullet_count != null && hasFullBullets(row)),
    aplusPresent: count((row) => row.aplus_state === "present"),
    aplusAbsent: count((row) => row.aplus_state === "absent"),
    videoPresent: count((row) => row.video_state === "present"),
    videoAbsent: count((row) => row.video_state === "absent"),
  };
}

type PageRead = PromiseLike<{ data: unknown; error: { message: string } | null }>;

export type ListingContentClient = {
  from: (view: string) => {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        range: (from: number, to: number) => PageRead;
      };
    };
  };
};

const READ_PAGE = 1000;
const MAX_READS = 10;

/** Every live listing on the content view, read in pages. Throws on a failed read. */
export async function loadListingContent(client?: ListingContentClient): Promise<ListingContentSummary> {
  const supabase = client ?? (getCanvasSupabase() as unknown as ListingContentClient);
  const rows: ListingContentRow[] = [];
  for (let read = 0; read < MAX_READS; read += 1) {
    const from = read * READ_PAGE;
    const { data, error } = await supabase
      .from("canvas_listing_content")
      .select(LISTING_CONTENT_COLUMNS)
      .order("asin", { ascending: true })
      .range(from, from + READ_PAGE - 1);
    if (error) throw new Error(`canvas_listing_content: ${error.message}`);
    const batch = (data ?? []) as ListingContentRow[];
    rows.push(...batch);
    if (batch.length < READ_PAGE) break;
  }
  return summarizeListingContent(rows);
}

function shareColor(pct: number): string {
  if (pct >= 98) return "var(--success-green)";
  if (pct >= 95) return "var(--warning-amber)";
  return "var(--danger-red)";
}

function sharePie(id: string, title: string, labels: [string, string], has: number, total: number): PieDiscData | null {
  if (total <= 0 || has < 0 || has > total) return null;
  return {
    id,
    title,
    total,
    totalLabel: "live Amazon listings checked",
    slices: [
      { key: "matched", label: labels[0], count: has },
      { key: "contradicted", label: labels[1], count: total - has },
    ].filter((slice) => slice.count > 0),
  };
}

function shareHero(
  id: ContentHeroId,
  label: string,
  definition: string,
  has: number,
  total: number,
  labels: [string, string],
  explainer: string,
  unavailable: string,
): ShareHeroModel {
  const ready = total > 0;
  const pct = ready ? (100 * has) / total : null;
  return {
    id,
    label,
    definition,
    percent: pct != null ? formatPct(pct) : "Not available*",
    ratio: ready ? formatRatio(has, total) : null,
    color: pct != null ? shareColor(pct) : "var(--warning-amber)",
    pie: ready ? sharePie(`content-${id}`, label, labels, has, total) : null,
    tip: ready ? `${formatInt(has)} of ${formatInt(total)} live Amazon listings checked.` : null,
    explainer: ready ? explainer : unavailable,
    numerator: ready ? has : null,
    denominator: ready ? total : null,
  };
}

export const FULL_BULLETS_DEFINITION =
  "All five Amazon bullet points are filled. Bullets are the first copy an AI shopping assistant quotes about a listing.";
export const APLUS_DEFINITION =
  "Amazon A+ content: the enhanced modules below the bullets, such as feature images, comparison charts, and brand story.";
export const VIDEO_DEFINITION = "A product video on the Amazon listing.";

function pendingNote(present: number, noun: string): string {
  return present > 0
    ? `Confirmed on ${formatInt(present)} live listings. Absence is not read yet.`
    : `No ${noun} read yet.`;
}

export function listingContentHeroes(summary: ListingContentSummary | null): ShareHeroModel[] {
  if (!summary) {
    const empty = (id: ContentHeroId, label: string, definition: string) =>
      shareHero(id, label, definition, 0, 0, ["", ""], "", "The Amazon listing-content read could not be loaded.");
    return [
      empty("bullets", "Five bullets filled", FULL_BULLETS_DEFINITION),
      empty("aplus", "A+ content", APLUS_DEFINITION),
      empty("video", "Product video", VIDEO_DEFINITION),
    ];
  }
  const aplusKnown = summary.aplusAbsent > 0 ? summary.aplusPresent + summary.aplusAbsent : 0;
  const videoKnown = summary.videoAbsent > 0 ? summary.videoPresent + summary.videoAbsent : 0;
  return [
    shareHero(
      "bullets",
      "Five bullets filled",
      FULL_BULLETS_DEFINITION,
      summary.fullBullets,
      summary.bulletsRead,
      ["Five bullets", "Fewer than five"],
      "Every bullet slot carries copy.",
      "No bullet read yet.",
    ),
    shareHero(
      "aplus",
      "A+ content",
      APLUS_DEFINITION,
      summary.aplusPresent,
      aplusKnown,
      ["A+ present", "No A+"],
      "A+ modules are on the listing.",
      pendingNote(summary.aplusPresent, "A+"),
    ),
    shareHero(
      "video",
      "Product video",
      VIDEO_DEFINITION,
      summary.videoPresent,
      videoKnown,
      ["Video present", "No video"],
      "A video is on the listing.",
      pendingNote(summary.videoPresent, "video"),
    ),
  ];
}

/** Rows the open hero's table lists: the gap for that hero, never an unknown state. */
export function contentGapRows(summary: ListingContentSummary, hero: ContentHeroId): ListingContentRow[] {
  if (hero === "bullets") return summary.rows.filter((row) => row.bullet_count != null && !hasFullBullets(row));
  if (hero === "aplus") return summary.rows.filter((row) => row.aplus_state === "absent");
  return summary.rows.filter((row) => row.video_state === "absent");
}

export function contentStateLabel(state: string | null): string {
  if (state === "present") return "Present";
  if (state === "absent") return "None";
  if (state === "none_reported") return "Not confirmed";
  return "Not read";
}

export type BulletCounts = { listings: number; fullBullets: number; short: number; pct: number };

/** Bullet counts for the satellite and queue item. Null when the read failed or holds no bullets. */
export function bulletCounts(summary: ListingContentSummary | null | undefined): BulletCounts | null {
  if (!summary || summary.bulletsRead === 0) return null;
  return {
    listings: summary.bulletsRead,
    fullBullets: summary.fullBullets,
    short: summary.bulletsRead - summary.fullBullets,
    pct: (100 * summary.fullBullets) / summary.bulletsRead,
  };
}
