import { useRef, useState, useCallback, useEffect } from "react";
import { GameShell, GameTopbar } from "@freegamestore/games";
import { useGameLoop } from "./hooks/useGameLoop";
import { useHighScore } from "./hooks/useHighScore";
import type { AvatarType, Bird, Tree, Cloud, Collectable, Kid, GamePhase } from "./types";
import {
  drawSky,
  drawGround,
  drawTree,
  drawCloud,
  drawCollectable,
  drawKid,
  drawBird,
} from "./lib/draw";

// ─── Constants ───────────────────────────────────────────────────────────────
const GRAVITY = 1400;
const FLAP_V = -420;
const BOOST_FLAP_V = -520;
const BIRD_X = 90;
const TREE_WIDTH = 64;
const TREE_GAP = 190;
const TREE_SPEED_BASE = 180;
const CLOUD_SPEED_BASE = 60;
const KID_SPEED = 60;
const MAX_HEARTS = 5;
const BOOST_DURATION = 5;
const KID_NET_RADIUS = 22;
const BIRD_RADIUS = 14;
const TREE_HITBOX_SHRINK = 8;
const CLOUD_HITBOX_SHRINK = 10;
const COLLECTABLE_RADIUS = 16;
const GROUND_H = 48;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function circleRect(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number,
) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

// ─── Avatar Picker ───────────────────────────────────────────────────────────
const AVATARS: { type: AvatarType; emoji: string; name: string; desc: string }[] = [
  { type: "robin", emoji: "🐦", name: "Robin", desc: "Speedy & classic. Red breast for luck!" },
  { type: "parrot", emoji: "🦜", name: "Parrot", desc: "Colorful & bold. Long tail for style!" },
  { type: "owl", emoji: "🦉", name: "Owl", desc: "Wise & sturdy. Big eyes see everything!" },
];

function AvatarPicker({ onSelect }: { onSelect: (a: AvatarType) => void }) {
  const [hovered, setHovered] = useState<AvatarType | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4"
      style={{ background: "linear-gradient(180deg, #87ceeb 0%, #d4f0ff 100%)" }}>
      <h1
        className="text-4xl font-bold text-center drop-shadow"
        style={{ fontFamily: "Fraunces, serif", color: "#2e7d32" }}
      >
        🐦 Flappy Slay Bird
      </h1>
      <p className="text-lg font-semibold" style={{ color: "#1565c0", fontFamily: "Manrope, sans-serif" }}>
        Choose your bird!
      </p>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-lg">
        {AVATARS.map((av) => (
          <button
            key={av.type}
            onMouseEnter={() => setHovered(av.type)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(av.type)}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl border-4 transition-all cursor-pointer"
            style={{
              minWidth: 130,
              background: hovered === av.type ? "#fff" : "rgba(255,255,255,0.7)",
              borderColor: hovered === av.type ? "#43a047" : "rgba(255,255,255,0.5)",
              transform: hovered === av.type ? "scale(1.07)" : "scale(1)",
              boxShadow: hovered === av.type ? "0 8px 32px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            <span style={{ fontSize: 56 }}>{av.emoji}</span>
            <span className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "#2e7d32" }}>
              {av.name}
            </span>
            <span className="text-xs text-center" style={{ color: "#555", fontFamily: "Manrope, sans-serif", maxWidth: 110 }}>
              {av.desc}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 mt-2 text-sm" style={{ color: "#1565c0", fontFamily: "Manrope, sans-serif" }}>
        <p>🖱️ Click / Tap / Space to flap</p>
        <p>☁️ Avoid clouds &amp; trees</p>
        <p>🦟 Collect bugs for hearts</p>
        <p>🐉 Dragonfly = 5s boost!</p>
        <p>🧒 Don't get caught by kids!</p>
      </div>
    </div>
  );
}

// ─── HUD overlay ─────────────────────────────────────────────────────────────
function HUD({
  hearts,
  boosted,
  boostTimer,
}: {
  hearts: number;
  boosted: boolean;
  boostTimer: number;
}) {
  return (
    <div
      className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none select-none"
      style={{ zIndex: 10 }}
    >
      <div className="flex gap-1">
        {Array.from({ length: MAX_HEARTS }).map((_, i) => (
          <span key={i} style={{ fontSize: 22, opacity: i < hearts ? 1 : 0.22 }}>
            ❤️
          </span>
        ))}
      </div>
      {boosted && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: "rgba(255,64,129,0.85)",
            color: "#fff",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          ⚡ BOOST {boostTimer.toFixed(1)}s
        </div>
      )}
    </div>
  );
}

// ─── Game Over overlay ───────────────────────────────────────────────────────
function GameOverOverlay({
  score,
  highScore,
  cause,
  onRestart,
  onChangeAvatar,
}: {
  score: number;
  highScore: number;
  cause: string;
  onRestart: () => void;
  onChangeAvatar: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 20 }}
    >
      <div
        className="flex flex-col items-center gap-3 p-8 rounded-3xl"
        style={{ background: "rgba(255,255,255,0.95)", maxWidth: 340, width: "90%" }}
      >
        <h2
          className="text-3xl font-bold"
          style={{ fontFamily: "Fraunces, serif", color: "#c62828" }}
        >
          Game Over!
        </h2>
        <p className="text-base" style={{ color: "#555", fontFamily: "Manrope, sans-serif" }}>
          {cause}
        </p>
        <div className="flex gap-6 mt-1">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "#1565c0" }}>{score}</span>
            <span className="text-xs" style={{ color: "#888" }}>Score</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold" style={{ color: "#f57f17" }}>{highScore}</span>
            <span className="text-xs" style={{ color: "#888" }}>Best</span>
          </div>
        </div>
        {score >= highScore && score > 0 && (
          <div className="text-sm font-bold" style={{ color: "#43a047" }}>🏆 New High Score!</div>
        )}
        <button
          onClick={onRestart}
          className="w-full py-3 rounded-2xl text-lg font-bold mt-1"
          style={{ background: "#43a047", color: "#fff", fontFamily: "Manrope, sans-serif", minHeight: 48 }}
        >
          Play Again
        </button>
        <button
          onClick={onChangeAvatar}
          className="w-full py-2 rounded-2xl text-base font-semibold"
          style={{ background: "#e3f2fd", color: "#1565c0", fontFamily: "Manrope, sans-serif", minHeight: 44 }}
        >
          Change Bird
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<GamePhase>("avatar");
  const [score, setScore] = useState(0);
  const [highScore, updateHighScore] = useHighScore("flappyslaybird_hs");
  const [hearts, setHearts] = useState(3);
  const [boosted, setBoosted] = useState(false);
  const [boostTimer, setBoostTimer] = useState(0);
  const [gameOverCause, setGameOverCause] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>("robin");

  // Game state refs (mutated in loop, no re-render)
  const birdRef = useRef<Bird>({
    x: BIRD_X, y: 200, vy: 0, avatar: "robin", boosted: false, boostTimer: 0,
  });
  const treesRef = useRef<Tree[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const collectablesRef = useRef<Collectable[]>([]);
  const kidsRef = useRef<Kid[]>([]);
  const scoreRef = useRef(0);
  const heartsRef = useRef(3);
  const phaseRef = useRef<GamePhase>("avatar");
  const wingAngleRef = useRef(0);
  const wingDirRef = useRef(1);
  const canvasSizeRef = useRef({ w: 400, h: 600 });
  const invincibleRef = useRef(0); // invincibility frames after hit
  const treeSpawnTimerRef = useRef(0);
  const collectSpawnTimerRef = useRef(0);
  const kidSpawnTimerRef = useRef(0);
  const cloudSpawnTimerRef = useRef(0);
  const distanceRef = useRef(0);
  const justFlapRef = useRef(false);

  // Sync phase ref
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Resize canvas
  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
      canvasSizeRef.current = { w, h };
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const initGame = useCallback((avatar: AvatarType) => {
    const { h } = canvasSizeRef.current;
    birdRef.current = { x: BIRD_X, y: h * 0.4, vy: 0, avatar, boosted: false, boostTimer: 0 };
    treesRef.current = [];
    cloudsRef.current = [];
    collectablesRef.current = [];
    kidsRef.current = [];
    scoreRef.current = 0;
    heartsRef.current = 3;
    invincibleRef.current = 0;
    treeSpawnTimerRef.current = 1.5;
    collectSpawnTimerRef.current = 3;
    kidSpawnTimerRef.current = 8;
    cloudSpawnTimerRef.current = 2;
    distanceRef.current = 0;
    setScore(0);
    setHearts(3);
    setBoosted(false);
    setBoostTimer(0);
    setGameOverCause("");
  }, []);

  const handleAvatarSelect = useCallback((avatar: AvatarType) => {
    setSelectedAvatar(avatar);
    initGame(avatar);
    setPhase("playing");
  }, [initGame]);

  const handleRestart = useCallback(() => {
    initGame(selectedAvatar);
    setPhase("playing");
  }, [initGame, selectedAvatar]);

  const handleChangeAvatar = useCallback(() => {
    setPhase("avatar");
  }, []);

  // Flap on click/tap/space
  const flap = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    justFlapRef.current = true;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  // ─── Game Loop ─────────────────────────────────────────────────────────────
  useGameLoop((dt) => {
    if (phaseRef.current !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = canvasSizeRef.current;
    const groundY = h - GROUND_H;
    const bird = birdRef.current;

    // Speed scaling with distance
    const speedMult = 1 + distanceRef.current * 0.00012;
    const treeSpeed = TREE_SPEED_BASE * speedMult * (bird.boosted ? 1.5 : 1);
    const cloudSpeed = CLOUD_SPEED_BASE * speedMult;

    distanceRef.current += treeSpeed * dt;

    // ── Flap ──
    if (justFlapRef.current) {
      bird.vy = bird.boosted ? BOOST_FLAP_V : FLAP_V;
      justFlapRef.current = false;
    }

    // ── Physics ──
    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;

    // ── Boost timer ──
    if (bird.boosted) {
      bird.boostTimer -= dt;
      if (bird.boostTimer <= 0) {
        bird.boosted = false;
        bird.boostTimer = 0;
      }
      setBoosted(true);
      setBoostTimer(bird.boostTimer);
    } else {
      setBoosted(false);
    }

    // ── Invincibility cooldown ──
    if (invincibleRef.current > 0) invincibleRef.current -= dt;

    // ── Wing animation ──
    wingAngleRef.current += wingDirRef.current * 6 * dt;
    if (Math.abs(wingAngleRef.current) > 0.45) wingDirRef.current *= -1;

    // ── Spawn trees ──
    treeSpawnTimerRef.current -= dt;
    if (treeSpawnTimerRef.current <= 0) {
      const minGapY = 120;
      const maxGapY = groundY - 120;
      const gapY = rand(minGapY, maxGapY);
      const gapH = Math.max(130, TREE_GAP - distanceRef.current * 0.008);
      treesRef.current.push({ x: w + 10, gapY, gapH, width: TREE_WIDTH, passed: false });
      treeSpawnTimerRef.current = rand(1.8, 2.6) / speedMult;
    }

    // ── Spawn clouds ──
    cloudSpawnTimerRef.current -= dt;
    if (cloudSpawnTimerRef.current <= 0) {
      const cw = rand(80, 140);
      const ch = rand(40, 65);
      const cy = rand(30, groundY * 0.55);
      cloudsRef.current.push({ x: w + 10, y: cy, w: cw, h: ch, speed: cloudSpeed * rand(0.7, 1.3) });
      cloudSpawnTimerRef.current = rand(3, 6);
    }

    // ── Spawn collectables ──
    collectSpawnTimerRef.current -= dt;
    if (collectSpawnTimerRef.current <= 0) {
      const roll = Math.random();
      const kind = roll < 0.08 ? "dragonfly" : roll < 0.5 ? "mosquito" : "fly";
      const cy = rand(80, groundY - 60);
      collectablesRef.current.push({ x: w + 10, y: cy, kind, alive: true, angle: 0 });
      collectSpawnTimerRef.current = rand(2.5, 5);
    }

    // ── Spawn kids ──
    kidSpawnTimerRef.current -= dt;
    if (kidSpawnTimerRef.current <= 0) {
      kidsRef.current.push({ x: w + 10, netX: 0, netAngle: -0.4, swingDir: 1 });
      kidSpawnTimerRef.current = rand(12, 20) / speedMult;
    }

    // ── Move trees ──
    for (const tree of treesRef.current) {
      tree.x -= treeSpeed * dt;
    }
    treesRef.current = treesRef.current.filter((t) => t.x + t.width + 60 > 0);

    // ── Move clouds ──
    for (const cloud of cloudsRef.current) {
      cloud.x -= cloud.speed * dt;
    }
    cloudsRef.current = cloudsRef.current.filter((c) => c.x + c.w > 0);

    // ── Move collectables ──
    for (const c of collectablesRef.current) {
      c.x -= treeSpeed * dt;
      c.angle += dt * (c.kind === "dragonfly" ? 2 : 4);
    }
    collectablesRef.current = collectablesRef.current.filter((c) => c.x > -30 && c.alive);

    // ── Move kids ──
    for (const kid of kidsRef.current) {
      kid.x -= KID_SPEED * dt * speedMult;
      kid.netAngle += kid.swingDir * 1.8 * dt;
      if (Math.abs(kid.netAngle) > 0.7) kid.swingDir *= -1;
    }
    kidsRef.current = kidsRef.current.filter((k) => k.x > -60);

    // ── Scoring ──
    for (const tree of treesRef.current) {
      if (!tree.passed && tree.x + tree.width < BIRD_X) {
        tree.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        updateHighScore(scoreRef.current);
      }
    }

    // ── Collision: trees ──
    if (invincibleRef.current <= 0) {
      for (const tree of treesRef.current) {
        const topH = tree.gapY - tree.gapH / 2;
        const botY = tree.gapY + tree.gapH / 2;
        const tx = tree.x + TREE_HITBOX_SHRINK;
        const tw = tree.width - TREE_HITBOX_SHRINK * 2;

        const hitTop = circleRect(bird.x, bird.y, BIRD_RADIUS, tx, -10, tw, topH + 10);
        const hitBot = circleRect(bird.x, bird.y, BIRD_RADIUS, tx, botY, tw, groundY - botY);

        if (hitTop || hitBot) {
          loseHeart("🌳 Hit a tree!");
          break;
        }
      }
    }

    // ── Collision: clouds ──
    if (invincibleRef.current <= 0) {
      for (const cloud of cloudsRef.current) {
        const cx = cloud.x + CLOUD_HITBOX_SHRINK;
        const cy = cloud.y + CLOUD_HITBOX_SHRINK;
        const cw2 = cloud.w - CLOUD_HITBOX_SHRINK * 2;
        const ch2 = cloud.h - CLOUD_HITBOX_SHRINK * 2;
        if (circleRect(bird.x, bird.y, BIRD_RADIUS - 2, cx, cy, cw2, ch2)) {
          loseHeart("☁️ Hit a cloud!");
          break;
        }
      }
    }

    // ── Collision: collectables ──
    for (const c of collectablesRef.current) {
      if (!c.alive) continue;
      const dx = bird.x - c.x;
      const dy = bird.y - c.y;
      if (dx * dx + dy * dy < (BIRD_RADIUS + COLLECTABLE_RADIUS) ** 2) {
        c.alive = false;
        if (c.kind === "dragonfly") {
          bird.boosted = true;
          bird.boostTimer = BOOST_DURATION;
          setBoosted(true);
          setBoostTimer(BOOST_DURATION);
        } else {
          // gain a heart
          const newH = Math.min(heartsRef.current + 1, MAX_HEARTS);
          heartsRef.current = newH;
          setHearts(newH);
        }
      }
    }

    // ── Collision: kids (net) ──
    for (const kid of kidsRef.current) {
      // net tip position (approximate)
      const netTipX = kid.x + 20 + Math.sin(kid.netAngle) * 40;
      const netTipY = groundY - 48 - 55 + Math.cos(kid.netAngle) * 16;
      const dx = bird.x - netTipX;
      const dy = bird.y - netTipY;
      if (dx * dx + dy * dy < (BIRD_RADIUS + KID_NET_RADIUS) ** 2) {
        endGame("🧒 Caught by a kid's net!");
        return;
      }
      // also check kid body area (wide net sweep)
      if (
        rectsOverlap(
          bird.x - BIRD_RADIUS, bird.y - BIRD_RADIUS, BIRD_RADIUS * 2, BIRD_RADIUS * 2,
          kid.x - 30, groundY - 110, 80, 110,
        )
      ) {
        endGame("🧒 Caught by a kid's net!");
        return;
      }
    }

    // ── Ground / ceiling ──
    if (bird.y + BIRD_RADIUS >= groundY) {
      endGame("💥 Hit the ground!");
      return;
    }
    if (bird.y - BIRD_RADIUS <= 0) {
      bird.y = BIRD_RADIUS;
      bird.vy = Math.max(bird.vy, 0);
    }

    // ─── Draw ─────────────────────────────────────────────────────────────
    drawSky(ctx, w, h, bird.boosted);

    // Draw clouds (behind trees)
    for (const cloud of cloudsRef.current) {
      drawCloud(ctx, cloud);
    }

    // Draw trees
    for (const tree of treesRef.current) {
      drawTree(ctx, tree, h);
    }

    // Draw collectables
    for (const c of collectablesRef.current) {
      if (c.alive) drawCollectable(ctx, c);
    }

    // Draw kids
    for (const kid of kidsRef.current) {
      drawKid(ctx, kid, h);
    }

    drawGround(ctx, w, h);

    // Bird flicker when invincible
    const showBird = invincibleRef.current <= 0 || Math.floor(invincibleRef.current * 10) % 2 === 0;
    if (showBird) {
      drawBird(ctx, bird, wingAngleRef.current);
    }

    // Score on canvas
    ctx.save();
    ctx.font = "bold 28px Fraunces, serif";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.textAlign = "center";
    ctx.fillText(`${scoreRef.current}`, w / 2, 36);
    ctx.restore();
  }, phase !== "playing");

  function loseHeart(cause: string) {
    if (invincibleRef.current > 0) return;
    const newH = heartsRef.current - 1;
    heartsRef.current = newH;
    setHearts(newH);
    if (newH <= 0) {
      endGame(cause);
    } else {
      invincibleRef.current = 1.5;
    }
  }

  function endGame(cause: string) {
    phaseRef.current = "dead";
    setPhase("gameover");
    setGameOverCause(cause);
    updateHighScore(scoreRef.current);
  }

  return (
    <GameShell topbar={<GameTopbar title="Flappy Slay Bird 🐦" score={score} highScore={highScore} />}>
      {phase === "avatar" ? (
        <AvatarPicker onSelect={handleAvatarSelect} />
      ) : (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: "none", cursor: "pointer" }}
            onClick={flap}
            onTouchStart={(e) => { e.preventDefault(); flap(); }}
          />
          {phase === "playing" && (
            <HUD hearts={hearts} boosted={boosted} boostTimer={boostTimer} />
          )}
          {phase === "gameover" && (
            <GameOverOverlay
              score={score}
              highScore={highScore}
              cause={gameOverCause}
              onRestart={handleRestart}
              onChangeAvatar={handleChangeAvatar}
            />
          )}
          {phase === "playing" && (
            <div
              className="absolute bottom-16 right-3 pointer-events-none select-none text-xs"
              style={{ color: "rgba(0,0,0,0.35)", fontFamily: "Manrope, sans-serif" }}
            >
              tap / space to flap
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
