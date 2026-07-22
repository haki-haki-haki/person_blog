import { Github, Mail, Heart, Coffee, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import './footer.css';

// 本站首次提交到 GitHub 的时间
const SITE_BIRTH = new Date('2026-07-18T18:39:22+08:00');

function useUptime() {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = now - SITE_BIRTH.getTime();
      const totalSeconds = Math.floor(diff / 1000);

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n: number) => String(n).padStart(2, '0');
      setElapsed(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return elapsed;
}

const Footer = () => {
  const uptime = useUptime();

  return (
    <footer className="token-footer">
      <div className="token-footer-inner">
        <div className="footer-tagline">
          <p className="footer-quote">
            "一个认真过日子的普通大学生。"
          </p>
          <p className="footer-keywords">
            纯白 · 手绘 · 怪诞 · 留白
          </p>
        </div>

        <div className="footer-bottom">
          <div className="footer-uptime">
            <ShieldCheck size={14} />
            <span>本站已安全运行</span>
            <span className="footer-uptime-value">{uptime}</span>
          </div>

          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/study">Study</a>
            <a href="/life">Life</a>
            <a
              href="https://github.com/haki-haki-haki"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github size={14} />
              GitHub
            </a>
            <a href="mailto:hakii@example.com">
              <Mail size={14} />
              Email
            </a>
          </div>

          <div className="footer-copy">
            <p>
              © {new Date().getFullYear()} hakii. Made with
              <Heart size={12} style={{ margin: '0 4px' }} />
              and
              <Coffee size={12} style={{ margin: '0 4px' }} />
            </p>
            <p className="footer-terminal">
              $ exit
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
