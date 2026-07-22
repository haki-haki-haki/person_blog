import { useEffect, useRef } from 'react';
import './flying-fish.css';

/**
 * 页面底部小鱼跳跃动画
 * 基于 cute-cnblogs fish.js 原始逻辑移植到 React + TypeScript
 * 核心：水平游动的鱼 + 弹簧链波浪 + XOR 混合模式
 */

// ==================== 工具函数 ====================
function getRandomValue(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

// ==================== 水面点（弹簧物理）====================
class SurfacePoint {
  private renderer: Renderer;
  private x: number;
  private initHeight: number;
  private height: number;
  private fy: number;
  private force: { previous: number; next: number };
  private previous: SurfacePoint | null = null;
  private next: SurfacePoint | null = null;

  private static readonly SPRING_CONSTANT = 0.03;
  private static readonly SPRING_FRICTION = 0.9;
  private static readonly WAVE_SPREAD = 0.3;
  private static readonly ACCELARATION_RATE = 0.01;

  constructor(renderer: Renderer, x: number) {
    this.renderer = renderer;
    this.x = x;
    this.initHeight = 0;
    this.height = 0;
    this.fy = 0;
    this.force = { previous: 0, next: 0 };
    this.init();
  }

  init() {
    this.initHeight = this.renderer.height * this.renderer.initHeightRate;
    this.height = this.initHeight;
    this.fy = 0;
    this.force = { previous: 0, next: 0 };
  }

  setPreviousPoint(previous: SurfacePoint) {
    this.previous = previous;
  }

  setNextPoint(next: SurfacePoint) {
    this.next = next;
  }

  interfere(y: number, velocity: number) {
    this.fy =
      this.renderer.height *
      SurfacePoint.ACCELARATION_RATE *
      (this.renderer.height - this.height - y >= 0 ? -1 : 1) *
      Math.abs(velocity);
  }

  updateSelf() {
    this.fy += SurfacePoint.SPRING_CONSTANT * (this.initHeight - this.height);
    this.fy *= SurfacePoint.SPRING_FRICTION;
    this.height += this.fy;
  }

  updateNeighbors() {
    if (this.previous) {
      this.force.previous = SurfacePoint.WAVE_SPREAD * (this.height - this.previous.height);
    }
    if (this.next) {
      this.force.next = SurfacePoint.WAVE_SPREAD * (this.height - this.next.height);
    }
  }

  render(context: CanvasRenderingContext2D) {
    if (this.previous) {
      this.previous.height += this.force.previous;
      this.previous.fy += this.force.previous;
    }
    if (this.next) {
      this.next.height += this.force.next;
      this.next.fy += this.force.next;
    }
    context.lineTo(this.x, this.renderer.height - this.height);
  }
}

// ==================== 鱼 ====================
class Fish {
  private renderer: Renderer;
  private direction: boolean;
  private x: number;
  private y: number;
  private previousY: number;
  private vx: number;
  private vy: number;
  private ay: number;
  private isOut: boolean;
  private theta: number;
  private phi: number;

  private static readonly GRAVITY = 0.4;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.direction = false;
    this.x = 0;
    this.y = 0;
    this.previousY = 0;
    this.vx = 0;
    this.vy = 0;
    this.ay = 0;
    this.isOut = false;
    this.theta = 0;
    this.phi = 0;
    this.init();
  }

  init() {
    this.direction = Math.random() < 0.5;
    this.x = this.direction
      ? this.renderer.width + this.renderer.threshold
      : -this.renderer.threshold;
    this.previousY = this.y;
    this.vx = getRandomValue(4, 10) * (this.direction ? -1 : 1);

    if (this.renderer.reverse) {
      this.y = getRandomValue(this.renderer.height * 0.1, this.renderer.height * 0.4);
      this.vy = getRandomValue(2, 5);
      this.ay = getRandomValue(0.05, 0.2);
    } else {
      this.y = getRandomValue(this.renderer.height * 0.6, this.renderer.height * 0.9);
      this.vy = getRandomValue(-5, -2);
      this.ay = getRandomValue(-0.2, -0.05);
    }
    this.isOut = false;
    this.theta = 0;
    this.phi = 0;
  }

  reverseVertical() {
    this.isOut = !this.isOut;
    this.ay *= -1;
  }

  controlStatus(context: CanvasRenderingContext2D) {
    this.previousY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.ay;

    if (this.renderer.reverse) {
      if (this.y > this.renderer.height * this.renderer.initHeightRate) {
        this.vy -= Fish.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = getRandomValue(0.05, 0.2);
        }
        this.isOut = false;
      }
    } else {
      if (this.y < this.renderer.height * this.renderer.initHeightRate) {
        this.vy += Fish.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = getRandomValue(-0.2, -0.05);
        }
        this.isOut = false;
      }
    }

    if (!this.isOut) {
      this.theta += Math.PI / 20;
      this.theta %= Math.PI * 2;
      this.phi += Math.PI / 30;
      this.phi %= Math.PI * 2;
    }

    this.renderer.generateEpicenter(
      this.x + (this.direction ? -1 : 1) * this.renderer.threshold,
      this.y,
      this.y - this.previousY
    );

    if (
      (this.vx > 0 && this.x > this.renderer.width + this.renderer.threshold) ||
      (this.vx < 0 && this.x < -this.renderer.threshold)
    ) {
      this.init();
    }
  }

  render(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate(Math.PI + Math.atan2(this.vy, this.vx));
    context.scale(1, this.direction ? 1 : -1);

    // 身体颜色（绿色主题）
    context.fillStyle = 'rgba(0, 255, 136, 0.85)';

    // ---- 身体 ----
    context.beginPath();
    context.moveTo(-30, 0);
    context.bezierCurveTo(-20, 15, 15, 10, 40, 0);
    context.bezierCurveTo(15, -10, -20, -15, -30, 0);
    context.fill();

    // ---- 尾鳍 ----
    context.save();
    context.translate(40, 0);
    context.scale(0.9 + 0.2 * Math.sin(this.theta), 1);
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(5, 10, 20, 8);
    context.quadraticCurveTo(12, 5, 10, 0);
    context.quadraticCurveTo(12, -5, 20, -8);
    context.quadraticCurveTo(5, -10, 0, 0);
    context.fill();
    context.restore();

    // ---- 侧鳍（背鳍/胸鳍）----
    context.save();
    context.translate(-3, 0);
    context.rotate(
      (Math.PI / 3 + (Math.PI / 10) * Math.sin(this.phi)) *
        (this.renderer.reverse ? -1 : 1)
    );
    context.beginPath();
    if (this.renderer.reverse) {
      context.moveTo(5, 0);
      context.bezierCurveTo(10, 10, 10, 30, 0, 40);
      context.bezierCurveTo(-12, 25, -8, 10, 0, 0);
    } else {
      context.moveTo(-5, 0);
      context.bezierCurveTo(-10, -10, -10, -30, 0, -40);
      context.bezierCurveTo(12, -25, 8, -10, 0, 0);
    }
    context.closePath();
    context.fill();
    context.restore();

    context.restore();
    this.controlStatus(context);
  }
}

// ==================== 渲染器 ====================
class Renderer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  points: SurfacePoint[] = [];
  fishes: Fish[] = [];
  reverse: boolean;
  intervalCount: number;
  fishCount: number;
  pointInterval: number;
  animId: number = 0;

  readonly POINT_INTERVAL = 5;
  readonly FISH_COUNT = 3;
  readonly MAX_INTERVAL_COUNT = 50;
  readonly INIT_HEIGHT_RATE = 0.5;
  readonly THRESHOLD = 50;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.canvas = canvas;
    this.context = ctx;
    this.width = 0;
    this.height = 0;
    this.reverse = false;
    this.intervalCount = this.MAX_INTERVAL_COUNT;
    this.fishCount = this.FISH_COUNT;
    this.pointInterval = this.POINT_INTERVAL;
    this.setup();
  }

  setup() {
    this.points = [];
    this.fishes = [];
    this.intervalCount = this.MAX_INTERVAL_COUNT;

    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.width = rect?.width || this.canvas.offsetWidth || 800;
    this.height = 200;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.fishCount = this.FISH_COUNT * (this.width / 500) * (this.height / 500);
    this.reverse = false;

    this.fishes.push(new Fish(this));
    this.createSurfacePoints();
  }

  createSurfacePoints() {
    const count = Math.round(this.width / this.POINT_INTERVAL);
    this.pointInterval = this.width / (count - 1);
    this.points.push(new SurfacePoint(this, 0));

    for (let i = 1; i < count; i++) {
      const point = new SurfacePoint(this, i * this.pointInterval);
      const previous = this.points[i - 1];
      point.setPreviousPoint(previous);
      previous.setNextPoint(point);
      this.points.push(point);
    }
  }

  get initHeightRate() {
    return this.INIT_HEIGHT_RATE;
  }

  get threshold() {
    return this.THRESHOLD;
  }

  generateEpicenter(x: number, y: number, velocity: number) {
    if (
      y < this.height / 2 - this.THRESHOLD ||
      y > this.height / 2 + this.THRESHOLD
    ) {
      return;
    }
    const index = Math.round(x / this.pointInterval);
    if (index < 0 || index >= this.points.length) {
      return;
    }
    this.points[index].interfere(y, velocity);
  }

  reverseVertical() {
    this.reverse = !this.reverse;
    for (let i = 0, count = this.fishes.length; i < count; i++) {
      this.fishes[i].reverseVertical();
    }
  }

  controlStatus() {
    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].updateSelf();
    }
    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].updateNeighbors();
    }
    if (this.fishes.length < this.fishCount) {
      if (--this.intervalCount === 0) {
        this.intervalCount = this.MAX_INTERVAL_COUNT;
        this.fishes.push(new Fish(this));
      }
    }
  }

  render = () => {
    this.animId = requestAnimationFrame(this.render);
    this.controlStatus();
    this.context.clearRect(0, 0, this.width, this.height);

    // 绘制鱼
    for (let i = 0, count = this.fishes.length; i < count; i++) {
      this.fishes[i].render(this.context);
    }

    // 绘制波浪（XOR 混合模式）
    this.context.save();
    this.context.globalCompositeOperation = 'xor';
    this.context.fillStyle = 'rgba(0, 255, 136, 0.12)';
    this.context.beginPath();
    this.context.moveTo(0, this.reverse ? 0 : this.height);

    for (let i = 0, count = this.points.length; i < count; i++) {
      this.points[i].render(this.context);
    }
    this.context.lineTo(this.width, this.reverse ? 0 : this.height);
    this.context.closePath();
    this.context.fill();
    this.context.restore();
  };

  start() {
    if (!this.animId) {
      this.render();
    }
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  resize() {
    this.stop();
    this.setup();
    this.start();
  }
}

// ==================== React 组件 ====================
const FlyingFish = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    const handleResize = () => {
      renderer.resize();
    };

    const handleClick = () => {
      renderer.reverseVertical();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + window.scrollY;
      const velocity = 5;
      renderer.generateEpicenter(x, y, velocity);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('click', handleClick);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="flying-fish-container">
      <canvas ref={canvasRef} className="flying-fish-canvas" />
    </div>
  );
};

export default FlyingFish;
