import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "../../utils/cn";

/**
 * Lightweight, accessible Tabs.
 *
 * props:
 *  - tabs: [{ id, label }]
 *  - value: active tab id
 *  - onValueChange: (id) => void
 */
export default function Tabs({
  tabs,
  value,
  onValueChange,
  ariaLabel = "Tabs",
  className,
  tabClassName,
}) {
  const ids = useMemo(() => tabs.map((t) => t.id), [tabs]);
  const activeIndex = Math.max(0, ids.indexOf(value));
  const btnRefs = useRef([]);

  // Keep refs array in sync
  useEffect(() => {
    btnRefs.current = btnRefs.current.slice(0, tabs.length);
  }, [tabs.length]);

  function focusAndSelect(nextIndex) {
    const clamped = (nextIndex + tabs.length) % tabs.length;
    const nextId = ids[clamped];
    onValueChange?.(nextId);
    requestAnimationFrame(() => btnRefs.current?.[clamped]?.focus?.());
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1 rounded-2xl border border-border bg-muted/40 p-1",
        "overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((t, idx) => {
        const isActive = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => (btnRefs.current[idx] = el)}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              tabClassName
            )}
            onClick={() => onValueChange?.(t.id)}
            onKeyDown={(e) => {
              if (tabs.length <= 1) return;
              if (e.key === "ArrowRight") {
                e.preventDefault();
                focusAndSelect(activeIndex + 1);
              }
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                focusAndSelect(activeIndex - 1);
              }
              if (e.key === "Home") {
                e.preventDefault();
                focusAndSelect(0);
              }
              if (e.key === "End") {
                e.preventDefault();
                focusAndSelect(tabs.length - 1);
              }
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
