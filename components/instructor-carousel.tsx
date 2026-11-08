"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InstructorCard } from "@/components/instructor-card";
import type { InstrukturPublik } from "@/lib/data/instruktur";

const CARD_GAP = 20;

export function InstructorCarousel({
  instrukturList,
}: {
  instrukturList: InstrukturPublik[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => {
      setCanScrollPrev(scroller.scrollLeft > 4);
      setCanScrollNext(
        scroller.scrollLeft + scroller.clientWidth <
          scroller.scrollWidth - 4,
      );
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(update);
    observer?.observe(scroller);

    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [instrukturList.length]);

  const slide = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const card = scroller.querySelector<HTMLElement>("[data-instructor-card]");
    const distance = card
      ? card.offsetWidth + CARD_GAP
      : scroller.clientWidth * 0.8;

    scroller.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Daftar instruktur"
        tabIndex={0}
        className="grid snap-x snap-mandatory grid-flow-col auto-cols-[calc((100%-1.25rem)/2)] gap-5 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:auto-cols-[calc((100%-3.75rem)/4)]"
      >
        {instrukturList.map((instruktur) => (
          <div
            key={instruktur.id}
            data-instructor-card
            className="h-full snap-start"
          >
            <InstructorCard instruktur={instruktur} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Geser untuk melihat instruktur lainnya.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={!canScrollPrev}
            aria-label="Geser instruktur ke kiri"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={!canScrollNext}
            aria-label="Geser instruktur ke kanan"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
