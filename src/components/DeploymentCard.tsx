 import { useState } from "react";
 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 interface DeploymentCardProps {
   deployment: {
     id: string;
     platform: string;
     webhook_url: string;
     is_active: boolean;
     created_at: string;
   };
   onDelete: () => void;
 }
 
 export const DeploymentCard = ({ deployment, onDelete }: DeploymentCardProps) => {
   const [copied, setCopied] = useState(false);
   const { toast } = useToast();
 
   const copyToClipboard = async (text: string) => {
     await navigator.clipboard.writeText(text);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
     toast({
       title: "Copied!",
       description: "Webhook URL copied to clipboard",
     });
   };
 
   const handleDelete = async () => {
     const { error } = await supabase
       .from("deployments")
       .delete()
       .eq("id", deployment.id);
 
     if (error) {
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to delete deployment",
       });
     } else {
       toast({
         title: "Deleted",
         description: "Deployment removed successfully",
       });
       onDelete();
     }
   };
 
   return (
     <Card className="p-4">
       <div className="flex items-start justify-between mb-3">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <h3 className="font-semibold capitalize">{deployment.platform}</h3>
             <Badge variant={deployment.is_active ? "default" : "secondary"}>
               {deployment.is_active ? "Active" : "Inactive"}
             </Badge>
           </div>
           <p className="text-xs text-muted-foreground">
             Created {new Date(deployment.created_at).toLocaleDateString()}
           </p>
         </div>
         <Button
           variant="ghost"
           size="icon"
           onClick={handleDelete}
           className="text-destructive hover:text-destructive"
         >
           <Trash2 className="w-4 h-4" />
         </Button>
       </div>
 
       <div className="space-y-2">
         <div className="flex items-center gap-2">
           <code className="flex-1 px-2 py-1 bg-muted rounded text-xs truncate">
             {deployment.webhook_url}
           </code>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => copyToClipboard(deployment.webhook_url)}
           >
             {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
           </Button>
         </div>
       </div>
     </Card>
   );
 };