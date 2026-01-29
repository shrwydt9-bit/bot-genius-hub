import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { streamAiChat } from "@/lib/streamAiChat";
import { Bot, Sparkles, Wand2, Loader2, PlusCircle, Building2, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import type { ModelOption } from "@/lib/streamAiChat";

type Msg = { role: "user" | "assistant"; content: string };

const platforms = [
  "whatsapp",
  "telegram",
  "instagram",
  "facebook",
  "shopify",
  "slack",
  "discord",
  "email",
  "sms",
  "linkedin",
  "tiktok",
  "microsoft_teams",
  "twitter",
] as const;

const botTypes = ["customer_service", "lead_generation", "content_automation", "ecommerce"] as const;
const categories = ["greeting", "ecommerce", "support", "marketing", "general"] as const;

const planSchema = z.object({
  bot: z
    .object({
      name: z.string().min(1).max(80),
      platform: z.enum(platforms),
      bot_type: z.enum(botTypes),
      personality: z.string().min(1).max(800),
      greeting_message: z.string().min(1).max(800),
    })
    .nullable(),
  brand: z
    .object({
      name: z.string().min(1).max(120),
      industry: z.string().max(120).nullable(),
      description: z.string().max(800).nullable(),
      website: z.string().max(255).nullable(),
    })
    .nullable(),
  templates: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        description: z.string().min(1).max(255),
        platform: z.enum(platforms),
        category: z.enum(categories),
        template_content: z.string().min(1).max(2000),
      }),
    )
    .nullable(),
  copy: z
    .object({
      greeting_variants: z.array(z.string().min(1).max(500)).max(10),
      personality_variants: z.array(z.string().min(1).max(500)).max(10),
      notes: z.string().max(800).nullable(),
    })
    .nullable(),
});

function extractJsonBlock(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return match?.[1] ?? null;
}

function extractVariables(content: string) {
  const matches = content.match(/\{([^}]+)\}/g) || [];
  const uniqueVars = [...new Set(matches.map((m) => m.slice(1, -1)))];
  return uniqueVars.map((name) => ({ name, description: `Value for ${name}` }));
}

export default function AiChat() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Tell me what you want to create (bot + brand + templates). Include platform, industry, tone, and examples if you have them.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [intent, setIntent] = useState({
    createBot: true,
    createTemplates: true,
    createBrand: true,
    createCopy: true,
  });
  const [model, setModel] = useState<ModelOption>("qwen/qwen3-coder:free");
  const [deepThinking, setDeepThinking] = useState(false);
  const [plan, setPlan] = useState<z.infer<typeof planSchema> | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSessionToken(sess?.access_token ?? null);
      if (!sess?.access_token) navigate("/auth", { replace: true });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionToken(session?.access_token ?? null);
      if (!session?.access_token) navigate("/auth", { replace: true });
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const assistantText = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    return last?.content ?? "";
  }, [messages]);

  const tryParsePlan = (text: string) => {
    const json = extractJsonBlock(text);
    if (!json) return null;
    try {
      const parsed = JSON.parse(json);
      const validated = planSchema.safeParse(parsed);
      if (!validated.success) return null;
      return validated.data;
    } catch {
      return null;
    }
  };

  const send = async () => {
    if (!input.trim() || !sessionToken || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setPlan(null);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamAiChat({
      messages: [...messages.filter((m) => m.role !== "assistant" || m.content.trim() !== ""), userMsg],
      intent,
      model,
      deepThinking,
      accessToken: sessionToken,
      onDelta: (delta) => upsertAssistant(delta),
      onDone: () => {
        setIsLoading(false);
        const parsed = tryParsePlan(assistantSoFar);
        setPlan(parsed);
        if (!parsed) {
          toast({
            title: "Tip",
            description: "Ask the AI to include the final JSON block so you can create items with one click.",
          });
        }
      },
      onError: (err) => {
        setIsLoading(false);
        toast({ variant: "destructive", title: "AI error", description: err.message });
      },
    });
  };

  const createBrand = async () => {
    if (!plan?.brand) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("brands").insert({
        user_id: user.id,
        name: plan.brand.name,
        industry: plan.brand.industry,
        description: plan.brand.description,
        website: plan.brand.website,
      });
      if (error) throw error;
      toast({ title: "Brand created" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to create brand", description: e?.message ?? "" });
    }
  };

  const createBot = async () => {
    if (!plan?.bot) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("bots")
        .insert({
          user_id: user.id,
          name: plan.bot.name,
          platform: plan.bot.platform as any,
          bot_type: plan.bot.bot_type as any,
          personality: plan.bot.personality,
          greeting_message: plan.bot.greeting_message,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Bot created" });
      if (data?.id && data?.platform) navigate(`/customize?platform=${data.platform}&botId=${data.id}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to create bot", description: e?.message ?? "" });
    }
  };

  const createTemplates = async () => {
    if (!plan?.templates?.length) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = plan.templates.map((t) => ({
        user_id: user.id,
        name: t.name,
        description: t.description,
        platform: t.platform as any,
        category: t.category,
        template_content: t.template_content,
        variables: extractVariables(t.template_content) as any,
      }));

      const { error } = await supabase.from("response_templates").insert(rows as any);
      if (error) throw error;
      toast({ title: "Templates created" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to create templates", description: e?.message ?? "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl">
          <div className="flex flex-col gap-8 lg:flex-row">
            <section className="lg:w-2/3 space-y-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h1 className="text-4xl font-bold text-gradient">AI Builder Chat</h1>
                <p className="text-muted-foreground">
                  Chat with AI to generate a bot, brand identity, and templates—then create them with one click.
                </p>
              </motion.div>

              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Conversation</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={intent.createBrand ? "default" : "secondary"} className="cursor-pointer" onClick={() => setIntent((p) => ({ ...p, createBrand: !p.createBrand }))}>
                      Brand
                    </Badge>
                    <Badge variant={intent.createBot ? "default" : "secondary"} className="cursor-pointer" onClick={() => setIntent((p) => ({ ...p, createBot: !p.createBot }))}>
                      Bot
                    </Badge>
                    <Badge variant={intent.createTemplates ? "default" : "secondary"} className="cursor-pointer" onClick={() => setIntent((p) => ({ ...p, createTemplates: !p.createTemplates }))}>
                      Templates
                    </Badge>
                    <Badge variant={intent.createCopy ? "default" : "secondary"} className="cursor-pointer" onClick={() => setIntent((p) => ({ ...p, createCopy: !p.createCopy }))}>
                      Copy
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Model</Label>
                      <Select value={model} onValueChange={(v) => setModel(v as ModelOption)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="qwen/qwen3-coder:free">Qwen 3 Coder (Free)</SelectItem>
                          <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                          <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                          <SelectItem value="openai/gpt-5.2">GPT-5.2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Deep Thinking</Label>
                      <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background">
                        <Switch id="deepThinking" checked={deepThinking} onCheckedChange={setDeepThinking} />
                        <Brain className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[26rem] overflow-y-auto space-y-3 pr-2">
                    {messages.map((m, idx) => (
                      <div key={idx} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[85%] rounded-2xl bg-primary/15 border border-primary/20 px-4 py-3"
                              : "max-w-[85%] rounded-2xl bg-card border border-border px-4 py-3"
                          }
                        >
                          <div className="prose prose-sm max-w-none text-foreground">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Example: Create a WhatsApp customer service bot for a skincare brand. Tone: warm, expert, concise. Include 3 greeting templates with {customer_name}."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button className="gradient-primary flex-1" disabled={isLoading || !sessionToken} onClick={send}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(assistantText);
                          toast({ title: "Copied" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <aside className="lg:w-1/3 space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Create from Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan ? (
                    <>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Detected a valid JSON plan in the AI response.
                      </div>
                      <div className="grid gap-2">
                        <Button
                          className="w-full"
                          disabled={!plan.brand}
                          onClick={createBrand}
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Create Brand
                        </Button>
                        <Button
                          className="w-full"
                          disabled={!plan.bot}
                          onClick={createBot}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Create Bot
                        </Button>
                        <Button
                          className="w-full"
                          disabled={!plan.templates?.length}
                          onClick={createTemplates}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Templates
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const block = extractJsonBlock(assistantText);
                          if (block) {
                            navigator.clipboard.writeText(block);
                            toast({ title: "Plan JSON copied" });
                          }
                        }}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Copy Plan JSON
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      After the AI replies, we’ll try to parse its final JSON block and enable one‑click creation.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Prompt Starter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Include:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Platform + bot type</li>
                    <li>Industry + brand tone</li>
                    <li>Do/Don’t rules</li>
                    <li>Variables you want (e.g. {"{customer_name}"})</li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
