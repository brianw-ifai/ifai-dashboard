"use client";

import { useMemo, useSyncExternalStore } from "react";

/* Per-viewer panel state (owners, stars, hidden explainers) lives in
   localStorage for now. It is read as an external store so the server render
   starts from the empty value and the stored value arrives on subscribe,
   rather than being pulled in during render where it would mismatch.

   This is the seam to replace when per-user state moves to Supabase: swap the
   read/write pair below for the row fetch and keep the hook signature. */

export type LocalStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T) => void;
};

export function createLocalStore<T>(
  key: string,
  empty: T,
  revive: (raw: unknown) => T,
): LocalStore<T> {
  let snapshot = empty;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!loaded) {
        loaded = true;
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            snapshot = revive(JSON.parse(raw));
            emit();
          }
        } catch {
          /* private browsing or blocked storage — stay on the empty value */
        }
      }
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => empty,
    set(next) {
      snapshot = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* keep the in-memory value so the session still behaves */
      }
      emit();
    },
  };
}

export function useLocalStore<T>(
  key: string,
  empty: T,
  revive: (raw: unknown) => T,
): [T, (next: T) => void, LocalStore<T>] {
  const store = useMemo(
    () => createLocalStore(key, empty, revive),
    // `empty` and `revive` are module constants at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return [value, store.set, store];
}
