import { Globe, Palette } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import './settings.css';

const Settings = () => {
  const { language, toggleLanguage, isBlackWhite, toggleBlackWhite } = useStore();
  const t = translations[language];

  return (
    <div className="settings-container">
      <button 
        className="settings-btn"
        onClick={toggleLanguage}
        title={t.language}
      >
        <Globe size={18} />
        <span className="settings-text">{language === 'zh' ? 'EN' : '中'}</span>
      </button>
      <button 
        className={`settings-btn ${isBlackWhite ? 'active' : ''}`}
        onClick={toggleBlackWhite}
        title={isBlackWhite ? t.normalMode : t.blackWhite}
      >
        <Palette size={18} />
        <span className="settings-text">BW</span>
      </button>
    </div>
  );
};

export default Settings;
