import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import './HikeYourTodos.css';

const HikeYourTodos = () => {
  const appRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [initialized, setInitialized] = useState(false);

  const initApp = useCallback(async () => {
    if (!appRef.current || !canvasRef.current) return;

    const mod = await import('@/assets/pretext.mjs');
    const { prepareWithSegments, layoutWithLines } = mod;

    try {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
    } catch (_) {}

    const FONT = '16px "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const LINE_HEIGHT = 26;
    const MAX_TEXT_WIDTH = 380;
    const AIR_RESISTANCE = 0.02;
    const CLIMB_MIN = 0.3;
    const CLIMB_MAX = 0.8;
    const GRAVITY = 0.34;
    const TOP_MARGIN = 96;
    const SIDE_MARGIN = 36;
    const GROUND_MARGIN = 120;
    const BIN_SIZE = 8;
    const PILE_RAISE = 9;
    const CHAR_H = 16;
    const REPOSE_SLOPE = BIN_SIZE * 0.62;
    const DRAG_THRESHOLD = 6;
    const CLICK_TIME = 300;

    const TEXT_NORMAL = '#2c383a';
    const TEXT_DONE = '#7a918c';
    const ACCENT_MOSS = '#629482';

    const canvas = canvasRef.current;
    const app = appRef.current;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    let DPR = Math.max(1, window.devicePixelRatio || 1);
    let W = 0, H = 0, groundY = 0, numBins = 0, pileCenterX = 0;
    let heightmap = new Float32Array(1);

    interface Todo {
      id: number;
      text: string;
      lines: { text: string; width: number }[];
      width: number;
      height: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      climbSpeed: number;
      state: 'climbing' | 'dragging';
      opacity: number;
      age: number;
      wander: number;
      releaseT: number;
    }

    interface Char {
      char: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      width: number;
      state: 'falling' | 'settled';
      rot: number;
      vr: number;
      opacity: number;
    }

    const todos: Todo[] = [];
    const chars: Char[] = [];
    let nextId = 1;
    let personX = 0, personY = 0, personInited = false;
    let drag: { todo: Todo; sx: number; sy: number; lx: number; ly: number; moved: boolean; t0: number; ox: number; oy: number } | null = null;
    let last = performance.now();

    function resize() {
      DPR = Math.max(1, window.devicePixelRatio || 1);
      const rect = app.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      groundY = H - GROUND_MARGIN;
      pileCenterX = W / 2;
      const newBins = Math.max(1, Math.ceil(W / BIN_SIZE));
      const next = new Float32Array(newBins);
      for (let i = 0; i < newBins; i++) {
        const ratio = numBins > 0 ? (i + 0.5) / newBins * numBins - 0.5 : 0;
        const j = Math.max(0, Math.min(numBins - 1, Math.round(ratio)));
        next[i] = heightmap[j] || 0;
      }
      numBins = newBins;
      heightmap = next;
    }

    const clampBin = (b: number) => (b < 0 ? 0 : b >= numBins ? numBins - 1 : b);

    function createTodo(text: string) {
      const trimmed = text.trim();
      if (!trimmed) return;
      const prepared = prepareWithSegments(trimmed, FONT);
      const { lines, lineCount } = layoutWithLines(prepared, MAX_TEXT_WIDTH, LINE_HEIGHT);
      const width = lines.reduce((m: number, l: { width: number }) => Math.max(m, l.width), 0) || 20;
      const height = Math.max(LINE_HEIGHT, lineCount * LINE_HEIGHT);
      const climb = CLIMB_MIN + Math.random() * (CLIMB_MAX - CLIMB_MIN);
      todos.push({
        id: nextId++,
        text: trimmed,
        lines,
        width,
        height,
        x: W / 2 - width / 2 + (Math.random() * 40 - 20),
        y: groundY - height - 10,
        vx: Math.random() * 0.4 - 0.2,
        vy: -climb,
        climbSpeed: climb,
        state: 'climbing',
        opacity: 0,
        age: 0,
        wander: Math.random() * Math.PI * 2,
        releaseT: 0,
      });
    }

    function completeTodo(td: Todo) {
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      for (let i = 0; i < td.lines.length; i++) {
        const line = td.lines[i];
        const lineY = td.y + i * LINE_HEIGHT;
        let off = 0;
        for (const ch of Array.from(line.text)) {
          const w = ctx.measureText(ch).width;
          chars.push({
            char: ch,
            x: td.x + off,
            y: lineY,
            vx: (Math.random() * 2 - 1) * 1.6,
            vy: Math.random() * 0.8,
            width: w,
            state: 'falling',
            rot: 0,
            vr: (Math.random() * 2 - 1) * 0.12,
            opacity: 0.6,
          });
          off += w;
        }
      }
      const idx = todos.indexOf(td);
      if (idx >= 0) todos.splice(idx, 1);
    }

    function settleChar(c: Char) {
      let b = clampBin(Math.floor((c.x + c.width / 2) / BIN_SIZE));
      for (let step = 0; step < numBins; step++) {
        const l = clampBin(b - 1), r = clampBin(b + 1);
        const hc = heightmap[b], hl = heightmap[l], hr = heightmap[r];
        if (hc - hl > REPOSE_SLOPE && hl <= hr) { b = l; continue; }
        if (hc - hr > REPOSE_SLOPE && hr < hl) { b = r; continue; }
        break;
      }
      const surfaceY = groundY - heightmap[b];
      c.x = (b + 0.5) * BIN_SIZE - c.width / 2;
      c.y = surfaceY - CHAR_H;
      c.state = 'settled';
      c.vx = 0;
      c.vy = 0;
      c.rot = 0;
      heightmap[b] += PILE_RAISE;
    }

    function update(dt: number) {
      const f = Math.min(dt * 60, 2);

      for (const t of todos) {
        if (t.state === 'dragging') continue;
        t.age += dt;
        t.opacity = Math.min(1, t.age / 0.38);
        const climbForce = t.climbSpeed * AIR_RESISTANCE;
        t.vy += -climbForce * f;
        t.vy *= 1 - AIR_RESISTANCE * f;
        if (t.releaseT > 0) {
          t.releaseT -= dt;
          t.vy += (-t.climbSpeed - t.vy) * 0.18 * f;
        }
        t.y += t.vy * f;
        if (t.y < TOP_MARGIN) { t.y = TOP_MARGIN; t.vy = Math.abs(t.vy) * 0.28 + 0.08; }
        if (t.y + t.height > groundY) { t.y = groundY - t.height; t.vy = -Math.abs(t.vy) * 0.25 - 0.04; }
        t.wander += dt * 0.7;
        t.vx += Math.sin(t.wander) * 0.01 * f;
        t.vx *= 1 - AIR_RESISTANCE * f;
        t.x += t.vx * f;
        if (t.x < SIDE_MARGIN) { t.x = SIDE_MARGIN; t.vx = Math.abs(t.vx) * 0.3; }
        if (t.x + t.width > W - SIDE_MARGIN) { t.x = W - SIDE_MARGIN - t.width; t.vx = -Math.abs(t.vx) * 0.3; }
      }

      for (let i = 0; i < todos.length; i++) {
        for (let j = i + 1; j < todos.length; j++) {
          const a = todos[i], b = todos[j];
          if (a.state === 'dragging' || b.state === 'dragging') continue;
          const ax = a.x + a.width / 2, ay = a.y + a.height / 2;
          const bx = b.x + b.width / 2, by = b.y + b.height / 2;
          const dx = ax - bx, dy = ay - by;
          const dist = Math.hypot(dx, dy);
          const min = Math.max(a.width, b.width) / 2 + 26;
          if (dist < min && dist > 0.01) {
            const p = (min - dist) / min * 0.12 * f;
            a.vx += dx / dist * p;
            b.vx -= dx / dist * p;
            a.vy += dy / dist * p * 0.3;
            b.vy -= dy / dist * p * 0.3;
          }
        }
      }

      for (const c of chars) {
        if (c.state === 'settled') continue;
        c.vy += GRAVITY * f;
        const dx = pileCenterX - (c.x + c.width / 2);
        c.vx += Math.sign(dx) * Math.min(Math.abs(dx), 220) / 220 * 0.06 * f;
        c.vx *= 1 - 0.02 * f;
        c.vy *= 1 - 0.008 * f;
        c.x += c.vx * f;
        c.y += c.vy * f;
        c.rot += c.vr * f;
        const b = clampBin(Math.floor((c.x + c.width / 2) / BIN_SIZE));
        const surfaceY = groundY - heightmap[b];
        if (c.y + CHAR_H >= surfaceY) settleChar(c);
        if (c.x < SIDE_MARGIN) { c.x = SIDE_MARGIN; c.vx = Math.abs(c.vx) * 0.3; }
        if (c.x > W - SIDE_MARGIN) { c.x = W - SIDE_MARGIN; c.vx = -Math.abs(c.vx) * 0.3; }
      }

      let peakBin = 0, peakH = 0;
      for (let i = 0; i < numBins; i++) if (heightmap[i] > peakH) { peakH = heightmap[i]; peakBin = i; }
      const tx = (peakBin + 0.5) * BIN_SIZE;
      const ty = groundY - peakH;
      if (!personInited) { personX = tx; personY = ty; personInited = true; }
      const k = Math.min(1, dt * 3.5);
      personX += (tx - personX) * k;
      personY += (ty - personY) * k;
    }

    function peakHeight() {
      let m = 0;
      for (let i = 0; i < numBins; i++) if (heightmap[i] > m) m = heightmap[i];
      return m;
    }

    function drawHiker() {
      ctx.save();
      ctx.translate(personX, personY);
      ctx.fillStyle = 'rgba(44,56,58,0.14)';
      ctx.beginPath();
      ctx.ellipse(0, 1, 9, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = TEXT_NORMAL;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3, -9);
      ctx.moveTo(0, 0);
      ctx.lineTo(5, -9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(1, -17);
      ctx.stroke();
      ctx.fillStyle = ACCENT_MOSS;
      ctx.fillRect(-5.5, -16.5, 4, 7);
      ctx.beginPath();
      ctx.moveTo(1, -15);
      ctx.lineTo(6, -12);
      ctx.stroke();
      ctx.strokeStyle = '#8a6a4a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(6, -12);
      ctx.lineTo(8.5, -1.5);
      ctx.stroke();
      ctx.fillStyle = TEXT_NORMAL;
      ctx.beginPath();
      ctx.arc(1.5, -20, 3, 0, Math.PI * 2);
      ctx.fill();
      if (peakHeight() > 46) {
        ctx.strokeStyle = '#9aa9a4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(12, -22);
        ctx.stroke();
        ctx.fillStyle = ACCENT_MOSS;
        ctx.beginPath();
        ctx.moveTo(12, -22);
        ctx.lineTo(20, -19);
        ctx.lineTo(12, -16);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (peakHeight() > 4) {
        ctx.save();
        ctx.filter = 'blur(4px)';
        ctx.beginPath();
        ctx.moveTo(-4, H + 4);
        ctx.lineTo(-4, groundY - heightmap[0]);
        for (let i = 1; i < numBins; i++) ctx.lineTo(i * BIN_SIZE, groundY - heightmap[i]);
        ctx.lineTo(W + 4, groundY - heightmap[numBins - 1]);
        ctx.lineTo(W + 4, H + 4);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, groundY - 220, 0, groundY);
        g.addColorStop(0, 'rgba(98,148,130,0.30)');
        g.addColorStop(1, 'rgba(197,212,205,0.16)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }

      ctx.font = FONT;
      ctx.textBaseline = 'top';
      ctx.fillStyle = TEXT_DONE;
      for (const c of chars) {
        ctx.save();
        ctx.globalAlpha = c.opacity;
        if (c.state === 'falling') {
          ctx.translate(c.x + c.width / 2, c.y + CHAR_H / 2);
          ctx.rotate(c.rot);
          ctx.fillText(c.char, -c.width / 2, -CHAR_H / 2);
        } else {
          ctx.fillText(c.char, c.x, c.y);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      drawHiker();

      ctx.font = FONT;
      ctx.textBaseline = 'top';
      ctx.filter = 'blur(0.4px)';
      for (const t of todos) {
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = TEXT_NORMAL;
        const bounce = Math.sin(t.age * 16) * Math.exp(-t.age * 7) * 3;
        for (let i = 0; i < t.lines.length; i++) {
          ctx.fillText(t.lines[i].text, t.x, t.y + i * LINE_HEIGHT + bounce);
        }
      }
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
    }

    function getPos(e: PointerEvent) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function hitTodo(p: { x: number; y: number }) {
      for (let i = todos.length - 1; i >= 0; i--) {
        const t = todos[i];
        if (t.state !== 'climbing') continue;
        if (p.x >= t.x && p.x <= t.x + t.width && p.y >= t.y && p.y <= t.y + t.height) return t;
      }
      return null;
    }

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      const p = getPos(e);
      const t = hitTodo(p);
      if (!t) return;
      e.preventDefault();
      t.state = 'dragging';
      drag = { todo: t, sx: p.x, sy: p.y, lx: p.x, ly: p.y, moved: false, t0: performance.now(), ox: p.x - t.x, oy: p.y - t.y };
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!drag) return;
      const p = getPos(e);
      if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > DRAG_THRESHOLD) drag.moved = true;
      if (drag.moved) {
        const t = drag.todo;
        t.x = p.x - drag.ox;
        t.y = p.y - drag.oy;
        t.vx = (p.x - drag.lx) * 0.5;
        t.vy = (p.y - drag.ly) * 0.5;
        drag.lx = p.x;
        drag.ly = p.y;
      }
    });

    function endPointer() {
      if (!drag) return;
      const t = drag.todo;
      const elapsed = performance.now() - drag.t0;
      if (!drag.moved && elapsed < CLICK_TIME) {
        completeTodo(t);
      } else {
        t.state = 'climbing';
        t.releaseT = 0.2;
      }
      drag = null;
    }

    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    if (formRef.current && inputRef.current) {
      formRef.current.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        const v = inputRef.current!.value;
        if (v.trim()) {
          createTodo(v);
          inputRef.current!.value = '';
        }
        inputRef.current!.focus();
      });
    }

    function loop(now: number) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    resize();
    const seeds = ['Pack your bag', 'Check the trail map', 'Fill up your water', 'Lace up your boots'];
    seeds.forEach((s, i) => setTimeout(() => createTodo(s), i * 220));
    requestAnimationFrame(loop);

    setInitialized(true);
  }, []);

  useEffect(() => {
    initApp();
    return () => {
      window.removeEventListener('resize', () => {});
      window.removeEventListener('pointerup', () => {});
      window.removeEventListener('pointercancel', () => {});
    };
  }, [initApp]);

  return (
    <div className="hike-page">
      <Navbar />
      <main className="hike-main">
        <div className="hike-container">
          <div className="hike-content">
            <h1 className="hike-title">Hike Your Todos</h1>
            <p className="hike-subtitle">Complete a task — it crumbles into the mountain you climb.</p>
          </div>

          <div className="app" ref={appRef}>
            <div className="backdrop" />
            <div className="ridges">
              <div className="ridge far" />
              <div className="ridge" />
            </div>
            <canvas id="canvas" ref={canvasRef} />
            <header>
              <h1>Hike Your Todos</h1>
              <p>Complete a task — it crumbles into the mountain you climb.</p>
            </header>
            <form id="form" ref={formRef} autoComplete="off">
              <input
                id="input"
                ref={inputRef}
                type="text"
                maxLength={80}
                placeholder="Add a task to your hike…"
                aria-label="New task"
              />
            </form>
            <p className="hint">Type &amp; press Enter to add · Click a task to complete · Long-press to drag</p>
          </div>

          <div className="hike-footer">
            <p>Made with ❤️ by Haki</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HikeYourTodos;