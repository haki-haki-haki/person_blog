import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import myPortrait from '@/assets/my-portrait.txt?raw';
import myPortraitLeft from '@/assets/my-portrait-left.txt?raw';
import VisitorGreeting from '@/components/VisitorGreeting/VisitorGreeting';

const Hero = () => {
  const [showCursor, setShowCursor] = useState(true);
  const { language } = useStore();
  const t = translations[language];

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <section className="ghostty-hero">
      <div className="ghostty-bg" />
      
      <nav className="ghostty-nav">
        <div className="ghostty-nav-left">
          <span className="ghostty-nav-btn">Token</span>
        </div>
        <div className="ghostty-nav-right">
          <Link to="/study">{t.blog}</Link>
          <a href="https://github.com/haki-haki-haki" target="_blank" rel="noopener noreferrer">{t.github}</a>
          <a href="https://github.com/haki-haki-haki" target="_blank" rel="noopener noreferrer">{t.source}</a>
        </div>
      </nav>

      <div className="ghostty-content">
        <div className="ghostty-portrait-left-wrapper">
          <pre className="ghostty-portrait-left">{myPortraitLeft}</pre>
        </div>

        <div className="ghostty-info">
          <h1 className="ghostty-title">
            <span className="title-bracket">&lt;</span>
            <span className="title-name">hakii</span>
            <span className="title-slash"> /</span>
            <span className="title-bracket">&gt;</span>
            <span 
              className="title-cursor"
              style={{ opacity: showCursor ? 1 : 0 }}
            >
              _
            </span>
          </h1>
          <p className="ghostty-subtitle">
            {t.subtitle}
          </p>
          <VisitorGreeting />
          <div className="ghostty-actions">
            <Link to="/study" className="ghostty-link">
              <span className="link-arrow">→</span>
              <span>{t.studyLink}</span>
            </Link>
            <Link to="/life" className="ghostty-link">
              <span className="link-arrow">→</span>
              <span>{t.lifeLink}</span>
            </Link>
          </div>
        </div>

        <div className="ghostty-portrait-right-wrapper">
          <pre className="ghostty-portrait-right">{myPortrait}</pre>
        </div>
      </div>

      <div className="ghostty-scroll" onClick={() => {
        const about = document.querySelector('.about-section');
        if (about) about.scrollIntoView({ behavior: 'smooth' });
      }}>
        <span>{t.scrollDown}</span>
        <ChevronDown size={20} className="scroll-bounce" />
      </div>
    </section>
  );
};

export default Hero;