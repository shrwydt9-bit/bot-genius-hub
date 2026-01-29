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

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function cleanString(v: unknown, max: number) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function validateCredentials(platform: Platform, raw: unknown) {
  if (!isPlainObject(raw)) return { ok: false as const, error: "credentials must be an object" };

  if (platform === "telegram") {
    const bot_token = cleanString(raw.bot_token, 200);
    if (!bot_token) return { ok: false as const, error: "telegram bot_token is required" };
    return { ok: true as const, value: { bot_token } };
  }

  // whatsapp
  const access_token = cleanString(raw.access_token, 500);
  const phone_number_id = cleanString(raw.phone_number_id, 80);
  const verify_token = cleanString(raw.verify_token, 120);

  if (!access_token) return { ok: false as const, error: "whatsapp access_token is required" };
  if (!phone_number_id) return { ok: false as const, error: "whatsapp phone_number_id is required" };
  if (!verify_token) return { ok: false as const, error: "whatsapp verify_token is required" };

  return { ok: true as const, value: { access_token, phone_number_id, verify_token } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Backend env not configured");
    }

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
      | { platform?: unknown; credentials?: unknown }
      | null;

    if (!isPlatform(body?.platform)) {
      return new Response(JSON.stringify({ error: "platform must be whatsapp or telegram" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const v = validateCredentials(body.platform, body?.credentials);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date().toISOString();
    const credentials = {
      ...v.value,
      // reset verification state on save
      verified_at: null,
      last_error: null,
      updated_at: now,
    };

    const { error } = await db
      .from("platform_integrations")
      .upsert(
        {
          user_id: userId,
          platform: body.platform,
          is_active: true,
          credentials,
        },
        { onConflict: "user_id,platform" },
      );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("integrations-save error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
