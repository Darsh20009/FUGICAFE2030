import { Layout } from "@/components/Layout";
import { CustomerTestimonials } from "@/components/CustomerTestimonials";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import * as LucideIcons from "lucide-react";
import {
  ShoppingBag, Star, ShieldCheck, Truck, ChevronRight, ChevronLeft,
  Zap, Clock, RotateCcw, Headphones, Package, Tag, ArrowLeft, ArrowRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useAuthProviders } from "@/hooks/use-auth-providers";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FujiBeansHero } from "@/components/FujiBeansHero";
const logoImg = "/fuji-logo-transparent.png";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { RiyalSign } from "@/components/RiyalSign";

/* ── Real bean images ──────────────────────────────────────────── */
const BEAN_IMGS = [
  "/beans/bean1.png",
  "/beans/bean2.png",
  "/beans/bean3.png",
  "/beans/bean4.png",
  "/beans/bean5.png",
  "/beans/bean6.png",
];

/* ── Section beans decoration with real photos ─────────────────── */
function BeansDecor({ side = "left", count = 3 }: { side?: "left" | "right"; count?: number }) {
  const positions = [
    { top: "8%",  rotate: -20, size: 56, opacity: 0.10, img: 0 },
    { top: "38%", rotate: 25,  size: 72, opacity: 0.08, img: 2 },
    { top: "68%", rotate: -40, size: 44, opacity: 0.11, img: 4 },
  ].slice(0, count);
  return (
    <div className={`absolute top-0 bottom-0 ${side === "left" ? "left-0" : "right-0"} w-24 pointer-events-none overflow-hidden`}>
      {positions.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: p.top,
            [side]: -10,
            transform: `rotate(${p.rotate}deg)`,
            opacity: p.opacity,
            width: p.size,
            height: p.size,
          }}
        >
          <img
            src={BEAN_IMGS[p.img]}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Logo watermark ───────────────────────────────────────────── */
function LogoWatermark({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <img src={logoImg} alt="" className="w-64 md:w-96" style={{ opacity, filter: "grayscale(1)" }} />
    </div>
  );
}

/* ── Flash Countdown ──────────────────────────────────────────── */
function FlashCountdown({ endTime }: { endTime?: string }) {
  const getRemaining = () => {
    if (!endTime) return { h: 5, m: 59, s: 59 };
    const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
    const totalSecs = Math.floor(diff / 1000);
    return { h: Math.floor(totalSecs / 3600), m: Math.floor((totalSecs % 3600) / 60), s: totalSecs % 60 };
  };
  const [time, setTime] = useState(getRemaining);
  useEffect(() => {
    const iv = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(iv);
  }, [endTime]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-[#6B3F2A] text-white font-bold text-lg w-10 h-10 flex items-center justify-center rounded-lg tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-[#6B3F2A] font-bold text-lg">:</span>}
        </span>
      ))}
    </div>
  );
}

/* ── Beans Showcase / Mockup strip ───────────────────────────── */
function BeansMockupStrip({ isRtl }: { isRtl: boolean }) {
  const highlights = [
    { icon: "🌍", arLabel: "إثيوبيا", enLabel: "Ethiopia", arDesc: "توت أحمر، ياسمين، حموضة منعشة", enDesc: "Red berry, jasmine, bright acidity", color: "#8B5A3C", img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=400&q=60" },
    { icon: "🏔️", arLabel: "كولومبيا", enLabel: "Colombia", arDesc: "كراميل، بندق، حلاوة متوازنة", enDesc: "Caramel, hazelnut, balanced sweetness", color: "#6B3F2A", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=60" },
    { icon: "🌿", arLabel: "البرازيل", enLabel: "Brazil", arDesc: "شوكولاتة داكنة، مكسرات، قوام كامل", enDesc: "Dark chocolate, nuts, full body", color: "#5C3520", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=60" },
    { icon: "☕", arLabel: "اليمن", enLabel: "Yemen", arDesc: "عنب، تمر، تعقيد استثنائي", enDesc: "Grape, date, exceptional complexity", color: "#C8956C", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=60" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {highlights.map((h, i) => (
        <motion.div
          key={h.enLabel}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.6 }}
        >
          <Link href="/products">
            <div className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-xl transition-all duration-500">
              <img src={h.img} alt={h.enLabel} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              {/* Fuji logo watermark */}
              <img src={logoImg} alt="" className="absolute top-2 right-2 w-8 opacity-30 group-hover:opacity-50 transition-opacity" />
              {/* Bean icon */}
              <div className="absolute top-3 left-3">
                <div className="text-xl">{h.icon}</div>
              </div>
              {/* Info */}
              <div className={`absolute bottom-0 inset-x-0 p-3 ${isRtl ? "text-right" : "text-left"}`}>
                <p className="text-white font-bold text-sm md:text-base leading-tight">{isRtl ? h.arLabel : h.enLabel}</p>
                <p className="text-white/60 text-[10px] md:text-xs leading-snug mt-0.5 line-clamp-2">{isRtl ? h.arDesc : h.enDesc}</p>
              </div>
              {/* Hover border */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-[#E8637A] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Coffee Journey Section — creative immersive explanation ─── */
const JOURNEY_STEPS = [
  {
    step: "01",
    arTitle: "الزراعة والحصاد",
    enTitle: "Farm & Harvest",
    arDesc: "تُزرع حبوب القهوة الفاخرة على ارتفاعات شاهقة في إثيوبيا والبرازيل وكولومبيا، حيث يمنحها الطقس البارد والمطر الوفير كثافة نكهة استثنائية.",
    enDesc: "Premium coffee cherries grow at high altitudes in Ethiopia, Brazil & Colombia — cool climate and rich rain give them exceptional flavour density.",
    icon: "🌱",
    img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=70",
    accent: "#4A7C59",
  },
  {
    step: "02",
    arTitle: "المعالجة والتجفيف",
    enTitle: "Process & Dry",
    arDesc: "تُعالج الثمار إما بطريقة الغسيل (الرطبة) للحصول على نكهة نظيفة حيّة، أو بالطريقة الطبيعية (الجافة) لنكهات مركّزة فاكهية غنية.",
    enDesc: "Cherries are washed for clean brightness or naturally dried for rich, fruity depth — the process is where character is born.",
    icon: "☀️",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=70",
    accent: "#C8842A",
  },
  {
    step: "03",
    arTitle: "التحميص الدقيق",
    enTitle: "Precision Roast",
    arDesc: "يُحمّص الخبراء الحبوب بدقة متناهية ليُطلقوا ألف نكهة مخفية داخلها — من الحموضة الخفيفة إلى الحلاوة الداكنة والمرارة الفاخرة.",
    enDesc: "Master roasters unlock a thousand hidden flavours — from bright acidity to dark sweetness and noble bitterness — through precise heat control.",
    icon: "🔥",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=70",
    accent: "#8B2A1A",
  },
  {
    step: "04",
    arTitle: "كوبك المثالي",
    enTitle: "Your Perfect Cup",
    arDesc: "في النهاية، كل هذه الرحلة المذهلة تصل إليك في كوب واحد — دافئ، عطر، ومُعدّ بحبّ. هذا هو وعد فوجي كافيه.",
    enDesc: "All this remarkable journey arrives in your hands — warm, fragrant, crafted with love. That is the Fuji Cafe promise.",
    icon: "☕",
    img: "/fuji-interior.png",
    accent: "#E8637A",
  },
];

function CoffeeJourneySection({ isRtl }: { isRtl: boolean }) {
  const [active, setActive] = useState(0);
  const current = JOURNEY_STEPS[active];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #1A0D06 0%, #2D1A0A 40%, #1E0E05 100%)" }}>
      {/* Bean texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=40)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: "overlay",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${current.accent}22 0%, transparent 70%)`, transition: "background 0.7s ease" }}
      />
      {/* Decorative bean side images */}
      <img src="/beans/bean4.png" alt="" aria-hidden="true" className="absolute pointer-events-none select-none opacity-10"
        style={{ width: 220, bottom: -40, left: -60, transform: "rotate(20deg)", filter: "blur(2px)" }} />
      <img src="/beans/bean2.png" alt="" aria-hidden="true" className="absolute pointer-events-none select-none opacity-10"
        style={{ width: 180, top: -30, right: -50, transform: "rotate(-25deg)", filter: "blur(2px)" }} />

      <div className="container px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-12 ${isRtl ? "text-right" : "text-left"}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#E8637A] mb-3 block">
            {isRtl ? "رحلة الحبّة" : "The Bean Journey"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            {isRtl ? "من المزرعة إلى كوبك" : "From Farm to Your Cup"}
          </h2>
          <p className="text-white/50 text-sm md:text-base mt-3 max-w-xl">
            {isRtl
              ? "أربع محطات تحوّل حبة صغيرة إلى تجربة لا تُنسى — اكتشف سحر القهوة المتخصصة."
              : "Four stations transform a tiny seed into an unforgettable experience — discover the magic of specialty coffee."}
          </p>
        </motion.div>

        <div className={`grid md:grid-cols-2 gap-8 lg:gap-16 items-center ${isRtl ? "md:grid-flow-col-dense" : ""}`}>
          {/* Left: image */}
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.96, x: isRtl ? 30 : -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: "4/3" }}
          >
            <img src={current.img} alt={isRtl ? current.arTitle : current.enTitle}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${current.accent}88 0%, transparent 60%)` }} />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-5xl mb-2">{current.icon}</div>
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                {isRtl ? `خطوة ${current.step}` : `Step ${current.step}`}
              </span>
            </div>
          </motion.div>

          {/* Right: steps list */}
          <div className="space-y-2">
            {JOURNEY_STEPS.map((step, i) => (
              <button
                key={step.step}
                onClick={() => setActive(i)}
                className={`w-full rounded-2xl p-5 transition-all duration-400 text-${isRtl ? "right" : "left"} border ${
                  active === i
                    ? "border-[#E8637A]/50 bg-white/10 shadow-lg"
                    : "border-white/8 bg-white/4 hover:bg-white/7"
                }`}
              >
                <div className={`flex items-start gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all duration-400"
                    style={{ background: active === i ? step.accent : "rgba(255,255,255,0.08)" }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px] font-bold tracking-widest" style={{ color: active === i ? step.accent : "rgba(255,255,255,0.3)" }}>
                        {step.step}
                      </span>
                      <h3 className={`font-black text-sm md:text-base ${active === i ? "text-white" : "text-white/60"} transition-colors`}>
                        {isRtl ? step.arTitle : step.enTitle}
                      </h3>
                    </div>
                    <AnimatePresence>
                      {active === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-white/55 text-xs md:text-sm leading-relaxed overflow-hidden"
                        >
                          {isRtl ? step.arDesc : step.enDesc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </button>
            ))}

            {/* CTA */}
            <div className={`mt-6 flex ${isRtl ? "flex-row-reverse" : ""}`}>
              <Link href="/products">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button className="px-6 py-3 rounded-full font-black text-sm text-white transition-all"
                    style={{ background: `linear-gradient(135deg, #E8637A, #C8842A)`, boxShadow: "0 8px 24px rgba(232,99,122,0.35)" }}>
                    {isRtl ? "تسوّق الآن" : "Shop Now"}
                    <span className={`inline-block ${isRtl ? "mr-2 rotate-180" : "ml-2"}`}>→</span>
                  </button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Home Page ───────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useProducts();
  const { t, tx, language } = useLanguage();
  const { toast } = useToast();
  const { googleEnabled, appleEnabled, anyEnabled } = useAuthProviders();
  const isRtl = language === "ar";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (err) {
      const map: Record<string, string> = {
        invalid_state: "انتهت صلاحية الجلسة، حاول مرة أخرى",
        missing_code: "تم إلغاء عملية تسجيل الدخول",
        access_denied: "تم رفض الوصول",
      };
      toast({ title: "تعذّر تسجيل الدخول", description: map[err] || "حدث خطأ أثناء تسجيل الدخول", variant: "destructive" });
      params.delete("auth_error");
      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    }
  }, [toast]);

  const { data: dbCategories } = useQuery<any[]>({ queryKey: ["/api/categories"] });

  const featuredProducts = products?.slice(0, 8) || [];
  const bestSellers = products?.slice(0, 4) || [];

  const { data: flashDealsData = [] } = useQuery<any[]>({ queryKey: ["/api/flash-deals"] });
  const hasFlashDeals = flashDealsData.length > 0;
  const flashEndTime = hasFlashDeals
    ? flashDealsData.sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())[0]?.endTime
    : undefined;
  const flashDealProducts = hasFlashDeals
    ? flashDealsData.map((deal: any) => ({
        ...deal.product,
        _flashDeal: deal,
        price: deal.product?.price ? (deal.product.price * (1 - deal.discountPercent / 100)).toFixed(2) : deal.product?.price,
        originalPrice: deal.product?.price,
        discountBadge: `${deal.discountPercent}%`,
      }))
    : [];

  useEffect(() => {
    if (user && ["admin", "employee", "support"].includes(user.role)) setLocation("/admin");
  }, [user, setLocation]);

  const getProductsForCategory = (categoryId: string) =>
    (products || []).filter((p: any) => p.categoryId === categoryId || (p.categoryIds || []).includes(categoryId)).slice(0, 4);

  return (
    <Layout>
      {/* ══════════════════════════════════════════════════════════════
          CINEMATIC HERO — Coffee beans with carved فوجي
      ══════════════════════════════════════════════════════════════ */}
      <FujiBeansHero />

      {/* ── Anchor for scroll-down ── */}
      <div id="main-content" />

      {/* ══════════════════════════════════════════════════════════════
          ORIGINS SHOWCASE — 4 coffee origin cards
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-14 md:py-20 bg-[#FAF6F0] overflow-hidden">
        <BeansDecor side="left" />
        <BeansDecor side="right" />
        <LogoWatermark opacity={0.03} />
        <div className="container px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mb-10 ${isRtl ? "text-right" : "text-left"}`}
          >
            <div className={`flex items-center gap-3 mb-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <img src={logoImg} alt="Fuji" className="h-6 w-auto opacity-70 logo-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#E8637A]">
                {isRtl ? "من أجود المصادر" : "From the Finest Origins"}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-[#6B3F2A] leading-tight">
              {isRtl ? "حبوب من قلب العالم" : "Beans From the Heart of the World"}
            </h2>
            <p className="text-gray-600 text-sm md:text-base mt-2 max-w-lg">
              {isRtl
                ? "نختار حبوب القهوة من أرقى مزارع العالم لنقدم لك تجربة فريدة في كل كوب."
                : "We source coffee beans from the world's finest farms to deliver a unique experience in every cup."}
            </p>
          </motion.div>
          <BeansMockupStrip isRtl={isRtl} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COFFEE JOURNEY — immersive creative explanation section
      ══════════════════════════════════════════════════════════════ */}
      <CoffeeJourneySection isRtl={isRtl} />

      {/* ══════════════════════════════════════════════════════════════
          BRAND ATMOSPHERE — dual photo creative section
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 bg-[#1a0f0a] relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #E8637A 0%, transparent 50%), radial-gradient(circle at 80% 50%, #a08a52 0%, transparent 50%)" }} />
        <div className="container px-4 relative z-10">
          <div className={`grid md:grid-cols-2 gap-6 lg:gap-10 items-center`}>
            {/* Left: interior shot */}
            <div className="relative group" data-testid="img-brand-interior">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#E8637A]/40 to-[#a08a52]/40 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/60">
                <img
                  src="/fuji-interior.png"
                  alt="فوجي كافيه — أجواء المكان"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#E8637A] block mb-1">Our Space</span>
                  <p className="font-black text-white text-lg leading-tight">أجواء فريدة في كل زيارة</p>
                </div>
              </div>
            </div>

            {/* Right: product/cupping shot + text */}
            <div className="flex flex-col gap-5">
              <div className="relative group" data-testid="img-brand-product">
                <div className="absolute -inset-1 bg-gradient-to-br from-[#a08a52]/40 to-[#E8637A]/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/60">
                  <img
                    src="/fuji-product-photo.png"
                    alt="فوجي كافيه — تجربة التذوق"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a08a52] block mb-1">Specialty Coffee</span>
                    <p className="font-black text-white text-lg leading-tight">تجربة التذوق الاحترافي</p>
                  </div>
                </div>
              </div>

              <div className={`${isRtl ? "text-right" : "text-left"}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E8637A] mb-2">
                  {isRtl ? "فوجي كافيه" : "Fuji Cafe"}
                </p>
                <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-3">
                  {isRtl ? "شغف القهوة الفردية\nفي كل تفصيلة" : "Specialty Coffee\nIn Every Detail"}
                </h3>
                <p className="text-sm text-white/50 font-bold leading-relaxed">
                  {isRtl
                    ? "نؤمن بأن كل كوب قصة — من بلد المنشأ إلى الكوب بين يديك، نرافقك في كل خطوة من رحلة القهوة الفردية."
                    : "We believe every cup tells a story — from origin to your hands, we guide you through specialty coffee's journey."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          NEWEST PRODUCTS — marquee strip
      ══════════════════════════════════════════════════════════════ */}
      {(products && products.length >= 3) && (
        <section className="py-10 md:py-14 bg-white relative overflow-hidden">
          <LogoWatermark opacity={0.025} />
          <div className="container px-4 relative z-10">
            <div className={`flex items-center justify-between mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div>
                <div className={`flex items-center gap-2 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <img src={logoImg} alt="" className="h-4 w-auto opacity-60 logo-transparent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E8637A]">
                    {language === "ar" ? "وصل حديثًا" : "Just In"}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#6B3F2A]">
                  {language === "ar" ? "أحدث الحبوب" : "Latest Beans"}
                </h2>
              </div>
              <Link href="/products">
                <span className={`text-sm font-bold text-[#E8637A] hover:text-[#d44f66] transition-colors flex items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                  {t("viewAll")}
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
              </Link>
            </div>
            <div className="relative overflow-hidden group" data-testid="strip-latest-products" dir="ltr">
              <div className="flex gap-3 animate-marquee-products group-hover:[animation-play-state:paused] py-2" style={{ width: "max-content" }}>
                {(() => {
                  const base = products || [];
                  return [...base, ...base, ...base];
                })().map((product: any, i: number) => (
                  <div key={`${product.id || product._id || i}-${i}`} className="w-[170px] sm:w-[200px] md:w-[230px] shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          FLASH DEALS
      ══════════════════════════════════════════════════════════════ */}
      {flashDealProducts.length > 0 && (
        <section className="py-10 md:py-14 bg-[#FAF6F0] relative overflow-hidden">
          <BeansDecor side="right" count={2} />
          <div className="container px-4 relative z-10">
            <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 ${isRtl ? "md:flex-row-reverse text-right" : "text-left"}`}>
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className="bg-red-500 text-white p-2.5 rounded-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    {t("limitedTime")}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-[#6B3F2A] mt-1">{t("todaysDeals")}</h2>
                </div>
              </div>
              <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-gray-700 text-xs font-bold uppercase tracking-widest">{t("endsInShort")}</span>
                <FlashCountdown endTime={flashEndTime} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {flashDealProducts.slice(0, 4).map((product: any, i: number) => (
                <motion.div key={product.id || product._id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative">
                  {product.discountBadge && (
                    <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{product.discountBadge}</div>
                  )}
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CATEGORIES WITH PRODUCTS
      ══════════════════════════════════════════════════════════════ */}
      {dbCategories && dbCategories.length > 0 && (
        <div className="bg-white">
          {dbCategories.filter((cat: any) => !cat.parentId).map((cat: any, i: number) => {
            const catProducts = getProductsForCategory(cat.id);
            if (catProducts.length === 0) return null;
            const catName = isRtl ? (cat.nameAr || cat.name) : cat.name;
            return (
              <section key={cat.id || i} className={`py-10 md:py-14 relative overflow-hidden ${i % 2 === 0 ? "bg-white" : "bg-[#FAF8F4]"}`} data-testid={`section-category-${cat.slug}`}>
                {i % 2 === 0 ? <BeansDecor side="left" count={2} /> : <BeansDecor side="right" count={2} />}
                <LogoWatermark opacity={0.025} />
                <div className="container px-4 relative z-10">
                  {cat.image && (
                    <Link href={`/products?category=${cat.slug}`}>
                      <div className="relative w-full mb-4 cursor-pointer group flex items-center justify-center">
                        <img
                          src={cat.image}
                          alt={catName}
                          className="w-full h-auto max-h-72 sm:max-h-80 md:max-h-96 object-contain rounded-3xl mx-auto transition-transform duration-700 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                        {/* Fuji logo badge over image */}
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-xl p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <img src={logoImg} alt="Fuji" className="h-5 w-auto" />
                        </div>
                      </div>
                    </Link>
                  )}
                  <div className={`flex items-end justify-between gap-3 mb-6 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}>
                    <div>
                      <div className={`flex items-center gap-2 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <img src={logoImg} alt="" className="h-4 w-auto opacity-40" />
                        <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#E8637A]">
                          {isRtl ? "تشكيلة فوجي" : "Fuji Collection"}
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black text-[#6B3F2A]">{catName}</h2>
                    </div>
                    <Link href={`/products?category=${cat.slug}`}>
                      <span className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#E8637A] hover:text-[#d44f66] transition-colors whitespace-nowrap ${isRtl ? "flex-row-reverse" : ""}`}>
                        {t("viewAll")}
                        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {catProducts.map((p: any, idx: number) => (
                      <motion.div key={p.id || p._id || idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PROMOTIONAL BANNERS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeaturedBestSellerCard isRtl={isRtl} t={t} bestSellers={bestSellers} />
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl h-44 md:h-56 group cursor-pointer bg-[#0F0F0F]"
            >
              <img src="/fuji-product-photo.png" alt="فوجي كافيه" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_2px_18px_rgba(0,0,0,0.55)]" />
              {/* Fuji logo on the banner */}
              <img src={logoImg} alt="Fuji" className="absolute top-3 left-3 h-8 w-auto opacity-70 drop-shadow-lg group-hover:opacity-90 transition-opacity" />
              <div className={`absolute inset-0 p-6 flex flex-col justify-end ${isRtl ? "text-right items-end" : "text-left items-start"}`}>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2" dir={isRtl ? "rtl" : "ltr"}>
                  {isRtl ? "وفوجي هو أصل الكيف" : "Fuji is the origin of joy"}
                </p>
                <Link href="/products">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white hover:text-[#E8637A] transition-colors flex items-center gap-1 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full">
                    {t("shopNow")} {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════ */}
      <StatsSection isRtl={isRtl} t={t} />

      {/* ══════════════════════════════════════════════════════════════
          QUALITY PILLARS — 3 cards
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-20 bg-[#FAF6F0] relative overflow-hidden">
        <BeansDecor side="left" count={3} />
        <BeansDecor side="right" count={3} />
        <LogoWatermark opacity={0.04} />
        <div className="container px-4 relative z-10">
          <div className="text-center mb-12">
            <img src={logoImg} alt="Fuji" className="h-10 w-auto mx-auto mb-4 opacity-80 logo-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#E8637A] block mb-3">
              {isRtl ? "التزامنا" : "Our Commitment"}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#6B3F2A]">
              {isRtl ? "لماذا حبوب فوجي؟" : "Why Fuji Beans?"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "🌱", arTitle: "مستدامة ومسؤولة", enTitle: "Sustainable & Ethical", arDesc: "نتشارك مع مزارع معتمدة تُولي الأهمية للبيئة والمزارعين.", enDesc: "We partner with certified farms that prioritize environment and farmers." },
              { icon: "🔬", arTitle: "محمصة بدقة", enTitle: "Precision Roasted", arDesc: "كل دُفعة تُحمّص بدقة علمية للوصول لذروة النكهة في كل حبة.", enDesc: "Every batch is scientifically roasted to unlock the peak flavor of each bean." },
              { icon: "🚀", arTitle: "شحن سريع طازج", enTitle: "Fresh Fast Delivery", arDesc: "نشحن خلال 48 ساعة من التحميص لضمان أقصى درجة من الطزاجة.", enDesc: "We ship within 48h of roasting to guarantee maximum freshness." },
            ].map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                <div className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-400 border border-[#E8E2D5] group ${isRtl ? "text-right" : "text-left"}`}>
                  <div className="text-3xl mb-4">{p.icon}</div>
                  <h3 className="text-[#6B3F2A] font-black text-lg mb-2 group-hover:text-[#E8637A] transition-colors">
                    {isRtl ? p.arTitle : p.enTitle}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{isRtl ? p.arDesc : p.enDesc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BEST SELLERS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 bg-white relative overflow-hidden">
        <LogoWatermark opacity={0.025} />
        <div className="container px-4 relative z-10">
          <div className={`flex items-center justify-between mb-8 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div>
              <div className={`flex items-center gap-2 mb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                <img src={logoImg} alt="" className="h-4 w-auto opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E8637A]">{t("bestSellers")}</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-[#6B3F2A]">{t("customerFavorites")}</h2>
            </div>
            <Link href="/products">
              <Button className="rounded-lg bg-[#6B3F2A] text-white hover:bg-[#8B5A3C] font-bold text-xs tracking-wider h-10 px-6">
                {t("viewAll")}
                {isRtl ? <ChevronLeft className="mr-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-[#F5F2ED] animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredProducts.slice(0, 8).map((product: any, i: number) => (
                <motion.div key={product.id || product._id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <CustomerTestimonials />

      {/* ══════════════════════════════════════════════════════════════
          BRAND STORY
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#FAF8F4] overflow-hidden relative">
        <BeansDecor side="left" count={3} />
        <BeansDecor side="right" count={3} />
        <div className="container px-4 max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative">
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="h-px w-16 bg-[#E8637A]" />
              <img src={logoImg} alt="Fuji Cafe" className="h-10 w-auto opacity-85 logo-transparent" />
              <div className="h-px w-16 bg-[#E8637A]" />
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.4em] text-[#E8637A] mb-4">
              {tx("رؤيتنا", "Our Vision")}
            </p>
            <blockquote className={`text-center ${isRtl ? "font-arabic" : ""}`}>
              <span className="block text-5xl md:text-6xl leading-none text-[#E8637A]/30 font-serif mb-2 select-none">❝</span>
              <p className="text-[#6B3F2A] text-lg md:text-2xl lg:text-3xl font-bold leading-relaxed md:leading-loose max-w-3xl mx-auto px-4">
                {isRtl
                  ? <> نحن في{" "}<span className="text-[#E8637A]">FUJI CAFE</span>{" "}ندرك أن القهوة ليست مجرد مشروب — إنها{" "}<span className="italic">تجربة وهوية وأصل.</span> </>
                  : <> At <span className="text-[#E8637A]">FUJI CAFE</span>, we believe coffee is not just a drink — it is{" "}<span className="italic">an experience, an identity, an origin.</span> </>
                }
              </p>
              <p className="mt-6 text-gray-600 text-sm md:text-base leading-relaxed md:leading-loose max-w-2xl mx-auto px-4">
                {isRtl
                  ? "نلتزم بأن تحمل كل حبة قهوة طابعًا فريدًا يعكس أصلها وهويتها، لنمنحكم تجربة لا تُنسى تليق بتطلعاتكم."
                  : "We are committed to giving every coffee bean a unique character that reflects its origin — a coffee experience worthy of your highest aspirations."}
              </p>
              <span className="block text-5xl md:text-6xl leading-none text-[#E8637A]/30 font-serif mt-2 select-none">❞</span>
            </blockquote>
            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-[#E8637A]/40" />
              <img src="/beans/bean1.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.45 }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8637A]" />
              <img src={logoImg} alt="" className="h-5 w-auto opacity-30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8637A]" />
              <img src="/beans/bean3.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.45 }} />
              <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-[#E8637A]/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FULL-WIDTH CTA — dark coffee beans
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-[#0F0A05]">
        <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=70" alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0A05]/80 via-[#0F0A05]/60 to-[#0F0A05]/90" />
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url("${logoImg}")`, backgroundRepeat: "repeat", backgroundSize: "100px" }}
        />
        {/* Scattered real bean photos as decorative drop art */}
        {[
          { x: "8%",  y: "15%", r: 25,  s: 60, img: 0 },
          { x: "90%", y: "20%", r: -15, s: 46, img: 2 },
          { x: "5%",  y: "75%", r: 40,  s: 52, img: 4 },
          { x: "85%", y: "70%", r: -30, s: 64, img: 1 },
          { x: "50%", y: "5%",  r: 10,  s: 38, img: 3 },
          { x: "45%", y: "90%", r: -20, s: 48, img: 5 },
        ].map((b, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ left: b.x, top: b.y, transform: `rotate(${b.r}deg)`, opacity: 0.08, width: b.s, height: b.s }}>
            <img src={BEAN_IMGS[b.img]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ))}

        <div className="container px-4 relative z-10 text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex justify-center mb-8">
              <img src={logoImg} alt="Fuji Cafe" className="h-14 md:h-20 w-auto opacity-90 rounded-sm drop-shadow-2xl" />
            </div>

            {/* Carved text miniature in CTA */}
            <div
              className="text-5xl md:text-7xl font-black text-center uppercase mb-3 select-none"
              dir="rtl"
              style={{
                background: "url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=60') center/cover",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "brightness(1.5) contrast(1.1)",
              }}
            >
              فوجي
            </div>

            <p className="text-[#E8637A] text-base md:text-xl font-bold mb-2" dir="rtl">
              كل القهوة كيف — وفوجي هو أصل الكيف
            </p>
            <p className="text-white/40 text-sm italic tracking-widest mb-10">
              All coffee is joy — Fuji is the origin of joy
            </p>

            {user ? (
              <Link href="/products">
                <Button size="lg" className="h-14 md:h-16 px-10 md:px-16 text-xs md:text-sm font-bold uppercase tracking-[0.3em] rounded-lg bg-white text-[#6B3F2A] hover:bg-[#E8637A] hover:text-white border-none transition-all duration-500">
                  <ShoppingBag className={`${isRtl ? "ml-3" : "mr-3"} h-5 w-5`} />
                  {tx("تسوق الحبوب", "Shop the Beans")}
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-2">
                <Link href="/register" className="w-full">
                  <Button size="lg" className="w-full h-14 text-sm font-bold uppercase tracking-[0.2em] rounded-lg bg-[#E8637A] text-white hover:bg-white hover:text-[#6B3F2A] border-none shadow-2xl shadow-[#E8637A]/30 transition-all duration-500" data-testid="button-cta-register">
                    <LucideIcons.UserPlus className={`${isRtl ? "ml-3" : "mr-3"} h-5 w-5`} />
                    {tx("سجّل الآن مجاناً", "Sign Up Now — Free")}
                  </Button>
                </Link>
                {anyEnabled && (
                  <>
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 h-px bg-white/15" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
                        {tx("أو سجّل بسرعة عبر", "or quick sign-in")}
                      </span>
                      <div className="flex-1 h-px bg-white/15" />
                    </div>
                    <div className={`grid ${googleEnabled && appleEnabled ? "grid-cols-2" : "grid-cols-1"} gap-3 w-full`}>
                      {googleEnabled && (
                        <a href="/api/auth/google/start" className="h-12 bg-white text-[#6B3F2A] rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#E8637A] hover:text-white transition-all" data-testid="button-cta-google">
                          <svg viewBox="0 0 48 48" className="h-4 w-4"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                          Google
                        </a>
                      )}
                      {appleEnabled && (
                        <a href="/api/auth/apple/start" className="h-12 bg-black text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all" data-testid="button-cta-apple">
                          <svg viewBox="0 0 20 24" className="h-4 w-auto fill-current"><path d="M13.23 3.02C14.28 1.71 14.94 0 14.94 0s-1.71.28-2.76 1.59c-.96 1.21-1.57 2.86-1.47 3.64.97.07 2.53-.3 3.52-2.21zM16.44 8.74c-1.77-.07-3.28 1-4.13 1-.85 0-2.14-.94-3.55-.91-1.82.03-3.5 1.06-4.43 2.71-1.9 3.28-.49 8.15 1.35 10.82.9 1.31 1.97 2.77 3.38 2.72 1.35-.05 1.86-.87 3.49-.87 1.62 0 2.09.87 3.51.84 1.46-.03 2.39-1.32 3.29-2.63.97-1.47 1.37-2.9 1.4-2.97-.03-.01-2.71-1.04-2.74-4.13-.03-2.59 2.11-3.83 2.21-3.9-1.2-1.78-3.08-1.68-3.78-1.68z" /></svg>
                          Apple
                        </a>
                      )}
                    </div>
                  </>
                )}
                <Link href="/login" className="text-[11px] font-bold text-white/60 hover:text-[#E8637A] transition-colors mt-1" data-testid="link-cta-login">
                  {tx("لديك حساب؟ تسجيل الدخول", "Already a member? Sign in")}
                </Link>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-4">
                {tx("نقبل جميع وسائل الدفع", "We Accept All Payment Methods")}
              </p>
              <div className="flex justify-center flex-wrap gap-3">
                {[
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/apps/296480bb-8f91-40d7-884d-496b563c1629.jpg",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/apple_pay.svg",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/mada-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/visa-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/mastercard-circle.png",
                  "https://media.zid.store/cdn-cgi/image/h=80,q=100/https://media.zid.store/static/stc_pay.png",
                ].map((src, i) => (
                  <div key={i} className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                    <img src={src} alt="" className="h-6 w-6 object-contain" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

/* ── Featured Best Seller Card ─────────────────────────────────── */
function FeaturedBestSellerCard({ isRtl, t, bestSellers }: { isRtl: boolean; t: (k: string) => string; bestSellers: any[] }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [index, setIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const list = useMemo(() => (bestSellers || []).filter(p => p && p.id).slice(0, 5), [bestSellers]);
  const product = list[index] || null;
  useEffect(() => {
    if (!list.length || isHover) return;
    const id = setInterval(() => setIndex(i => (i + 1) % list.length), 7000);
    return () => clearInterval(id);
  }, [list.length, isHover]);
  const { data: highlights } = useQuery<any>({ queryKey: ["/api/products", product?.id, "highlights"], enabled: !!product?.id, staleTime: 24 * 60 * 60_000 });
  const handleAdd = () => {
    if (!product) return;
    const variant = (product.variants && product.variants[0]) || { sku: `${product.id}-default`, price: Number(product.price) || 0 };
    addItem(product, variant, 1);
    toast({ title: isRtl ? "تمت الإضافة إلى السلة" : "Added to cart", description: isRtl ? product.name : (product.nameEn || product.name) });
  };
  if (!product) return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl h-44 md:h-56 bg-gradient-to-br from-[#6B3F2A] via-[#6B3F2A] to-[#1c1c45] animate-pulse" />
  );
  const productImg = (product.images && product.images[0]) || "/fuji-logo.png";
  const bullets: string[] = (isRtl ? highlights?.highlights_ar : highlights?.highlights_en) || [];
  const tagline: string = (isRtl ? highlights?.tagline_ar : highlights?.tagline_en) || (isRtl ? product.description : (product.descriptionEn || product.description)) || "";
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
      onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}
      className="relative overflow-hidden rounded-2xl h-44 md:h-56 bg-gradient-to-br from-[#6B3F2A] via-[#6B3F2A] to-[#1c1c45] group" data-testid="featured-bestseller-card">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 80% 70%, #E8637A 0%, transparent 50%)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
      {/* Fuji logo */}
      <img src="/fuji-logo.png" alt="" className="absolute bottom-3 right-3 h-6 w-auto opacity-20" />
      <div className={`absolute top-3 ${isRtl ? "right-3" : "left-3"} flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8637A]/20 backdrop-blur-md border border-[#E8637A]/40 z-10`}>
        <LucideIcons.Sparkles className="w-3 h-3 text-[#E8637A]" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#E8637A]">{isRtl ? "الأكثر مبيعاً" : "Best Seller"}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={product.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}
          className={`absolute inset-0 flex ${isRtl ? "flex-row-reverse" : "flex-row"} items-stretch`}>
          <Link href={`/products/${product.id}`} className="relative w-[42%] md:w-[40%] shrink-0 flex items-center justify-center p-3">
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border border-white/10" />
            <img src={productImg} alt={product.name} loading="lazy"
              className="relative max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105"
              onError={(e: any) => { e.currentTarget.src = "/fuji-logo.png"; }} />
          </Link>
          <div className={`flex-1 min-w-0 px-3 py-3 md:px-4 md:py-4 flex flex-col justify-between ${isRtl ? "text-right items-end" : "text-left items-start"}`}>
            <div className="w-full">
              <Link href={`/products/${product.id}`}>
                <h3 className="text-white text-sm md:text-base font-bold leading-tight line-clamp-1 hover:text-[#E8637A] transition-colors">
                  {isRtl ? product.name : (product.nameEn || product.name)}
                </h3>
              </Link>
              <div className={`mt-1 flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                <span className="text-[#E8637A] text-base md:text-lg font-bold">{Number(product.price).toFixed(0)}</span>
                <span className="text-[10px] text-white/70 font-bold"><RiyalSign /></span>
              </div>
              {bullets.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {bullets.slice(0, 2).map((b, i) => (
                    <li key={i} className={`text-[10px] md:text-[11px] text-white/85 leading-snug flex items-center gap-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="w-1 h-1 rounded-full bg-[#E8637A] shrink-0" /><span className="line-clamp-1">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-[10px] md:text-[11px] text-white/75 leading-snug line-clamp-2">{tagline}</p>
              )}
            </div>
            <button onClick={handleAdd} data-testid={`button-add-featured-${product.id}`}
              className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#E8637A] hover:bg-white text-[#6B3F2A] text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl ${isRtl ? "flex-row-reverse" : ""}`}>
              <LucideIcons.ShoppingBag className="w-3.5 h-3.5" />
              {isRtl ? "أضف إلى السلة" : "Add to Cart"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
      {list.length > 1 && (
        <div className={`absolute bottom-1.5 ${isRtl ? "right-3" : "left-3"} flex gap-1 z-10`}>
          {list.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} data-testid={`featured-dot-${i}`}
              className={`h-1 rounded-full transition-all ${i === index ? "w-4 bg-[#E8637A]" : "w-1 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Stats Section ─────────────────────────────────────────────── */
function StatsSection({ isRtl, t }: { isRtl: boolean; t: (k: string) => string }) {
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/stats"], staleTime: 5 * 60_000 });
  const fallback = [
    { valueAr: "+٥٠٠", valueEn: "500+", labelAr: t("happyCustomers"), labelEn: t("happyCustomers"), color: "#E8637A" },
    { valueAr: "+٢٠", valueEn: "20+", labelAr: "مصدر قهوة", labelEn: "Coffee Origins", color: "#E8637A" },
    { valueAr: "٩٩٪", valueEn: "99%", labelAr: t("customerSatisfaction"), labelEn: t("customerSatisfaction"), color: "#E8637A" },
    { valueAr: "٤٨", valueEn: "48h", labelAr: "ساعة من التحميص للشحن", labelEn: "Roast to Ship", color: "#E8637A" },
  ];
  const list = (items && items.length > 0) ? items : fallback;
  if (list.length === 0) return null;
  const cols = list.length === 1 ? "grid-cols-1" : list.length === 2 ? "grid-cols-2" : list.length === 3 ? "grid-cols-1 sm:grid-cols-3" : list.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5";
  return (
    <section className="border-y border-[#E8E5E0] bg-white py-10 relative overflow-hidden" data-testid="stats-section">
      <LogoWatermark opacity={0.025} />
      <div className="container px-4 relative z-10">
        <div className={`grid ${cols} gap-8 text-center`}>
          {list.map((stat: any, i: number) => (
            <motion.div key={(stat.id as string) || i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center" data-testid={`stat-item-${i}`}>
              <span className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: stat.color || "#E8637A" }}>
                {isRtl ? (stat.valueAr || stat.valueEn) : (stat.valueEn || stat.valueAr)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 mt-2">
                {isRtl ? (stat.labelAr || stat.labelEn) : (stat.labelEn || stat.labelAr)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
