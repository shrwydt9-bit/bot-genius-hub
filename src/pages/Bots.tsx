import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bot, ExternalLink, Loader2, Rocket, Search, Settings2, Trash2, Copy } from "lucide-react";

type BotRow = {
  id: string;
  name: string;
  platform: string;
  bot_type: string;
  is_active: boolean | null;
  created_at: string;
};

type DeploymentRow = {
  id: string;
  bot_id: string;
  platform: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
};

function buildWebhookUrl(platform: string) {
  // The webhook handlers are deployed as backend functions named webhook-<platform>
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-${platform}`;
}

export default function Bots() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const [deployingBotId, setDeployingBotId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [latestDeployment, setLatestDeployment] = useState<DeploymentRow | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const { data: bots, isLoading } = useQuery({
    queryKey: ["bots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bots")
        .select("id,name,platform,bot_type,is_active,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BotRow[];
    },
  });

  const { data: deploymentsByBot } = useQuery({
    queryKey: ["deployments-by-bot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployments")
        .select("id,bot_id,platform,webhook_url,webhook_secret,is_active,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as DeploymentRow[];
      const map = new Map<string, DeploymentRow[]>();
      for (const d of rows) {
        const arr = map.get(d.bot_id) ?? [];
        arr.push(d);
        map.set(d.bot_id, arr);
      }
      return map;
    },
  });

  const platforms = useMemo(() => {
    const set = new Set((bots ?? []).map((b) => b.platform));
    return Array.from(set).sort();
  }, [bots]);

  const types = useMemo(() => {
    const set = new Set((bots ?? []).map((b) => b.bot_type));
    return Array.from(set).sort();
  }, [bots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (bots ?? []).filter((b) => {
      const matchesQ = !q || b.name.toLowerCase().includes(q);
      const matchesPlatform = !platformFilter || b.platform === platformFilter;
      const matchesType = !typeFilter || b.bot_type === typeFilter;
      return matchesQ && matchesPlatform && matchesType;
    });
  }, [bots, platformFilter, search, typeFilter]);

  const onCustomize = (b: BotRow) => {
    navigate(`/customize?platform=${b.platform}&botId=${b.id}`);
  };

  const onDelete = async (b: BotRow) => {
    const ok = confirm(`Delete bot "${b.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      const { error } = await supabase.from("bots").delete().eq("id", b.id);
      if (error) throw error;
      toast({ title: "Bot deleted" });
      queryClient.invalidateQueries({ queryKey: ["bots"] });
      queryClient.invalidateQueries({ queryKey: ["deployments-by-bot"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete failed", description: e?.message ?? "" });
    }
  };

  const createDeployment = async (b: BotRow) => {
    setIsDeploying(true);
    setLatestDeployment(null);
    try {
      const webhookUrl = buildWebhookUrl(b.platform);
      const { data, error } = await supabase
        .from("deployments")
        .insert({
          bot_id: b.id,
          platform: b.platform,
          webhook_url: webhookUrl,
          is_active: true,
        })
        .select("id,bot_id,platform,webhook_url,webhook_secret,is_active,created_at")
        .single();
      if (error) throw error;
      setLatestDeployment(data as DeploymentRow);
      toast({ title: "Deployment created" });
      queryClient.invalidateQueries({ queryKey: ["deployments-by-bot"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Deploy failed", description: e?.message ?? "" });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <PageShell containerClassName="container max-w-6xl">
      <PageHeader
        title="Bots"
        subtitle="Search, filter, deploy, and manage your bots."
        right={<Button className="gradient-primary" onClick={() => navigate("/create")}>New</Button>}
      />

          <Card className="glass-panel glow-border mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search bots by name…"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearch("");
                      setPlatformFilter(null);
                      setTypeFilter(null);
                    }}
                  >
                    <Settings2 className="h-4 w-4 mr-2" />
                    Reset filters
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <Badge
                    key={p}
                    variant={platformFilter === p ? "default" : "secondary"}
                    className="cursor-pointer capitalize"
                    onClick={() => setPlatformFilter((cur) => (cur === p ? null : p))}
                  >
                    {p}
                  </Badge>
                ))}
                {types.map((t) => (
                  <Badge
                    key={t}
                    variant={typeFilter === t ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setTypeFilter((cur) => (cur === t ? null : t))}
                  >
                    {t.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="glass-panel glow-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  No bots found
                </CardTitle>
                <CardDescription>Try changing filters, or create one from AI Chat.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="gradient-primary" onClick={() => navigate("/ai-chat")}>Go to AI Chat</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((b) => {
                const depCount = deploymentsByBot?.get(b.id)?.length ?? 0;
                const latest = deploymentsByBot?.get(b.id)?.[0];
                return (
                  <Card key={b.id} className="glass-panel glow-border">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-xl">{b.name}</CardTitle>
                          <CardDescription>
                            <span className="capitalize">{b.platform}</span> • {b.bot_type.replace(/_/g, " ")}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Badge variant="outline" className="capitalize">{b.platform}</Badge>
                          <Badge variant="secondary">{b.bot_type.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Deployments: {depCount}</span>
                        <span>Created {new Date(b.created_at).toLocaleDateString()}</span>
                      </div>

                      {latest?.webhook_url ? (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">{latest.webhook_url}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(latest.webhook_url);
                              toast({ title: "Webhook copied" });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-3 gap-2">
                        <Button className="w-full" onClick={() => onCustomize(b)}>
                          Customize
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>

                        <Dialog
                          open={deployingBotId === b.id}
                          onOpenChange={(open) => {
                            setDeployingBotId(open ? b.id : null);
                            setLatestDeployment(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <Rocket className="h-4 w-4 mr-2" />
                              Deploy
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Deploy: {b.name}</DialogTitle>
                              <DialogDescription>
                                This creates a deployment record and gives you a webhook URL for the {b.platform} handler.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                              <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground mb-2">Webhook URL</p>
                                <code className="block text-xs break-all">{buildWebhookUrl(b.platform)}</code>
                              </div>

                              <Button className="w-full gradient-primary" disabled={isDeploying} onClick={() => createDeployment(b)}>
                                {isDeploying ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating…
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="h-4 w-4 mr-2" />
                                    Create Deployment
                                  </>
                                )}
                              </Button>

                              {latestDeployment ? (
                                <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Created</p>
                                    <Badge variant="default">Active</Badge>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Webhook URL</p>
                                    <code className="block text-xs break-all">{latestDeployment.webhook_url}</code>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Webhook Secret</p>
                                    <code className="block text-xs break-all">{latestDeployment.webhook_secret}</code>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button variant="destructive" className="w-full" onClick={() => onDelete(b)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
    </PageShell>
  );
}
