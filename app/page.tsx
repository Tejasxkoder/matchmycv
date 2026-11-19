import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { FeatureGrid } from "@/components/feature-grid";
import { CtaSection } from "@/components/cta-section";
import { PipelineBanner } from "@/components/pipeline-banner";
import { FeatureTabs, StageTabs } from "@/components/preview-tabs";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <PipelineBanner />
      <FeatureTabs />
      <FeatureGrid />
      <StageTabs />
      <CtaSection />
    </main>
  );
}
