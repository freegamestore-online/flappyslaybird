import { describe, expect, it } from "vitest";
import { netHoopCenter, kidBodyRect, inTreeColumn, CLOUD_SAFE_MARGIN } from "./collision";
import type { Kid, Tree } from "../types";

const kid: Kid = { x: 200, netAngle: 0, swingDir: 1 };
const groundY = 552;

describe("kid hitboxes", () => {
  it("puts the net hoop where drawKid draws it (40px up the pole from the hand)", () => {
    expect(netHoopCenter(kid, groundY)).toEqual({ x: 220, y: groundY - 95 });
  });

  it("keeps the body box to the drawn kid, not a wide 80x110 sweep", () => {
    const body = kidBodyRect(kid, groundY);
    expect(body.w).toBeLessThanOrEqual(24);
    expect(body.h).toBeLessThanOrEqual(76);
    expect(body.y + body.h).toBe(groundY);
  });
});

describe("inTreeColumn", () => {
  const tree: Tree = { x: 100, gapY: 300, gapH: 200, width: 64, passed: false };

  it("is true while the flyer is in or next to a pillar column", () => {
    expect(inTreeColumn(130, [tree])).toBe(true);
    expect(inTreeColumn(100 - CLOUD_SAFE_MARGIN + 1, [tree])).toBe(true);
  });

  it("is false in open sky between pillars", () => {
    expect(inTreeColumn(100 - CLOUD_SAFE_MARGIN - 1, [tree])).toBe(false);
    expect(inTreeColumn(400, [tree])).toBe(false);
    expect(inTreeColumn(130, [])).toBe(false);
  });
});
