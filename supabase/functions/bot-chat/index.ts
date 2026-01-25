import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenRouterClient, streamChatCompletion } from "../_shared/openrouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, botId } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const apiKey = await createOpenRouterClient();

    const systemPrompt = `You are an AI assistant helping users customize their chatbot. Your job is to understand their requests and modify the bot's configuration.

When a user asks to modify the bot, you should:
1. Understand what they want to change (personality, greeting, responses, etc.)
2. Explain what changes you'll make
3. Provide the updated configuration in a clear way

Available bot properties you can modify:
- personality: The bot's tone and style (friendly, professional, casual, etc.)
- greeting_message: The first message the bot sends
- name: The bot's display name
- description: What the bot is for

Be conversational, helpful, and explain changes clearly. Ask clarifying questions if needed.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChatCompletion(
            apiKey,
            "tngtech/deepseek-r1t2-chimera:free",
            [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            (content) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  choices: [{ delta: { content } }]
                })}\n\n`)
              );
            }
          );
          
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("bot-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});