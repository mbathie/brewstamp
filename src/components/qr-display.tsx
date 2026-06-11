"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  ExternalLink,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { generateQRCodeWithLogo } from "@/lib/qr";
import { jsPDF } from "jspdf";
import { kaushanScriptBase64 } from "@/lib/fonts/kaushan-script";
import { getColorHex, hexToRgb } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";
import { t } from "@/lib/i18n";

interface Props {
  shopCode: string;
  shopName?: string;
  shopLogo?: string | null;
  stampThreshold?: number;
  // Perk shops print a different headline (free coffee, no stamps).
  perkMode?: boolean;
  dailyDrinkLimit?: number;
  bgColor?: string;
  fgColor?: string;
  bgPattern?: string;
  language?: string;
  /** "full" (default) shows QR image + URL + 3 buttons; "compact" shows only the 3 action buttons. */
  variant?: "full" | "compact";
}

export default function QrDisplay({
  shopCode,
  shopName,
  shopLogo,
  stampThreshold,
  perkMode = false,
  dailyDrinkLimit,
  bgColor = "stone-800",
  fgColor = "amber-600",
  bgPattern = "none",
  language,
  variant = "full",
}: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fgHex = getColorHex(fgColor);

  useEffect(() => {
    generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, {
      width: 400,
      logoColor: fgHex,
    }).then(setQrUrl);
  }, [appUrl, shopCode, fgHex]);

  async function generatePdf() {
    // Generate a high-res QR for the PDF
    const hiResQr = await generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, {
      width: 800,
      logoColor: fgHex,
    });

    // A5 dimensions in mm: 148 x 210
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5",
    });
    const w = 148;
    const h = 210;

    // Register Kaushan Script font
    pdf.addFileToVFS("KaushanScript.ttf", kaushanScriptBase64);
    pdf.addFont("KaushanScript.ttf", "KaushanScript", "normal");

    // Background - use shop's bg color
    const bgRgb = hexToRgb(getColorHex(bgColor));
    pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
    pdf.rect(0, 0, w, h, "F");

    // Render selected background pattern
    const patternImg = await generatePatternImage(
      bgPattern,
      getColorHex(fgColor),
    );
    if (patternImg) {
      pdf.addImage(patternImg, "PNG", 0, 0, w, h);
    }

    const fgRgb = hexToRgb(getColorHex(fgColor));

    // Helper: blend fg color with opacity against bg color
    function fgWithOpacity(opacity: number): [number, number, number] {
      return [
        Math.round(fgRgb[0] * opacity + bgRgb[0] * (1 - opacity)),
        Math.round(fgRgb[1] * opacity + bgRgb[1] * (1 - opacity)),
        Math.round(fgRgb[2] * opacity + bgRgb[2] * (1 - opacity)),
      ];
    }

    const fgMuted = fgWithOpacity(0.55);
    const fgDim = fgWithOpacity(0.7);
    const fgFaint = fgWithOpacity(0.4);

    // Shared content width — logo and QR same width
    const contentW = 90;
    const contentX = (w - contentW) / 2;
    const qrPadding = 5;
    const threshold = stampThreshold || 8;
    // Perk shops print free-coffee copy (English-only for now); stamp shops use
    // the translated "Buy N. Get one free." headline.
    const perkLimit = dailyDrinkLimit || 2;
    const eyebrowText = perkMode
      ? "STAFF COFFEE PERK"
      : t(language, "loyaltyCardEyebrow");
    const heroText = perkMode
      ? `${perkLimit} free coffee${perkLimit === 1 ? "" : "s"} a day.`
      : t(language, "buyXGetFree", { n: threshold });

    let yPos = 18;

    // Shop logo or fallback — same width as QR
    const logoH = contentW / 3; // 3:1 aspect ratio
    if (shopLogo) {
      try {
        const roundedLogo = await roundImageCorners(shopLogo, 900, 300, 40);
        pdf.addImage(roundedLogo, "PNG", contentX, yPos, contentW, logoH);
      } catch {
        drawShopNameBanner(
          pdf,
          contentX,
          yPos,
          contentW,
          logoH,
          fgRgb,
          bgRgb,
          shopName ?? "",
        );
      }
    } else {
      drawShopNameBanner(
        pdf,
        contentX,
        yPos,
        contentW,
        logoH,
        fgRgb,
        bgRgb,
        shopName ?? "",
      );
    }
    yPos += logoH + 14;

    // Eyebrow — small tracked label
    drawText(pdf, eyebrowText, w / 2, yPos, {
      fontSize: 8,
      fontWeight: "bold",
      color: fgMuted,
      align: "center",
      letterSpacing: 1.4,
    });
    yPos += 9;

    // Hero reward headline — big, full fg
    drawText(pdf, heroText, w / 2, yPos, {
      fontSize: 20,
      fontWeight: "bold",
      color: fgRgb,
      align: "center",
    });
    yPos += 11;

    // Pre-QR instruction — guides the customer's next action
    drawText(pdf, t(language, "scanWithCamera"), w / 2, yPos, {
      fontSize: 11,
      color: fgDim,
      align: "center",
    });
    yPos += 9;

    // QR code — bigger for counter-distance scanning (58mm -> 72mm)
    const qrSize = 72;
    const qrX = (w - qrSize) / 2;
    pdf.setFillColor(255, 255, 255);
    roundedRect(
      pdf,
      qrX - qrPadding,
      yPos - qrPadding,
      qrSize + qrPadding * 2,
      qrSize + qrPadding * 2,
      4,
    );
    pdf.addImage(hiResQr, "PNG", qrX, yPos, qrSize, qrSize);
    yPos += qrSize + 14;

    // Reassurance under the QR — kills the "do I need to download something?" worry
    drawText(pdf, t(language, "noAppRequired"), w / 2, yPos, {
      fontSize: 9,
      color: fgFaint,
      align: "center",
    });

    // Powered by Brewstamp \u2014 tucked at the bottom, smaller, less prominent
    const bottomY = h - 10;
    const POWERED_SIZE = 9;
    const KAUSHAN_SIZE = 11;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(POWERED_SIZE);
    pdf.setTextColor(fgFaint[0], fgFaint[1], fgFaint[2]);
    const poweredByWidth = pdf.getTextWidth("Powered by ");
    pdf.setFont("KaushanScript", "normal");
    pdf.setFontSize(KAUSHAN_SIZE);
    const brewstampWidth = pdf.getTextWidth("Brewstamp");
    const totalWidth = poweredByWidth + brewstampWidth;
    const startX = (w - totalWidth) / 2;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(POWERED_SIZE);
    pdf.text("Powered by ", startX, bottomY);
    pdf.setFont("KaushanScript", "normal");
    pdf.setFontSize(KAUSHAN_SIZE);
    pdf.setTextColor(fgMuted[0], fgMuted[1], fgMuted[2]);
    pdf.text("Brewstamp", startX + poweredByWidth, bottomY);

    return pdf;
  }

  async function handleDownload() {
    if (!qrUrl) return;
    const pdf = await generatePdf();
    const filename = `brewstamp-${shopCode}.pdf`;
    pdf.save(filename);
    toast.success(`${filename} downloaded`, {
      description: "Check your Downloads folder.",
    });
  }

  async function handlePrint() {
    if (!qrUrl) return;
    const pdf = await generatePdf();
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    if (win) {
      win.addEventListener("afterprint", () => URL.revokeObjectURL(blobUrl));
      // Auto-trigger print once PDF loads
      win.onload = () => setTimeout(() => win.print(), 500);
    }
  }

  async function handleDownloadQrImage() {
    // Generate a high-res, transparent QR PNG so it scales nicely.
    const hiResQr = await generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, {
      width: 1200,
      logoColor: fgHex,
    });
    const filename = `brewstamp-${shopCode}-qr.png`;
    const a = document.createElement("a");
    a.href = hiResQr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`${filename} downloaded`, {
      description: "Check your Downloads folder.",
    });
  }

  const actionButtons = (
    <>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handleDownloadQrImage}
        disabled={!qrUrl}
        className={
          variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"
        }
      >
        <QrCode className="mr-2 h-4 w-4" />
        QR
      </Button>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handleDownload}
        disabled={!qrUrl}
        className={
          variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"
        }
      >
        <Download className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handlePrint}
        disabled={!qrUrl}
        className={
          variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"
        }
      >
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={() => {
          // iPhone-ish portrait window so it lands as a popup, not a tab.
          window.open(
            `${appUrl}/s/${shopCode}`,
            "_blank",
            "width=420,height=820,noopener,noreferrer",
          );
        }}
        className={
          variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"
        }
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Live preview
      </Button>
    </>
  );

  if (variant === "compact") {
    return <div className="flex gap-2">{actionButtons}</div>;
  }

  return (
    <div className="space-y-4 pb-2">
      <div className="mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-lg border bg-white p-3 sm:max-w-[14rem] sm:p-4">
        {qrUrl ? (
          <img src={qrUrl} alt="Shop QR Code" className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(`${appUrl}/s/${shopCode}`);
          toast.success("Link copied to clipboard");
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {appUrl}/s/{shopCode}
        <Copy className="size-3" />
      </button>
      <div className="flex gap-2">{actionButtons}</div>
    </div>
  );
}

function drawShopNameBanner(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fgRgb: [number, number, number],
  bgRgb: [number, number, number],
  shopName: string,
) {
  // Solid fg-colored rounded rectangle as the banner background
  pdf.setFillColor(fgRgb[0], fgRgb[1], fgRgb[2]);
  roundedRect(pdf, x, y, w, h, 4);

  if (!shopName) return;

  // Fit the shop name to width: start at 14pt, shrink if needed.
  // Width measurement uses helvetica even for non-Latin — it's a rough fit
  // bound, and the canvas-rendered text is generally not wider than helvetica
  // at the same point size.
  pdf.setFont("helvetica", "bold");
  let fontSize = 14;
  pdf.setFontSize(fontSize);
  const padding = 6;
  const maxW = w - padding * 2;
  while (pdf.getTextWidth(shopName) > maxW && fontSize > 6) {
    fontSize -= 1;
    pdf.setFontSize(fontSize);
  }
  // jsPDF default baseline is bottom; nudge so text sits visually centered
  drawText(pdf, shopName, x + w / 2, y + h / 2 + fontSize * 0.18, {
    fontSize,
    fontWeight: "bold",
    color: bgRgb,
    align: "center",
  });
}

function drawFallbackLogo(
  pdf: jsPDF,
  x: number,
  y: number,
  size: number,
  fgRgb: [number, number, number] = [217, 119, 6],
) {
  pdf.setFillColor(fgRgb[0], fgRgb[1], fgRgb[2]);
  roundedRect(pdf, x, y, size, size, 4);

  // Simple coffee cup icon using lines
  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size * 0.3;
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.8);

  // Cup body
  pdf.roundedRect(cx - s / 2, cy - s / 3, s, s * 0.7, 1, 1, "S");

  // Handle
  pdf.setLineWidth(0.8);
  const hx = cx + s / 2;
  const hy = cy - s / 6;
  pdf.line(hx, hy, hx + s * 0.2, hy);
  pdf.line(hx + s * 0.2, hy, hx + s * 0.2, hy + s * 0.35);
  pdf.line(hx + s * 0.2, hy + s * 0.35, hx, hy + s * 0.35);
}

function roundedRect(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  pdf.roundedRect(x, y, w, h, r, r, "F");
}

// Sans-serif stack with broad coverage for CJK, Thai, Cyrillic, Arabic, Hebrew, etc.
// The browser picks the first family that has a glyph for each character.
const PDF_TEXT_FONT_STACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"Helvetica Neue"',
  "Helvetica",
  "Arial",
  '"Hiragino Sans"',
  '"Hiragino Kaku Gothic ProN"',
  '"Yu Gothic"',
  '"Noto Sans JP"',
  '"Noto Sans KR"',
  '"Noto Sans SC"',
  '"Noto Sans TC"',
  '"Apple SD Gothic Neo"',
  '"Malgun Gothic"',
  '"Microsoft YaHei"',
  '"PingFang SC"',
  '"Noto Sans Thai"',
  '"Noto Sans Arabic"',
  '"Noto Sans Hebrew"',
  "sans-serif",
].join(", ");

function isLatin1(text: string): boolean {
  return !/[^ -ÿ]/.test(text);
}

interface DrawTextOpts {
  fontSize: number; // pt
  fontWeight?: "normal" | "bold";
  color: [number, number, number];
  align?: "left" | "center"; // default "left"
  letterSpacing?: number; // mm (matches jsPDF's setCharSpace under unit:"mm")
}

// Draws text into the PDF, falling back to a rasterized canvas image for any
// string with non-Latin-1 characters (jsPDF's built-in Helvetica only encodes
// WinAnsi/Latin-1, so CJK, Cyrillic, Thai, Arabic, etc. would otherwise appear
// as garbled glyphs).
function drawText(
  pdf: jsPDF,
  text: string,
  x: number,
  baselineY: number,
  opts: DrawTextOpts,
) {
  const weight = opts.fontWeight || "normal";
  const align = opts.align || "left";

  if (isLatin1(text)) {
    pdf.setFont("helvetica", weight);
    pdf.setFontSize(opts.fontSize);
    pdf.setTextColor(opts.color[0], opts.color[1], opts.color[2]);
    if (opts.letterSpacing) {
      pdf.setCharSpace(opts.letterSpacing);
      if (align === "center") {
        // jsPDF's align:"center" doesn't compensate for charSpace, so position manually.
        const tw =
          pdf.getTextWidth(text) + opts.letterSpacing * (text.length - 1);
        pdf.text(text, x - tw / 2, baselineY);
      } else {
        pdf.text(text, x, baselineY);
      }
      pdf.setCharSpace(0);
    } else {
      if (align === "center") {
        pdf.text(text, x, baselineY, { align: "center" });
      } else {
        pdf.text(text, x, baselineY);
      }
    }
    return;
  }

  // Non-Latin path: render onto a high-DPI canvas and embed the result as a PNG.
  const dpr = 4;
  const PX_PER_PT = 96 / 72;
  const MM_PER_PX = 25.4 / 96;
  const fontSizePx = opts.fontSize * PX_PER_PT * dpr;
  const letterSpacingPx = opts.letterSpacing
    ? (opts.letterSpacing / MM_PER_PX) * dpr
    : 0;

  const fontStr = `${weight} ${fontSizePx}px ${PDF_TEXT_FONT_STACK}`;
  const measureCtx = document.createElement("canvas").getContext("2d")!;
  measureCtx.font = fontStr;

  const chars = Array.from(text); // grapheme-aware iteration for surrogate pairs
  let textWidthPx = 0;
  if (letterSpacingPx) {
    for (let i = 0; i < chars.length; i++) {
      textWidthPx += measureCtx.measureText(chars[i]).width;
      if (i < chars.length - 1) textWidthPx += letterSpacingPx;
    }
  } else {
    textWidthPx = measureCtx.measureText(text).width;
  }

  const padPx = fontSizePx * 0.4;
  const ascentPx = fontSizePx * 0.95; // generous to fit accents and CJK glyph extents
  const descentPx = fontSizePx * 0.3;
  const wPx = Math.ceil(textWidthPx + padPx * 2);
  const hPx = Math.ceil(ascentPx + descentPx + padPx * 2);

  const canvas = document.createElement("canvas");
  canvas.width = wPx;
  canvas.height = hPx;
  const ctx = canvas.getContext("2d")!;
  ctx.font = fontStr;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = `rgb(${opts.color[0]}, ${opts.color[1]}, ${opts.color[2]})`;

  const baselineYPx = padPx + ascentPx;
  if (letterSpacingPx) {
    let cx = padPx;
    for (const ch of chars) {
      ctx.fillText(ch, cx, baselineYPx);
      cx += ctx.measureText(ch).width + letterSpacingPx;
    }
  } else {
    ctx.fillText(text, padPx, baselineYPx);
  }

  const widthMm = (wPx / dpr) * MM_PER_PX;
  const heightMm = (hPx / dpr) * MM_PER_PX;
  const baselineFromTopMm = (baselineYPx / dpr) * MM_PER_PX;

  const drawX = align === "center" ? x - widthMm / 2 : x;
  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    drawX,
    baselineY - baselineFromTopMm,
    widthMm,
    heightMm,
  );
}

async function generatePatternImage(
  patternKey: string,
  fgColor: string,
): Promise<string | null> {
  const css = getPatternCSS(patternKey, fgColor, 0.07);
  if (!css) return null;

  // Extract the data URI from the url('...') wrapper
  const match = css.match(/url\(['"]?(data:[^'"]+)['"]?\)/);
  if (!match) return null;
  const svgDataUri = match[1];

  // Load SVG as an image, tile it onto a canvas at A5 proportions
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // A5 at 3x DPI for crisp output
      const cw = 148 * 3;
      const ch = 210 * 3;
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, cw, ch);

      // Tile the pattern across the canvas
      const tw = img.width;
      const th = img.height;
      for (let x = 0; x < cw; x += tw) {
        for (let y = 0; y < ch; y += th) {
          ctx.drawImage(img, x, y);
        }
      }

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = svgDataUri;
  });
}

function roundImageCorners(
  src: string,
  w: number,
  h: number,
  radius: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, radius);
      ctx.clip();
      // object-cover: scale to fill, center crop
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}
