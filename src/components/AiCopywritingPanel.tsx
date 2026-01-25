 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Sparkles, Loader2, Copy, Check, ThumbsUp, Wand2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 interface AiCopywritingPanelProps {
   platform: string;
   currentGreeting?: string;
   currentPersonality?: string;
   onApply: (updates: { greetingMessage?: string; personality?: string }) => void;
 }
 
 export const AiCopywritingPanel = ({
   platform,
   currentGreeting = "",
   currentPersonality = "",
   onApply,
 }: AiCopywritingPanelProps) => {
   const { toast } = useToast();
   const [activeTab, setActiveTab] = useState("greeting");
   const [isGenerating, setIsGenerating] = useState(false);
   const [suggestions, setSuggestions] = useState<any[]>([]);
   const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
   
   const [context, setContext] = useState({
     industry: "",
     botType: "customer_service",
     brandTone: "professional and friendly",
     targetAudience: "",
     goal: "",
   });
 
   const generateSuggestions = async (type: string, currentText: string) => {
     setIsGenerating(true);
     setSuggestions([]);
     
     try {
       const { data, error } = await supabase.functions.invoke("ai-copywriting-assistant", {
         body: {
           type,
           context: {
             platform,
             ...context,
           },
           currentText,
         },
       });
       
       if (error) throw error;
       
       setSuggestions(data.suggestions || []);
       toast({ title: "✨ Suggestions generated successfully!" });
     } catch (error) {
       console.error("Generation error:", error);
       toast({ 
         title: "Failed to generate suggestions", 
         description: "Please try again",
         variant: "destructive" 
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   const copyToClipboard = (text: string, index: number) => {
     navigator.clipboard.writeText(text);
     setCopiedIndex(index);
     setTimeout(() => setCopiedIndex(null), 2000);
     toast({ title: "Copied to clipboard!" });
   };
 
   const applySuggestion = (suggestion: any) => {
     if (activeTab === "greeting") {
       onApply({ greetingMessage: suggestion.text });
       toast({ title: "✅ Greeting message applied!" });
     } else if (activeTab === "personality") {
       onApply({ personality: suggestion.text });
       toast({ title: "✅ Personality applied!" });
     }
   };
 
   return (
     <Card className="h-full">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Wand2 className="w-5 h-5 text-primary" />
           AI Copywriting Assistant
         </CardTitle>
         <CardDescription>
           Generate and improve bot copy with AI suggestions
         </CardDescription>
       </CardHeader>
       <CardContent>
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-3">
             <TabsTrigger value="greeting">Greeting</TabsTrigger>
             <TabsTrigger value="personality">Personality</TabsTrigger>
             <TabsTrigger value="improve">Improve</TabsTrigger>
           </TabsList>
 
           <TabsContent value="greeting" className="space-y-4">
             <div className="space-y-3">
               <div>
                 <Label className="text-xs">Current Greeting</Label>
                 <div className="bg-muted p-2 rounded text-sm mt-1">
                   {currentGreeting || "No greeting set"}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <Label className="text-xs">Industry</Label>
                   <Input
                     placeholder="e.g., Healthcare"
                     value={context.industry}
                     onChange={(e) => setContext({ ...context, industry: e.target.value })}
                     className="h-8"
                   />
                 </div>
                 <div>
                   <Label className="text-xs">Bot Type</Label>
                   <Select value={context.botType} onValueChange={(value) => setContext({ ...context, botType: value })}>
                     <SelectTrigger className="h-8">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="customer_service">Customer Service</SelectItem>
                       <SelectItem value="lead_generation">Lead Generation</SelectItem>
                       <SelectItem value="ecommerce">E-commerce</SelectItem>
                       <SelectItem value="content_automation">Content</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
 
               <div>
                 <Label className="text-xs">Brand Tone</Label>
                 <Input
                   placeholder="e.g., professional and friendly"
                   value={context.brandTone}
                   onChange={(e) => setContext({ ...context, brandTone: e.target.value })}
                   className="h-8"
                 />
               </div>
 
               <Button
                 onClick={() => generateSuggestions("greeting", currentGreeting)}
                 disabled={isGenerating}
                 className="w-full gradient-primary"
                 size="sm"
               >
                 {isGenerating ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2" />
                     Generate Greetings
                   </>
                 )}
               </Button>
             </div>
           </TabsContent>
 
           <TabsContent value="personality" className="space-y-4">
             <div className="space-y-3">
               <div>
                 <Label className="text-xs">Current Personality</Label>
                 <div className="bg-muted p-2 rounded text-sm mt-1">
                   {currentPersonality || "No personality set"}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <Label className="text-xs">Industry</Label>
                   <Input
                     placeholder="e.g., Technology"
                     value={context.industry}
                     onChange={(e) => setContext({ ...context, industry: e.target.value })}
                     className="h-8"
                   />
                 </div>
                 <div>
                   <Label className="text-xs">Target Audience</Label>
                   <Input
                     placeholder="e.g., Tech-savvy users"
                     value={context.targetAudience}
                     onChange={(e) => setContext({ ...context, targetAudience: e.target.value })}
                     className="h-8"
                   />
                 </div>
               </div>
 
               <Button
                 onClick={() => generateSuggestions("personality", currentPersonality)}
                 disabled={isGenerating}
                 className="w-full gradient-primary"
                 size="sm"
               >
                 {isGenerating ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2" />
                     Generate Personalities
                   </>
                 )}
               </Button>
             </div>
           </TabsContent>
 
           <TabsContent value="improve" className="space-y-4">
             <div className="space-y-3">
               <div>
                 <Label className="text-xs">Text to Improve</Label>
                 <Textarea
                   placeholder="Paste any bot text here to improve..."
                   className="h-20 text-sm"
                 />
               </div>
               
               <div>
                 <Label className="text-xs">Goal</Label>
                 <Input
                   placeholder="e.g., Make it more engaging"
                   value={context.goal}
                   onChange={(e) => setContext({ ...context, goal: e.target.value })}
                   className="h-8"
                 />
               </div>
 
               <Button
                 onClick={() => generateSuggestions("improve", "")}
                 disabled={isGenerating}
                 className="w-full gradient-primary"
                 size="sm"
               >
                 {isGenerating ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Improving...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2" />
                     Improve Text
                   </>
                 )}
               </Button>
             </div>
           </TabsContent>
         </Tabs>
 
         <AnimatePresence>
           {suggestions.length > 0 && (
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="mt-4 space-y-2 max-h-96 overflow-y-auto"
             >
               <div className="flex justify-between items-center mb-2">
                 <Label className="text-sm font-semibold">AI Suggestions</Label>
                 <Badge variant="secondary">{suggestions.length} options</Badge>
               </div>
               
               {suggestions.map((suggestion, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                 >
                   <Card className="hover:border-primary transition-colors">
                     <CardContent className="p-3 space-y-2">
                       <div className="flex justify-between items-start gap-2">
                         <p className="text-sm flex-1">{suggestion.text}</p>
                         {suggestion.tone && (
                           <Badge variant="outline" className="text-xs">
                             {suggestion.tone}
                           </Badge>
                         )}
                       </div>
                       
                       {suggestion.explanation && (
                         <p className="text-xs text-muted-foreground">
                           💡 {suggestion.explanation}
                         </p>
                       )}
                       
                       {suggestion.traits && (
                         <div className="flex flex-wrap gap-1">
                           {suggestion.traits.map((trait: string) => (
                             <Badge key={trait} variant="secondary" className="text-xs">
                               {trait}
                             </Badge>
                           ))}
                         </div>
                       )}
 
                       {suggestion.score && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp className="w-3 h-3" />
                           <span className="font-semibold">{suggestion.score}/10</span>
                         </div>
                       )}
                       
                       <div className="flex gap-2">
                         <Button
                           size="sm"
                           variant="outline"
                           className="flex-1 h-7 text-xs"
                           onClick={() => copyToClipboard(suggestion.text, idx)}
                         >
                           {copiedIndex === idx ? (
                             <>
                               <Check className="w-3 h-3 mr-1" />
                               Copied
                             </>
                           ) : (
                             <>
                               <Copy className="w-3 h-3 mr-1" />
                               Copy
                             </>
                           )}
                         </Button>
                         <Button
                           size="sm"
                           className="flex-1 h-7 text-xs"
                           onClick={() => applySuggestion(suggestion)}
                         >
                           Apply
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </motion.div>
           )}
         </AnimatePresence>
       </CardContent>
     </Card>
   );
 };