"use client";

import { Check, Plus, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStore } from "@/lib/canvas-sdk/local-store";
import type { CanvasMetric, CanvasMetricWidgets, SpokeContent } from "@/lib/canvas-sdk/types";

type WidgetSlots = [string | null, string | null, string | null];

function reviveWidgetSlots(raw: unknown): WidgetSlots {
  if (!Array.isArray(raw)) return [null, null, null];
  return [0, 1, 2].map((index) => {
    const value = raw[index];
    return typeof value === "string" && value ? value : null;
  }) as WidgetSlots;
}

type Props = {
  config: CanvasMetricWidgets;
  spokes: Record<string, SpokeContent>;
  onOpenMetric: (spokeId: string, subTab?: string) => void;
};

export function MetricWidgets({ config, spokes, onOpenMetric }: Props) {
  const defaults = useMemo<WidgetSlots>(
    () => [...config.defaults] as WidgetSlots,
    [config.defaults],
  );
  const [slots, setSlots] = useLocalStore<WidgetSlots>(
    config.storageKey,
    defaults,
    reviveWidgetSlots,
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const metricsById = useMemo(
    () => new Map(config.metrics.map((metric) => [metric.id, metric])),
    [config.metrics],
  );
  const groups = useMemo(() => {
    const bySpoke = new Map<string, CanvasMetric[]>();
    for (const metric of config.metrics) {
      const group = bySpoke.get(metric.spokeId) ?? [];
      group.push(metric);
      bySpoke.set(metric.spokeId, group);
    }
    return Object.keys(spokes)
      .map((spokeId) => ({ spokeId, metrics: bySpoke.get(spokeId) ?? [] }))
      .filter((group) => group.metrics.length > 0);
  }, [config.metrics, spokes]);

  useEffect(() => {
    if (activeSlot === null) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setActiveSlot(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSlot(null);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeSlot]);

  const chooseMetric = (slotIndex: number, metricId: string | null) => {
    const next = [...slots] as WidgetSlots;
    next[slotIndex] = metricId;
    setSlots(next);
    setActiveSlot(null);
  };

  return (
    <div className="canvas-metric-widgets" ref={rootRef} aria-label="Configurable metrics">
      {slots.map((metricId, slotIndex) => {
        const metric = metricId ? metricsById.get(metricId) : undefined;
        const spoke = metric ? spokes[metric.spokeId] : undefined;
        const category = spoke?.navLabel ?? spoke?.title;
        const pickerOpen = activeSlot === slotIndex;

        return (
          <div
            className={`canvas-metric-widget${metric ? "" : " is-empty"}${pickerOpen ? " picker-open" : ""}`}
            key={slotIndex}
            data-slot={slotIndex + 1}
          >
            {metric ? (
              <button
                type="button"
                className="metric-widget-body"
                onClick={() => onOpenMetric(metric.spokeId, metric.subTab)}
                aria-label={`Open ${metric.label} in ${category}`}
              >
                <span className="metric-widget-category">{category}</span>
                <span className="metric-widget-label">{metric.label}</span>
                <strong className={`metric-widget-value tone-${metric.tone ?? "neutral"}`}>
                  {metric.value}
                </strong>
                <span className="metric-widget-detail">{metric.detail}</span>
              </button>
            ) : (
              <button
                type="button"
                className="metric-widget-empty"
                onClick={() => setActiveSlot(slotIndex)}
                aria-label={`Add metric to widget ${slotIndex + 1}`}
              >
                <Plus aria-hidden="true" size={31} strokeWidth={1.6} />
                <span>Add metric</span>
              </button>
            )}

            <button
              type="button"
              className="metric-widget-config"
              onClick={() => setActiveSlot((current) => (current === slotIndex ? null : slotIndex))}
              aria-label={`Configure widget ${slotIndex + 1}`}
              aria-expanded={pickerOpen}
              title="Choose metric"
            >
              <Wrench aria-hidden="true" size={13} strokeWidth={1.8} />
            </button>

            {pickerOpen ? (
              <div
                className="metric-widget-picker"
                role="dialog"
                aria-label={`Choose metric for widget ${slotIndex + 1}`}
              >
                <div className="metric-widget-picker-header">
                  <span>Choose a signal</span>
                  <small>Duplicates are allowed</small>
                </div>
                <button
                  type="button"
                  className={`metric-widget-option metric-widget-clear${metric ? "" : " selected"}`}
                  onClick={() => chooseMetric(slotIndex, null)}
                >
                  <span className="metric-widget-option-icon">
                    {metric ? <Plus size={13} /> : <Check size={13} />}
                  </span>
                  <span>
                    <strong>No metric</strong>
                    <small>Show an empty add bubble</small>
                  </span>
                </button>
                <div className="metric-widget-picker-list">
                  {groups.map((group) => {
                    const groupSpoke = spokes[group.spokeId];
                    const groupLabel = groupSpoke?.navLabel ?? groupSpoke?.title ?? group.spokeId;
                    return (
                      <section key={group.spokeId} className="metric-widget-group">
                        <h3>{groupLabel}</h3>
                        {group.metrics.map((option) => (
                          <button
                            type="button"
                            className={`metric-widget-option${option.id === metric?.id ? " selected" : ""}`}
                            key={option.id}
                            onClick={() => chooseMetric(slotIndex, option.id)}
                          >
                            <span className="metric-widget-option-icon">
                              {option.id === metric?.id ? <Check size={13} /> : null}
                            </span>
                            <span>
                              <strong>{option.label}</strong>
                              <small>{option.value}</small>
                            </span>
                          </button>
                        ))}
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
