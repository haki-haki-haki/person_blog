import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AsciiBackground from '@/components/AsciiGallery/AsciiGallery';
import Lightbox from '@/components/Lightbox/Lightbox';
import { journalEntries } from '@/data/photos';
import '@/styles/pages/life.css';

const Life = () => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const filmstripRef = useRef<HTMLDivElement>(null);

  // 用户上传照片后放到 public/life-photos/ 目录，命名规则 photo-1.jpg ~ photo-N.jpg
  // 胶卷相框数量（根据实际照片数量调整）
  const filmFrameCount = 9;
  const filmImages = Array.from({ length: filmFrameCount }, (_, i) => `/life-photos/photo-${i + 1}.jpg`);

  // Lightbox 状态
  const [lightboxOpen, setLightboxOpen] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="life-page">
      <AsciiBackground />
      <Navbar />

      <section className="life-hero">
        <p className="study-hero-prompt">
          <span className="prompt-dollar">$</span>
          cd /life
        </p>
        <h1 className="token-section-title" style={{ marginBottom: '0.75rem' }}>
          <span className="bracket">&lt;</span>
          <span>Life</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h1>
        <p className="section-subtitle" style={{ marginBottom: 0 }}>
          不写代码的时候<span className="green-accent">都在干嘛呢</span>
        </p>
      </section>

      {/* 3D 胶卷墙 */}
      <section className="filmstrip-section" ref={filmstripRef}>
        <h2 className="study-section-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <span className="bracket">&lt;</span>
          <span>Filmstrip</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="green-accent">移动鼠标</span>浏览胶卷 · 把你的照片放到 <code>public/life-photos/</code> 目录
        </p>

        <div className="filmstrip-container">
          <div
            className="filmstrip-wall"
            style={{
              transform: `
                rotateX(${(mousePos.y - 0.5) * 15}deg)
                rotateY(${(mousePos.x - 0.5) * 20}deg)
              `,
            }}
          >
            {Array.from({ length: filmFrameCount }).map((_, i) => (
              <div
                key={i}
                className="film-frame"
                style={{
                  transform: `
                    translateZ(${Math.abs(i - filmFrameCount / 2) * 20}px)
                    rotateY(${(i - filmFrameCount / 2) * 5}deg)
                  `,
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div className="film-strip">
                  <div className="film-perforations">
                    {Array.from({ length: 14 }).map((_, j) => (
                      <div key={j} className="film-hole" />
                    ))}
                  </div>
                  <div className="film-image-area" onClick={() => setLightboxOpen(i)}>
                    <img
                      src={`/life-photos/photo-${i + 1}.jpg`}
                      alt={`photo ${i + 1}`}
                      className="film-photo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                        if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                      }}
                    />
                    <div className="film-placeholder" style={{ display: 'none' }}>
                      <span className="placeholder-frame-number">{i + 1}</span>
                      <span className="placeholder-hint">放入照片</span>
                    </div>
                  </div>
                  <div className="film-perforations right">
                    {Array.from({ length: 14 }).map((_, j) => (
                      <div key={j} className="film-hole" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 日记 */}
      <section className="journal-section">
        <div className="journal-container">
          <h2 className="study-section-title" style={{ marginBottom: '0.75rem' }}>
            <span className="bracket">&lt;</span>
            <span>Journal</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h2>
          <p className="section-subtitle">一些<span className="green-accent">碎碎念</span></p>

          <div className="journal-list">
            {journalEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="journal-item animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="journal-date">
                  <div className="journal-day">{entry.day}</div>
                  <div className="journal-month">{entry.month}</div>
                </div>
                <div className="journal-content">
                  <h3 className="journal-title">
                    <span style={{ color: '#00ff88', marginRight: '0.5rem' }}>❯</span>
                    {entry.title}
                  </h3>
                  <p>{entry.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen !== null && (
        <Lightbox
          images={filmImages}
          currentIndex={lightboxOpen}
          onClose={() => setLightboxOpen(null)}
          onNavigate={(idx) => setLightboxOpen(idx)}
        />
      )}

      <Footer />
    </div>
  );
};

export default Life;
