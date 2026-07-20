import { useRef, useEffect, useCallback } from 'react';
import './surf-game.css';

const CANVAS_HEIGHT = 400;
const INITIAL_SPEED = 200;
const MAX_SPEED = 600;
const SPEED_INCREMENT = 0.15;
const LANE_SWITCH_SPEED = 7; // multiplier for smooth animation (~0.15s)
const INVINCIBLE_DURATION = 2; // seconds
const BOOSTER_POINTS = 500;
const PLAYER_SIZE = 30;
const OBSTACLE_MIN_W = 36;
const OBSTACLE_MAX_W = 52;
const OBSTACLE_MIN_H = 36;
const OBSTACLE_MAX_H = 56;
const BOOSTER_SIZE = 20;
const MILESTONE_INTERVAL = 1000;
const ROAD_MARGIN = 40; // left/right road edge margin

enum GameState {
  IDLE,
  PLAYING,
  GAME_OVER,
}

interface Player {
  lane: number; // 0=left, 1=center, 2=right
  x: number; // actual x position (smoothly interpolated)
  y: number; // fixed y near top
  width: number;
  height: number;
  invincible: boolean;
  invincibleTimer: number;
  flashTimer: number;
}

interface Obstacle {
  lane: number;
  x: number; // actual x position (center of lane)
  y: number;
  width: number;
  height: number;
}

interface Booster {
  lane: number;
  x: number;
  y: number;
  size: number;
  collected: boolean;
}

interface BinaryDigit {
  x: number;
  y: number;
  char: string;
  opacity: number;
  speed: number;
}

const HIGH_SCORE_KEY = 'surf-high-score';

export default function SurfGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(GameState.IDLE);
  const playerRef = useRef<Player>({
    lane: 1,
    x: 0,
    y: 50,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    invincible: false,
    invincibleTimer: 0,
    flashTimer: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const boostersRef = useRef<Booster[]>([]);
  const binaryDigitsRef = useRef<BinaryDigit[]>([]);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const boosterTimerRef = useRef(0);
  const dashOffsetRef = useRef(0);
  const milestoneFlashRef = useRef(0);
  const milestoneTriggeredRef = useRef(0);
  const laneWidthRef = useRef(80);
  const roadLeftRef = useRef(0);
  const touchStartXRef = useRef(0);

  // --- Helper: get lane center x ---
  const getLaneX = useCallback((lane: number): number => {
    return roadLeftRef.current + laneWidthRef.current * lane + laneWidthRef.current / 2;
  }, []);

  // --- Helper: format score as MB ---
  const formatMB = useCallback((score: number): string => {
    return (score / 100).toFixed(1);
  }, []);

  const getHighScore = useCallback(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  }, []);

  const saveHighScore = useCallback((score: number) => {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    } catch {
      // ignore
    }
  }, []);

  // --- Draw surfboard + rider ---
  const drawSurfer = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const color = '#00ff88';
      const dark = '#00cc66';

      // === Surfboard (elongated oval below the rider) ===
      const boardW = size * 0.95;
      const boardH = size * 0.28;
      const boardY = y + size * 0.22;

      // Board shadow
      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.beginPath();
      ctx.ellipse(x, boardY + 2, boardW / 2 + 1, boardH / 2 + 1, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Board body
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(x, boardY, boardW / 2, boardH / 2, -0.05, 0, Math.PI * 2);
      ctx.fill();

      // Board stripe (center line)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - boardW * 0.35, boardY);
      ctx.lineTo(x + boardW * 0.35, boardY);
      ctx.stroke();

      // Board fin (small triangle at back)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + boardW * 0.38, boardY);
      ctx.lineTo(x + boardW * 0.48, boardY + boardH * 0.6);
      ctx.lineTo(x + boardW * 0.42, boardY + boardH * 0.3);
      ctx.closePath();
      ctx.fill();

      // === Rider (simplified person on board) ===
      // Head
      const headR = size * 0.12;
      const headY = y - size * 0.22;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, headY, headR, 0, Math.PI * 2);
      ctx.fill();

      // Body (line from head down to board)
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, headY + headR);
      ctx.lineTo(x, boardY - boardH * 0.2);
      ctx.stroke();

      // Arms (spread out for balance, slightly angled)
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, headY + headR + size * 0.1);
      ctx.lineTo(x - size * 0.2, headY + headR + size * 0.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, headY + headR + size * 0.1);
      ctx.lineTo(x + size * 0.15, headY + headR + size * 0.3);
      ctx.stroke();

      // Legs (bent, crouching stance on board)
      ctx.lineWidth = 1.5;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(x, boardY - boardH * 0.2);
      ctx.lineTo(x - size * 0.12, boardY - boardH * 0.5);
      ctx.lineTo(x - size * 0.08, boardY);
      ctx.stroke();
      // Right leg
      ctx.beginPath();
      ctx.moveTo(x, boardY - boardH * 0.2);
      ctx.lineTo(x + size * 0.1, boardY - boardH * 0.5);
      ctx.lineTo(x + size * 0.12, boardY);
      ctx.stroke();

      // === Spray/wake effects behind the board ===
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
      ctx.lineWidth = 1;
      // Left spray
      ctx.beginPath();
      ctx.moveTo(x - boardW * 0.3, boardY + boardH * 0.3);
      ctx.lineTo(x - boardW * 0.4, boardY + boardH * 0.8);
      ctx.lineTo(x - boardW * 0.35, boardY + boardH * 1.2);
      ctx.stroke();
      // Right spray
      ctx.beginPath();
      ctx.moveTo(x + boardW * 0.35, boardY + boardH * 0.3);
      ctx.lineTo(x + boardW * 0.45, boardY + boardH * 0.7);
      ctx.lineTo(x + boardW * 0.42, boardY + boardH * 1.1);
      ctx.stroke();
    },
    []
  );

  // --- Draw obstacle (firewall block) ---
  const drawObstacle = useCallback(
    (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const { x, y, width, height } = obs;
      const left = x - width / 2;
      const top = y - height / 2;

      // Block body
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(left, top, width, height);

      // Inner darker rect
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(left + 3, top + 3, width - 6, height - 6);

      // X pattern
      ctx.strokeStyle = '#ff6644';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left + 4, top + 4);
      ctx.lineTo(left + width - 4, top + height - 4);
      ctx.moveTo(left + width - 4, top + 4);
      ctx.lineTo(left + 4, top + height - 4);
      ctx.stroke();

      // Border
      ctx.strokeStyle = '#ff6644';
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, width, height);
    },
    []
  );

  // --- Draw signal booster (green diamond with +) ---
  const drawBooster = useCallback(
    (ctx: CanvasRenderingContext2D, b: Booster) => {
      const { x, y, size } = b;

      // Diamond shape
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();

      // Inner diamond
      ctx.fillStyle = '#00cc66';
      const inner = size * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y - inner);
      ctx.lineTo(x + inner, y);
      ctx.lineTo(x, y + inner);
      ctx.lineTo(x - inner, y);
      ctx.closePath();
      ctx.fill();

      // Plus sign
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.35, y);
      ctx.lineTo(x + size * 0.35, y);
      ctx.moveTo(x, y - size * 0.35);
      ctx.lineTo(x, y + size * 0.35);
      ctx.stroke();
    },
    []
  );

  // --- Draw road (3 lanes with dashed lines, solid edges) ---
  const drawRoad = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
      const rl = roadLeftRef.current;
      const lw = laneWidthRef.current;
      const roadWidth = lw * 3;

      // Road edge lines (solid)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rl, 0);
      ctx.lineTo(rl, canvasHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rl + roadWidth, 0);
      ctx.lineTo(rl + roadWidth, canvasHeight);
      ctx.stroke();

      // Lane dividers (dashed)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -dashOffsetRef.current;

      for (let i = 1; i < 3; i++) {
        const lx = rl + lw * i;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvasHeight);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    },
    []
  );

  // --- Draw background binary digits ---
  const drawBinaryBackground = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.font = '12px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.textAlign = 'center';
      for (const digit of binaryDigitsRef.current) {
        ctx.fillStyle = `rgba(0, 255, 136, ${digit.opacity})`;
        ctx.fillText(digit.char, digit.x, digit.y);
      }
    },
    []
  );

  // --- Draw player ---
  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: Player) => {
      // Flash when invincible
      if (player.invincible) {
        player.flashTimer += 0.15;
        if (Math.floor(player.flashTimer * 10) % 2 === 0) {
          return; // skip drawing every other frame for flash effect
        }
      }

      const px = player.x;
      const py = player.y;

      // Glow effect
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      drawSurfer(ctx, px, py, PLAYER_SIZE);
      ctx.shadowBlur = 0;
    },
    [drawSurfer]
  );

  // --- Draw score and HUD ---
  const drawHUD = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
      ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.textAlign = 'center';

      // Score
      ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
      const scoreText = `${formatMB(scoreRef.current)} MB`;
      ctx.fillText(scoreText, canvasWidth / 2, 20);

      // High score
      if (highScoreRef.current > 0) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.fillText(
          `HI ${formatMB(highScoreRef.current)} MB`,
          canvasWidth / 2,
          36
        );
      }

      // Speed indicator (bottom-right corner)
      ctx.font = '11px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
      const mhz = Math.floor(speedRef.current * 1000);
      ctx.fillText(`${mhz} MHz`, canvasWidth - 10, canvasRef.current ? canvasRef.current.height - 8 : CANVAS_HEIGHT - 8);

      // Milestone flash
      if (milestoneFlashRef.current > 0) {
        ctx.font = '18px "JetBrains Mono", "Fira Code", Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(0, 255, 136, ${milestoneFlashRef.current})`;
        ctx.fillText('+1 MB', canvasWidth / 2, CANVAS_HEIGHT / 2 - 20);
      }
    },
    [formatMB]
  );

  // --- Draw messages ---
  const drawMessage = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
      ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.textAlign = 'center';

      if (stateRef.current === GameState.IDLE) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.fillText('PRESS SPACE TO START', canvasWidth / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.font = '11px "JetBrains Mono", "Fira Code", Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 255, 136, 0.35)';
        ctx.fillText('<- / A  LEFT    RIGHT  -> / D', canvasWidth / 2, CANVAS_HEIGHT / 2);
      } else if (stateRef.current === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
        ctx.fillText('CONNECTION LOST', canvasWidth / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = '12px "JetBrains Mono", "Fira Code", Consolas, monospace';
        ctx.fillText(`SCORE: ${formatMB(scoreRef.current)} MB`, canvasWidth / 2, CANVAS_HEIGHT / 2 - 25);
        ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
        ctx.fillText('PRESS SPACE TO RECONNECT', canvasWidth / 2, CANVAS_HEIGHT / 2 + 10);
      }
    },
    [formatMB]
  );

  // --- Spawn obstacle ---
  const spawnObstacle = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const w = OBSTACLE_MIN_W + Math.random() * (OBSTACLE_MAX_W - OBSTACLE_MIN_W);
    const h = OBSTACLE_MIN_H + Math.random() * (OBSTACLE_MAX_H - OBSTACLE_MIN_H);
    const x = getLaneX(lane);
    obstaclesRef.current.push({
      lane,
      x,
      y: CANVAS_HEIGHT + h / 2,
      width: w,
      height: h,
    });
  }, [getLaneX]);

  // --- Spawn booster ---
  const spawnBooster = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const x = getLaneX(lane);
    boostersRef.current.push({
      lane,
      x,
      y: CANVAS_HEIGHT + BOOSTER_SIZE,
      size: BOOSTER_SIZE,
      collected: false,
    });
  }, [getLaneX]);

  // --- Spawn binary digit ---
  const spawnBinaryDigit = useCallback((canvasWidth: number) => {
    if (binaryDigitsRef.current.length < 30) {
      binaryDigitsRef.current.push({
        x: Math.random() * canvasWidth,
        y: -10,
        char: Math.random() > 0.5 ? '1' : '0',
        opacity: 0.03 + Math.random() * 0.06,
        speed: 20 + Math.random() * 40,
      });
    }
  }, []);

  // --- Check collision ---
  const checkCollision = useCallback((player: Player, obs: Obstacle): boolean => {
    const px = player.x - player.width / 2 + 4;
    const py = player.y - player.height / 2 + 4;
    const pw = player.width - 8;
    const ph = player.height - 8;

    const ox = obs.x - obs.width / 2 + 2;
    const oy = obs.y - obs.height / 2 + 2;
    const ow = obs.width - 4;
    const oh = obs.height - 4;

    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
  }, []);

  // --- Check booster collection ---
  const checkBooster = useCallback((player: Player, b: Booster): boolean => {
    const px = player.x - player.width / 2;
    const py = player.y - player.height / 2;
    const pw = player.width;
    const ph = player.height;

    const bx = b.x - b.size;
    const by = b.y - b.size;
    const bw = b.size * 2;
    const bh = b.size * 2;

    return px < bx + bw && px + pw > bx && py < by + bh && py + ph > by;
  }, []);

  // --- Reset game ---
  const resetGame = useCallback(() => {
    const player = playerRef.current;
    player.lane = 1;
    player.x = getLaneX(1);
    player.invincible = false;
    player.invincibleTimer = 0;
    player.flashTimer = 0;
    obstaclesRef.current = [];
    boostersRef.current = [];
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    obstacleTimerRef.current = 0;
    boosterTimerRef.current = 0;
    milestoneFlashRef.current = 0;
    milestoneTriggeredRef.current = 0;
    highScoreRef.current = getHighScore();
  }, [getLaneX, getHighScore]);

  // --- Move player to lane ---
  const movePlayerToLane = useCallback(
    (dir: -1 | 1) => {
      if (stateRef.current !== GameState.PLAYING) return;
      const player = playerRef.current;
      const newLane = player.lane + dir;
      if (newLane >= 0 && newLane <= 2) {
        player.lane = newLane;
      }
    },
    []
  );

  // --- Main game loop ---
  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const w = canvas.width;
      const h = canvas.height;

      // Clear
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      // Update road layout
      const roadWidth = w - ROAD_MARGIN * 2;
      laneWidthRef.current = roadWidth / 3;
      roadLeftRef.current = ROAD_MARGIN;

      // Update binary background
      for (const digit of binaryDigitsRef.current) {
        digit.y += digit.speed * dt;
      }
      binaryDigitsRef.current = binaryDigitsRef.current.filter((d) => d.y < h + 10);
      if (Math.random() < 0.08) {
        spawnBinaryDigit(w);
      }

      // Draw binary background (behind road)
      drawBinaryBackground(ctx);

      // Update dash offset for scrolling road lines
      if (stateRef.current === GameState.PLAYING) {
        dashOffsetRef.current += speedRef.current * dt;
        if (dashOffsetRef.current > 20) dashOffsetRef.current -= 20;
      }

      // Draw road
      drawRoad(ctx, w, h);

      if (stateRef.current === GameState.PLAYING) {
        const player = playerRef.current;

        // Update speed
        speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT * dt * 60);

        // Update score (distance based on speed)
        scoreRef.current += speedRef.current * dt * 0.05;

        // Milestone check
        const currentMilestone = Math.floor(scoreRef.current / MILESTONE_INTERVAL);
        if (currentMilestone > milestoneTriggeredRef.current) {
          milestoneTriggeredRef.current = currentMilestone;
          milestoneFlashRef.current = 1.0;
        }

        // Milestone flash fade
        if (milestoneFlashRef.current > 0) {
          milestoneFlashRef.current -= dt * 1.5;
          if (milestoneFlashRef.current < 0) milestoneFlashRef.current = 0;
        }

        // Smooth lane movement
        const targetX = getLaneX(player.lane);
        const dx = targetX - player.x;
        if (Math.abs(dx) > 0.5) {
          player.x += dx * Math.min(1, LANE_SWITCH_SPEED * dt * 60 / 10);
        } else {
          player.x = targetX;
        }

        // Invincibility timer
        if (player.invincible) {
          player.invincibleTimer -= dt;
          if (player.invincibleTimer <= 0) {
            player.invincible = false;
            player.invincibleTimer = 0;
          }
        }

        // Spawn obstacles
        obstacleTimerRef.current += dt;
        const minInterval = Math.max(0.4, 1.2 - (speedRef.current - INITIAL_SPEED) / 500);
        if (obstacleTimerRef.current > minInterval + Math.random() * 0.3) {
          spawnObstacle();
          obstacleTimerRef.current = 0;
        }

        // Spawn boosters (less frequent)
        boosterTimerRef.current += dt;
        if (boosterTimerRef.current > 3 + Math.random() * 2) {
          spawnBooster();
          boosterTimerRef.current = 0;
        }

        // Update obstacles (scroll up)
        for (const obs of obstaclesRef.current) {
          obs.y -= speedRef.current * dt;
          obs.x = getLaneX(obs.lane); // keep aligned with lane
        }
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.y + o.height / 2 > -20);

        // Update boosters (scroll up)
        for (const b of boostersRef.current) {
          b.y -= speedRef.current * dt;
          b.x = getLaneX(b.lane);
        }
        boostersRef.current = boostersRef.current.filter((b) => !b.collected && b.y + b.size > -20);

        // Collision detection
        if (!player.invincible) {
          for (const obs of obstaclesRef.current) {
            if (checkCollision(player, obs)) {
              stateRef.current = GameState.GAME_OVER;
              const finalScore = Math.floor(scoreRef.current);
              if (finalScore > highScoreRef.current) {
                highScoreRef.current = finalScore;
                saveHighScore(finalScore);
              }
              break;
            }
          }
        }

        // Booster collection
        for (const b of boostersRef.current) {
          if (!b.collected && checkBooster(player, b)) {
            b.collected = true;
            scoreRef.current += BOOSTER_POINTS;
            player.invincible = true;
            player.invincibleTimer = INVINCIBLE_DURATION;
            player.flashTimer = 0;
          }
        }
      }

      // Draw obstacles
      for (const obs of obstaclesRef.current) {
        drawObstacle(ctx, obs);
      }

      // Draw boosters
      for (const b of boostersRef.current) {
        if (!b.collected) {
          drawBooster(ctx, b);
        }
      }

      // Draw player
      const player = playerRef.current;
      drawPlayer(ctx, player);

      // Draw HUD
      drawHUD(ctx, w);

      // Draw messages
      if (stateRef.current !== GameState.PLAYING) {
        drawMessage(ctx, w);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [
      drawSurfer,
      drawObstacle,
      drawBooster,
      drawRoad,
      drawBinaryBackground,
      drawPlayer,
      drawHUD,
      drawMessage,
      spawnObstacle,
      spawnBooster,
      spawnBinaryDigit,
      checkCollision,
      checkBooster,
      saveHighScore,
      getLaneX,
    ]
  );

  // --- Start / Restart action ---
  const handleAction = useCallback(() => {
    if (stateRef.current === GameState.IDLE) {
      resetGame();
      // Initialize player x
      const player = playerRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const roadWidth = canvas.width - ROAD_MARGIN * 2;
        laneWidthRef.current = roadWidth / 3;
        roadLeftRef.current = ROAD_MARGIN;
        player.x = getLaneX(1);
      }
      stateRef.current = GameState.PLAYING;
    } else if (stateRef.current === GameState.GAME_OVER) {
      resetGame();
      const player = playerRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const roadWidth = canvas.width - ROAD_MARGIN * 2;
        laneWidthRef.current = roadWidth / 3;
        roadLeftRef.current = ROAD_MARGIN;
        player.x = getLaneX(1);
      }
      stateRef.current = GameState.PLAYING;
    }
  }, [resetGame, getLaneX]);

  useEffect(() => {
    highScoreRef.current = getHighScore();

    // Init binary digits
    binaryDigitsRef.current = [];
    for (let i = 0; i < 15; i++) {
      binaryDigitsRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * CANVAS_HEIGHT,
        char: Math.random() > 0.5 ? '1' : '0',
        opacity: 0.03 + Math.random() * 0.06,
        speed: 20 + Math.random() * 40,
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = CANVAS_HEIGHT;
        // Recalc lane positions
        const roadWidth = canvas.width - ROAD_MARGIN * 2;
        laneWidthRef.current = roadWidth / 3;
        roadLeftRef.current = ROAD_MARGIN;
        const player = playerRef.current;
        player.x = getLaneX(player.lane);
      }
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        movePlayerToLane(-1);
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        movePlayerToLane(1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchStartXRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(dx) < 15) {
        // Tap — treat as space
        handleAction();
      } else if (dx < 0) {
        movePlayerToLane(-1);
      } else {
        movePlayerToLane(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getHighScore, gameLoop, handleAction, movePlayerToLane, getLaneX]);

  return (
    <div className="surf-game-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} className="surf-game-canvas" />
    </div>
  );
}
