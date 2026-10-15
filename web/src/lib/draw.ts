import type { Flyer, Tree, Cloud, Collectable, Kid } from "../types";

// Pipe Flyer brand colour (violet). Pillars, banners and the paper-plane flyer
// are drawn in this family so the game reads as its own thing.
const BRAND = "#7c3aed";
const BRAND_DARK = "#5b21b6";
const BRAND_LIGHT = "#c4b5fd";

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

// ─── Obstacles: airplane on top, pillar below ────────────────────────────────
// The top obstacle is an airplane towing a striped banner; the bottom one is a
// brand-coloured pillar. The collision column is unchanged (same rect the
// physics checks) — the plane hangs at the bottom of the column.

export function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, canvasH: number) {
  const { x, gapY, gapH, width } = tree;
  const topH = gapY - gapH / 2;
  const botY = gapY + gapH / 2;
  const botH = canvasH - 48 - botY;

  // ── TOP: AIRPLANE with banner ──
  drawAirplaneColumn(ctx, x, width, topH);

  // ── BOTTOM PILLAR ──
  if (botH > 0) {
    drawPillar(ctx, x, botY, width, botH);
  }
}

/** Violet pillar standing on the ground: a wider cap at the top and light
 *  stripes down the shaft. */
function drawPillar(ctx: CanvasRenderingContext2D, x: number, topY: number, width: number, height: number) {
  const capH = 22;
  const capInset = 4;
  ctx.fillStyle = BRAND;
  ctx.fillRect(x + width * 0.22, topY + capH, width * 0.56, height - capH);
  ctx.fillStyle = BRAND_LIGHT;
  for (let sy = topY + capH + 12; sy < topY + height; sy += 22) {
    ctx.fillRect(x + width * 0.3, sy, width * 0.08, 6);
  }
  ctx.fillStyle = BRAND;
  ctx.fillRect(x + capInset, topY, width - capInset * 2, capH);
  ctx.strokeStyle = BRAND_DARK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + capInset, topY, width - capInset * 2, capH);
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
    ctx.fillStyle = BRAND;
    ctx.fillRect(bx, 0, bw, bannerBottom);
    ctx.fillStyle = BRAND_LIGHT;
    for (let sy = 10; sy < bannerBottom; sy += 26) {
      ctx.fillRect(bx, sy, bw, 10);
    }
    // banner edges
    ctx.strokeStyle = BRAND_DARK;
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

  // plane body (nose pointing left — flying toward the flyer)
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

// ─── Flyer: an original paper plane in brand violet ──────────────────────────
// Local space: body centred on (0,0), nose toward +x. The whole plane tilts
// with its vertical velocity, and the lower half-wing flutters with wingAngle.

export function drawFlyer(ctx: CanvasRenderingContext2D, flyer: Flyer, wingAngle: number) {
  ctx.save();
  ctx.translate(flyer.x, flyer.y);

  // tilt with velocity
  const tilt = Math.max(-0.5, Math.min(0.8, flyer.vy * 0.06));
  ctx.rotate(tilt);
  ctx.lineJoin = "round";

  const upper = flyer.boosted ? "#a78bfa" : BRAND;
  const lower = flyer.boosted ? "#8b5cf6" : BRAND_DARK;

  // lower half-wing, hinged at the fold so it flutters
  ctx.save();
  ctx.translate(-6, 0);
  ctx.rotate(wingAngle * 0.15);
  ctx.fillStyle = lower;
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(-10, 13);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // upper half-wing
  ctx.fillStyle = upper;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-16, -13);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();

  // crease down the middle
  ctx.strokeStyle = BRAND_LIGHT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-6, 0);
  ctx.stroke();

  // boost aura
  if (flyer.boosted) {
    ctx.shadowColor = "#ff4081";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,64,129,0.12)";
    ctx.fill();
  }

  ctx.restore();
}
