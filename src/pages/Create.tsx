import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Store, Wand2, PlugZap, ArrowRight } from "lucide-react";

const tiles = [
  {
    title: "Create a Bot",
    description: "Go from idea → personality → deployment-ready in one guided flow.",
    icon: Bot,
    bullets: ["AI Builder", "Templates", "Multi-platform"],
    cta: "Open AI Builder",
    to: "/ai-chat",
  },
  {
    title: "Create a Storefront",
    description: "A cinematic storefront + cart experience designed for conversions.",
    icon: Store,
    bullets: ["Product grid", "Variant selection", "Cart drawer"],
    cta: "Open Storefront",
    to: "/storefront",
  },
  {
    title: "Create Templates",
    description: "Reusable responses with variables—fast, consistent, on-brand.",
    icon: Wand2,
    bullets: ["AI Suggestions", "Preview", "Variables"],
    cta: "Open Templates",
    to: "/templates",
  },
  {
    title: "Connect Integrations",
    description: "Wire channels and verify connections without exposing secrets.",
    icon: PlugZap,
    bullets: ["Status", "Secure storage", "Verify"],
    cta: "Open Integrations",
    to: "/integrations",
  },
] as const;

export default function Create() {
  const navigate = useNavigate();

  return (
    <PageShell containerClassName="container max-w-6xl">
      <PageHeader title="Orion Studio" subtitle="Choose what you want to build—bots, stores, templates, and integrations." />

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((t, idx) => (
          <motion.div key={t.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="glass-panel glow-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                    <t.icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  {t.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {t.bullets.map((b) => (
                    <span key={b} className="text-xs rounded-full border border-border bg-muted/30 px-3 py-1 text-muted-foreground">
                      {b}
                    </span>
                  ))}
                </div>
                <Button className="w-full gradient-primary group" onClick={() => navigate(t.to)}>
                  {t.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
