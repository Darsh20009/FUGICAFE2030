import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const BEAN_IMGS = [
  "/beans/bean1.png",
  "/beans/bean2.png",
  "/beans/bean3.png",
  "/beans/bean4.png",
  "/beans/bean5.png",
  "/beans/bean6.png",
];

const GLOBAL_BEANS = [
  // ── Edges (more visible) ─────────────────────────────────────
  { id: "g0",  x: 2,   size: 58,  dur: 22, delay: 0,    opacity: 0.22, rotate: -15,  img: 0 },
  { id: "g1",  x: 96,  size: 46,  dur: 18, delay: 3,    opacity: 0.20, rotate: 40,   img: 2 },
  { id: "g2",  x: 5,   size: 34,  dur: 26, delay: 7,    opacity: 0.18, rotate: 20,   img: 4 },
  { id: "g3",  x: 93,  size: 52,  dur: 20, delay: 11,   opacity: 0.22, rotate: -55,  img: 1 },
  { id: "g4",  x: 1,   size: 40,  dur: 24, delay: 15,   opacity: 0.16, rotate: 70,   img: 3 },
  { id: "g5",  x: 97,  size: 36,  dur: 19, delay: 5,    opacity: 0.20, rotate: -30,  img: 5 },
  { id: "g6",  x: 8,   size: 26,  dur: 16, delay: 19,   opacity: 0.15, rotate: 90,   img: 2 },
  { id: "g7",  x: 91,  size: 42,  dur: 23, delay: 9,    opacity: 0.18, rotate: 10,   img: 0 },
  // ── Quarter zones (medium) ──────────────────────────────────
  { id: "g8",  x: 18,  size: 28,  dur: 28, delay: 4,    opacity: 0.10, rotate: 25,   img: 3 },
  { id: "g9",  x: 78,  size: 32,  dur: 21, delay: 13,   opacity: 0.10, rotate: -40,  img: 5 },
  { id: "g10", x: 22,  size: 24,  dur: 30, delay: 17,   opacity: 0.08, rotate: 60,   img: 1 },
  { id: "g11", x: 75,  size: 30,  dur: 25, delay: 8,    opacity: 0.08, rotate: -20,  img: 4 },
  // ── Middle (fewer, lighter) ──────────────────────────────────
  { id: "g12", x: 38,  size: 20,  dur: 32, delay: 6,    opacity: 0.06, rotate: 45,   img: 2 },
  { id: "g13", x: 62,  size: 18,  dur: 29, delay: 21,   opacity: 0.06, rotate: -10,  img: 0 },
  { id: "g14", x: 50,  size: 16,  dur: 35, delay: 14,   opacity: 0.05, rotate: 80,   img: 3 },
];

export function GlobalFloatingBeans() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 15 }}
      aria-hidden="true"
    >
      {GLOBAL_BEANS.map((b) => (
        <div
          key={b.id + location}
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
              mixBlendMode: "multiply",
            }}
          />
        </div>
      ))}
    </div>
  );
}
