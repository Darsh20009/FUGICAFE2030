import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/hooks/use-language";

const BEAN_IMGS = [
  "/beans/bean1.png",
  "/beans/bean2.png",
  "/beans/bean3.png",
  "/beans/bean4.png",
  "/beans/bean5.png",
  "/beans/bean6.png",
];

const CSS_BEANS = [
  { id: 0,  x: 3,   size: 52,  dur: 14, delay: 0,    opacity: 0.75, rotate: 0,    img: 0 },
  { id: 1,  x: 11,  size: 34,  dur: 10, delay: 1.8,  opacity: 0.60, rotate: 45,   img: 2 },
  { id: 2,  x: 21,  size: 68,  dur: 17, delay: 0.5,  opacity: 0.80, rotate: -20,  img: 4 },
  { id: 3,  x: 31,  size: 40,  dur: 12, delay: 3.2,  opacity: 0.65, rotate: 90,   img: 1 },
  { id: 4,  x: 42,  size: 56,  dur: 15, delay: 0.9,  opacity: 0.70, rotate: 135,  img: 5 },
  { id: 5,  x: 52,  size: 30,  dur: 11, delay: 4.5,  opacity: 0.55, rotate: -60,  img: 3 },
  { id: 6,  x: 62,  size: 72,  dur: 18, delay: 2.1,  opacity: 0.78, rotate: 30,   img: 0 },
  { id: 7,  x: 71,  size: 44,  dur: 13, delay: 0.2,  opacity: 0.62, rotate: -45,  img: 2 },
  { id: 8,  x: 80,  size: 36,  dur: 10, delay: 3.8,  opacity: 0.60, rotate: 75,   img: 4 },
  { id: 9,  x: 88,  size: 58,  dur: 16, delay: 1.4,  opacity: 0.72, rotate: -15,  img: 1 },
  { id: 10, x: 94,  size: 28,  dur: 9,  delay: 5.2,  opacity: 0.50, rotate: 120,  img: 5 },
  { id: 11, x: 7,   size: 46,  dur: 14, delay: 6.0,  opacity: 0.65, rotate: -80,  img: 3 },
];

export function FujiBeansHero() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [scrolled, setScrolled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!scrolled) {
        document.getElementById("main-content")?.scrollIntoView({ behavior: "smooth" });
        setScrolled(true);
      }
    }, 4500);
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
      {/* Original background image */}
      <img
        src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/58 pointer-events-none" />

      {/* Warm amber vignette center */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60vw", height: "60vw", maxWidth: 700, maxHeight: 700,
          borderRadius: "50%",
          top: "50%", left: "50%",
          transform: "translate(-50%, -55%)",
          background: "radial-gradient(circle, rgba(139,69,30,0.25) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Bottom fade to cream */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FAF6F0] to-transparent pointer-events-none z-10" />

      {/* Floating real bean images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {CSS_BEANS.map(b => (
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
                width: "100%",
                height: "100%",
                objectFit: "contain",
                transform: `rotate(${b.rotate}deg)`,
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
              }}
            />
          </div>
        ))}
      </div>

      {/* Large decorative bean — bottom left, partially cropped */}
      <img
        src="/beans/bean3.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          width: "clamp(200px,35vw,480px)",
          opacity: 0.12,
          bottom: "-60px",
          left: "-60px",
          transform: "rotate(-25deg)",
          filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.8))",
        }}
      />

      {/* Large decorative bean — top right */}
      <img
        src="/beans/bean5.png"
        alt=""
        aria-hidden="true"
        className="absolute pointer-events-none select-none"
        style={{
          width: "clamp(160px,28vw,380px)",
          opacity: 0.09,
          top: "-40px",
          right: "-50px",
          transform: "rotate(40deg)",
          filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.8))",
        }}
      />

      {/* Main content */}
      <div className="fuji-hero-content relative z-10 flex flex-col items-center text-center px-4 select-none">

        {/* Logo — fully transparent PNG, no container */}
        <div className="mb-6 flex items-center justify-center fuji-hero-logo">
          <img
            src="/fuji-logo-transparent.png"
            alt="Fuji Cafe"
            className="h-16 md:h-24 w-auto"
            style={{
              filter: "invert(1) sepia(0.15) brightness(0.92) drop-shadow(0 4px 28px rgba(0,0,0,0.95))",
            }}
          />
        </div>

        {/* FUJI title */}
        <div>
          <h1 className="fuji-hero-title">FUJI</h1>
          <div className="fuji-hero-subtitle">C A F E</div>
        </div>

        {/* Arabic name */}
        <div className="mt-4 mb-5" dir="rtl">
          <span className="fuji-hero-arabic">فوجي كافيه</span>
        </div>

        {/* Divider with real bean */}
        <div className="flex items-center gap-3 mb-5 w-[260px]">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(232,99,122,0.6))" }} />
          <img
            src="/beans/bean1.png"
            alt=""
            aria-hidden="true"
            style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.7))", opacity: 0.9 }}
          />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(232,99,122,0.6))" }} />
        </div>

        {/* Tagline */}
        <div className="text-center">
          <p
            className="font-bold mb-1"
            dir="rtl"
            style={{
              fontFamily: "'Alexandria', sans-serif",
              fontSize: "clamp(14px, 2.8vw, 22px)",
              color: "rgba(255,255,255,0.92)",
              textShadow: "0 2px 20px rgba(0,0,0,1)",
            }}
          >
            روح اليابان من قلب الرياض
          </p>
          <p
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: "clamp(11px, 1.6vw, 14px)",
              color: "rgba(255,255,255,0.40)",
              letterSpacing: "0.06em",
              fontStyle: "italic",
            }}
          >
            リヤドの中心部に日本の精神をお届けします。
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 group cursor-pointer"
        aria-label={isRtl ? "اكتشف" : "Discover"}
      >
        <span
          className="group-hover:text-[#E8637A] transition-colors"
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {isRtl ? "اكتشف" : "Discover"}
        </span>
        <div className="fuji-bounce">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round"
            className="group-hover:stroke-[#E8637A] transition-all"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="w-px h-5 bg-gradient-to-b from-white/15 to-transparent" />
      </button>
    </section>
  );
}
