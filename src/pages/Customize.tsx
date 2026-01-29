import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { BotChatInterface } from "@/components/BotChatInterface";
import { BotPreview } from "@/components/BotPreview";
 import { AiCopywritingPanel } from "@/components/AiCopywritingPanel";
import { Button } from "@/components/ui/button";
 import { Save, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Customize = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platform = searchParams.get("platform") || "whatsapp";
  const botIdParam = searchParams.get("botId");
  const { toast } = useToast();
   const [activeView, setActiveView] = useState<"chat" | "ai">("chat");

  const [botData, setBotData] = useState({
    name: "My Bot",
    personality: "friendly and professional",
    greetingMessage: "Hello! How can I help you today?",
    platform,
  });
  const [botId, setBotId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setBotData((prev) => ({ ...prev, platform }));
  }, [platform]);

  useEffect(() => {
    if (botIdParam) {
      loadExistingBot(botIdParam);
      return;
    }
    createInitialBot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botIdParam]);

  const loadExistingBot = async (id: string) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to customize bots",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("bots")
        .select("id,name,platform,bot_type,personality,greeting_message")
        .eq("id", id)
        .single();

      if (error) throw error;

      setBotId(data.id);
      setBotData({
        name: data.name,
        personality: data.personality ?? "friendly and professional",
        greetingMessage: data.greeting_message ?? "Hello! How can I help you today?",
        platform: data.platform as any,
      });
    } catch (error) {
      console.error("Error loading bot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn't load this bot. Please try again.",
      });
      navigate("/platforms");
    } finally {
      setIsCreating(false);
    }
  };

  const createInitialBot = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to create bots",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("bots")
        .insert({
          user_id: user.id,
          name: botData.name,
          platform: platform as any,
          bot_type: "customer_service",
          personality: botData.personality,
          greeting_message: botData.greetingMessage,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setBotId(data.id);
    } catch (error) {
      console.error("Error creating bot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create bot. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!botId) return;

    try {
      const { error } = await supabase
        .from("bots")
        .update({
          name: botData.name,
          personality: botData.personality,
          greeting_message: botData.greetingMessage,
        })
        .eq("id", botId);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Your bot configuration has been saved.",
      });
    } catch (error) {
      console.error("Error saving bot:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save bot. Please try again.",
      });
    }
  };

  return (
    <PageShell>
      <div className="container">
        <PageHeader
          title="Customize"
          subtitle="Studio view: iterate with AI and preview your bot instantly."
          right={
            <Button onClick={handleSave} className="gradient-primary">
              <Save className="w-4 h-4 mr-2" />
              Save Bot
            </Button>
          }
        />

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-4">
             <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "chat" | "ai")}>
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="chat">
                   AI Customization Chat
                 </TabsTrigger>
                 <TabsTrigger value="ai">
                   <Sparkles className="w-4 h-4 mr-2" />
                   AI Copywriting Assistant
                 </TabsTrigger>
               </TabsList>

                <TabsContent value="chat" className="mt-4">
              <div className="border border-border rounded-lg glass-panel">
                {isCreating ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Creating your bot...</p>
                  </div>
                ) : botId ? (
                  <BotChatInterface
                    botId={botId}
                    onBotUpdate={(updates) => setBotData((prev) => ({ ...prev, ...updates }))}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Failed to create bot. Please refresh the page.</p>
                  </div>
                )}
              </div>
               </TabsContent>

                <TabsContent value="ai" className="mt-4">
                 <div className="h-full overflow-y-auto">
                   {botId ? (
                     <AiCopywritingPanel
                       platform={platform}
                       currentGreeting={botData.greetingMessage}
                       currentPersonality={botData.personality}
                       onApply={(updates) => setBotData((prev) => ({ ...prev, ...updates }))}
                     />
                   ) : (
                     <div className="h-full flex items-center justify-center">
                       <p className="text-muted-foreground">Loading bot data...</p>
                     </div>
                   )}
                 </div>
               </TabsContent>
             </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="glass-panel glow-border rounded-lg">
                <BotPreview
                  botName={botData.name}
                  personality={botData.personality}
                  greetingMessage={botData.greetingMessage}
                  platform={botData.platform}
                />
              </div>
            </div>
          </div>
        </div>
    </PageShell>
  );
};

export default Customize;