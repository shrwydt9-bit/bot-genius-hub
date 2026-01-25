 // OpenRouter API client for Deno Edge Functions
 const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
 
 export interface ChatMessage {
   role: "system" | "user" | "assistant" | "tool";
   content: string;
   tool_call_id?: string;
 }
 
 export async function createOpenRouterClient() {
   const apiKey = Deno.env.get("OPENROUTER_API_KEY");
   if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
   return apiKey;
 }
 
 export async function streamChatCompletion(
   apiKey: string,
   model: string,
   messages: ChatMessage[],
   onChunk: (content: string) => void
 ) {
   const response = await fetch(OPENROUTER_API_URL, {
     method: "POST",
     headers: {
       "Authorization": `Bearer ${apiKey}`,
       "Content-Type": "application/json",
       "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
       "X-Title": "BotGenius Hub"
     },
     body: JSON.stringify({
       model,
       messages,
       stream: true,
     }),
   });
 
   if (!response.ok) {
     throw new Error(`OpenRouter API error: ${response.status}`);
   }
 
   const reader = response.body?.getReader();
   if (!reader) throw new Error("No response body");
 
   const decoder = new TextDecoder();
   let buffer = "";
 
   while (true) {
     const { done, value } = await reader.read();
     if (done) break;
 
     buffer += decoder.decode(value, { stream: true });
     const lines = buffer.split("\n");
     buffer = lines.pop() || "";
 
     for (const line of lines) {
       if (line.startsWith("data: ")) {
         const data = line.slice(6);
         if (data === "[DONE]") continue;
         
         try {
           const parsed = JSON.parse(data);
           const content = parsed.choices?.[0]?.delta?.content;
           if (content) onChunk(content);
         } catch (e) {
           console.error("Parse error:", e);
         }
       }
     }
   }
 }
 
 export async function chatCompletion(
   apiKey: string,
   model: string,
   messages: ChatMessage[],
   tools?: any[]
 ) {
   const body: any = {
     model,
     messages,
     stream: false,
   };
   
   if (tools && tools.length > 0) {
     body.tools = tools;
     body.tool_choice = "auto";
   }
 
   const response = await fetch(OPENROUTER_API_URL, {
     method: "POST",
     headers: {
       "Authorization": `Bearer ${apiKey}`,
       "Content-Type": "application/json",
       "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "",
       "X-Title": "BotGenius Hub"
     },
     body: JSON.stringify(body),
   });
 
   if (!response.ok) {
     throw new Error(`OpenRouter API error: ${response.status}`);
   }
 
   return await response.json();
 }