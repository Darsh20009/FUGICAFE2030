import { useEffect, useRef, useState } from "react";

const BEAN_IMGS = [
  "/beans/bean1.png",
  "/beans/bean2.png",
  "/beans/bean3.png",
  "/beans/bean4.png",
  "/beans/bean5.png",
  "/beans/bean6.png",
];

const GLOBAL_BEANS = [
  // ── Left edge ────────────────────────────────────────────────
  { id: "b0",  x: "1%",   y: "18%",  size: 56, dur: 7.5, delay: 0,   opacity: 0.18, img: 0 },
  { id: "b1",  x: "3%",   y: "42%",  size: 38, dur: 9.0, delay: 1.8, opacity: 0.14, img: 3 },
  { id: "b2",  x: "0.5%", y: "68%",  size: 46, dur: 8.2, delay: 3.5, opacity: 0.16, img: 5 },
  { id: "b3",  x: "2%",   y: "85%",  size: 30, dur: 6.8, delay: 5.2, opacity: 0.12, img: 2 },
  // ── Right edge ───────────────────────────────────────────────
  { id: "b4",  x: "95%",  y: "12%",  size: 50, dur: 8.5, delay: 0.8, opacity: 0.16, img: 1 },
  { id: "b5",  x: "97%",  y: "35%",  size: 42, dur: 7.0, delay: 2.5, opacity: 0.14, img: 4 },
  { id: "b6",  x: "94%",  y: "60%",  size: 34, dur: 9.5, delay: 4.2, opacity: 0.12, img: 0 },
  { id: "b7",  x: "96%",  y: "80%",  size: 48, dur: 7.8, delay: 6.0, opacity: 0.15, img: 3 },
];

export function GlobalFloatingBeans() {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), 400);
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
          key={b.id}
          className="fuji-bean-bob absolute"
          style={{
            left: b.x,
            top: b.y,
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
              mixBlendMode: "multiply",
            }}
          />
        </div>
      ))}
    </div>
  );
}
