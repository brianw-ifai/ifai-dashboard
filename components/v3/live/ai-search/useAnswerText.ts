"use client";

import { useEffect, useState } from "react";
import { answerTextQuery } from "@/lib/ai-search/queries";
import { getCanvasSupabase } from "@/lib/supabase/canvas-client";

export type AnswerRead =
  | { status: "loading" }
  | { status: "ready"; text: string | null }
  | { status: "error"; message: string };

/** The stored answer for one call, read when its evidence view opens. */
export function useAnswerText(id: string): AnswerRead {
  const [answer, setAnswer] = useState<AnswerRead>({ status: "loading" });
  const [readId, setReadId] = useState(id);
  if (readId !== id) {
    setReadId(id);
    setAnswer({ status: "loading" });
  }

  useEffect(() => {
    let cancelled = false;
    void answerTextQuery(getCanvasSupabase() as never, id).then(({ answer: text, error }) => {
      if (cancelled) return;
      setAnswer(error ? { status: "error", message: error } : { status: "ready", text });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return answer;
}

export function answerCopy(answer: AnswerRead, emptyMessage: string): string {
  if (answer.status === "loading") return "Loading the stored answer.";
  if (answer.status === "error") return `The answer did not load. ${answer.message}`;
  return answer.text ?? emptyMessage;
}
