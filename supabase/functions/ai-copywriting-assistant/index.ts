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
     const { type, context, currentText } = await req.json();
     
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
 
     let systemPrompt = "";
     
     switch (type) {
       case "greeting":
         systemPrompt = `You are an expert copywriter specializing in bot greeting messages. Generate 5 different greeting message variations.
 
 Context:
 - Platform: ${context.platform || "general"}
 - Industry: ${context.industry || "general"}
 - Bot Type: ${context.botType || "customer_service"}
 - Brand Tone: ${context.brandTone || "professional and friendly"}
 - Current Text: ${currentText || "N/A"}
 
 Requirements:
 1. Each greeting should be platform-appropriate (consider character limits)
 2. Match the brand tone and industry
 3. Be engaging and action-oriented
 4. Include relevant emojis if appropriate for the platform
 5. Vary in length and style (formal, casual, enthusiastic)
 
 Return ONLY a JSON array:
 [
   {
     "text": "Greeting message text",
     "tone": "professional|casual|enthusiastic|warm|concise",
     "length": "short|medium|long",
     "explanation": "Why this works"
   }
 ]`;
         break;
       
       case "personality":
         systemPrompt = `You are an expert in bot personality design. Generate 5 different personality descriptions.
 
 Context:
 - Platform: ${context.platform || "general"}
 - Industry: ${context.industry || "general"}
 - Bot Type: ${context.botType || "customer_service"}
 - Target Audience: ${context.targetAudience || "general"}
 - Current Personality: ${currentText || "N/A"}
 
 Requirements:
 1. Each personality should be unique and memorable
 2. Match the industry and target audience
 3. Include specific behavioral traits
 4. Be actionable and clear
 5. Consider platform constraints
 
 Return ONLY a JSON array:
 [
   {
     "text": "Personality description",
     "traits": ["trait1", "trait2", "trait3"],
     "suitableFor": "Description of best use case",
     "example": "Example response in this personality"
   }
 ]`;
         break;
       
       case "improve":
         systemPrompt = `You are an expert copywriting editor. Improve the provided text for bot communication.
 
 Context:
 - Platform: ${context.platform || "general"}
 - Industry: ${context.industry || "general"}
 - Current Text: ${currentText}
 - Goal: ${context.goal || "Make it more engaging and clear"}
 
 Requirements:
 1. Provide 5 improved versions
 2. Maintain the core message
 3. Optimize for clarity and engagement
 4. Consider platform-specific best practices
 5. Vary approaches (shorter, more formal, more casual, etc.)
 
 Return ONLY a JSON array:
 [
   {
     "text": "Improved text",
     "improvement": "What was changed and why",
     "score": 8.5
   }
 ]`;
         break;
       
       case "platform_specific":
         systemPrompt = `You are a platform-specific copywriting expert. Generate copy optimized for ${context.platform}.
 
 Platform: ${context.platform}
 Industry: ${context.industry || "general"}
 Purpose: ${context.purpose || "engagement"}
 Current Text: ${currentText || "N/A"}
 
 Platform-specific requirements:
 - WhatsApp: Conversational, emoji-friendly, max 4096 chars
 - Telegram: Rich formatting, bot commands, inline buttons
 - Email: Subject line + body, professional, HTML formatting
 - SMS: Ultra-concise, 160 chars, urgent tone
 - LinkedIn: Professional, value-focused, industry terminology
 - Instagram: Visual, emoji-heavy, hashtag-friendly
 - Discord: Gaming-friendly, casual, markdown formatting
 
 Return ONLY a JSON array of 5 variations:
 [
   {
     "text": "Platform-optimized copy",
     "features": ["feature1", "feature2"],
     "cta": "Call to action",
     "reasoning": "Why this works for this platform"
   }
 ]`;
         break;
       
       default:
         systemPrompt = `You are a general copywriting assistant. Provide helpful suggestions.`;
     }
 
     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
         "Content-Type": "application/json",
         "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
         "X-Title": "BotGenius Hub - AI Copywriting Assistant"
       },
       body: JSON.stringify({
         model: "tngtech/deepseek-r1t2-chimera:free",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: "Generate the copywriting suggestions." },
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
     
     // Extract JSON from response
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
       suggestions = [{
         text: aiContent,
         note: "Raw AI response (parsing failed)"
       }];
     }
 
     return new Response(JSON.stringify({ suggestions }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("ai-copywriting-assistant error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });