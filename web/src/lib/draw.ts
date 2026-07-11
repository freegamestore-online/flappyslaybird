import type { Bird, Tree, Cloud, Collectable, Kid } from "../types";
import { drawEagle, drawFlamingo, drawPenguin } from "./draw-birds";

// ─── Sky / Background ───────────────────────────────────────────────────────

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, boosted: boolean) {
  const top = boosted ? "#ffd6e7" : "#87ceeb";
  const bot = boosted ? "#fff0f6" : "#d4f0ff";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // grass strip
  ctx.fillStyle = "#5cb85c";
  ctx.fillRect(0, h - 48, w, 48);
  ctx.fillStyle = "#4a9f4a";
  ctx.fillRect(0, h - 48, w, 8);
  // dirt
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, h - 28, w, 28);
}

// ─── Obstacles: airplane on top, tree below ──────────────────────────────────
// The kid asked for AIRPLANES instead of trees on the top part. The collision
// column is unchanged (same rect the physics checks) — the plane hangs at the
// bottom of the column trailing a striped banner up to the sky.

export function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, canvasH: number) {
  const { x, gapY, gapH, width } = tree;
  const topH = gapY - gapH / 2;
  const botY = gapY + gapH / 2;
  const botH = canvasH - 48 - botY;

  // ── TOP: AIRPLANE with banner ──
  drawAirplaneColumn(ctx, x, width, topH);

  // ── BOTTOM TREE ──
  const trunkColor = "#5d4037";
  const barkColor = "#795548";
  if (botH > 0) {
    drawFoliage(ctx, x + width / 2, botY + 30, width, false);
    ctx.fillStyle = trunkColor;
    ctx.fillRect(x + width * 0.3, botY + 30, width * 0.4, botH);
    ctx.fillStyle = barkColor;
    for (let i = botY + 40; i < botY + botH; i += 18) {
      ctx.fillRect(x + width * 0.3 + 4, i, width * 0.12, 6);
    }
  }
}

/** A cute cartoon plane at the bottom of the top obstacle column, towing a
 *  striped banner that fills the column up to the top of the screen. */
function drawAirplaneColumn(ctx: CanvasRenderingContext2D, x: number, width: number, topH: number) {
  if (topH <= 0) return;
  const cx = x + width / 2;
  const planeY = Math.max(26, topH - 22); // plane sits at the column's bottom edge

  // banner (the column body): striped flag from sky to the plane
  const bw = width * 0.62;
  const bx = cx - bw / 2;
  const bannerBottom = planeY - 20;
  if (bannerBottom > 0) {
    ctx.fillStyle = "#ef5350";
    ctx.fillRect(bx, 0, bw, bannerBottom);
    ctx.fillStyle = "#ffcdd2";
    for (let sy = 10; sy < bannerBottom; sy += 26) {
      ctx.fillRect(bx, sy, bw, 10);
    }
    // banner edges
    ctx.strokeStyle = "#c62828";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, -2, bw, bannerBottom + 2);
    // tow ropes to the plane
    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 3, bannerBottom);
    ctx.lineTo(cx - 8, planeY - 6);
    ctx.moveTo(bx + bw - 3, bannerBottom);
    ctx.lineTo(cx + 8, planeY - 6);
    ctx.stroke();
  }

  // plane body (nose pointing left — flying toward the bird)
  ctx.save();
  ctx.translate(cx, planeY);
  // fuselage
  ctx.fillStyle = "#42a5f5";
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.55, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose cone
  ctx.fillStyle = "#1e88e5";
  ctx.beginPath();
  ctx.arc(-width * 0.5, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  // propeller
  ctx.strokeStyle = "#90a4ae";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-width * 0.58, -12);
  ctx.lineTo(-width * 0.58, 12);
  ctx.stroke();
  // wing
  ctx.fillStyle = "#1976d2";
  ctx.beginPath();
  ctx.ellipse(2, 2, width * 0.22, 5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  // tail fin
  ctx.fillStyle = "#1976d2";
  ctx.beginPath();
  ctx.moveTo(width * 0.42, -2);
  ctx.lineTo(width * 0.58, -16);
  ctx.lineTo(width * 0.58, -2);
  ctx.closePath();
  ctx.fill();
  // windows
  ctx.fillStyle = "#e3f2fd";
  for (let wx = -width * 0.28; wx <= width * 0.28; wx += width * 0.14) {
    ctx.beginPath();
    ctx.arc(wx, -3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFoliage(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  width: number,
  flipped: boolean,
) {
  const layers = [
    { r: width * 0.62, y: 0, color: "#2e7d32" },
    { r: width * 0.52, y: flipped ? -14 : 14, color: "#388e3c" },
    { r: width * 0.38, y: flipped ? -26 : 26, color: "#43a047" },
  ];
  for (const l of layers) {
    const yy = flipped ? baseY - l.y : baseY + l.y;
    ctx.beginPath();
    ctx.arc(cx, yy, l.r, 0, Math.PI * 2);
    ctx.fillStyle = l.color;
    ctx.fill();
  }
}

// ─── Clouds ──────────────────────────────────────────────────────────────────

export function drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud) {
  ctx.save();
  ctx.globalAlpha = 0.88;
  const { x, y, w, h } = cloud;
  // main body
  ctx.fillStyle = "#e8e8e8";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.46, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.65, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.7, y + h * 0.65, w * 0.28, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.42, w * 0.32, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // dark edge (danger hint)
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.6, w * 0.46, h * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ─── Collectables ────────────────────────────────────────────────────────────

export function drawCollectable(ctx: CanvasRenderingContext2D, c: Collectable) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);

  if (c.kind === "fly") {
    // body
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.fillStyle = "rgba(180,220,255,0.75)";
    ctx.beginPath();
    ctx.ellipse(-8, -5, 8, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -5, 8, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.kind === "mosquito") {
    // body (long)
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.fillStyle = "rgba(200,230,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-9, -4, 9, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, -4, 9, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // proboscis
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 9);
    ctx.lineTo(0, 18);
    ctx.stroke();
    // legs
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-4, i * 3);
      ctx.lineTo(-12, i * 3 + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, i * 3);
      ctx.lineTo(12, i * 3 + 4);
      ctx.stroke();
    }
  } else {
    // dragonfly ✨
    // body (iridescent)
    const bodyGrad = ctx.createLinearGradient(-5, -12, 5, 12);
    bodyGrad.addColorStop(0, "#00e5ff");
    bodyGrad.addColorStop(0.5, "#7c4dff");
    bodyGrad.addColorStop(1, "#00e5ff");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // 4 wings
    const wingColor = "rgba(0,230,255,0.45)";
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = "rgba(0,200,255,0.8)";
    ctx.lineWidth = 1;
    const wings = [
      { ex: -16, ey: -6, rx: 14, ry: 5, angle: 0.3 },
      { ex: 16, ey: -6, rx: 14, ry: 5, angle: -0.3 },
      { ex: -14, ey: 4, rx: 12, ry: 4, angle: 0.2 },
      { ex: 14, ey: 4, rx: 12, ry: 4, angle: -0.2 },
    ];
    for (const wg of wings) {
      ctx.beginPath();
      ctx.ellipse(wg.ex, wg.ey, wg.rx, wg.ry, wg.angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // head
    ctx.fillStyle = "#00bcd4";
    ctx.beginPath();
    ctx.arc(0, -14, 5, 0, Math.PI * 2);
    ctx.fill();
    // glow
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,230,255,0.15)";
    ctx.fill();
  }
  ctx.restore();
}

// ─── Kid with net ─────────────────────────────────────────────────────────────

export function drawKid(ctx: CanvasRenderingContext2D, kid: Kid, groundY: number) {
  const { x, netAngle } = kid;
  const footY = groundY - 48;

  ctx.save();
  ctx.translate(x, footY);

  // legs
  ctx.strokeStyle = "#1565c0";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(-8, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(8, 0);
  ctx.stroke();

  // body
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.roundRect(-10, -48, 20, 30, 4);
  ctx.fill();

  // head
  ctx.fillStyle = "#ffcc80";
  ctx.beginPath();
  ctx.arc(0, -58, 12, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = "#5d4037";
  ctx.beginPath();
  ctx.arc(0, -66, 10, Math.PI, 0);
  ctx.fill();

  // eyes
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(-4, -59, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -59, 2, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -55, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // arm holding net
  ctx.strokeStyle = "#ffcc80";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(10, -42);
  ctx.lineTo(20, -55);
  ctx.stroke();

  // net pole
  ctx.save();
  ctx.translate(20, -55);
  ctx.rotate(netAngle);
  ctx.strokeStyle = "#8d6e63";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -40);
  ctx.stroke();

  // net hoop
  ctx.strokeStyle = "#bdbdbd";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -40, 16, 0, Math.PI * 2);
  ctx.stroke();

  // net mesh
  ctx.strokeStyle = "rgba(200,200,200,0.6)";
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -40 - Math.sqrt(Math.max(0, 256 - i * i)));
    ctx.lineTo(i, -40 + Math.sqrt(Math.max(0, 256 - i * i)));
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

// ─── Bird / Avatar ────────────────────────────────────────────────────────────

export function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: Bird,
  wingAngle: number,
) {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  // tilt with velocity
  const tilt = Math.max(-0.5, Math.min(0.8, bird.vy * 0.06));
  ctx.rotate(tilt);

  const boosted = bird.boosted;

  if (bird.avatar === "robin") {
    drawRobin(ctx, wingAngle, boosted);
  } else if (bird.avatar === "parrot") {
    drawParrot(ctx, wingAngle, boosted);
  } else if (bird.avatar === "owl") {
    drawOwl(ctx, wingAngle, boosted);
  } else if (bird.avatar === "flamingo") {
    drawFlamingo(ctx, wingAngle, boosted);
  } else if (bird.avatar === "penguin") {
    drawPenguin(ctx, wingAngle, boosted);
  } else {
    drawEagle(ctx, wingAngle, boosted);
  }

  // boost aura
  if (boosted) {
    ctx.shadowColor = "#ff4081";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,64,129,0.12)";
    ctx.fill();
  }

  ctx.restore();
}

function drawRobin(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // wing
  ctx.save();
  ctx.rotate(-wingAngle * 0.7);
  ctx.fillStyle = boosted ? "#ff8a65" : "#5d4037";
  ctx.beginPath();
  ctx.ellipse(-6, 2, 18, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body
  ctx.fillStyle = boosted ? "#ff7043" : "#6d4c41";
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // red breast
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.ellipse(4, 3, 9, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = "#4e342e";
  ctx.beginPath();
  ctx.arc(12, -8, 9, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(15, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(16, -10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#ffa726";
  ctx.beginPath();
  ctx.moveTo(21, -8);
  ctx.lineTo(28, -7);
  ctx.lineTo(21, -5);
  ctx.closePath();
  ctx.fill();

  // tail
  ctx.fillStyle = "#3e2723";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-26, -4);
  ctx.lineTo(-26, 4);
  ctx.closePath();
  ctx.fill();
}

function drawParrot(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // wing
  ctx.save();
  ctx.rotate(-wingAngle * 0.7);
  ctx.fillStyle = boosted ? "#ffeb3b" : "#43a047";
  ctx.beginPath();
  ctx.ellipse(-6, 2, 18, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body
  ctx.fillStyle = boosted ? "#66bb6a" : "#388e3c";
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly
  ctx.fillStyle = "#ffeb3b";
  ctx.beginPath();
  ctx.ellipse(4, 3, 8, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.arc(12, -8, 9, 0, Math.PI * 2);
  ctx.fill();

  // red patch on head
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.arc(13, -13, 5, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(15, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(16, -10, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // curved beak
  ctx.fillStyle = "#f57f17";
  ctx.beginPath();
  ctx.moveTo(20, -8);
  ctx.quadraticCurveTo(30, -8, 28, -4);
  ctx.lineTo(20, -5);
  ctx.closePath();
  ctx.fill();

  // tail (long colorful)
  ctx.fillStyle = "#1565c0";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-30, -6);
  ctx.lineTo(-28, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e53935";
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.lineTo(-32, 0);
  ctx.lineTo(-28, 8);
  ctx.closePath();
  ctx.fill();
}

function drawOwl(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // wing
  ctx.save();
  ctx.rotate(-wingAngle * 0.5);
  ctx.fillStyle = boosted ? "#ffe082" : "#8d6e63";
  ctx.beginPath();
  ctx.ellipse(-6, 2, 20, 9, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body
  ctx.fillStyle = boosted ? "#a1887f" : "#6d4c41";
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // belly pattern
  ctx.fillStyle = "#d7ccc8";
  ctx.beginPath();
  ctx.ellipse(3, 2, 9, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // head (large)
  ctx.fillStyle = "#5d4037";
  ctx.beginPath();
  ctx.arc(11, -9, 12, 0, Math.PI * 2);
  ctx.fill();

  // ear tufts
  ctx.fillStyle = "#4e342e";
  ctx.beginPath();
  ctx.moveTo(6, -19);
  ctx.lineTo(4, -27);
  ctx.lineTo(10, -20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -19);
  ctx.lineTo(18, -27);
  ctx.lineTo(12, -20);
  ctx.closePath();
  ctx.fill();

  // big eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, -9, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8f00";
  ctx.beginPath();
  ctx.arc(8, -9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, -9, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(8, -9, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, -9, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#ffa726";
  ctx.beginPath();
  ctx.moveTo(11, -5);
  ctx.lineTo(15, -1);
  ctx.lineTo(7, -1);
  ctx.closePath();
  ctx.fill();

  // tail
  ctx.fillStyle = "#4e342e";
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-24, -5);
  ctx.lineTo(-24, 5);
  ctx.closePath();
  ctx.fill();
}
