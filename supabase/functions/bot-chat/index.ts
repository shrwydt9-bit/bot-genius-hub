import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenRouterClient, streamChatCompletion } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ModelOption = "qwen/qwen3-coder:free" | "google/gemini-3-flash-preview" | "google/gemini-2.5-pro" | "openai/gpt-5.2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      messages: ChatMessage[];
      botId: string;
      model?: unknown;
      deepThinking?: unknown;
    };

    const { messages, botId } = body;
    const model: ModelOption = typeof body?.model === "string" && (body.model === "qwen/qwen3-coder:free" || body.model === "google/gemini-3-flash-preview" || body.model === "google/gemini-2.5-pro" || body.model === "openai/gpt-5.2") ? body.model : "qwen/qwen3-coder:free";
    const deepThinking = Boolean(body?.deepThinking);
    
    if (!Array.isArray(messages) || !botId) {
      return new Response(JSON.stringify({ error: "messages and botId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Backend env not configured");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: bot } = await supabase
      .from("bots")
      .select("personality, greeting_message, description")
      .eq("id", botId)
      .single();

    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a ${bot?.personality || "friendly"} chatbot. ${bot?.description || ""}
Your greeting message is: ${bot?.greeting_message || "Hello! How can I help you?"}

Stay in character and provide helpful, conversational responses.${deepThinking ? "\n\n**IMPORTANT**: Start every response with a numbered plan (max 5 steps), then proceed to execution." : ""}`;

    const fullMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

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
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const payload = {
        model,
        messages: fullMessages,
        stream: true,
      };

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        console.error("AI gateway error:", response.status, text);
        return new Response(JSON.stringify({ error: "AI gateway failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }
  } catch (error) {
    console.error("bot-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
