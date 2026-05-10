// Landing-page copy for the localized /[lang] routes. Kept separate from the
// in-app i18n dictionaries because marketing copy and product UI strings have
// very different translation contexts.

export interface LandingCopy {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  dashboardNote: string;
  benefit1Title: string;
  benefit1Body: string;
  benefit2Title: string;
  benefit2Body: string;
  benefit3Title: string;
  benefit3Body: string;
  howItWorksTitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaButton: string;
}

export const LANDING_COPY: Record<string, LandingCopy> = {
  es: {
    metaTitle: "Tarjeta de fidelidad digital con QR para cafeterías",
    metaDescription:
      "Tarjeta de fidelidad QR para cafeterías. Sin app para tus clientes. Gratis hasta 100 sellos. Listo en 2 minutos.",
    heroTitle: "Tarjeta de fidelidad digital para cafeterías",
    heroSubtitle:
      "Sellos sin app. Tus clientes escanean un QR en tu mostrador — listo.",
    ctaPrimary: "Empieza gratis",
    ctaSecondary: "Cómo funciona",
    dashboardNote:
      "Tu panel de administración se mantiene en inglés — solo tus clientes ven la tarjeta en español.",
    benefit1Title: "Sin app que descargar",
    benefit1Body:
      "Tus clientes escanean el QR con la cámara del móvil y la tarjeta se abre en su navegador.",
    benefit2Title: "Gratis hasta 100 sellos",
    benefit2Body:
      "Sin tarjeta de crédito para empezar. Pruébalo unas semanas antes de pagar nada.",
    benefit3Title: "Configurado en 2 minutos",
    benefit3Body:
      "Imprime un QR, ponlo en tu mostrador, y ya estás funcionando.",
    howItWorksTitle: "Cómo funciona",
    step1Title: "Imprime y coloca tu QR",
    step1Body:
      "Descarga el PDF imprimible desde tu panel y ponlo donde tus clientes lo vean.",
    step2Title: "El cliente escanea con su móvil",
    step2Body:
      "Cámara del móvil → toca el enlace. Sin app, sin descarga, sin formulario.",
    step3Title: "Tú apruebas el sello",
    step3Body:
      "Aparece la solicitud en tu panel. Tocas Aprobar. El sello cae en su tarjeta al instante.",
    finalCtaTitle: "Empieza tu tarjeta de fidelidad gratis",
    finalCtaSubtitle: "Sin tarjeta de crédito. Listo en 2 minutos.",
    finalCtaButton: "Configurar mi cafetería",
  },
  fr: {
    metaTitle: "Carte de fidélité QR numérique pour cafés",
    metaDescription:
      "Carte de fidélité QR pour cafés et coffee shops. Sans appli pour vos clients. Gratuit jusqu'à 100 tampons. Prêt en 2 minutes.",
    heroTitle: "Carte de fidélité numérique pour cafés",
    heroSubtitle:
      "Des tampons sans appli. Vos clients scannent un QR au comptoir — c'est tout.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Comment ça marche",
    dashboardNote:
      "Votre tableau de bord reste en anglais — seuls vos clients voient la carte en français.",
    benefit1Title: "Aucune appli à télécharger",
    benefit1Body:
      "Vos clients scannent le QR avec l'appareil photo de leur téléphone et la carte s'ouvre dans leur navigateur.",
    benefit2Title: "Gratuit jusqu'à 100 tampons",
    benefit2Body:
      "Pas de carte bancaire pour commencer. Essayez quelques semaines avant de payer.",
    benefit3Title: "Installation en 2 minutes",
    benefit3Body:
      "Imprimez un QR, posez-le sur le comptoir, vous êtes en ligne.",
    howItWorksTitle: "Comment ça marche",
    step1Title: "Imprimez et placez votre QR",
    step1Body:
      "Téléchargez le PDF imprimable depuis votre tableau de bord et placez-le là où vos clients le verront.",
    step2Title: "Le client scanne avec son téléphone",
    step2Body:
      "Appareil photo → il tape sur le lien. Pas d'appli, pas de téléchargement, pas de formulaire.",
    step3Title: "Vous approuvez le tampon",
    step3Body:
      "La demande apparaît sur votre tableau de bord. Vous tapez Approuver. Le tampon arrive instantanément.",
    finalCtaTitle: "Lancez votre carte de fidélité gratuite",
    finalCtaSubtitle: "Sans carte bancaire. En ligne en 2 minutes.",
    finalCtaButton: "Configurer mon café",
  },
  de: {
    metaTitle: "Digitale QR-Stempelkarte für Cafés",
    metaDescription:
      "QR-Treuekarte für Cafés und Kaffeeshops. Keine App für deine Gäste. Bis 100 Stempel kostenlos. In 2 Minuten startklar.",
    heroTitle: "Digitale Treuekarte für Cafés",
    heroSubtitle:
      "Stempel ohne App. Deine Gäste scannen einen QR-Code an der Theke — fertig.",
    ctaPrimary: "Kostenlos starten",
    ctaSecondary: "So funktioniert's",
    dashboardNote:
      "Dein Dashboard bleibt auf Englisch — nur deine Gäste sehen die Karte auf Deutsch.",
    benefit1Title: "Keine App nötig",
    benefit1Body:
      "Deine Gäste scannen den QR-Code mit der Handykamera und die Treuekarte öffnet sich im Browser.",
    benefit2Title: "Bis 100 Stempel kostenlos",
    benefit2Body:
      "Keine Kreditkarte zum Start. Teste es ein paar Wochen, bevor du etwas bezahlst.",
    benefit3Title: "In 2 Minuten eingerichtet",
    benefit3Body:
      "QR ausdrucken, auf den Tresen legen, du bist live.",
    howItWorksTitle: "So funktioniert's",
    step1Title: "QR ausdrucken und platzieren",
    step1Body:
      "Lade das druckfertige PDF aus deinem Dashboard und stelle es so auf, dass deine Gäste es sehen.",
    step2Title: "Gast scannt mit dem Handy",
    step2Body:
      "Kamera → tippt auf den Link. Keine App, kein Download, kein Formular.",
    step3Title: "Du bestätigst den Stempel",
    step3Body:
      "Die Anfrage erscheint auf deinem Dashboard. Du tippst auf Bestätigen. Der Stempel landet sofort auf der Karte.",
    finalCtaTitle: "Starte deine kostenlose Treuekarte",
    finalCtaSubtitle: "Keine Kreditkarte. In 2 Minuten live.",
    finalCtaButton: "Mein Café einrichten",
  },
  pt: {
    metaTitle: "Cartão de fidelidade digital com QR para cafés",
    metaDescription:
      "Cartão de fidelidade QR para cafés. Sem app para seus clientes. Grátis até 100 selos. Pronto em 2 minutos.",
    heroTitle: "Cartão de fidelidade digital para cafés",
    heroSubtitle:
      "Selos sem app. Seus clientes escaneiam um QR no balcão — pronto.",
    ctaPrimary: "Começar grátis",
    ctaSecondary: "Como funciona",
    dashboardNote:
      "Seu painel continua em inglês — só seus clientes veem o cartão em português.",
    benefit1Title: "Sem app para baixar",
    benefit1Body:
      "Seus clientes escaneiam o QR com a câmera do celular e o cartão abre no navegador.",
    benefit2Title: "Grátis até 100 selos",
    benefit2Body:
      "Sem cartão de crédito para começar. Teste algumas semanas antes de pagar.",
    benefit3Title: "Configurado em 2 minutos",
    benefit3Body: "Imprima um QR, coloque no balcão, está no ar.",
    howItWorksTitle: "Como funciona",
    step1Title: "Imprima e coloque seu QR",
    step1Body:
      "Baixe o PDF do seu painel e coloque onde seus clientes vejam.",
    step2Title: "Cliente escaneia com o celular",
    step2Body:
      "Câmera → toca no link. Sem app, sem download, sem formulário.",
    step3Title: "Você aprova o selo",
    step3Body:
      "A solicitação aparece no seu painel. Toca Aprovar. O selo cai no cartão na hora.",
    finalCtaTitle: "Comece seu cartão de fidelidade grátis",
    finalCtaSubtitle: "Sem cartão de crédito. No ar em 2 minutos.",
    finalCtaButton: "Configurar meu café",
  },
  it: {
    metaTitle: "Tessera fedeltà QR digitale per caffetterie",
    metaDescription:
      "Tessera fedeltà QR per bar e caffetterie. Niente app per i tuoi clienti. Gratis fino a 100 timbri. Pronta in 2 minuti.",
    heroTitle: "Tessera fedeltà digitale per caffetterie",
    heroSubtitle:
      "Timbri senza app. I tuoi clienti scansionano un QR al bancone — fatto.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Come funziona",
    dashboardNote:
      "La tua dashboard resta in inglese — solo i tuoi clienti vedono la tessera in italiano.",
    benefit1Title: "Nessuna app da scaricare",
    benefit1Body:
      "I tuoi clienti scansionano il QR con la fotocamera del telefono e la tessera si apre nel browser.",
    benefit2Title: "Gratis fino a 100 timbri",
    benefit2Body:
      "Niente carta di credito per iniziare. Provala qualche settimana prima di pagare.",
    benefit3Title: "Pronta in 2 minuti",
    benefit3Body:
      "Stampi un QR, lo metti sul bancone, sei online.",
    howItWorksTitle: "Come funziona",
    step1Title: "Stampa e posiziona il QR",
    step1Body:
      "Scarica il PDF dalla dashboard e mettilo dove i tuoi clienti possono vederlo.",
    step2Title: "Il cliente scansiona col cellulare",
    step2Body:
      "Fotocamera → tocca il link. Niente app, niente download, niente form.",
    step3Title: "Approvi il timbro",
    step3Body:
      "La richiesta arriva sulla dashboard. Tocchi Approva. Il timbro compare subito sulla tessera.",
    finalCtaTitle: "Avvia la tua tessera fedeltà gratis",
    finalCtaSubtitle: "Niente carta di credito. Online in 2 minuti.",
    finalCtaButton: "Configura il mio bar",
  },
  zh: {
    metaTitle: "咖啡馆数字会员卡 — 二维码积分换免费咖啡",
    metaDescription:
      "为咖啡馆打造的二维码会员卡。顾客无需下载应用。前 100 次盖章免费。2 分钟即可上线。",
    heroTitle: "咖啡馆数字会员卡",
    heroSubtitle:
      "无需应用即可盖章。顾客在柜台扫一扫二维码——就这么简单。",
    ctaPrimary: "免费开始",
    ctaSecondary: "了解原理",
    dashboardNote:
      "您的店铺后台保持英文显示 — 只有顾客看到的卡片显示中文。",
    benefit1Title: "无需下载应用",
    benefit1Body:
      "顾客用手机相机扫描二维码,会员卡直接在浏览器中打开。",
    benefit2Title: "前 100 次盖章免费",
    benefit2Body:
      "无需信用卡即可开始。试用几周再决定是否付费。",
    benefit3Title: "2 分钟完成设置",
    benefit3Body: "打印二维码,放在柜台,即可上线。",
    howItWorksTitle: "工作原理",
    step1Title: "打印并放置您的二维码",
    step1Body:
      "从后台下载可打印的 PDF,放在顾客能看到的位置。",
    step2Title: "顾客用手机扫一扫",
    step2Body:
      "打开相机 → 点击链接。无需应用、无需下载、无需填表。",
    step3Title: "您在后台批准盖章",
    step3Body:
      "请求出现在您的后台。点击批准。盖章立即出现在顾客卡片上。",
    finalCtaTitle: "立即开通免费会员卡",
    finalCtaSubtitle: "无需信用卡。2 分钟即可上线。",
    finalCtaButton: "配置我的咖啡馆",
  },
  ja: {
    metaTitle: "カフェ向け QR デジタルスタンプカード",
    metaDescription:
      "カフェのための QR ロイヤリティカード。お客様にアプリ不要。100 個のスタンプまで無料。2 分でセットアップ。",
    heroTitle: "カフェのためのデジタルスタンプカード",
    heroSubtitle:
      "アプリなしでスタンプ。お客様はカウンターの QR をスキャンするだけ。",
    ctaPrimary: "無料で始める",
    ctaSecondary: "使い方を見る",
    dashboardNote:
      "店舗ダッシュボードは英語のまま — お客様が見るカードだけ日本語になります。",
    benefit1Title: "アプリ不要",
    benefit1Body:
      "お客様はスマホのカメラで QR を読み取るだけ。スタンプカードはブラウザで開きます。",
    benefit2Title: "100 個のスタンプまで無料",
    benefit2Body:
      "クレジットカード登録なしで開始。数週間試してから決められます。",
    benefit3Title: "2 分でセットアップ",
    benefit3Body:
      "QR を印刷して、カウンターに置くだけ。すぐに運用開始。",
    howItWorksTitle: "使い方",
    step1Title: "QR を印刷して設置",
    step1Body:
      "ダッシュボードから PDF をダウンロードして、お客様が見える場所に置きます。",
    step2Title: "お客様がスマホでスキャン",
    step2Body:
      "カメラで読み取る → リンクをタップ。アプリも、ダウンロードも、登録フォームも不要。",
    step3Title: "ダッシュボードで承認",
    step3Body:
      "ダッシュボードにリクエストが届きます。承認をタップ。スタンプが瞬時にカードに反映。",
    finalCtaTitle: "無料スタンプカードを始める",
    finalCtaSubtitle: "クレジットカード不要。2 分で運用開始。",
    finalCtaButton: "店舗をセットアップ",
  },
  ko: {
    metaTitle: "카페용 QR 디지털 스탬프 카드",
    metaDescription:
      "카페를 위한 QR 멤버십 카드. 고객에게 앱 필요 없음. 100개 스탬프까지 무료. 2분이면 시작.",
    heroTitle: "카페용 디지털 스탬프 카드",
    heroSubtitle:
      "앱 없이 스탬프. 손님이 카운터에서 QR을 스캔하기만 하면 끝.",
    ctaPrimary: "무료로 시작",
    ctaSecondary: "어떻게 동작하나요",
    dashboardNote:
      "매장 대시보드는 영어로 유지됩니다 — 손님이 보는 카드만 한국어로 표시됩니다.",
    benefit1Title: "앱 다운로드 불필요",
    benefit1Body:
      "손님이 폰 카메라로 QR을 스캔하면 카드가 브라우저에서 바로 열립니다.",
    benefit2Title: "100개 스탬프까지 무료",
    benefit2Body:
      "신용카드 없이 시작. 몇 주 사용해본 뒤 결제를 결정하세요.",
    benefit3Title: "2분이면 시작",
    benefit3Body:
      "QR을 인쇄해 카운터에 두면 끝.",
    howItWorksTitle: "동작 방식",
    step1Title: "QR을 인쇄하고 배치",
    step1Body:
      "대시보드에서 PDF을 다운로드해 손님이 볼 수 있는 곳에 둡니다.",
    step2Title: "손님이 폰으로 스캔",
    step2Body:
      "카메라 → 링크 탭. 앱도, 다운로드도, 가입 양식도 없습니다.",
    step3Title: "대시보드에서 승인",
    step3Body:
      "대시보드에 요청이 표시됩니다. 승인 탭. 스탬프가 즉시 카드에 적힙니다.",
    finalCtaTitle: "무료 멤버십 카드 시작하기",
    finalCtaSubtitle: "신용카드 필요 없음. 2분이면 시작.",
    finalCtaButton: "내 매장 설정",
  },
  ar: {
    metaTitle: "بطاقة ولاء رقمية بـ QR للمقاهي",
    metaDescription:
      "بطاقة ولاء برمز QR للمقاهي. بدون تطبيق للعملاء. مجاناً حتى 100 ختم. جاهزة في دقيقتين.",
    heroTitle: "بطاقة ولاء رقمية للمقاهي",
    heroSubtitle:
      "أختام بدون تطبيق. زبائنك يمسحون رمز QR عند المنضدة — وانتهى الأمر.",
    ctaPrimary: "ابدأ مجاناً",
    ctaSecondary: "كيف تعمل",
    dashboardNote:
      "لوحة التحكم تبقى بالإنجليزية — العربية تظهر فقط للزبائن على البطاقة.",
    benefit1Title: "بدون تطبيق",
    benefit1Body:
      "يمسح زبائنك رمز QR بكاميرا الهاتف وتفتح البطاقة في المتصفح مباشرة.",
    benefit2Title: "مجاناً حتى 100 ختم",
    benefit2Body:
      "بدون بطاقة ائتمان للبدء. جربها بضعة أسابيع قبل الدفع.",
    benefit3Title: "جاهزة في دقيقتين",
    benefit3Body:
      "اطبع رمز QR، ضعه على المنضدة، أنت جاهز.",
    howItWorksTitle: "كيف تعمل",
    step1Title: "اطبع رمز QR وضعه",
    step1Body:
      "حمّل ملف PDF القابل للطباعة من لوحة التحكم وضعه في مكان يراه زبائنك.",
    step2Title: "الزبون يمسح بهاتفه",
    step2Body:
      "الكاميرا ← يضغط على الرابط. لا تطبيق، لا تنزيل، لا نموذج تسجيل.",
    step3Title: "أنت توافق على الختم",
    step3Body:
      "يظهر الطلب على لوحتك. اضغط موافقة. يصل الختم إلى البطاقة فوراً.",
    finalCtaTitle: "ابدأ بطاقة الولاء المجانية",
    finalCtaSubtitle: "بدون بطاقة ائتمان. جاهزة في دقيقتين.",
    finalCtaButton: "إعداد مقهاي",
  },
  hi: {
    metaTitle: "कैफ़े के लिए QR डिजिटल लॉयल्टी कार्ड",
    metaDescription:
      "कैफ़े और कॉफ़ी शॉप के लिए QR लॉयल्टी कार्ड। ग्राहकों को कोई ऐप नहीं चाहिए। 100 स्टैम्प तक मुफ़्त। 2 मिनट में तैयार।",
    heroTitle: "कैफ़े के लिए डिजिटल लॉयल्टी कार्ड",
    heroSubtitle:
      "बिना ऐप के स्टैम्प। आपके ग्राहक काउंटर पर QR स्कैन करते हैं — बस।",
    ctaPrimary: "मुफ़्त शुरू करें",
    ctaSecondary: "यह कैसे काम करता है",
    dashboardNote:
      "आपका डैशबोर्ड अंग्रेज़ी में ही रहेगा — हिन्दी सिर्फ़ आपके ग्राहक के कार्ड पर दिखेगी।",
    benefit1Title: "कोई ऐप ज़रूरी नहीं",
    benefit1Body:
      "ग्राहक फ़ोन कैमरे से QR स्कैन करते हैं और कार्ड सीधे ब्राउज़र में खुल जाता है।",
    benefit2Title: "100 स्टैम्प तक मुफ़्त",
    benefit2Body:
      "शुरू करने के लिए क्रेडिट कार्ड नहीं चाहिए। कुछ हफ़्तों आज़माएँ, फिर तय करें।",
    benefit3Title: "2 मिनट में तैयार",
    benefit3Body:
      "QR प्रिंट करें, काउंटर पर रखें, आप लाइव हैं।",
    howItWorksTitle: "यह कैसे काम करता है",
    step1Title: "QR प्रिंट करें और लगाएँ",
    step1Body:
      "डैशबोर्ड से प्रिंट करने योग्य PDF डाउनलोड करें और जहाँ ग्राहक देख सकें वहाँ रखें।",
    step2Title: "ग्राहक फ़ोन से स्कैन करते हैं",
    step2Body:
      "कैमरा → लिंक टैप करें। कोई ऐप, डाउनलोड, या फ़ॉर्म नहीं।",
    step3Title: "आप डैशबोर्ड से मंज़ूरी देते हैं",
    step3Body:
      "अनुरोध डैशबोर्ड पर आता है। मंज़ूरी टैप करें। स्टैम्प तुरंत कार्ड पर लग जाता है।",
    finalCtaTitle: "मुफ़्त लॉयल्टी कार्ड शुरू करें",
    finalCtaSubtitle: "क्रेडिट कार्ड नहीं चाहिए। 2 मिनट में लाइव।",
    finalCtaButton: "मेरा कैफ़े सेट करें",
  },
  id: {
    metaTitle: "Kartu loyalitas QR digital untuk kafe",
    metaDescription:
      "Kartu loyalitas QR untuk kafe dan kedai kopi. Tanpa aplikasi untuk pelanggan. Gratis hingga 100 stempel. Siap dalam 2 menit.",
    heroTitle: "Kartu loyalitas digital untuk kafe",
    heroSubtitle:
      "Stempel tanpa aplikasi. Pelanggan pindai QR di kasir — selesai.",
    ctaPrimary: "Mulai gratis",
    ctaSecondary: "Cara kerjanya",
    dashboardNote:
      "Dasbor Anda tetap dalam bahasa Inggris — hanya kartu pelanggan yang ditampilkan dalam Bahasa Indonesia.",
    benefit1Title: "Tanpa aplikasi",
    benefit1Body:
      "Pelanggan pindai QR dengan kamera HP dan kartu langsung terbuka di browser.",
    benefit2Title: "Gratis hingga 100 stempel",
    benefit2Body:
      "Tanpa kartu kredit untuk mulai. Coba beberapa minggu sebelum bayar.",
    benefit3Title: "Siap dalam 2 menit",
    benefit3Body: "Cetak QR, taruh di kasir, langsung jalan.",
    howItWorksTitle: "Cara kerjanya",
    step1Title: "Cetak dan tempatkan QR Anda",
    step1Body:
      "Unduh PDF dari dasbor dan letakkan di tempat yang terlihat pelanggan.",
    step2Title: "Pelanggan pindai dengan HP",
    step2Body:
      "Kamera → tap link. Tanpa aplikasi, tanpa unduh, tanpa formulir.",
    step3Title: "Anda menyetujui stempel",
    step3Body:
      "Permintaan muncul di dasbor. Tap Setuju. Stempel langsung muncul di kartu.",
    finalCtaTitle: "Mulai kartu loyalitas gratis Anda",
    finalCtaSubtitle: "Tanpa kartu kredit. Live dalam 2 menit.",
    finalCtaButton: "Setup kafe saya",
  },
};

export const LANDING_LANGS = Object.keys(LANDING_COPY);

// hreflang map shared between the homepage and every /[lang] route.
export function buildHreflangMap(): Record<string, string> {
  const map: Record<string, string> = { en: "/" };
  for (const lang of LANDING_LANGS) {
    map[lang] = `/${lang}`;
  }
  map["x-default"] = "/";
  return map;
}
