import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, Play, Lock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  grade: string;
  subject: string;
  created_at: string;
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

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      // Check admin role
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
      if (roles && roles.length > 0) setIsAdmin(true);

      // Check subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("user_id", session.user.id)
        .single();
      
      if (profile) setIsSubscribed(profile.is_subscribed);

      // Fetch videos
      if (subject && grade) {
        const { data } = await supabase
          .from("videos")
          .select("*")
          .eq("grade", grade)
          .eq("subject", decodeURIComponent(subject))
          .order("sort_order", { ascending: true });
        if (data) setVideos(data);
      }
      setLoading(false);
    };
    init();
  }, [subject, grade, navigate]);

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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-amiri mb-1">{decodedSubject}</h1>
          <p className="text-sm text-muted-foreground">{grade}</p>
        </div>

        {videos.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-muted-foreground">لا توجد فيديوهات لهذه المادة حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((v, i) => (
              <div key={v.id} className="bg-card rounded-xl border border-border overflow-hidden">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SubjectVideos;
