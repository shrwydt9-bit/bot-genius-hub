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
     console.log("Discord webhook payload:", JSON.stringify(body));
 
     // Discord verification challenge
     if (body.type === 1) {
       return new Response(JSON.stringify({ type: 1 }), {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     await supabase.from("webhook_logs").insert({
       deployment_id: deploymentId,
       request_body: body,
       response_status: 200,
     });
 
     const userMessage = body.data?.content || body.content;
     const sender = body.member?.user?.username || body.author?.username;
 
     if (userMessage && sender) {
       console.log(`Discord message from ${sender}: ${userMessage}`);
 
       const apiKey = await createOpenRouterClient();
       const systemPrompt = `You are a ${deployment.bots.personality || "helpful"} Discord bot. ${deployment.bots.description || ""}`;
 
       const aiData = await chatCompletion(
         apiKey,
         "tngtech/deepseek-r1t2-chimera:free",
         [
           { role: "system", content: systemPrompt },
           { role: "user", content: userMessage },
         ]
       );
 
       const botReply = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that.";
       console.log(`Bot reply: ${botReply}`);
 
       // Discord Interactions API reply
     }
 
     return new Response(JSON.stringify({ success: true }), {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("Discord webhook error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });