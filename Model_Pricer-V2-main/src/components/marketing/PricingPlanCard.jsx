import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

export default function PricingPlanCard({
  name,
  description,
  price,
  currency,
  period,
  features,
  highlighted,
  badgeText,
  ctaText,
  ctaTo = "/register",
  className,
}) {
  const isCustom = price === null || price === undefined;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "relative h-full rounded-3xl border bg-card/60 backdrop-blur-sm shadow-sm",
        highlighted
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-border",
        className
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
            {badgeText}
          </span>
        </div>
      )}

      <div className="p-6 sm:p-7 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center border",
              highlighted
                ? "bg-primary/10 border-primary/25 text-primary"
                : "bg-muted border-border text-foreground"
            )}
            aria-hidden="true"
          >
            <Icon name={highlighted ? "Sparkles" : "Box"} size={18} />
          </div>
        </div>

        <div className="mt-6">
          {isCustom ? (
            <div className="text-3xl font-semibold text-foreground">{period}</div>
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-foreground">
                {price}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">
                {currency}/{period}
              </span>
            </div>
          )}
        </div>

        <ul className="mt-6 space-y-2 text-sm text-foreground/90">
          {features.map((f, idx) => (
            <li key={idx} className="flex gap-2">
              <span className={cn(
                "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
                highlighted ? "bg-primary/10 text-primary" : "bg-muted text-foreground"
              )}>
                <Icon name="Check" size={14} />
              </span>
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 pt-1">
          <Button
            asChild
            size="lg"
            variant={highlighted ? "gradient" : "outline"}
            fullWidth
          >
            <Link to={ctaTo}>{ctaText}</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
