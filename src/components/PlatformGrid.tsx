import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, ShoppingBag, Slack as SlackIcon, Instagram, Facebook } from "lucide-react";

const platforms = [
  { name: "WhatsApp", icon: MessageCircle, color: "hsl(142 71% 45%)", category: "Messaging" },
  { name: "Telegram", icon: Send, color: "hsl(200 100% 50%)", category: "Messaging" },
  { name: "Instagram", icon: Instagram, color: "hsl(340 75% 55%)", category: "Social Media" },
  { name: "Facebook", icon: Facebook, color: "hsl(220 89% 51%)", category: "Social Media" },
  { name: "Shopify", icon: ShoppingBag, color: "hsl(149 59% 48%)", category: "E-commerce" },
  { name: "Slack", icon: SlackIcon, color: "hsl(185 90% 39%)", category: "Business" },
];

export const PlatformGrid = () => (
  <section className="py-24 px-4 bg-card/50">
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Deploy Everywhere</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Create bots for all major platforms from one unified interface</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {platforms.map((platform, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.05, y: -5 }}>
            <Card className="border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: platform.color + "20" }}>
                  <platform.icon className="w-8 h-8" style={{ color: platform.color }} />
                </div>
                <h3 className="font-semibold mb-1">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">{platform.category}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);