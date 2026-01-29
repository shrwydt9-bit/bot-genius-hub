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
      | { platform?: unknown }
      | null;

    if (!isPlatform(body?.platform)) {
      return new Response(JSON.stringify({ error: "platform must be whatsapp or telegram" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: row, error: readErr } = await db
      .from("platform_integrations")
      .select("id,credentials,is_active")
      .eq("user_id", userId)
      .eq("platform", body.platform)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row || !row.is_active) {
      return new Response(JSON.stringify({ error: "Not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isPlainObject(row.credentials)) {
      return new Response(JSON.stringify({ error: "Invalid stored credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const creds = row.credentials as Record<string, unknown>;
    const now = new Date().toISOString();
    let ok = false;
    let details: unknown = null;
    let lastError: string | null = null;

    if (body.platform === "telegram") {
      const token = typeof creds.bot_token === "string" ? creds.bot_token : "";
      if (!token) {
        return new Response(JSON.stringify({ error: "Missing telegram bot_token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resp = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`);
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.ok === true) {
        ok = true;
        details = { username: json?.result?.username ?? null };
      } else {
        lastError = `Telegram verification failed [${resp.status}]: ${JSON.stringify(json)}`;
      }
    }

    if (body.platform === "whatsapp") {
      const accessToken = typeof creds.access_token === "string" ? creds.access_token : "";
      const phoneNumberId = typeof creds.phone_number_id === "string" ? creds.phone_number_id : "";
      if (!accessToken || !phoneNumberId) {
        return new Response(JSON.stringify({ error: "Missing whatsapp access_token or phone_number_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = new URL(`https://graph.facebook.com/v18.0/${encodeURIComponent(phoneNumberId)}`);
      url.searchParams.set("fields", "id,display_phone_number");
      url.searchParams.set("access_token", accessToken);

      const resp = await fetch(url);
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.id) {
        ok = true;
        details = { phone_number_id: json.id, display_phone_number: json.display_phone_number ?? null };
      } else {
        lastError = `WhatsApp verification failed [${resp.status}]: ${JSON.stringify(json)}`;
      }
    }

    const newCreds = {
      ...creds,
      verified_at: ok ? now : null,
      last_error: ok ? null : lastError,
      updated_at: now,
    };

    const { error: writeErr } = await db
      .from("platform_integrations")
      .update({ credentials: newCreds })
      .eq("id", row.id);
    if (writeErr) throw writeErr;

    return new Response(JSON.stringify({ success: ok, details }), {
      status: ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("integrations-verify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
