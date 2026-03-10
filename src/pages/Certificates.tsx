import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Download, ChevronRight, BookOpen, FileText, Eye, Printer, Share2, MessageCircle, Facebook, Twitter, Copy, Check, Image, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import html2canvas from "html2canvas";

interface CertificateData {
  title: string;
  subject: string;
  submitted_at: string;
  student_name: string;
  type: "homework" | "exam" | "subject_completion" | "competition_winner";
  score?: string;
}

const Certificates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [viewCert, setViewCert] = useState<CertificateData | null>(null);
  const [shareMenuCert, setShareMenuCert] = useState<number | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const certRenderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("full_name, grade").eq("user_id", session.user.id).single();
      const studentName = profile?.full_name || "";

      const allCerts: CertificateData[] = [];

      // Homework certificates (score = 10)
      const { data: hwSubs } = await supabase
        .from("homework_submissions")
        .select("homework_id, submitted_at, score")
        .eq("user_id", session.user.id)
        .eq("score", 10);

      if (hwSubs && hwSubs.length > 0) {
        const hwIds = [...new Set(hwSubs.map(s => s.homework_id))];
        const { data: hws } = await supabase.from("homework").select("id, title, subject").in("id", hwIds);
        const hwMap = new Map((hws || []).map(h => [h.id, h]));
        hwSubs.forEach(s => {
          const hw = hwMap.get(s.homework_id);
          allCerts.push({
            title: hw?.title || "واجب",
            subject: hw?.subject || "",
            submitted_at: s.submitted_at,
            student_name: studentName,
            type: "homework",
            score: "10/10",
          });
        });
      }

      // Exam certificates (100% score)
      const { data: examAttempts } = await supabase
        .from("exam_attempts")
        .select("exam_id, submitted_at, score, total")
        .eq("user_id", session.user.id);

      if (examAttempts && examAttempts.length > 0) {
        const fullScoreAttempts = examAttempts.filter(a => a.score !== null && a.total !== null && a.total > 0 && a.score === a.total);
        if (fullScoreAttempts.length > 0) {
          const examIds = [...new Set(fullScoreAttempts.map(a => a.exam_id))];
          const { data: exams } = await supabase.from("exams").select("id, title, subject").in("id", examIds);
          const examMap = new Map((exams || []).map(e => [e.id, e]));
          fullScoreAttempts.forEach(a => {
            const exam = examMap.get(a.exam_id);
            allCerts.push({
              title: exam?.title || "امتحان",
              subject: exam?.subject || "",
              submitted_at: a.submitted_at,
              student_name: studentName,
              type: "exam",
              score: `${a.score}/${a.total}`,
            });
          });
        }
      }

      // Subject completion certificates (watched all videos in a subject)
      const grade = profile?.grade || "";
      if (grade) {
        const { data: allVideos } = await supabase
          .from("videos")
          .select("id, subject, created_at")
          .eq("grade", grade);

        const { data: viewedVideos } = await supabase
          .from("video_views")
          .select("video_id, viewed_at")
          .eq("user_id", session.user.id);

        if (allVideos && allVideos.length > 0 && viewedVideos) {
          const viewedSet = new Set(viewedVideos.map(v => v.video_id));
          // Get latest view date per video
          const viewDateMap = new Map<string, string>();
          viewedVideos.forEach(v => {
            const existing = viewDateMap.get(v.video_id);
            if (!existing || v.viewed_at > existing) viewDateMap.set(v.video_id, v.viewed_at);
          });

          // Group videos by subject
          const subjectVideos = new Map<string, string[]>();
          allVideos.forEach(v => {
            const list = subjectVideos.get(v.subject) || [];
            list.push(v.id);
            subjectVideos.set(v.subject, list);
          });

          // Check each subject
          subjectVideos.forEach((videoIds, subject) => {
            if (videoIds.length > 0 && videoIds.every(id => viewedSet.has(id))) {
              // Find the latest view date as completion date
              let latestDate = "";
              videoIds.forEach(id => {
                const d = viewDateMap.get(id);
                if (d && d > latestDate) latestDate = d;
              });

              allCerts.push({
                title: `إتمام جميع دروس ${subject}`,
                subject,
                submitted_at: latestDate || new Date().toISOString(),
                student_name: studentName,
                type: "subject_completion",
                score: `${videoIds.length}/${videoIds.length} درس`,
              });
            }
          });
        }
      }

      // Competition winner certificates
      const { data: wonCompetitions } = await supabase
        .from("weekly_competitions")
        .select("id, title, week_start, week_end, prize_description, created_at")
        .eq("winner_id", session.user.id)
        .eq("status", "completed");

      if (wonCompetitions && wonCompetitions.length > 0) {
        wonCompetitions.forEach(comp => {
          allCerts.push({
            title: comp.title,
            subject: comp.prize_description || "شهادة تقدير",
            submitted_at: comp.created_at,
            student_name: studentName,
            type: "competition_winner",
            score: `${new Date(comp.week_start).toLocaleDateString("ar-EG")} - ${new Date(comp.week_end).toLocaleDateString("ar-EG")}`,
          });
        });
      }

      allCerts.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setCertificates(allCerts);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const getShareText = (cert: CertificateData) => {
    if (cert.type === "competition_winner") {
      return `🥇 فزت في المسابقة الأسبوعية "${cert.title}"!\n🏆 الجائزة: ${cert.subject}\n\n📚 منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية\n🔗 ${window.location.origin}`;
    }
    const typeText = cert.type === "homework" ? "واجب" : cert.type === "exam" ? "امتحان" : "مادة";
    const achievementText = cert.type === "subject_completion"
      ? `🎓 أتممت جميع دروس مادة ${cert.subject} (${cert.score})`
      : `🏆 حصلت على الدرجة الكاملة (${cert.score}) في ${typeText} "${cert.title}" - مادة ${cert.subject}`;
    return `${achievementText}\n\n📚 منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية\n🔗 ${window.location.origin}`;
  };

  const shareWhatsApp = (cert: CertificateData) => {
    const text = encodeURIComponent(getShareText(cert));
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareMenuCert(null);
  };

  const shareFacebook = (cert: CertificateData) => {
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(getShareText(cert))}`, "_blank");
    setShareMenuCert(null);
  };

  const shareTwitter = (cert: CertificateData) => {
    const text = encodeURIComponent(getShareText(cert));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    setShareMenuCert(null);
  };

  const copyShareText = async (cert: CertificateData) => {
    try {
      await navigator.clipboard.writeText(getShareText(cert));
      setCopied(true);
      toast({ title: "تم النسخ ✅" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "فشل النسخ", variant: "destructive" });
    }
    setShareMenuCert(null);
  };

  const downloadAsImage = async (cert: CertificateData) => {
    setGeneratingImage(true);
    setShareMenuCert(null);

    // Render certificate in hidden div
    const container = certRenderRef.current;
    if (!container) { setGeneratingImage(false); return; }

    container.innerHTML = getCertInlineHtml(cert);
    container.style.display = "block";

    // Wait for fonts to load
    await new Promise(r => setTimeout(r, 500));

    try {
      const canvas = await html2canvas(container.querySelector(".certificate") as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        width: 800,
        height: 560,
      });

      container.style.display = "none";
      container.innerHTML = "";

      const link = document.createElement("a");
      link.download = `شهادة_${cert.title}_${cert.student_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({ title: "تم تحميل الشهادة كصورة ✅" });
    } catch {
      toast({ title: "فشل إنشاء الصورة", variant: "destructive" });
    }

    setGeneratingImage(false);
  };

  const getCertInlineHtml = (cert: CertificateData) => {
    if (cert.type === "competition_winner") return getCompetitionCertInlineHtml(cert);

    const achievementText = cert.type === "homework"
      ? `قد حصل/ت على الدرجة الكاملة <strong>(10/10)</strong> في واجب`
      : cert.type === "exam"
      ? `قد حصل/ت على الدرجة النهائية <strong>(${cert.score})</strong> في امتحان`
      : `قد أتم/ت جميع دروس مادة`;

    return `
      <div class="certificate" style="width:800px;height:560px;background:white;position:relative;overflow:hidden;border:3px solid #1a5c35;box-shadow:0 0 0 8px #d4a843,0 0 0 11px #1a5c35;font-family:'Amiri',serif;direction:rtl;">
        <div style="position:absolute;inset:20px;border:2px solid #d4a843;"></div>
        <div style="position:absolute;width:60px;height:60px;border:3px solid #d4a843;top:30px;left:30px;border-right:none;border-bottom:none;"></div>
        <div style="position:absolute;width:60px;height:60px;border:3px solid #d4a843;top:30px;right:30px;border-left:none;border-bottom:none;"></div>
        <div style="position:absolute;width:60px;height:60px;border:3px solid #d4a843;bottom:30px;left:30px;border-right:none;border-top:none;"></div>
        <div style="position:absolute;width:60px;height:60px;border:3px solid #d4a843;bottom:30px;right:30px;border-left:none;border-top:none;"></div>
        <div style="position:relative;z-index:1;padding:50px 60px;text-align:center;height:100%;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-size:40px;margin-bottom:10px;">${cert.type === "subject_completion" ? "🎓" : "🏆"}</div>
          <div style="font-size:32px;color:#1a5c35;font-weight:700;margin-bottom:5px;">${cert.type === "subject_completion" ? "شهادة إتمام مادة" : "شهادة تفوق ودرجة كاملة"}</div>
          <div style="font-size:14px;color:#666;margin-bottom:20px;">منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية</div>
          <div style="font-size:16px;color:#333;">يُشهد بأن الطالب/ة</div>
          <div style="font-size:28px;color:#d4a843;font-weight:700;margin:15px 0;padding:8px 40px;border-bottom:2px solid #d4a843;display:inline-block;">${cert.student_name}</div>
           <div style="font-size:14px;color:#333;margin:10px 0;line-height:1.8;">
             ${achievementText}
             <span style="font-weight:700;color:#1a5c35;">"${cert.type === "subject_completion" ? cert.subject : cert.title}"</span>
             ${cert.type !== "subject_completion" ? `- مادة ${cert.subject}` : `<br/><span style="font-size:12px;color:#666;">(${cert.score})</span>`}
           </div>
          <div style="font-size:12px;color:#888;margin-top:15px;">بتاريخ: ${new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
          <div style="font-size:16px;color:#1a5c35;margin-top:10px;font-weight:700;">الأستاذ إسماعيل أحمد عبادة</div>
        </div>
      </div>`;
  };

  const getCompetitionCertInlineHtml = (cert: CertificateData) => `
    <div class="certificate" style="width:800px;height:560px;background:linear-gradient(135deg,#1a0a00 0%,#2d1810 30%,#1a0a00 60%,#0d0500 100%);position:relative;overflow:hidden;border:4px solid #d4a843;box-shadow:0 0 0 6px #8B6914,0 0 0 10px #d4a843,0 0 40px rgba(212,168,67,0.3);font-family:'Amiri',serif;direction:rtl;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(212,168,67,0.08) 0%,transparent 70%);"></div>
      <div style="position:absolute;inset:18px;border:2px solid rgba(212,168,67,0.6);"></div>
      <div style="position:absolute;inset:22px;border:1px solid rgba(212,168,67,0.3);"></div>
      <div style="position:absolute;width:80px;height:80px;border:3px solid #d4a843;top:28px;left:28px;border-right:none;border-bottom:none;"></div>
      <div style="position:absolute;width:80px;height:80px;border:3px solid #d4a843;top:28px;right:28px;border-left:none;border-bottom:none;"></div>
      <div style="position:absolute;width:80px;height:80px;border:3px solid #d4a843;bottom:28px;left:28px;border-right:none;border-top:none;"></div>
      <div style="position:absolute;width:80px;height:80px;border:3px solid #d4a843;bottom:28px;right:28px;border-left:none;border-top:none;"></div>
      <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);width:200px;height:3px;background:linear-gradient(90deg,transparent,#d4a843,transparent);"></div>
      <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);width:200px;height:3px;background:linear-gradient(90deg,transparent,#d4a843,transparent);"></div>
      <div style="position:relative;z-index:1;padding:45px 55px;text-align:center;height:100%;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:50px;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(212,168,67,0.5));">🥇</div>
        <div style="font-size:34px;color:#d4a843;font-weight:700;margin-bottom:3px;text-shadow:0 0 20px rgba(212,168,67,0.3);">شهادة الفائز</div>
        <div style="font-size:18px;color:#d4a843;margin-bottom:5px;opacity:0.8;">✦ المسابقة الأسبوعية ✦</div>
        <div style="font-size:13px;color:rgba(212,168,67,0.6);margin-bottom:18px;">منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية</div>
        <div style="font-size:15px;color:rgba(255,255,255,0.8);">يُشهد بأن الطالب/ة</div>
        <div style="font-size:30px;color:#d4a843;font-weight:700;margin:12px 0;padding:10px 50px;border-bottom:2px solid rgba(212,168,67,0.6);display:inline-block;text-shadow:0 0 15px rgba(212,168,67,0.4);">${cert.student_name}</div>
        <div style="font-size:15px;color:rgba(255,255,255,0.85);margin:8px 0;line-height:1.8;">
          قد فاز/ت في مسابقة
          <span style="font-weight:700;color:#d4a843;">"${cert.title}"</span>
        </div>
        <div style="font-size:13px;color:rgba(212,168,67,0.7);margin-top:5px;">🏆 الجائزة: ${cert.subject}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:12px;">الفترة: ${cert.score}</div>
        <div style="font-size:16px;color:#d4a843;margin-top:8px;font-weight:700;">الأستاذ إسماعيل أحمد عبادة</div>
      </div>
    </div>`;
  };

  const getCertHtml = (cert: CertificateData, forPrint = false) => {
    if (cert.type === "competition_winner") return getCompetitionCertHtml(cert, forPrint);

    const achievementText = cert.type === "homework"
      ? `قد حصل/ت على الدرجة الكاملة <strong>(10/10)</strong> في واجب`
      : cert.type === "exam"
      ? `قد حصل/ت على الدرجة النهائية <strong>(${cert.score})</strong> في امتحان`
      : `قد أتم/ت جميع دروس مادة`;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>شهادة تفوق</title>
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: ${forPrint ? '#f5f0e8' : 'transparent'}; }
          .certificate { width: 800px; height: 560px; background: white; position: relative; overflow: hidden; border: 3px solid #1a5c35; box-shadow: 0 0 0 8px #d4a843, 0 0 0 11px #1a5c35; }
          .inner-border { position: absolute; inset: 20px; border: 2px solid #d4a843; }
          .corner { position: absolute; width: 60px; height: 60px; border: 3px solid #d4a843; }
          .corner-tl { top: 30px; left: 30px; border-right: none; border-bottom: none; }
          .corner-tr { top: 30px; right: 30px; border-left: none; border-bottom: none; }
          .corner-bl { bottom: 30px; left: 30px; border-right: none; border-top: none; }
          .corner-br { bottom: 30px; right: 30px; border-left: none; border-top: none; }
          .content { position: relative; z-index: 1; padding: 50px 60px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
          .badge { font-size: 40px; margin-bottom: 10px; }
          .title { font-family: 'Amiri', serif; font-size: 32px; color: #1a5c35; font-weight: 700; margin-bottom: 5px; }
          .subtitle { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 14px; color: #666; margin-bottom: 20px; }
          .name { font-family: 'Amiri', serif; font-size: 28px; color: #d4a843; font-weight: 700; margin: 15px 0; padding: 8px 40px; border-bottom: 2px solid #d4a843; display: inline-block; }
          .reason { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 14px; color: #333; margin: 10px 0; line-height: 1.8; }
          .hw-name { font-weight: 700; color: #1a5c35; }
          .date { font-family: 'Noto Kufi Arabic', sans-serif; font-size: 12px; color: #888; margin-top: 15px; }
          .footer { font-family: 'Amiri', serif; font-size: 16px; color: #1a5c35; margin-top: 10px; font-weight: 700; }
          @media print { body { background: white; } .certificate { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="inner-border"></div>
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div class="content">
            <div class="badge">${cert.type === "subject_completion" ? "🎓" : "🏆"}</div>
            <div class="title">${cert.type === "subject_completion" ? "شهادة إتمام مادة" : "شهادة تفوق ودرجة كاملة"}</div>
            <div class="subtitle">منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية</div>
            <div>يُشهد بأن الطالب/ة</div>
            <div class="name">${cert.student_name}</div>
            <div class="reason">
              ${achievementText}
              <span class="hw-name">"${cert.type === "subject_completion" ? cert.subject : cert.title}"</span>
              ${cert.type !== "subject_completion" ? `- مادة ${cert.subject}` : `<br/><span style="font-size:12px;color:#666;">(${cert.score})</span>`}
            </div>
            <div class="date">بتاريخ: ${new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div class="footer">الأستاذ إسماعيل أحمد عبادة</div>
          </div>
        </div>
        ${forPrint ? '<script>window.onload = () => window.print();</script>' : ''}
      </body>
      </html>`;
  };

  const getCompetitionCertHtml = (cert: CertificateData, forPrint = false) => `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>شهادة الفائز - المسابقة الأسبوعية</title>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: ${forPrint ? '#0d0500' : 'transparent'}; }
        .certificate { width: 800px; height: 560px; background: linear-gradient(135deg,#1a0a00 0%,#2d1810 30%,#1a0a00 60%,#0d0500 100%); position: relative; overflow: hidden; border: 4px solid #d4a843; box-shadow: 0 0 0 6px #8B6914, 0 0 0 10px #d4a843, 0 0 40px rgba(212,168,67,0.3); }
        .glow { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(212,168,67,0.08) 0%, transparent 70%); }
        .inner-border { position: absolute; inset: 18px; border: 2px solid rgba(212,168,67,0.6); }
        .inner-border-2 { position: absolute; inset: 22px; border: 1px solid rgba(212,168,67,0.3); }
        .corner { position: absolute; width: 80px; height: 80px; border: 3px solid #d4a843; }
        .corner-tl { top: 28px; left: 28px; border-right: none; border-bottom: none; }
        .corner-tr { top: 28px; right: 28px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 28px; left: 28px; border-right: none; border-top: none; }
        .corner-br { bottom: 28px; right: 28px; border-left: none; border-top: none; }
        .line-top { position: absolute; top: 28px; left: 50%; transform: translateX(-50%); width: 200px; height: 3px; background: linear-gradient(90deg,transparent,#d4a843,transparent); }
        .line-bottom { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); width: 200px; height: 3px; background: linear-gradient(90deg,transparent,#d4a843,transparent); }
        .content { position: relative; z-index: 1; padding: 45px 55px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; font-family: 'Amiri', serif; }
        @media print { body { background: #0d0500; } .certificate { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="glow"></div>
        <div class="inner-border"></div>
        <div class="inner-border-2"></div>
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
        <div class="line-top"></div>
        <div class="line-bottom"></div>
        <div class="content">
          <div style="font-size:50px;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(212,168,67,0.5));">🥇</div>
          <div style="font-size:34px;color:#d4a843;font-weight:700;margin-bottom:3px;text-shadow:0 0 20px rgba(212,168,67,0.3);">شهادة الفائز</div>
          <div style="font-size:18px;color:#d4a843;margin-bottom:5px;opacity:0.8;">✦ المسابقة الأسبوعية ✦</div>
          <div style="font-family:'Noto Kufi Arabic',sans-serif;font-size:13px;color:rgba(212,168,67,0.6);margin-bottom:18px;">منصة الأستاذ إسماعيل أحمد عبادة للعلوم الشرعية</div>
          <div style="font-size:15px;color:rgba(255,255,255,0.8);">يُشهد بأن الطالب/ة</div>
          <div style="font-size:30px;color:#d4a843;font-weight:700;margin:12px 0;padding:10px 50px;border-bottom:2px solid rgba(212,168,67,0.6);display:inline-block;text-shadow:0 0 15px rgba(212,168,67,0.4);">${cert.student_name}</div>
          <div style="font-family:'Noto Kufi Arabic',sans-serif;font-size:15px;color:rgba(255,255,255,0.85);margin:8px 0;line-height:1.8;">
            قد فاز/ت في مسابقة
            <span style="font-weight:700;color:#d4a843;">"${cert.title}"</span>
          </div>
          <div style="font-family:'Noto Kufi Arabic',sans-serif;font-size:13px;color:rgba(212,168,67,0.7);margin-top:5px;">🏆 الجائزة: ${cert.subject}</div>
          <div style="font-family:'Noto Kufi Arabic',sans-serif;font-size:11px;color:rgba(255,255,255,0.4);margin-top:12px;">الفترة: ${cert.score}</div>
          <div style="font-size:16px;color:#d4a843;margin-top:8px;font-weight:700;">الأستاذ إسماعيل أحمد عبادة</div>
        </div>
      </div>
      ${forPrint ? '<script>window.onload = () => window.print();</script>' : ''}
    </body>
    </html>`;

  const openCertWindow = (cert: CertificateData, autoPrint: boolean) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(getCertHtml(cert, autoPrint));
    w.document.close();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hidden render container for html2canvas */}
      <div ref={certRenderRef} style={{ position: "fixed", top: "-9999px", left: "-9999px", display: "none", direction: "rtl" }} />

      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Award className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">شهاداتي</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-amiri mb-2">شهادات التفوق 🏆</h1>
          <p className="text-sm text-muted-foreground">شاركها مع أصدقائك وأهلك على السوشيال ميديا!</p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">لم تحصل على شهادات بعد</h3>
            <p className="text-sm text-muted-foreground">احصل على الدرجة الكاملة في أي واجب (10/10) أو امتحان (الدرجة النهائية) أو أكمل جميع دروس مادة لتحصل على شهادة!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    cert.type === "exam" ? "bg-primary/10" : cert.type === "subject_completion" ? "bg-green-500/10" : "bg-accent/50"
                  }`}>
                    {cert.type === "exam" 
                      ? <FileText className="w-6 h-6 text-primary" />
                      : cert.type === "subject_completion"
                      ? <BookOpen className="w-6 h-6 text-green-600" />
                      : <Award className="w-6 h-6 text-accent-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate">{cert.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        cert.type === "exam" ? "bg-primary/10 text-primary" : cert.type === "subject_completion" ? "bg-green-500/10 text-green-700" : "bg-accent/50 text-accent-foreground"
                      }`}>
                        {cert.type === "exam" ? "امتحان" : cert.type === "subject_completion" ? "إتمام مادة" : "واجب"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{cert.subject} • {cert.score}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cert.submitted_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border flex-wrap">
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => setViewCert(cert)}>
                    <Eye className="w-3 h-3" /> عرض
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => openCertWindow(cert, true)}>
                    <Printer className="w-3 h-3" /> طباعة
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => downloadAsImage(cert)} disabled={generatingImage}>
                    <Image className="w-3 h-3" /> {generatingImage ? "جاري..." : "حفظ صورة"}
                  </Button>

                  {/* Share dropdown */}
                  <div className="relative mr-auto">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs gap-1"
                      onClick={() => setShareMenuCert(shareMenuCert === i ? null : i)}
                    >
                      <Share2 className="w-3 h-3" /> شارك
                    </Button>

                    {shareMenuCert === i && (
                      <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg p-1.5 z-50 min-w-[160px]">
                        <button
                          onClick={() => shareWhatsApp(cert)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" /> واتساب
                        </button>
                        <button
                          onClick={() => shareFacebook(cert)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          <Facebook className="w-4 h-4 text-blue-600" /> فيسبوك
                        </button>
                        <button
                          onClick={() => shareTwitter(cert)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          <Twitter className="w-4 h-4 text-sky-500" /> تويتر
                        </button>
                        <button
                          onClick={() => copyShareText(cert)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copied ? "تم النسخ!" : "نسخ النص"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Certificate Dialog */}
        <Dialog open={!!viewCert} onOpenChange={(o) => !o && setViewCert(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[850px] p-2 sm:p-4">
            <DialogHeader>
              <DialogTitle className="text-center font-amiri">شهادة تفوق</DialogTitle>
            </DialogHeader>
            {viewCert && (
              <div className="overflow-auto">
                <iframe
                  srcDoc={getCertHtml(viewCert, false)}
                  className="w-full border-0 rounded-lg"
                  style={{ height: '620px', minWidth: '320px' }}
                  title="شهادة تفوق"
                />
                <div className="flex justify-center gap-2 mt-3 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openCertWindow(viewCert, true)}>
                    <Printer className="w-3 h-3" /> طباعة
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadAsImage(viewCert)} disabled={generatingImage}>
                    <Image className="w-3 h-3" /> {generatingImage ? "جاري..." : "حفظ كصورة"}
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => shareWhatsApp(viewCert)}>
                    <MessageCircle className="w-3 h-3" /> شارك واتساب
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => shareFacebook(viewCert)}>
                    <Facebook className="w-3 h-3" /> فيسبوك
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Loading overlay for image generation */}
      {generatingImage && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-medium">جاري إنشاء الصورة...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
