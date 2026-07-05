const ar = {
  loyaltyCard: "بطاقة الولاء",
  stampsOf: "{stamps} من {threshold} ختم",
  toGo: "متبقي {remaining}",
  rewardReady: "مكافأتك جاهزة!",
  stampsAwayPersonal:
    "{name}، تبقّى {n} ختم للحصول على واحد مجاني!",
  stampsAwayGeneric: "اجمع {n} أختام للحصول على واحد مجاني",
  stampsEarnedRedeemed:
    "{earned} ختم · {redeemed} مكافأة مُستلمة",

  requestStamp: "طلب ختم",
  connecting: "جارٍ الاتصال...",
  rewardAvailable: "لديك مكافأة متاحة!",
  redeemReward: "استلام المكافأة",
  getAnotherStamp: "ختم آخر",
  sendingRequest: "جارٍ الإرسال...",
  waitingApproval: "بانتظار الموافقة من الكاشير...",

  yourName: "اسمك",
  yourEmail: "بريدك الإلكتروني",
  setPassword: "تعيين كلمة مرور",
  whySaveDetails: "لماذا حفظ بياناتك؟",
  whySaveBody:
    "حفظ بياناتك يتيح لنا إيجاد أختامك إذا غيّرت هاتفك أو مسحت متصفحك أو زرت متجراً آخر.",
  remainAnonymous: "البقاء مجهول الهوية",
  save: "حفظ",
  invalidEmail: "أدخل بريداً إلكترونياً صحيحاً",

  haveExistingAccount: "لديك حساب بالفعل؟ تسجيل الدخول",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  cancel: "إلغاء",
  logIn: "تسجيل الدخول",
  loggingIn: "جارٍ تسجيل الدخول...",

  switchShop: "تبديل المتجر",
  stampsOutOfThreshold: "{stamps} / {threshold} ختم",

  plusOneStamp: "+1 ختم!",
  rewardRedeemed: "تم استلام المكافأة — استمتع!",

  loyaltyCardEyebrow: "بطاقة الولاء",
  buyXGetFree: "اشترِ {n} واحصل على واحد مجاناً.",
  scanWithCamera: "امسح بكاميرا هاتفك",
  noAppRequired: "بدون تطبيق · يعمل على أي هاتف",

  // Wallet passes (Apple/Google) — النص المضمّن في بطاقة العميل
  walletBalanceLabel: "الأختام",
  walletRedeemedLabel: "مُستلمة",
  walletPerkPointsLabel: "مكافآت مجانية",
  walletRedeemedValue: "{count} مُستلمة",
  walletMemberLabel: "عضو",
  walletRewardLabel: "مكافأة",
  walletRewardValue: "مجاناً عند {threshold}",
  walletRecoverLabel: "بطاقتك",
  walletRecoverValue: "افتح بطاقتك عبر الإنترنت: {url}",
  walletRecoverLinkDescription: "عرض بطاقتي أو استعادتها",
  walletProgramName: "ولاء {shop}",
  walletPerkProgramName: "ميزة الموظفين",
  walletLogoDescription: "شعار {shop}",

  poweredBy: "مدعوم من",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "تحديث التفاصيل",
  saveDetails: "حفظ التفاصيل",
  yourDetails: "بياناتك",
  back: "رجوع",
  saveChanges: "حفظ التغييرات",
  saving: "جارٍ الحفظ…",
  detailsUpdated: "تم تحديث البيانات",
  couldNotSave: "تعذّر حفظ التغييرات — حاول مرة أخرى.",
} as const;

export default ar;
