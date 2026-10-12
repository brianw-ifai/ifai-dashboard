const EMPTY = new Set(["", "null", "undefined", "none", "n/a", "tbd", "pending"]);

function squash(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * A stored remediation or root cause worth showing: present, not a placeholder,
 * and not a copy of the engine's own answer. Anything else is hidden.
 */
export function genuineGuidance(
  value: string | null | undefined,
  answerText?: string | null,
): string | null {
  const text = value?.trim() ?? "";
  if (EMPTY.has(text.toLowerCase())) return null;
  if (answerText) {
    const answer = squash(answerText);
    const candidate = squash(text);
    if (candidate.length >= 20 && answer.includes(candidate)) return null;
    if (candidate === answer) return null;
  }
  return text;
}
