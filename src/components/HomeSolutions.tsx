import { motion } from "framer-motion";
import { Bot, LayoutPanelTop, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeSolutions() {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Bots + Websites</h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Build a bot, ship it everywhere, and pair it with a polished site experience.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" aria-hidden="true" />
                Create bots fast
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Start with AI chat, iterate on behavior, and turn prompts into production-ready bots.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutPanelTop className="h-5 w-5" aria-hidden="true" />
                Websites & flows
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Give your bot a home: landing pages, onboarding, and conversion-friendly UX.
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Templates & tuning
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Reuse winning responses, keep tone consistent, and scale across use cases.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button asChild className="gradient-primary">
            <Link to="/ai-chat">Create a bot</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/bots">Manage bots</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/templates">Browse templates</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
