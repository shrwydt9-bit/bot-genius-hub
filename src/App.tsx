import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Platforms from "./pages/Platforms";
import Customize from "./pages/Customize";
 import ResponseTemplates from "./pages/ResponseTemplates";
import Auth from "./pages/Auth";
import AiChat from "./pages/AiChat";
import Bots from "./pages/Bots";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/ai-chat" element={<AiChat />} />
      <Route path="/bots" element={<Bots />} />
      <Route path="/platforms" element={<Platforms />} />
      <Route path="/customize" element={<Customize />} />
     <Route path="/templates" element={<ResponseTemplates />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
