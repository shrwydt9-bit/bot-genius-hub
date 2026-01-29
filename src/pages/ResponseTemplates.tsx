 import { useState } from "react";
 import { motion } from "framer-motion";
  import { PageShell } from "@/components/layout/PageShell";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Plus, Edit, Trash2, Copy, Eye, MessageSquare, Sparkles, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 
 interface Variable {
   name: string;
   description: string;
 }
 
 interface Template {
   id: string;
   name: string;
   description: string;
   platform: string;
   template_content: string;
   variables: Variable[];
   category: string;
   is_active: boolean;
   usage_count: number;
 }
 
 const platforms = [
   "whatsapp", "telegram", "instagram", "facebook", "shopify", "slack", "discord",
   "email", "sms", "linkedin", "tiktok", "microsoft_teams", "twitter"
 ];
 
 const categories = ["greeting", "ecommerce", "support", "marketing", "general"];
 
 const ResponseTemplates = () => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isAiSuggestionsOpen, setIsAiSuggestionsOpen] = useState(false);
   const [isGenerating, setIsGenerating] = useState(false);
   const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
   const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
   const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
   const [aiFormData, setAiFormData] = useState({
     platform: "whatsapp",
     industry: "",
     botType: "customer_service",
     brandInfo: "",
   });

   const [formData, setFormData] = useState({
     name: "",
     description: "",
     platform: "whatsapp",
     template_content: "",
     category: "general",
   });
 
   const { data: templates, isLoading } = useQuery({
     queryKey: ["response-templates"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("response_templates")
         .select("*")
         .order("created_at", { ascending: false });
       
       if (error) throw error;
       
       return (data || []).map(item => ({
         ...item,
         variables: Array.isArray(item.variables) 
           ? (item.variables as unknown as Variable[])
           : []
       })) as Template[];
     },
   });
 
   const createMutation = useMutation({
     mutationFn: async (template: typeof formData) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error("Not authenticated");
 
       const variables = extractVariables(template.template_content);
       
       const { error } = await supabase
         .from("response_templates")
         .insert([{
           user_id: user.id,
           name: template.name,
           description: template.description,
           platform: template.platform as any,
           template_content: template.template_content,
           category: template.category,
           variables: variables as any,
         }]);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["response-templates"] });
       setIsCreateOpen(false);
       setFormData({
         name: "",
         description: "",
         platform: "whatsapp",
         template_content: "",
         category: "general",
       });
       toast({ title: "Template created successfully!" });
     },
     onError: () => {
       toast({ title: "Failed to create template", variant: "destructive" });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("response_templates")
         .delete()
         .eq("id", id);
       
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["response-templates"] });
       toast({ title: "Template deleted successfully!" });
     },
   });
 
   const extractVariables = (content: string): Variable[] => {
     const matches = content.match(/\{([^}]+)\}/g) || [];
     const uniqueVars = [...new Set(matches.map(m => m.slice(1, -1)))];
     return uniqueVars.map(name => ({
       name,
       description: `Value for ${name}`,
     }));
   };
 
   const renderPreview = (template: string, values: Record<string, string>) => {
     let result = template;
     Object.entries(values).forEach(([key, value]) => {
       result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `{${key}}`);
     });
     return result;
   };

   const generateAiSuggestions = async () => {
     setIsGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke("ai-template-suggestions", {
         body: aiFormData,
       });
       
       if (error) throw error;
       
       setAiSuggestions(data.suggestions || []);
       toast({ title: "AI suggestions generated successfully!" });
     } catch (error) {
       console.error("AI generation error:", error);
       toast({ 
         title: "Failed to generate suggestions", 
         description: "Please try again later",
         variant: "destructive" 
       });
     } finally {
       setIsGenerating(false);
     }
   };

   const useAiSuggestion = (suggestion: any) => {
     setFormData({
       name: suggestion.name,
       description: suggestion.description,
       platform: aiFormData.platform,
       template_content: suggestion.template_content,
       category: suggestion.category,
     });
     setIsAiSuggestionsOpen(false);
     setIsCreateOpen(true);
   };

    return (
      <PageShell containerClassName="container max-w-6xl">
            <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex justify-between items-center mb-8"
           >
             <div>
               <h1 className="text-4xl font-bold text-gradient mb-2">Response Templates</h1>
               <p className="text-muted-foreground">Create reusable message templates with dynamic variables</p>
             </div>
             <div className="flex gap-2">
               <Dialog open={isAiSuggestionsOpen} onOpenChange={setIsAiSuggestionsOpen}>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="gap-2">
                     <Sparkles className="w-4 h-4" />
                     AI Suggestions
                   </Button>
                 </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-panel">
                   <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-primary" />
                       AI-Powered Template Suggestions
                     </DialogTitle>
                     <DialogDescription>
                       Get intelligent template recommendations based on your platform and industry
                     </DialogDescription>
                   </DialogHeader>
                   
                   {aiSuggestions.length === 0 ? (
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label>Platform</Label>
                           <Select 
                             value={aiFormData.platform} 
                             onValueChange={(value) => setAiFormData({ ...aiFormData, platform: value })}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {platforms.map(p => (
                                 <SelectItem key={p} value={p}>{p}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Bot Type</Label>
                           <Select 
                             value={aiFormData.botType} 
                             onValueChange={(value) => setAiFormData({ ...aiFormData, botType: value })}
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="customer_service">Customer Service</SelectItem>
                               <SelectItem value="lead_generation">Lead Generation</SelectItem>
                               <SelectItem value="ecommerce">E-commerce</SelectItem>
                               <SelectItem value="content_automation">Content Automation</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                       <div>
                         <Label>Industry (Optional)</Label>
                         <Input
                           value={aiFormData.industry}
                           onChange={(e) => setAiFormData({ ...aiFormData, industry: e.target.value })}
                           placeholder="e.g., Healthcare, Retail, Technology"
                         />
                       </div>
                       <div>
                         <Label>Brand Information (Optional)</Label>
                         <Textarea
                           value={aiFormData.brandInfo}
                           onChange={(e) => setAiFormData({ ...aiFormData, brandInfo: e.target.value })}
                           placeholder="Describe your brand tone, values, or any specific requirements..."
                           rows={3}
                         />
                       </div>
                       <Button
                         onClick={generateAiSuggestions}
                         disabled={isGenerating}
                         className="w-full gradient-primary"
                       >
                         {isGenerating ? (
                           <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Generating Templates...
                           </>
                         ) : (
                           <>
                             <Sparkles className="w-4 h-4 mr-2" />
                             Generate AI Suggestions
                           </>
                         )}
                       </Button>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       <div className="flex justify-between items-center">
                         <p className="text-sm text-muted-foreground">
                           {aiSuggestions.length} templates generated
                         </p>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setAiSuggestions([])}
                         >
                           New Generation
                         </Button>
                       </div>
                       <div className="grid gap-3">
                         {aiSuggestions.map((suggestion, idx) => (
                            <Card key={idx} className="glass-panel glow-border">
                             <CardHeader>
                               <div className="flex justify-between items-start">
                                 <div>
                                   <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                                   <CardDescription>{suggestion.description}</CardDescription>
                                 </div>
                                 <Badge variant="secondary">{suggestion.category}</Badge>
                               </div>
                             </CardHeader>
                             <CardContent className="space-y-3">
                               <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                                 {suggestion.template_content}
                               </div>
                               {suggestion.variables?.length > 0 && (
                                 <div className="flex flex-wrap gap-2">
                                   <span className="text-xs text-muted-foreground">Variables:</span>
                                   {suggestion.variables.map((v: Variable) => (
                                     <Badge key={v.name} variant="outline" className="text-xs">
                                       {"{" + v.name + "}"}
                                     </Badge>
                                   ))}
                                 </div>
                               )}
                               <Button
                                 onClick={() => useAiSuggestion(suggestion)}
                                 size="sm"
                                 className="w-full"
                               >
                                 Use This Template
                               </Button>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                     </div>
                   )}
                 </DialogContent>
               </Dialog>
               
               <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
               <DialogTrigger asChild>
                 <Button className="gradient-primary gap-2">
                   <Plus className="w-4 h-4" />
                   Create Template
                 </Button>
               </DialogTrigger>
                <DialogContent className="max-w-2xl glass-panel">
                 <DialogHeader>
                   <DialogTitle>Create Response Template</DialogTitle>
                   <DialogDescription>
                     Use {"{variable_name}"} syntax to add dynamic variables
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label>Template Name</Label>
                       <Input
                         value={formData.name}
                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                         placeholder="Welcome Message"
                       />
                     </div>
                     <div>
                       <Label>Platform</Label>
                       <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {platforms.map(p => (
                             <SelectItem key={p} value={p}>{p}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <div>
                     <Label>Description</Label>
                     <Input
                       value={formData.description}
                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                       placeholder="Brief description of this template"
                     />
                   </div>
                   <div>
                     <Label>Category</Label>
                     <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {categories.map(c => (
                           <SelectItem key={c} value={c}>{c}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label>Template Content</Label>
                     <Textarea
                       value={formData.template_content}
                       onChange={(e) => setFormData({ ...formData, template_content: e.target.value })}
                       placeholder="Hello {customer_name}! Welcome to {business_name}..."
                       rows={6}
                       className="font-mono text-sm"
                     />
                     <p className="text-xs text-muted-foreground mt-2">
                       Detected variables: {extractVariables(formData.template_content).map(v => v.name).join(", ") || "None"}
                     </p>
                   </div>
                   <Button
                     onClick={() => createMutation.mutate(formData)}
                     disabled={!formData.name || !formData.template_content || createMutation.isPending}
                     className="w-full"
                   >
                     {createMutation.isPending ? "Creating..." : "Create Template"}
                   </Button>
                 </div>
               </DialogContent>
             </Dialog>
             </div>
           </motion.div>
 
           {isLoading ? (
             <div className="text-center py-12">Loading templates...</div>
           ) : (
             <div className="grid gap-4">
               {templates?.map((template, i) => (
                 <motion.div
                   key={template.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                 >
                    <Card className="glass-panel glow-border">
                     <CardHeader>
                       <div className="flex justify-between items-start">
                         <div>
                           <CardTitle className="flex items-center gap-2">
                             <MessageSquare className="w-5 h-5" />
                             {template.name}
                           </CardTitle>
                           <CardDescription>{template.description}</CardDescription>
                         </div>
                         <div className="flex gap-2">
                           <Badge variant="outline">{template.platform}</Badge>
                           <Badge variant="secondary">{template.category}</Badge>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                           {template.template_content}
                         </div>
                         <div className="flex flex-wrap gap-2">
                           <span className="text-xs text-muted-foreground">Variables:</span>
                           {template.variables?.map((v: Variable) => (
                             <Badge key={v.name} variant="outline" className="text-xs">
                               {"{" + v.name + "}"}
                             </Badge>
                           ))}
                         </div>
                         <div className="flex gap-2">
                           <Dialog>
                             <DialogTrigger asChild>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => {
                                   setPreviewTemplate(template);
                                   setPreviewValues({});
                                 }}
                               >
                                 <Eye className="w-4 h-4 mr-2" />
                                 Preview
                               </Button>
                             </DialogTrigger>
                             <DialogContent>
                               <DialogHeader>
                                 <DialogTitle>Preview Template</DialogTitle>
                               </DialogHeader>
                               <div className="space-y-4">
                                 {template.variables?.map((v: Variable) => (
                                   <div key={v.name}>
                                     <Label>{v.name}</Label>
                                     <Input
                                       placeholder={v.description}
                                       value={previewValues[v.name] || ""}
                                       onChange={(e) => setPreviewValues({ ...previewValues, [v.name]: e.target.value })}
                                     />
                                   </div>
                                 ))}
                                 <div>
                                   <Label>Preview</Label>
                                   <div className="bg-muted p-4 rounded-lg mt-2 whitespace-pre-wrap">
                                     {renderPreview(template.template_content, previewValues)}
                                   </div>
                                 </div>
                               </div>
                             </DialogContent>
                           </Dialog>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               navigator.clipboard.writeText(template.template_content);
                               toast({ title: "Template copied to clipboard!" });
                             }}
                           >
                             <Copy className="w-4 h-4 mr-2" />
                             Copy
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => deleteMutation.mutate(template.id)}
                             disabled={deleteMutation.isPending}
                           >
                             <Trash2 className="w-4 h-4 mr-2" />
                             Delete
                           </Button>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </div>
           )}
      </PageShell>
   );
 };
 
 export default ResponseTemplates;