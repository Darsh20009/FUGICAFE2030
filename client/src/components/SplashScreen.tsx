import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    const dismiss = () => {
      setIsVisible(false);
      setTimeout(onFinish, 600);
    };

    if (video) {
      const failFallback = setTimeout(dismiss, 1500);
      const hardCap = setTimeout(dismiss, 5000);

      const onCanPlay = () => {
        clearTimeout(failFallback);
        setVideoLoaded(true);
        video.playbackRate = 3;
        video.play().catch(() => {});
      };
      const onEnded = () => dismiss();

      video.addEventListener("canplaythrough", onCanPlay);
      video.addEventListener("ended", onEnded);

      return () => {
        video.removeEventListener("canplaythrough", onCanPlay);
        video.removeEventListener("ended", onEnded);
        clearTimeout(failFallback);
        clearTimeout(hardCap);
      };
    } else {
      const t = setTimeout(dismiss, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#FAF6F0]"
        >
          {!videoLoaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <img
                src="/fuji-logo.png"
                alt="Fuji Cafe"
                className="h-32 md:h-40 w-auto object-contain"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#E8637A] to-transparent animate-pulse" />
                <p className="text-[#6B3F2A] text-sm font-light tracking-widest">فوجي كافيه</p>
              </div>
            </motion.div>
          )}
          <video
            ref={videoRef}
            src="/videos/splash.mp4"
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: "#FAF6F0" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
