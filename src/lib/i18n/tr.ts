// Turkish — translation of en.ts. Placeholders use {name} syntax.

const tr = {
  // Card hero
  loyaltyCard: "Sadakat Kartı",
  stampsOf: "{threshold} damgadan {stamps} tanesi",
  toGo: "{remaining} kaldı",
  rewardReady: "Ödül hazır!",
  stampsAwayPersonal: "{name}, ücretsiz bir tane için {n} tane daha!",
  stampsAwayGeneric: "1 ücretsiz kazanmak için {n} damga toplayın",
  stampsEarnedRedeemed: "{earned} damga kazanıldı · {redeemed} ödül kullanıldı",

  // Action buttons
  requestStamp: "Damga İste",
  connecting: "Bağlanıyor...",
  rewardAvailable: "Kullanabileceğiniz bir ödülünüz var!",
  redeemReward: "Ödülü Kullan",
  getAnotherStamp: "Bir Damga Daha Al",
  sendingRequest: "İstek gönderiliyor...",
  waitingApproval: "Tezgâhtan onay bekleniyor...",

  // Customer details prompt
  yourName: "Adınız",
  yourEmail: "E-postanız",
  setPassword: "Bir şifre belirleyin",
  whySaveDetails: "Bilgilerinizi neden kaydedesiniz?",
  whySaveBody:
    "Bilgilerinizi kaydetmek; telefonunuzu değiştirdiğinizde, tarayıcınızı temizlediğinizde veya başka bir mağazayı ziyaret ettiğinizde damgalarınıza yeniden kavuşmanızı sağlar.",
  remainAnonymous: "Anonim kal",
  save: "Kaydet",
  invalidEmail: "Lütfen geçerli bir e-posta girin",

  // Login
  haveExistingAccount: "Hesabınız var mı? Giriş yapın",
  email: "E-posta",
  password: "Şifre",
  cancel: "İptal",
  logIn: "Giriş yap",
  loggingIn: "Giriş yapılıyor...",

  // Switch shop
  switchShop: "Mağaza değiştir",
  updateDetails: "Bilgileri güncelle",
  yourDetails: "Bilgileriniz",
  back: "Geri",
  saveChanges: "Değişiklikleri kaydet",
  saving: "Kaydediliyor…",
  detailsUpdated: "Bilgiler güncellendi",
  couldNotSave: "Değişiklikler kaydedilemedi — tekrar deneyin.",
  stampsOutOfThreshold: "{stamps} / {threshold} damga",

  // Approved feedback (in-place toasts/messages)
  plusOneStamp: "+1 damga!",
  rewardRedeemed: "Ödül kullanıldı — afiyet olsun!",

  // PDF
  loyaltyCardEyebrow: "SADAKAT KARTI",
  buyXGetFree: "{n} al. Bir tane bedava.",
  scanWithCamera: "Telefon kameranızla tarayın",
  noAppRequired: "Uygulama gerekmez · Her telefonda çalışır",

  // Footer
  poweredBy: "Sağlayan",
} as const;

export default tr;
