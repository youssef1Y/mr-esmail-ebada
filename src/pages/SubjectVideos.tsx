import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Play, BookOpen, Search, Send, Trash2, MessageCircle, Lock } from "lucide-react";
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

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (roles && roles.length > 0) setIsAdmin(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("user_id", session.user.id)
        .single();
      if (profile) setIsSubscribed(profile.is_subscribed);

      const isAdminUser = roles && roles.length > 0;

      if (subject && grade) {
        const { data } = await supabase
          .from("videos")
          .select("*")
          .eq("grade", grade)
          .eq("subject", decodeURIComponent(subject))
          .order("sort_order", { ascending: true });
        if (data) {
          const filtered = isAdminUser || profile?.is_subscribed
            ? data
            : data.filter(v => v.access_type === "all");
          setVideos(filtered);

          // Track views
          for (const v of filtered) {
            supabase.from("video_views").insert({ video_id: v.id, user_id: session.user.id }).then(() => {});
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [subject, grade, navigate]);

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
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
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
            className="pr-10"
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
            {filteredVideos.map((v, i) => (
              <StaggerItem key={v.id}>
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                {playingId === v.id ? (
                  <video
                    src={v.video_url}
                    controls
                    autoPlay
                    className="w-full aspect-video bg-black"
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
                  <h3 className="font-bold text-sm mb-1">
                    <span className="text-muted-foreground ml-2">{i + 1}.</span>
                    {v.title}
                  </h3>
                  {v.description && <p className="text-xs text-muted-foreground">{v.description}</p>}

                  {/* Comments Toggle */}
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
                </div>

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
            ))}
          </StaggerContainer>
        )}

      </main>
    </div>
  );
};

export default SubjectVideos;
