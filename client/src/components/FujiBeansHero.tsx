import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/use-language";

const BEANS_IMAGE = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80";

export function FujiBeansHero() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [scrolled, setScrolled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!scrolled) {
        const el = document.getElementById("main-content");
        if (el) el.scrollIntoView({ behavior: "smooth" });
        setScrolled(true);
      }
    }, 4000);
    timerRef.current = t;
    return () => clearTimeout(t);
  }, []);

  const scrollToContent = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setScrolled(true);
    document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="fuji-hero relative w-full overflow-hidden flex items-center justify-center"
      style={{ height: "100svh", minHeight: 560 }}
    >
      {/* Background image */}
      <img
        src={BEANS_IMAGE}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Bottom fade to cream */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#FAF6F0] to-transparent pointer-events-none z-10" />

      {/* Floating beans — pure CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {CSS_BEANS.map(b => (
          <div
            key={b.id}
            className="fuji-bean absolute"
            style={{
              left: `${b.x}%`,
              bottom: "-50px",
              width: b.size,
              height: b.size * 0.67,
              opacity: b.opacity,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          >
            <BeanSVG />
          </div>
        ))}
      </div>

      {/* Main content — visible immediately, animates in via CSS */}
      <div className="fuji-hero-content relative z-10 flex flex-col items-center text-center px-4 select-none">

        {/* Logo */}
        <div className="mb-5 flex items-center justify-center">
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              padding: "10px 14px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <img
              src="/fuji-logo.png"
              alt="Fuji Cafe"
              className="h-10 md:h-12 w-auto"
              style={{ mixBlendMode: "multiply", filter: "brightness(0.85)" }}
            />
          </div>
        </div>

        {/* ── FUJI — English, large ── */}
        <div>
          <h1 className="fuji-hero-title">FUJI</h1>
          <div className="fuji-hero-subtitle">CAFE</div>
        </div>

        {/* Arabic name */}
        <div className="mt-3 mb-5" dir="rtl">
          <span className="fuji-hero-arabic">فوجي كافيه</span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-5 w-[260px]">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(232,99,122,0.7))" }} />
          <BeanIcon />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(232,99,122,0.7))" }} />
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p
            className="font-bold mb-1"
            dir="rtl"
            style={{
              fontFamily: "'Alexandria', sans-serif",
              fontSize: "clamp(14px, 2.8vw, 22px)",
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 2px 16px rgba(0,0,0,0.9)",
            }}
          >
            كل القهوة كيف —{" "}
            <span style={{ color: "#E8637A" }}>وفوجي هو أصل الكيف</span>
          </p>
          <p
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(11px, 1.6vw, 14px)",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.05em",
              fontStyle: "italic",
            }}
          >
            All coffee is joy —{" "}
            <span style={{ color: "rgba(232,99,122,0.75)" }}>Fuji is the origin of joy</span>
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 group cursor-pointer"
        aria-label={isRtl ? "اكتشف" : "Discover"}
        style={{ opacity: 1 }}
      >
        <span
          className="group-hover:text-[#E8637A] transition-colors"
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {isRtl ? "اكتشف" : "Discover"}
        </span>
        <div className="fuji-bounce">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round"
            className="group-hover:stroke-[#E8637A] transition-all"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="w-px h-5 bg-gradient-to-b from-white/20 to-transparent" />
      </button>
    </section>
  );
}

function BeanSVG() {
  return (
    <svg viewBox="0 0 60 40" fill="none" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="30" cy="20" rx="28" ry="18" fill="#6B3F2A" />
      <ellipse cx="30" cy="20" rx="22" ry="13" fill="#8B5A3C" />
      <path d="M30 7 Q34 20 30 33" stroke="#4f2e1e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function BeanIcon() {
  return (
    <svg viewBox="0 0 24 16" width="26" height="17" fill="none" style={{ opacity: 0.65 }}>
      <ellipse cx="12" cy="8" rx="11" ry="7" fill="#C8956C" />
      <ellipse cx="12" cy="8" rx="8" ry="5" fill="#8B5A3C" />
      <path d="M12 3 Q14 8 12 13" stroke="#4f2e1e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const CSS_BEANS = [
  { id: 0, x: 4,  size: 26, dur: 12, delay: 0,   opacity: 0.2  },
  { id: 1, x: 17, size: 16, dur: 9,  delay: 1.5,  opacity: 0.13 },
  { id: 2, x: 29, size: 36, dur: 14, delay: 2.9,  opacity: 0.22 },
  { id: 3, x: 43, size: 20, dur: 11, delay: 0.8,  opacity: 0.16 },
  { id: 4, x: 57, size: 30, dur: 13, delay: 3.6,  opacity: 0.19 },
  { id: 5, x: 69, size: 42, dur: 16, delay: 4.3,  opacity: 0.20 },
  { id: 6, x: 81, size: 24, dur: 12, delay: 2.2,  opacity: 0.17 },
  { id: 7, x: 92, size: 32, dur: 13, delay: 0.4,  opacity: 0.20 },
];
