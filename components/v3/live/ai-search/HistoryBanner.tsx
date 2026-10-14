"use client";

import { useAiHistory } from "@/components/v3/live/ai-search/AiHistoryContext";

export function HistoryBanner({ heading, detail }: { heading: string; detail: string }) {
  const history = useAiHistory();
  return (
    <div className="ai-history-banner" role="status" data-ai-history-banner>
      <p>
        <strong>{heading}</strong> {detail}
      </p>
      {history.source === "fixture" ? (
        <p data-ai-history-fixture>Sample history for review, not the live database.</p>
      ) : null}
      <button type="button" data-ai-history-return onClick={history.viewCurrent}>
        Return to current
      </button>
    </div>
  );
}
