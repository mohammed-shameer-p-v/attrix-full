import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";

export const StatNumber = ({ value, suffix = "", prefix = "", decimals = 0, duration = 1400 }: {
  value: number; suffix?: string; prefix?: string; decimals?: number; duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const v = useCountUp(value, duration, inView);
  return <span ref={ref}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
};
