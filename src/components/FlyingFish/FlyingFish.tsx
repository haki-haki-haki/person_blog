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
const INIT_HEIGHT_RATE = 0.65; // 水面高度比例（偏下，波浪在 canvas 下半部分）

// ==================== 鱼/海豚 ====================
class Fish {
  private renderer: FishRenderer;
  private x!: number;
  private y!: number;
  private vx!: number;
  private vy!: number;
  private tailPhase!: number; // 尾鳍摆动相位
  private finPhase!: number; // 鳍摆动相位
  private isOut!: boolean;
  private color: string;
  private bodyAngle!: number; // 身体朝向角度

  constructor(renderer: FishRenderer, color: string) {
    this.renderer = renderer;
    this.color = color;
    this.init();
  }

  init() {
    const renderer = this.renderer;
    this.x = renderer.width * (Math.random() > 0.5 ? 1 : 0) + Math.random() * renderer.width * 0.2 * (Math.random() > 0.5 ? 1 : -1);
    this.y = renderer.height * INIT_HEIGHT_RATE + Math.random() * 15;
    this.vx = (renderer.width * 0.5 - this.x) * 0.005 + (Math.random() - 0.5) * 1;
    this.vy = 0;
    this.tailPhase = Math.random() * Math.PI * 2;
    this.finPhase = Math.random() * Math.PI * 2;
    this.isOut = false;
    this.bodyAngle = 0;
  }

  private static readonly GRAVITY = 0.18; // 更小的重力 → 更慢的下落

  update() {
    const renderer = this.renderer;

    // 慢速摆动
    this.tailPhase += 0.08;
    this.finPhase += 0.05;

    this.x += this.vx;
    this.y += this.vy;

    // 水面线
    const surfaceY = renderer.height * INIT_HEIGHT_RATE;

    if (this.y < surfaceY) {
      // 出水后受重力（很小的重力）
      this.vy += Fish.GRAVITY;
      if (!this.isOut) {
        this.isOut = true;
      }
      // 空中阻力
      this.vx *= 0.995;
    } else {
      // 在水中
      if (this.isOut) {
        // 刚落回水中，产生波纹
        renderer.generateEpicenter(this.x, (this.y - surfaceY) * 5);
        this.isOut = false;
      }
      // 水中阻力
      this.vy *= 0.94;
      this.vx *= 0.98;

      // 准备跳跃：速度很慢时才跳
      if (Math.abs(this.vy) < 0.3 && this.y > surfaceY + 5) {
        // 轻柔的跳跃
        this.vy = -(3.5 + Math.random() * 3); // 更小的跳跃力度
        this.vx += (Math.random() - 0.5) * 0.8;
      }

      // 保持在水面附近游动
      if (this.y > surfaceY + 25) {
        this.vy -= 0.05;
      }
    }

    // 限制水平速度（更慢）
    this.vx = Math.max(-3, Math.min(3, this.vx));

    // 计算身体角度：跟随速度方向，但平滑过渡
    const targetAngle = Math.atan2(this.vy, Math.abs(this.vx)) * 0.6;
    this.bodyAngle += (targetAngle - this.bodyAngle) * 0.1;

    // 限制垂直位置
    const minY = 25;
    const maxY = renderer.height - 10;
    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy) * 0.2;
    }
    if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy) * 0.2;
    }

    // 游出屏幕重新初始化
    if (this.x < -100 || this.x > renderer.width + 100) {
      this.init();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const surfaceY = this.renderer.height * INIT_HEIGHT_RATE;
    if (this.y > surfaceY + 40) return; // 水下太深不绘制

    ctx.save();
    ctx.translate(this.x, this.y);

    // 朝向：水平速度方向
    const facingRight = this.vx >= 0;
    ctx.scale(facingRight ? 1 : -1, 1);

    // 身体角度跟随运动方向
    ctx.rotate(this.bodyAngle);

    const tailWag = Math.sin(this.tailPhase);
    const finWag = Math.sin(this.finPhase);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    // ---- 主体：流线型海豚身体 ----
    ctx.beginPath();
    // 鼻子
    ctx.moveTo(28, 0);
    // 上轮廓：鼻子 → 额头 → 背鳍后 → 尾柄
    ctx.bezierCurveTo(22, -6, 10, -10, -5, -9);
    ctx.bezierCurveTo(-18, -8, -28, -5, -36, -2);
    // 尾柄到尾鳍
    ctx.lineTo(-42, -4 + tailWag * 2);
    // 下轮廓：尾鳍 → 腹部 → 下巴
    ctx.lineTo(-42, 4 + tailWag * 2);
    ctx.bezierCurveTo(-28, 5, -18, 8, -5, 7);
    ctx.bezierCurveTo(10, 6, 22, 4, 28, 0);
    ctx.closePath();
    ctx.fill();

    // ---- 背鳍（三角形，带摆动） ----
    ctx.save();
    ctx.translate(-5, -9);
    ctx.rotate(-0.2 + finWag * 0.15);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-4, -10, 2, -12, 6, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- 胸鳍（侧面小鳍） ----
    ctx.save();
    ctx.translate(8, 4);
    ctx.rotate(0.4 + finWag * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(2, 6, -6, 8, -8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- 尾鳍（分叉，像海豚尾巴） ----
    ctx.save();
    ctx.translate(-40, tailWag * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // 上叶
    ctx.quadraticCurveTo(-8, -10, -14, -12);
    ctx.quadraticCurveTo(-10, -4, -4, 0);
    // 下叶
    ctx.quadraticCurveTo(-10, 4, -14, 12);
    ctx.quadraticCurveTo(-8, 10, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ---- 眼睛 ----
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(20, -2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(20.5, -2.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // ---- 嘴巴线条 ----
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(26, 1);
    ctx.quadraticCurveTo(22, 2, 18, 1);
    ctx.stroke();

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

    // 绘制多层波浪（深浅不同）—— 颜色更浅但可见
    const layers = [
      { offset: 0, alpha: 0.10, color: '0, 255, 136' },
      { offset: 8, alpha: 0.07, color: '0, 200, 120' },
      { offset: 16, alpha: 0.04, color: '100, 255, 180' },
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
