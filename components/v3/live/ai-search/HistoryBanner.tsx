"use client";

import { useAiHistory } from "@/components/v3/live/ai-search/AiHistoryContext";
import { STORED_RUN_COPY_LABEL } from "@/lib/ai-search/review-runs";

export function HistoryBanner({ heading, detail }: { heading: string; detail: string }) {
  const history = useAiHistory();
  return (
    <div className="ai-history-banner" role="status" data-ai-history-banner>
      <p>
        <strong>{heading}</strong> {detail}
      </p>
      {history.source === "fixture" ? (
        <p data-ai-history-fixture>{STORED_RUN_COPY_LABEL}</p>
      ) : null}
      <button type="button" data-ai-history-return onClick={history.viewMonth}>
        Last 30 days
      </button>
    </div>
  );
}
