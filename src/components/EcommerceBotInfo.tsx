 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ShoppingBag, Search, ShoppingCart, CreditCard, MessageSquare } from "lucide-react";
 
 export const EcommerceBotInfo = () => {
   const capabilities = [
     {
       icon: Search,
       title: "Product Search",
       description: "Customers can ask 'Show me red sneakers' and the bot finds matching products",
       example: "User: Show me wireless headphones\nBot: I found 3 wireless headphones for you..."
     },
     {
       icon: ShoppingBag,
       title: "Product Recommendations",
       description: "Bot suggests products based on customer preferences and browsing history",
       example: "User: What's new?\nBot: Here are our latest arrivals..."
     },
     {
       icon: ShoppingCart,
       title: "Cart Management",
       description: "Add items to cart directly through the conversation",
       example: "User: Add the blue one to my cart\nBot: Added to cart! Ready to checkout?"
     },
     {
       icon: CreditCard,
       title: "Checkout Links",
       description: "Bot generates secure checkout links for immediate purchase",
       example: "Bot: Here's your checkout link: [secure link]"
     }
   ];
 
   const exampleConversations = [
     {
       type: "Product Discovery",
       messages: [
         { role: "customer", text: "Hi! I'm looking for a gift for my mom" },
         { role: "bot", text: "I'd love to help! What does your mom enjoy? 🎁" },
         { role: "customer", text: "She loves gardening" },
         { role: "bot", text: "Perfect! I found these gardening tools and accessories..." }
       ]
     },
     {
       type: "Quick Purchase",
       messages: [
         { role: "customer", text: "Do you have iPhone cases?" },
         { role: "bot", text: "Yes! We have 12 iPhone cases. Which model do you have?" },
         { role: "customer", text: "iPhone 15 Pro" },
         { role: "bot", text: "Here are 5 cases for iPhone 15 Pro. The leather one is popular! 📱" }
       ]
     }
   ];
 
   return (
     <div className="space-y-6">
       <Card className="border-primary/20">
         <CardHeader>
           <div className="flex items-center gap-2">
             <ShoppingBag className="w-5 h-5 text-primary" />
             <CardTitle>E-commerce Bot Capabilities</CardTitle>
           </div>
           <CardDescription>
             Your e-commerce bots can help customers discover products, get recommendations, and complete purchases—all through natural conversation.
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {capabilities.map((capability, i) => (
             <div key={i} className="p-4 bg-muted/50 rounded-lg border border-border">
               <div className="flex items-start gap-3 mb-2">
                 <div className="p-2 bg-primary/10 rounded-md">
                   <capability.icon className="w-4 h-4 text-primary" />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-semibold mb-1">{capability.title}</h4>
                   <p className="text-sm text-muted-foreground mb-2">{capability.description}</p>
                   <div className="text-xs font-mono bg-background p-2 rounded border">
                     {capability.example.split('\n').map((line, j) => (
                       <div key={j} className={line.startsWith('User:') ? 'text-primary' : 'text-secondary-foreground'}>
                         {line}
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           ))}
         </CardContent>
       </Card>
 
       <Card className="border-primary/20">
         <CardHeader>
           <div className="flex items-center gap-2">
             <MessageSquare className="w-5 h-5 text-primary" />
             <CardTitle>Example Conversations</CardTitle>
           </div>
           <CardDescription>
             See how customers interact with your e-commerce bot
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {exampleConversations.map((conversation, i) => (
             <div key={i} className="space-y-2">
               <Badge variant="outline">{conversation.type}</Badge>
               <div className="space-y-2">
                 {conversation.messages.map((msg, j) => (
                   <div
                     key={j}
                     className={`p-3 rounded-lg ${
                       msg.role === 'customer' 
                         ? 'bg-primary/10 text-primary-foreground ml-8' 
                         : 'bg-muted mr-8'
                     }`}
                   >
                     <div className="text-xs font-semibold mb-1 opacity-70">
                       {msg.role === 'customer' ? 'Customer' : 'Bot'}
                     </div>
                     <div className="text-sm">{msg.text}</div>
                   </div>
                 ))}
               </div>
             </div>
           ))}
         </CardContent>
       </Card>
     </div>
   );
 };