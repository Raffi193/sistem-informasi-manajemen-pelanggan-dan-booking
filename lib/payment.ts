/**
 * Data pembayaran publik.
 *
 * Sebelum demo:
 * 1. Taruh gambar QRIS statis di `public/payment/qris.png`.
 * 2. Ganti nama merchant, bank, nomor rekening, dan pemilik rekening di bawah.
 */
export const NIGHT_SURCHARGE = 20_000;

export const PAYMENT = {
  dpLabel: "DP Rp100.000–200.000",

  qris: {
    imagePath: "/payment/qris.png",
    downloadName: "QRIS-LPK-CV-Fathan.png",
    merchantName: "Kursus Mengemudi Fathan",
  },

  bank: {
    bankName: "Nama Bank",
    accountNumber: "0000000000",
    accountHolder: "Nama Pemilik Rekening",
  },

  note: "Pastikan pembayaran hanya dilakukan ke QRIS atau rekening resmi di atas.",
} as const;
