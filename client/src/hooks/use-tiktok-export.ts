/**
 * useTikTokExport — generează un video 1080×1920 (9:16) cu animația
 * de transformation reveal, gata de upload pe TikTok/Instagram Reels.
 *
 * Faze video:
 *  0.0s – 1.5s  → Logo + "FitForge AI" fade in
 *  1.5s – 3.0s  → "ÎNAINTE" — poza/avatarul BEFORE + stats
 *  3.0s – 4.5s  → Countdown 3...2...1 cu flash
 *  4.5s – 7.0s  → Reveal DUPĂ cu stats care numără în sus
 *  7.0s – 9.0s  → Card final: stats + watermark + CTA
 */

export interface TikTokExportData {
  displayName: string;
  startWeight: number;
  endWeight: number;
  startBodyFat: number;
  endBodyFat: number;
  workoutsCompleted: number;
  daysCount: number;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
}

const W = 1080;
const H = 1920;
const FPS = 30;
const DURATION = 9; // secunde
const TOTAL_FRAMES = FPS * DURATION;

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(t: number) { return Math.max(0, Math.min(1, t)); }
function phase(t: number, start: number, end: number) { return clamp01((t - start) / (end - start)); }

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawGradientBg(ctx: CanvasRenderingContext2D, t: number) {
  // Fundal dark cu gradient animat
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#050505");
  grad.addColorStop(0.5, "#0a0f08");
  grad.addColorStop(1, "#050505");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Grid lines subtile
  ctx.strokeStyle = "rgba(34,197,94,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Glow verde sus
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 600);
  glow.addColorStop(0, `rgba(34,197,94,${0.08 + Math.sin(t * 2) * 0.02})`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawLogo(ctx: CanvasRenderingContext2D, alpha: number, y: number) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Icon background
  ctx.fillStyle = "#22c55e";
  const iconSize = 80;
  const iconX = W / 2 - iconSize / 2;
  roundRect(ctx, iconX, y, iconSize, iconSize, 20);
  ctx.fill();

  // Zap icon (simplu)
  ctx.fillStyle = "#000";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("⚡", W / 2, y + 58);

  // Text
  ctx.fillStyle = "#fff";
  ctx.font = "bold 52px Outfit, Arial";
  ctx.textAlign = "center";
  ctx.fillText("FitForge AI", W / 2, y + 130);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "32px Arial";
  ctx.fillText("AI-Powered Transformation", W / 2, y + 180);

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number, y: number, w: number, h: number,
  type: "before" | "after",
  bf: number,
  weight: number
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 24);
  ctx.clip();

  if (img) {
    // Fit cover
    const scale = Math.max(w / img.width, h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
  } else {
    // Avatar SVG-like cu canvas
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (type === "before") {
      grad.addColorStop(0, "#1e293b"); grad.addColorStop(1, "#0f172a");
    } else {
      grad.addColorStop(0, "#052e16"); grad.addColorStop(1, "#0f172a");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Siluetă simplă
    const cx = x + w / 2;
    const fatW = Math.min(Math.max(bf / 40, 0.3), 0.85);
    const color = type === "before" ? "#64748b" : "#22c55e";

    // Cap
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.2, 55, 0, Math.PI * 2);
    ctx.fill();

    // Corp
    ctx.fillStyle = type === "before" ? "#475569" : "#16a34a";
    roundRect(ctx, cx - 60 - fatW * 30, y + h * 0.32, 120 + fatW * 60, h * 0.32, 24);
    ctx.fill();

    // Picioare
    ctx.fillStyle = type === "before" ? "#334155" : "#15803d";
    roundRect(ctx, cx - 55 - fatW * 15, y + h * 0.62, 50 + fatW * 10, h * 0.26, 16);
    ctx.fill();
    roundRect(ctx, cx + 5 + fatW * 5, y + h * 0.62, 50 + fatW * 10, h * 0.26, 16);
    ctx.fill();
  }

  // Overlay gradient jos
  const overlay = ctx.createLinearGradient(x, y + h * 0.6, x, y + h);
  overlay.addColorStop(0, "transparent");
  overlay.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = overlay;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  // Stats jos pe card
  ctx.fillStyle = "#fff";
  ctx.font = `bold 36px Outfit, Arial`;
  ctx.textAlign = "center";
  ctx.fillText(`${weight}kg`, x + w / 2, y + h - 60);
  ctx.fillStyle = type === "before" ? "rgba(255,255,255,0.5)" : "#22c55e";
  ctx.font = "28px Arial";
  ctx.fillText(`${bf}% grăsime`, x + w / 2, y + h - 22);
}

function drawStat(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, color = "#22c55e") {
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, x - 120, y - 50, 240, 100, 20);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = "bold 52px Outfit, Arial";
  ctx.textAlign = "center";
  ctx.fillText(value, x, y + 10);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "28px Arial";
  ctx.fillText(label, x, y + 48);
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  roundRect(ctx, W / 2 - 220, H - 100, 440, 70, 35);
  ctx.fill();

  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 28px Outfit, Arial";
  ctx.textAlign = "center";
  ctx.fillText("⚡ Made with FitForge AI ⚡", W / 2, H - 58);
  ctx.restore();
}

async function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  data: TikTokExportData,
  beforeImg: HTMLImageElement | null,
  afterImg: HTMLImageElement | null
) {
  const t = frame / FPS; // timp în secunde

  drawGradientBg(ctx, t);

  // ── FAZA 1: Logo (0–1.5s) ──
  if (t < 1.5) {
    const p = phase(t, 0, 0.8);
    const alpha = easeOut(p);
    const y = lerp(H / 2 - 200, H / 2 - 220, easeInOut(p));
    drawLogo(ctx, alpha, y);

    // Tagline
    const tp = phase(t, 0.4, 1.2);
    ctx.save();
    ctx.globalAlpha = easeOut(tp);
    ctx.fillStyle = "rgba(34,197,94,0.2)";
    roundRect(ctx, W / 2 - 200, H / 2 + 40, 400, 60, 30);
    ctx.fill();
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TRANSFORMATION REVEAL", W / 2, H / 2 + 78);
    ctx.restore();
  }

  // ── FAZA 2: ÎNAINTE (1.5s–3.0s) ──
  else if (t < 3.0) {
    const p = phase(t, 1.5, 2.0);
    const alpha = easeOut(p);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Label ÎNAINTE
    ctx.fillStyle = "#ef4444";
    roundRect(ctx, W / 2 - 140, 120, 280, 70, 35);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 38px Outfit, Arial";
    ctx.textAlign = "center";
    ctx.fillText("ÎNAINTE", W / 2, 165);

    // Poza
    const imgY = 230;
    const imgH = 900;
    drawPhoto(ctx, beforeImg, 80, imgY, W - 160, imgH, "before", data.startBodyFat, data.startWeight);

    // Stats
    const sy = imgY + imgH + 80;
    drawStat(ctx, "Greutate start", `${data.startWeight}kg`, W / 2 - 200, sy, "#ef4444");
    drawStat(ctx, "Body Fat", `${data.startBodyFat}%`, W / 2 + 200, sy, "#f97316");

    ctx.restore();
    drawWatermark(ctx);
  }

  // ── FAZA 3: Countdown (3.0s–4.5s) ──
  else if (t < 4.5) {
    const local = t - 3.0;
    const num = local < 0.5 ? 3 : local < 1.0 ? 2 : 1;
    const numPhase = (local % 0.5) / 0.5;
    const scale = lerp(1.4, 0.8, easeOut(numPhase));
    const alpha = numPhase < 0.8 ? 1 : lerp(1, 0, (numPhase - 0.8) / 0.2);

    // Flash bianco al reveal
    if (t > 4.3) {
      const flashAlpha = phase(t, 4.3, 4.5);
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.6})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);

    // Cerc animat
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 180, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - numPhase));
    ctx.stroke();

    // Număr
    ctx.fillStyle = "#fff";
    ctx.font = `bold 220px Outfit, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${num}`, W / 2, H / 2);
    ctx.textBaseline = "alphabetic";

    ctx.restore();

    // Text
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GET READY FOR THE REVEAL", W / 2, H / 2 + 260);
    ctx.restore();
  }

  // ── FAZA 4: DUPĂ reveal (4.5s–7.0s) ──
  else if (t < 7.0) {
    const p = phase(t, 4.5, 5.5);
    const alpha = easeOut(p);
    const weightNow = lerp(data.startWeight, data.endWeight, easeOut(phase(t, 4.5, 6.5)));
    const bfNow = lerp(data.startBodyFat, data.endBodyFat, easeOut(phase(t, 4.5, 6.5)));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Label DUPĂ
    ctx.fillStyle = "#22c55e";
    roundRect(ctx, W / 2 - 120, 120, 240, 70, 35);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 38px Outfit, Arial";
    ctx.textAlign = "center";
    ctx.fillText("DUPĂ", W / 2, 165);

    // Poza after
    drawPhoto(ctx, afterImg, 80, 230, W - 160, 900, "after", data.endBodyFat, data.endWeight);

    // Stats animate
    const weightLost = data.startWeight - weightNow;
    const bfLost = data.startBodyFat - bfNow;
    const sy = 1210;
    drawStat(ctx, "Pierdut", `-${weightLost.toFixed(1)}kg`, W / 2 - 260, sy, "#22c55e");
    drawStat(ctx, "Body Fat", `-${bfLost.toFixed(1)}%`, W / 2, sy, "#4ade80");
    drawStat(ctx, "Antrenamente", `${data.workoutsCompleted}`, W / 2 + 260, sy, "#f97316");

    ctx.restore();
    drawWatermark(ctx);

    // Confetti
    if (t < 5.5) {
      const confettiCount = Math.floor((t - 4.5) * 20);
      const colors = ["#22c55e", "#f97316", "#60a5fa", "#c084fc", "#f472b6", "#facc15"];
      for (let i = 0; i < confettiCount; i++) {
        const seed = i * 137.5;
        const cx2 = ((seed * 17) % W);
        const cy2 = ((t - 4.5) * 800 + seed * 3) % H;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(cx2, cy2, 12, 12);
      }
    }
  }

  // ── FAZA 5: Card final (7.0s–9.0s) ──
  else {
    const p = phase(t, 7.0, 7.8);
    ctx.save();
    ctx.globalAlpha = easeOut(p);

    // Card mare
    ctx.fillStyle = "rgba(34,197,94,0.08)";
    ctx.strokeStyle = "rgba(34,197,94,0.3)";
    ctx.lineWidth = 3;
    roundRect(ctx, 60, 200, W - 120, 1400, 40);
    ctx.fill();
    ctx.stroke();

    // Titlu
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 44px Outfit, Arial";
    ctx.textAlign = "center";
    ctx.fillText("TRANSFORMARE COMPLETĂ", W / 2, 300);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 72px Outfit, Arial";
    ctx.fillText(data.displayName || "FitForge User", W / 2, 390);

    // Stats finale mari
    const stats = [
      { label: "Greutate pierdută", value: `${(data.startWeight - data.endWeight).toFixed(1)}kg`, color: "#22c55e" },
      { label: "Body Fat scăzut", value: `-${(data.startBodyFat - data.endBodyFat).toFixed(1)}%`, color: "#4ade80" },
      { label: "Antrenamente", value: `${data.workoutsCompleted}`, color: "#f97316" },
      { label: "Zile dedicare", value: `${data.daysCount}`, color: "#60a5fa" },
    ];

    stats.forEach((stat, i) => {
      const row = 520 + i * 200;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundRect(ctx, 100, row, W - 200, 170, 24);
      ctx.fill();

      ctx.fillStyle = stat.color;
      ctx.font = "bold 72px Outfit, Arial";
      ctx.textAlign = "right";
      ctx.fillText(stat.value, W - 140, row + 108);

      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "34px Arial";
      ctx.textAlign = "left";
      ctx.fillText(stat.label, 140, row + 108);
    });

    // CTA
    ctx.fillStyle = "#22c55e";
    roundRect(ctx, 100, 1370, W - 200, 140, 70);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 44px Outfit, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Începe și tu pe FitForge AI", W / 2, 1455);

    ctx.restore();
    drawWatermark(ctx);
  }
}

export async function generateTikTokVideo(
  data: TikTokExportData,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Preîncarcă imaginile
  const [beforeImg, afterImg] = await Promise.all([
    data.beforePhotoUrl ? loadImage(data.beforePhotoUrl) : Promise.resolve(null),
    data.afterPhotoUrl ? loadImage(data.afterPhotoUrl) : Promise.resolve(null),
  ]);

  // Încearcă codec-uri în ordine
  const mimeTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = reject;
    recorder.start(100);

    let frame = 0;
    function nextFrame() {
      if (frame >= TOTAL_FRAMES) {
        recorder.stop();
        return;
      }
      renderFrame(ctx, frame, data, beforeImg, afterImg);
      onProgress(Math.round((frame / TOTAL_FRAMES) * 100));
      frame++;
      requestAnimationFrame(nextFrame);
    }
    nextFrame();
  });
}

export function downloadVideo(blob: Blob, filename = "fitforge-transformation.webm") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareToTikTok(blob: Blob, data: TikTokExportData) {
  const file = new File([blob], "fitforge-transformation.webm", { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `${data.displayName} - Transformare FitForge AI`,
      text: `Am pierdut ${(data.startWeight - data.endWeight).toFixed(1)}kg în ${data.daysCount} zile cu FitForge AI! 🔥💪 #FitForgeAI #Transformation #Fitness`,
    });
  } else {
    // Fallback: download
    downloadVideo(blob);
  }
}
