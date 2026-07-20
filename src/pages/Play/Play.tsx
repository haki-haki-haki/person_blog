import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import DinoGame from '@/components/DinoGame/DinoGame';
import SurfGame from '@/components/SurfGame/SurfGame';
import ShooterGame from '@/components/ShooterGame/ShooterGame';
import '../../styles/pages/play.css';

type GameId = 'dino' | 'surf' | 'shooter';

const games: Record<GameId, { label: string; tag: string }> = {
  dino: { label: 'Dino Run', tag: '恐龙跑酷' },
  surf: { label: 'WiFi Surf', tag: '无线冲浪' },
  shooter: { label: 'Shooter', tag: '打飞机' },
};

const instructions: Record<GameId, { items: string[]; note: string }> = {
  dino: {
    items: ['Space / ↑  跳跃', '↓  下蹲', '触屏  点击跳跃'],
    note: '* 300 分后出现飞行障碍，注意下蹲或跳跃躲避',
  },
  surf: {
    items: ['← → / A D  切换车道', '触屏  左右滑动', 'Space  开始 / 重新开始'],
    note: '* 撞到红色防火墙游戏结束，绿色菱形是信号增强道具',
  },
  shooter: {
    items: ['← → / A D  移动', 'Space  射击（按住连发）', '鼠标  移动瞄准'],
    note: '* 击毁敌机获得分数，被撞或被敌弹击中扣血，3条命',
  },
};

const Play = () => {
  const [active, setActive] = useState<GameId>('dino');

  return (
    <div className="play-page">
      <Navbar />
      <main className="play-main">
        <div className="play-content">
          <Link to="/" className="play-back-link">
            {'<'} back
          </Link>

          <h2 className="token-section-title play-title">
            <span className="bracket">&lt;</span>
            <span>Play</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h2>

          <p className="play-subtitle">// 休息一下，玩个小游戏</p>

          {/* game tab switcher */}
          <div className="play-tabs">
            {(Object.keys(games) as GameId[]).map((id) => (
              <button
                key={id}
                className={`play-tab ${active === id ? 'play-tab-active' : ''}`}
                onClick={() => setActive(id)}
              >
                <span className="play-tab-label">{games[id].label}</span>
                <span className="play-tab-tag">{games[id].tag}</span>
              </button>
            ))}
          </div>

          {/* active game */}
          <div className="play-game-container">
            {active === 'dino' ? <DinoGame /> : active === 'surf' ? <SurfGame /> : <ShooterGame />}
          </div>

          {/* instructions for active game */}
          <div className="play-instructions">
            <h3 className="play-instructions-title">// controls</h3>
            <div className="play-instructions-grid">
              {instructions[active].items.map((item, i) => (
                <div key={i} className="play-instruction-item">
                  {item.split('  ').map((part, j) => {
                    const isKbd = j === 0 && !part.startsWith('触屏');
                    return isKbd ? (
                      <kbd key={j}>{part}</kbd>
                    ) : (
                      <span key={j}> {part}</span>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="play-instructions-note">{instructions[active].note}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Play;
