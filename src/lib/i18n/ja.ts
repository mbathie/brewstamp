const ja = {
  loyaltyCard: "ロイヤリティカード",
  stampsOf: "{threshold}個中 {stamps}個",
  toGo: "あと {remaining}",
  rewardReady: "リワードを獲得!",
  stampsAwayPersonal: "{name}さん、あと{n}個でドリンク1杯無料!",
  stampsAwayGeneric: "スタンプを{n}個ためると1杯無料",
  stampsEarnedRedeemed:
    "獲得 {earned}個 · 引換 {redeemed}回",

  requestStamp: "スタンプをもらう",
  connecting: "接続中…",
  rewardAvailable: "リワードが使えます!",
  redeemReward: "リワードを使う",
  getAnotherStamp: "もう1個スタンプをもらう",
  sendingRequest: "送信中…",
  waitingApproval: "カウンターの承認を待っています…",

  yourName: "お名前",
  yourEmail: "メールアドレス",
  setPassword: "パスワードを設定",
  whySaveDetails: "情報を保存する理由",
  whySaveBody:
    "情報を保存すると、機種変更やブラウザのリセット、他店舗へ行ったときでもスタンプを引き継げます。",
  remainAnonymous: "匿名のままにする",
  save: "保存",
  invalidEmail: "有効なメールアドレスを入力してください",

  haveExistingAccount: "アカウントをお持ちの方はログイン",
  email: "メールアドレス",
  password: "パスワード",
  cancel: "キャンセル",
  logIn: "ログイン",
  loggingIn: "ログイン中…",

  switchShop: "店舗を切り替える",
  stampsOutOfThreshold: "{stamps} / {threshold}",

  plusOneStamp: "+1スタンプ!",
  rewardRedeemed: "リワードを引換しました — お楽しみください!",

  loyaltyCardEyebrow: "ロイヤリティカード",
  buyXGetFree: "{n}杯購入で1杯無料。",
  scanWithCamera: "スマホのカメラでスキャン",
  noAppRequired: "アプリ不要 · どのスマホでも",

  // Wallet passes (Apple/Google) — お客様のカードに埋め込まれるテキスト
  walletBalanceLabel: "スタンプ",
  walletRedeemedLabel: "引換済み",
  walletPerkPointsLabel: "無料リワード",
  walletRedeemedValue: "{count}回引換",
  walletMemberLabel: "メンバー",
  walletRewardLabel: "リワード",
  walletRewardValue: "{threshold}個で無料",
  walletRecoverLabel: "あなたのカード",
  walletRecoverValue: "カードをオンラインで開く: {url}",
  walletRecoverLinkDescription: "カードを表示または復元",
  walletProgramName: "{shop} ロイヤリティ",
  walletPerkProgramName: "スタッフ特典",
  walletLogoDescription: "{shop} ロゴ",

  poweredBy: "提供",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "詳細を更新",
  saveDetails: "詳細を保存",
  yourDetails: "あなたの情報",
  back: "戻る",
  saveChanges: "変更を保存",
  saving: "保存中…",
  detailsUpdated: "情報を更新しました",
  couldNotSave: "変更を保存できませんでした。もう一度お試しください。",
} as const;

export default ja;
