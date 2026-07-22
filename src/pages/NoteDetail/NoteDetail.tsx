import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeMermaid from 'rehype-mermaid';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import c from 'react-syntax-highlighter/dist/esm/languages/hljs/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import powershell from 'react-syntax-highlighter/dist/esm/languages/hljs/powershell';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import plaintext from 'react-syntax-highlighter/dist/esm/languages/hljs/plaintext';
import mermaid from 'mermaid';
import { ArrowLeft, Calendar, Folder } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getNoteById } from '@/data/notes';
import { getNoteContentByFilePath } from '@/data/noteTree';
import { categories } from '@/data/categories';
import '@/styles/pages/note-detail.css';
import 'katex/dist/katex.min.css';

SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('c++', cpp);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('powershell', powershell);
SyntaxHighlighter.registerLanguage('ps1', powershell);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('plaintext', plaintext);
SyntaxHighlighter.registerLanguage('text', plaintext);
SyntaxHighlighter.registerLanguage('', plaintext);

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#1a1a2e',
    primaryTextColor: '#e0e0e0',
    primaryBorderColor: '#333',
    lineColor: '#666',
    secondaryColor: '#16213e',
    tertiaryColor: '#0f3460',
  },
});

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const note = getNoteById(id || '');

  useEffect(() => {
    if (!note) {
      setLoading(false);
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      try {
        const raw = await getNoteContentByFilePath(note.filePath);
        setContent(raw || '');
      } catch {
        setContent('');
      }
      setLoading(false);
    };

    loadContent();
  }, [id]);

  useEffect(() => {
    if (content && !loading) {
      setTimeout(() => {
        mermaid.run();
      }, 100);
    }
  }, [content, loading]);

  const category = categories.find(c => c.id === note?.category);

  const preprocessMarkdown = (md: string): string => {
    let processed = md;
    processed = processed.replace(/\[TOC\]/gi, '');
    processed = processed.replace(/\\&amp;/g, '&amp;');
    processed = processed.replace(/\\&lt;/g, '&lt;');
    processed = processed.replace(/\\&gt;/g, '&gt;');
    processed = processed.replace(/\\&quot;/g, '&quot;');

    // 将 LaTeX 环境语法（\begin{align*}...\end{align*} 等）转换为 $$...$$ 格式
    // 不管外面包裹的是 $ 还是 $$，一律提取为块级 $$...$$
    // 分两步：先处理被 $ 包裹的行内情况，再处理独立的
    // 情况1: $ \begin{align*}... $ → $$ ... $$
    processed = processed.replace(
      /\$\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}\s*\$/g,
      (_match: string, env: string, content: string) => {
        return `$$\n${content.trim()}\n$$`;
      }
    );
    // 情况2: $$ \begin{...}... $$ → $$ ... $$（去掉内部的 begin/end 标记）
    processed = processed.replace(
      /\$\$\s*\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}\s*\$\$/g,
      (_match: string, _env: string, content: string) => {
        return `$$\n${content.trim()}\n$$`;
      }
    );
    // 情况3: 独立的 \begin{...}...\end{...}（无 $ 包裹）→ $$ ... $$
    processed = processed.replace(
      /(?<!\$)\\begin\{(align\*?|equation\*?|gather\*?|split|multline\*?|cases)\}([\s\S]*?)\\end\{\1\}(?!\$)/g,
      (_match: string, _env: string, content: string) => {
        return `$$\n${content.trim()}\n$$`;
      }
    );

    // 保护数学公式块（$$...$$ 和 $...$），避免被后续转义处理破坏
    const mathBlocks: string[] = [];
    // 先保护 $$...$$ 块
    processed = processed.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      mathBlocks.push(match);
      return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
    });
    // 再保护 $...$ 行内公式
    processed = processed.replace(/\$[^\n$]+?\$/g, (match) => {
      mathBlocks.push(match);
      return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
    });

    processed = processed.replace(/\\([#*\-_~`>\[\](){}|.!])/g, '$1');
    processed = processed.replace(
      /<img\s+[^>]*src="file:\/\/\/[^"]*"[^>]*\/?>/gi,
      '<div class="image-placeholder image-external"><span class="placeholder-icon">📁</span><span class="placeholder-text">图片位于本地路径，无法在网页中显示</span></div>'
    );
    processed = processed.replace(
      /!\[([^\]]*)\]\(file:\/\/\/[^)]+\)/gi,
      '<div class="image-placeholder image-external"><span class="placeholder-icon">📁</span><span class="placeholder-text">图片 "$1" 位于本地路径，无法在网页中显示</span></div>'
    );
    // 将 /notes-images/ 开头的路径自动加上 base URL，适配 GitHub Pages 子路径部署
    const base = import.meta.env.BASE_URL || '/';
    processed = processed.replace(
      /!\[([^\]]*)\]\((\/notes-images\/[^)]+)\)/gi,
      `![$1](${base.replace(/\/$/, '')}$2)`
    );

    // 恢复数学公式块
    processed = processed.replace(/@@MATH_BLOCK_(\d+)@@/g, (_, idx) => mathBlocks[parseInt(idx)]);

    return processed;
  };

  const MermaidBlock = ({ code }: { code: string }) => {
    const [svgContent, setSvgContent] = useState<string>('');

    useEffect(() => {
      const renderMermaid = async () => {
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}`, code);
          setSvgContent(svg);
        } catch {
          setSvgContent('');
        }
      };
      renderMermaid();
    }, [code]);

    return (
      <div 
        style={{ 
          background: '#1a1a2e', 
          padding: '1.5rem', 
          borderRadius: '8px',
          margin: '1rem 0',
          overflow: 'auto'
        }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  };

  const CustomCodeBlock = ({ className, children, ...props }: any) => {
    let lang = '';
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      lang = match[1];
    } else {
      if (children && typeof children === 'object' && children.props) {
        const innerMatch = /language-(\w+)/.exec(children.props.className || '');
        if (innerMatch) {
          lang = innerMatch[1];
        }
      }
    }
    const codeString = typeof children === 'string' 
      ? children.replace(/\n$/, '')
      : (children.props?.children || '').replace(/\n$/, '');

    if (lang.toLowerCase() === 'mermaid') {
      return <MermaidBlock code={codeString} />;
    }

    const knownLangs = ['c', 'cpp', 'c++', 'css', 'javascript', 'js', 'python', 'py', 'bash', 'shell', 'sh', 'powershell', 'ps1', 'json', 'plaintext', 'text', 'html', 'xml', 'md', 'markdown', 'yaml', 'yml', 'makefile', 'cmake', 'dockerfile', 'ini', 'sql'];
    const isKnown = !lang || knownLangs.includes(lang.toLowerCase());
    const actualLang = lang.toLowerCase() === 'c++' ? 'cpp' : lang.toLowerCase();

    if (isKnown && lang) {
      return (
        <SyntaxHighlighter
          style={atomOneDark}
          language={actualLang}
          PreTag="div"
          customStyle={{
            borderRadius: '8px',
            margin: '1rem 0',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            padding: '1rem 1.25rem',
            background: '#1a1a2e',
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      );
    }

    return (
      <pre className={`code-block ${lang ? `lang-${lang}` : ''}`}>
        <code className={className}>{children}</code>
      </pre>
    );
  };

  if (!note) {
    return (
      <div className="note-detail-page">
        <Navbar />
        <div className="note-detail-container note-not-found">
          <h2>Note Not Found</h2>
          <p>找不到这篇笔记，可能已经被删除了</p>
          <button className="token-link" onClick={() => navigate('/study')}>
            <span className="link-prompt">❯</span>
            <span>cd /study</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="note-detail-page">
      <Navbar />
      <div className="note-detail-container">
        <button className="back-to-study" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          返回
        </button>

        <header className="note-detail-header">
          <p className="note-detail-category">
            {category?.nameEn || 'Misc'} / {category?.name || '杂项'}
          </p>
          <h1 className="note-detail-title">{note.title}</h1>
          <div className="note-detail-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} />
              {note.date}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={16} />
              {category?.name}
            </span>
          </div>
          <div className="note-tags-row">
            {note.tags.map(tag => (
              <span key={tag} className="note-tag-item">
                #{tag}
              </span>
            ))}
          </div>
        </header>

        <article className="note-detail-content markdown-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: '#999' }}>加载中...</p>
            </div>
          ) : content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{ pre: CustomCodeBlock }}
              skipHtml={false}
            >
              {preprocessMarkdown(content)}
            </ReactMarkdown>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <p style={{ color: '#999' }}>这篇笔记还没有内容，请先在 笔记 目录下创建对应的 .md 文件</p>
            </div>
          )}
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default NoteDetail;
