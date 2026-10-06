"use client";

import { useCallback, useEffect, useState } from "react";
import { simulationDetailQuery, simulationsQuery } from "@/lib/canvasData";
import type { CanvasSimulationRow } from "@/lib/fender-canvas/types";
import { formatInt } from "@/lib/fender-canvas/format";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "electrics", label: "Electrics" },
  { value: "acoustics", label: "Acoustics" },
  { value: "beginner", label: "Beginner" },
  { value: "amps", label: "Amps" },
  { value: "basses", label: "Basses" },
  { value: "squier", label: "Squier" },
  { value: "hallucinations", label: "Hallucinations" },
];

export function FenderSimulationsPanel() {
  const [rows, setRows] = useState<CanvasSimulationRow[]>([]);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    answer_text?: string | null;
    citation_urls?: string[] | null;
    root_cause?: string | null;
    remediation_patch?: string | null;
  } | null>(null);

  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error, count } = await simulationsQuery(category || undefined, page, pageSize);
    if (!error) {
      setRows((data ?? []) as CanvasSimulationRow[]);
      setTotal(count ?? null);
    }
    setLoading(false);
  }, [category, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    void simulationDetailQuery(detailId).then(({ data }) => setDetail(data));
  }, [detailId]);

  const pages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <div className="content-box">
      <div className="content-box-title">
        <span>AI Simulations (Live)</span>
        {total != null ? (
          <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
        ) : null}
      </div>

      <select
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setPage(0);
        }}
        style={{ marginBottom: 8, fontSize: 12 }}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value || "all"} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading && rows.length === 0 ? <p style={{ fontSize: 12 }}>Loading simulations…</p> : null}
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`action-card${row.hallucination_flag ? " critical" : ""}`}
            style={{ textAlign: "left", cursor: "pointer" }}
            onClick={() => setDetailId(row.id)}
          >
            <div className="action-head">
              <span>
                [{row.engine ?? "n/a"} · {row.category ?? "n/a"}] {row.prompt ?? "n/a"}
              </span>
              <span className="tag-badge tag-neutral">{row.winner ?? "n/a"}</span>
            </div>
            {row.hallucination_flag ? (
              <div className="action-details" style={{ color: "var(--danger-red)" }}>
                Hallucination flagged
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {detailId && detail ? (
        <div className="content-box" style={{ marginTop: 12 }}>
          <div className="content-box-title">Simulation detail</div>
          <p style={{ fontSize: 12 }}>
            <strong>Root cause:</strong> {detail.root_cause ?? "n/a"}
          </p>
          <p style={{ fontSize: 12 }}>
            <strong>Remediation:</strong> {detail.remediation_patch ?? "n/a"}
          </p>
          <p style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
            <strong>Answer:</strong> {detail.answer_text ?? "n/a"}
          </p>
          {detail.citation_urls?.length ? (
            <ul style={{ fontSize: 11 }}>
              {detail.citation_urls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" className="segmented-btn" onClick={() => setDetailId(null)}>
            Close detail
          </button>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="segmented-btn"
          disabled={page <= 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span style={{ fontSize: 11 }}>{page + 1} / {pages}</span>
        <button
          type="button"
          className="segmented-btn"
          disabled={page + 1 >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
