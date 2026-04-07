import { CallToAction } from "@/components/home/call-to-action";
import { FeatureGrid } from "@/components/home/feature-grid";
import { HeroSection } from "@/components/home/hero-section";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
      <HeroSection />
      <FeatureGrid />
      <CallToAction />
    </main>
  );
}
