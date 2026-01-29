import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, RefreshCw, Save, ShieldAlert } from "lucide-react";

type Platform = "whatsapp" | "telegram";

type PlatformStatus = {
  connected: boolean;
  verified_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

const whatsappSchema = z.object({
  access_token: z.string().trim().min(1, "Access token is required").max(500, "Too long"),
  phone_number_id: z.string().trim().min(1, "Phone number ID is required").max(80, "Too long"),
  verify_token: z.string().trim().min(1, "Verify token is required").max(120, "Too long"),
});

const telegramSchema = z.object({
  bot_token: z.string().trim().min(1, "Bot token is required").max(200, "Too long"),
});

type WhatsAppValues = z.infer<typeof whatsappSchema>;
type TelegramValues = z.infer<typeof telegramSchema>;

function StatusBadge({ status }: { status: PlatformStatus | null }) {
  if (!status) return <Badge variant="secondary">Not connected</Badge>;
  if (!status.connected) return <Badge variant="secondary">Not connected</Badge>;
  if (status.verified_at) return <Badge variant="default">Verified</Badge>;
  return <Badge variant="outline">Connected</Badge>;
}

export default function Integrations() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [active, setActive] = useState<Platform>("whatsapp");
  const [status, setStatus] = useState<Record<Platform, PlatformStatus | null>>({
    whatsapp: null,
    telegram: null,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSaving, setIsSaving] = useState<Platform | null>(null);
  const [isVerifying, setIsVerifying] = useState<Platform | null>(null);

  const whatsappForm = useForm<WhatsAppValues>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { access_token: "", phone_number_id: "", verify_token: "" },
    mode: "onChange",
  });

  const telegramForm = useForm<TelegramValues>({
    resolver: zodResolver(telegramSchema),
    defaultValues: { bot_token: "" },
    mode: "onChange",
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth", { replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const lastVerifiedText = useMemo(() => {
    const s = status[active];
    if (!s?.verified_at) return "Not verified yet";
    return `Last verified: ${new Date(s.verified_at).toLocaleString()}`;
  }, [active, status]);

  const refreshStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const resp = await supabase.functions.invoke("integrations-status", {
        body: { platforms: ["whatsapp", "telegram"] },
      });
      if (resp.error) throw resp.error;
      const next = resp.data?.status ?? {};
      setStatus({
        whatsapp: (next.whatsapp ?? null) as PlatformStatus | null,
        telegram: (next.telegram ?? null) as PlatformStatus | null,
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load status", description: e?.message ?? "" });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePlatform = async (platform: Platform, credentials: Record<string, unknown>) => {
    setIsSaving(platform);
    try {
      const resp = await supabase.functions.invoke("integrations-save", { body: { platform, credentials } });
      if (resp.error) throw resp.error;
      toast({ title: "Saved", description: "Credentials stored securely. They are not shown in the UI." });
      await refreshStatus();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Save failed", description: e?.message ?? "" });
    } finally {
      setIsSaving(null);
    }
  };

  const verifyPlatform = async (platform: Platform) => {
    setIsVerifying(platform);
    try {
      const resp = await supabase.functions.invoke("integrations-verify", { body: { platform } });
      if (resp.error) {
        throw resp.error;
      }
      toast({
        title: "Verified",
        description: "Connection verified successfully.",
      });
      await refreshStatus();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Verification failed", description: e?.message ?? "" });
      await refreshStatus();
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gradient">Integrations</h1>
              <p className="text-muted-foreground">Connect WhatsApp and Telegram. We’ll only show connection status here.</p>
            </div>

            <Button variant="outline" onClick={refreshStatus} disabled={isLoadingStatus}>
              {isLoadingStatus ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>

          <Card className="border-border/60 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Status
                <StatusBadge status={status[active]} />
              </CardTitle>
              <CardDescription>{lastVerifiedText}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {status[active]?.connected ? "Connected in backend" : "Not connected"}
              </div>
              <Button
                className="sm:w-auto"
                variant="default"
                onClick={() => verifyPlatform(active)}
                disabled={!status[active]?.connected || isVerifying !== null}
              >
                {isVerifying === active ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Tabs value={active} onValueChange={(v) => setActive(v as Platform)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>WhatsApp</CardTitle>
                  <CardDescription>
                    Save your WhatsApp Business credentials. The UI won’t display them afterwards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...whatsappForm}>
                    <form
                      className="space-y-4"
                      onSubmit={whatsappForm.handleSubmit((values) => savePlatform("whatsapp", values))}
                    >
                      <FormField
                        control={whatsappForm.control}
                        name="access_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access token</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" placeholder="EAAG..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={whatsappForm.control}
                        name="phone_number_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone number ID</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" placeholder="1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={whatsappForm.control}
                        name="verify_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verify token</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" placeholder="Any secret string" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button type="submit" className="sm:w-auto" disabled={isSaving !== null}>
                          {isSaving === "whatsapp" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => verifyPlatform("whatsapp")}
                          disabled={!status.whatsapp?.connected || isVerifying !== null}
                        >
                          {isVerifying === "whatsapp" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verifying…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground flex gap-2">
                        <ShieldAlert className="h-4 w-4 mt-0.5" />
                        <p>
                          Credentials are stored server-side; this page only shows status. If you need help wiring the webhook URL for a specific bot,
                          go to <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/bots")}>Bots</Button> → Deploy.
                        </p>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="telegram" className="mt-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Telegram</CardTitle>
                  <CardDescription>Save your bot token and verify it via Telegram’s getMe endpoint.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...telegramForm}>
                    <form
                      className="space-y-4"
                      onSubmit={telegramForm.handleSubmit((values) => savePlatform("telegram", values))}
                    >
                      <FormField
                        control={telegramForm.control}
                        name="bot_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bot token</FormLabel>
                            <FormControl>
                              <Input autoComplete="off" placeholder="123456:ABC..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button type="submit" className="sm:w-auto" disabled={isSaving !== null}>
                          {isSaving === "telegram" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => verifyPlatform("telegram")}
                          disabled={!status.telegram?.connected || isVerifying !== null}
                        >
                          {isVerifying === "telegram" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verifying…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
