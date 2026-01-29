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
import Integrations from "./pages/Integrations";
import NotFound from "./pages/NotFound";
import Storefront from "./pages/Storefront";
import ProductDetail from "./pages/ProductDetail";
import Analytics from "./pages/Analytics";
import Create from "./pages/Create";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/ai-chat" element={<AiChat />} />
      <Route path="/bots" element={<Bots />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/platforms" element={<Platforms />} />
      <Route path="/customize" element={<Customize />} />
     <Route path="/templates" element={<ResponseTemplates />} />
      <Route path="/storefront" element={<Storefront />} />
      <Route path="/product/:handle" element={<ProductDetail />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/create" element={<Create />} />
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
