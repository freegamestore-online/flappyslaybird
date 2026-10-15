import { useRef, useState, useCallback, useEffect } from "react";
import { GameShell, GameTopbar } from "@freegamestore/games";
import { useGameLoop } from "./hooks/useGameLoop";
import { useHighScore } from "./hooks/useHighScore";
import type { Flyer, Tree, Cloud, Collectable, Kid, GamePhase } from "./types";
import {
  drawSky,
  drawGround,
  drawTree,
  drawCloud,
  drawCollectable,
  drawKid,
  drawFlyer,
} from "./lib/draw";
import { LEVELS, levelForScore, type LevelConfig } from "./lib/levels";

// ─── Constants ───────────────────────────────────────────────────────────────
// Pipe Flyer brand colour (violet), used for UI accents.
const BRAND = "#7c3aed";
const BRAND_DARK = "#5b21b6";
const FLAP_V = -400;
const BOOST_FLAP_V = -500;
const FLYER_X = 90;
const TREE_WIDTH = 64;
const CLOUD_SPEED_BASE = 55;
const KID_SPEED = 55;
const MAX_HEARTS = 7;
const START_HEARTS = 5;
const BOOST_DURATION = 5;
const KID_NET_RADIUS = 20;
const FLYER_RADIUS = 14;
const TREE_HITBOX_SHRINK = 14;   // generous: visual width minus 2x this is solid
const CLOUD_HITBOX_SHRINK = 14;
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

// ─── Start screen ────────────────────────────────────────────────────────────
function StartScreen({ onStart }: { onStart: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4"
      style={{ background: "linear-gradient(180deg, #87ceeb 0%, #d4f0ff 100%)" }}>
      <h1
        className="text-4xl font-bold text-center drop-shadow"
        style={{ fontFamily: "Fraunces, serif", color: BRAND_DARK }}
      >
        Pipe Flyer
      </h1>
      <p className="text-lg font-semibold" style={{ color: "#1565c0", fontFamily: "Manrope, sans-serif" }}>
        Fly your paper plane through the gaps!
      </p>

      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onStart}
        className="px-10 py-4 rounded-2xl text-xl font-bold transition-all cursor-pointer"
        style={{
          background: hovered ? BRAND_DARK : BRAND,
          color: "#fff",
          fontFamily: "Fraunces, serif",
          minHeight: 48,
          transform: hovered ? "scale(1.05)" : "scale(1)",
          boxShadow: "0 8px 24px rgba(91,33,182,0.35)",
        }}
      >
        Start flying
      </button>

      <div className="flex flex-col items-center gap-1 mt-2 text-sm" style={{ color: "#1565c0", fontFamily: "Manrope, sans-serif" }}>
        <p>🖱️ Click / Tap / Space to flap</p>
        <p>✈️ Dodge airplanes &amp; pillars, avoid clouds</p>
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
  level,
}: {
  hearts: number;
  boosted: boolean;
  boostTimer: number;
  level: number;
}) {
  return (
    <div
      className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none select-none"
      style={{ zIndex: 10 }}
    >
      <div
        className="px-2 py-0.5 rounded-full text-xs font-bold self-start"
        style={{ background: "rgba(21,101,192,0.85)", color: "#fff", fontFamily: "Manrope, sans-serif" }}
      >
        ⭐ Level {level}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: Math.max(MAX_HEARTS, hearts) }).map((_, i) => (
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
}: {
  score: number;
  highScore: number;
  cause: string;
  onRestart: () => void;
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
          <div className="text-sm font-bold" style={{ color: BRAND }}>🏆 New High Score!</div>
        )}
        <button
          onClick={onRestart}
          className="w-full py-3 rounded-2xl text-lg font-bold mt-1"
          style={{ background: BRAND, color: "#fff", fontFamily: "Manrope, sans-serif", minHeight: 48 }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<GamePhase>("start");
  const [score, setScore] = useState(0);
  const [highScore, updateHighScore] = useHighScore("flappyslaybird_hs");
  const [hearts, setHearts] = useState(START_HEARTS);
  const [level, setLevel] = useState(1);
  const [levelBanner, setLevelBanner] = useState<string | null>(null);
  const [boosted, setBoosted] = useState(false);
  const [boostTimer, setBoostTimer] = useState(0);
  const [gameOverCause, setGameOverCause] = useState("");

  // Game state refs (mutated in loop, no re-render)
  const flyerRef = useRef<Flyer>({
    x: FLYER_X, y: 200, vy: 0, boosted: false, boostTimer: 0,
  });
  const treesRef = useRef<Tree[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const collectablesRef = useRef<Collectable[]>([]);
  const kidsRef = useRef<Kid[]>([]);
  const scoreRef = useRef(0);
  const heartsRef = useRef(START_HEARTS);
  const levelRef = useRef<LevelConfig>(LEVELS[0]);
  const bannerTimerRef = useRef(0);
  const phaseRef = useRef<GamePhase>("start");
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
    // Re-run when the phase changes: the canvas only exists once we leave the
    // "start" phase, so the initial mount (phase === "start") can't size it.
  }, [phase]);

  const initGame = useCallback(() => {
    const { h } = canvasSizeRef.current;
    flyerRef.current = { x: FLYER_X, y: h * 0.4, vy: 0, boosted: false, boostTimer: 0 };
    treesRef.current = [];
    cloudsRef.current = [];
    collectablesRef.current = [];
    kidsRef.current = [];
    scoreRef.current = 0;
    heartsRef.current = START_HEARTS;
    levelRef.current = LEVELS[0];
    bannerTimerRef.current = 0;
    invincibleRef.current = 0;
    treeSpawnTimerRef.current = 1.5;
    collectSpawnTimerRef.current = 3;
    kidSpawnTimerRef.current = 8;
    cloudSpawnTimerRef.current = 2;
    distanceRef.current = 0;
    setScore(0);
    setHearts(START_HEARTS);
    setLevel(1);
    setLevelBanner(null);
    setBoosted(false);
    setBoostTimer(0);
    setGameOverCause("");
  }, []);

  const handleStart = useCallback(() => {
    initGame();
    setPhase("playing");
  }, [initGame]);

  const handleRestart = useCallback(() => {
    initGame();
    setPhase("playing");
  }, [initGame]);

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
    const flyer = flyerRef.current;

    // Level-driven difficulty (levels 1-3 are gentle, 4-5 ramp up)
    const lvl = levelRef.current;
    const treeSpeed = lvl.speed * (flyer.boosted ? 1.5 : 1);
    const cloudSpeed = CLOUD_SPEED_BASE * (0.8 + lvl.n * 0.15);

    distanceRef.current += treeSpeed * dt;

    // Level-up check + banner countdown
    const nowLvl = levelForScore(scoreRef.current);
    if (nowLvl.n !== lvl.n) {
      levelRef.current = nowLvl;
      setLevel(nowLvl.n);
      setLevelBanner(`Level ${nowLvl.n} — ${nowLvl.name}!`);
      bannerTimerRef.current = 2.2;
    }
    if (bannerTimerRef.current > 0) {
      bannerTimerRef.current -= dt;
      if (bannerTimerRef.current <= 0) setLevelBanner(null);
    }

    // ── Flap ──
    if (justFlapRef.current) {
      flyer.vy = flyer.boosted ? BOOST_FLAP_V : FLAP_V;
      justFlapRef.current = false;
    }

    // ── Physics ── (gentler gravity on early levels)
    flyer.vy += lvl.gravity * dt;
    flyer.y += flyer.vy * dt;

    // ── Boost timer ──
    if (flyer.boosted) {
      flyer.boostTimer -= dt;
      if (flyer.boostTimer <= 0) {
        flyer.boosted = false;
        flyer.boostTimer = 0;
      }
      setBoosted(true);
      setBoostTimer(flyer.boostTimer);
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
      const minGapY = 130;
      const maxGapY = groundY - 130;
      const gapY = rand(minGapY, maxGapY);
      const gapH = lvl.gap;
      treesRef.current.push({ x: w + 10, gapY, gapH, width: TREE_WIDTH, passed: false });
      treeSpawnTimerRef.current = rand(lvl.spawn[0], lvl.spawn[1]);
    }

    // ── Spawn clouds ──
    cloudSpawnTimerRef.current -= dt;
    if (cloudSpawnTimerRef.current <= 0) {
      const cw = rand(80, 140);
      const ch = rand(40, 65);
      const cy = rand(30, groundY * 0.55);
      cloudsRef.current.push({ x: w + 10, y: cy, w: cw, h: ch, speed: cloudSpeed * rand(0.7, 1.3) });
      cloudSpawnTimerRef.current = rand(lvl.cloudSpawn[0], lvl.cloudSpawn[1]);
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
      kidSpawnTimerRef.current = rand(lvl.kidSpawn[0], lvl.kidSpawn[1]);
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
      kid.x -= KID_SPEED * dt * (0.8 + lvl.n * 0.15);
      kid.netAngle += kid.swingDir * 1.8 * dt;
      if (Math.abs(kid.netAngle) > 0.7) kid.swingDir *= -1;
    }
    kidsRef.current = kidsRef.current.filter((k) => k.x > -60);

    // ── Scoring ──
    for (const tree of treesRef.current) {
      if (!tree.passed && tree.x + tree.width < FLYER_X) {
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

        const hitTop = circleRect(flyer.x, flyer.y, FLYER_RADIUS - 3, tx, -10, tw, topH + 10);
        const hitBot = circleRect(flyer.x, flyer.y, FLYER_RADIUS - 3, tx, botY, tw, groundY - botY);

        if (hitTop) {
          loseHeart("✈️ Hit an airplane!");
          break;
        }
        if (hitBot) {
          loseHeart("🧱 Hit a pillar!");
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
        if (circleRect(flyer.x, flyer.y, FLYER_RADIUS - 4, cx, cy, cw2, ch2)) {
          loseHeart("☁️ Hit a cloud!");
          break;
        }
      }
    }

    // ── Collision: collectables ──
    for (const c of collectablesRef.current) {
      if (!c.alive) continue;
      const dx = flyer.x - c.x;
      const dy = flyer.y - c.y;
      if (dx * dx + dy * dy < (FLYER_RADIUS + COLLECTABLE_RADIUS) ** 2) {
        c.alive = false;
        if (c.kind === "dragonfly") {
          flyer.boosted = true;
          flyer.boostTimer = BOOST_DURATION;
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
      const dx = flyer.x - netTipX;
      const dy = flyer.y - netTipY;
      if (dx * dx + dy * dy < (FLYER_RADIUS + KID_NET_RADIUS) ** 2) {
        endGame("🧒 Caught by a kid's net!");
        return;
      }
      // also check kid body area (wide net sweep)
      if (
        rectsOverlap(
          flyer.x - FLYER_RADIUS, flyer.y - FLYER_RADIUS, FLYER_RADIUS * 2, FLYER_RADIUS * 2,
          kid.x - 30, groundY - 110, 80, 110,
        )
      ) {
        endGame("🧒 Caught by a kid's net!");
        return;
      }
    }

    // ── Ground / ceiling ──
    if (flyer.y + FLYER_RADIUS >= groundY) {
      endGame("💥 Hit the ground!");
      return;
    }
    if (flyer.y - FLYER_RADIUS <= 0) {
      flyer.y = FLYER_RADIUS;
      flyer.vy = Math.max(flyer.vy, 0);
    }

    // ─── Draw ─────────────────────────────────────────────────────────────
    drawSky(ctx, w, h, flyer.boosted);

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

    // Flyer flicker when invincible
    const showFlyer = invincibleRef.current <= 0 || Math.floor(invincibleRef.current * 10) % 2 === 0;
    if (showFlyer) {
      drawFlyer(ctx, flyer, wingAngleRef.current);
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
    <GameShell
      topbar={
        <GameTopbar
          title="Pipe Flyer"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Best", value: Math.max(highScore, score) },
          ]}
        />
      }
    >
      {phase === "start" ? (
        <StartScreen onStart={handleStart} />
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
            <HUD hearts={hearts} boosted={boosted} boostTimer={boostTimer} level={level} />
          )}
          {phase === "playing" && levelBanner && (
            <div
              className="absolute inset-x-0 top-16 flex justify-center pointer-events-none"
              style={{ zIndex: 15 }}
            >
              <div
                className="px-6 py-2 rounded-full text-xl font-bold"
                style={{ background: "rgba(124,58,237,0.92)", color: "#fff", fontFamily: "Fraunces, serif", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}
              >
                🎉 {levelBanner}
              </div>
            </div>
          )}
          {phase === "gameover" && (
            <GameOverOverlay
              score={score}
              highScore={highScore}
              cause={gameOverCause}
              onRestart={handleRestart}
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
