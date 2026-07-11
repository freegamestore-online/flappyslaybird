// ─── Level progression ────────────────────────────────────────────────────────
// 5 levels, advancing by score (trees/planes passed). Levels 1-3 are gentle:
// slower obstacles, wider gaps, softer gravity, rarer hazards. 4-5 ramp up.

export interface LevelConfig {
  /** 1-based level number */
  n: number;
  name: string;
  /** score needed to ADVANCE to the next level (Infinity on the last) */
  nextAt: number;
  /** obstacle scroll speed, px/s */
  speed: number;
  /** gap height between top plane and bottom tree, px */
  gap: number;
  /** downward acceleration, px/s² */
  gravity: number;
  /** obstacle spawn interval range, seconds */
  spawn: [number, number];
  /** cloud spawn interval range, seconds */
  cloudSpawn: [number, number];
  /** kid spawn interval range, seconds */
  kidSpawn: [number, number];
}

export const LEVELS: LevelConfig[] = [
  { n: 1, name: "Cozy Start", nextAt: 10, speed: 125, gap: 250, gravity: 1050, spawn: [2.6, 3.4], cloudSpawn: [5, 8], kidSpawn: [18, 26] },
  { n: 2, name: "Breezy", nextAt: 25, speed: 145, gap: 230, gravity: 1120, spawn: [2.3, 3.0], cloudSpawn: [4.5, 7], kidSpawn: [16, 22] },
  { n: 3, name: "Windy", nextAt: 45, speed: 165, gap: 210, gravity: 1200, spawn: [2.1, 2.8], cloudSpawn: [4, 6], kidSpawn: [14, 20] },
  { n: 4, name: "Stormy", nextAt: 70, speed: 195, gap: 190, gravity: 1300, spawn: [1.9, 2.5], cloudSpawn: [3.5, 5.5], kidSpawn: [12, 18] },
  { n: 5, name: "Sky Master", nextAt: Infinity, speed: 225, gap: 172, gravity: 1400, spawn: [1.7, 2.3], cloudSpawn: [3, 5], kidSpawn: [10, 16] },
];

/** The level a given score puts you in. */
export function levelForScore(score: number): LevelConfig {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    lvl = l;
    if (score < l.nextAt) break;
  }
  return lvl;
}
