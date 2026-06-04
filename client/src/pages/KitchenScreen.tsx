import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Coffee, RefreshCw, CheckCircle, Clock, Package, Bell, LogOut, Eye, EyeOff } from "lucide-react";

const KITCHEN_PIN = "123456";
const STORAGE_KEY = "fuji_kitchen_auth";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  new:        { label: "جديد",           color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",    dot: "bg-blue-500"   },
  processing: { label: "قيد التحضير",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  dot: "bg-amber-500"  },
  ready:      { label: "جاهز للاستلام",  color: "text-green-700",  bg: "bg-green-50 border-green-200",  dot: "bg-green-500"  },
  delivered:  { label: "تم التسليم",      color: "text-gray-500",   bg: "bg-gray-50 border-gray-200",    dot: "bg-gray-400"   },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} ث`;
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  return `${Math.floor(diff / 3600)} س`;
}

function PinLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === KITCHEN_PIN) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      onSuccess();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0f0a]" dir="rtl">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[#E8637A]/20 flex items-center justify-center mx-auto mb-4 border border-[#E8637A]/30">
            <Coffee className="h-10 w-10 text-[#E8637A]" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">شاشة المطبخ</h1>
          <p className="text-sm text-white/40 font-bold">فوجي كافيه</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="أدخل الرمز السري..."
              className={`w-full h-14 px-4 pr-12 rounded-2xl text-center text-xl font-black tracking-widest border-2 transition-all outline-none bg-white/5 text-white placeholder:text-white/20 ${
                error ? "border-red-500 bg-red-500/10 animate-pulse" : "border-white/10 focus:border-[#E8637A]/60"
              }`}
              inputMode="numeric"
              autoComplete="off"
              data-testid="input-kitchen-pin"
            />
            <button
              type="button"
              onClick={() => setShowPin(v => !v)}
              className="absolute top-1/2 -translate-y-1/2 left-4 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-center text-sm font-bold text-red-400">رمز خاطئ، حاول مرة أخرى</p>}
          <button
            type="submit"
            disabled={pin.length < 4}
            data-testid="button-kitchen-login"
            className="w-full h-14 rounded-2xl font-black text-sm bg-[#E8637A] text-white transition-all hover:bg-[#d44f66] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange }: { order: any; onStatusChange: (id: string, status: string) => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
  const isPickup = order.shippingMethod === "pickup" || !order.shippingMethod;

  const nextStatus: Record<string, string> = {
    new: "processing",
    processing: "ready",
    ready: "delivered",
  };

  const nextLabel: Record<string, string> = {
    new: "⚡ بدء التحضير",
    processing: "✅ جاهز",
    ready: "📦 تم التسليم",
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${cfg.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-current/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
          <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(order.createdAt)}
          </span>
          <span className="font-black text-sm text-gray-700">#{order.orderRef || order._id?.slice(-4)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="font-black text-sm text-gray-800 mb-1">{order.customerName || "زبون"}</p>
        {order.customerPhone && (
          <p className="text-xs text-gray-500 mb-2 font-bold" dir="ltr">{order.customerPhone}</p>
        )}

        {/* Items */}
        <div className="space-y-1 mb-3">
          {(order.items || []).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-bold shrink-0">×{item.quantity}</span>
              <span className="font-black text-gray-800 flex-1 text-right mx-2 truncate">{item.title}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-3">
            <p className="text-[11px] font-bold text-amber-700">📝 {order.notes}</p>
          </div>
        )}

        {/* Branch */}
        {isPickup && order.pickupBranch && (
          <div className="flex items-center gap-1.5 mb-3">
            <Package className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-500 font-bold">استلام من الفرع</span>
          </div>
        )}

        {/* Action button */}
        {nextStatus[order.status] && (
          <button
            onClick={() => onStatusChange(order._id || order.id, nextStatus[order.status])}
            data-testid={`button-order-status-${order._id || order.id}`}
            className={`w-full py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 ${
              order.status === "new"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : order.status === "processing"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }`}
          >
            {nextLabel[order.status]}
          </button>
        )}
      </div>
    </div>
  );
}

export default function KitchenScreen() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const prevCountRef = useRef<number>(0);
  const audioRef = useRef<AudioContext | null>(null);

  const { data: orders = [], isFetching, refetch } = useQuery<any[]>({
    queryKey: ["/api/kitchen/orders"],
    queryFn: async () => {
      const res = await fetch("/api/branch/orders?statuses=new,processing,ready&limit=50", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.orders || data || []).filter((o: any) =>
        ["new", "processing", "ready"].includes(o.status)
      );
    },
    enabled: authed,
    refetchInterval: 20000,
    staleTime: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل تحديث الحالة");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      refetch();
      setLastRefresh(new Date());
    },
  });

  // Notify on new orders
  useEffect(() => {
    const count = orders.filter((o: any) => o.status === "new").length;
    if (prevCountRef.current > 0 && count > prevCountRef.current) {
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 3000);
      // Simple beep via Web Audio API
      try {
        if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
    prevCountRef.current = count;
  }, [orders]);

  if (!authed) return <PinLogin onSuccess={() => setAuthed(true)} />;

  const newOrders = orders.filter((o: any) => o.status === "new");
  const processingOrders = orders.filter((o: any) => o.status === "processing");
  const readyOrders = orders.filter((o: any) => o.status === "ready");

  return (
    <div className="min-h-screen bg-[#FAF6F0]" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-[#1a0f0a] text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E8637A]/20 flex items-center justify-center">
            <Coffee className="h-4 w-4 text-[#E8637A]" />
          </div>
          <div>
            <p className="font-black text-sm">شاشة المطبخ</p>
            <p className="text-[10px] text-white/40">فوجي كافيه</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {newOrderAlert && (
            <div className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-1.5 rounded-full animate-bounce">
              <Bell className="h-3.5 w-3.5" />
              <span className="text-xs font-black">طلب جديد!</span>
            </div>
          )}
          <div className="text-[10px] text-white/40 font-bold hidden sm:block">
            آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button
            onClick={() => { refetch(); setLastRefresh(new Date()); }}
            disabled={isFetching}
            data-testid="button-kitchen-refresh"
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 text-white/60 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); }}
            data-testid="button-kitchen-logout"
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-red-500/30 transition-colors active:scale-95"
          >
            <LogOut className="h-3.5 w-3.5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-[#E8637A]/10 bg-white">
        {[
          { label: "جديد", count: newOrders.length, color: "bg-blue-500" },
          { label: "يُحضَّر", count: processingOrders.length, color: "bg-amber-500" },
          { label: "جاهز", count: readyOrders.length, color: "bg-green-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-xs font-black text-gray-700">{s.label}</span>
            <span className={`text-sm font-black ${s.count > 0 ? "text-gray-900" : "text-gray-300"}`}>{s.count}</span>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${isFetching ? "bg-amber-400 animate-pulse" : "bg-green-400"}`} />
          {isFetching ? "يتحدث..." : "متصل"}
        </div>
      </div>

      {/* Orders grid */}
      <div className="p-4">
        {orders.length === 0 && !isFetching ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="font-black text-gray-700 text-lg">لا توجد طلبات حالياً</p>
            <p className="text-sm text-gray-400 font-bold mt-1">ستظهر الطلبات الجديدة هنا تلقائياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* New orders first */}
            {newOrders.map((o: any) => (
              <OrderCard key={o._id || o.id} order={o} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
            ))}
            {processingOrders.map((o: any) => (
              <OrderCard key={o._id || o.id} order={o} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
            ))}
            {readyOrders.map((o: any) => (
              <OrderCard key={o._id || o.id} order={o} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
