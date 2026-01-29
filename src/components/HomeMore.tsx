import { motion } from "framer-motion";
import { ChartLine, Plug, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeMore() {
  const navigate = useNavigate();
  return (
    <section className="relative py-16 md:py-24">
      <div className="container px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything else</h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Integrations, analytics, and customization—so your bots fit your stack and your brand.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card className="glass-panel glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" aria-hidden="true" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Connect platforms and channels so your bot can meet customers where they are.
            </CardContent>
          </Card>

          <Card className="glass-panel glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="h-5 w-5" aria-hidden="true" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Track conversations and outcomes to continuously improve responses and conversion.
            </CardContent>
          </Card>

          <Card className="glass-panel glow-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" aria-hidden="true" />
                Customize
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Tune personality, UI, and behavior—without rebuilding your workflow from scratch.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button className="gradient-primary" onClick={() => navigate("/integrations")}>Explore integrations</Button>
          <Button variant="outline" onClick={() => navigate("/customize")}>Customize</Button>
          <Button variant="ghost" onClick={() => navigate("/ai-chat")}>Try AI chat</Button>
        </div>
      </div>
    </section>
  );
}
