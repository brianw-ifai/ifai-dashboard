import { formatAsOf, formatInt, formatPct, formatRate, formatUsd, isRate, UNAVAILABLE_WORD } from "../reading/format";
import { statusLabel, type ColumnType } from "./table-model";

/**
 * Text for one table cell by column type. A missing value reads "unavailable",
 * never a digit.
 */
export function formatCell(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined || value === "") return UNAVAILABLE_WORD;
  if (isRate(value)) return formatRate(value);
  switch (type) {
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return UNAVAILABLE_WORD;
      return Number.isInteger(n) ? formatInt(n) : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    case "usd": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? formatUsd(n) : UNAVAILABLE_WORD;
    }
    case "percent": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? formatPct(n) : UNAVAILABLE_WORD;
    }
    case "date":
      return formatAsOf(value instanceof Date ? value.toISOString() : String(value));
    case "boolean":
      if (typeof value === "boolean") return value ? "yes" : "no";
      if (value === "true") return "yes";
      if (value === "false") return "no";
      return UNAVAILABLE_WORD;
    case "status":
      return statusLabel(String(value));
    case "enum":
    case "text":
    default:
      return typeof value === "object" ? JSON.stringify(value) : String(value);
  }
}
