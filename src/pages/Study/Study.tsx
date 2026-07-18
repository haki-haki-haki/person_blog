import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AsciiBackground from '@/components/AsciiGallery/AsciiGallery';
import { categories } from '@/data/categories';
import { notes, getNotesByCategory } from '@/data/notes';
import '@/styles/pages/study.css';

const quickLinks = [
  {
    title: 'RoboMaster 官网',
    desc: '大疆 RoboMaster 机甲大师赛',
    url: 'https://www.robomaster.com/zh-CN',
    icon: '🤖',
    color: '#FF6B6B',
    category: '电控 & 机器人',
  },
  {
    title: '菜鸟教程',
    desc: '编程入门学习网站',
    url: 'https://www.runoob.com/?lailu=hao.sd978.com',
    icon: '📘',
    color: '#4ECDC4',
    category: '编程学习',
  },
  {
    title: '飞书知识库',
    desc: 'VGD 战队知识文档',
    url: 'https://gl1po2nscb.feishu.cn/wiki/VYrlwHI7liHzXIkx0s0cUOVdnzb',
    icon: '📋',
    color: '#A78BFA',
    category: '编程学习',
  },
  {
    title: 'W3Schools',
    desc: 'Web 前端开发教程',
    url: 'https://www.w3schools.com/html/default.asp',
    icon: '🌐',
    color: '#45B7D1',
    category: '编程学习',
  },
  {
    title: 'Gitee 仓库',
    desc: '我的 Gitee 代码仓库',
    url: 'https://gitee.com/spirit-guard',
    icon: '🔧',
    color: '#FF8A5C',
    category: '我的仓库',
  },
  {
    title: '个人博客',
    desc: 'Hakii 的旧版博客',
    url: 'https://haki-haki-haki.github.io/myblog_new/?p=index',
    icon: '🏠',
    color: '#FFE66D',
    category: '我的网站',
  },
];

const Study = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(category || '');

  useEffect(() => {
    setSelectedCategory(category || '');
  }, [category]);

  const currentCategory = categories.find(c => c.id === selectedCategory);
  const filteredNotes = selectedCategory ? getNotesByCategory(selectedCategory) : [];

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    navigate(`/study/${catId}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory('');
    navigate('/study');
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  return (
    <div className="study-page">
      <AsciiBackground />
      <Navbar />

      <section className="study-hero">
        <p className="study-hero-prompt">
          <span className="prompt-dollar">$</span>
          cd /study
        </p>
        <h1 className="token-section-title" style={{ marginBottom: '0.75rem' }}>
          <span className="bracket">&lt;</span>
          <span>Study Notes</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h1>
        <p className="section-subtitle" style={{ marginBottom: 0 }}>
          记录学习过程中的点点滴滴，有技术有感悟
        </p>
      </section>

      {/* 常用链接 — 放在最上面 */}
      <section className="quicklinks-section">
        <h2 className="study-section-title">
          <span className="bracket">&lt;</span>
          <span>Quick Links</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h2>

        <div className="quicklinks-simple">
          {quickLinks.map((link, idx) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ql-link animate-fade-in-up"
              style={{ '--accent': link.color, animationDelay: `${idx * 60}ms` } as React.CSSProperties}
            >
              <span className="ql-dot" />
              <span className="ql-link-title">{link.title}</span>
              <span className="ql-link-desc">— {link.desc}</span>
            </a>
          ))}
        </div>
      </section>

      {!selectedCategory ? (
        <section className="categories-section">
          <h2 className="study-section-title">
            <span className="bracket">&lt;</span>
            <span>Categories</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h2>
          <p className="section-subtitle">
            共 {notes.length} 篇笔记，{categories.length} 个分类
          </p>

          <div className="categories-grid">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className="category-card animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <div className="cat-card-icon">{cat.icon}</div>
                <h3 className="cat-card-title">
                  <span className="cat-prompt">❯</span>
                  {cat.name}
                </h3>
                <p className="cat-card-en">{cat.nameEn}</p>
                <p className="cat-card-desc">{cat.description}</p>
                <p className="cat-card-count">
                  // {cat.noteCount} notes
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="notes-section">
          <div className="notes-header">
            <button className="back-btn" onClick={handleBackToCategories}>
              <ArrowLeft size={16} />
              ../
            </button>
            <h2 className="notes-title">
              <span className="bracket">&lt;</span>
              <span>{currentCategory?.name}</span>
              <span className="slash"> /</span>
              <span className="bracket">&gt;</span>
            </h2>
            <span className="notes-count-tag">{filteredNotes.length} notes</span>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="notes-list">
              {filteredNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="note-item animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleNoteClick(note.id)}
                >
                  <span className="note-prompt">❯</span>
                  <div className="note-content">
                    <h3 className="note-title">{note.title}</h3>
                    <p className="note-summary">{note.summary}</p>
                    <div className="note-footer">
                      <span className="note-date">[{note.date}]</span>
                      <div className="note-tags">
                        {note.tags.map(tag => (
                          <span key={tag} className="note-tag">#{tag}</span>
                        ))}
                      </div>
                      <span className="note-readmore">Read more →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <BookOpen size={48} />
              </div>
              <p className="empty-text">// 这个分类下还没有笔记</p>
              <p className="empty-sub">敬请期待...</p>
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Study;
