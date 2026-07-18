import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import AsciiBackground from '@/components/AsciiGallery/AsciiGallery';
import { Link } from 'react-router-dom';
import { Code, Cpu, Eye, Calculator, Rocket, FileText, BookOpen, Coffee } from 'lucide-react';
import { categories } from '@/data/categories';
import { notes } from '@/data/notes';
import '@/styles/pages/home.css';

const Home = () => {
  const techStack = [
    'C/C++', 'STM32', 'Python', 'JavaScript', 'React', 'Keil', 'OpenOCD',
    'PID Control', '卡尔曼滤波', 'CAN Bus', 'MPU6050', 'SWD调试',
    'HTML/CSS', 'Markdown', 'PowerShell', 'Qt', 'Linux',
  ];

  const iconMap: Record<string, React.ReactNode> = {
    frontend: <Code size={28} />,
    backend: <FileText size={28} />,
    embedded: <Cpu size={28} />,
    vision: <Eye size={28} />,
    math: <Calculator size={28} />,
    cpp: <Code size={28} />,
    projects: <Rocket size={28} />,
    misc: <FileText size={28} />,
  };

  const recentNotes = notes.slice(0, 5);

  return (
    <div className="home-page">
      <AsciiBackground />
      <Hero />

      {/* About Me Section */}
      <section className="about-section">
        <h2 className="token-section-title">
          <span className="bracket">&lt;</span>
          <span>About Me</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h2>
        <p className="section-subtitle">// 关于我，一个认真过日子的普通大学生</p>

        <div className="about-grid">
          <div className="about-text">
            <p className="drop-cap">
              你好，我是 hakii，一名热爱嵌入式开发的计算机专业学生。
              也是一名 RMer，在 VGD 战队里做嵌入式相关的工作，
              从 STM32 底层驱动到 PID 控制算法，从传感器数据融合到通信协议解析，
              每天都在和各种硬件打交道。
            </p>
            <p>
              什么都想学一点：前端写过 CSS、Markdown，后端折腾过服务器和 Qt，
              数学啃过卡尔曼滤波和欧拉图，C/C++ 从位运算搞到继承派生。
              学得不精，但乐在其中。
            </p>
            <blockquote>
              "把每一天过成奇怪但成立的样子。"
            </blockquote>
          </div>
          <div className="about-side">
            <h3>// skills</h3>
            <ul className="about-list">
              <li>STM32 / SWD调试 / OpenOCD</li>
              <li>PID控制 / 卡尔曼滤波</li>
              <li>CAN通信 / DMA双缓冲区</li>
              <li>MPU6050 / IMU零偏校准</li>
              <li>达妙电机 / 电机建模</li>
              <li>C/C++ / 位运算 / 指针</li>
              <li>HTML / CSS / Markdown</li>
              <li>Python / Qt / PowerShell</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Technologies I Know */}
      <section className="doing-section">
        <div className="doing-container">
          <h2 className="token-section-title">
            <span className="bracket">&lt;</span>
            <span>Technologies I Know</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h2>
          <p className="section-subtitle">// 会一点的东西</p>

          <div className="tech-cloud">
            {techStack.map((tech, index) => (
              <span
                key={tech}
                className="tech-tag animate-fade-in-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="about-section" style={{ paddingTop: '5rem' }}>
        <h2 className="token-section-title">
          <span className="bracket">&lt;</span>
          <span>Recent Posts</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h2>
        <p className="section-subtitle">// 最近上传的笔记</p>

        <div className="posts-list">
          {recentNotes.map((note, index) => (
            <Link
              key={note.id}
              to="/notes"
              className="post-item animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="post-prompt">❯</span>
              <div className="post-content">
                <h3 className="post-title">{note.title}</h3>
                <p className="post-summary">{note.summary}</p>
                <div className="post-meta">
                  <span className="post-date">[{note.date}]</span>
                  <span className="post-category">{note.tags.slice(0, 3).join(' / ')}</span>
                  <span className="post-readmore">Read more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/notes" className="token-link">
            <span className="link-prompt">❯</span>
            <span>View All Notes</span>
          </Link>
        </div>
      </section>

      {/* Study Categories */}
      <section className="doing-section">
        <div className="doing-container">
          <h2 className="token-section-title">
            <span className="bracket">&lt;</span>
            <span>Categories</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h2>
          <p className="section-subtitle">// 学习笔记分类</p>

          <div className="doing-grid">
            {categories.map((cat, index) => (
              <Link
                key={cat.id}
                to="/study"
                className="doing-item animate-fade-in-up"
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  animationDelay: `${index * 50}ms` 
                }}
              >
                <div className="doing-item-icon">
                  {iconMap[cat.id] || <FileText size={28} />}
                </div>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
                <span className="cat-count">{cat.noteCount} 篇笔记</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What I'm Doing */}
      <section className="about-section" style={{ paddingTop: '5rem' }}>
        <h2 className="token-section-title">
          <span className="bracket">&lt;</span>
          <span>What I'm Doing</span>
          <span className="slash"> /</span>
          <span className="bracket">&gt;</span>
        </h2>
        <p className="section-subtitle">// 最近在干嘛</p>

        <div className="doing-grid">
          <DoingItem icon={<Cpu size={28} />} title="搞 RoboMaster" desc="调车、调麦轮、调 PID，在实验室待到凌晨是常态。" />
          <DoingItem icon={<BookOpen size={28} />} title="啃理论" desc="卡尔曼滤波、电机建模、传递函数，数学物理一块儿补。" />
          <DoingItem icon={<Code size={28} />} title="折腾嵌入式" desc="STM32、SWD调试、OpenOCD、CAN通信、DMA双缓冲区，底层硬啃。" />
          <DoingItem icon={<FileText size={28} />} title="写笔记" desc="把学到的东西整理成 Markdown，好记性不如烂键盘。" />
          <DoingItem icon={<Rocket size={28} />} title="打比赛" desc="VGD 2026 Dart，裁判系统、通信协议、电机控制，实战中成长。" />
          <DoingItem icon={<Coffee size={28} />} title="想放假" desc="坐高铁回家，吃妈妈做的饭，睡到自然醒。" />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Life</h2>
        <p>不写代码的时候都在干嘛呢？</p>
        <div className="cta-buttons">
          <Link to="/life" className="token-link">
            <span className="link-prompt">❯</span>
            <span>cd /life</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function DoingItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="doing-item">
      <div className="doing-item-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default Home;
