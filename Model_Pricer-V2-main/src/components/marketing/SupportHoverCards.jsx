import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";
import Button from "../ui/Button";

function SupportCard({ icon, title, desc, to, href }) {
  const Comp = to ? Link : "a";
  const props = to
    ? { to }
    : { href, target: href?.startsWith("http") ? "_blank" : undefined, rel: href?.startsWith("http") ? "noreferrer" : undefined };

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
      <Comp
        {...props}
        className={cn(
          "group block rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 shadow-sm",
          "transition-micro hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name={icon} size={18} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground group-hover:text-foreground">
              {title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground leading-snug">
              {desc}
            </div>
          </div>
        </div>
      </Comp>
    </motion.div>
  );
}

export default function SupportHoverCards({ language, className }) {
  const isCs = language === "cs";

  const cards = isCs
    ? [
        {
          icon: "BookOpen",
          title: "Dokumentace",
          desc: "Návody k nastavení, embed, integrace a pricing pravidla.",
          to: "/support",
        },
        {
          icon: "Video",
          title: "Video ukázky",
          desc: "Rychlý onboarding + best practices pro quoting (postupně).",
          to: "/support",
        },
        {
          icon: "MessageCircle",
          title: "Chat",
          desc: "Rychlé dotazy k nastavení a integracím.",
          to: "/support",
        },
        {
          icon: "Mail",
          title: "Email",
          desc: "support@modelpricer.com",
          href: "mailto:support@modelpricer.com",
        },
      ]
    : [
        {
          icon: "BookOpen",
          title: "Documentation",
          desc: "Setup guides, embed, integrations, and pricing rules.",
          to: "/support",
        },
        {
          icon: "Video",
          title: "Video",
          desc: "Quick onboarding + quoting best practices (rolling out).",
          to: "/support",
        },
        {
          icon: "MessageCircle",
          title: "Chat",
          desc: "Fast help with setup and integrations.",
          to: "/support",
        },
        {
          icon: "Mail",
          title: "Email",
          desc: "support@modelpricer.com",
          href: "mailto:support@modelpricer.com",
        },
      ];

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-muted/30 p-4 sm:p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {isCs ? "Podpora & zdroje" : "Support & resources"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {isCs
              ? "Rychlé odkazy na dokumentaci a kontakt. Když chceš, pomůžeme i s nastavením pricingu a embed integrací."
              : "Quick links to docs and contact. We can also help with pricing setup and embed integrations."}
          </div>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link to="/support">{isCs ? "Napsat podporu" : "Contact support"}</Link>
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <SupportCard key={c.title} {...c} />
        ))}
      </div>
    </div>
  );
}
