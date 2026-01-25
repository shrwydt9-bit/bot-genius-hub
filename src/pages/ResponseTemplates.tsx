 import { useState } from "react";
 import { motion } from "framer-motion";
 import { Navbar } from "@/components/Navbar";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Badge } from "@/components/ui/badge";
 import { Plus, Edit, Trash2, Copy, Eye, MessageSquare } from "lucide-react";
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
   const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
   const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
   
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
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <div className="pt-24 pb-16 px-4">
         <div className="container max-w-6xl">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex justify-between items-center mb-8"
           >
             <div>
               <h1 className="text-4xl font-bold text-gradient mb-2">Response Templates</h1>
               <p className="text-muted-foreground">Create reusable message templates with dynamic variables</p>
             </div>
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
               <DialogTrigger asChild>
                 <Button className="gradient-primary gap-2">
                   <Plus className="w-4 h-4" />
                   Create Template
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl">
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
                   <Card>
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
         </div>
       </div>
     </div>
   );
 };
 
 export default ResponseTemplates;