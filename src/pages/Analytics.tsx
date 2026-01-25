 import { useState, useEffect, useCallback } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { Navbar } from "@/components/Navbar";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { ArrowLeft, TrendingUp, MessageSquare, Users, Zap, Sparkles, Clock, ThumbsUp, AlertCircle, Loader2, BarChart3 } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
 import { motion, AnimatePresence } from "framer-motion";
 
 const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
 
 const Analytics = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const botId = searchParams.get("bot");
   const { toast } = useToast();
 
   const [bot, setBot] = useState<any>(null);
   const [analytics, setAnalytics] = useState<any[]>([]);
   const [insights, setInsights] = useState<any[]>([]);
   const [sessions, setSessions] = useState<any[]>([]);
   const [messages, setMessages] = useState<any[]>([]);
   const [isGenerating, setIsGenerating] = useState(false);
   const [activeAnalysisType, setActiveAnalysisType] = useState<string | null>(null);
   const [analysisResults, setAnalysisResults] = useState<any>(null);
 
   useEffect(() => {
     if (botId) {
       fetchData();
     }
   }, [botId]);
 
   const fetchData = useCallback(async () => {
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
 
     // Fetch insights
     const { data: insightsData } = await supabase
       .from("conversation_insights")
       .select("*")
       .eq("bot_id", botId)
       .order("created_at", { ascending: false });
     setInsights(insightsData || []);
 
     // Fetch sessions
     const { data: sessionsData } = await supabase
       .from("conversation_sessions")
       .select("*")
       .eq("bot_id", botId)
       .order("started_at", { ascending: false })
       .limit(50);
     setSessions(sessionsData || []);
 
     // Fetch messages
     const { data: messagesData } = await supabase
       .from("conversation_messages")
       .select("*")
       .eq("bot_id", botId)
       .order("created_at", { ascending: false })
       .limit(200);
     setMessages(messagesData || []);
   }, [botId]);
 
   const runAnalysis = async (type: string) => {
     setIsGenerating(true);
     setActiveAnalysisType(type);
     try {
       const { data, error } = await supabase.functions.invoke("conversation-analytics", {
         body: { botId, analysisType: type },
       });
 
       if (error) throw error;
 
       setAnalysisResults(data.insights);
       toast({
         title: "✨ Analysis complete!",
         description: "Insights generated successfully",
       });
 
       fetchData();
     } catch (error) {
       console.error(error);
       toast({
         variant: "destructive",
         title: "Analysis failed",
         description: "Please try again",
       });
     } finally {
       setIsGenerating(false);
       setActiveAnalysisType(null);
     }
   };
 
   // Calculate metrics
   const totalMessages = messages.length;
   const totalSessions = sessions.length;
   const avgSessionDuration = sessions.length > 0
     ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length)
     : 0;
   const avgMessagesPerSession = sessions.length > 0
     ? (messages.length / sessions.length).toFixed(1)
     : 0;
 
   // Sentiment breakdown
   const sentimentData = insights
     .filter(i => i.insight_type === 'sentiment')
     .map(i => i.data?.breakdown || {})
     .reduce((acc, curr) => ({
       positive: (acc.positive || 0) + (curr.positive || 0),
       neutral: (acc.neutral || 0) + (curr.neutral || 0),
       negative: (acc.negative || 0) + (curr.negative || 0),
     }), { positive: 0, neutral: 0, negative: 0 });
 
   const sentimentChartData = [
     { name: 'Positive', value: sentimentData.positive },
     { name: 'Neutral', value: sentimentData.neutral },
     { name: 'Negative', value: sentimentData.negative },
   ].filter(d => d.value > 0);
 
   // FAQ insights
   const faqInsights = insights.filter(i => i.insight_type === 'faq').slice(0, 10);
 
   // Improvement insights
   const improvementInsights = insights.filter(i => i.insight_type === 'improvement').slice(0, 10);
 
   if (!bot) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="pt-20 flex items-center justify-center">
           <p className="text-muted-foreground">Loading...</p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <div className="pt-20 pb-16 px-4">
         <div className="container max-w-7xl">
           <div className="flex items-center gap-4 mb-6">
             <Button variant="ghost" size="icon" onClick={() => navigate("/platforms")}>
               <ArrowLeft className="w-5 h-5" />
             </Button>
             <div className="flex-1">
               <h1 className="text-4xl font-bold text-gradient">Conversation Analytics</h1>
               <p className="text-muted-foreground">AI-powered insights for {bot.name}</p>
             </div>
           </div>
 
           {/* Metrics Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <Card className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <MessageSquare className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Total Messages</p>
                     <p className="text-2xl font-bold">{totalMessages}</p>
                   </div>
                 </div>
               </Card>
             </motion.div>
 
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
               <Card className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <Users className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Sessions</p>
                     <p className="text-2xl font-bold">{totalSessions}</p>
                   </div>
                 </div>
               </Card>
             </motion.div>
 
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
               <Card className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <Clock className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Avg Duration</p>
                     <p className="text-2xl font-bold">{avgSessionDuration}s</p>
                   </div>
                 </div>
               </Card>
             </motion.div>
 
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
               <Card className="p-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <BarChart3 className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Avg Msg/Session</p>
                     <p className="text-2xl font-bold">{avgMessagesPerSession}</p>
                   </div>
                 </div>
               </Card>
             </motion.div>
           </div>
 
           {/* Analysis Actions */}
           <Card className="p-6 mb-6">
             <CardHeader className="px-0 pt-0">
               <CardTitle className="flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-primary" />
                 AI-Powered Analysis
               </CardTitle>
               <CardDescription>
                 Generate intelligent insights from conversation data
               </CardDescription>
             </CardHeader>
             <CardContent className="px-0 pb-0">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <Button
                   onClick={() => runAnalysis("faq")}
                   disabled={isGenerating}
                   variant="outline"
                   className="h-auto py-4 flex-col gap-2"
                 >
                   {activeAnalysisType === "faq" ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <MessageSquare className="w-5 h-5" />
                   )}
                   <span className="text-sm font-semibold">Common Questions</span>
                 </Button>
                 
                 <Button
                   onClick={() => runAnalysis("improvement")}
                   disabled={isGenerating}
                   variant="outline"
                   className="h-auto py-4 flex-col gap-2"
                 >
                   {activeAnalysisType === "improvement" ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <TrendingUp className="w-5 h-5" />
                   )}
                   <span className="text-sm font-semibold">Improvements</span>
                 </Button>
                 
                 <Button
                   onClick={() => runAnalysis("sentiment")}
                   disabled={isGenerating}
                   variant="outline"
                   className="h-auto py-4 flex-col gap-2"
                 >
                   {activeAnalysisType === "sentiment" ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <ThumbsUp className="w-5 h-5" />
                   )}
                   <span className="text-sm font-semibold">Sentiment</span>
                 </Button>
                 
                 <Button
                   onClick={() => runAnalysis("performance")}
                   disabled={isGenerating}
                   variant="outline"
                   className="h-auto py-4 flex-col gap-2"
                 >
                   {activeAnalysisType === "performance" ? (
                     <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                     <Zap className="w-5 h-5" />
                   )}
                   <span className="text-sm font-semibold">Performance</span>
                 </Button>
               </div>
             </CardContent>
           </Card>
 
           {/* Tabs for different insights */}
           <Tabs defaultValue="faqs" className="space-y-6">
             <TabsList className="grid w-full grid-cols-4">
               <TabsTrigger value="faqs">Common Questions ({faqInsights.length})</TabsTrigger>
               <TabsTrigger value="improvements">Improvements ({improvementInsights.length})</TabsTrigger>
               <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
               <TabsTrigger value="performance">Performance</TabsTrigger>
             </TabsList>
 
             <TabsContent value="faqs">
               <Card>
                 <CardHeader>
                   <CardTitle>Frequently Asked Questions</CardTitle>
                   <CardDescription>Most common user questions and suggested answers</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {faqInsights.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p>No FAQ insights yet. Click "Common Questions" above to analyze.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {faqInsights.map((insight, idx) => (
                         <motion.div
                           key={insight.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.05 }}
                         >
                           <Card className="p-4">
                             <div className="flex items-start justify-between mb-2">
                               <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                   <Badge variant="outline">
                                     {insight.data?.category || 'general'}
                                   </Badge>
                                   <Badge variant="secondary">
                                     Frequency: {insight.frequency}
                                   </Badge>
                                   <Badge variant={
                                     insight.priority === 'high' ? 'destructive' : 
                                     insight.priority === 'medium' ? 'default' : 'secondary'
                                   }>
                                     {insight.priority}
                                   </Badge>
                                 </div>
                                 <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                                 <p className="text-sm text-muted-foreground">{insight.description}</p>
                               </div>
                             </div>
                           </Card>
                         </motion.div>
                       ))}
                     </div>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>
 
             <TabsContent value="improvements">
               <Card>
                 <CardHeader>
                   <CardTitle>Improvement Opportunities</CardTitle>
                   <CardDescription>AI-identified areas for bot optimization</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {improvementInsights.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p>No improvement insights yet. Click "Improvements" above to analyze.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {improvementInsights.map((insight, idx) => (
                         <motion.div
                           key={insight.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.05 }}
                         >
                           <Card className="p-4">
                             <div className="flex items-start gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                 insight.priority === 'high' ? 'bg-destructive/10' :
                                 insight.priority === 'medium' ? 'bg-primary/10' : 'bg-muted'
                               }`}>
                                 <AlertCircle className={`w-5 h-5 ${
                                   insight.priority === 'high' ? 'text-destructive' :
                                   insight.priority === 'medium' ? 'text-primary' : 'text-muted-foreground'
                                 }`} />
                               </div>
                               <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                   <h3 className="font-semibold">{insight.title}</h3>
                                   <Badge variant={
                                     insight.priority === 'high' ? 'destructive' : 
                                     insight.priority === 'medium' ? 'default' : 'secondary'
                                   }>
                                     {insight.priority}
                                   </Badge>
                                 </div>
                                 <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                                 {insight.data?.impact && (
                                   <p className="text-xs text-primary">💡 Impact: {insight.data.impact}</p>
                                 )}
                               </div>
                             </div>
                           </Card>
                         </motion.div>
                       ))}
                     </div>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>
 
             <TabsContent value="sentiment">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                   <CardHeader>
                     <CardTitle>Sentiment Distribution</CardTitle>
                     <CardDescription>User sentiment across conversations</CardDescription>
                   </CardHeader>
                   <CardContent>
                     {sentimentChartData.length > 0 ? (
                       <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                           <Pie
                             data={sentimentChartData}
                             cx="50%"
                             cy="50%"
                             labelLine={false}
                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                             outerRadius={100}
                             fill="#8884d8"
                             dataKey="value"
                           >
                             {sentimentChartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip />
                         </PieChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                         <div className="text-center">
                           <ThumbsUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                           <p>No sentiment data. Run sentiment analysis to see results.</p>
                         </div>
                       </div>
                     )}
                   </CardContent>
                 </Card>
 
                 <Card>
                   <CardHeader>
                     <CardTitle>Sentiment Insights</CardTitle>
                     <CardDescription>Key findings from sentiment analysis</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       {analysisResults?.themes?.map((theme: any, idx: number) => (
                         <div key={idx} className="border-l-4 pl-4" style={{
                           borderColor: theme.sentiment === 'positive' ? 'hsl(var(--primary))' :
                                       theme.sentiment === 'negative' ? 'hsl(var(--destructive))' :
                                       'hsl(var(--muted))'
                         }}>
                           <h4 className="font-semibold mb-1">{theme.theme}</h4>
                           <Badge variant={
                             theme.sentiment === 'positive' ? 'default' :
                             theme.sentiment === 'negative' ? 'destructive' : 'secondary'
                           } className="mb-2">
                             {theme.sentiment}
                           </Badge>
                           <p className="text-sm text-muted-foreground">{theme.examples?.join(', ')}</p>
                         </div>
                       )) || (
                         <p className="text-center text-muted-foreground py-8">
                           Run sentiment analysis to see detailed insights
                         </p>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </TabsContent>
 
             <TabsContent value="performance">
               <Card>
                 <CardHeader>
                   <CardTitle>Performance Metrics</CardTitle>
                   <CardDescription>Bot efficiency and effectiveness scores</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {analysisResults?.metrics ? (
                     <div className="space-y-6">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {Object.entries(analysisResults.metrics).map(([key, value]: [string, any]) => (
                           <Card key={key} className="p-4">
                             <p className="text-sm text-muted-foreground capitalize">
                               {key.replace(/([A-Z])/g, ' $1').trim()}
                             </p>
                             <p className="text-3xl font-bold text-primary">{value}</p>
                           </Card>
                         ))}
                       </div>
                       
                       <div className="space-y-3">
                         <h3 className="font-semibold text-lg">Performance Insights</h3>
                         {analysisResults.insights?.map((insight: any, idx: number) => (
                           <Card key={idx} className="p-4">
                             <div className="flex items-start gap-3">
                               <Badge variant="outline">{insight.trend}</Badge>
                               <div className="flex-1">
                                 <h4 className="font-semibold mb-1">{insight.metric}</h4>
                                 <p className="text-sm text-muted-foreground mb-2">{insight.insight}</p>
                                 <p className="text-sm text-primary">→ {insight.action}</p>
                               </div>
                               <div className="text-2xl font-bold">{insight.score}</div>
                             </div>
                           </Card>
                         ))}
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-8 text-muted-foreground">
                       <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p>No performance data. Click "Performance" above to analyze.</p>
                     </div>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>
           </Tabs>
         </div>
       </div>
     </div>
   );
 };
 
 export default Analytics;