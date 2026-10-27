/**
 * One-line content floors for ResizableTable columns.
 * Measures inside the canvas so table and badge fonts apply.
 */

const MEASURE_MAX_BODY_ROWS = 48;

/**
 * Width needed for the cell's contents on one line, including cell padding.
 * Block children (e.g. engine + model) still stack; width is the widest line.
 */
function measureCellOneLineWidth(cell: HTMLElement, host: HTMLElement, tableClass: string): number {
  const probe = document.createElement("table");
  probe.className = tableClass;
  probe.style.cssText = "table-layout:auto;width:max-content;border-collapse:separate;";
  const section = document.createElement(cell.closest("thead") ? "thead" : "tbody");
  const row = document.createElement("tr");
  const clone = cell.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".col-resize-handle").forEach((node) => node.remove());
  clone.style.cssText = "white-space:nowrap;width:auto;max-width:none;overflow:visible;";
  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    if (node.classList.contains("tag-badge")) {
      node.style.whiteSpace = "nowrap";
      node.style.maxWidth = "none";
    }
  });
  row.appendChild(clone);
  section.appendChild(row);
  probe.appendChild(section);
  host.replaceChildren(probe);
  return Math.ceil(clone.getBoundingClientRect().width);
}

/**
 * Minimum pixel width per column so typical cells stay on one line.
 * Skip the fill column: that column is allowed to wrap into leftover panel width.
 */
export function measureColumnOneLineMins(
  table: HTMLTableElement,
  columnIds: readonly string[],
  skipColumnId?: string,
): Record<string, number> {
  const mins: Record<string, number> = {};
  for (const id of columnIds) mins[id] = 0;
  if (typeof document === "undefined" || columnIds.length === 0) return mins;

  const root = table.closest(".ifai-canvas") ?? document.body;
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;contain:layout style;";
  root.appendChild(host);

  try {
    let bodySeen = 0;
    for (const row of Array.from(table.rows)) {
      const inBody = row.parentElement?.tagName === "TBODY";
      if (inBody) {
        if (bodySeen >= MEASURE_MAX_BODY_ROWS) continue;
        bodySeen += 1;
      }
      const cells = Array.from(row.cells);
      for (let index = 0; index < cells.length && index < columnIds.length; index += 1) {
        const id = columnIds[index];
        if (!id || id === skipColumnId) continue;
        const cell = cells[index];
        if (!cell || cell.colSpan !== 1) continue;
        mins[id] = Math.max(mins[id], measureCellOneLineWidth(cell, host, table.className));
      }
    }
  } finally {
    host.remove();
  }
  return mins;
}
