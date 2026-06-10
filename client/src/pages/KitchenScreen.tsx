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

function prepFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-prep-pin": PREP_PIN, ...(opts.headers || {}) },
  });
}

const STATUS = {
  new:        { ar: "جديد",        en: "New",      col: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", ring: "ring-blue-400"   },
  processing: { ar: "يُحضَّر",     en: "Preparing", col: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B", ring: "ring-amber-400"  },
  ready:      { ar: "جاهز",        en: "Ready",    col: "#059669", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981", ring: "ring-emerald-400" },
  delivered:  { ar: "تم التسليم",  en: "Done",     col: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", dot: "#9CA3AF", ring: ""                },
} as const;

const NEXT_STATUS: Record<string, string> = { new: "processing", processing: "ready", ready: "delivered" };
const NEXT_LABEL:  Record<string, string> = { new: "⚡ بدء التحضير", processing: "✅ جاهز للاستلام", ready: "📦 تم التسليم" };
const NEXT_BTN:    Record<string, string> = {
  new:        "bg-blue-600 hover:bg-blue-500  text-white",
  processing: "bg-amber-500 hover:bg-amber-400 text-white",
  ready:      "bg-emerald-600 hover:bg-emerald-500 text-white",
};

function elapsed(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  return `${Math.floor(s / 3600)}س ${Math.floor((s % 3600) / 60)}د`;
}
function isOld(d: string, mins = 15) {
  return (Date.now() - new Date(d).getTime()) > mins * 60_000;
}
function isVeryOld(d: string, mins = 30) {
  return (Date.now() - new Date(d).getTime()) > mins * 60_000;
}

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
  w.document.close(); w.focus();
  setTimeout(() => w.print(), 350);
}

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

/* ── Floating Beans for light background ───────────────────────── */
const BEAN_IMGS = ["/beans/bean1.png","/beans/bean2.png","/beans/bean3.png","/beans/bean4.png","/beans/bean5.png","/beans/bean6.png"];
const KITCHEN_BEANS = [
  { id:"kb0", x:1,   size:64, dur:24, delay:0,  opacity:0.18, rotate:-15, img:0 },
  { id:"kb1", x:95,  size:52, dur:20, delay:4,  opacity:0.16, rotate:40,  img:2 },
  { id:"kb2", x:4,   size:42, dur:28, delay:9,  opacity:0.14, rotate:20,  img:4 },
  { id:"kb3", x:92,  size:58, dur:22, delay:14, opacity:0.18, rotate:-55, img:1 },
  { id:"kb4", x:2,   size:46, dur:26, delay:18, opacity:0.13, rotate:70,  img:3 },
  { id:"kb5", x:96,  size:38, dur:21, delay:6,  opacity:0.15, rotate:-30, img:5 },
  { id:"kb6", x:7,   size:32, dur:18, delay:22, opacity:0.12, rotate:90,  img:2 },
  { id:"kb7", x:89,  size:48, dur:25, delay:11, opacity:0.16, rotate:10,  img:0 },
  { id:"kb8", x:48,  size:28, dur:30, delay:15, opacity:0.08, rotate:45,  img:3 },
  { id:"kb9", x:55,  size:22, dur:19, delay:8,  opacity:0.07, rotate:-20, img:5 },
];

function KitchenFloatingBeans() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      {KITCHEN_BEANS.map((b) => (
        <div
          key={b.id}
          className="fuji-bean absolute"
          style={{
            left: `${b.x}%`,
            bottom: "-80px",
            width: b.size,
            height: b.size,
            opacity: b.opacity,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <img
            src={BEAN_IMGS[b.img]}
            alt=""
            draggable={false}
            style={{
              width: "100%", height: "100%", objectFit: "contain",
              transform: `rotate(${b.rotate}deg)`,
              filter: "drop-shadow(0 2px 10px rgba(107,63,42,0.45)) sepia(20%)",
            }}
          />
        </div>
      ))}
    </div>
  );
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F4EF] relative overflow-hidden" dir="rtl">
      <KitchenFloatingBeans />

      <div className="relative z-10 mb-10 text-center">
        {/* Coffee ring decoration */}
        <div className="relative mx-auto w-28 h-28 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/60 to-amber-100/40 blur-2xl" />
          <div className="relative w-28 h-28 rounded-full bg-white shadow-xl border border-amber-200/60 flex items-center justify-center overflow-hidden">
            <img
              src="/fuji-logo-transparent.png"
              alt="Fuji Cafe"
              className="w-20 h-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-amber-800 text-4xl font-black">藤</div>';
              }}
            />
          </div>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">شاشة تحضير الطلب</h1>
        <p className="text-sm text-amber-700/70 font-bold mt-1.5 tracking-widest uppercase">Fuji Cafe · Order Prep</p>
      </div>

      <div className={`relative z-10 w-full max-w-xs px-4 transition-transform ${shake ? "animate-bounce" : ""}`}>
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
            className={`w-full h-16 bg-white border-2 rounded-2xl text-center text-2xl font-black tracking-[0.5em] text-gray-900 placeholder:text-gray-300 outline-none shadow-sm transition-all ${
              shake ? "border-red-400 bg-red-50" : "border-amber-200 focus:border-amber-400"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPin(v => !v)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {shake && <p className="text-center text-red-500 text-sm font-bold mb-3">رمز خاطئ</p>}
        <button
          onClick={submit}
          disabled={pin.length < 4}
          data-testid="button-prep-login"
          className="w-full h-14 rounded-2xl font-black text-sm bg-gradient-to-l from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-200 transition-all hover:shadow-amber-300 hover:from-amber-700 hover:to-amber-600 disabled:opacity-30 disabled:shadow-none active:scale-[0.98]"
        >
          دخول
        </button>
      </div>

      <p className="relative z-10 mt-12 text-[10px] text-amber-600/40 font-bold tracking-widest uppercase">fuji.cafe · Prep Station</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRINTER SETTINGS MODAL
══════════════════════════════════════════════════════════════════ */
function PrinterModal({
  onClose, soundOn, setSoundOn,
}: { onClose: () => void; soundOn: boolean; setSoundOn: (v: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-4 pb-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 bg-white border border-amber-100 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-amber-600" />
            <span className="font-black text-gray-900 text-sm">إعدادات الطابعة</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-100">
            <div>
              <p className="font-black text-sm text-gray-900">صوت التنبيه</p>
              <p className="text-[11px] text-gray-500 font-bold">تنبيه صوتي عند الطلبات الجديدة</p>
            </div>
            <button
              onClick={() => { const v = !soundOn; setSoundOn(v); localStorage.setItem(SOUND_KEY, v ? "1" : "0"); if (v) beep(); }}
              className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${soundOn ? "bg-amber-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${soundOn ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
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

  const id   = order._id || order.id;
  const cfg  = STATUS[order.status as keyof typeof STATUS] || STATUS.new;
  const old  = isOld(order.createdAt);
  const veryOld = isVeryOld(order.createdAt);
  const ref  = order.orderRef || String(id).slice(-5);
  const isPickup = !order.shippingMethod || order.shippingMethod === "pickup";

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border-2 shadow-sm transition-all duration-300 bg-white ${
        veryOld ? "border-red-400 shadow-red-100" :
        old      ? "border-amber-300 shadow-amber-50" :
        order.status === "new" ? "border-blue-300 shadow-blue-50" :
        "border-gray-200"
      }`}
      data-testid={`card-order-${id}`}
    >
      {/* Status colour top bar */}
      <div className="h-1.5 w-full" style={{ background: cfg.col, opacity: 0.7 }} />

      {/* Age warning stripe */}
      {veryOld && (
        <div className="bg-red-500 text-white text-[9px] font-black text-center py-0.5 tracking-widest uppercase flex items-center justify-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5" /> تأخير — فوق ٣٠ دقيقة
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${veryOld ? "bg-red-400 animate-ping" : old ? "bg-amber-400 animate-pulse" : "animate-pulse"}`}
            style={{ background: veryOld ? undefined : old ? undefined : cfg.dot }}
          />
          <span className="font-black text-xs uppercase tracking-widest truncate" style={{ color: cfg.col }}>
            {cfg.ar}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${veryOld ? "text-red-500" : old ? "text-amber-600" : "text-gray-400"}`}>
            <Clock className="h-2.5 w-2.5" />{elapsed(order.createdAt)}
          </span>
          <span className="font-black text-xs text-gray-600">#{ref}</span>
        </div>
      </div>

      {/* Customer */}
      <div className="px-3.5 pb-2 border-b border-gray-100">
        <p className="font-black text-sm text-gray-900 leading-tight">{order.customerName || "زبون"}</p>
        {order.customerPhone && (
          <p className="text-[10px] text-gray-400 font-bold" dir="ltr">{order.customerPhone}</p>
        )}
      </div>

      {/* Items */}
      <div className="px-3.5 py-2.5 flex-1 space-y-1.5">
        {(order.items || []).map((it: any, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 text-xs font-black text-gray-500">
              {it.quantity}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-800 leading-tight">{it.title}</p>
              {it.size && <p className="text-[10px] text-gray-400 font-bold">{it.size}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mx-3 mb-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-[11px] font-bold text-amber-700">📝 {order.notes}</p>
        </div>
      )}

      {/* Pickup badge */}
      {isPickup && (
        <div className="mx-3 mb-2.5 flex items-center gap-1.5">
          <Package className="h-3 w-3 text-gray-300 shrink-0" />
          <span className="text-[10px] text-gray-400 font-bold">استلام من الفرع</span>
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        <button
          onClick={() => onPrint(order)}
          data-testid={`button-print-${id}`}
          className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shrink-0"
          title="طباعة"
        >
          <Printer className="h-3.5 w-3.5 text-gray-400" />
        </button>

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
          <div className="flex-1 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
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
  const [authed,      setAuthed]      = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [soundOn,     setSoundOn]     = useState(() => localStorage.getItem(SOUND_KEY) !== "0");
  const [printerOpen, setPrinterOpen] = useState(false);
  const [newAlert,    setNewAlert]    = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const prevNewCount = useRef(0);
  const printedRef   = useRef(new Set<string>());
  const [tick, setTick] = useState(0);

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
      if (!result.success && result.mode === 'browser') { printBrowserFallback(order); }
    } catch (err) {
      console.error('[Kitchen Print]', err);
      printBrowserFallback(order);
    }
  }, []);

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

  const newOrders   = orders.filter((o: any) => o.status === "new");
  const prepOrders  = orders.filter((o: any) => o.status === "processing");
  const readyOrders = orders.filter((o: any) => o.status === "ready");

  const filtered = statusFilter === "all" ? orders : orders.filter((o: any) => o.status === statusFilter);

  const COLS = [
    { key: "new",        label: "جديد",          count: newOrders.length,   color: "#2563EB", icon: Zap         },
    { key: "processing", label: "يُحضَّر",        count: prepOrders.length,  color: "#D97706", icon: ChefHat     },
    { key: "ready",      label: "جاهز للاستلام",  count: readyOrders.length, color: "#059669", icon: CheckCircle },
  ];

  const avgWait = (() => {
    if (!orders.length) return null;
    const total = orders.reduce((s: number, o: any) => s + (Date.now() - new Date(o.createdAt).getTime()), 0);
    return Math.round(total / orders.length / 60_000);
  })();

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col relative" dir="rtl">
      <KitchenFloatingBeans />

      {printerOpen && (
        <PrinterModal onClose={() => setPrinterOpen(false)} soundOn={soundOn} setSoundOn={setSoundOn} />
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <header className="relative z-30 sticky top-0 flex items-center justify-between gap-2 px-4 py-3 bg-white/90 border-b border-amber-100 backdrop-blur-sm shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src="/fuji-logo-transparent.png"
              alt="Fuji Cafe"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-amber-800 font-black text-sm">藤</span>';
              }}
            />
          </div>
          <div className="hidden sm:block">
            <p className="font-black text-sm text-gray-900 leading-none">شاشة تحضير الطلب</p>
            <p className="text-[9px] text-amber-600/60 font-bold tracking-widest uppercase">Fuji Cafe · Prep Station</p>
          </div>
        </div>

        {/* Stats pills — desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          {COLS.map(c => (
            <div key={c.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[10px] font-bold text-gray-500">{c.label}</span>
              <span className="text-sm font-black text-gray-800">{c.count}</span>
            </div>
          ))}
          {avgWait !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500">متوسط الانتظار</span>
              <span className="text-sm font-black text-gray-800">{avgWait}د</span>
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
          <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold hidden sm:flex">
            <div className={`w-1.5 h-1.5 rounded-full ${isFetching ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            {lastRefresh.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={() => { refetch(); setLastRefresh(new Date()); }} disabled={isFetching} className="k-btn">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-amber-500" : "text-gray-400"}`} />
          </button>
          <button onClick={() => setPrinterOpen(true)} className="k-btn relative" title="إعدادات الطابعة">
            <Printer className="h-3.5 w-3.5 text-gray-400" />
            {loadPrinterSettings().mode !== 'browser' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button onClick={toggleFullscreen} className="k-btn hidden sm:flex" title="شاشة كاملة">
            <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); }}
            className="k-btn hover:!bg-red-50 hover:!border-red-200"
            title="خروج"
          >
            <LogOut className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* ── STATUS FILTER TABS ─────────────────────────────────── */}
      <div className="relative z-20 flex items-center gap-2 px-4 py-2.5 border-b border-amber-100 bg-white/70 backdrop-blur-sm overflow-x-auto">
        {[{ key: "all", label: "الكل", count: orders.length }, ...COLS.map(c => ({ key: c.key, label: c.label, count: c.count }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              statusFilter === tab.key
                ? "bg-amber-50 border border-amber-300 text-amber-700"
                : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"
            }`}>{tab.count}</span>
          </button>
        ))}
        <div className="flex md:hidden items-center gap-1 mr-auto text-[10px] text-gray-400 font-bold shrink-0">
          <Clock className="h-3 w-3" />
          {avgWait !== null ? `${avgWait}د` : "--"}
        </div>
      </div>

      {/* ── ORDERS AREA ─────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 p-3 md:p-4">
        {orders.length === 0 && !isFetching ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="font-black text-gray-600 text-xl">المطبخ هادئ</p>
            <p className="text-sm text-gray-400 font-bold mt-2">لا توجد طلبات نشطة · ستظهر تلقائياً</p>
          </div>
        ) : statusFilter !== "all" ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {COLS.map(col => {
              const colOrders = orders.filter((o: any) => o.status === col.key);
              return (
                <div key={col.key} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <col.icon className="h-4 w-4" style={{ color: col.color }} />
                      <span className="font-black text-sm text-gray-700">{col.label}</span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full border" style={{ background: col.color + "15", color: col.color, borderColor: col.color + "40" }}>
                      {colOrders.length}
                    </span>
                  </div>

                  {colOrders.length === 0 ? (
                    <div className="h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 flex items-center justify-center">
                      <span className="text-xs text-gray-300 font-bold">لا توجد طلبات</span>
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

      <style>{`.k-btn{display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:.75rem;background:#fff;border:1px solid #e5e7eb;transition:all .15s;cursor:pointer;}.k-btn:hover{background:#f9fafb;border-color:#d1d5db;}.k-btn:active{transform:scale(.92);}`}</style>
    </div>
  );
}
