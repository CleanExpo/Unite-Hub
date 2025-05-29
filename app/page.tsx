import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import PricingPlans from "@/components/PricingPlans";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-agi-dark text-white">
      <Header />
      <Hero />
      <Features />
      <Testimonials />
      <PricingPlans />
      <Newsletter />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
