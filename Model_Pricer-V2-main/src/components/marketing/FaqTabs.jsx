import React, { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import Accordion from "./Accordion";
import Tabs from "./Tabs";
import GlossaryTerm from "./GlossaryTerm";

/**
 * FAQ grouped by categories with Tabs (categories) + Accordion (questions).
 *
 * categories: [{ id, label, items: [{ id, title, content }] }]
 */
export default function FaqTabs({
  categories,
  defaultCategoryId,
  glossary,
  className,
  tabsAriaLabel = "FAQ categories",
  showCategoryMeta = true,
}) {
  const safeCategories = useMemo(() => {
    const arr = Array.isArray(categories) ? categories : [];
    return arr.filter((c) => c && c.id && c.label && Array.isArray(c.items));
  }, [categories]);

  const firstId = safeCategories[0]?.id ?? null;
  const [activeId, setActiveId] = useState(defaultCategoryId ?? firstId);

  const tabs = useMemo(
    () => safeCategories.map((c) => ({ id: c.id, label: c.label })),
    [safeCategories]
  );

  const activeCategory = useMemo(() => {
    return (
      safeCategories.find((c) => c.id === activeId) ?? safeCategories[0] ?? null
    );
  }, [safeCategories, activeId]);

  if (!activeCategory) return null;

  const questionCount = activeCategory.items?.length ?? 0;

  const enrichedItems = useMemo(() => {
    const items = Array.isArray(activeCategory.items) ? activeCategory.items : [];

    const renderWithGlossary = (text) => {
      if (typeof text !== "string") return text;
      if (!glossary) return text;

      const parts = [];
      const re = /\[\[([a-z0-9_-]+)\]\]/gi;
      let last = 0;
      let m;
      let i = 0;

      while ((m = re.exec(text)) !== null) {
        const idx = m.index;
        if (idx > last) parts.push(text.slice(last, idx));
        const key = (m[1] || "").trim();
        parts.push(
          <GlossaryTerm
            key={`${key}-${i++}`}
            termKey={key}
            glossary={glossary}
          />
        );
        last = re.lastIndex;
      }

      if (last < text.length) parts.push(text.slice(last));
      return <span>{parts}</span>;
    };

    return items.map((it) => ({ ...it, content: renderWithGlossary(it.content) }));
  }, [activeCategory.items, glossary]);

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs
        tabs={tabs}
        value={activeCategory.id}
        onValueChange={setActiveId}
        ariaLabel={tabsAriaLabel}
      />

      <div className="rounded-3xl border border-border bg-muted/30 p-3 sm:p-4">
        {showCategoryMeta && (
          <div className="px-2 pb-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {activeCategory.label}
            </span>
            <span className="ml-2">• {questionCount}</span>
          </div>
        )}

        {/* key ensures accordion state resets when switching categories */}
        <Accordion key={activeCategory.id} items={enrichedItems} />
      </div>
    </div>
  );
}
