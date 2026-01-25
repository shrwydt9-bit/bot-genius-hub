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
 
     const body = await req.json();
     console.log("SMS webhook payload:", JSON.stringify(body));
 
     await supabase.from("webhook_logs").insert({
       deployment_id: deploymentId,
       request_body: body,
       response_status: 200,
     });
 
     // Twilio format: Body, From, To
     const userMessage = body.Body || body.text;
     const fromPhone = body.From || body.from;
 
     if (userMessage && fromPhone) {
       console.log(`SMS from ${fromPhone}: ${userMessage}`);
 
       const apiKey = await createOpenRouterClient();
       const systemPrompt = `You are a ${deployment.bots.personality || "concise"} SMS assistant. Keep responses under 160 characters. ${deployment.bots.description || ""}`;
 
       const aiData = await chatCompletion(
         apiKey,
         "xiaomi/mimo-v2-flash:free",
         [
           { role: "system", content: systemPrompt },
           { role: "user", content: userMessage },
         ]
       );
 
       const botReply = aiData.choices?.[0]?.message?.content || "Error processing message.";
       console.log(`Bot reply: ${botReply}`);
 
       // SMS reply via Twilio or similar service
     }
 
     return new Response(JSON.stringify({ success: true }), {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("SMS webhook error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });