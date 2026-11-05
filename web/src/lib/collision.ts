import type { Kid, Tree } from "../types";

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function circleRect(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number,
) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

/** Centre of the kid's net hoop, matching drawKid (pivot at (x+20, groundY-55),
 *  hoop 40px up the pole, pole rotated by netAngle). */
export function netHoopCenter(kid: Kid, groundY: number) {
  return {
    x: kid.x + 20 + Math.sin(kid.netAngle) * 40,
    y: groundY - 55 - Math.cos(kid.netAngle) * 40,
  };
}

/** The kid's drawn body (head to feet, 24px wide), as { x, y, w, h }. */
export function kidBodyRect(kid: Kid, groundY: number) {
  return { x: kid.x - 12, y: groundY - 76, w: 24, h: 76 };
}

/** Clouds are harmless while the flyer is threading a pillar gap (plus a
 *  margin either side), so a cloud drifting into a gap can't make it
 *  impassable. */
export const CLOUD_SAFE_MARGIN = 40;

export function inTreeColumn(x: number, trees: Tree[], margin = CLOUD_SAFE_MARGIN) {
  return trees.some((t) => x > t.x - margin && x < t.x + t.width + margin);
}
