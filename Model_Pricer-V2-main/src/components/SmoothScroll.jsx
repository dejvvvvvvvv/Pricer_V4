import { useEffect } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll
 * Adds a premium smooth scrolling feel (wheel + touchpad).
 * Safe no-op on SSR. Destroyed on unmount.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      // smaller = more "floaty", bigger = more direct
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
