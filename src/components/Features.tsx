import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Zap, Sparkles, MessageSquare, BarChart, Settings } from "lucide-react";

const features = [
  { icon: Bot, title: "AI-Powered Creation", description: "Describe what you want and let AI build your bot automatically with natural language." },
  { icon: Zap, title: "Deploy Instantly", description: "From idea to live bot in minutes. No coding required, no complex setup." },
  { icon: MessageSquare, title: "Multi-Platform Support", description: "One bot, multiple platforms. Deploy to WhatsApp, Instagram, Telegram and more." },
  { icon: Sparkles, title: "Smart Templates", description: "Start with pre-built templates for customer service, sales, and lead generation." },
  { icon: BarChart, title: "Real-Time Analytics", description: "Track conversations, measure performance, and optimize your bot's effectiveness." },
  { icon: Settings, title: "Easy Customization", description: "Modify bot personality, responses, and behavior through simple conversations." },
];

export const Features = () => (
  <section className="py-24 px-4">
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Everything You Need</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Powerful features to create, customize, and deploy intelligent bots</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className="border-primary/20 hover:border-primary/50 transition-all h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);