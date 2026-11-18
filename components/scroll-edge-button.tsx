"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ScrollEdgeButton() {
  const pathname = usePathname();
  const [atBottom, setAtBottom] = useState(false);
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return;

    let frame = 0;
    const timeouts: number[] = [];

    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      setAtBottom(scrollTop + viewportHeight >= scrollHeight - 120);
    };

    const queueUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("load", queueUpdate);

    const observer = new ResizeObserver(queueUpdate);
    observer.observe(document.documentElement);
    observer.observe(document.body);

    document.fonts?.ready.then(queueUpdate).catch(() => {});
    for (const delay of [100, 400, 1000]) {
      timeouts.push(window.setTimeout(queueUpdate, delay));
    }

    return () => {
      window.cancelAnimationFrame(frame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      window.removeEventListener("load", queueUpdate);
      observer.disconnect();
    };
  }, [isAdmin]);

  if (isAdmin) {
    return null;
  }

  function handleClick() {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={atBottom ? "Scroll ke atas" : "Scroll ke bawah"}
      title={atBottom ? "Scroll ke atas" : "Scroll ke bawah"}
      className="fixed bottom-24 right-4 z-[9999] flex size-12 items-center justify-center rounded-full border border-border bg-white/90 text-primary shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-xl active:scale-95 dark:bg-card/90 md:bottom-8"
    >
      {atBottom ? (
        <ArrowUp className="size-5" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}