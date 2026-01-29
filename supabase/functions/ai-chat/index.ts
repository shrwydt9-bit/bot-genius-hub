import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { createOpenRouterClient, streamChatCompletion } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const intentSchema = {
  type: "object",
  properties: {
    createBot: { type: "boolean" },
    createTemplates: { type: "boolean" },
    createBrand: { type: "boolean" },
    createCopy: { type: "boolean" },
  },
  additionalProperties: false,
} as const;

type ModelOption = "qwen/qwen3-coder:free" | "google/gemini-3-flash-preview" | "google/gemini-2.5-pro" | "openai/gpt-5.2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Backend env not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Validate JWT (verify_jwt=false in config)
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const userId = (claims as any)?.claims?.sub as string | undefined;
    if (claimsError || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null) as
      | { messages?: ChatMessage[]; intent?: Record<string, unknown>; model?: unknown; deepThinking?: unknown }
      | null;

    const messages = Array.isArray(body?.messages) ? body!.messages : [];
    const intent = typeof body?.intent === "object" && body?.intent ? body.intent : {};
    const model: ModelOption = typeof body?.model === "string" && (body.model === "qwen/qwen3-coder:free" || body.model === "google/gemini-3-flash-preview" || body.model === "google/gemini-2.5-pro" || body.model === "openai/gpt-5.2") ? body.model : "qwen/qwen3-coder:free";
    const deepThinking = Boolean(body?.deepThinking);

    // Basic input validation
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an AI builder inside a bot platform.

You MUST:
- Ask at most 1 short clarifying question if required.
- Otherwise propose a concrete plan.
- ALWAYS end your answer with a fenced JSON block (\`\`\`json ... \`\`\`) matching this schema:
{
  "bot": { "name": string, "platform": string, "bot_type": string, "personality": string, "greeting_message": string } | null,
  "brand": { "name": string, "industry": string | null, "description": string | null, "website": string | null } | null,
  "templates": [ { "name": string, "description": string, "platform": string, "category": string, "template_content": string } ] | null,
  "copy": { "greeting_variants": string[], "personality_variants": string[], "notes": string | null } | null
}

Only include sections relevant to the user's intent. For unused sections, return null.

Constraints:
- platform must be one of: whatsapp, telegram, instagram, facebook, shopify, slack, discord, email, sms, linkedin, tiktok, microsoft_teams, twitter
- bot_type must be one of: customer_service, lead_generation, content_automation, ecommerce
- category must be one of: greeting, ecommerce, support, marketing, general
`;

    const systemMessage = deepThinking
      ? systemPrompt + `\n\nIntent flags: ${JSON.stringify(intent, null, 2)}\n\n**IMPORTANT**: Start every response with a numbered plan (max 5 steps), then proceed to execution.`
      : systemPrompt + `\n\nIntent flags: ${JSON.stringify(intent, null, 2)}\n(Validate against schema: ${JSON.stringify(intentSchema)})`;

    const fullMessages: ChatMessage[] = [{ role: "system", content: systemMessage }, ...messages];

    if (model === "qwen/qwen3-coder:free") {
      // Use OpenRouter for qwen
      const openRouterKey = await createOpenRouterClient();
      
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Start streaming in background
      (async () => {
        try {
          await streamChatCompletion(openRouterKey, model, fullMessages, async (chunk) => {
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`;
            await writer.write(encoder.encode(sseData));
          });
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("OpenRouter stream error:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      // Use Lovable AI for Gemini/GPT
      const payload: any = {
        model,
        stream: true,
        messages: fullMessages,
        temperature: 0.6,
      };

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!aiResp.ok || !aiResp.body) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits required. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const t = await aiResp.text().catch(() => "");
        console.error("ai-chat gateway error:", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(aiResp.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
