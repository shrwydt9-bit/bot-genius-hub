import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PlatformGrid } from "@/components/PlatformGrid";
import { Navbar } from "@/components/Navbar";
import { HomeSolutions } from "@/components/HomeSolutions";
import { HomeEcommerce } from "@/components/HomeEcommerce";
import { HomeMore } from "@/components/HomeMore";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="solutions">
        <HomeSolutions />
      </div>
      <div id="ecommerce">
        <HomeEcommerce />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="platforms">
        <PlatformGrid />
      </div>
      <div id="more">
        <HomeMore />
      </div>
    </div>
  );
};

export default Index;
