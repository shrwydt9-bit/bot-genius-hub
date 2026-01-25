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
     const { platform, industry, botType, brandInfo } = await req.json();
     
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
 
     const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
     if (!OPENROUTER_API_KEY) {
       throw new Error("OPENROUTER_API_KEY is not configured");
     }
 
     // Create AI prompt for template suggestions
     const systemPrompt = `You are an expert copywriter and marketing specialist. Generate 5 professional response templates for the ${platform} platform.
 
 Context:
 - Platform: ${platform}
 - Industry: ${industry || "general"}
 - Bot Type: ${botType || "customer_service"}
 - Brand Info: ${brandInfo || "N/A"}
 
 Requirements:
 1. Each template should be platform-appropriate (consider character limits, formatting, tone)
 2. Include dynamic variables using {variable_name} syntax
 3. Templates should cover different use cases: greeting, support, sales, FAQ, follow-up
 4. Be professional yet friendly
 5. Include emojis only if appropriate for the platform
 
 Return ONLY a JSON array of templates with this exact structure:
 [
   {
     "name": "Template Name",
     "description": "Brief description",
     "template_content": "Template with {variables}",
     "category": "greeting|support|ecommerce|marketing|general",
     "variables": [{"name": "variable_name", "description": "Variable description"}]
   }
 ]`;
 
     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "tngtech/deepseek-r1t2-chimera:free",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: "Generate 5 response templates based on the provided context." },
         ],
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("OpenRouter API error:", response.status, errorText);
       throw new Error(`OpenRouter API error: ${response.status}`);
     }
 
     const aiData = await response.json();
     const aiContent = aiData.choices?.[0]?.message?.content || "[]";
     
     // Extract JSON from the response (handle markdown code blocks)
     let jsonContent = aiContent;
     if (aiContent.includes("```json")) {
       const match = aiContent.match(/```json\n([\s\S]*?)\n```/);
       jsonContent = match ? match[1] : aiContent;
     } else if (aiContent.includes("```")) {
       const match = aiContent.match(/```\n([\s\S]*?)\n```/);
       jsonContent = match ? match[1] : aiContent;
     }
     
     let suggestions;
     try {
       suggestions = JSON.parse(jsonContent);
     } catch (e) {
       console.error("Failed to parse AI response:", jsonContent);
       // Fallback: create basic templates
       suggestions = [
         {
           name: "AI Generated Template",
           description: "Generated suggestion",
           template_content: aiContent.substring(0, 500),
           category: "general",
           variables: []
         }
       ];
     }
 
     return new Response(JSON.stringify({ suggestions }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("ai-template-suggestions error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });