import { useRef, useEffect, useCallback } from 'react';
import './dino-game.css';

const CANVAS_HEIGHT = 200;
const GROUND_Y = 170;
const DINO_X = 50;
const GRAVITY = 1800;
const JUMP_VELOCITY = -520;
const INITIAL_SPEED = 300;
const MAX_SPEED = 800;
const SPEED_INCREMENT = 0.3;

enum GameState {
  IDLE,
  PLAYING,
  GAME_OVER,
}

interface Dino {
  y: number;
  vy: number;
  width: number;
  height: number;
  ducking: boolean;
  legFrame: number;
  legTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus-small' | 'cactus-large' | 'bird';
  birdFrame: number;
  birdTimer: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
}

const HIGH_SCORE_KEY = 'dino-game-high-score';

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(GameState.IDLE);
  const dinoRef = useRef<Dino>({
    y: GROUND_Y - 44,
    vy: 0,
    width: 44,
    height: 44,
    ducking: false,
    legFrame: 0,
    legTimer: 0,
  });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const obstacleTimerRef = useRef(0);
  const scoreTimerRef = useRef(0);
  const isNightRef = useRef(false);

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

  const drawPixelDino = useCallback(
    (ctx: CanvasRenderingContext2D, dino: Dino) => {
      const color = '#00ff88';
      ctx.fillStyle = color;
      const x = DINO_X;
      const y = dino.y;

      if (dino.ducking) {
        // Ducking dino - wider and shorter
        const h = 26;
        // body
        ctx.fillRect(x, y, 58, h);
        // head bump
        ctx.fillRect(x + 44, y - 6, 16, 10);
        // eye
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x + 52, y - 4, 3, 3);
        ctx.fillStyle = color;
        // legs
        if (dino.legFrame === 0) {
          ctx.fillRect(x + 8, y + h, 6, 8);
          ctx.fillRect(x + 22, y + h, 6, 8);
        } else {
          ctx.fillRect(x + 14, y + h, 6, 8);
          ctx.fillRect(x + 30, y + h, 6, 8);
        }
      } else {
        const h = dino.height;
        // body
        ctx.fillRect(x + 8, y, 28, h);
        // head
        ctx.fillRect(x + 4, y, 36, 20);
        // neck fill
        ctx.fillRect(x + 20, y + 16, 16, 8);
        // jaw
        ctx.fillRect(x + 16, y + 16, 28, 6);
        // eye
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(x + 28, y + 4, 4, 5);
        ctx.fillStyle = color;
        // tail
        ctx.fillRect(x, y + 4, 10, 12);
        ctx.fillRect(x - 2, y + 2, 6, 8);
        // arms
        ctx.fillRect(x + 34, y + 20, 4, 12);
        ctx.fillRect(x + 36, y + 30, 4, 4);
        // legs
        if (dino.legFrame === 0) {
          ctx.fillRect(x + 12, y + h, 8, 10);
          ctx.fillRect(x + 26, y + h, 8, 10);
        } else if (dino.legFrame === 1) {
          ctx.fillRect(x + 16, y + h, 8, 10);
          ctx.fillRect(x + 24, y + h, 8, 10);
        } else {
          ctx.fillRect(x + 10, y + h, 8, 10);
          ctx.fillRect(x + 28, y + h, 8, 10);
        }
      }
    },
    []
  );

  const drawCactus = useCallback(
    (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#00ff88';
      const { x, y, width, height, type } = obs;

      if (type === 'cactus-small') {
        // trunk
        ctx.fillRect(x + 6, y, 10, height);
        // left arm
        ctx.fillRect(x, y + 8, 8, 6);
        ctx.fillRect(x, y + 2, 6, 12);
        // right arm
        ctx.fillRect(x + 14, y + 14, 8, 6);
        ctx.fillRect(x + 16, y + 8, 6, 12);
      } else {
        // large cactus
        ctx.fillRect(x + 10, y, 14, height);
        // left arm
        ctx.fillRect(x, y + 12, 12, 8);
        ctx.fillRect(x, y + 4, 8, 16);
        // right arm
        ctx.fillRect(x + 22, y + 20, 12, 8);
        ctx.fillRect(x + 26, y + 12, 8, 16);
      }
    },
    []
  );

  const drawBird = useCallback(
    (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#00ff88';
      const { x, y } = obs;
      // body
      ctx.fillRect(x + 4, y + 6, 28, 10);
      // head
      ctx.fillRect(x + 28, y + 2, 14, 14);
      // beak
      ctx.fillRect(x + 38, y + 6, 8, 4);
      // eye
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x + 34, y + 4, 3, 3);
      ctx.fillStyle = '#00ff88';
      // wings
      if (obs.birdFrame === 0) {
        // wings up
        ctx.fillRect(x + 10, y, 16, 8);
      } else {
        // wings down
        ctx.fillRect(x + 10, y + 14, 16, 8);
      }
      // tail
      ctx.fillRect(x, y + 4, 6, 8);
    },
    []
  );

  const drawCloud = useCallback((ctx: CanvasRenderingContext2D, cloud: Cloud) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const { x, y, width } = cloud;
    ctx.fillRect(x, y, width, 8);
    ctx.fillRect(x + 4, y - 4, width - 8, 4);
    ctx.fillRect(x + 8, y - 6, width - 16, 4);
  }, []);

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number) => {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvasWidth, GROUND_Y);
    ctx.stroke();

    // ground dots
    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    const offset = (Date.now() * speedRef.current * 0.01) % 20;
    for (let i = -1; i < canvasWidth / 20 + 1; i++) {
      ctx.fillRect(i * 20 - offset, GROUND_Y + 4, 2, 1);
      ctx.fillRect(i * 20 - offset + 10, GROUND_Y + 8, 1, 1);
    }
  }, []);

  const drawScore = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
      const score = Math.floor(scoreRef.current);
      const highScore = highScoreRef.current;
      ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(String(score).padStart(5, '0'), canvasWidth - 10, 20);

      if (highScore > 0) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.fillText('HI ' + String(highScore).padStart(5, '0'), canvasWidth - 10, 36);
      }
    },
    []
  );

  const drawMessage = useCallback(
    (ctx: CanvasRenderingContext2D, canvasWidth: number) => {
      ctx.font = '14px "JetBrains Mono", "Fira Code", Consolas, monospace';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
      ctx.textAlign = 'center';

      if (stateRef.current === GameState.IDLE) {
        ctx.fillText('PRESS SPACE TO START', canvasWidth / 2, 80);
      } else if (stateRef.current === GameState.GAME_OVER) {
        const score = Math.floor(scoreRef.current);
        ctx.fillText('GAME OVER', canvasWidth / 2, 70);
        ctx.fillText(`SCORE: ${String(score).padStart(5, '0')}`, canvasWidth / 2, 90);
        ctx.fillText('PRESS SPACE TO RESTART', canvasWidth / 2, 115);
      }
    },
    []
  );

  const spawnObstacle = useCallback(() => {
    const score = scoreRef.current;
    const canBird = score > 300;
    const r = Math.random();
    let obs: Obstacle;

    if (canBird && r < 0.3) {
      const birdY = GROUND_Y - 30 - Math.random() * 60;
      obs = {
        x: 800,
        y: birdY,
        width: 46,
        height: 20,
        type: 'bird',
        birdFrame: 0,
        birdTimer: 0,
      };
    } else if (r < 0.6) {
      obs = {
        x: 800,
        y: GROUND_Y - 30,
        width: 22,
        height: 30,
        type: 'cactus-small',
        birdFrame: 0,
        birdTimer: 0,
      };
    } else {
      obs = {
        x: 800,
        y: GROUND_Y - 50,
        width: 34,
        height: 50,
        type: 'cactus-large',
        birdFrame: 0,
        birdTimer: 0,
      };
    }

    obstaclesRef.current.push(obs);
  }, []);

  const checkCollision = useCallback((dino: Dino, obs: Obstacle): boolean => {
    const dx = DINO_X + 4;
    const dy = dino.y + 4;
    const dw = dino.ducking ? 54 : dino.width - 8;
    const dh = dino.ducking ? 28 : dino.height - 4;

    const ox = obs.x + 2;
    const oy = obs.y + 2;
    const ow = obs.width - 4;
    const oh = obs.height - 4;

    return dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy;
  }, []);

  const resetGame = useCallback(() => {
    const dino = dinoRef.current;
    dino.y = GROUND_Y - 44;
    dino.vy = 0;
    dino.ducking = false;
    dino.legFrame = 0;
    dino.legTimer = 0;
    dino.width = 44;
    dino.height = 44;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    obstacleTimerRef.current = 0;
    scoreTimerRef.current = 0;
    isNightRef.current = false;
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
      const bgColor = isNightRef.current ? '#0a0a0a' : '#111111';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      // Draw clouds
      for (const cloud of cloudsRef.current) {
        cloud.x -= speedRef.current * 0.1 * dt;
        drawCloud(ctx, cloud);
      }
      // Remove off-screen clouds
      cloudsRef.current = cloudsRef.current.filter((c) => c.x + c.width > -20);
      // Spawn new clouds
      if (Math.random() < 0.003) {
        cloudsRef.current.push({
          x: w + 20,
          y: 20 + Math.random() * 60,
          width: 40 + Math.random() * 40,
        });
      }

      // Draw ground
      drawGround(ctx, w);

      if (stateRef.current === GameState.PLAYING) {
        const dino = dinoRef.current;

        // Update speed
        speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT * dt * 60);

        // Update score
        scoreTimerRef.current += dt;
        if (scoreTimerRef.current >= 0.1) {
          scoreRef.current += 1;
          scoreTimerRef.current = 0;
        }

        // Day/night cycle
        isNightRef.current = Math.floor(scoreRef.current / 700) % 2 === 1;

        // Dino physics
        if (!dino.ducking) {
          dino.vy += GRAVITY * dt;
          dino.y += dino.vy * dt;
          if (dino.y >= GROUND_Y - dino.height) {
            dino.y = GROUND_Y - dino.height;
            dino.vy = 0;
          }
        } else {
          dino.y = GROUND_Y - 26;
          dino.vy = 0;
        }

        // Leg animation
        dino.legTimer += dt;
        if (dino.legTimer > 0.1) {
          dino.legFrame = (dino.legFrame + 1) % 3;
          dino.legTimer = 0;
        }

        // Spawn obstacles
        obstacleTimerRef.current += dt;
        const minInterval = Math.max(0.7, 1.8 - (speedRef.current - INITIAL_SPEED) / 500);
        if (obstacleTimerRef.current > minInterval + Math.random() * 0.5) {
          spawnObstacle();
          obstacleTimerRef.current = 0;
        }

        // Update obstacles
        for (const obs of obstaclesRef.current) {
          obs.x -= speedRef.current * dt;

          if (obs.type === 'bird') {
            obs.birdTimer += dt;
            if (obs.birdTimer > 0.2) {
              obs.birdFrame = obs.birdFrame === 0 ? 1 : 0;
              obs.birdTimer = 0;
            }
          }
        }

        // Remove off-screen obstacles
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.width > -50);

        // Collision detection
        for (const obs of obstaclesRef.current) {
          if (checkCollision(dino, obs)) {
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

      // Draw obstacles
      for (const obs of obstaclesRef.current) {
        if (obs.type === 'bird') {
          drawBird(ctx, obs);
        } else {
          drawCactus(ctx, obs);
        }
      }

      // Draw dino
      const dino = dinoRef.current;
      drawPixelDino(ctx, dino);

      // Draw score
      drawScore(ctx, w);

      // Draw messages
      if (stateRef.current !== GameState.PLAYING) {
        drawMessage(ctx, w);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [
      drawPixelDino,
      drawCactus,
      drawBird,
      drawCloud,
      drawGround,
      drawScore,
      drawMessage,
      spawnObstacle,
      checkCollision,
      saveHighScore,
    ]
  );

  const handleAction = useCallback(() => {
    if (stateRef.current === GameState.IDLE) {
      resetGame();
      stateRef.current = GameState.PLAYING;
      const dino = dinoRef.current;
      dino.vy = JUMP_VELOCITY;
    } else if (stateRef.current === GameState.PLAYING) {
      const dino = dinoRef.current;
      if (!dino.ducking && dino.y >= GROUND_Y - dino.height) {
        dino.vy = JUMP_VELOCITY;
      }
    } else if (stateRef.current === GameState.GAME_OVER) {
      resetGame();
      stateRef.current = GameState.PLAYING;
      const dino = dinoRef.current;
      dino.vy = JUMP_VELOCITY;
    }
  }, [resetGame]);

  const handleDuck = useCallback((ducking: boolean) => {
    if (stateRef.current !== GameState.PLAYING) return;
    const dino = dinoRef.current;
    dino.ducking = ducking;
    if (ducking) {
      dino.height = 26;
      dino.y = GROUND_Y - 26;
      dino.vy = 0;
    } else {
      dino.height = 44;
      dino.y = GROUND_Y - 44;
    }
  }, []);

  useEffect(() => {
    highScoreRef.current = getHighScore();

    // Init clouds
    cloudsRef.current = [
      { x: 100, y: 30, width: 50 },
      { x: 350, y: 50, width: 40 },
      { x: 600, y: 25, width: 60 },
    ];

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = CANVAS_HEIGHT;
      }
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        handleDuck(false);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleAction();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [getHighScore, gameLoop, handleAction, handleDuck]);

  return (
    <div className="dino-game-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} className="dino-game-canvas" />
    </div>
  );
}