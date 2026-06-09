import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  RefreshCw, Bell, LogOut, Eye, EyeOff, Printer,
  X, CheckCircle, Clock, AlertTriangle, Maximize2,
  Package, ChefHat, Zap,
} from "lucide-react";
import {
  thermalPrint,
  buildEscPosKitchenTicketBitmap,
  loadPrinterSettings,
} from "@/lib/thermal-printer";
import PrinterSettingsPanel from "@/components/PrinterSettingsPanel";

const PREP_PIN    = "123456";
const STORAGE_KEY = "fuji_prep_auth";
const AUTO_PRINT_KEY = "fuji_auto_print";
const SOUND_KEY   = "fuji_prep_sound";

/** Fetch helper that injects the X-Prep-Pin header */
function prepFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-prep-pin": PREP_PIN, ...(opts.headers || {}) },
  });
}

/* ── Status registry ────────────────────────────────────────────── */
const STATUS = {
  new:        { ar: "جديد",          en: "New",      col: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", ring: "ring-blue-400"  },
  processing: { ar: "يُحضَّر",       en: "Preparing", col: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", ring: "ring-amber-400" },
  ready:      { ar: "جاهز",          en: "Ready",    col: "#059669", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981", ring: "ring-emerald-400"},
  delivered:  { ar: "تم التسليم",    en: "Done",     col: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF", ring: ""               },
} as const;

const NEXT_STATUS: Record<string, string>  = { new: "processing", processing: "ready", ready: "delivered" };
const NEXT_LABEL:  Record<string, string>  = { new: "⚡ بدء التحضير", processing: "✅ جاهز للاستلام", ready: "📦 تم التسليم" };
const NEXT_BTN:    Record<string, string>  = {
  new:        "bg-blue-600 hover:bg-blue-500  text-white",
  processing: "bg-amber-500 hover:bg-amber-400 text-white",
  ready:      "bg-emerald-600 hover:bg-emerald-500 text-white",
};

/* ── Time formatting ────────────────────────────────────────────── */
function elapsed(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)  return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  return `${Math.floor(s / 3600)}س ${Math.floor((s % 3600) / 60)}د`;
}
function isOld(d: string, mins = 15) {
  return (Date.now() - new Date(d).getTime()) > mins * 60_000;
}
function isVeryOld(d: string, mins = 30) {
  return (Date.now() - new Date(d).getTime()) > mins * 60_000;
}

/* ── Browser fallback receipt ────────────────────────────────────── */
function printBrowserFallback(order: any) {
  const paperMm = (Number(localStorage.getItem("fuji-printer-paper-width")?.replace("mm","")) || 80) as 58 | 80;
  const w = window.open("", "_blank", `width=${paperMm === 58 ? 260 : 350},height=700`);
  if (!w) return;
  const items = (order.items || [])
    .map((it: any) => `<tr><td>${it.quantity}×</td><td style="padding:0 0 0 4px;width:100%">${it.title}${it.size ? ` (${it.size})` : ""}</td></tr>`)
    .join("");
  w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>
    @page{margin:0;size:${paperMm}mm auto;}body{font-family:"Courier New",monospace;font-size:${paperMm===58?"11px":"13px"};width:${paperMm}mm;padding:4mm 3mm;direction:rtl;color:#000;}
    .c{text-align:center;}.b{font-weight:700;}.hr{border-top:1px dashed #555;margin:4px 0;}table{width:100%;border-collapse:collapse;}
    @media print{.np{display:none!important;}}
  </style></head><body>
  <div class="c b" style="font-size:${paperMm===58?"20px":"26px"}">فوجي كافيه</div>
  <div class="c" style="font-size:9px;letter-spacing:.3em">FUJI CAFE</div>
  <div class="hr"></div>
  <div class="c b" style="font-size:${paperMm===58?"15px":"18px"}">#${order.orderRef || String(order._id||order.id||"").slice(-5)}</div>
  <div class="c" style="font-size:9px">${new Date(order.createdAt||Date.now()).toLocaleString("ar-SA",{hour:"2-digit",minute:"2-digit",day:"numeric",month:"short"})}</div>
  <div class="hr"></div>
  <table>${items}</table>
  <div class="hr"></div>
  ${order.customerName?`<div class="b">${order.customerName}</div>`:""}
  ${order.notes?`<div>📝 ${order.notes}</div>`:""}
  <div class="hr"></div>
  <div class="c np" style="margin-top:8px"><button onclick="window.print()" style="padding:8px 20px;background:#1a0f0a;color:#fff;border:0;font-size:12px;cursor:pointer;border-radius:6px;">🖨 طباعة</button></div>
  </body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}

/* ── Audio beep ─────────────────────────────────────────────────── */
function beep(freq = 880, dur = 0.4) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
}

/* ══════════════════════════════════════════════════════════════════
   PIN LOCK SCREEN
══════════════════════════════════════════════════════════════════ */
function PinLock({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const submit = () => {
    if (pin === PREP_PIN) { sessionStorage.setItem(STORAGE_KEY, "1"); onSuccess(); }
    else {
      setShake(true); beep(300, 0.3);
      setTimeout(() => { setShake(false); setPin(""); inputRef.current?.focus(); }, 700);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0805]" dir="rtl">
      {/* Logo area */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#E8637A] to-[#a08a52] opacity-20 blur-xl" />
          <div className="relative w-24 h-24 rounded-3xl border border-[#E8637A]/30 bg-[#1a0f0a] flex items-center justify-center shadow-2xl">
            <ChefHat className="h-12 w-12 text-[#E8637A]" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">شاشة تحضير الطلب</h1>
        <p className="text-sm text-white/30 font-bold mt-1 tracking-widest uppercase">Fuji Cafe · Order Prep</p>
      </div>

      {/* PIN input */}
      <div className={`w-full max-w-xs px-4 transition-transform ${shake ? "animate-bounce" : ""}`}>
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type={showPin ? "text" : "password"}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="● ● ● ● ● ●"
            maxLength={10}
            inputMode="numeric"
            autoComplete="off"
            data-testid="input-prep-pin"
            className={`w-full h-16 bg-white/5 border-2 rounded-2xl text-center text-2xl font-black tracking-[0.5em] text-white placeholder:text-white/15 outline-none transition-all ${
              shake ? "border-red-500 bg-red-900/20" : "border-white/10 focus:border-[#E8637A]/70"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin(v => !v)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
          >
            {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {shake && <p className="text-center text-red-400 text-sm font-bold mb-3">رمز خاطئ</p>}
        <button
          onClick={submit}
          disabled={pin.length < 4}
          data-testid="button-prep-login"
          className="w-full h-14 rounded-2xl font-black text-sm bg-gradient-to-l from-[#E8637A] to-[#c8442a] text-white shadow-lg shadow-[#E8637A]/20 transition-all hover:shadow-[#E8637A]/40 disabled:opacity-25 disabled:shadow-none active:scale-[0.98]"
        >
          دخول
        </button>
      </div>

      {/* Decorative footer */}
      <p className="mt-12 text-[10px] text-white/15 font-bold tracking-widest uppercase">fuji.cafe · Prep Station</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRINTER SETTINGS MODAL
══════════════════════════════════════════════════════════════════ */
function PrinterModal({
  onClose, soundOn, setSoundOn,
}: {
  onClose: () => void;
  soundOn: boolean; setSoundOn: (v: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm pt-4 pb-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 bg-[#0d0805] border border-[#E8637A]/20 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0d0805] z-10">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-[#E8637A]" />
            <span className="font-black text-white text-sm">إعدادات الطابعة</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="h-3.5 w-3.5 text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sound toggle */}
          <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3.5">
            <div>
              <p className="font-black text-sm text-white">صوت التنبيه</p>
              <p className="text-[11px] text-white/40 font-bold">تنبيه صوتي عند الطلبات الجديدة</p>
            </div>
            <button
              onClick={() => { const v = !soundOn; setSoundOn(v); localStorage.setItem(SOUND_KEY, v ? "1" : "0"); if (v) beep(); }}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${soundOn ? "bg-[#E8637A]" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${soundOn ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Full printer settings panel */}
          <PrinterSettingsPanel />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ORDER CARD
══════════════════════════════════════════════════════════════════ */
function OrderCard({ order, onStatus, onPrint }: {
  order: any;
  onStatus: (id: string, s: string) => void;
  onPrint: (order: any) => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const id  = order._id || order.id;
  const cfg = STATUS[order.status as keyof typeof STATUS] || STATUS.new;
  const old = isOld(order.createdAt);
  const veryOld = isVeryOld(order.createdAt);
  const ref = order.orderRef || String(id).slice(-5);
  const isPickup = !order.shippingMethod || order.shippingMethod === "pickup";

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        veryOld ? "border-red-500/70 shadow-lg shadow-red-900/30" :
        old      ? "border-amber-400/50" :
        order.status === "new" ? "border-blue-400/60 shadow-md shadow-blue-900/20" :
        "border-white/10"
      }`}
      style={{ background: order.status === "new" ? "rgba(30,20,50,0.95)" : "rgba(26,15,10,0.95)" }}
      data-testid={`card-order-${id}`}
    >
      {/* Age warning stripe */}
      {veryOld && (
        <div className="bg-red-600 text-white text-[9px] font-black text-center py-0.5 tracking-widest uppercase flex items-center justify-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" /> تأخير — فوق ٣٠ دقيقة
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${veryOld ? "bg-red-400 animate-ping" : old ? "bg-amber-400 animate-pulse" : "bg-current animate-pulse"}`} style={{ color: cfg.dot }} />
          <span className="font-black text-xs uppercase tracking-widest truncate" style={{ color: cfg.col }}>
            {cfg.ar}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${veryOld ? "text-red-400" : old ? "text-amber-400" : "text-white/30"}`}>
            <Clock className="h-2.5 w-2.5" />{elapsed(order.createdAt)}
          </span>
          <span className="font-black text-xs text-white/70">#{ref}</span>
        </div>
      </div>

      {/* Customer */}
      <div className="px-3.5 pb-2 border-b border-white/5">
        <p className="font-black text-sm text-white leading-tight">{order.customerName || "زبون"}</p>
        {order.customerPhone && (
          <p className="text-[10px] text-white/30 font-bold" dir="ltr">{order.customerPhone}</p>
        )}
      </div>

      {/* Items */}
      <div className="px-3.5 py-2.5 flex-1 space-y-1.5">
        {(order.items || []).map((it: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-xs font-black text-white/60">
              {it.quantity}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white leading-tight">{it.title}</p>
              {it.size && <p className="text-[10px] text-white/30 font-bold">{it.size}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mx-3 mb-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          <p className="text-[11px] font-bold text-amber-300">📝 {order.notes}</p>
        </div>
      )}

      {/* Pickup badge */}
      {isPickup && (
        <div className="mx-3 mb-2.5 flex items-center gap-1.5">
          <Package className="h-3 w-3 text-white/25 shrink-0" />
          <span className="text-[10px] text-white/25 font-bold">استلام من الفرع</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        {/* Print button */}
        <button
          onClick={() => onPrint(order)}
          data-testid={`button-print-${id}`}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shrink-0"
          title="طباعة"
        >
          <Printer className="h-3.5 w-3.5 text-white/40" />
        </button>

        {/* Status advance */}
        {NEXT_STATUS[order.status] && (
          <button
            onClick={() => onStatus(id, NEXT_STATUS[order.status])}
            data-testid={`button-status-${id}`}
            className={`flex-1 h-9 rounded-xl font-black text-[11px] transition-all active:scale-[0.98] ${NEXT_BTN[order.status]}`}
          >
            {NEXT_LABEL[order.status]}
          </button>
        )}
        {order.status === "delivered" && (
          <div className="flex-1 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-emerald-500/40" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PREP SCREEN
══════════════════════════════════════════════════════════════════ */
export default function PrepScreen() {
  const [authed,     setAuthed]     = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [soundOn,    setSoundOn]    = useState(() => localStorage.getItem(SOUND_KEY) !== "0");
  const [printerOpen,setPrinterOpen]= useState(false);
  const [newAlert,   setNewAlert]   = useState(false);
  const [isFullscreen, setFullscreen]= useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const prevNewCount = useRef(0);
  const printedRef   = useRef(new Set<string>());
  const [tick, setTick] = useState(0);

  /* ── Thermal print (Canvas bitmap → ESC/POS) ─────── */
  const handlePrint = useCallback(async (order: any) => {
    try {
      const settings = loadPrinterSettings();
      const pw = settings.paperWidth || '80mm';
      const escData = await buildEscPosKitchenTicketBitmap({
        orderNumber: order.orderRef || String(order._id || order.id || '').slice(-5),
        cashierName: order.customerName || 'زبون',
        orderType: order.shippingMethod === 'pickup' ? 'استلام من الفرع' : 'توصيل',
        items: (order.items || []).map((it: any) => ({
          name: it.title || it.name || '',
          qty: Number(it.quantity) || 1,
          addons: it.size ? [it.size] : undefined,
        })),
        notes: order.notes,
        paperWidth: pw,
      });
      const result = await thermalPrint(escData, '', pw);
      if (!result.success && result.mode === 'browser') {
        printBrowserFallback(order);
      }
    } catch (err) {
      console.error('[Kitchen Print]', err);
      printBrowserFallback(order);
    }
  }, []);

  // Refresh elapsed timers every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const { data: orders = [], isFetching, refetch } = useQuery<any[]>({
    queryKey: ["/api/prep/orders"],
    queryFn: async () => {
      const res = await prepFetch("/api/prep/orders");
      if (!res.ok) return [];
      const raw = await res.json();
      return (raw.orders || raw || []);
    },
    enabled: authed,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  // New order detection + sound + auto-print
  useEffect(() => {
    const newOrders = orders.filter((o: any) => o.status === "new");
    const count = newOrders.length;
    if (prevNewCount.current > 0 && count > prevNewCount.current) {
      setNewAlert(true);
      setTimeout(() => setNewAlert(false), 4000);
      if (soundOn) { beep(880, 0.25); setTimeout(() => beep(1100, 0.2), 300); }
    }
    const autoPrint = loadPrinterSettings().autoPrint;
    if (autoPrint) {
      newOrders.forEach((o: any) => {
        const id = o._id || o.id;
        if (!printedRef.current.has(id)) {
          printedRef.current.add(id);
          if (prevNewCount.current > 0) handlePrint(o);
        }
      });
    }
    prevNewCount.current = count;
  }, [orders, soundOn, handlePrint]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await prepFetch(`/api/prep/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل تحديث الحالة");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prep/orders"] });
      refetch();
      setLastRefresh(new Date());
      if (soundOn) beep(660, 0.15);
    },
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!authed) return <PinLock onSuccess={() => setAuthed(true)} />;

  const newOrders  = orders.filter((o: any) => o.status === "new");
  const prepOrders = orders.filter((o: any) => o.status === "processing");
  const readyOrders= orders.filter((o: any) => o.status === "ready");

  const filtered = statusFilter === "all"
    ? orders
    : orders.filter((o: any) => o.status === statusFilter);

  const COLS = [
    { key: "new",        label: "جديد",          count: newOrders.length,   color: "#3B82F6", icon: Zap     },
    { key: "processing", label: "يُحضَّر",        count: prepOrders.length,  color: "#F59E0B", icon: ChefHat },
    { key: "ready",      label: "جاهز للاستلام",  count: readyOrders.length, color: "#10B981", icon: CheckCircle },
  ];

  const avgWait = (() => {
    if (!orders.length) return null;
    const total = orders.reduce((s: number, o: any) => s + (Date.now() - new Date(o.createdAt).getTime()), 0);
    return Math.round(total / orders.length / 60_000);
  })();

  return (
    <div className="min-h-screen bg-[#0d0805] flex flex-col" dir="rtl">
      {printerOpen && (
        <PrinterModal
          onClose={() => setPrinterOpen(false)}
          soundOn={soundOn} setSoundOn={setSoundOn}
        />
      )}

      {/* ── TOP BAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 bg-[#0d0805]/95 border-b border-white/5 backdrop-blur-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#E8637A]/15 border border-[#E8637A]/25 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-[#E8637A]" />
          </div>
          <div className="hidden sm:block">
            <p className="font-black text-sm text-white leading-none">شاشة تحضير الطلب</p>
            <p className="text-[9px] text-white/25 font-bold tracking-widest uppercase">Fuji Cafe · Prep Station</p>
          </div>
        </div>

        {/* Stats pills — desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          {COLS.map(c => (
            <div key={c.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[10px] font-bold text-white/40">{c.label}</span>
              <span className="text-sm font-black text-white/80">{c.count}</span>
            </div>
          ))}
          {avgWait !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <Clock className="h-3 w-3 text-white/30" />
              <span className="text-[10px] font-bold text-white/40">متوسط الانتظار</span>
              <span className="text-sm font-black text-white/80">{avgWait}د</span>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {newAlert && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-black animate-bounce">
              <Bell className="h-3 w-3" /> طلب جديد!
            </div>
          )}
          <div className="flex items-center gap-1 text-[9px] text-white/20 font-bold hidden sm:flex">
            <div className={`w-1.5 h-1.5 rounded-full ${isFetching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            {lastRefresh.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={() => { refetch(); setLastRefresh(new Date()); }} disabled={isFetching} className="icon-btn">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-amber-400" : "text-white/40"}`} />
          </button>
          <button
            onClick={() => setPrinterOpen(true)}
            className="icon-btn relative"
            title="إعدادات الطابعة"
          >
            <Printer className="h-3.5 w-3.5 text-white/40" />
            {loadPrinterSettings().mode !== 'browser' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#E8637A] rounded-full border border-[#0d0805]" />
            )}
          </button>
          <button onClick={toggleFullscreen} className="icon-btn hidden sm:flex" title="شاشة كاملة">
            <Maximize2 className="h-3.5 w-3.5 text-white/40" />
          </button>
          <button onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); }} className="icon-btn hover:!bg-red-900/30" title="خروج">
            <LogOut className="h-3.5 w-3.5 text-white/25" />
          </button>
        </div>
      </header>

      {/* ── STATUS FILTER TABS ──────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 overflow-x-auto">
        {[{ key: "all", label: "الكل", count: orders.length }, ...COLS.map(c => ({ key: c.key, label: c.label, count: c.count }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              statusFilter === tab.key
                ? "bg-[#E8637A]/15 border border-[#E8637A]/30 text-[#E8637A]"
                : "bg-white/5 border border-transparent text-white/30 hover:text-white/50"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? "bg-[#E8637A]/20 text-[#E8637A]" : "bg-white/5 text-white/20"
            }`}>{tab.count}</span>
          </button>
        ))}
        {/* Mobile stats */}
        <div className="flex md:hidden items-center gap-1 mr-auto text-[10px] text-white/25 font-bold shrink-0">
          <Clock className="h-3 w-3" />
          {avgWait !== null ? `${avgWait}د` : "--"}
        </div>
      </div>

      {/* ── ORDERS AREA ─────────────────────────────────── */}
      <main className="flex-1 p-3 md:p-4">
        {orders.length === 0 && !isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-900/30 border border-emerald-500/20 flex items-center justify-center mb-5">
              <CheckCircle className="h-10 w-10 text-emerald-500/50" />
            </div>
            <p className="font-black text-white/60 text-xl">المطبخ هادئ</p>
            <p className="text-sm text-white/25 font-bold mt-2">لا توجد طلبات نشطة · ستظهر تلقائياً</p>
          </div>
        ) : statusFilter !== "all" ? (
          /* Single-status flat grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((o: any) => (
              <OrderCard
                key={o._id || o.id}
                order={o}
                onStatus={(id, s) => updateStatus.mutate({ id, status: s })}
                onPrint={handlePrint}
              />
            ))}
          </div>
        ) : (
          /* Kanban 3-column view */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {COLS.map(col => {
              const colOrders = orders.filter((o: any) => o.status === col.key);
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <col.icon className="h-4 w-4" style={{ color: col.color }} />
                      <span className="font-black text-sm text-white/70">{col.label}</span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ background: col.color + "22", color: col.color }}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {colOrders.length === 0 ? (
                    <div className="h-24 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center">
                      <span className="text-xs text-white/15 font-bold">لا توجد طلبات</span>
                    </div>
                  ) : (
                    colOrders.map((o: any) => (
                      <OrderCard
                        key={o._id || o.id}
                        order={o}
                        onStatus={(id, s) => updateStatus.mutate({ id, status: s })}
                        onPrint={handlePrint}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Tailwind utility for icon buttons */}
      <style>{`.icon-btn{display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:.75rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);transition:all .15s;cursor:pointer;}.icon-btn:hover{background:rgba(255,255,255,0.08);}.icon-btn:active{transform:scale(.92);}`}</style>
    </div>
  );
}
