import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { PlatformGrid } from "@/components/PlatformGrid";
import { PageShell } from "@/components/layout/PageShell";
import { HomeSolutions } from "@/components/HomeSolutions";
import { HomeEcommerce } from "@/components/HomeEcommerce";
import { HomeMore } from "@/components/HomeMore";

const Index = () => {
  return (
    <PageShell containerClassName="">
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
    </PageShell>
  );
};

export default Index;
