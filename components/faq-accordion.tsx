"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";

const faqs = [
  {
    q: "Apakah harus membuat akun untuk booking?",
    a: "Tidak. Anda cukup memilih paket dan jadwal, lalu mengisi biodata satu kali — tanpa perlu mendaftar akun.",
  },
  {
    q: "Berapa DP untuk mengunci jadwal?",
    a: "DP berkisar Rp100.000–200.000 untuk mengunci jadwal Anda. Pelunasan dilakukan saat proses belajar sesuai kesepakatan.",
  },
  {
    q: "Bagaimana cara membayar?",
    a: "Pembayaran dilakukan via QRIS atau transfer ke rekening resmi yang tertera setelah booking, lalu unggah bukti pembayaran di website. Admin akan memverifikasi dan mengonfirmasi booking Anda.",
  },
  {
    q: "Bagaimana cara cek status booking?",
    a: "Buka menu “Cek Status”, lalu masukkan kode booking dan nomor WhatsApp yang Anda gunakan saat mendaftar.",
  },
  {
    q: "Bagaimana jika saya tidak bisa hadir?",
    a: "Segera beri tahu admin. Jika Anda konfirmasi lebih dulu, Anda mendapat kompensasi 1 jam untuk sesi berikutnya. Tanpa konfirmasi, sesi dianggap hangus.",
  },
  {
    q: "Apakah ada kelas malam?",
    a: "Ada, pukul 18.00–20.00, dengan tambahan biaya Rp20.000. Tersedia juga antar-jemput siswa sesuai paket.",
  },
];

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={i} delay={i * 55}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
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
            {isOpen && (
              <p className="animate-fade-in px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            )}
          </Reveal>
        );
      })}
    </div>
  );
}
