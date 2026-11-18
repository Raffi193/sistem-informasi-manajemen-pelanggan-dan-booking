"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { faqs } from "@/lib/content/faq";

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        const answerId = `faq-answer-${i}`;
        return (
          <Reveal key={faq.q} delay={i * 55}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={answerId}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-secondary/50"
            >
              <span className="font-medium text-foreground">{faq.q}</span>
              <span
                className={`shrink-0 text-lg leading-none text-primary transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            <p
              id={answerId}
              hidden={!isOpen}
              className="animate-fade-in px-6 pb-5 text-sm leading-relaxed text-muted-foreground"
            >
              {faq.a}
            </p>
          </Reveal>
        );
      })}
    </div>
  );
}
