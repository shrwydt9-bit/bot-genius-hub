import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { MessageCircle, Send, Instagram, Facebook, Slack, ArrowRight, Mail, Phone, Linkedin, Music, Hash, Users, Twitter, Camera, Grid, Building, Apple, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const platformsData = [
  {
    name: "WhatsApp Business",
    icon: MessageCircle,
    category: "Messaging",
    description: "Create automated customer service and marketing bots for WhatsApp Business",
    features: ["Auto-replies", "Product catalogs", "Order tracking", "Customer support"],
    useCases: ["E-commerce support", "Appointment booking", "Lead qualification"],
  },
  {
    name: "Telegram",
    icon: Send,
    category: "Messaging",
    description: "Build powerful bots with Telegram's rich bot API and group features",
    features: ["Group management", "Inline queries", "Custom keyboards", "File sharing"],
    useCases: ["Community management", "News distribution", "Gaming bots"],
  },
  {
    name: "Instagram",
    icon: Instagram,
    category: "Social Media",
    description: "Automate Instagram DMs for customer engagement and sales",
    features: ["DM automation", "Story replies", "Comment responses", "Lead capture"],
    useCases: ["Influencer engagement", "Product inquiries", "Brand awareness"],
  },
  {
    name: "Facebook Messenger",
    icon: Facebook,
    category: "Social Media",
    description: "Connect with customers through Facebook's massive user base",
    features: ["Messenger bot", "Page integration", "Quick replies", "Templates"],
    useCases: ["Customer service", "Event RSVP", "Product recommendations"],
  },
 {
   name: "Slack",
   icon: Slack,
   category: "Business",
   description: "Create productivity bots for your Slack workspace",
   features: ["Slash commands", "Workflow automation", "Channel integration", "Notifications"],
   useCases: ["Team automation", "HR assistant", "Project updates"],
 },
 {
   name: "Discord",
   icon: Hash,
   category: "Business",
   description: "Build community bots for Discord servers",
   features: ["Slash commands", "Embeds", "Moderation", "Events"],
   useCases: ["Community management", "Gaming", "Support server"],
 },
 {
   name: "Microsoft Teams",
   icon: Users,
   category: "Business",
   description: "Enterprise collaboration bots for Teams",
   features: ["Cards", "Tabs", "Meetings", "Channels"],
   useCases: ["Workplace automation", "HR bot", "Meeting assistant"],
 },
 {
   name: "LinkedIn",
   icon: Linkedin,
   category: "Social Media",
   description: "Professional networking automation",
   features: ["Messaging", "Connection requests", "Job posts"],
   useCases: ["Lead generation", "Recruitment", "Networking"],
 },
 {
   name: "TikTok",
   icon: Music,
   category: "Social Media",
   description: "Engage with TikTok audience",
   features: ["Comment replies", "DMs", "Trends"],
   useCases: ["Brand engagement", "Creator support", "Viral marketing"],
 },
 {
   name: "Twitter/X",
   icon: Twitter,
   category: "Social Media",
   description: "Automate Twitter engagement",
   features: ["DMs", "Tweet replies", "Threads"],
   useCases: ["Customer support", "Brand monitoring", "Engagement"],
 },
 {
   name: "Email",
   icon: Mail,
   category: "Direct",
   description: "AI-powered email automation",
   features: ["Auto-reply", "Categorization", "Smart routing"],
   useCases: ["Customer service", "Lead nurturing", "Support tickets"],
 },
 {
   name: "SMS",
   icon: Phone,
   category: "Direct",
   description: "SMS and text message automation",
   features: ["2-way messaging", "Campaigns", "Alerts"],
   useCases: ["Appointment reminders", "Notifications", "Surveys"],
 },
];

const Platforms = () => {
  const navigate = useNavigate();

  const toneByCategory = (category: string) => {
    switch (category) {
      case "Messaging":
        return { chip: "bg-primary/10 text-primary", iconBg: "bg-primary/10", iconText: "text-primary" };
      case "Social Media":
        return { chip: "bg-secondary/10 text-secondary", iconBg: "bg-secondary/10", iconText: "text-secondary" };
      case "Business":
        return { chip: "bg-accent/10 text-accent", iconBg: "bg-accent/10", iconText: "text-accent" };
      default:
        return { chip: "bg-muted/60 text-muted-foreground", iconBg: "bg-muted/60", iconText: "text-foreground" };
    }
  };

  const routePlatform = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("whatsapp")) return "whatsapp";
    if (lower.includes("telegram")) return "telegram";
    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("facebook")) return "facebook";
    if (lower.includes("slack")) return "slack";
    if (lower.includes("discord")) return "discord";
    if (lower.includes("teams")) return "microsoft_teams";
    if (lower.includes("linkedin")) return "linkedin";
    if (lower.includes("tiktok")) return "tiktok";
    if (lower.includes("twitter")) return "twitter";
    if (lower === "email") return "email";
    if (lower === "sms") return "sms";
    return "whatsapp";
  };

  return (
    <PageShell>
      <PageHeader title="Platforms" subtitle="Pick a channel and jump straight into customization." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {platformsData.map((platform, i) => {
          const tone = toneByCategory(platform.category);
          const platformKey = routePlatform(platform.name);
          return (
            <motion.div key={platform.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="glass-panel glow-border h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={"w-12 h-12 rounded-xl flex items-center justify-center " + tone.iconBg}>
                      <platform.icon className={"w-6 h-6 " + tone.iconText} aria-hidden="true" />
                    </div>
                    <span className={"text-xs px-3 py-1 rounded-full border border-border " + tone.chip}>{platform.category}</span>
                  </div>
                  <CardTitle className="text-2xl">{platform.name}</CardTitle>
                  <CardDescription className="text-base">{platform.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {platform.features.map((feature) => (
                        <span key={feature} className="text-xs px-2 py-1 rounded bg-muted/40 text-muted-foreground border border-border/60">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Popular Use Cases</h4>
                    <ul className="space-y-1">
                      {platform.useCases.map((useCase) => (
                        <li key={useCase} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full gradient-primary group mt-4"
                    onClick={() => navigate(`/customize?platform=${platformKey}`)}
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
};

export default Platforms;