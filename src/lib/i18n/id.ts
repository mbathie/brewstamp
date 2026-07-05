const id = {
  loyaltyCard: "Kartu Loyalitas",
  stampsOf: "{stamps} dari {threshold} stempel",
  toGo: "{remaining} lagi",
  rewardReady: "Hadiah siap!",
  stampsAwayPersonal: "{name}, tinggal {n} stempel lagi untuk gratis 1!",
  stampsAwayGeneric: "Kumpulkan {n} stempel untuk dapat 1 gratis",
  stampsEarnedRedeemed: "{earned} stempel · {redeemed} hadiah ditukar",

  requestStamp: "Minta Stempel",
  connecting: "Menghubungkan…",
  rewardAvailable: "Anda punya hadiah!",
  redeemReward: "Tukar Hadiah",
  getAnotherStamp: "Minta Stempel Lagi",
  sendingRequest: "Mengirim permintaan…",
  waitingApproval: "Menunggu persetujuan dari kasir…",

  yourName: "Nama Anda",
  yourEmail: "Email Anda",
  setPassword: "Buat kata sandi",
  whySaveDetails: "Kenapa simpan data?",
  whySaveBody:
    "Menyimpan data memungkinkan kami menyatukan kembali Anda dengan stempel jika Anda ganti HP, hapus browser, atau berkunjung ke toko lain.",
  remainAnonymous: "Tetap anonim",
  save: "Simpan",
  invalidEmail: "Mohon masukkan email yang valid",

  haveExistingAccount: "Punya akun? Masuk",
  email: "Email",
  password: "Kata sandi",
  cancel: "Batal",
  logIn: "Masuk",
  loggingIn: "Sedang masuk…",

  switchShop: "Ganti toko",
  stampsOutOfThreshold: "{stamps} / {threshold} stempel",

  plusOneStamp: "+1 stempel!",
  rewardRedeemed: "Hadiah ditukar — selamat menikmati!",

  loyaltyCardEyebrow: "KARTU LOYALITAS",
  buyXGetFree: "Beli {n}. Gratis 1.",
  scanWithCamera: "Pindai dengan kamera HP",
  noAppRequired: "Tanpa aplikasi · Bekerja di semua HP",

  // Wallet passes (Apple/Google) — teks yang tertanam di kartu pelanggan
  walletBalanceLabel: "Stempel",
  walletRedeemedLabel: "Ditukar",
  walletPerkPointsLabel: "Hadiah gratis",
  walletRedeemedValue: "{count} ditukar",
  walletMemberLabel: "Anggota",
  walletRewardLabel: "Hadiah",
  walletRewardValue: "Gratis pada {threshold}",
  walletRecoverLabel: "Kartu Anda",
  walletRecoverValue: "Buka kartu Anda secara online: {url}",
  walletRecoverLinkDescription: "Lihat atau pulihkan kartu saya",
  walletProgramName: "Loyalitas {shop}",
  walletPerkProgramName: "Tunjangan staf",
  walletLogoDescription: "Logo {shop}",

  poweredBy: "Didukung oleh",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "Perbarui detail",
  saveDetails: "Simpan detail",
  yourDetails: "Detail Anda",
  back: "Kembali",
  saveChanges: "Simpan perubahan",
  saving: "Menyimpan…",
  detailsUpdated: "Detail diperbarui",
  couldNotSave: "Tidak dapat menyimpan perubahan — coba lagi.",
} as const;

export default id;
