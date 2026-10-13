import { formatInt } from "@/lib/fender-canvas/format";

/** Two stored counts, shown apart. Never added together. */
export function coverageExceptionLabel(notChecked: number, checkFailed: number): string {
  return `${formatInt(notChecked)} unchecked · ${formatInt(checkFailed)} failed`;
}

/** Full coverage only when both exception counts are zero. */
export function coverageExceptionsHealthy(notChecked: number, checkFailed: number): boolean {
  return notChecked === 0 && checkFailed === 0;
}
