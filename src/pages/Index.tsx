import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SubjectsSection from "@/components/SubjectsSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import ParentSection from "@/components/ParentSection";
import Footer from "@/components/Footer";
import { InstallPWABanner } from "@/components/InstallPWA";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "EducationalOrganization",
          "@id": "https://mr-esmail-ebada.lovable.app/#organization",
          "name": "منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية",
          "alternateName": [
            "منصة مستر إسماعيل أحمد عبادة",
            "موقع الأستاذ إسماعيل أحمد عبادة",
            "Mr Ismail Ahmed Ebada Platform",
            "Ismail Ahmed Ebada Islamic Studies"
          ],
          "url": "https://mr-esmail-ebada.lovable.app",
          "description": "منصة تعليمية متخصصة في العلوم الشرعية تقدم دروس الفقه والحديث والتفسير وأصول الدين.",
          "foundingDate": "2025",
          "areaServed": { "@type": "Country", "name": "Egypt" },
          "inLanguage": ["ar", "en"],
          "sameAs": [],
          "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "availableLanguage": ["Arabic", "English"] }
        },
        {
          "@type": "WebSite",
          "@id": "https://mr-esmail-ebada.lovable.app/#website",
          "url": "https://mr-esmail-ebada.lovable.app",
          "name": "منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية",
          "publisher": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "inLanguage": "ar",
          "potentialAction": { "@type": "SearchAction", "target": "https://mr-esmail-ebada.lovable.app/dashboard?q={search_term_string}", "query-input": "required name=search_term_string" }
        },
        {
          "@type": "WebPage",
          "@id": "https://mr-esmail-ebada.lovable.app/#webpage",
          "url": "https://mr-esmail-ebada.lovable.app",
          "name": "منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية | تعليم الفقه والحديث والتفسير",
          "isPartOf": { "@id": "https://mr-esmail-ebada.lovable.app/#website" },
          "about": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "description": "منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية - تعليم الفقه الشافعي والمالكي والحنفي، الحديث، التفسير، أصول الدين.",
          "inLanguage": "ar"
        },
        {
          "@type": "Person",
          "@id": "https://mr-esmail-ebada.lovable.app/#person",
          "name": "إسماعيل أحمد عبادة",
          "alternateName": ["مستر إسماعيل أحمد عبادة", "الأستاذ إسماعيل أحمد عبادة", "Mr Ismail Ahmed Ebada", "Ismail Ahmed Ebada"],
          "jobTitle": "معلم العلوم الشرعية",
          "worksFor": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" }
        }
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    script.id = "json-ld-structured-data";
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("json-ld-structured-data");
      if (el) el.remove();
    };
  }, [checking]);

  if (checking) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SubjectsSection />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <InstallPWABanner />
    </div>
  );
};

export default Index;
