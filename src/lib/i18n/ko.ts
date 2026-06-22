const ko = {
  loyaltyCard: "로열티 카드",
  stampsOf: "{threshold}개 중 {stamps}개",
  toGo: "{remaining}개 남음",
  rewardReady: "리워드 준비 완료!",
  stampsAwayPersonal: "{name}님, {n}개 더 모으면 무료 한 잔!",
  stampsAwayGeneric: "{n}개 모으면 1잔 무료",
  stampsEarnedRedeemed:
    "총 {earned}개 적립 · 리워드 {redeemed}회 사용",

  requestStamp: "스탬프 받기",
  connecting: "연결 중…",
  rewardAvailable: "사용 가능한 리워드가 있어요!",
  redeemReward: "리워드 사용",
  getAnotherStamp: "스탬프 한 개 더",
  sendingRequest: "전송 중…",
  waitingApproval: "카운터 승인 대기 중…",

  yourName: "이름",
  yourEmail: "이메일",
  setPassword: "비밀번호 설정",
  whySaveDetails: "정보를 저장하는 이유",
  whySaveBody:
    "정보를 저장하면 휴대폰을 바꾸거나, 브라우저를 초기화하거나, 다른 매장에서 방문해도 스탬프를 유지할 수 있어요.",
  remainAnonymous: "익명으로 두기",
  save: "저장",
  invalidEmail: "올바른 이메일을 입력하세요",

  haveExistingAccount: "이미 계정이 있나요? 로그인",
  email: "이메일",
  password: "비밀번호",
  cancel: "취소",
  logIn: "로그인",
  loggingIn: "로그인 중…",

  switchShop: "매장 전환",
  stampsOutOfThreshold: "{stamps} / {threshold} 스탬프",

  plusOneStamp: "+1 스탬프!",
  rewardRedeemed: "리워드 사용 완료 — 맛있게 드세요!",

  loyaltyCardEyebrow: "로열티 카드",
  buyXGetFree: "{n}잔 구매 시 1잔 무료.",
  scanWithCamera: "휴대폰 카메라로 스캔",
  noAppRequired: "앱 설치 불필요 · 모든 스마트폰 호환",

  poweredBy: "제공",

  // Customer edit-details flow (synced from en.ts)
  updateDetails: "정보 수정",
  saveDetails: "정보 저장",
  yourDetails: "내 정보",
  back: "뒤로",
  saveChanges: "변경사항 저장",
  saving: "저장 중…",
  detailsUpdated: "정보가 업데이트되었습니다",
  couldNotSave: "변경사항을 저장하지 못했습니다 — 다시 시도해 주세요.",
} as const;

export default ko;
