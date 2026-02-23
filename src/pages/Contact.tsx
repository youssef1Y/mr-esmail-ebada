import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth/login"); return; }
      setUserId(session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const fetchMessages = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data);
      const unread = data.filter(m => m.is_admin_reply && !m.is_read);
      if (unread.length > 0) {
        await supabase.from("messages").update({ is_read: true }).in("id", unread.map(m => m.id));
      }
    }
  };

  useEffect(() => {
    if (userId) fetchMessages();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      user_id: userId,
      content: newMessage.trim(),
      is_admin_reply: false,
    });
    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الرسالة", variant: "destructive" });
    } else {
      setNewMessage("");
      fetchMessages();
    }
    setSending(false);
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
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">شكاوي واقتراحات</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              العودة <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-amiri mb-2">شكاوي واقتراحات</h1>
          <p className="text-sm text-muted-foreground">تواصل مع الإدارة مباشرة لأي استفسار أو مشكلة أو اقتراح</p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50">
            <h3 className="font-bold text-sm">المحادثة مع الإدارة</h3>
          </div>
          <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد. أرسل رسالتك الأولى!</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                    m.is_admin_reply ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {m.is_admin_reply && <p className="text-xs font-bold mb-1 opacity-70">الإدارة</p>}
                    <p>{m.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[40px] max-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon" className="h-10 w-10 flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
