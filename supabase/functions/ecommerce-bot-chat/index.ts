 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createOpenRouterClient, chatCompletion } from "../_shared/openrouter.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 // Shopify API configuration
 const SHOPIFY_API_VERSION = '2025-07';
 const SHOPIFY_STORE_DOMAIN = 'botgenius-hub-dlx7o.myshopify.com';
 const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
 const SHOPIFY_STOREFRONT_TOKEN = '4871d44bcd549f7fd5ddd4bdbc55c817';
 
 async function shopifyRequest(query: string, variables: any = {}) {
   const response = await fetch(SHOPIFY_STOREFRONT_URL, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
     },
     body: JSON.stringify({ query, variables }),
   });
 
   if (!response.ok) {
     throw new Error(`Shopify API error: ${response.status}`);
   }
 
   return await response.json();
 }
 
 async function searchProducts(searchQuery: string, limit = 5) {
   const query = `
     query SearchProducts($first: Int!, $query: String!) {
       products(first: $first, query: $query) {
         edges {
           node {
             id
             title
             description
             handle
             priceRange {
               minVariantPrice {
                 amount
                 currencyCode
               }
             }
             images(first: 1) {
               edges {
                 node {
                   url
                 }
               }
             }
             variants(first: 1) {
               edges {
                 node {
                   id
                   availableForSale
                 }
               }
             }
           }
         }
       }
     }
   `;
 
   const data = await shopifyRequest(query, { first: limit, query: searchQuery });
   return data?.data?.products?.edges || [];
 }
 
 async function getFeaturedProducts(limit = 6) {
   const query = `
     query GetProducts($first: Int!) {
       products(first: $first) {
         edges {
           node {
             id
             title
             description
             handle
             priceRange {
               minVariantPrice {
                 amount
                 currencyCode
               }
             }
             images(first: 1) {
               edges {
                 node {
                   url
                 }
               }
             }
           }
         }
       }
     }
   `;
 
   const data = await shopifyRequest(query, { first: limit });
   return data?.data?.products?.edges || [];
 }
 
 async function createCart(variantId: string, quantity = 1) {
   const mutation = `
     mutation cartCreate($input: CartInput!) {
       cartCreate(input: $input) {
         cart {
           id
           checkoutUrl
         }
         userErrors {
           field
           message
         }
       }
     }
   `;
 
   const data = await shopifyRequest(mutation, {
     input: {
       lines: [{ quantity, merchandiseId: variantId }]
     }
   });
 
   const cart = data?.data?.cartCreate?.cart;
   if (cart?.checkoutUrl) {
     const url = new URL(cart.checkoutUrl);
     url.searchParams.set('channel', 'online_store');
     return url.toString();
   }
   return null;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { userMessage, botConfig, conversationHistory = [] } = await req.json();
 
      const apiKey = await createOpenRouterClient();
 
     const systemPrompt = `You are a ${botConfig?.personality || "helpful"} e-commerce sales assistant. ${botConfig?.description || ""}
 
 Your role is to help customers:
 - Discover and recommend products
 - Answer product questions
 - Guide them through the purchase process
 - Create shopping cart links for checkout
 
 Be friendly, concise, and helpful. Use emojis occasionally to be engaging.
 When recommending products, describe them enthusiastically but accurately.
 Always provide clear next steps for the customer.`;
 
     const tools = [
       {
         type: "function",
         function: {
           name: "search_products",
           description: "Search for products in the store based on keywords, categories, or descriptions",
           parameters: {
             type: "object",
             properties: {
               query: {
                 type: "string",
                 description: "Search query (e.g., 'red shoes', 'electronics', 'gift')"
               },
               limit: {
                 type: "number",
                 description: "Maximum number of products to return (default 5)"
               }
             },
             required: ["query"]
           }
         }
       },
       {
         type: "function",
         function: {
           name: "get_featured_products",
           description: "Get featured or popular products from the store",
           parameters: {
             type: "object",
             properties: {
               limit: {
                 type: "number",
                 description: "Number of products to return (default 6)"
               }
             }
           }
         }
       },
       {
         type: "function",
         function: {
           name: "create_checkout",
           description: "Create a checkout link for a specific product variant",
           parameters: {
             type: "object",
             properties: {
               variantId: {
                 type: "string",
                 description: "The Shopify variant ID (starts with gid://shopify/ProductVariant/)"
               },
               quantity: {
                 type: "number",
                 description: "Quantity to add (default 1)"
               }
             },
             required: ["variantId"]
           }
         }
       }
     ];
 
     const messages = [
       { role: "system", content: systemPrompt },
       ...conversationHistory,
       { role: "user", content: userMessage }
     ];
 
      let aiData = await chatCompletion(apiKey, "xiaomi/mimo-v2-flash:free", messages, tools);
     let assistantMessage = aiData.choices?.[0]?.message;
 
     // Handle tool calls
     while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
       const toolCall = assistantMessage.tool_calls[0];
       const functionName = toolCall.function.name;
       const functionArgs = JSON.parse(toolCall.function.arguments);
 
       let toolResult;
       if (functionName === "search_products") {
         const products = await searchProducts(functionArgs.query, functionArgs.limit || 5);
         toolResult = JSON.stringify(products.map((p: any) => ({
           id: p.node.id,
           title: p.node.title,
           description: p.node.description?.substring(0, 150),
           price: `${p.node.priceRange.minVariantPrice.currencyCode} ${p.node.priceRange.minVariantPrice.amount}`,
           handle: p.node.handle,
           variantId: p.node.variants?.edges?.[0]?.node?.id,
           available: p.node.variants?.edges?.[0]?.node?.availableForSale,
           image: p.node.images?.edges?.[0]?.node?.url
         })));
       } else if (functionName === "get_featured_products") {
         const products = await getFeaturedProducts(functionArgs.limit || 6);
         toolResult = JSON.stringify(products.map((p: any) => ({
           id: p.node.id,
           title: p.node.title,
           description: p.node.description?.substring(0, 150),
           price: `${p.node.priceRange.minVariantPrice.currencyCode} ${p.node.priceRange.minVariantPrice.amount}`,
           handle: p.node.handle,
           image: p.node.images?.edges?.[0]?.node?.url
         })));
       } else if (functionName === "create_checkout") {
         const checkoutUrl = await createCart(functionArgs.variantId, functionArgs.quantity || 1);
         toolResult = JSON.stringify({ checkoutUrl });
       } else {
         toolResult = JSON.stringify({ error: "Unknown function" });
       }
 
       messages.push(assistantMessage);
       messages.push({
         role: "tool",
         tool_call_id: toolCall.id,
         content: toolResult
       });
 
        aiData = await chatCompletion(apiKey, "xiaomi/mimo-v2-flash:free", messages, tools);
       assistantMessage = aiData.choices?.[0]?.message;
     }
 
     const botReply = assistantMessage?.content || "I'm sorry, I couldn't process that request.";
 
     return new Response(
       JSON.stringify({ 
         reply: botReply,
         success: true 
       }),
       {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error) {
     console.error("ecommerce-bot-chat error:", error);
     return new Response(
       JSON.stringify({ 
         error: error instanceof Error ? error.message : "Unknown error",
         reply: "I'm having trouble processing your request right now. Please try again later."
       }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });