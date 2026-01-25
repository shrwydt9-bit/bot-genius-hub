 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenRouterClient, chatCompletion } from "../_shared/openrouter.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const url = new URL(req.url);
     const deploymentId = url.searchParams.get("deployment_id");
     const secret = url.searchParams.get("secret");
 
     if (!deploymentId || !secret) {
       return new Response(JSON.stringify({ error: "Missing deployment_id or secret" }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
     );
 
     // Verify deployment exists and secret matches
     const { data: deployment, error: deploymentError } = await supabase
       .from("deployments")
       .select("*, bots(*)")
       .eq("id", deploymentId)
       .eq("webhook_secret", secret)
       .eq("is_active", true)
       .single();
 
     if (deploymentError || !deployment) {
       console.error("Invalid deployment:", deploymentError);
       return new Response(JSON.stringify({ error: "Invalid deployment" }), {
         status: 403,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Handle WhatsApp webhook verification
     if (req.method === "GET") {
       const mode = url.searchParams.get("hub.mode");
       const token = url.searchParams.get("hub.verify_token");
       const challenge = url.searchParams.get("hub.challenge");
 
       if (mode === "subscribe" && token === secret) {
         console.log("WhatsApp webhook verified");
         return new Response(challenge, { status: 200 });
       }
 
       return new Response("Forbidden", { status: 403 });
     }
 
     // Handle incoming WhatsApp message
     const body = await req.json();
     console.log("WhatsApp webhook payload:", JSON.stringify(body));
 
     // Log the webhook request
     await supabase.from("webhook_logs").insert({
       deployment_id: deploymentId,
       request_body: body,
       response_status: 200,
     });
 
     // Extract message from WhatsApp webhook format
     const entry = body.entry?.[0];
     const changes = entry?.changes?.[0];
     const message = changes?.value?.messages?.[0];
 
     if (message?.text?.body) {
       const userMessage = message.text.body;
       const from = message.from;
 
       console.log(`Message from ${from}: ${userMessage}`);
 
       // Call AI to generate response
        let botReply: string;
        
        // Check if this is an e-commerce bot
        if (deployment.bots.bot_type === "ecommerce") {
          // Use e-commerce bot chat function
          const ecommerceResponse = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/ecommerce-bot-chat`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                userMessage,
                botConfig: {
                  personality: deployment.bots.personality,
                  description: deployment.bots.description,
                  greeting: deployment.bots.greeting_message,
                },
                conversationHistory: [],
              }),
            }
          );
          
          const ecommerceData = await ecommerceResponse.json();
          botReply = ecommerceData.reply || "I'm sorry, I couldn't process that.";
        } else {
          // Use standard AI chat for non-ecommerce bots
          const apiKey = await createOpenRouterClient();
          const systemPrompt = `You are a ${deployment.bots.personality || "friendly"} chatbot. ${deployment.bots.description || ""}`;

          const aiData = await chatCompletion(
            apiKey,
            "tngtech/deepseek-r1t2-chimera:free",
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ]
          );
          
          botReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
        }
 
       console.log(`Bot reply: ${botReply}`);
 
       // Note: To actually send the reply back to WhatsApp, you'd need to use
       // the WhatsApp Business API with your access token stored in deployment.config
       // This is a placeholder showing the structure
       // const whatsappToken = deployment.config?.whatsapp_access_token;
       // if (whatsappToken) {
       //   await fetch(`https://graph.facebook.com/v18.0/${deployment.config.phone_number_id}/messages`, {
       //     method: "POST",
       //     headers: {
       //       Authorization: `Bearer ${whatsappToken}`,
       //       "Content-Type": "application/json",
       //     },
       //     body: JSON.stringify({
       //       messaging_product: "whatsapp",
       //       to: from,
       //       text: { body: botReply },
       //     }),
       //   });
       // }
     }
 
     return new Response(JSON.stringify({ success: true }), {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("WhatsApp webhook error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });