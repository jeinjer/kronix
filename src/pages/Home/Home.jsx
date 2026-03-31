import React from "react";
import FloatingParticles from "../../components/Home/FloatingParticles";
import HeroSection from "../../components/Home/HeroSection";
import DemoSection from "../../components/Home/DemoSection";
import ClientExperienceSection from "../../components/Home/ClientExperienceSection";
import FeaturesSection from "../../components/Home/FeaturesSection";
import CTASection from "../../components/Home/CTASection";
import ClientHub from "../../components/Home/ClientHub";
import HomeLoader from "../../components/Loaders/HomeLoader";
import { useAuth } from "../../context/AuthContext";

const UltimateLanding = () => {
  const { session, isBusiness, isSuperAdmin, perfilLoading } = useAuth();
  
  if (perfilLoading) return <HomeLoader />;
  
  if (session && !isBusiness && !isSuperAdmin) {
    return <ClientHub />;
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-900 font-sans overflow-x-hidden selection:bg-cyan-500/30 scroll-smooth">
      <FloatingParticles />
      <HeroSection />
      <DemoSection />
      <ClientExperienceSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
};

export default UltimateLanding;
