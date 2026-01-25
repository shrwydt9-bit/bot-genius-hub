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
     const { botId, brandId, type } = await req.json();
     
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
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Get context data
     let contextData: any = {};
     
     if (botId) {
       const { data: bot } = await supabase
         .from("bots")
         .select("*, deployments(*), brands(*)")
         .eq("id", botId)
         .single();
       contextData.bot = bot;
       
       // Get analytics
       const { data: analytics } = await supabase
         .from("analytics_events")
         .select("*")
         .eq("bot_id", botId)
         .order("created_at", { ascending: false })
         .limit(100);
       contextData.analytics = analytics;
     }
 
     if (brandId) {
       const { data: brand } = await supabase
         .from("brands")
         .select("*, bots(*)")
         .eq("id", brandId)
         .single();
       contextData.brand = brand;
     }
 
     // Create AI prompt based on type
     let systemPrompt = "";
     
     switch (type) {
       case "business":
         systemPrompt = `You are a business consultant AI. Analyze the provided bot/brand data and generate 3-5 actionable business improvement suggestions. Focus on:
 - Platform optimization (which platforms to prioritize)
 - User engagement strategies
 - Growth opportunities
 - Revenue optimization
 - Market positioning
 
 Context: ${JSON.stringify(contextData)}
 
 Return a JSON array of suggestions with: title, description, priority (high/medium/low), and detailed ai_analysis.`;
         break;
       
       case "copywriting":
         systemPrompt = `You are an expert copywriter. Analyze the bot/brand and generate 3-5 copywriting improvement suggestions. Focus on:
 - Bot greeting messages
 - Personality refinement
 - Call-to-action improvements
 - Brand voice consistency
 - Conversion-optimized messaging
 
 Context: ${JSON.stringify(contextData)}
 
 Return a JSON array of suggestions with: title, description, priority, and example copy in ai_analysis.`;
         break;
       
       case "design":
         systemPrompt = `You are a UX/UI design expert. Analyze the bot/brand and generate 3-5 design improvement suggestions. Focus on:
 - Brand visual identity
 - Color scheme optimization
 - User experience flow
 - Interface consistency
 - Accessibility improvements
 
 Context: ${JSON.stringify(contextData)}
 
 Return a JSON array of suggestions with: title, description, priority, and design recommendations in ai_analysis.`;
         break;
       
       default:
         systemPrompt = `Analyze the data and provide general improvement suggestions.
 Context: ${JSON.stringify(contextData)}`;
     }
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: "Generate improvement suggestions based on the provided context." },
         ],
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       throw new Error("AI gateway error");
     }
 
     const aiData = await response.json();
     const aiContent = aiData.choices?.[0]?.message?.content || "[]";
     
     let suggestions;
     try {
       suggestions = JSON.parse(aiContent);
     } catch {
       suggestions = [{ title: "General Improvement", description: aiContent, priority: "medium" }];
     }
 
     // Store suggestions in database
     const suggestionRecords = suggestions.map((s: any) => ({
       bot_id: botId || null,
       brand_id: brandId || null,
       suggestion_type: type,
       title: s.title,
       description: s.description,
       priority: s.priority || "medium",
       ai_analysis: s.ai_analysis || {},
     }));
 
     const { data: created, error: insertError } = await supabase
       .from("ai_suggestions")
       .insert(suggestionRecords)
       .select();
 
     if (insertError) {
       console.error("Error storing suggestions:", insertError);
     }
 
     return new Response(JSON.stringify({ suggestions: created || suggestions }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("ai-suggestions error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });