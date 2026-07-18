import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import asciiLeft from '@/assets/ascii_art/naruto_1.txt?raw';
import asciiRight from '@/assets/ascii_art/naruto_2.txt?raw';
import './diary.css';

const PALETTE = [
  '#FF6B6B', '#4ECDC4', '#A78BFA', '#FF8A5C', '#FFE66D',
  '#45B7D1', '#F7DC6F', '#82E0AA', '#F1948A', '#85C1E9',
  '#BB8FCE', '#73C6B6', '#F0B27A', '#7FB3D8',
  '#FF9FF3', '#FECA57', '#54A0FF', '#5F27CD', '#FF6348',
];

const NOTE_MIN_W = 100;
const NOTE_MAX_W = 220;

const getNoteWidth = (text: string): number => {
  const chars = text.length;
  const charsPerLine = 18;
  const lines = Math.ceil(chars / charsPerLine);
  const width = Math.min(NOTE_MAX_W, Math.max(NOTE_MIN_W, Math.min(chars, charsPerLine) * 8 + 30));
  return width;
};

interface DiaryEntry {
  id: string;
  text: string;
  date: string;
  time: string;
  color: string;
  rotate: number;
  offsetX: number;
  offsetY: number;
}

interface Physics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function generateEntry(text: string): DiaryEntry {
  const now = new Date();
  const yyyy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    rotate: (Math.random() - 0.5) * 8,
    offsetX: Math.random() * 12 - 6,
    offsetY: Math.random() * 12 - 6,
  };
}

const STORAGE_KEY = 'hakii_diary_entries';

function loadEntries(): DiaryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveEntries(entries: DiaryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/* ========== 单个漂浮便签 ========== */
const FloatingNote = ({
  entry,
  physics,
  isActive,
  containerW,
  containerH,
  onDelete,
  onClick,
}: {
  entry: DiaryEntry;
  physics: Physics;
  isActive: boolean;
  containerW: number;
  containerH: number;
  onDelete: (id: string) => void;
  onClick: (entry: DiaryEntry) => void;
}) => {
  const width = getNoteWidth(entry.text);
  const x = useMotionValue(physics.x);
  const y = useMotionValue(physics.y);
  const velRef = useRef({ vx: physics.vx, vy: physics.vy, r: physics.r });

  useEffect(() => {
    let raf: number;
    const maxX = containerW - width;
    const maxY = containerH - 60;

    const tick = () => {
      const v = velRef.current;
      let nx = x.get() + v.vx;
      let ny = y.get() + v.vy;

      if (nx <= 0) { nx = 0; v.vx = Math.abs(v.vx); }
      if (nx >= maxX) { nx = maxX; v.vx = -Math.abs(v.vx); }
      if (ny <= 0) { ny = 0; v.vy = Math.abs(v.vy); }
      if (ny >= maxY) { ny = maxY; v.vy = -Math.abs(v.vy); }

      x.set(nx);
      y.set(ny);

      v.r += (Math.random() - 0.5) * 0.5;
      if (v.r > 360) v.r -= 360;
      if (v.r < -360) v.r += 360;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [containerW, containerH, x, y]);

  const rot = useMotionValue(physics.r);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      rot.set(velRef.current.r);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rot]);

  return (
    <motion.div
      className={`diary-note floating ${isActive ? 'spotlight' : 'dimmed'}`}
      style={{
        x,
        y,
        rotate: rot as any,
        background: entry.color,
        position: 'absolute',
        width,
      }}
      onClick={() => onClick(entry)}
    >
      <button
        className="note-delete"
        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
        title="删除"
      >
        <X size={12} />
      </button>
      <div className="note-pin" />
      <div className="note-content">
        <p className="note-text">{entry.text}</p>
        <div className="note-meta">
          <span className="note-date">{entry.date}</span>
          <span className="note-time">{entry.time}</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ========== 主组件 ========== */
const Diary = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>(loadEntries);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [playing, setPlaying] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expanded, setExpanded] = useState<DiaryEntry | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const galleryRef = useRef<HTMLDivElement>(null);

  // 初始 random 物理参数（每个 entry 的 x/y 不同）
  const physicsMapRef = useRef<Map<string, Physics>>(new Map());

  // 容器尺寸
  useEffect(() => {
    const update = () => {
      if (galleryRef.current) {
        setContainerSize({
          w: galleryRef.current.clientWidth,
          h: galleryRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // 自动保存
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  // 初始化物理参数
  const initPhysics = useCallback(() => {
    physicsMapRef.current.clear();
    const { w, h } = containerSize;
    entries.forEach(entry => {
      const noteW = getNoteWidth(entry.text);
      physicsMapRef.current.set(entry.id, {
        x: Math.random() * Math.max(0, w - noteW),
        y: Math.random() * Math.max(0, h - 60),
        vx: (Math.random() * 2 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
        vy: (Math.random() * 2 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
        r: (Math.random() - 0.5) * 20,
      });
    });
  }, [entries, containerSize]);

  // 播放模式：切换高亮
  useEffect(() => {
    if (!playing || entries.length === 0) return;
    initPhysics();
    let idx = 0;
    setActiveIndex(0);
    const timer = setInterval(() => {
      idx = (idx + 1) % entries.length;
      setActiveIndex(idx);
    }, 3500);
    return () => {
      clearInterval(timer);
      setActiveIndex(-1);
    };
  }, [playing, entries.length, initPhysics]);

  const handleAdd = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setEntries(prev => [generateEntry(text), ...prev]);
    setInputText('');
    setShowInput(false);
    setPlaying(true);
  }, [inputText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  const handleDelete = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setExpanded(null);
  }, []);

  return (
    <div className="diary-page">
      <Navbar />

      <pre className="diary-ascii-side diary-ascii-left">{asciiLeft}</pre>
      <pre className="diary-ascii-side diary-ascii-right">{asciiRight}</pre>

      <section className="diary-hero">
        <h1 className="diary-hero-title">
          <span className="bracket">&lt;</span>
          <span>Diary</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h1>
        <p className="diary-hero-sub">每天留下几句话 · {entries.length} 条记录</p>
      </section>

      {/* 控制栏 */}
      <div className="diary-controls">
        <button
          className="diary-btn diary-btn-add"
          onClick={() => {
            setPlaying(false);
            setShowInput(true);
          }}
        >
          <Plus size={18} />
          <span>写日记</span>
        </button>
      </div>

      {/* 画廊 */}
      <section className={`diary-gallery ${playing ? 'playing' : ''}`} ref={galleryRef}>
        {entries.length === 0 ? (
          <div className="diary-empty">
            <span className="diary-empty-icon">📝</span>
            <p>还没有日记，点击上方「写日记」开始记录吧</p>
          </div>
        ) : playing ? (
          // 漂浮模式
          entries.map((entry, index) => {
            const p = physicsMapRef.current.get(entry.id);
            if (!p) return null;
            return (
              <FloatingNote
                key={entry.id}
                entry={entry}
                physics={p}
                isActive={index === activeIndex}
                containerW={containerSize.w}
                containerH={containerSize.h}
                onDelete={handleDelete}
                onClick={setExpanded}
              />
            );
          })
        ) : (
          // 网格模式
          <div className="diary-grid">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="diary-note"
                style={{
                  background: entry.color,
                  width: getNoteWidth(entry.text),
                  transform: `rotate(${entry.rotate}deg) translate(${entry.offsetX}px, ${entry.offsetY}px)`,
                  animationDelay: `${index * 0.06}s`,
                }}
                onClick={() => setExpanded(entry)}
              >
                <button
                  className="note-delete"
                  onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                  title="删除"
                >
                  <X size={12} />
                </button>
                <div className="note-pin" />
                <div className="note-content">
                  <p className="note-text">{entry.text}</p>
                  <div className="note-meta">
                    <span className="note-date">{entry.date}</span>
                    <span className="note-time">{entry.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 输入弹窗 */}
      {showInput && (
        <div className="diary-overlay" onClick={() => { setShowInput(false); setPlaying(true); }}>
          <div className="diary-input-modal" onClick={e => e.stopPropagation()}>
            <h3>写点什么...</h3>
            <textarea
              className="diary-textarea"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="今天的心情、想法、或者任何想说的话..."
              autoFocus
              rows={4}
            />
            <div className="diary-input-actions">
              <span className="diary-hint">Enter 发送  ·  Shift+Enter 换行</span>
              <div className="diary-input-btns">
                <button className="diary-btn-cancel" onClick={() => { setShowInput(false); setPlaying(true); }}>取消</button>
                <button className="diary-btn-save" onClick={handleAdd}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 展开查看 */}
      {expanded && (
        <div className="diary-overlay" onClick={() => setExpanded(null)}>
          <div
            className="diary-expanded"
            style={{ background: expanded.color }}
            onClick={e => e.stopPropagation()}
          >
            <button className="diary-expand-close" onClick={() => setExpanded(null)}>
              <X size={20} />
            </button>
            <p className="diary-expand-text">{expanded.text}</p>
            <div className="diary-expand-meta">
              <span>{expanded.date} {expanded.time}</span>
              <button className="diary-expand-delete" onClick={() => handleDelete(expanded.id)}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Diary;
