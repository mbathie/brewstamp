const hi = {
  loyaltyCard: "लॉयल्टी कार्ड",
  stampsOf: "{threshold} में से {stamps} स्टैम्प",
  toGo: "{remaining} और बाकी",
  rewardReady: "इनाम तैयार है!",
  stampsAwayPersonal: "{name}, बस {n} स्टैम्प और एक मुफ़्त के लिए!",
  stampsAwayGeneric: "1 मुफ़्त पाने के लिए {n} स्टैम्प इकट्ठा करें",
  stampsEarnedRedeemed: "{earned} स्टैम्प · {redeemed} इनाम भुनाए",

  requestStamp: "स्टैम्प मांगें",
  connecting: "कनेक्ट हो रहा है…",
  rewardAvailable: "आपका इनाम तैयार है!",
  redeemReward: "इनाम भुनाएँ",
  getAnotherStamp: "एक और स्टैम्प पाएँ",
  sendingRequest: "अनुरोध भेजा जा रहा है…",
  waitingApproval: "काउंटर से मंज़ूरी की प्रतीक्षा है…",

  yourName: "आपका नाम",
  yourEmail: "आपका ईमेल",
  setPassword: "पासवर्ड बनाएँ",
  whySaveDetails: "जानकारी क्यों सेव करें?",
  whySaveBody:
    "जानकारी सेव करने से अगर आप फ़ोन बदलें, ब्राउज़र साफ़ करें, या किसी और दुकान जाएँ, हम आपके स्टैम्प वापस जोड़ सकते हैं।",
  remainAnonymous: "गुमनाम रहें",
  save: "सेव करें",
  invalidEmail: "कृपया मान्य ईमेल दर्ज करें",

  haveExistingAccount: "खाता है? लॉग इन करें",
  email: "ईमेल",
  password: "पासवर्ड",
  cancel: "रद्द करें",
  logIn: "लॉग इन",
  loggingIn: "लॉग इन हो रहा है…",

  switchShop: "दुकान बदलें",
  stampsOutOfThreshold: "{stamps} / {threshold} स्टैम्प",

  plusOneStamp: "+1 स्टैम्प!",
  rewardRedeemed: "इनाम भुनाया — आनंद लें!",

  loyaltyCardEyebrow: "लॉयल्टी कार्ड",
  buyXGetFree: "{n} खरीदें। 1 मुफ़्त पाएँ।",
  scanWithCamera: "अपने फ़ोन कैमरे से स्कैन करें",
  noAppRequired: "ऐप नहीं चाहिए · हर फ़ोन पर चलता है",

  // Wallet passes (Apple/Google) — ग्राहक के कार्ड में शामिल टेक्स्ट
  walletBalanceLabel: "स्टैम्प",
  walletRedeemedLabel: "भुनाए गए",
  walletPerkPointsLabel: "मुफ़्त इनाम",
  walletRedeemedValue: "{count} भुनाए गए",
  walletMemberLabel: "सदस्य",
  walletRewardLabel: "इनाम",
  walletRewardValue: "{threshold} पर मुफ़्त",
  walletRecoverLabel: "आपका कार्ड",
  walletRecoverValue: "अपना कार्ड ऑनलाइन खोलें: {url}",
  walletRecoverLinkDescription: "मेरा कार्ड देखें या पुनर्प्राप्त करें",
  walletProgramName: "{shop} लॉयल्टी",
  walletPerkProgramName: "स्टाफ़ भत्ता",
  walletLogoDescription: "{shop} लोगो",

  poweredBy: "द्वारा संचालित",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "विवरण अपडेट करें",
  saveDetails: "विवरण सहेजें",
  yourDetails: "आपका विवरण",
  back: "वापस",
  saveChanges: "बदलाव सहेजें",
  saving: "सहेजा जा रहा है…",
  detailsUpdated: "विवरण अपडेट हो गया",
  couldNotSave: "बदलाव सहेजे नहीं जा सके — फिर से प्रयास करें।",
} as const;

export default hi;
