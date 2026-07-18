import { Github, Mail, Heart, Coffee } from 'lucide-react';
import './footer.css';

const Footer = () => {
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
