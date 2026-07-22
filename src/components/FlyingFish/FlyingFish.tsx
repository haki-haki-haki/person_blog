import { useEffect, useRef } from 'react';
import './flying-fish.css';

/**
 * 透明海浪 + 跳跃海豚 Canvas 动画
 * 基于 cute-cnblogs fish.js 改写为 React + TypeScript
 * 核心技术：弹簧链波动物理 + 贝塞尔曲线绘制 + XOR 混合模式
 */

// ==================== 水面点（弹簧物理） ====================
class SurfacePoint {
  private x: number;
  private y: number;
  private vy: number;
  private depth: number;
  private restHeight: number;

  constructor(x: number, restHeight: number, depth: number) {
    this.x = x;
    this.y = restHeight;
    this.vy = 0;
    this.depth = depth;
    this.restHeight = restHeight;
  }

  // 施加扰动
  updateSelf(impactHeight: number) {
    const force = -SPRING_CONSTANT * (this.y - this.restHeight);
    const damping = -SPRING_FRICTION * this.vy;
    this.vy += force + damping;
    this.y += this.vy;

    // 外部扰动
    if (impactHeight !== 0) {
      this.y += impactHeight;
    }
  }

  // 传递波动给邻居
  getDelta() {
    return (this.y - this.restHeight) * WAVE_SPREAD;
  }

  // 限制位移
  restrict(restHeight: number) {
    this.restHeight = restHeight;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.lineTo(this.x, this.y);
  }
}

// 物理常量
const SPRING_CONSTANT = 0.025;
const SPRING_FRICTION = 0.025;
const WAVE_SPREAD = 0.25;
const POINT_INTERVAL = 6; // 水面点间距
const FISH_COUNT = 3; // 鱼的数量
const INIT_HEIGHT_RATE = 0.5; // 水面高度比例

// ==================== 鱼/海豚 ====================
class Fish {
  private renderer: FishRenderer;
  private x!: number;
  private y!: number;
  private vx!: number;
  private vy!: number;
  private ay!: number;
  private theta!: number; // 尾鳍摆动角度
  private phi!: number; // 背鳍旋转角度
  private isOut!: boolean; // 是否跳出水面
  private color: string;

  constructor(renderer: FishRenderer, color: string) {
    this.renderer = renderer;
    this.color = color;
    this.init();
  }

  init() {
    const renderer = this.renderer;
    this.x = renderer.width * (Math.random() > 0.5 ? 1 : 0) + Math.random() * renderer.width * 0.2 * (Math.random() > 0.5 ? 1 : -1);
    this.y = renderer.height * INIT_HEIGHT_RATE + Math.random() * 20;
    this.vx = (renderer.width * 0.5 - this.x) * 0.008 + (Math.random() - 0.5) * 2;
    this.vy = 0;
    this.ay = 0;
    this.theta = 0;
    this.phi = 0;
    this.isOut = false;
  }

  private static readonly GRAVITY = 0.4;

  update() {
    const renderer = this.renderer;

    this.theta += 0.15;
    this.phi += 0.1;

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.ay;

    // 水面线
    const surfaceY = renderer.height * INIT_HEIGHT_RATE;

    if (this.y < surfaceY) {
      // 出水后受重力
      this.vy += Fish.GRAVITY;
      if (!this.isOut) {
        this.isOut = true;
      }
    } else {
      // 在水中
      if (this.isOut) {
        // 刚落回水中，产生波纹
        renderer.generateEpicenter(this.x, (this.y - surfaceY) * 8);
        this.isOut = false;
      }
      // 水中减速 + 准备下一次跳跃
      this.vy *= 0.92;
      if (Math.abs(this.vy) < 0.5) {
        // 随机跳跃
        this.vy = -(8 + Math.random() * 6);
        this.vx += (Math.random() - 0.5) * 1.5;
      }
    }

    // 限制水平速度
    this.vx = Math.max(-6, Math.min(6, this.vx));

    // 游出屏幕重新初始化
    if (this.x < -80 || this.x > renderer.width + 80) {
      this.init();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const surfaceY = this.renderer.height * INIT_HEIGHT_RATE;
    if (this.y > surfaceY + 30) return; // 水下太深不绘制

    ctx.save();
    ctx.translate(this.x, this.y);

    // 鱼朝向：水平速度方向
    const scaleX = this.vx >= 0 ? 1 : -1;
    ctx.scale(scaleX, 1);

    // 跳出水面时的旋转角度
    if (this.isOut) {
      const rotAngle = Math.atan2(this.vy, Math.abs(this.vx)) * 0.5;
      ctx.rotate(rotAngle);
    }

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;

    // ---- 鱼身：两条贝塞尔曲线 ----
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.bezierCurveTo(-20, 12, 15, 8, 35, 0);
    ctx.bezierCurveTo(15, -8, -20, -12, -30, 0);
    ctx.fill();

    // ---- 尾鳍：二次贝塞尔，带摆动 ----
    ctx.save();
    ctx.translate(-30, 0);
    ctx.scale(0.9 + 0.2 * Math.sin(this.theta), 1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, 12, -20, 0);
    ctx.quadraticCurveTo(-15, -12, 0, 0);
    ctx.fill();
    ctx.restore();

    // ---- 背鳍：贝塞尔，带旋转 ----
    ctx.save();
    ctx.translate(5, -8);
    ctx.rotate((Math.PI / 6 + Math.PI / 12 * Math.sin(this.phi)));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-5, -12, 8, -12, 12, 0);
    ctx.fill();
    ctx.restore();

    // ---- 眼睛 ----
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(18, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(18.5, -3, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==================== 渲染器 ====================
class FishRenderer {
  width: number;
  height: number;
  private ctx!: CanvasRenderingContext2D;
  private points: SurfacePoint[] = [];
  private fishes: Fish[] = [];
  private pointCount!: number;
  private reverse: boolean = false;
  private lastTime: number = 0;
  private animId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    this.width = canvas.offsetWidth;
    this.height = canvas.offsetHeight;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    this.ctx = ctx;

    this.pointCount = Math.ceil(this.width / POINT_INTERVAL);
    this.createPoints();
    this.createFishes();
  }

  private createPoints() {
    this.points = [];
    const restHeight = this.height * INIT_HEIGHT_RATE;
    for (let i = 0; i <= this.pointCount; i++) {
      this.points.push(new SurfacePoint(i * POINT_INTERVAL, restHeight, this.height));
    }
  }

  private createFishes() {
    this.fishes = [];
    const colors = ['rgba(0, 255, 136, 0.85)', 'rgba(0, 200, 120, 0.8)', 'rgba(100, 255, 180, 0.85)'];
    for (let i = 0; i < FISH_COUNT; i++) {
      this.fishes.push(new Fish(this, colors[i % colors.length]));
    }
  }

  // 产生波纹扰动
  generateEpicenter(x: number, force: number) {
    const index = Math.round(x / POINT_INTERVAL);
    if (index >= 0 && index < this.points.length) {
      // 向左右传播
      const range = 8;
      for (let i = -range; i <= range; i++) {
        const idx = index + i;
        if (idx >= 0 && idx < this.points.length) {
          const factor = (1 - Math.abs(i) / range) * force;
          this.points[idx]['vy'] += factor;
        }
      }
    }
  }

  // 鼠标交互产生波纹
  moveEpicenter(x: number) {
    const index = Math.round(x / POINT_INTERVAL);
    if (index >= 0 && index < this.points.length) {
      this.points[index]['vy'] += 2;
    }
  }

  // 反转方向
  reverseVertical() {
    this.reverse = !this.reverse;
  }

  private updatePoints() {
    for (const point of this.points) {
      point.updateSelf(0);
    }
    // 传播波动
    for (let i = 0; i < this.points.length; i++) {
      if (i > 0) {
        const delta = this.points[i].getDelta();
        this.points[i - 1]['vy'] += delta;
      }
      if (i < this.points.length - 1) {
        const delta = this.points[i].getDelta();
        this.points[i + 1]['vy'] += delta;
      }
    }
  }

  private renderWaves() {
    const ctx = this.ctx;
    ctx.save();

    // XOR 混合模式 → 透明叠加效果
    ctx.globalCompositeOperation = 'xor';

    // 绘制多层波浪（深浅不同）
    const layers = [
      { offset: 0, alpha: 0.15, color: '0, 255, 136' },
      { offset: 10, alpha: 0.10, color: '0, 200, 120' },
      { offset: 20, alpha: 0.06, color: '100, 255, 180' },
    ];

    for (const layer of layers) {
      ctx.fillStyle = `rgba(${layer.color}, ${layer.alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, this.reverse ? 0 : this.height);
      for (const point of this.points) {
        point.render(ctx);
      }
      ctx.lineTo(this.width, this.reverse ? 0 : this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private renderFishes() {
    for (const fish of this.fishes) {
      fish.update();
      fish.render(this.ctx);
    }
  }

  render = () => {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.updatePoints();
    this.renderWaves();
    this.renderFishes();

    this.animId = requestAnimationFrame(this.render);
  };

  start() {
    if (!this.animId) {
      this.lastTime = performance.now();
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
    const canvas = this.ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    this.width = canvas.offsetWidth;
    this.height = canvas.offsetHeight;
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.pointCount = Math.ceil(this.width / POINT_INTERVAL);
    this.createPoints();
    this.start();
  }
}

// ==================== React 组件 ====================
const FlyingFish = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FishRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new FishRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    // 鼠标交互
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      renderer.moveEpicenter(x);
    };

    const handleClick = () => {
      renderer.reverseVertical();
    };

    const handleResize = () => {
      renderer.resize();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.stop();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flying-fish-container">
      <canvas ref={canvasRef} className="flying-fish-canvas" />
    </div>
  );
};

export default FlyingFish;
