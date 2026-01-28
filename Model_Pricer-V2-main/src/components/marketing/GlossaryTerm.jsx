import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function GlossaryTerm({
  termKey,
  glossary,
  className,
  showIcon = true,
}) {
  const entry = glossary?.[termKey];
  const label = entry?.label ?? termKey;
  const desc = entry?.desc;

  // If glossary is missing, fall back to plain text
  if (!desc) {
    return <span className={cn("font-medium", className)}>{label}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-sm align-baseline",
            "font-medium text-foreground/90 underline decoration-dotted underline-offset-4",
            "hover:text-foreground transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
        >
          <span>{label}</span>
          {showIcon && (
            <Icon
              name="Info"
              size={14}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-sm opacity-90 leading-relaxed">{desc}</div>
      </TooltipContent>
    </Tooltip>
  );
}
