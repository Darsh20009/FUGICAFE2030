import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { ChevronDown } from "lucide-react";

const BEANS_IMAGE = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80";

function FloatingBean({ delay, x, size, duration, opacity, drift }: {
  delay: number; x: number; size: number; duration: number; opacity: number; drift: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${x}%`, bottom: "-60px", width: size, height: size * 0.67, opacity }}
      animate={{ y: [0, -1200], rotate: [0, 360], x: [0, drift] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="30" cy="20" rx="28" ry="18" fill="#6B3F2A" />
        <ellipse cx="30" cy="20" rx="22" ry="13" fill="#8B5A3C" />
        <path d="M30 7 Q34 20 30 33" stroke="#4f2e1e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <ellipse cx="30" cy="20" rx="28" ry="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}

const beans = [
  { id: 0, delay: 0, x: 5, size: 28, duration: 12, opacity: 0.18, drift: 30 },
  { id: 1, delay: 1.4, x: 15, size: 18, duration: 9, opacity: 0.12, drift: -20 },
  { id: 2, delay: 2.8, x: 25, size: 38, duration: 14, opacity: 0.22, drift: 40 },
  { id: 3, delay: 0.7, x: 35, size: 22, duration: 11, opacity: 0.15, drift: -15 },
  { id: 4, delay: 3.5, x: 45, size: 32, duration: 13, opacity: 0.18, drift: 25 },
  { id: 5, delay: 1.9, x: 55, size: 20, duration: 10, opacity: 0.14, drift: -30 },
  { id: 6, delay: 4.2, x: 65, size: 44, duration: 16, opacity: 0.2, drift: 35 },
  { id: 7, delay: 2.1, x: 75, size: 26, duration: 12, opacity: 0.16, drift: -22 },
  { id: 8, delay: 0.3, x: 85, size: 34, duration: 13, opacity: 0.19, drift: 18 },
  { id: 9, delay: 3.0, x: 92, size: 24, duration: 10, opacity: 0.13, drift: -28 },
  { id: 10, delay: 5.5, x: 10, size: 48, duration: 17, opacity: 0.08, drift: 42 },
  { id: 11, delay: 4.8, x: 70, size: 16, duration: 8, opacity: 0.22, drift: -18 },
];

export function FujiBeansHero() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 160]);
  const overlayOp = useTransform(scrollY, [0, 400], [0.55, 0.85]);
  const textY = useTransform(scrollY, [0, 400], [0, -80]);
  const textOp = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => { setMounted(true); }, []);

  const scrollToContent = () => {
    const el = document.getElementById("main-content");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={heroRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ height: "100svh", minHeight: 560 }}
    >
      {/* ── Parallax Background Image ── */}
      <motion.div
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{ y: imgY }}
      >
        <img
          src={BEANS_IMAGE}
          alt="Fuji Coffee Beans"
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* ── Dark Overlay ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: overlayOp,
          background: "linear-gradient(180deg, rgba(15,10,5,0.8) 0%, rgba(30,15,8,0.5) 50%, rgba(15,10,5,0.9) 100%)",
        }}
      />

      {/* ── Grain texture for depth ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "150px",
        }}
      />

      {/* ── Floating Rising Beans ── */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {beans.map(b => <FloatingBean key={b.id} {...b} />)}
        </div>
      )}

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-4 select-none"
        style={{ y: textY, opacity: textOp }}
      >
        {/* Logo watermark top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mb-8"
        >
          <img src="/fuji-logo.png" alt="Fuji" className="h-14 md:h-18 w-auto mx-auto" style={{ filter: "drop-shadow(0 2px 16px rgba(232,99,122,0.5)) brightness(1.1)" }} />
        </motion.div>

        {/* Arabic tagline */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="text-[#E8637A] text-[11px] md:text-xs font-bold uppercase mb-6"
          style={{ fontFamily: "'Alexandria', sans-serif" }}
          dir="rtl"
        >
          {isRtl ? "حبوب قهوة مختصة" : "Specialty Coffee Beans"}
        </motion.p>

        {/* ── CARVED "فوجي" TEXT ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-2"
          dir="rtl"
        >
          {/* Shadow layer for depth */}
          <div
            aria-hidden
            className="absolute inset-0 select-none"
            style={{
              fontFamily: "'Alexandria', 'Noto Serif JP', serif",
              fontSize: "clamp(72px, 20vw, 220px)",
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: "rgba(0,0,0,0.6)",
              transform: "translate(3px, 5px)",
              userSelect: "none",
            }}
          >
            فوجي
          </div>
          {/* Main carved text */}
          <div
            style={{
              fontFamily: "'Alexandria', 'Noto Serif JP', serif",
              fontSize: "clamp(72px, 20vw, 220px)",
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              background: `url(${BEANS_IMAGE}) center/cover`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "brightness(1.4) contrast(1.1)",
              textShadow: "none",
            }}
          >
            فوجي
          </div>
          {/* Inner emboss highlight */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              fontFamily: "'Alexandria', 'Noto Serif JP', serif",
              fontSize: "clamp(72px, 20vw, 220px)",
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              WebkitTextStroke: "1px rgba(255,200,140,0.18)",
              color: "transparent",
            }}
          >
            فوجي
          </div>
        </motion.div>

        {/* English FUJI */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-8"
        >
          <span
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(14px, 2.5vw, 28px)",
              fontWeight: 200,
              letterSpacing: "0.55em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            C A F E
          </span>
        </motion.div>

        {/* Divider with beans icon */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex items-center gap-4 mb-8 w-full max-w-xs md:max-w-sm"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8637A]/60 to-transparent" />
          <svg viewBox="0 0 24 16" className="w-7 h-5 opacity-70" fill="none">
            <ellipse cx="12" cy="8" rx="11" ry="7" fill="#C8956C" />
            <ellipse cx="12" cy="8" rx="8" ry="5" fill="#8B5A3C" />
            <path d="M12 3 Q14 8 12 13" stroke="#4f2e1e" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#E8637A]/60 to-transparent" />
        </motion.div>

        {/* Tagline Arabic + English */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="text-center max-w-2xl"
        >
          <p
            className="text-white/90 text-xl md:text-2xl font-bold mb-2 leading-relaxed"
            dir="rtl"
            style={{ fontFamily: "'Alexandria', sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
          >
            كل القهوة كيف —{" "}
            <span className="text-[#E8637A]">وفوجي هو أصل الكيف</span>
          </p>
          <p
            className="text-white/45 text-sm md:text-base font-light italic tracking-wide"
            style={{ fontFamily: "'Noto Serif JP', serif", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
          >
            All coffee is joy — <span className="text-[#E8637A]/80">Fuji is the origin of joy</span>
          </p>
        </motion.div>
      </motion.div>

      {/* ── Scroll Down Indicator ── */}
      <motion.button
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 group cursor-pointer"
        aria-label="Scroll down"
      >
        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] group-hover:text-[#E8637A] transition-colors">
          {isRtl ? "اكتشف" : "Discover"}
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-white/40 group-hover:text-[#E8637A] transition-colors" />
        </motion.div>
        {/* Thin vertical line */}
        <motion.div
          className="w-px bg-gradient-to-b from-white/30 to-transparent"
          animate={{ height: [20, 40, 20] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>

      {/* ── Bottom gradient bleed ── */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FAF6F0] to-transparent pointer-events-none z-10" />
    </section>
  );
}
