import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { MessageCircle, Send, Instagram, Facebook, ShoppingBag, Slack, ArrowRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EcommerceBotInfo } from "@/components/EcommerceBotInfo";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const platformsData = [
  {
    name: "WhatsApp Business",
    icon: MessageCircle,
    color: "hsl(142 71% 45%)",
    category: "Messaging",
    description: "Create automated customer service and marketing bots for WhatsApp Business",
    features: ["Auto-replies", "Product catalogs", "Order tracking", "Customer support"],
    useCases: ["E-commerce support", "Appointment booking", "Lead qualification"],
  },
  {
    name: "Telegram",
    icon: Send,
    color: "hsl(200 100% 50%)",
    category: "Messaging",
    description: "Build powerful bots with Telegram's rich bot API and group features",
    features: ["Group management", "Inline queries", "Custom keyboards", "File sharing"],
    useCases: ["Community management", "News distribution", "Gaming bots"],
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "hsl(340 75% 55%)",
    category: "Social Media",
    description: "Automate Instagram DMs for customer engagement and sales",
    features: ["DM automation", "Story replies", "Comment responses", "Lead capture"],
    useCases: ["Influencer engagement", "Product inquiries", "Brand awareness"],
  },
  {
    name: "Facebook Messenger",
    icon: Facebook,
    color: "hsl(220 89% 51%)",
    category: "Social Media",
    description: "Connect with customers through Facebook's massive user base",
    features: ["Messenger bot", "Page integration", "Quick replies", "Templates"],
    useCases: ["Customer service", "Event RSVP", "Product recommendations"],
  },
  {
    name: "Shopify",
    icon: ShoppingBag,
    color: "hsl(149 59% 48%)",
    category: "E-commerce",
    description: "Enhance your Shopify store with AI-powered shopping assistants",
    features: ["Product search", "Order tracking", "Inventory sync", "Checkout support"],
    useCases: ["Shopping assistant", "Order updates", "Product recommendations"],
  },
  {
    name: "Slack",
    icon: Slack,
    color: "hsl(185 90% 39%)",
    category: "Business",
    description: "Create productivity bots for your Slack workspace",
    features: ["Slash commands", "Workflow automation", "Channel integration", "Notifications"],
    useCases: ["Team automation", "HR assistant", "Project updates"],
  },
];

const Platforms = () => {
  const [showEcommerceInfo, setShowEcommerceInfo] = useState(false);

  return (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 pb-16 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">Choose Your Platform</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select where you want to deploy your AI bot and start customizing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {platformsData.map((platform, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-primary/20 hover:border-primary/50 transition-all h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.color + "20" }}>
                      <platform.icon className="w-6 h-6" style={{ color: platform.color }} />
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">{platform.category}</span>
                  </div>
                  <CardTitle className="text-2xl">{platform.name}</CardTitle>
                  <CardDescription className="text-base">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {platform.features.map((feature, j) => (
                        <span key={j} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{feature}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Popular Use Cases:</h4>
                    <ul className="space-y-1">
                      {platform.useCases.map((useCase, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {platform.name === "Shopify" && (
                    <Dialog open={showEcommerceInfo} onOpenChange={setShowEcommerceInfo}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full gap-2 mb-2">
                          <Info className="w-4 h-4" />
                          E-commerce Bot Features
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>E-commerce Bot Capabilities</DialogTitle>
                        </DialogHeader>
                        <EcommerceBotInfo />
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button className="w-full gradient-primary group mt-4">
                    Get Started <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

export default Platforms;