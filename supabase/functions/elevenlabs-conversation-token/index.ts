 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { agentId } = await req.json();
     
     if (!agentId) {
       throw new Error("Agent ID is required");
     }
 
     const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
     if (!ELEVENLABS_API_KEY) {
       throw new Error("ELEVENLABS_API_KEY is not configured");
     }
 
     console.log("Requesting conversation token for agent:", agentId);
 
     const response = await fetch(
       `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
       {
         headers: {
           "xi-api-key": ELEVENLABS_API_KEY,
         },
       }
     );
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("ElevenLabs API error:", response.status, errorText);
       throw new Error(`Failed to get conversation token: ${response.status}`);
     }
 
     const { token } = await response.json();
     console.log("Successfully generated conversation token");
 
     return new Response(JSON.stringify({ token }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("elevenlabs-conversation-token error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });