import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, X, Wand2, Loader2, CheckCircle2,
  AlertCircle, Bot, User as UserIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Action = { tool: string; args: any; result: any };
type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: Action[];
};

const TOOL_LABELS: Record<string, { ar: string; icon: string }> = {
  search_products:      { ar: "البحث في المنتجات",    icon: "🔍" },
  create_product:       { ar: "إنشاء منتج",           icon: "✨" },
  update_product_stock: { ar: "تحديث المخزون",        icon: "📦" },
  search_orders:        { ar: "البحث في الطلبات",     icon: "🔎" },
  update_order_status:  { ar: "تغيير حالة طلب",      icon: "🚚" },
  search_customers:     { ar: "البحث عن عميل",        icon: "👤" },
  send_email_to_customer: { ar: "إرسال بريد للعميل", icon: "📧" },
  send_push_notification: { ar: "إرسال إشعار",       icon: "🔔" },
};

const SUGGESTIONS = [
  "ابحث عن منتجات تحتوي كلمة عود",
  "أرني آخر 5 طلبات قيد التجهيز",
  "أنشئ منتج جديد اسمه قهوة فوجي الإثيوبية بسعر 95 ريال",
  "ابحث عن العميل برقم 0501234567",
];

export function EmployeeAssistant() {
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState(true); // هل الـ tab ظاهر أم مخفي
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState("");
  const [busy, setBusy]       = useState(false);
  const scrollRef              = useRef<HTMLDivElement>(null);
  const inputRef               = useRef<HTMLInputElement>(null);
  const { toast }              = useToast();

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setBusy(true);

    try {
      const res  = await apiRequest("POST", "/api/admin/assistant", {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      });
      const data = await res.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.reply || "تم.", actions: data.actions || [] },
      ]);

      const mutated = (data.actions || []).some((a: Action) =>
        ["create_product", "update_product_stock", "update_order_status"].includes(a.tool)
      );
      if (mutated) {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      }
    } catch (err: any) {
      const isArabic = /[\u0600-\u06ff]/.test(text);
      toast({
        title: isArabic ? "تعذّر الاتصال" : "Connection issue",
        description: err.message || (isArabic ? "تعذّر التواصل مع المساعد" : "Could not reach the assistant"),
        variant: "destructive",
      });
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: /[\u0600-\u06ff]/.test(text)
            ? "عذراً، تعذّر الاتصال بالمساعد الآن. حاول مجدداً بعد لحظات."
            : "Sorry, couldn't reach the assistant. Please try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ── Side tab trigger (rectangular, left edge) ─────────────────── */}
      <AnimatePresence>
        {visible && !open && (
          <motion.button
            key="tab"
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: -80, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            onClick={() => setOpen(true)}
            data-testid="button-open-assistant"
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-1.5
                       bg-gradient-to-b from-[#6B3F2A] to-[#243154]
                       border border-amber-400/30 border-l-0
                       rounded-r-2xl px-2.5 py-4 shadow-2xl
                       hover:from-[#7a4830] hover:to-[#2d3d63]
                       active:scale-95 transition-all group"
          >
            {/* Glow */}
            <span className="absolute inset-0 rounded-r-2xl bg-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <Sparkles className="w-4 h-4 text-amber-300 relative z-10" />

            {/* Vertical text */}
            <span
              className="relative z-10 text-[10px] font-black tracking-widest text-white/80
                         uppercase leading-none"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              لمسة AI
            </span>

            <Wand2 className="w-3.5 h-3.5 text-amber-400 relative z-10" />

            {/* Pulse dot */}
            <span className="relative z-10 w-2 h-2 rounded-full bg-amber-400 animate-pulse mt-0.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── "أظهر" mini button when tab is hidden ─────────────────────── */}
      <AnimatePresence>
        {!visible && !open && (
          <motion.button
            key="show-btn"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: -60, opacity: 0 }}
            onClick={() => setVisible(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-[60]
                       bg-[#243154]/80 backdrop-blur-md
                       rounded-r-xl px-2 py-3 shadow-lg
                       flex items-center gap-1 text-[9px] font-bold text-white/60
                       hover:text-white hover:bg-[#243154] transition-all"
          >
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Side panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (semi-transparent, click to close) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px]"
            />

            {/* Panel — slides in from the left */}
            <motion.div
              key="panel"
              dir="rtl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{    x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              data-testid="dialog-assistant"
              className="fixed left-0 top-0 bottom-0 z-[100]
                         w-full sm:w-[420px]
                         bg-white flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-[#6B3F2A] via-[#243154] to-[#6B3F2A]
                              px-5 py-4 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600
                                  flex items-center justify-center shadow-lg shrink-0">
                    <Sparkles className="w-5 h-5 text-[#6B3F2A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm tracking-tight">لمسة 🌸</h3>
                    <p className="text-[11px] text-amber-200/80 font-medium truncate">
                      مساعدة الموظفين الذكية — تنفّذ الأوامر مباشرة
                    </p>
                  </div>

                  {/* Hide tab button */}
                  <button
                    onClick={() => { setOpen(false); setVisible(false); }}
                    title="إخفاء المساعد"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                               flex items-center justify-center transition-colors shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Close button */}
                  <button
                    onClick={() => setOpen(false)}
                    data-testid="button-close-assistant"
                    title="إغلاق"
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
                               flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-5 space-y-4
                           bg-gradient-to-b from-stone-50 via-white to-stone-50"
              >
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center
                                    w-14 h-14 rounded-2xl
                                    bg-gradient-to-br from-amber-100 to-amber-200 mb-4">
                      <Bot className="w-6 h-6 text-amber-700" />
                    </div>
                    <h4 className="font-black text-base text-stone-900 mb-1">مرحباً 👋</h4>
                    <p className="text-[12px] text-stone-500 mb-5 max-w-xs mx-auto leading-relaxed">
                      أنا لمسة. اطلب مني إنشاء منتج، البحث في الطلبات،
                      إرسال إيميل لعميل، تحديث مخزون، وأكثر.
                    </p>
                    <div className="grid gap-2 text-right">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => send(s)}
                          data-testid={`button-suggestion-${i}`}
                          className="px-3 py-2.5 rounded-xl bg-white border border-stone-200
                                     hover:border-amber-300 hover:bg-amber-50/50
                                     text-[12px] text-stone-700 font-medium text-right
                                     transition-all active:scale-[0.98]"
                        >
                          ✨ {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}

                {busy && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-stone-100 max-w-[75%]">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-amber-500"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">لمسة تفكر…</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="p-3 border-t border-stone-200 bg-white shrink-0"
              >
                <div className="flex gap-2 items-center">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اطلب شيئاً… مثلاً: أنشئ منتج بسعر 95 ريال"
                    disabled={busy}
                    data-testid="input-assistant-message"
                    className="flex-1 rounded-xl border-stone-200 focus-visible:ring-amber-400 h-10 text-[13px]"
                  />
                  <Button
                    type="submit"
                    disabled={busy || !input.trim()}
                    data-testid="button-send-assistant"
                    className="rounded-xl h-10 w-10 p-0 bg-gradient-to-br from-[#6B3F2A] to-[#243154] hover:opacity-90 shrink-0"
                  >
                    {busy
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-stone-200 text-stone-700"
            : "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md"
        }`}
      >
        {isUser
          ? <UserIcon className="w-3.5 h-3.5" />
          : <Sparkles className="w-3.5 h-3.5" />}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : "text-right"}`}>
        <div
          className={`inline-block px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
            isUser
              ? "bg-[#6B3F2A] text-white rounded-tr-sm"
              : "bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm"
          }`}
        >
          {msg.content}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {msg.actions.map((a, i) => (
              <ActionCard key={i} action={a} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActionCard({ action }: { action: Action }) {
  const tool = TOOL_LABELS[action.tool] || { ar: action.tool, icon: "⚙️" };
  const ok   = action.result?.ok !== false;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-3 py-2 rounded-xl border text-[11px] flex items-start gap-2 ${
        ok
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : "bg-rose-50 border-rose-200 text-rose-900"
      }`}
    >
      <span className="shrink-0 text-sm leading-none">{tool.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 font-bold">
          {ok
            ? <CheckCircle2 className="w-3 h-3" />
            : <AlertCircle  className="w-3 h-3" />}
          <span>{tool.ar}</span>
        </div>
        {action.result?.message && (
          <p className="mt-0.5 text-[10.5px] opacity-80 leading-relaxed">{action.result.message}</p>
        )}
        {action.result?.error && (
          <p className="mt-0.5 text-[10.5px] opacity-80 leading-relaxed">{action.result.error}</p>
        )}
        {action.result?.count !== undefined && (
          <p className="mt-0.5 text-[10.5px] opacity-70">{action.result.count} نتيجة</p>
        )}
      </div>
    </motion.div>
  );
}
