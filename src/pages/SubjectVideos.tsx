import { useEffect, useState, useCallback, useRef } from "react";
import { AchievementBadges } from "@/components/AchievementBadges";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, BookOpen, Search, Send, Trash2, MessageCircle, Lock, Play, CheckCircle2, ClipboardList, X, Eye, Target } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";

import { StaggerContainer, StaggerItem } from "@/components/StaggerAnimation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  grade: string;
  subject: string;
  access_type: string;
  created_at: string;
  madhab: string | null;
}

interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

const SubjectVideos = () => {
  const { subject } = useParams();
  const [searchParams] = useSearchParams();
  const grade = searchParams.get("grade") || "";
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unwatched" | "watched">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null); // null = use admin current term
  const [currentTerm, setCurrentTerm] = useState<number>(1);

  // Comments
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  // View counts for admin
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  // Watched videos by current student
  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(new Set());

  // Homework gating
  const [videoHomework, setVideoHomework] = useState<Record<string, { id: string; description: string | null; questions: any[] }>>({});
  const [submittedHomework, setSubmittedHomework] = useState<Set<string>>(new Set());

  const videosRef = useRef<VideoItem[]>([]);
  const playerSectionRef = useRef<HTMLDivElement>(null);
  const SIGNED_URL_TTL_SECONDS = 60 * 60;
  const REFRESH_BUFFER_MS = 5 * 60 * 1000;

  const getStoragePathFromVideoUrl = useCallback((videoUrl: string) => {
    if (!videoUrl) return null;
    if (!videoUrl.includes("://")) {
      return decodeURIComponent(videoUrl.replace(/^\/+/, ""));
    }
    try {
      const url = new URL(videoUrl);
      const markers = [
        "/storage/v1/object/sign/videos/",
        "/storage/v1/object/public/videos/",
        "/storage/v1/object/videos/",
      ];
      for (const marker of markers) {
        if (url.pathname.includes(marker)) {
          const rawPath = url.pathname.split(marker)[1] || "";
          return decodeURIComponent(rawPath.replace(/^\/+/, ""));
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const resolvePlayableVideoUrls = useCallback(async (items: VideoItem[]) => {
    const resolved = await Promise.all(
      items.map(async (item) => {
        const filePath = getStoragePathFromVideoUrl(item.video_url);
        if (!filePath) return item;
        const { data, error } = await supabase.storage
          .from("videos")
          .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
        if (error || !data?.signedUrl) return item;
        return { ...item, video_url: data.signedUrl };
      })
    );
    return resolved;
  }, [getStoragePathFromVideoUrl]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);

      // Run role check and profile fetch in parallel
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin"),
        supabase.from("profiles").select("is_subscribed, madhab").eq("user_id", session.user.id).single(),
      ]);

      const isAdminUser = rolesResult.data && rolesResult.data.length > 0;
      if (isAdminUser) setIsAdmin(true);
      if (profileResult.data) setIsSubscribed(profileResult.data.is_subscribed);
      const studentMadhab = profileResult.data?.madhab || "";

      if (subject && grade) {
        const decodedSubject = decodeURIComponent(subject);
        console.log("Fetching videos:", { grade, subject: decodedSubject });

        // Get current term
        const { data: termSetting } = await supabase.from("app_settings").select("value").eq("key", "current_term").single();
        const currentTermVal = parseInt(termSetting?.value || "1") || 1;
        setCurrentTerm(currentTermVal);
        
        const { data, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("grade", grade)
          .eq("subject", decodedSubject)
          .filter("term", "eq", currentTermVal)
          .order("sort_order", { ascending: true });

        if (videosError) {
          console.error("Videos fetch error:", videosError);
        }

        console.log("Videos result:", { count: data?.length, data: data?.map(v => ({ id: v.id, title: v.title, access_type: v.access_type })) });

        if (data) {
          // Always fetch viewed videos for the badge
          const { data: viewedData } = await supabase
            .from("video_views")
            .select("video_id")
            .eq("user_id", session.user.id);
          const viewedIds = new Set((viewedData || []).map(v => v.video_id));
          setWatchedVideoIds(viewedIds);

          let filtered: typeof data;
          if (isAdminUser || profileResult.data?.is_subscribed) {
            filtered = data;
          } else {
            filtered = data.filter(v => v.access_type === "all" || viewedIds.has(v.id));
          }

          if (decodedSubject === "الفقه" && !isAdminUser && studentMadhab) {
            filtered = filtered.filter(v => !(v as any).madhab || (v as any).madhab === studentMadhab);
          }

          console.log("Filtered videos:", { count: filtered.length });
          setVideos(filtered as VideoItem[]);

          // Fetch view counts for all users (admin sees global, students see own)
          const videoIds = filtered.map(v => v.id);
          if (videoIds.length > 0) {
            if (isAdminUser) {
              const { data: viewsData } = await supabase
                .from("video_views")
                .select("video_id")
                .in("video_id", videoIds);
              if (viewsData) {
                const counts: Record<string, number> = {};
                viewsData.forEach(v => {
                  counts[v.video_id] = (counts[v.video_id] || 0) + 1;
                });
                setViewCounts(counts);
              }
            } else {
              // Students: count their own views per video
              const { data: viewsData } = await supabase
                .from("video_views")
                .select("video_id")
                .eq("user_id", session.user.id)
                .in("video_id", videoIds);
              if (viewsData) {
                const counts: Record<string, number> = {};
                viewsData.forEach(v => {
                  counts[v.video_id] = (counts[v.video_id] || 0) + 1;
                });
                setViewCounts(counts);
              }
            }
          }

          // Fetch homework data
          if (videoIds.length > 0) {
            const { data: hwData } = await supabase
              .from("video_homework" as any)
              .select("id, video_id, description")
              .in("video_id", videoIds);

            if (hwData && (hwData as any[]).length > 0) {
              const hwMap: Record<string, { id: string; description: string | null; questions: any[] }> = {};
              for (const hw of hwData as any[]) {
                hwMap[hw.video_id] = { id: hw.id, description: hw.description, questions: hw.questions || [] };
              }
              setVideoHomework(hwMap);

              // Fetch submissions for these homeworks
              const hwIds = (hwData as any[]).map((hw: any) => hw.id);
              const { data: subs } = await supabase
                .from("video_homework_submissions" as any)
                .select("homework_id")
                .eq("user_id", session.user.id)
                .in("homework_id", hwIds);

              if (subs) {
                setSubmittedHomework(new Set((subs as any[]).map((s: any) => s.homework_id)));
              }
            }
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [subject, grade, navigate, resolvePlayableVideoUrls]);

  // Reload videos when student switches term
  useEffect(() => {
    if (selectedTerm === null || !grade || !subject) return;
    const decodedSubj = decodeURIComponent(subject);
    supabase
      .from("videos")
      .select("*")
      .eq("grade", grade)
      .eq("subject", decodedSubj)
      .filter("term", "eq", selectedTerm)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setVideos(data as any);
      });
  }, [selectedTerm, grade, subject]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const isVideoLocked = useCallback((videoId: string): boolean => {
    if (isAdmin) return false;
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex <= 0) return false;
    for (let i = 0; i < videoIndex; i++) {
      const prevVideo = videos[i];
      const hw = videoHomework[prevVideo.id];
      if (hw && !submittedHomework.has(hw.id)) return true;
    }
    return false;
  }, [isAdmin, videos, videoHomework, submittedHomework]);

  const resolveAndPlay = useCallback(async (videoId: string) => {
    if (isVideoLocked(videoId)) return;
    
    // Record view only if no view exists within the last 7 days
    if (userId) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      supabase
        .from("video_views")
        .select("id")
        .eq("video_id", videoId)
        .eq("user_id", userId)
        .gte("viewed_at", sevenDaysAgo)
        .limit(1)
        .then(({ data }) => {
          if (!data || data.length === 0) {
            supabase.from("video_views").insert({ video_id: videoId, user_id: userId }).then(() => {});
            setWatchedVideoIds(prev => new Set([...prev, videoId]));
          }
        });
    }

    if (resolvedUrls[videoId]) {
      setPlayingId(videoId);
      setTimeout(() => playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      return;
    }

    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const [resolved] = await resolvePlayableVideoUrls([video]);
    if (resolved) {
      setResolvedUrls(prev => ({ ...prev, [videoId]: resolved.video_url }));
      setPlayingId(videoId);
      setTimeout(() => playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [videos, resolvedUrls, resolvePlayableVideoUrls, isVideoLocked, userId]);

  // Refresh URL for currently playing video periodically
  useEffect(() => {
    if (!playingId) return;
    const refreshIntervalMs = Math.max(60_000, (SIGNED_URL_TTL_SECONDS * 1000) - REFRESH_BUFFER_MS);
    const interval = setInterval(async () => {
      const video = videosRef.current.find(v => v.id === playingId);
      if (!video) return;
      const [refreshed] = await resolvePlayableVideoUrls([video]);
      if (refreshed) {
        setResolvedUrls(prev => ({ ...prev, [playingId]: refreshed.video_url }));
      }
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [playingId, resolvePlayableVideoUrls]);

  const fetchComments = async (videoId: string) => {
    const { data } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setComments(prev => ({
        ...prev,
        [videoId]: data.map(c => ({ ...c, user_name: nameMap.get(c.user_id) || "مستخدم" })),
      }));
    } else {
      setComments(prev => ({ ...prev, [videoId]: [] }));
    }
  };

  const addComment = async (videoId: string) => {
    if (!newComment.trim() || !userId) return;
    await supabase.from("video_comments").insert({ video_id: videoId, user_id: userId, content: newComment.trim() });
    setNewComment("");
    fetchComments(videoId);
  };

  const deleteComment = async (commentId: string, videoId: string) => {
    await supabase.from("video_comments").delete().eq("id", commentId);
    fetchComments(videoId);
  };

  const toggleComments = (videoId: string) => {
    if (showComments === videoId) {
      setShowComments(null);
    } else {
      setShowComments(videoId);
      if (!comments[videoId]) fetchComments(videoId);
    }
  };

  // Normalize Arabic text for fuzzy search
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[إأآٱا]/g, "ا")
      .replace(/[ؤ]/g, "و")
      .replace(/[ئ]/g, "ي")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[\u064B-\u065F\u0670]/g, "") // remove tashkeel
      .replace(/\s+/g, " ")
      .trim();
  };

  // Common aliases / misspellings people search for
  const searchAliases: Record<string, string[]> = {
    // اسم المدرس
    "اسماعيل": ["إسماعيل", "اسمعيل", "اسماعيل", "إسمعيل", "اسمعيلا", "اسماعل", "إسمعيلا"],
    "عباده": ["عبادة", "عباده", "العبادة", "العباده", "عبده", "ابادة", "ابادا", "إبادة"],
    "مستر": ["مستر", "مسطر", "مصطر", "mr", "مستار", "استاذ", "أستاذ", "الاستاذ", "الأستاذ"],
    "احمد": ["أحمد", "احمد", "احمت", "أحمت"],
    // مواد المنصة الأساسية
    "تفسير": ["تفسير", "التفسير", "تفسبر", "تفسر", "تفسي", "تفسبير"],
    "حديث": ["حديث", "الحديث", "حديس", "الحديس", "حديث شريف", "الحديث الشريف"],
    "توحيد": ["توحيد", "التوحيد", "توحبد", "توهيد", "التوهيد"],
    "فقه": ["فقه", "الفقه", "فقة", "الفقة", "فقة شافعي", "فقه شافعي", "فقه مالكي", "فقه حنفي", "الفقة الشافعي", "الفقه الشافعي", "الفقه المالكي", "الفقه الحنفي"],
    "سيره": ["سيرة", "سيره", "السيرة", "السيره", "سيرة نبوية", "السيرة النبوية", "سبرة", "سبره"],
    "شافعي": ["شافعي", "شافعى", "الشافعي", "الشافعى", "شفعي"],
    "مالكي": ["مالكي", "مالكى", "المالكي", "المالكى", "ملكي"],
    "حنفي": ["حنفي", "حنفى", "الحنفي", "الحنفى", "حنيفي"],
    // كلمات عامة
    "اسلام": ["إسلام", "اسلام", "الاسلام", "الإسلام"],
    "دين": ["دين", "الدين", "تربية دينية", "تربيه دينيه", "شرعي", "شرعية", "علوم شرعية"],
    "قران": ["قرآن", "قران", "القرآن", "القران"],
    "درس": ["درس", "الدرس", "دروس", "الدروس", "شرح", "الشرح"],
    "امتحان": ["امتحان", "الامتحان", "اختبار", "الاختبار", "امتحانات", "اختبارات", "تمتحان"],
    "واجب": ["واجب", "الواجب", "واجبات", "الواجبات", "هوم ورك", "homework"],
    "مرشد": ["مرشد", "المرشد", "المرشد الازهري", "المرشد الأزهري", "كتاب المرشد"],
    "ازهر": ["أزهر", "ازهر", "الأزهر", "الازهر", "ازهري", "أزهري", "الأزهري", "الازهري"],
    "صلاه": ["صلاة", "صلاه", "الصلاة", "الصلاه"],
    "طهاره": ["طهارة", "طهاره", "الطهارة", "الطهاره"],
    "صيام": ["صيام", "الصيام", "صوم", "الصوم"],
    "زكاه": ["زكاة", "زكاه", "الزكاة", "الزكاه"],
    "حج": ["حج", "الحج"],
    "عقيده": ["عقيدة", "عقيده", "العقيدة", "العقيده"],
  };

  // Expand query: if search matches an alias key, also search all its variants
  const expandSearch = (query: string): string[] => {
    const normalized = normalizeArabic(query);
    const variants = [normalized];
    for (const [, alts] of Object.entries(searchAliases)) {
      const normalizedAlts = alts.map(a => normalizeArabic(a));
      if (normalizedAlts.some(a => a.includes(normalized) || normalized.includes(a))) {
        normalizedAlts.forEach(a => { if (!variants.includes(a)) variants.push(a); });
      }
    }
    return variants;
  };

  const filteredVideos = videos.filter(v => {
    if (activeTab === "watched" && !watchedVideoIds.has(v.id)) return false;
    if (activeTab === "unwatched" && watchedVideoIds.has(v.id)) return false;
    if (!searchQuery) return true;
    const queries = expandSearch(searchQuery);
    const title = normalizeArabic(v.title);
    const desc = normalizeArabic(v.description || "");
    return queries.some(q => title.includes(q) || desc.includes(q));
  });

  const watchedCount = videos.filter(v => watchedVideoIds.has(v.id)).length;
  const unwatchedCount = videos.length - watchedCount;




  const getBlockingVideo = (videoId: string): VideoItem | null => {
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex <= 0) return null;
    for (let i = videoIndex - 1; i >= 0; i--) {
      const prevVideo = videos[i];
      const hw = videoHomework[prevVideo.id];
      if (hw && !submittedHomework.has(hw.id)) return prevVideo;
    }
    return null;
  };

  const handleHomeworkSubmitted = (homeworkId: string) => {
    setSubmittedHomework(prev => new Set([...prev, homeworkId]));
  };

  const playingVideo = playingId ? videos.find(v => v.id === playingId) : null;
  const playingVideoIndex = playingId ? videos.findIndex(v => v.id === playingId) : -1;

  // Get next playable video
  const getNextVideo = useCallback(() => {
    if (playingVideoIndex < 0) return null;
    for (let i = playingVideoIndex + 1; i < videos.length; i++) {
      if (!isVideoLocked(videos[i].id)) return videos[i];
    }
    return null;
  }, [playingVideoIndex, videos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton Header */}
        <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 h-14" />
        <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
          {/* Skeleton title */}
          <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
          {/* Skeleton search */}
          <div className="h-10 w-full bg-muted rounded-xl animate-pulse" />
          {/* Skeleton tabs */}
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />)}
          </div>
          {/* Skeleton video cards */}
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-28 h-16 bg-muted rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const decodedSubject = subject ? decodeURIComponent(subject) : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">منصة الأستاذ إسماعيل</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronRight className="w-4 h-4" />
              الرجوع
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold font-amiri mb-1">{decodedSubject}</h1>
          <p className="text-sm text-muted-foreground">{grade}</p>
          <span className="inline-flex items-center gap-1 mt-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20">
            📅 {currentTerm === 1 ? "الترم الأول" : "الترم الثاني"}
          </span>
        </div>

        {/* Currently Playing Video - Sticky Section */}
        {playingVideo && resolvedUrls[playingVideo.id] && (
          <div ref={playerSectionRef} className="mb-6 sticky top-14 z-40">
            <div className="bg-card rounded-2xl border border-primary/20 overflow-hidden shadow-xl">
              <VideoPlayer
                src={resolvedUrls[playingVideo.id]}
                title={playingVideo.title}
                subject={playingVideo.subject}
                grade={playingVideo.grade}
                lesson={playingVideo.title}
                
                onRefreshSource={async () => {
                  const [refreshed] = await resolvePlayableVideoUrls([playingVideo]);
                  if (refreshed) {
                    setResolvedUrls(prev => ({ ...prev, [playingVideo.id]: refreshed.video_url }));
                    return true;
                  }
                  return false;
                }}
              />
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate">
                    <span className="text-muted-foreground ml-1">{playingVideoIndex + 1}.</span>
                    {playingVideo.title}
                  </h3>
                  {playingVideo.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{playingVideo.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Next video button */}
                  {getNextVideo() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => {
                        const next = getNextVideo();
                        if (next) resolveAndPlay(next.id);
                      }}
                    >
                      التالي
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setPlayingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Comments for playing video */}
              {(() => {
                const hw = videoHomework[playingVideo.id];
                const hwSubmitted = hw ? submittedHomework.has(hw.id) : false;
                return (
                  <>
                    <div className="border-t border-border px-3 pb-2 pt-1.5 flex items-center gap-3">
                      <button
                        onClick={() => toggleComments(playingVideo.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {showComments === playingVideo.id ? "إخفاء التعليقات" : "التعليقات"}
                        {comments[playingVideo.id]?.length ? (
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">{comments[playingVideo.id].length}</span>
                        ) : null}
                      </button>
                      {hw && (
                        <Link to={`/video-homework/${playingVideo.id}`} className="mr-auto">
                          <Button variant={hwSubmitted ? "ghost" : "default"} size="sm" className="text-xs h-7 gap-1">
                            <ClipboardList className="w-3.5 h-3.5" />
                            {hwSubmitted ? "عرض النتيجة" : "حل الواجب"}
                          </Button>
                        </Link>
                      )}
                      {/* Practice Banner */}
                      <Link 
                        to={`/question-bank?subject=${encodeURIComponent(playingVideo.subject)}&grade=${encodeURIComponent(playingVideo.grade)}&lesson=${encodeURIComponent(playingVideo.title)}`} 
                        className="mr-auto flex items-center gap-1.5 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-primary px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-primary/20"
                      >
                        <Target className="w-3.5 h-3.5" />
                        حل تمرينات على الدرس
                      </Link>
                    </div>

                    {showComments === playingVideo.id && (
                      <div className="border-t border-border p-3 space-y-3">
                        {comments[playingVideo.id]?.map(c => (
                          <div key={c.id} className="bg-muted rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs">{c.user_name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(c.created_at).toLocaleDateString("ar-EG")}
                                </span>
                                {(c.user_id === userId || isAdmin) && (
                                  <button onClick={() => deleteComment(c.id, playingVideo.id)} className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs">{c.content}</p>
                          </div>
                        ))}
                        {comments[playingVideo.id]?.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="اكتب تعليق أو سؤال..."
                            className="text-xs h-9"
                            onKeyDown={e => e.key === "Enter" && addComment(playingVideo.id)}
                          />
                          <Button size="sm" onClick={() => addComment(playingVideo.id)} className="h-9 px-3" disabled={!newComment.trim()}>
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث في الفيديوهات..."
            className="pr-10 h-11 rounded-xl"
          />
        </div>

        {/* Term Switcher */}
        {(isSubscribed || isAdmin) && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground font-medium">📅 الترم:</span>
            <div className="flex gap-1.5">
              {[1, 2].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTerm(t === currentTerm && selectedTerm === null ? null : t)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                    (selectedTerm === t) || (selectedTerm === null && t === currentTerm)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {t === 1 ? "الترم الأول" : "الترم الثاني"}
                  {t === currentTerm && (
                    <span className="mr-1 text-[9px] opacity-70">الحالي</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {videos.length > 0 && (isSubscribed || isAdmin) && (
          <div className="flex items-center gap-1.5 mb-4 p-1 bg-muted/50 rounded-xl border border-border overflow-x-auto">
            {([
              { key: "all", label: "الكل", count: videos.length },
              { key: "unwatched", label: "لسه مشفتهاش", count: unwatchedCount },
              { key: "watched", label: "اتفرجت عليها", count: watchedCount },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 min-w-fit whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                {t.label}
                <span className={`mr-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  activeTab === t.key ? "bg-primary-foreground/20" : "bg-background"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Video count */}
        {filteredVideos.length > 0 && (isSubscribed || isAdmin) && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {filteredVideos.length} فيديو
              {playingId && ` · يتم تشغيل ${playingVideoIndex + 1}`}
            </p>
          </div>
        )}

        {filteredVideos.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
            {!isSubscribed && !isAdmin ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold font-amiri text-xl">اشترك للوصول إلى المحتوى</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  اشترك الآن للوصول لجميع الفيديوهات والشروحات والمحتوى الحصري لمادة {decodedSubject}
                </p>
                <Link to="/subscribe">
                  <Button size="lg" className="gap-2 mt-2">
                    اشترك الآن
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد فيديوهات لهذه المادة حتى الآن"}
              </p>
            )}
          </div>
        ) : (
          <>
          {!isSubscribed && !isAdmin && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4 mb-3 flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">بعض الفيديوهات للمشتركين فقط</p>
                <p className="text-xs text-muted-foreground">اشترك للوصول لكل المحتوى</p>
              </div>
              <Link to="/subscribe">
                <Button size="sm" variant="outline" className="text-xs">اشترك</Button>
              </Link>
            </div>
          )}
          <StaggerContainer className="space-y-3" staggerDelay={0.08}>
            {filteredVideos.map((v, i) => {
              const locked = isVideoLocked(v.id);
              const hw = videoHomework[v.id];
              const hwSubmitted = hw ? submittedHomework.has(hw.id) : false;
              const isCurrentlyPlaying = playingId === v.id;
              const isWatched = watchedVideoIds.has(v.id);
              const globalIndex = videos.findIndex(vid => vid.id === v.id);

              return (
                <StaggerItem key={v.id}>
                  <div
                    className={`bg-card rounded-xl border overflow-hidden transition-all ${
                      isCurrentlyPlaying
                        ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                        : locked
                        ? "opacity-60 border-border"
                        : "border-border hover:shadow-md hover:border-primary/20"
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (locked) return;
                        if (isCurrentlyPlaying) {
                          playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          return;
                        }
                        resolveAndPlay(v.id);
                      }}
                      disabled={locked}
                      className="w-full flex items-center gap-3 p-3 text-right"
                    >
                      {/* Thumbnail / Play indicator */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isCurrentlyPlaying
                          ? "bg-primary text-primary-foreground"
                          : locked
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary group-hover:bg-primary/20"
                      }`}>
                        {locked ? (
                          <Lock className="w-5 h-5" />
                        ) : isCurrentlyPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <div className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" />
                            <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            <div className="w-1 h-5 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                          </div>
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono">{globalIndex + 1}</span>
                          <h3 className="font-semibold text-sm truncate">{v.title}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{v.description}</p>
                          )}
                          {hw && (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
                              hwSubmitted
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            }`}>
                              {hwSubmitted ? "✓ تم" : "واجب"}
                            </span>
                          )}
                          {v.madhab && (
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
                              v.madhab === "شافعي" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" :
                              v.madhab === "حنفي" ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" :
                              v.madhab === "مالكي" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" :
                              v.madhab === "حنبلي" ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" :
                              "bg-muted text-muted-foreground border-border"
                            }`}>
                              {v.madhab}
                            </span>
                          )}
                          {isWatched && !isCurrentlyPlaying && (
                            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              تمت المشاهدة
                              {viewCounts[v.id] && viewCounts[v.id] > 1 && (
                                <span className="mr-0.5">({viewCounts[v.id]}×)</span>
                              )}
                            </span>
                          )}
                          {isCurrentlyPlaying && (
                            <span className="text-[9px] text-primary font-semibold">قيد التشغيل ▲</span>
                          )}
                          {isAdmin && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              {viewCounts[v.id] || 0}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow / Lock */}
                      {!locked && !isCurrentlyPlaying && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Lock message */}
                    {locked && (
                      <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">يجب حل واجب الفيديو السابق</p>
                        {(() => {
                          const blockingVideo = getBlockingVideo(v.id);
                          if (!blockingVideo) return null;
                          return (
                            <Link to={`/video-homework/${blockingVideo.id}`}>
                              <Button size="sm" variant="outline" className="text-[10px] h-6 gap-1">
                                <ClipboardList className="w-3 h-3" />
                                حل الواجب
                              </Button>
                            </Link>
                          );
                        })()}
                      </div>
                    )}

                    {/* Homework link for non-playing videos */}
                    {!locked && !isCurrentlyPlaying && hw && (
                      <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className={`w-3.5 h-3.5 ${hwSubmitted ? "text-emerald-600" : "text-primary"}`} />
                          <span className={`text-[11px] font-medium ${hwSubmitted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                            {hwSubmitted ? "تم تسليم الواجب" : "واجب مطلوب"}
                          </span>
                        </div>
                        <Link to={`/video-homework/${v.id}`}>
                          <Button variant={hwSubmitted ? "ghost" : "default"} size="sm" className="text-[10px] h-6 gap-1">
                            {hwSubmitted ? "عرض" : "حل"}
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          </>
        )}



      </main>
    </div>
  );
};

export default SubjectVideos;
