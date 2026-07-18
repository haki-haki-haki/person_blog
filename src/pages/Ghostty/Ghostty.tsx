import Navbar from '@/components/Navbar/Navbar';
import GhosttyAnimation from '@/components/GhosttyAnimation/GhosttyAnimation';
import Footer from '@/components/Footer/Footer';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';

const Ghostty = () => {
  const { language } = useStore();
  const t = translations[language];

  return (
    <div className="ghostty-page">
      <Navbar />
      <main className="ghostty-main">
        <div className="ghostty-content">
          <div className="ghostty-animation-container">
            <GhosttyAnimation />
          </div>
          <div className="ghostty-info">
            <h2 className="ghostty-title">
              <span className="title-bracket">&lt;</span>
              <span className="title-name">Ghostty</span>
              <span className="title-bracket"> /&gt;</span>
            </h2>
            <p className="ghostty-desc">
              {t.ghosttyDesc}
            </p>
            <div className="ghostty-links">
              <a href="https://ghostty.org/" target="_blank" rel="noopener noreferrer" className="ghostty-link">
                {t.visitOriginal}
              </a>
              <a href="/" className="ghostty-link">
                {t.backHome}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Ghostty;
