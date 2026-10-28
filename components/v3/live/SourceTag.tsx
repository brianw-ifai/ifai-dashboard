"use client";

/** Where a number comes from. Estimate marks a figure built from more than one source. */
export type DataSource = "Keepa" | "SmartScout" | "Estimate";

const SOURCE_TITLES: Record<DataSource, string> = {
  Keepa: "From Keepa's Amazon price, stock and sales-rank history.",
  SmartScout: "From SmartScout's Amazon sales estimates.",
  Estimate: "Analyst estimate built from Keepa and SmartScout inputs. Not reported sales.",
};

export function SourceTag({ source }: { source: DataSource }) {
  return (
    <span
      className={`source-tag source-tag-${source.toLowerCase()}`}
      title={SOURCE_TITLES[source]}
      data-source={source}
    >
      {source}
    </span>
  );
}

/** Marks a section or figure added recently. Remove once it is no longer new. */
export function NewTag() {
  return (
    <span className="tag-badge new-tag" title="Recently added to the dashboard." data-new-tag>
      New
    </span>
  );
}
