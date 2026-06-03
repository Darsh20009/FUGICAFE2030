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
  { id: "g0",  x: 2,   size: 60,  dur: 22, delay: 0,    opacity: 0.10, rotate: -15,  img: 0 },
  { id: "g1",  x: 96,  size: 48,  dur: 18, delay: 3,    opacity: 0.09, rotate: 40,   img: 2 },
  { id: "g2",  x: 5,   size: 36,  dur: 26, delay: 7,    opacity: 0.08, rotate: 20,   img: 4 },
  { id: "g3",  x: 92,  size: 54,  dur: 20, delay: 11,   opacity: 0.10, rotate: -55,  img: 1 },
  { id: "g4",  x: 1,   size: 42,  dur: 24, delay: 15,   opacity: 0.07, rotate: 70,   img: 3 },
  { id: "g5",  x: 97,  size: 38,  dur: 19, delay: 5,    opacity: 0.09, rotate: -30,  img: 5 },
  { id: "g6",  x: 8,   size: 28,  dur: 16, delay: 19,   opacity: 0.06, rotate: 90,   img: 2 },
  { id: "g7",  x: 90,  size: 44,  dur: 23, delay: 9,    opacity: 0.08, rotate: 10,   img: 0 },
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
      style={{ zIndex: 1 }}
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
              filter: "drop-shadow(0 2px 8px rgba(107,63,42,0.35))",
            }}
          />
        </div>
      ))}
    </div>
  );
}
