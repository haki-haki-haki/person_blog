import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home', labelCn: '首页' },
    { path: '/study', label: 'Study', labelCn: '学习' },
    { path: '/notes', label: 'Notes', labelCn: '笔记' },
    { path: '/diary', label: 'Diary', labelCn: '日记' },
    { path: '/life', label: 'Life', labelCn: '生活' },
    { path: '/ghostty', label: 'Ghostty', labelCn: '动态字符' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`token-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="token-nav-inner">
        <Link to="/" className="token-nav-logo">
          <span className="logo-bracket">[</span>
          <span className="logo-text">hakii</span>
          <span className="logo-bracket">]</span>
        </Link>

        <div className={`token-nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`token-nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              <span className="link-bracket">&lt;</span>
              <span className="link-text">{link.label}</span>
              <span className="link-bracket"> /&gt;</span>
            </Link>
          ))}
          <a
            href="https://github.com/haki-haki-haki"
            target="_blank"
            rel="noopener noreferrer"
            className="token-nav-github"
          >
            GitHub
          </a>
        </div>

        <button
          className="token-nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
