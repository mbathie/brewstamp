// English — canonical source. All other dictionaries are translations of these strings.
// Placeholders use {name} syntax.

const en = {
  // Card hero
  loyaltyCard: "Loyalty Card",
  stampsOf: "{stamps} of {threshold} stamps",
  toGo: "{remaining} to go",
  rewardReady: "Reward ready!",
  stampsAwayPersonal: "{name}, {n} more for a free one!",
  stampsAwayGeneric: "Collect {n} stamps to earn 1 free",
  stampsEarnedRedeemed:
    "{earned} stamps earned · {redeemed} rewards redeemed",

  // Action buttons
  requestStamp: "Request Stamp",
  connecting: "Connecting...",
  rewardAvailable: "You have a reward available!",
  redeemReward: "Redeem Reward",
  getAnotherStamp: "Get Another Stamp",
  sendingRequest: "Sending request...",
  waitingApproval: "Waiting for approval from the counter...",

  // Customer details prompt
  yourName: "Your name",
  yourEmail: "Your email",
  setPassword: "Set a password",
  whySaveDetails: "Why save your details?",
  whySaveBody:
    "Saving your details lets us reunite you with your stamps if you change phone, clear your browser, or visit another shop.",
  remainAnonymous: "Remain anonymous",
  save: "Save",
  invalidEmail: "Please enter a valid email",

  // Login
  haveExistingAccount: "Have an existing account? Log in",
  email: "Email",
  password: "Password",
  cancel: "Cancel",
  logIn: "Log in",
  loggingIn: "Logging in...",

  // Switch shop
  switchShop: "Switch shop",
  updateDetails: "Update details",
  yourDetails: "Your details",
  back: "Back",
  saveChanges: "Save changes",
  saving: "Saving…",
  detailsUpdated: "Details updated",
  couldNotSave: "Couldn't save changes — try again.",
  stampsOutOfThreshold: "{stamps} / {threshold} stamps",

  // Approved feedback (in-place toasts/messages)
  plusOneStamp: "+1 stamp!",
  rewardRedeemed: "Reward redeemed — enjoy!",

  // PDF
  loyaltyCardEyebrow: "LOYALTY CARD",
  buyXGetFree: "Buy {n}. Get one free.",
  scanWithCamera: "Scan with your phone camera",
  noAppRequired: "No app required · Works on any phone",

  // Footer
  poweredBy: "Powered by",
} as const;

export default en;
