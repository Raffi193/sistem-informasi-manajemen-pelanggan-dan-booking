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

    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      setAtBottom(scrollTop + viewportHeight >= scrollHeight - 120);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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
      className="fixed bottom-24 right-4 z-[9999] flex size-12 items-center justify-center rounded-full border border-border bg-white/90 text-primary shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white hover:shadow-xl active:scale-95 md:bottom-8"
    >
      {atBottom ? (
        <ArrowUp className="size-5" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}