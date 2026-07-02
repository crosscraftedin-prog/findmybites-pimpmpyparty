import QRCode from "qrcode";

interface InviteCardData {
  businessName: string;
  category: string;
  city: string;
  country: string;
  claimUrl: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates a 1080x1080px branded invitation card with QR code.
 * Returns a data URL (PNG) that can be downloaded or shared.
 */
export async function generateInviteCard(
  data: InviteCardData
): Promise<string> {
  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(data.claimUrl, {
    width: 250,
    margin: 1,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient ──
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, "#FF6B35");
  gradient.addColorStop(1, "#D85A30");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  // ── Subtle dot pattern overlay ──
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let x = 20; x < 1080; x += 40) {
    for (let y = 20; y < 1080; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Top section text ──
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.font = "bold 28px Inter, sans-serif";
  ctx.fillText("FindMyBites × PimpMyParty", 540, 80);

  ctx.font = "24px Inter, sans-serif";
  ctx.globalAlpha = 0.9;
  ctx.fillText("You're invited to join our marketplace", 540, 120);
  ctx.globalAlpha = 1;

  // ── White card in middle ──
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, 80, 160, 920, 720, 24);
  ctx.fill();

  // ── Celebration emoji ──
  ctx.font = "64px sans-serif";
  ctx.fillText("🎉", 540, 260);

  // ── "Congratulations!" heading ──
  ctx.fillStyle = "#D85A30";
  ctx.font = "bold 36px Inter, sans-serif";
  ctx.fillText("Congratulations!", 540, 320);

  // ── Business name (large, bold) ──
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 48px Inter, sans-serif";
  // Truncate if too long
  let name = data.businessName;
  while (ctx.measureText(name).width > 800 && name.length > 10) {
    name = name.slice(0, -2);
  }
  if (name !== data.businessName) name += "…";
  ctx.fillText(name, 540, 380);

  // ── Category · City, Country ──
  ctx.fillStyle = "#666666";
  ctx.font = "28px Inter, sans-serif";
  const locationText = `${data.category} · ${data.city}, ${data.country}`;
  let locText = locationText;
  while (ctx.measureText(locText).width > 700 && locText.length > 10) {
    locText = locText.slice(0, -2);
  }
  if (locText !== locationText) locText += "…";
  ctx.fillText(locText, 540, 430);

  // ── Divider line ──
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(240, 460);
  ctx.lineTo(840, 460);
  ctx.stroke();

  // ── "Your exclusive listing is ready to claim" ──
  ctx.fillStyle = "#444444";
  ctx.font = "26px Inter, sans-serif";
  ctx.fillText("Your exclusive listing is ready to claim", 540, 510);

  // ── QR Code ──
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => reject(new Error("QR image load failed"));
    qrImg.src = qrDataUrl;
  });
  // White rounded background for QR
  roundRect(ctx, 390, 540, 300, 300, 16);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.drawImage(qrImg, 415, 565, 250, 250);

  // ── "Scan to claim your listing" ──
  ctx.fillStyle = "#666666";
  ctx.font = "24px Inter, sans-serif";
  ctx.fillText("Scan to claim your listing", 540, 870);

  // ── Shortened URL ──
  ctx.fillStyle = "#999999";
  ctx.font = "20px Inter, sans-serif";
  const shortUrl = data.claimUrl.replace(/^https?:\/\//, "").slice(0, 40);
  ctx.fillText(shortUrl, 540, 900);

  // ── Bottom section (back to gradient) ──
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "24px Inter, sans-serif";
  ctx.globalAlpha = 0.9;
  ctx.fillText(
    "Free to join · No commission · Visible worldwide",
    540,
    950
  );
  ctx.globalAlpha = 1;

  ctx.font = "bold 32px Inter, sans-serif";
  ctx.fillText("findmybites.com", 540, 1000);

  ctx.font = "20px Inter, sans-serif";
  ctx.globalAlpha = 0.7;
  ctx.fillText("This invite expires in 30 days", 540, 1040);
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}

/**
 * Downloads the invitation card as a PNG file.
 */
export function downloadInviteCard(dataUrl: string, businessName: string) {
  const link = document.createElement("a");
  link.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-invite.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Generates the WhatsApp share message for the invite.
 */
export function getWhatsAppShareMessage(data: InviteCardData): string {
  return `Hi! 👋 I've created a listing for *${data.businessName}* on FindMyBites × PimpMyParty 🎉

Scan the QR code on your invite card to claim your FREE listing and start getting customers!

🔗 ${data.claimUrl}

This link expires in 30 days.`;
}
