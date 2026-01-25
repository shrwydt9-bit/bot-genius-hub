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
     const { botId, analysisType } = await req.json();
     
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
 
     // Verify bot ownership
     const { data: bot } = await supabase
       .from("bots")
       .select("*")
       .eq("id", botId)
       .single();
 
     if (!bot || bot.user_id !== user.id) {
       throw new Error("Bot not found or unauthorized");
     }
 
     const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
     if (!OPENROUTER_API_KEY) {
       throw new Error("OPENROUTER_API_KEY is not configured");
     }
 
     // Fetch conversation data
     const { data: messages } = await supabase
       .from("conversation_messages")
       .select("*")
       .eq("bot_id", botId)
       .order("created_at", { ascending: false })
       .limit(500);
 
     const { data: sessions } = await supabase
       .from("conversation_sessions")
       .select("*")
       .eq("bot_id", botId)
       .order("started_at", { ascending: false })
       .limit(100);
 
     if (!messages || messages.length === 0) {
       return new Response(JSON.stringify({ 
         insights: [],
         message: "No conversation data available for analysis" 
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     let systemPrompt = "";
     
     switch (analysisType) {
       case "faq":
         systemPrompt = `You are an expert at analyzing customer conversations to identify frequently asked questions.
 
 Analyze the provided conversation data and extract the top 5-10 most common questions or topics.
 
 Bot: ${bot.name} (${bot.bot_type})
 Platform: ${bot.platform}
 Total Messages: ${messages.length}
 Total Sessions: ${sessions?.length || 0}
 
 Recent Messages Sample:
 ${messages.slice(0, 100).map((m: any) => `${m.role}: ${m.content}`).join('\n')}
 
 Return ONLY a JSON array:
 [
   {
     "question": "The frequently asked question",
     "category": "Category like 'product', 'support', 'pricing'",
     "frequency": 15,
     "suggestedAnswer": "A suggested response",
     "priority": "high|medium|low"
   }
 ]`;
         break;
       
       case "improvement":
         systemPrompt = `You are an expert bot optimization consultant. Analyze conversation data to identify improvement opportunities.
 
 Bot: ${bot.name}
 Personality: ${bot.personality}
 Greeting: ${bot.greeting_message}
 Total Messages: ${messages.length}
 
 Recent Conversations:
 ${messages.slice(0, 50).map((m: any) => `${m.role}: ${m.content}`).join('\n')}
 
 Return ONLY a JSON array of 5-7 actionable improvements:
 [
   {
     "area": "Area to improve (e.g., 'Response Time', 'Tone', 'Knowledge Gap')",
     "issue": "What's the problem",
     "recommendation": "Specific action to take",
     "impact": "Expected improvement",
     "priority": "high|medium|low"
   }
 ]`;
         break;
       
       case "sentiment":
         systemPrompt = `You are a sentiment analysis expert. Analyze user messages to understand overall sentiment and satisfaction.
 
 Bot: ${bot.name}
 Platform: ${bot.platform}
 
 User Messages (last 100):
 ${messages.filter((m: any) => m.role === 'user').slice(0, 100).map((m: any) => m.content).join('\n---\n')}
 
 Return ONLY a JSON object:
 {
   "overallSentiment": "positive|neutral|negative",
   "sentimentScore": 7.5,
   "breakdown": {
     "positive": 65,
     "neutral": 25,
     "negative": 10
   },
   "themes": [
     {
       "theme": "Theme name",
       "sentiment": "positive|neutral|negative",
       "examples": ["example1", "example2"]
     }
   ],
   "recommendations": ["recommendation1", "recommendation2"]
 }`;
         break;
       
       case "performance":
         const avgDuration = sessions && sessions.length > 0 
           ? sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / sessions.length
           : 0;
         
         const avgMessages = sessions && sessions.length > 0
           ? sessions.reduce((sum: number, s: any) => sum + (s.message_count || 0), 0) / sessions.length
           : 0;
 
         systemPrompt = `You are a bot performance analyst. Analyze metrics and conversation patterns.
 
 Bot: ${bot.name}
 Total Sessions: ${sessions?.length || 0}
 Total Messages: ${messages.length}
 Avg Session Duration: ${avgDuration.toFixed(0)} seconds
 Avg Messages per Session: ${avgMessages.toFixed(1)}
 
 Return ONLY a JSON object:
 {
   "metrics": {
     "responseQuality": 8.5,
     "efficiency": 7.0,
     "userEngagement": 8.0,
     "completionRate": 85
   },
   "insights": [
     {
       "metric": "Metric name",
       "score": 8.5,
       "trend": "improving|stable|declining",
       "insight": "What this means",
       "action": "What to do"
     }
   ],
   "benchmarks": {
     "industry": "How you compare to industry average",
     "suggestions": ["suggestion1", "suggestion2"]
   }
 }`;
         break;
       
       default:
         throw new Error("Invalid analysis type");
     }
 
     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${OPENROUTER_API_KEY}`,
         "Content-Type": "application/json",
         "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
         "X-Title": "BotGenius Hub - Conversation Analytics"
       },
       body: JSON.stringify({
         model: "tngtech/deepseek-r1t2-chimera:free",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: "Analyze the conversation data and provide insights." },
         ],
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("OpenRouter API error:", response.status, errorText);
       throw new Error(`OpenRouter API error: ${response.status}`);
     }
 
     const aiData = await response.json();
     const aiContent = aiData.choices?.[0]?.message?.content || "{}";
     
     // Extract JSON from response
     let jsonContent = aiContent;
     if (aiContent.includes("```json")) {
       const match = aiContent.match(/```json\n([\s\S]*?)\n```/);
       jsonContent = match ? match[1] : aiContent;
     } else if (aiContent.includes("```")) {
       const match = aiContent.match(/```\n([\s\S]*?)\n```/);
       jsonContent = match ? match[1] : aiContent;
     }
     
     let insights;
     try {
       insights = JSON.parse(jsonContent);
     } catch (e) {
       console.error("Failed to parse AI response:", jsonContent);
       insights = { error: "Failed to parse AI response", raw: jsonContent };
     }
 
     // Store insights in database
     if (analysisType === "faq" && Array.isArray(insights)) {
       const insightRecords = insights.map((item: any) => ({
         bot_id: botId,
         insight_type: "faq",
         title: item.question,
         description: item.suggestedAnswer || "",
         data: item,
         frequency: item.frequency || 1,
         priority: item.priority || "medium",
       }));
 
       await supabase
         .from("conversation_insights")
         .insert(insightRecords);
     } else if (analysisType === "improvement" && Array.isArray(insights)) {
       const insightRecords = insights.map((item: any) => ({
         bot_id: botId,
         insight_type: "improvement",
         title: item.area,
         description: item.recommendation,
         data: item,
         priority: item.priority || "medium",
       }));
 
       await supabase
         .from("conversation_insights")
         .insert(insightRecords);
     }
 
     return new Response(JSON.stringify({ insights }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("conversation-analytics error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });