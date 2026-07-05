const fil = {
  loyaltyCard: "Loyalty Card",
  stampsOf: "{stamps} sa {threshold} stamp",
  toGo: "{remaining} pa",
  rewardReady: "Handa na ang reward!",
  stampsAwayPersonal: "{name}, {n} stamp na lang at libre na!",
  stampsAwayGeneric: "Mag-collect ng {n} stamp para sa libreng isa",
  stampsEarnedRedeemed: "{earned} stamp · {redeemed} reward na-claim",

  requestStamp: "Humingi ng Stamp",
  connecting: "Kumukonekta…",
  rewardAvailable: "May reward ka!",
  redeemReward: "I-claim ang Reward",
  getAnotherStamp: "Humingi ng Isa Pang Stamp",
  sendingRequest: "Pinapadala ang request…",
  waitingApproval: "Hinihintay ang pag-apruba ng counter…",

  yourName: "Pangalan mo",
  yourEmail: "Email mo",
  setPassword: "Maglagay ng password",
  whySaveDetails: "Bakit i-save ang details?",
  whySaveBody:
    "Kapag in-save mo ang pangalan at email mo, kahit magpalit ka ng phone, mag-clear ng browser, o mag-visit ng ibang tindahan, mababalik ka pa rin sa mga stamp mo.",
  remainAnonymous: "Manatiling anonymous",
  save: "I-save",
  invalidEmail: "Pakilagay ng tamang email",

  haveExistingAccount: "May account ka na? Mag-log in",
  email: "Email",
  password: "Password",
  cancel: "Kanselahin",
  logIn: "Mag-log in",
  loggingIn: "Nagla-log in…",

  switchShop: "Magpalit ng tindahan",
  stampsOutOfThreshold: "{stamps} / {threshold} stamp",

  plusOneStamp: "+1 stamp!",
  rewardRedeemed: "Na-claim ang reward — enjoy mo!",

  loyaltyCardEyebrow: "LOYALTY CARD",
  buyXGetFree: "Bumili ng {n}. Libre ang isa.",
  scanWithCamera: "I-scan gamit ang camera ng phone",
  noAppRequired: "Walang app · Gumagana sa anumang phone",

  // Wallet passes (Apple/Google) — text na naka-baked sa card ng customer
  walletBalanceLabel: "Mga Stamp",
  walletRedeemedLabel: "Na-claim",
  walletPerkPointsLabel: "Libreng reward",
  walletRedeemedValue: "{count} na-claim",
  walletMemberLabel: "Miyembro",
  walletRewardLabel: "Reward",
  walletRewardValue: "Libre sa {threshold}",
  walletRecoverLabel: "Ang iyong card",
  walletRecoverValue: "Buksan ang iyong card online: {url}",
  walletRecoverLinkDescription: "Tingnan o i-recover ang aking card",
  walletProgramName: "Loyalty ng {shop}",
  walletPerkProgramName: "Perk ng staff",
  walletLogoDescription: "Logo ng {shop}",

  poweredBy: "Pinapatakbo ng",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "I-update ang mga detalye",
  saveDetails: "I-save ang detalye",
  yourDetails: "Iyong mga detalye",
  back: "Bumalik",
  saveChanges: "I-save ang mga pagbabago",
  saving: "Sine-save…",
  detailsUpdated: "Na-update ang mga detalye",
  couldNotSave: "Hindi ma-save ang mga pagbabago — subukang muli.",
} as const;

export default fil;
