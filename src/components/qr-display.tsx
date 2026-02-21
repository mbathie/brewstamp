"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Printer, ExternalLink } from "lucide-react";
import { generateQRCodeWithLogo } from "@/lib/qr";
import { jsPDF } from "jspdf";
import { kaushanScriptBase64 } from "@/lib/fonts/kaushan-script";
import { getColorHex, hexToRgb } from "@/lib/tailwind-colors";
import { getPatternCSS } from "@/lib/patterns";

interface Props {
  shopCode: string;
  shopName?: string;
  shopLogo?: string | null;
  stampThreshold?: number;
  bgColor?: string;
  fgColor?: string;
  bgPattern?: string;
}

export default function QrDisplay({ shopCode, shopName, shopLogo, stampThreshold, bgColor = "stone-800", fgColor = "amber-600", bgPattern = "none" }: Props) {
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

    // Font sizes
    const SIZE_BODY = 11;
    const SIZE_KAUSHAN = 13;

    // Helper: blend fg color with opacity against bg color
    function fgWithOpacity(opacity: number): [number, number, number] {
      return [
        Math.round(fgRgb[0] * opacity + bgRgb[0] * (1 - opacity)),
        Math.round(fgRgb[1] * opacity + bgRgb[1] * (1 - opacity)),
        Math.round(fgRgb[2] * opacity + bgRgb[2] * (1 - opacity)),
      ];
    }

    const fgMuted = fgWithOpacity(0.5);

    // Shared content width — logo and QR same width
    const contentW = 90;
    const contentX = (w - contentW) / 2;
    const qrPadding = 5;

    let yPos = 20;

    // Shop logo or fallback — same width as QR
    const logoH = contentW / 3; // 3:1 aspect ratio
    if (shopLogo) {
      try {
        const roundedLogo = await roundImageCorners(shopLogo, 900, 300, 40);
        pdf.addImage(roundedLogo, "PNG", contentX, yPos, contentW, logoH);
      } catch {
        drawFallbackLogo(pdf, (w - logoH) / 2, yPos, logoH, fgRgb);
      }
    } else {
      drawFallbackLogo(pdf, (w - logoH) / 2, yPos, logoH, fgRgb);
    }
    yPos += logoH + 18;

    // QR code with white background — same width as logo
    const qrSize = 58;
    const qrX = (w - qrSize) / 2;
    pdf.setFillColor(255, 255, 255);
    roundedRect(pdf, qrX - qrPadding, yPos - qrPadding, qrSize + qrPadding * 2, qrSize + qrPadding * 2, 4);
    pdf.addImage(hiResQr, "PNG", qrX, yPos, qrSize, qrSize);
    yPos += qrSize + 20;

    // "BUY X COFFEES GET 1 FREE" - full fg color
    const threshold = stampThreshold || 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(fgRgb[0], fgRgb[1], fgRgb[2]);
    pdf.text(`BUY ${threshold} COFFEES GET 1 FREE`, w / 2, yPos, { align: "center" });
    yPos += 7;

    // "No app needed" note - fg at 40% opacity
    const fgDim = fgWithOpacity(0.4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(SIZE_BODY);
    pdf.setTextColor(fgDim[0], fgDim[1], fgDim[2]);
    pdf.text("No download required \u2022 Scan for your loyalty reward", w / 2, yPos, { align: "center" });

    // Powered by Brewstamp at bottom - fg at 40% / 50% opacity
    const bottomY = h - 12;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(SIZE_BODY);
    pdf.setTextColor(fgDim[0], fgDim[1], fgDim[2]);
    const poweredByWidth = pdf.getTextWidth("Powered by ");
    pdf.setFont("KaushanScript", "normal");
    pdf.setFontSize(SIZE_KAUSHAN);
    const brewstampWidth = pdf.getTextWidth("Brewstamp");
    const totalWidth = poweredByWidth + brewstampWidth;
    const startX = (w - totalWidth) / 2;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(SIZE_BODY);
    pdf.text("Powered by ", startX, bottomY);
    pdf.setFont("KaushanScript", "normal");
    pdf.setFontSize(SIZE_KAUSHAN);
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
    // Open window immediately to preserve user gesture on iOS Safari
    const win = window.open("", "_blank");
    const pdf = await generatePdf();
    const blobUrl = pdf.output("bloburl") as unknown as string;
    if (win) {
      win.location.href = blobUrl;
    }
  }

  return (
    <div className="space-y-4">
      <Label>Customer QR Code</Label>
      <div className="mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-lg border bg-white p-3 sm:max-w-[14rem] sm:p-4">
        {qrUrl ? (
          <img src={qrUrl} alt="Shop QR Code" className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {appUrl}/s/{shopCode}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={!qrUrl}
          className="flex-1 cursor-pointer"
        >
          <Download className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={!qrUrl}
          className="flex-1 cursor-pointer"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button
          variant="outline"
          asChild
          className="flex-1 cursor-pointer"
        >
          <a href={`${appUrl}/s/${shopCode}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </a>
        </Button>
      </div>
    </div>
  );
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
