/**
 * Two identities for an AI Search question.
 * `prompt_key` is the logical lineage.
 * The query version is that key plus the exact stored prompt text.
 * Editing the wording creates a new version. Historical calls keep the text they stored.
 */

export function fnv1a32(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Immutable identity of one exact wording. The stored text is not trimmed or rewritten. */
export function queryVersionKey(
  promptKey: string | null | undefined,
  promptText: string | null | undefined,
): string {
  const key = promptKey ?? "";
  const text = promptText ?? "";
  return `${key}:${fnv1a32(`${key}\n${text}`).toString(16).padStart(8, "0")}`;
}
