import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Platform = "whatsapp" | "telegram";

function isPlatform(v: unknown): v is Platform {
  return v === "whatsapp" || v === "telegram";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Backend env not configured");

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Validate JWT (verify_jwt=false in config)
    const { data: claims, error: claimsError } = await authClient.auth.getClaims();
    const userId = (claims as any)?.claims?.sub as string | undefined;
    if (claimsError || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as
      | { platforms?: unknown }
      | null;

    const requested = Array.isArray(body?.platforms) ? body!.platforms : ["whatsapp", "telegram"];
    const platforms = requested.filter(isPlatform) as Platform[];

    if (platforms.length === 0) {
      return new Response(JSON.stringify({ error: "platforms must include whatsapp and/or telegram" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use auth client to avoid any elevated data access; this endpoint returns only derived status.
    const { data, error } = await authClient
      .from("platform_integrations")
      .select("platform,is_active,updated_at,created_at,credentials")
      .eq("user_id", userId)
      .in("platform", platforms);
    if (error) throw error;

    const byPlatform: Record<string, unknown> = {};
    for (const p of platforms) {
      const row = (data ?? []).find((r: any) => r.platform === p);
      const verifiedAt = row?.credentials && typeof row.credentials === "object" ? (row.credentials as any).verified_at : null;
      byPlatform[p] = {
        connected: Boolean(row?.is_active),
        verified_at: typeof verifiedAt === "string" ? verifiedAt : null,
        updated_at: row?.updated_at ?? null,
        created_at: row?.created_at ?? null,
      };
    }

    return new Response(JSON.stringify({ status: byPlatform }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("integrations-status error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
