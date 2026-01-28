import React, { useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView, useMotionValue } from "framer-motion";

/**
 * MotionNumber
 * - Animates from 0 -> value when it enters viewport
 * - Supports decimals + prefix/suffix
 */
export default function MotionNumber({
  value,
  decimals = 0,
  duration = 1.2,
  delay = 0,
  prefix = "",
  suffix = "",
  className = "",
  format,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  const formatter = useMemo(() => {
    if (typeof format === "function") return format;
    return (n) =>
      n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  }, [decimals, format]);

  useEffect(() => {
    const unsub = mv.on("change", (latest) => setDisplay(formatter(latest)));
    return () => unsub?.();
  }, [mv, formatter]);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [isInView, mv, value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
