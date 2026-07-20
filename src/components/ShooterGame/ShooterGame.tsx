import { useRef, useEffect, useCallback } from 'react';
import './shooter-game.css';

const CANVAS_HEIGHT = 500;
const COLOR = '#00ff88';
const BG_COLOR = '#0a0a0a';
const HIGH_SCORE_KEY = 'shooter-high-score';

const PLAYER_SPEED = 300;
const PLAYER_SPEED_BOOST = 480;
const BULLET_SPEED = 500;
const BULLET_WIDTH = 2;
const BULLET_HEIGHT = 8;
const FIRE_RATE = 0.12; // seconds between shots
const MAX_HP = 3;
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_FALL_SPEED = 120;
const POWERUP_SIZE = 16;

const ENEMY_BASE_SPEED = 100;
const ENEMY_SPEED_INCREMENT = 8; // per second of play

enum GameState {
  IDLE,
  PLAYING,
  GAME_OVER,
}

type EnemyType = 'basic' | 'zigzag' | 'tank';

interface Star {
  x: number;
  y: number;
  speed: number;
  brightness: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  fireTimer: number;
  flameFrame: number;
  flameTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // 0 = straight up
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  time: number; // for zigzag sine wave
  startX: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'spread' | 'speed';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface ActiveEffect {
  type: 'spread' | 'speed';
  remaining: number;
}

export default function ShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(GameState.IDLE);
  const playerRef = useRef<Player>({
    x: 0,
    y: CANVAS_HEIGHT - 50,
    width: 24,
    height: 28,
    hp: MAX_HP,
    fireTimer: 0,
    flameFrame: 0,
    flameTimer: 0,
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const effectsRef = useRef<ActiveEffect[]>([]);
  const starsRef = useRef<Star[]>([]);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameTimeRef = useRef(0);
  const waveRef = useRef(1);
  const waveTextTimerRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseXRef = useRef<number | null>(null);
  const touchActiveRef = useRef(false);
  const useMouseRef = useRef(false);

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

  const initStars = useCallback((w: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 20 + Math.random() * 80,
        brightness: 0.2 + Math.random() * 0.6,
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnExplosion = useCallback((x: number, y: number) => {
    const count = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 120;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        size: 2 + Math.random() * 2,
      });
    }
  }, []);

  const spawnEnemy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const score = scoreRef.current;
    let type: EnemyType = 'basic';

    if (score >= 1000 && Math.random() < 0.3) {
      type = 'tank';
    } else if (score >= 500 && Math.random() < 0.4) {
      type = 'zigzag';
    }

    let width = 18;
    let height = 18;
    let hp = 1;
    let speed = 0;

    if (type === 'basic') {
      width = 18;
      height = 18;
      hp = 1;
      speed = ENEMY_BASE_SPEED + gameTimeRef.current * ENEMY_SPEED_INCREMENT;
    } else if (type === 'zigzag') {
      width = 16;
      height = 16;
      hp = 1;
      speed = ENEMY_BASE_SPEED * 0.8 + gameTimeRef.current * ENEMY_SPEED_INCREMENT * 0.8;
    } else {
      width = 28;
      height = 24;
      hp = 3;
      speed = ENEMY_BASE_SPEED * 0.5 + gameTimeRef.current * ENEMY_SPEED_INCREMENT * 0.5;
    }

    const x = width / 2 + Math.random() * (w - width);
    enemiesRef.current.push({
      x,
      y: -height,
      width,
      height,
      type,
      hp,
      maxHp: hp,
      time: 0,
      startX: x,
    });
  }, []);

  const spawnPowerUp = useCallback((x: number, y: number) => {
    const r = Math.random();
    let type: PowerUp['type'] = 'health';
    if (r < 0.4) {
      type = 'spread';
    } else if (r < 0.7) {
      type = 'speed';
    }
    powerUpsRef.current.push({ x, y, type });
  }, []);

  const fireBullet = useCallback(() => {
    const p = playerRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hasSpread = effectsRef.current.some((e) => e.type === 'spread');

    const addBullet = (angle: number) => {
      bulletsRef.current.push({
        x: p.x - BULLET_WIDTH / 2,
        y: p.y - p.height / 2 - BULLET_HEIGHT / 2,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        angle,
      });
    };

    addBullet(0);
    if (hasSpread) {
      addBullet(-0.15);
      addBullet(0.15);
    }
  }, []);

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
    for (const star of starsRef.current) {
      star.y += star.speed * dt;
      if (star.y > CANVAS_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * (canvasRef.current?.width || 800);
      }
      ctx.globalAlpha = star.brightness;
      ctx.fillStyle = COLOR;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
    }
    ctx.globalAlpha = 1;
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    const x = Math.floor(p.x - p.width / 2);
    const y = Math.floor(p.y - p.height / 2);

    // Thruster flame (animated)
    p.flameTimer += 0.1;
    if (p.flameTimer > 0.08) {
      p.flameFrame = (p.flameFrame + 1) % 3;
      p.flameTimer = 0;
    }

    // Flame
    const flameOffset = p.flameFrame === 0 ? 4 : p.flameFrame === 1 ? 6 : 3;
    const flameWidth = p.flameFrame === 1 ? 4 : 3;
    ctx.fillStyle = COLOR;
    ctx.fillRect(x + p.width / 2 - flameWidth / 2, y + p.height, flameWidth, flameOffset);
    // Dimmer inner flame
    ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
    ctx.fillRect(x + p.width / 2 - 1, y + p.height, 2, flameOffset - 1);

    // Ship body - triangle pointing up
    ctx.fillStyle = COLOR;
    // Nose
    ctx.fillRect(x + p.width / 2 - 1, y, 3, 6);
    // Body top
    ctx.fillRect(x + p.width / 2 - 3, y + 5, 7, 4);
    // Body mid
    ctx.fillRect(x + p.width / 2 - 5, y + 8, 11, 6);
    // Body bottom
    ctx.fillRect(x + p.width / 2 - 4, y + 13, 9, 5);
    // Wings left
    ctx.fillRect(x, y + 12, 6, 4);
    ctx.fillRect(x + 1, y + 10, 4, 3);
    // Wings right
    ctx.fillRect(x + p.width - 6, y + 12, 6, 4);
    ctx.fillRect(x + p.width - 5, y + 10, 4, 3);
    // Cockpit (darker)
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(x + p.width / 2 - 1, y + 6, 3, 4);
    // Cockpit glow
    ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.fillRect(x + p.width / 2, y + 7, 1, 2);
  }, []);

  const drawBullet = useCallback((ctx: CanvasRenderingContext2D, bullet: Bullet) => {
    ctx.fillStyle = COLOR;
    if (bullet.angle === 0) {
      ctx.fillRect(
        Math.floor(bullet.x),
        Math.floor(bullet.y - bullet.height / 2),
        bullet.width,
        bullet.height
      );
    } else {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(bullet.angle);
      ctx.fillRect(0, -bullet.height / 2, bullet.width, bullet.height);
      ctx.restore();
    }
  }, []);

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    ctx.fillStyle = COLOR;
    const x = Math.floor(enemy.x - enemy.width / 2);
    const y = Math.floor(enemy.y - enemy.height / 2);
    const w = enemy.width;
    const h = enemy.height;

    if (enemy.type === 'basic') {
      // Square with X pattern
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(x + 2, y + 2, 3, 3);
      ctx.fillRect(x + w - 5, y + 2, 3, 3);
      ctx.fillRect(x + 2, y + h - 5, 3, 3);
      ctx.fillRect(x + w - 5, y + h - 5, 3, 3);
      // X cross
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(x + 5, y + 5, w - 10, 2);
      ctx.fillRect(x + w - 7, y + 3, 2, w - 6);
    } else if (enemy.type === 'zigzag') {
      // Diamond shape
      const cx = x + w / 2;
      const cy = y + h / 2;
      const hw = w / 2;
      const hh = h / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx + hw, cy);
      ctx.lineTo(cx, cy + hh);
      ctx.lineTo(cx - hw, cy);
      ctx.closePath();
      ctx.fill();
      // Inner diamond
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    } else {
      // Tank - larger rectangle with border
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = COLOR;
      // Border lines
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y + h - 2, w, 2);
      ctx.fillRect(x, y, 2, h);
      ctx.fillRect(x + w - 2, y, 2, h);
      // HP indicator lines
      for (let i = 0; i < enemy.hp; i++) {
        ctx.fillRect(x + 4 + i * 4, y + h / 2 - 1, 3, 2);
      }
    }
  }, []);

  const drawPowerUp = useCallback((ctx: CanvasRenderingContext2D, pu: PowerUp) => {
    const x = Math.floor(pu.x - POWERUP_SIZE / 2);
    const y = Math.floor(pu.y - POWERUP_SIZE / 2);

    // Background box
    ctx.fillStyle = COLOR;
    ctx.fillRect(x, y, POWERUP_SIZE, POWERUP_SIZE);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(x + 1, y + 1, POWERUP_SIZE - 2, POWERUP_SIZE - 2);

    // Label
    ctx.fillStyle = COLOR;
    ctx.font = '10px "JetBrains Mono", "Fira Code", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (pu.type === 'health') {
      ctx.fillText('+', pu.x, pu.y + 1);
    } else if (pu.type === 'spread') {
      ctx.fillText('S', pu.x, pu.y + 1);
    } else {
      ctx.font = '7px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillText('>>', pu.x, pu.y + 1);
    }
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = COLOR;
    for (const p of particlesRef.current) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }, []);

  const drawHP = useCallback((ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    const barWidth = 20;
    const barHeight = 4;
    const gap = 6;
    const startX = 12;
    const startY = 14;

    for (let i = 0; i < MAX_HP; i++) {
      const x = startX + i * (barWidth + gap);
      // Background
      ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.fillRect(x, startY, barWidth, barHeight);
      // Filled
      if (i < p.hp) {
        ctx.fillStyle = COLOR;
        ctx.fillRect(x, startY, barWidth, barHeight);
      }
    }
  }, []);

  const drawScore = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    const score = scoreRef.current;
    const highScore = highScoreRef.current;
    ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `SCORE: ${String(score).padStart(5, '0')}  HI: ${String(highScore).padStart(5, '0')}`,
      canvasWidth - 12,
      12
    );
  }, []);

  const drawWaveText = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    if (waveTextTimerRef.current > 0) {
      const alpha = Math.min(1, waveTextTimerRef.current / 0.5);
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 24px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`WAVE ${waveRef.current}`, canvasWidth / 2, CANVAS_HEIGHT / 3);
      ctx.globalAlpha = 1;
    }
  }, []);

  const drawMessage = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    ctx.font = '16px "JetBrains Mono", "Fira Code", Consolas, monospace';
    ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (stateRef.current === GameState.IDLE) {
      ctx.fillText('TERMINAL DEFENDER', canvasWidth / 2, CANVAS_HEIGHT / 2 - 40);
      ctx.font = '13px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.fillText('PRESS SPACE TO START', canvasWidth / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('OR TAP TO BEGIN', canvasWidth / 2, CANVAS_HEIGHT / 2 + 22);
    } else if (stateRef.current === GameState.GAME_OVER) {
      ctx.fillText('GAME OVER', canvasWidth / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = '13px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.fillText(`SCORE: ${String(scoreRef.current).padStart(5, '0')}`, canvasWidth / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('PRESS SPACE TO RESTART', canvasWidth / 2, CANVAS_HEIGHT / 2 + 22);
    }
  }, []);

  const drawEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const eff of effectsRef.current) {
      ctx.font = '10px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const label = eff.type === 'spread' ? 'SPREAD' : 'SPEED';
      const time = eff.remaining.toFixed(1) + 's';
      ctx.fillText(`${label} ${time}`, 12, 28);
    }
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    const p = playerRef.current;
    p.x = canvas ? canvas.width / 2 : 400;
    p.y = CANVAS_HEIGHT - 50;
    p.hp = MAX_HP;
    p.fireTimer = 0;
    p.flameFrame = 0;
    p.flameTimer = 0;
    bulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    effectsRef.current = [];
    scoreRef.current = 0;
    lastTimeRef.current = 0;
    spawnTimerRef.current = 0;
    gameTimeRef.current = 0;
    waveRef.current = 1;
    waveTextTimerRef.current = 0;
    highScoreRef.current = getHighScore();
  }, [getHighScore]);

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
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // Draw stars
      drawStars(ctx, dt);

      const p = playerRef.current;

      if (stateRef.current === GameState.PLAYING) {
        gameTimeRef.current += dt;

        // --- Player movement ---
        const hasSpeed = effectsRef.current.some((e) => e.type === 'speed');
        const currentSpeed = hasSpeed ? PLAYER_SPEED_BOOST : PLAYER_SPEED;
        const keys = keysRef.current;

        if (useMouseRef.current && mouseXRef.current !== null) {
          // Smooth follow mouse
          const diff = mouseXRef.current - p.x;
          const moveAmt = Math.min(Math.abs(diff), currentSpeed * dt * 2);
          p.x += Math.sign(diff) * moveAmt;
        }

        if (keys.has('ArrowLeft') || keys.has('KeyA')) {
          p.x -= currentSpeed * dt;
          useMouseRef.current = false;
        }
        if (keys.has('ArrowRight') || keys.has('KeyD')) {
          p.x += currentSpeed * dt;
          useMouseRef.current = false;
        }

        // Clamp
        p.x = Math.max(p.width / 2, Math.min(w - p.width / 2, p.x));

        // --- Firing ---
        p.fireTimer -= dt;
        const wantFire = keys.has('Space') || touchActiveRef.current;
        if (wantFire && p.fireTimer <= 0) {
          fireBullet();
          p.fireTimer = FIRE_RATE;
        }

        // --- Update bullets ---
        for (const bullet of bulletsRef.current) {
          bullet.y -= BULLET_SPEED * dt;
          if (bullet.angle !== 0) {
            bullet.x += Math.sin(bullet.angle) * BULLET_SPEED * dt;
          }
        }
        bulletsRef.current = bulletsRef.current.filter((b) => b.y + b.height / 2 > 0);

        // --- Spawn enemies ---
        spawnTimerRef.current -= dt;
        const baseInterval = Math.max(0.3, 1.2 - gameTimeRef.current * 0.01);
        if (spawnTimerRef.current <= 0) {
          spawnEnemy();
          spawnTimerRef.current = baseInterval + Math.random() * 0.4;
        }

        // --- Update enemies ---
        const enemySpeed = ENEMY_BASE_SPEED + gameTimeRef.current * ENEMY_SPEED_INCREMENT;
        for (const enemy of enemiesRef.current) {
          enemy.time += dt;
          if (enemy.type === 'zigzag') {
            enemy.x = enemy.startX + Math.sin(enemy.time * 3) * 60;
          }
          enemy.y += enemySpeed * (enemy.type === 'tank' ? 0.5 : enemy.type === 'zigzag' ? 0.8 : 1) * dt;
        }
        enemiesRef.current = enemiesRef.current.filter((e) => e.y - e.height / 2 < CANVAS_HEIGHT + 20);

        // --- Bullet-Enemy collisions ---
        const bulletsToRemove = new Set<number>();
        const enemiesToRemove = new Set<number>();
        for (let bi = 0; bi < bulletsRef.current.length; bi++) {
          const b = bulletsRef.current[bi];
          for (let ei = 0; ei < enemiesRef.current.length; ei++) {
            if (enemiesToRemove.has(ei)) continue;
            const e = enemiesRef.current[ei];
            // Simple AABB
            if (
              b.x - b.width / 2 < e.x + e.width / 2 &&
              b.x + b.width / 2 > e.x - e.width / 2 &&
              b.y - b.height / 2 < e.y + e.height / 2 &&
              b.y + b.height / 2 > e.y - e.height / 2
            ) {
              bulletsToRemove.add(bi);
              e.hp--;
              if (e.hp <= 0) {
                enemiesToRemove.add(ei);
                spawnExplosion(e.x, e.y);
                // Score
                if (e.type === 'basic') scoreRef.current += 10;
                else if (e.type === 'zigzag') scoreRef.current += 20;
                else scoreRef.current += 30;
                // Wave check
                const newWave = Math.floor(scoreRef.current / 1000) + 1;
                if (newWave > waveRef.current) {
                  waveRef.current = newWave;
                  waveTextTimerRef.current = 2;
                }
                // Power-up drop
                if (Math.random() < POWERUP_DROP_CHANCE) {
                  spawnPowerUp(e.x, e.y);
                }
              }
              break;
            }
          }
        }
        bulletsRef.current = bulletsRef.current.filter((_, i) => !bulletsToRemove.has(i));
        enemiesRef.current = enemiesRef.current.filter((_, i) => !enemiesToRemove.has(i));

        // --- Player-Enemy collision ---
        for (let ei = enemiesRef.current.length - 1; ei >= 0; ei--) {
          const e = enemiesRef.current[ei];
          if (
            p.x - p.width / 2 < e.x + e.width / 2 &&
            p.x + p.width / 2 > e.x - e.width / 2 &&
            p.y - p.height / 2 < e.y + e.height / 2 &&
            p.y + p.height / 2 > e.y - e.height / 2
          ) {
            p.hp--;
            spawnExplosion(e.x, e.y);
            enemiesRef.current.splice(ei, 1);
            if (p.hp <= 0) {
              stateRef.current = GameState.GAME_OVER;
              const finalScore = scoreRef.current;
              if (finalScore > highScoreRef.current) {
                highScoreRef.current = finalScore;
                saveHighScore(finalScore);
              }
            }
            break;
          }
        }

        // --- Power-up update ---
        for (const pu of powerUpsRef.current) {
          pu.y += POWERUP_FALL_SPEED * dt;
        }

        // --- Player-PowerUp collision ---
        powerUpsRef.current = powerUpsRef.current.filter((pu) => {
          if (
            p.x - p.width / 2 < pu.x + POWERUP_SIZE / 2 &&
            p.x + p.width / 2 > pu.x - POWERUP_SIZE / 2 &&
            p.y - p.height / 2 < pu.y + POWERUP_SIZE / 2 &&
            p.y + p.height / 2 > pu.y - POWERUP_SIZE / 2
          ) {
            if (pu.type === 'health') {
              p.hp = Math.min(MAX_HP, p.hp + 1);
            } else {
              // Remove existing effect of same type, then add new
              effectsRef.current = effectsRef.current.filter((e) => e.type !== pu.type);
              effectsRef.current.push({ type: pu.type, remaining: POWERUP_DURATION });
            }
            return false;
          }
          return pu.y - POWERUP_SIZE / 2 < CANVAS_HEIGHT + 20;
        });

        // --- Update effects ---
        for (const eff of effectsRef.current) {
          eff.remaining -= dt;
        }
        effectsRef.current = effectsRef.current.filter((e) => e.remaining > 0);

        // --- Update particles ---
        for (const pt of particlesRef.current) {
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.life -= dt;
        }
        particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);

        // --- Wave text timer ---
        if (waveTextTimerRef.current > 0) {
          waveTextTimerRef.current -= dt;
        }
      }

      // --- Draw everything ---
      // Enemies
      for (const enemy of enemiesRef.current) {
        drawEnemy(ctx, enemy);
      }

      // Bullets
      for (const bullet of bulletsRef.current) {
        drawBullet(ctx, bullet);
      }

      // Power-ups
      for (const pu of powerUpsRef.current) {
        drawPowerUp(ctx, pu);
      }

      // Particles
      drawParticles(ctx);

      // Player
      if (stateRef.current === GameState.PLAYING || stateRef.current === GameState.GAME_OVER) {
        drawPlayer(ctx);
      }

      // HP
      if (stateRef.current === GameState.PLAYING) {
        drawHP(ctx);
      }

      // Score
      drawScore(ctx, w);

      // Wave text
      drawWaveText(ctx, w);

      // Active effects
      drawEffects(ctx);

      // Messages
      if (stateRef.current !== GameState.PLAYING) {
        drawMessage(ctx, w);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [
      drawStars,
      drawPlayer,
      drawBullet,
      drawEnemy,
      drawPowerUp,
      drawParticles,
      drawHP,
      drawScore,
      drawWaveText,
      drawMessage,
      drawEffects,
      spawnEnemy,
      spawnPowerUp,
      spawnExplosion,
      fireBullet,
      saveHighScore,
    ]
  );

  const startGame = useCallback(() => {
    resetGame();
    stateRef.current = GameState.PLAYING;
  }, [resetGame]);

  useEffect(() => {
    highScoreRef.current = getHighScore();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = CANVAS_HEIGHT;
        initStars(canvas.width);
        // Re-center player if needed
        if (stateRef.current === GameState.IDLE) {
          playerRef.current.x = canvas.width / 2;
        }
      }
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        if (stateRef.current === GameState.IDLE || stateRef.current === GameState.GAME_OVER) {
          startGame();
        }
      }
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      mouseXRef.current = (e.clientX - rect.left) * scaleX;
      if (stateRef.current === GameState.PLAYING) {
        useMouseRef.current = true;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (stateRef.current === GameState.IDLE || stateRef.current === GameState.GAME_OVER) {
        startGame();
        return;
      }
      touchActiveRef.current = true;
      handleTouchMove(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (stateRef.current !== GameState.PLAYING) return;
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      mouseXRef.current = (touch.clientX - rect.left) * scaleX;
      useMouseRef.current = true;
    };

    const handleTouchEnd = () => {
      touchActiveRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [getHighScore, gameLoop, startGame, initStars]);

  return (
    <div className="shooter-game-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} className="shooter-game-canvas" />
    </div>
  );
}