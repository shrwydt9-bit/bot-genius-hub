 import { useState, useEffect } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Navbar } from "@/components/Navbar";
 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { ArrowLeft, TrendingUp, MessageSquare, Users, Zap, Sparkles, RefreshCw } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
 
 const Analytics = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const botId = searchParams.get("bot");
   const { toast } = useToast();
 
   const [bot, setBot] = useState<any>(null);
   const [analytics, setAnalytics] = useState<any[]>([]);
   const [suggestions, setSuggestions] = useState<any[]>([]);
   const [isGenerating, setIsGenerating] = useState(false);
 
   useEffect(() => {
     if (botId) {
       fetchData();
     }
   }, [botId]);
 
   const fetchData = async () => {
     // Fetch bot
     const { data: botData } = await supabase
       .from("bots")
       .select("*, brands(*), deployments(*)")
       .eq("id", botId)
       .single();
     setBot(botData);
 
     // Fetch analytics
     const { data: analyticsData } = await supabase
       .from("analytics_events")
       .select("*")
       .eq("bot_id", botId)
       .order("created_at", { ascending: false })
       .limit(100);
     setAnalytics(analyticsData || []);
 
     // Fetch suggestions
     const { data: suggestionsData } = await supabase
       .from("ai_suggestions")
       .select("*")
       .eq("bot_id", botId)
       .order("created_at", { ascending: false });
     setSuggestions(suggestionsData || []);
   };
 
   const generateSuggestions = async (type: string) => {
     setIsGenerating(true);
     try {
       const { data, error } = await supabase.functions.invoke("ai-suggestions", {
         body: { botId, type },
       });
 
       if (error) throw error;
 
       toast({
         title: "تم إنشاء الاقتراحات!",
         description: `تم إنشاء ${data.suggestions?.length || 0} اقتراحات جديدة`,
       });
 
       fetchData();
     } catch (error) {
       console.error(error);
       toast({
         variant: "destructive",
         title: "خطأ",
         description: "فشل في إنشاء الاقتراحات",
       });
     } finally {
       setIsGenerating(false);
     }
   };
 
   if (!bot) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="pt-20 flex items-center justify-center">
           <p className="text-muted-foreground">جاري التحميل...</p>
         </div>
       </div>
     );
   }
 
   // Calculate metrics
   const totalMessages = analytics.filter(e => e.event_type === "message").length;
   const totalUsers = new Set(analytics.map(e => e.metadata?.user_id).filter(Boolean)).size;
   const activeDeployments = bot.deployments?.filter((d: any) => d.is_active).length || 0;
 
   // Chart data
   const messagesByDay = analytics
     .reduce((acc: any[], event) => {
       const date = new Date(event.created_at).toLocaleDateString();
       const existing = acc.find(d => d.date === date);
       if (existing) {
         existing.messages += 1;
       } else {
         acc.push({ date, messages: 1 });
       }
       return acc;
     }, [])
     .slice(0, 7)
     .reverse();
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <div className="pt-20 pb-8 px-4">
         <div className="container max-w-7xl">
           <div className="flex items-center gap-4 mb-6">
             <Button variant="ghost" size="icon" onClick={() => navigate(`/customize?bot=${botId}`)}>
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div className="flex-1">
               <h1 className="text-3xl font-bold text-gradient">تحليلات متقدمة</h1>
               <p className="text-muted-foreground">رؤى وتحليلات لـ {bot.name}</p>
             </div>
           </div>
 
           {/* Metrics Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <Card className="p-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                   <MessageSquare className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                   <p className="text-2xl font-bold">{totalMessages}</p>
                 </div>
               </div>
             </Card>
 
             <Card className="p-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                   <Users className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">المستخدمون الفريدون</p>
                   <p className="text-2xl font-bold">{totalUsers}</p>
                 </div>
               </div>
             </Card>
 
             <Card className="p-6">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                   <TrendingUp className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-sm text-muted-foreground">المنصات النشطة</p>
                   <p className="text-2xl font-bold">{activeDeployments}</p>
                 </div>
               </div>
             </Card>
           </div>
 
           {/* Charts */}
           <Card className="p-6 mb-6">
             <h2 className="text-xl font-bold mb-4">نشاط الرسائل</h2>
             <ResponsiveContainer width="100%" height={300}>
               <LineChart data={messagesByDay}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="date" />
                 <YAxis />
                 <Tooltip />
                 <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
               </LineChart>
             </ResponsiveContainer>
           </Card>
 
           {/* AI Suggestions */}
           <Card className="p-6">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-primary" />
                 <h2 className="text-xl font-bold">اقتراحات AI</h2>
               </div>
               <div className="flex gap-2">
                 <Button
                   onClick={() => generateSuggestions("business")}
                   disabled={isGenerating}
                   variant="outline"
                   size="sm"
                 >
                   <Zap className="w-4 h-4 mr-2" />
                   بزنس
                 </Button>
                 <Button
                   onClick={() => generateSuggestions("copywriting")}
                   disabled={isGenerating}
                   variant="outline"
                   size="sm"
                 >
                   <Sparkles className="w-4 h-4 mr-2" />
                   كتابة
                 </Button>
                 <Button
                   onClick={() => generateSuggestions("design")}
                   disabled={isGenerating}
                   variant="outline"
                   size="sm"
                 >
                   <RefreshCw className="w-4 h-4 mr-2" />
                   تصميم
                 </Button>
               </div>
             </div>
 
             <div className="space-y-3">
               {suggestions.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <p>اضغط على أحد الأزرار أعلاه لإنشاء اقتراحات AI</p>
                 </div>
               ) : (
                 suggestions.map((suggestion) => (
                   <Card key={suggestion.id} className="p-4">
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           <h3 className="font-semibold">{suggestion.title}</h3>
                           <Badge variant={suggestion.priority === "high" ? "destructive" : "secondary"}>
                             {suggestion.priority}
                           </Badge>
                           <Badge variant="outline">{suggestion.suggestion_type}</Badge>
                         </div>
                         <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                       </div>
                     </div>
                   </Card>
                 ))
               )}
             </div>
           </Card>
         </div>
       </div>
     </div>
   );
 };
 
 export default Analytics;