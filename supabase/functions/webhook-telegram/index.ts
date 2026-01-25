 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
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
 
     // Handle incoming Telegram message
     const body = await req.json();
     console.log("Telegram webhook payload:", JSON.stringify(body));
 
     // Log the webhook request
     await supabase.from("webhook_logs").insert({
       deployment_id: deploymentId,
       request_body: body,
       response_status: 200,
     });
 
     // Extract message from Telegram webhook format
     const message = body.message;
 
     if (message?.text) {
       const userMessage = message.text;
       const chatId = message.chat.id;
       const from = message.from.username || message.from.first_name;
 
       console.log(`Message from ${from} (${chatId}): ${userMessage}`);
 
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
         const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
         const systemPrompt = `You are a ${deployment.bots.personality || "friendly"} chatbot. ${deployment.bots.description || ""}`;
 
         const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
           method: "POST",
           headers: {
             Authorization: `Bearer ${LOVABLE_API_KEY}`,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             model: "google/gemini-3-flash-preview",
             messages: [
               { role: "system", content: systemPrompt },
               { role: "user", content: userMessage },
             ],
           }),
         });
 
         const aiData = await aiResponse.json();
         botReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
       }
 
       console.log(`Bot reply: ${botReply}`);
 
       // Note: To actually send the reply back to Telegram, you'd need to use
       // the Telegram Bot API with your bot token stored in deployment.config
       // This is a placeholder showing the structure
       // const telegramToken = deployment.config?.telegram_bot_token;
       // if (telegramToken) {
       //   await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
       //     method: "POST",
       //     headers: {
       //       "Content-Type": "application/json",
       //     },
       //     body: JSON.stringify({
       //       chat_id: chatId,
       //       text: botReply,
       //     }),
       //   });
       // }
     }
 
     return new Response(JSON.stringify({ success: true }), {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("Telegram webhook error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });