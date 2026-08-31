"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps content and fades/slides it in when scrolled into view.
 * Falls back to visible immediately if IntersectionObserver is unavailable
 * or the user prefers reduced motion.
 */
export function Reveal({
  children,
  delay,
  className = "",
}: {
  children: ReactNode;
  delay?: 1 | 2 | 3;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const d = delay ? `d${delay}` : "";
  return (
    <div ref={ref} className={`reveal ${d} ${className}`}>
      {children}
    </div>
  );
}
