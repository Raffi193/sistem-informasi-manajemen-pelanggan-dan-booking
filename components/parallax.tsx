"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Parallax ringan dengan requestAnimationFrame. Dimatikan di mobile dan
 * saat pengguna meminta pengurangan animasi.
 */
export function Parallax({
  children,
  className,
  speed = 0.03,
  maxOffset = 16,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  maxOffset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (reducedMotion || isMobile) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const distance = rect.top + rect.height / 2 - window.innerHeight / 2;
      const offset = Math.max(
        -maxOffset,
        Math.min(maxOffset, distance * speed),
      );
      node.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      node.style.transform = "";
    };
  }, [maxOffset, speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
