import QRCode from "qrcode";

/**
 * Generate a QR code data URL with the Brewstamp coffee icon overlaid in the center.
 * Uses high error correction so covering ~15% of the center is safe.
 */
export async function generateQRCodeWithLogo(
  url: string,
  { width = 400, margin = 2, logoColor = "#d97706" } = {}
): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    width,
    margin,
    errorCorrectionLevel: "H",
  });

  const ctx = canvas.getContext("2d")!;

  // Draw logo in center (~20% of QR code size)
  const logoSize = width * 0.2;
  const x = (canvas.width - logoSize) / 2;
  const y = (canvas.height - logoSize) / 2;

  // White background behind logo with padding
  const padding = logoSize * 0.15;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(
    x - padding,
    y - padding,
    logoSize + padding * 2,
    logoSize + padding * 2,
    logoSize * 0.15
  );
  ctx.fill();

  // Colored rounded square background
  ctx.fillStyle = logoColor;
  ctx.beginPath();
  ctx.roundRect(x, y, logoSize, logoSize, logoSize * 0.2);
  ctx.fill();

  // Draw coffee cup icon (simplified SVG path drawn on canvas)
  const cx = x + logoSize / 2;
  const cy = y + logoSize / 2;
  const s = logoSize * 0.35;

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = s * 0.12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Cup body
  const cupW = s * 0.8;
  const cupH = s * 0.7;
  const cupX = cx - cupW / 2;
  const cupY = cy - cupH / 2 + s * 0.1;
  ctx.beginPath();
  ctx.roundRect(cupX, cupY, cupW, cupH, s * 0.08);
  ctx.stroke();

  // Handle
  ctx.beginPath();
  ctx.arc(cupX + cupW + s * 0.02, cupY + cupH * 0.35, s * 0.15, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Steam lines
  const steamY = cupY - s * 0.15;
  for (let i = -1; i <= 1; i++) {
    const sx = cx + i * s * 0.2;
    ctx.beginPath();
    ctx.moveTo(sx, steamY);
    ctx.quadraticCurveTo(sx + s * 0.05, steamY - s * 0.12, sx, steamY - s * 0.25);
    ctx.stroke();
  }

  return canvas.toDataURL("image/png");
}
