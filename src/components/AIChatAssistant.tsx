import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Sparkles, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (e: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { onError("يجب تسجيل الدخول أولاً"); return; }

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || "حصل خطأ، حاول تاني");
    return;
  }

  if (!resp.body) { onError("No stream"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

async function requestVideoSummary(videoId: string): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: "summarize_video", video_id: videoId }),
  });

  const data = await resp.json();
  if (!resp.ok) return null;
  return data.summary || null;
}

const quickQuestions = [
  { emoji: "📚", text: "لخصلي آخر درس شفته" },
  { emoji: "💳", text: "إزاي أشترك في المنصة؟" },
  { emoji: "🏆", text: "إزاي أجمع نقاط أكتر؟" },
  { emoji: "📊", text: "كام نقطتي وترتيبي كام؟" },
  { emoji: "🔧", text: "عندي مشكلة في المنصة" },
];

const AIChatAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [pulse, setPulse] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);


  const sendMsg = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading || summarizing) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const allMsgs = [...messages, userMsg];

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: allMsgs,
      onDelta: upsert,
      onDone: () => {
        setLoading(false);
      },
      onError: (e) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${e}` },
        ]);
        setLoading(false);
      },
    });
  }, [input, loading, summarizing, messages]);

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 left-4 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary/90 to-gold text-primary-foreground shadow-xl flex items-center justify-center group"
          >
            {pulse && (
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            )}
            <GraduationCap className="w-7 h-7 drop-shadow-sm" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] sm:bottom-4 sm:left-4 sm:right-auto sm:w-[400px] h-[85vh] sm:h-[75vh] max-h-[700px] bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-l from-primary/5 via-gold/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1">
                      مساعد المنصة
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {summarizing ? "⏳ جاري تحليل الفيديو..." : "مدعوم بالذكاء الاصطناعي • يقدر يلخص الفيديوهات ✨"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setMessages([])}
                      title="مسح المحادثة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center py-4"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center mx-auto mb-4 rotate-3">
                      <GraduationCap className="w-10 h-10 text-primary" />
                    </div>
                    <h4 className="font-bold text-base mb-1">أهلاً بيك! 👋</h4>
                    <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                      أنا مساعدك الذكي في المنصة
                      <br />
                      بقدر ألخصلك الفيديوهات اللي شفتها 📹 واساعدك في أي حاجة 🚀
                    </p>
                    <div className="space-y-2">
                      {quickQuestions.map((q) => (
                        <motion.button
                          key={q.text}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => sendMsg(q.text)}
                          className="flex items-center gap-2 w-full text-xs bg-muted/60 hover:bg-muted rounded-xl px-4 py-2.5 text-right transition-colors border border-transparent hover:border-border"
                        >
                          <span className="text-base">{q.emoji}</span>
                          <span>{q.text}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-gold/15 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm text-sm">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {(loading || summarizing) && messages[messages.length - 1]?.role !== "assistant" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-gold/15 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={summarizing ? "جاري تحليل الفيديو..." : "اكتب سؤالك هنا... 💬"}
                    rows={1}
                    disabled={summarizing}
                    className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm min-h-[44px] max-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }
                    }}
                  />
                  <Button
                    onClick={() => sendMsg()}
                    disabled={loading || summarizing || !input.trim()}
                    size="icon"
                    className="h-11 w-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                  >
                    {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">
                  يقدر يلخص الفيديوهات اللي شفتها 📹 • لا يعطي إجابات الامتحانات
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
