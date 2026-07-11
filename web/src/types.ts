export type AvatarType = "robin" | "parrot" | "owl" | "flamingo" | "penguin" | "eagle";

export interface Bird {
  x: number;
  y: number;
  vy: number;
  avatar: AvatarType;
  boosted: boolean;
  boostTimer: number;
}

export interface Tree {
  x: number;
  gapY: number;  // center Y of the gap
  gapH: number;  // height of the gap
  width: number;
  passed: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

export type CollectableKind = "fly" | "mosquito" | "dragonfly";

export interface Collectable {
  x: number;
  y: number;
  kind: CollectableKind;
  alive: boolean;
  angle: number; // for animation
}

export interface Kid {
  x: number;
  netX: number; // net swing offset
  netAngle: number;
  swingDir: number;
}

export type GamePhase = "avatar" | "playing" | "dead" | "gameover";
