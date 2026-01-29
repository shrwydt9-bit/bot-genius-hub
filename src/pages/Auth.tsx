import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Bot, Mail, ShieldCheck } from "lucide-react";

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .max(255, "Email is too long");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

const createOrUpdateProfile = async (userId: string, email?: string | null) => {
  const displayName = email?.split("@")[0]?.slice(0, 40) ?? null;
  await supabase.from("profiles").upsert({ user_id: userId, display_name: displayName }, { onConflict: "user_id" });
};

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isBusy, setIsBusy] = useState(false);

  const emailConfirmed = useMemo(() => {
    const t = searchParams.get("type");
    return t === "signup" || t === "recovery" || t === "magiclink";
  }, [searchParams]);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Avoid Supabase calls inside callback; defer.
        setTimeout(() => {
          createOrUpdateProfile(session.user.id, session.user.email).catch(() => {
            // silent; profile is non-critical for auth flow
          });
        }, 0);

        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/", { replace: true });
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (emailConfirmed) {
      toast({
        title: "Email verified",
        description: "Your email was verified successfully. You can continue.",
      });
    }
  }, [emailConfirmed, toast]);

  const handleGoogle = async () => {
    setIsBusy(true);
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: e?.message ?? "Please try again.",
      });
      setIsBusy(false);
    }
  };

  const onSignIn = async (values: SignInValues) => {
    setIsBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: e?.message ?? "Please check your credentials and try again.",
      });
      setIsBusy(false);
    }
  };

  const onSignUp = async (values: SignUpValues) => {
    setIsBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth?type=signup`;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a verification link to finish creating your account.",
      });
      setActiveTab("signin");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: e?.message ?? "Please try again.",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative pt-24 pb-16 px-4">
        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
            animate={{ y: [0, 18, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-24 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-secondary/20 blur-3xl"
            animate={{ y: [0, -16, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        </div>

        <div className="container relative">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-2 items-center">
            <section className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Secure sign-in • Email verification
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Welcome to <span className="text-gradient">Orion Atlas</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-prose">
                Sign in to manage bots, templates, and analytics—optimized for every platform.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div className="rounded-xl border border-border bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Faster setup</p>
                      <p className="text-xs text-muted-foreground">Create bots in minutes</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Verified email</p>
                      <p className="text-xs text-muted-foreground">Link-based confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Sign in or create a new account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isBusy}
                    onClick={handleGoogle}
                  >
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="h-px w-full bg-border" />
                    <div className="absolute inset-0 -top-3 flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">Sign in</TabsTrigger>
                      <TabsTrigger value="signup">Create account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="mt-4">
                      <Form {...signInForm}>
                        <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                          <FormField
                            control={signInForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input autoComplete="email" inputMode="email" placeholder="you@company.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button className="w-full gradient-primary" type="submit" disabled={isBusy}>
                            Sign in
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-4">
                      <Form {...signUpForm}>
                        <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                          <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input autoComplete="email" inputMode="email" placeholder="you@company.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm password</FormLabel>
                                <FormControl>
                                  <Input type="password" autoComplete="new-password" placeholder="Repeat password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button className="w-full gradient-primary" type="submit" disabled={isBusy}>
                            Create account
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            We’ll email you a verification link to activate your account.
                          </p>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
