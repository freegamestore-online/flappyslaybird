// ─── Extra bird avatars: Flamingo, Penguin, Eagle ─────────────────────────────
// Drawn in the same local space as the originals in draw.ts: body at (0,0),
// head toward +x (facing right), ~16px body radius.

export function drawFlamingo(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // wing
  ctx.save();
  ctx.rotate(-wingAngle * 0.7);
  ctx.fillStyle = boosted ? "#ff80ab" : "#ec407a";
  ctx.beginPath();
  ctx.ellipse(-6, 2, 18, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body
  ctx.fillStyle = boosted ? "#ff4081" : "#f06292";
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // long neck (curvy)
  ctx.strokeStyle = "#f06292";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.quadraticCurveTo(20, -14, 15, -22);
  ctx.stroke();

  // head
  ctx.fillStyle = "#f48fb1";
  ctx.beginPath();
  ctx.arc(15, -24, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(17, -25, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // curved black-tipped beak
  ctx.fillStyle = "#ffb300";
  ctx.beginPath();
  ctx.moveTo(20, -25);
  ctx.quadraticCurveTo(28, -24, 27, -19);
  ctx.lineTo(21, -21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#37474f";
  ctx.beginPath();
  ctx.moveTo(27, -19);
  ctx.lineTo(24, -20);
  ctx.lineTo(25.5, -22);
  ctx.closePath();
  ctx.fill();

  // dangling legs
  ctx.strokeStyle = "#f06292";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-2, 10);
  ctx.lineTo(-4, 22);
  ctx.moveTo(4, 10);
  ctx.lineTo(3, 23);
  ctx.stroke();

  // tail fluff
  ctx.fillStyle = "#ec407a";
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(-24, -4);
  ctx.lineTo(-22, 5);
  ctx.closePath();
  ctx.fill();
}

export function drawPenguin(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // flipper
  ctx.save();
  ctx.rotate(-wingAngle * 0.9);
  ctx.fillStyle = boosted ? "#90caf9" : "#263238";
  ctx.beginPath();
  ctx.ellipse(-5, 3, 14, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body (round!)
  ctx.fillStyle = boosted ? "#455a64" : "#263238";
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // white belly
  ctx.fillStyle = "#eceff1";
  ctx.beginPath();
  ctx.ellipse(4, 2, 9, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = "#263238";
  ctx.beginPath();
  ctx.arc(11, -9, 10, 0, Math.PI * 2);
  ctx.fill();

  // face patch
  ctx.fillStyle = "#eceff1";
  ctx.beginPath();
  ctx.arc(14, -8, 6, 0, Math.PI * 2);
  ctx.fill();

  // eye
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(15, -10, 2, 0, Math.PI * 2);
  ctx.fill();

  // beak
  ctx.fillStyle = "#ff9800";
  ctx.beginPath();
  ctx.moveTo(20, -8);
  ctx.lineTo(27, -6);
  ctx.lineTo(20, -4);
  ctx.closePath();
  ctx.fill();

  // little feet
  ctx.fillStyle = "#ff9800";
  ctx.beginPath();
  ctx.ellipse(-2, 13, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, 13, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEagle(ctx: CanvasRenderingContext2D, wingAngle: number, boosted: boolean) {
  // big powerful wing
  ctx.save();
  ctx.rotate(-wingAngle * 0.8);
  ctx.fillStyle = boosted ? "#ffcc80" : "#4e342e";
  ctx.beginPath();
  ctx.ellipse(-7, 1, 22, 9, 0.45, 0, Math.PI * 2);
  ctx.fill();
  // wing feather tips
  ctx.fillStyle = boosted ? "#ffb74d" : "#3e2723";
  ctx.beginPath();
  ctx.ellipse(-16, -4, 9, 4, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // body
  ctx.fillStyle = boosted ? "#8d6e63" : "#5d4037";
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // white head (bald eagle)
  ctx.fillStyle = "#fafafa";
  ctx.beginPath();
  ctx.arc(13, -8, 9.5, 0, Math.PI * 2);
  ctx.fill();

  // fierce eye + brow
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(16, -10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#616161";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, -14);
  ctx.lineTo(20, -12);
  ctx.stroke();

  // hooked yellow beak
  ctx.fillStyle = "#fbc02d";
  ctx.beginPath();
  ctx.moveTo(21, -10);
  ctx.quadraticCurveTo(31, -10, 29, -3);
  ctx.quadraticCurveTo(26, -5, 22, -5);
  ctx.closePath();
  ctx.fill();

  // tail (white, fanned)
  ctx.fillStyle = "#fafafa";
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-28, -6);
  ctx.lineTo(-29, 2);
  ctx.lineTo(-27, 8);
  ctx.closePath();
  ctx.fill();

  // talons
  ctx.strokeStyle = "#fbc02d";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 11);
  ctx.lineTo(1, 17);
  ctx.moveTo(6, 10);
  ctx.lineTo(7, 16);
  ctx.stroke();
}
