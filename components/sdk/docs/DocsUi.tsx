import type { ReactNode } from "react";

export function Code({ label, children }: { label?: string; children: string }) {
  return (
    <div className="sdk-docs-code">
      <div className="sdk-docs-code-bar">
        <span>{label ?? "TSX"}</span>
        <span>@/lib/canvas-sdk</span>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

export function PropTable({
  rows,
}: {
  rows: { name: string; type: string; defaultValue?: string; desc: ReactNode }[];
}) {
  return (
    <div className="sdk-docs-table-wrap">
      <table className="sdk-docs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>
                <code>{row.type}</code>
              </td>
              <td>{row.defaultValue ? <code>{row.defaultValue}</code> : "—"}</td>
              <td>{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
