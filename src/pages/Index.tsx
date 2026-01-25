import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PlatformGrid } from "@/components/PlatformGrid";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <div id="platforms">
        <PlatformGrid />
      </div>
    </div>
  );
};

export default Index;
