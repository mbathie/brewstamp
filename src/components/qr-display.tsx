"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, ExternalLink, Copy, Check } from "lucide-react";
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
  bgColor?: string;
  fgColor?: string;
  bgPattern?: string;
  language?: string;
  /** "full" (default) shows QR image + URL + 3 buttons; "compact" shows only the 3 action buttons. */
  variant?: "full" | "compact";
}

export default function QrDisplay({ shopCode, shopName, shopLogo, stampThreshold, bgColor = "stone-800", fgColor = "amber-600", bgPattern = "none", language, variant = "full" }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const fgHex = getColorHex(fgColor);

  useEffect(() => {
    generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, { width: 400, logoColor: fgHex }).then(
      setQrUrl
    );
  }, [appUrl, shopCode, fgHex]);

  async function generatePdf() {
    // Generate a high-res QR for the PDF
    const hiResQr = await generateQRCodeWithLogo(`${appUrl}/s/${shopCode}`, { width: 800, logoColor: fgHex });

    // A5 dimensions in mm: 148 x 210
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
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
    const patternImg = await generatePatternImage(bgPattern, getColorHex(fgColor));
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

    let yPos = 18;

    // Shop logo or fallback — same width as QR
    const logoH = contentW / 3; // 3:1 aspect ratio
    if (shopLogo) {
      try {
        const roundedLogo = await roundImageCorners(shopLogo, 900, 300, 40);
        pdf.addImage(roundedLogo, "PNG", contentX, yPos, contentW, logoH);
      } catch {
        drawShopNameBanner(pdf, contentX, yPos, contentW, logoH, fgRgb, bgRgb, shopName ?? "");
      }
    } else {
      drawShopNameBanner(pdf, contentX, yPos, contentW, logoH, fgRgb, bgRgb, shopName ?? "");
    }
    yPos += logoH + 14;

    // Eyebrow — small tracked label
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(fgMuted[0], fgMuted[1], fgMuted[2]);
    const eyebrow = t(language, "loyaltyCardEyebrow");
    const eyebrowCharSpace = 1.4;
    pdf.setCharSpace(eyebrowCharSpace);
    // jsPDF's align:center doesn't account for charSpace, so compute x manually.
    const eyebrowW = pdf.getTextWidth(eyebrow) + eyebrowCharSpace * (eyebrow.length - 1);
    pdf.text(eyebrow, (w - eyebrowW) / 2, yPos);
    pdf.setCharSpace(0);
    yPos += 9;

    // Hero reward headline — big, full fg
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(fgRgb[0], fgRgb[1], fgRgb[2]);
    pdf.text(t(language, "buyXGetFree", { n: threshold }), w / 2, yPos, { align: "center" });
    yPos += 11;

    // Pre-QR instruction — guides the customer's next action
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(fgDim[0], fgDim[1], fgDim[2]);
    pdf.text(t(language, "scanWithCamera"), w / 2, yPos, { align: "center" });
    yPos += 9;

    // QR code — bigger for counter-distance scanning (58mm -> 72mm)
    const qrSize = 72;
    const qrX = (w - qrSize) / 2;
    pdf.setFillColor(255, 255, 255);
    roundedRect(pdf, qrX - qrPadding, yPos - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 4);
    pdf.addImage(hiResQr, "PNG", qrX, yPos, qrSize, qrSize);
    yPos += qrSize + 14;

    // Reassurance under the QR — kills the "do I need to download something?" worry
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(fgFaint[0], fgFaint[1], fgFaint[2]);
    pdf.text(t(language, "noAppRequired"), w / 2, yPos, { align: "center" });

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
    pdf.save(`brewstamp-${shopCode}.pdf`);
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

  const actionButtons = (
    <>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handleDownload}
        disabled={!qrUrl}
        className={variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"}
      >
        <Download className="mr-2 h-4 w-4" />
        PDF
      </Button>
      <Button
        variant={variant === "compact" ? "default" : "outline"}
        size={variant === "compact" ? "sm" : "default"}
        onClick={handlePrint}
        disabled={!qrUrl}
        className={variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"}
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
            "width=420,height=820,noopener,noreferrer"
          );
        }}
        className={variant === "compact" ? "cursor-pointer" : "flex-1 cursor-pointer"}
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
      <div className="flex gap-2">
        {actionButtons}
      </div>
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

  // Fit the shop name to width: start at 14pt, shrink if needed
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(bgRgb[0], bgRgb[1], bgRgb[2]);
  let fontSize = 14;
  pdf.setFontSize(fontSize);
  const padding = 6;
  const maxW = w - padding * 2;
  while (pdf.getTextWidth(shopName) > maxW && fontSize > 6) {
    fontSize -= 1;
    pdf.setFontSize(fontSize);
  }
  // jsPDF default baseline is bottom; nudge so text sits visually centered
  pdf.text(shopName, x + w / 2, y + h / 2 + fontSize * 0.18, { align: "center" });
}

function drawFallbackLogo(pdf: jsPDF, x: number, y: number, size: number, fgRgb: [number, number, number] = [217, 119, 6]) {
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

function roundedRect(pdf: jsPDF, x: number, y: number, w: number, h: number, r: number) {
  pdf.roundedRect(x, y, w, h, r, r, "F");
}

async function generatePatternImage(patternKey: string, fgColor: string): Promise<string | null> {
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

function roundImageCorners(src: string, w: number, h: number, radius: number): Promise<string> {
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
