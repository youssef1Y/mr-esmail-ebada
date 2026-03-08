import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, BookOpen, Search, Send, Trash2, MessageCircle, Lock, Play, CheckCircle2, ClipboardList } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import VideoHomeworkForm from "@/components/VideoHomeworkForm";
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
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Comments
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  // Homework gating
  const [videoHomework, setVideoHomework] = useState<Record<string, { id: string; description: string | null; questions: any[] }>>({});
  const [submittedHomework, setSubmittedHomework] = useState<Set<string>>(new Set());

  const videosRef = useRef<VideoItem[]>([]);
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

  const refreshSingleVideoUrl = useCallback(async (videoId: string) => {
    const targetVideo = videosRef.current.find((video) => video.id === videoId);
    if (!targetVideo) return false;

    const [refreshedVideo] = await resolvePlayableVideoUrls([targetVideo]);
    if (!refreshedVideo || refreshedVideo.video_url === targetVideo.video_url) return false;

    setVideos((prev) =>
      prev.map((video) => (video.id === videoId ? { ...video, video_url: refreshedVideo.video_url } : video))
    );

    return true;
  }, [resolvePlayableVideoUrls]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (roles && roles.length > 0) setIsAdmin(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed, madhab")
        .eq("user_id", session.user.id)
        .single();
      if (profile) setIsSubscribed(profile.is_subscribed);
      const studentMadhab = profile?.madhab || "";

      const isAdminUser = roles && roles.length > 0;

      if (subject && grade) {
        const { data } = await supabase
          .from("videos")
          .select("*")
          .eq("grade", grade)
          .eq("subject", decodeURIComponent(subject))
          .order("sort_order", { ascending: true });

        if (data) {
          let filtered = isAdminUser || profile?.is_subscribed
            ? data
            : data.filter(v => v.access_type === "all");

          // Filter فقه videos by student's madhab (unless admin)
          if (decodeURIComponent(subject || "") === "الفقه" && !isAdminUser && studentMadhab) {
            filtered = filtered.filter(v => !(v as any).madhab || (v as any).madhab === studentMadhab);
          }

          const playableVideos = await resolvePlayableVideoUrls(filtered as VideoItem[]);
          setVideos(playableVideos);

          // Fetch homework for these videos
          const videoIds = filtered.map(v => v.id);
          if (videoIds.length > 0) {
            const { data: hwData } = await supabase
              .from("video_homework" as any)
              .select("*")
              .in("video_id", videoIds);

            if (hwData && (hwData as any[]).length > 0) {
              const hwMap: Record<string, { id: string; description: string | null; questions: any[] }> = {};
              for (const hw of hwData as any[]) {
                hwMap[hw.video_id] = { id: hw.id, description: hw.description, questions: hw.questions || [] };
              }
              setVideoHomework(hwMap);

              // Check which homework the student already submitted
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

          // Track views
          for (const v of filtered) {
            supabase.from("video_views").insert({ video_id: v.id, user_id: session.user.id }).then(() => {});
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [subject, grade, navigate, resolvePlayableVideoUrls]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    if (!videos.length) return;

    const refreshIntervalMs = Math.max(60_000, (SIGNED_URL_TTL_SECONDS * 1000) - REFRESH_BUFFER_MS);

    const interval = setInterval(() => {
      void (async () => {
        const refreshedVideos = await resolvePlayableVideoUrls(videosRef.current);
        const refreshedMap = new Map(refreshedVideos.map((video) => [video.id, video.video_url]));

        setVideos((prev) =>
          prev.map((video) =>
            refreshedMap.has(video.id)
              ? { ...video, video_url: refreshedMap.get(video.id)! }
              : video
          )
        );
      })();
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [videos.length, resolvePlayableVideoUrls]);

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

  const filteredVideos = videos.filter(v =>
    !searchQuery || v.title.includes(searchQuery) || v.description?.includes(searchQuery)
  );

  // Check if a video is locked: ANY previous video with homework must have its homework submitted
  const isVideoLocked = (videoId: string): boolean => {
    if (isAdmin) return false;
    
    // Find this video's index in the FULL ordered videos array
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex <= 0) return false; // First video always unlocked
    
    // Check ALL previous videos - if any has unsubmitted homework, lock this video
    for (let i = 0; i < videoIndex; i++) {
      const prevVideo = videos[i];
      const hw = videoHomework[prevVideo.id];
      if (hw && !submittedHomework.has(hw.id)) {
        return true; // Locked - a previous video's homework is not submitted
      }
    }
    return false;
  };

  // Find the first previous video with unsubmitted homework (for the lock button)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-amiri mb-1">{decodedSubject}</h1>
          <p className="text-sm text-muted-foreground">{grade}</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث في الفيديوهات..."
            className="pr-10 h-11 rounded-xl"
          />
        </div>

        {!isSubscribed && !isAdmin ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-4">
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
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد فيديوهات لهذه المادة حتى الآن"}
            </p>
          </div>
        ) : (
          <StaggerContainer className="space-y-4" staggerDelay={0.1}>
            {filteredVideos.map((v, i) => {
              const locked = isVideoLocked(v.id);
              const hw = videoHomework[v.id];
              const hwSubmitted = hw ? submittedHomework.has(hw.id) : false;

              return (
              <StaggerItem key={v.id}>
                <div className={`bg-card rounded-2xl border border-border overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 ${locked ? "opacity-70" : ""}`}>
                {locked ? (
                  <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center gap-3 p-4">
                    <div className="w-14 h-14 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground text-center">
                      هذا الفيديو مغلق
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      يجب حل واجب الفيديو السابق أولاً لفتح هذا الفيديو
                    </p>
                    {(() => {
                      const blockingVideo = getBlockingVideo(v.id);
                      if (!blockingVideo) return null;
                      return (
                        <Link to={`/video-homework/${blockingVideo.id}`}>
                          <Button size="sm" className="gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <ClipboardList className="w-4 h-4" />
                            حل واجب الفيديو السابق
                          </Button>
                        </Link>
                      );
                    })()}
                  </div>
                ) : playingId === v.id ? (
                  <VideoPlayer
                    src={v.video_url}
                    title={v.title}
                    onRefreshSource={() => refreshSingleVideoUrl(v.id)}
                  />
                ) : (
                  <button
                    onClick={() => setPlayingId(v.id)}
                    className="w-full aspect-video bg-muted flex items-center justify-center relative group"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </div>
                  </button>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm">
                      <span className="text-muted-foreground ml-2">{i + 1}.</span>
                      {v.title}
                    </h3>
                    {hw && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        hwSubmitted
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                      }`}>
                        {hwSubmitted ? "✓ تم التسليم" : "واجب مطلوب"}
                      </span>
                    )}
                    {v.madhab && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        v.madhab === "شافعي" ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" :
                        v.madhab === "حنفي" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" :
                        v.madhab === "مالكي" ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" :
                        v.madhab === "حنبلي" ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" :
                        "bg-muted text-muted-foreground border-border"
                      }`}>
                        {v.madhab}
                      </span>
                    )}
                  </div>
                  {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}

                  {!locked && (
                    <button
                      onClick={() => toggleComments(v.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {showComments === v.id ? "إخفاء التعليقات" : "التعليقات والأسئلة"}
                      {comments[v.id] && comments[v.id].length > 0 && (
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">{comments[v.id].length}</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Homework link - show icon to open separate page */}
                {!locked && hw && (
                  <div className="border-t border-border p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className={`w-4 h-4 ${hwSubmitted ? "text-emerald-600" : "text-primary"}`} />
                      <span className={`text-xs font-medium ${hwSubmitted ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                        {hwSubmitted ? "تم تسليم الواجب" : "واجب مطلوب"}
                      </span>
                    </div>
                    <Link to={`/video-homework/${v.id}`}>
                      <Button variant={hwSubmitted ? "ghost" : "default"} size="sm" className="text-xs h-7 gap-1">
                        {hwSubmitted ? "عرض النتيجة" : "حل الواجب"}
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Comments Section */}
                {showComments === v.id && (
                  <div className="border-t border-border p-4 space-y-3">
                    {comments[v.id]?.map(c => (
                      <div key={c.id} className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{c.user_name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString("ar-EG")}
                            </span>
                            {(c.user_id === userId || isAdmin) && (
                              <button onClick={() => deleteComment(c.id, v.id)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs">{c.content}</p>
                      </div>
                    ))}

                    {comments[v.id]?.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
                    )}

                    <div className="flex gap-2">
                      <Input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="اكتب تعليق أو سؤال..."
                        className="text-xs h-9"
                        onKeyDown={e => e.key === "Enter" && addComment(v.id)}
                      />
                      <Button size="sm" onClick={() => addComment(v.id)} className="h-9 px-3" disabled={!newComment.trim()}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

      </main>
    </div>
  );
};

export default SubjectVideos;
