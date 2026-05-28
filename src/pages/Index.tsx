import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ScrollToTop from "@/components/ScrollToTop";

// Lazy load below-fold sections
const AboutSection = lazy(() => import("@/components/AboutSection"));
const SubjectsSection = lazy(() => import("@/components/SubjectsSection"));
const SEOCurriculumSection = lazy(() => import("@/components/SEOCurriculumSection"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const SEOMethodSection = lazy(() => import("@/components/SEOMethodSection"));
const WhyUsSection = lazy(() => import("@/components/WhyUsSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const ParentSection = lazy(() => import("@/components/ParentSection"));
const Footer = lazy(() => import("@/components/Footer"));
const InstallPWABanner = lazy(() => import("@/components/InstallPWA").then(m => ({ default: m.InstallPWABanner })));


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
            "منصه الاستاذ اسماعيل احمد عباده",
            "Mr Ismail Ahmed Ebada Platform",
            "Ismail Ahmed Ebada Islamic Studies"
          ],
          "url": "https://mr-esmail-ebada.lovable.app",
          "description": "منصة تعليمية متخصصة في العلوم الشرعية لطلاب الأزهر الشريف. تقدم شرح الفقه بمذاهبه الثلاثة والتوحيد والتفسير والحديث والسيرة النبوية مع امتحانات إلكترونية وواجبات تفاعلية ومسابقات أسبوعية.",
          "foundingDate": "2025",
          "areaServed": { "@type": "Country", "name": "Egypt" },
          "inLanguage": ["ar", "en"],
          "knowsAbout": [
            "الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي",
            "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية",
            "المنهج الأزهري", "العلوم الشرعية"
          ],
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
          "name": "منصة الأستاذ إسماعيل أحمد عبادة | تعليم العلوم الشرعية لطلاب الأزهر الشريف",
          "isPartOf": { "@id": "https://mr-esmail-ebada.lovable.app/#website" },
          "about": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "description": "منصة الأستاذ إسماعيل أحمد عبادة - أفضل منصة لتعليم العلوم الشرعية لطلاب الأزهر. شرح الفقه الشافعي والمالكي والحنفي، التوحيد، التفسير، الحديث الشريف، والسيرة النبوية. فيديوهات تعليمية وامتحانات إلكترونية وواجبات ومسابقات أسبوعية بجوائز. مؤلف سلسلة المرشد الأزهري.",
          "inLanguage": "ar"
        },
        {
          "@type": "Person",
          "@id": "https://mr-esmail-ebada.lovable.app/#person",
          "name": "إسماعيل أحمد عبادة",
          "alternateName": ["مستر إسماعيل أحمد عبادة", "الأستاذ إسماعيل أحمد عبادة", "Mr Ismail Ahmed Ebada", "Ismail Ahmed Ebada"],
          "jobTitle": "معلم العلوم الشرعية ومؤلف سلسلة المرشد الأزهري",
          "worksFor": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "knowsAbout": ["الفقه الإسلامي", "التوحيد", "التفسير", "الحديث الشريف", "السيرة النبوية", "المنهج الأزهري"]
        },
        {
          "@type": "Course",
          "name": "دورة العلوم الشرعية للمرحلة الإعدادية الأزهرية",
          "description": "شرح شامل لمواد الفقه والتوحيد والتفسير والحديث الشريف والسيرة النبوية للصفوف الإعدادية بالأزهر الشريف",
          "provider": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "educationalLevel": "المرحلة الإعدادية الأزهرية",
          "inLanguage": "ar",
          "isAccessibleForFree": false,
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "courseWorkload": "PT6H/week"
          }
        },
        {
          "@type": "Course",
          "name": "دورة العلوم الشرعية للمرحلة الثانوية الأزهرية",
          "description": "شرح شامل لمواد الفقه والتوحيد والتفسير والحديث الشريف للصفوف الثانوية بالأزهر الشريف",
          "provider": { "@id": "https://mr-esmail-ebada.lovable.app/#organization" },
          "educationalLevel": "المرحلة الثانوية الأزهرية",
          "inLanguage": "ar",
          "isAccessibleForFree": false,
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "courseWorkload": "PT6H/week"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://mr-esmail-ebada.lovable.app/#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "ما هي المواد التي يتم تدريسها على منصة الأستاذ إسماعيل أحمد عبادة؟",
              "acceptedAnswer": { "@type": "Answer", "text": "يتم تدريس الفقه الإسلامي بمذاهبه الثلاثة (الشافعي والمالكي والحنفي)، والتوحيد، وتفسير القرآن الكريم، والحديث النبوي الشريف، والسيرة النبوية (للمرحلة الإعدادية). جميع المواد مطابقة للمنهج الأزهري المقرر." }
            },
            {
              "@type": "Question",
              "name": "ما هي المراحل الدراسية المتاحة على المنصة؟",
              "acceptedAnswer": { "@type": "Answer", "text": "المنصة تخدم طلاب الأزهر الشريف من الصف الأول الإعدادي حتى الصف الثالث الثانوي (6 صفوف دراسية)." }
            },
            {
              "@type": "Question",
              "name": "هل المنصة مجانية؟",
              "acceptedAnswer": { "@type": "Answer", "text": "يمكن التسجيل مجاناً ومشاهدة بعض المحتوى. الاشتراك الكامل يبدأ من 150 جنيه للمرحلة الإعدادية و200 جنيه للمرحلة الثانوية شهرياً." }
            },
            {
              "@type": "Question",
              "name": "من هو الأستاذ إسماعيل أحمد عبادة؟",
              "acceptedAnswer": { "@type": "Answer", "text": "الأستاذ إسماعيل أحمد عبادة هو معلم العلوم الشرعية ومؤلف سلسلة المرشد الأزهري، يقدم شرحاً مبسطاً وشاملاً لمواد العلوم الشرعية لطلاب الأزهر الشريف." }
            }
          ]
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
      <Suspense fallback={<div className="min-h-[200px]" />}>
        <AboutSection />
        <StatsSection />
        <FeaturesSection />
        <SEOMethodSection />
        <WhyUsSection />
        <TestimonialsSection />
        <FAQSection />
        <ParentSection />
        <CTASection />
        <Footer />
        <InstallPWABanner />
      </Suspense>
      <ScrollToTop />
    </div>
  );
};

export default Index;
