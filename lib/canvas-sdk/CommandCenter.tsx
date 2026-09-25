"use client";

import type {
  CommandCenterSpec,
  PriorityItem,
  PriorityOwner,
} from "@/lib/canvas-sdk/types";
import { useLocalStore } from "@/lib/canvas-sdk/local-store";
import { ArrowRight, Building2, Check, Sparkles, Undo2 } from "lucide-react";
import { useCallback, useMemo } from "react";

type ItemState = {
  owner: PriorityOwner;
  done: boolean;
};

type StoredState = Record<string, ItemState>;

const OWNER_LABEL: Record<Exclude<PriorityOwner, "unassigned">, string> = {
  intofocus: "IntoFocus AI",
  client: "Client team",
};

const EMPTY_STATE: StoredState = {};

/** Per-viewer for now; see local-store for the Supabase swap point. */
function revive(raw: unknown): StoredState {
  return raw && typeof raw === "object" ? (raw as StoredState) : EMPTY_STATE;
}

type Props = {
  spec: CommandCenterSpec;
  onOpenItem: (spokeId: string, subTab?: string) => void;
};

export function CommandCenter({ spec, onOpenItem }: Props) {
  const storageKey = spec.storageKey ?? "ifai:command-center";
  const [state, setState, store] = useLocalStore<StoredState>(
    storageKey,
    EMPTY_STATE,
    revive,
  );

  const itemState = useCallback(
    (item: PriorityItem): ItemState =>
      state[item.id] ?? { owner: item.defaultOwner ?? "unassigned", done: false },
    [state],
  );

  const update = useCallback(
    (item: PriorityItem, patch: Partial<ItemState>) => {
      const current = store.getSnapshot()[item.id] ?? {
        owner: item.defaultOwner ?? "unassigned",
        done: false,
      };
      setState({
        ...store.getSnapshot(),
        [item.id]: { ...current, ...patch },
      });
    },
    [setState, store],
  );

  const { open, done, counts } = useMemo(() => {
    const openItems: PriorityItem[] = [];
    const doneItems: PriorityItem[] = [];
    let critical = 0;
    let ours = 0;
    let theirs = 0;
    for (const item of spec.items) {
      const current = itemState(item);
      if (current.done) {
        doneItems.push(item);
        continue;
      }
      openItems.push(item);
      if (item.severity === "critical") critical += 1;
      if (current.owner === "intofocus") ours += 1;
      if (current.owner === "client") theirs += 1;
    }
    return {
      open: openItems,
      done: doneItems,
      counts: { critical, ours, theirs, cleared: doneItems.length },
    };
  }, [itemState, spec.items]);

  return (
    <div className="command-center">
      {spec.summary ? (
        <div className="cc-summary">
          <div className="cc-summary-head">
            <Sparkles size={13} />
            <span>Today&apos;s read</span>
          </div>
          <p className="cc-summary-body">{spec.summary}</p>
        </div>
      ) : null}

      <div className="cc-quadrants">
        <div className="cc-quadrant cc-quadrant-critical">
          <span className="cc-quadrant-val">{counts.critical}</span>
          <span className="cc-quadrant-label">Critical open</span>
        </div>
        <div className="cc-quadrant">
          <span className="cc-quadrant-val">{open.length}</span>
          <span className="cc-quadrant-label">Total in queue</span>
        </div>
        <div className="cc-quadrant">
          <span className="cc-quadrant-val">{counts.ours}</span>
          <span className="cc-quadrant-label">On IntoFocus AI</span>
        </div>
        <div className="cc-quadrant">
          <span className="cc-quadrant-val">{counts.theirs}</span>
          <span className="cc-quadrant-label">On client team</span>
        </div>
      </div>

      <div className="cc-list-head">
        <span>What to worry about today</span>
        <span className="cc-list-count">
          {counts.cleared} cleared · {open.length} open
        </span>
      </div>

      {open.length === 0 ? (
        <p className="cc-empty">
          Queue is clear. New priorities appear here as each scan lands.
        </p>
      ) : null}

      {open.map((item, idx) => {
        const current = itemState(item);
        return (
          <article key={item.id} className={`cc-item cc-sev-${item.severity}`}>
            <header className="cc-item-head">
              <span className="cc-rank">{idx + 1}</span>
              <div className="cc-item-title-wrap">
                <h4 className="cc-item-title">{item.title}</h4>
                <span className={`cc-sev-badge cc-sev-badge-${item.severity}`}>
                  {item.severity}
                </span>
              </div>
            </header>

            <div className="cc-why">
              <span className="cc-why-label">Why it&apos;s top of the list</span>
              <p>{item.why}</p>
            </div>

            {item.impact ? <div className="cc-impact">{item.impact}</div> : null}

            <footer className="cc-item-foot">
              <div className="cc-owner-group" role="group" aria-label="Assign owner">
                <button
                  type="button"
                  className={`cc-owner-btn${current.owner === "intofocus" ? " active" : ""}`}
                  onClick={() =>
                    update(item, {
                      owner: current.owner === "intofocus" ? "unassigned" : "intofocus",
                    })
                  }
                >
                  <Sparkles size={11} />
                  {OWNER_LABEL.intofocus}
                </button>
                <button
                  type="button"
                  className={`cc-owner-btn${current.owner === "client" ? " active" : ""}`}
                  onClick={() =>
                    update(item, {
                      owner: current.owner === "client" ? "unassigned" : "client",
                    })
                  }
                >
                  <Building2 size={11} />
                  {OWNER_LABEL.client}
                </button>
                <button
                  type="button"
                  className="cc-owner-btn cc-done-btn"
                  onClick={() => update(item, { done: true })}
                >
                  <Check size={11} />
                  Done
                </button>
              </div>

              {item.spokeId ? (
                <button
                  type="button"
                  className="cc-open-btn"
                  onClick={() => onOpenItem(item.spokeId as string, item.subTab)}
                >
                  Open details
                  <ArrowRight size={12} />
                </button>
              ) : null}
            </footer>
          </article>
        );
      })}

      {done.length ? (
        <details className="cc-cleared">
          <summary>{done.length} cleared this session</summary>
          {done.map((item) => (
            <div key={item.id} className="cc-cleared-row">
              <span>{item.title}</span>
              <button
                type="button"
                className="cc-undo-btn"
                onClick={() => update(item, { done: false })}
              >
                <Undo2 size={11} />
                Reopen
              </button>
            </div>
          ))}
        </details>
      ) : null}
    </div>
  );
}
