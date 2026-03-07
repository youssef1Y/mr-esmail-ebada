import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Bell, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

const StudentNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [personalNotifs, setPersonalNotifs] = useState<StudentNotification[]>([]);
  const [broadcastNotifs, setBroadcastNotifs] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }

      // Fetch personal notifications
      const { data: personal } = await supabase
        .from("student_notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (personal) setPersonalNotifs(personal as StudentNotification[]);

      // Fetch profile for filtering broadcast notifications
      const { data: profile } = await supabase
        .from("profiles")
        .select("grade, is_subscribed")
        .eq("user_id", session.user.id)
        .single();

      // Fetch broadcast notifications
      const { data: broadcasts } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (broadcasts && profile) {
        const filtered = broadcasts.filter((n: any) => {
          if (n.target_audience === "subscribed" && !profile.is_subscribed) return false;
          if (n.target_audience === "unsubscribed" && profile.is_subscribed) return false;
          if (n.target_grades?.length > 0 && !n.target_grades.includes(profile.grade)) return false;
          return true;
        });
        setBroadcastNotifs(filtered);
      }

      // Mark personal notifications as read
      if (personal && personal.length > 0) {
        const unread = personal.filter((n: any) => !n.is_read).map((n: any) => n.id);
        if (unread.length > 0) {
          await supabase.from("student_notifications").update({ is_read: true }).in("id", unread);
        }
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscription_approved": return "✅";
      case "subscription_rejected": return "❌";
      case "subscription_expired": return "⏰";
      case "subscription_activated": return "🎉";
      default: return "🔔";
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">الإشعارات</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Personal Notifications */}
        {personalNotifs.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              إشعارات خاصة بك
            </h2>
            <div className="space-y-3">
              {personalNotifs.map(n => (
                <div key={n.id} className={`bg-card rounded-xl border p-4 ${!n.is_read ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getTypeIcon(n.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">{n.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast Notifications */}
        <div>
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            إشعارات عامة
          </h2>
          {broadcastNotifs.length === 0 && personalNotifs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>
            </div>
          ) : broadcastNotifs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد إشعارات عامة</p>
          ) : (
            <div className="space-y-3">
              {broadcastNotifs.map(n => (
                <div key={n.id} className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-bold text-sm">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(n.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentNotifications;
