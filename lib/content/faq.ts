export type FaqItem = {
  q: string;
  a: string;
};

/**
 * Sumber tunggal FAQ untuk tampilan accordion dan structured data FAQPage.
 */
export const faqs: FaqItem[] = [
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
