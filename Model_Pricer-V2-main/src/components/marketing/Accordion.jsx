import React, { useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";

/**
 * Simple accessible Accordion (single-open)
 * items: [{ id, title, content }]
 */
export default function Accordion({
  items,
  defaultOpenId,
  className,
  itemClassName,
}) {
  const uid = useId();
  const firstId = useMemo(() => items?.[0]?.id, [items]);
  const [openId, setOpenId] = useState(defaultOpenId ?? firstId ?? null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, idx) => {
        const isOpen = openId === item.id;
        const buttonId = `${uid}-btn-${idx}`;
        const panelId = `${uid}-panel-${idx}`;

        return (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm",
              itemClassName
            )}
          >
            <button
              id={buttonId}
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span className="text-sm sm:text-base font-semibold text-foreground">
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              >
                <Icon name="ChevronDown" size={18} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
