import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Folder, FileText, ChevronLeft, ChevronRight, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AsciiBackground from '@/components/AsciiGallery/AsciiGallery';
import Tree from '@/components/Tree/Tree';
import { loadNoteTree, TreeNode, getNoteContent } from '@/data/noteTree';
import '@/styles/pages/notes.css';
import 'katex/dist/katex.min.css';

// Register languages for syntax highlighting
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

const Notes = () => {
  const { notePath } = useParams<{ notePath?: string }>();
  const navigate = useNavigate();
  
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['notes-root']));
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarZoom, setSidebarZoom] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true);
      const tree = await loadNoteTree();
      setTreeData(tree);
      setLoading(false);
    };
    loadTree();
  }, []);

  useEffect(() => {
    if (noteContent) {
      setTimeout(() => {
        mermaid.run();
      }, 100);
    }
  }, [noteContent]);

  useEffect(() => {
    if (treeData && notePath) {
      const encodedPath = decodeURIComponent(notePath);
      
      const findAndSelect = (node: TreeNode): boolean => {
        if (node.path && node.path.includes(encodedPath)) {
          setSelectedNode(node);
          setExpandedKeys(prev => {
            const newKeys = new Set(prev);
            let current = node.id;
            while (current && current !== 'notes-root') {
              newKeys.add(current);
              const parts = current.split('/');
              parts.pop();
              current = parts.join('/') || '';
            }
            newKeys.add('notes-root');
            return newKeys;
          });
          
          if (node.type === 'file') {
            loadNoteContent(node.path);
          }
          return true;
        }
        
        if (node.children) {
          for (const child of node.children) {
            if (findAndSelect(child)) {
              setExpandedKeys(prev => {
                const newKeys = new Set(prev);
                newKeys.add(node.id);
                return newKeys;
              });
              return true;
            }
          }
        }
        return false;
      };
      
      findAndSelect(treeData);
    }
  }, [treeData, notePath]);

  const loadNoteContent = async (path: string) => {
    const content = await getNoteContent(path);
    setNoteContent(content || '');
  };

  const handleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const newKeys = new Set(prev);
      if (newKeys.has(key)) {
        newKeys.delete(key);
      } else {
        newKeys.add(key);
      }
      return newKeys;
    });
  };

  const handleSelect = (node: TreeNode) => {
    setSelectedNode(node);
    
    if (node.type === 'file') {
      const relativePath = node.path.replace('/笔记/', '');
      navigate(`/notes/${encodeURIComponent(relativePath)}`);
      loadNoteContent(node.path);
    } else {
      navigate('/notes');
      setNoteContent('');
    }
  };

  const getFileCount = (node: TreeNode): number => {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((count, child) => count + getFileCount(child), 0);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!sidebarCollapsed) {
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
    }
  }, [sidebarCollapsed, sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(200, Math.min(500, startWidthRef.current + deltaX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const preprocessMarkdown = (content: string): string => {
    let processed = content;
    
    // Remove [TOC] markers
    processed = processed.replace(/\[TOC\]/gi, '');
    
    // Fix Typora escaped HTML entities: \&amp; -> &amp;
    processed = processed.replace(/\\&amp;/g, '&amp;');
    processed = processed.replace(/\\&lt;/g, '&lt;');
    processed = processed.replace(/\\&gt;/g, '&gt;');
    processed = processed.replace(/\\&quot;/g, '&quot;');
    
    // Fix Typora escaped characters (backslash before special chars)
    // These are Typora's way of escaping special characters that should render as-is
    processed = processed.replace(/\\([#*\-_~`>\[\](){}|.!])/g, '$1');
    
    // Replace broken local file img tags with placeholders
    processed = processed.replace(
      /<img\s+[^>]*src="file:\/\/\/[^"]*"[^>]*\/?>/gi,
      '<div class="image-placeholder image-external"><span class="placeholder-icon">📁</span><span class="placeholder-text">图片位于本地路径，无法在网页中显示</span></div>'
    );
    
    // Replace local file path markdown images
    processed = processed.replace(
      /!\[([^\]]*)\]\(file:\/\/\/[^)]+\)/gi,
      '<div class="image-placeholder image-external"><span class="placeholder-icon">📁</span><span class="placeholder-text">图片 "$1" 位于本地路径，无法在网页中显示</span></div>'
    );
    
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
    
    // mermaid 代码块使用专门的处理
    if (lang.toLowerCase() === 'mermaid') {
      return <MermaidBlock code={codeString} />;
    }
    
    // 只对已知语言启用高亮，其他特殊语言用普通 pre
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
    
    // 对其他特殊语言保持原样
    return (
      <pre className={`code-block ${lang ? `lang-${lang}` : ''}`}>
        <code className={className}>{children}</code>
      </pre>
    );
  };

  return (
    <div className="notes-page">
      <AsciiBackground />
      <Navbar />

      <section className="notes-header-section">
        <div className="notes-header-content">
          <p className="notes-header-prompt">
            <span className="prompt-dollar">$</span>
            cd /notes
          </p>
          <h1 className="token-section-title" style={{ marginBottom: '0.75rem' }}>
            <span className="bracket">&lt;</span>
            <span>Notes Library</span>
            <span className="slash"> /</span>
            <span className="bracket">&gt;</span>
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            个人知识库，<span className="green-accent">记录学习</span>和思考
          </p>
        </div>
      </section>

      <div 
        ref={containerRef}
        className="notes-container"
        style={{ cursor: isResizing ? 'col-resize' : 'default' }}
      >
        <aside 
          className={`notes-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          style={{ 
            width: sidebarCollapsed ? 48 : sidebarWidth,
            minWidth: sidebarCollapsed ? 48 : sidebarWidth,
            transition: isResizing ? 'none' : 'width 0.3s ease'
          }}
        >
          <div className="sidebar-header">
            <div className="sidebar-title">
              <Folder size={16} />
              <span>笔记目录</span>
            </div>
            {treeData && (
              <span className="sidebar-count">
                {getFileCount(treeData)} 篇笔记
              </span>
            )}
          </div>

          <div className="sidebar-controls">
            <button 
              className="sidebar-zoom-btn"
              onClick={() => setSidebarZoom(z => Math.max(0.75, z - 0.1))}
              title="缩小"
            >
              <ZoomOut size={12} />
            </button>
            <button 
              className="sidebar-zoom-btn"
              onClick={() => setSidebarZoom(z => Math.min(1.5, z + 0.1))}
              title="放大"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          <div 
            className="sidebar-tree"
            style={{ transform: `scale(${sidebarZoom})`, transformOrigin: 'top left' }}
          >
            {loading ? (
              <div className="sidebar-loading">
                <RefreshCw size={16} className="loading-spinner" />
                <span>加载中...</span>
              </div>
            ) : treeData ? (
              <Tree
                node={treeData}
                expandedKeys={expandedKeys}
                selectedKey={selectedNode?.id || null}
                onExpand={handleExpand}
                onSelect={handleSelect}
              />
            ) : (
              <div className="sidebar-empty">
                <FileText size={24} />
                <p>暂无笔记</p>
              </div>
            )}
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {!sidebarCollapsed && (
            <div 
              className="sidebar-resize-handle"
              onMouseDown={handleMouseDown}
            />
          )}
        </aside>

        <main className="notes-content">
          {selectedNode?.type === 'file' ? (
            <div className="note-preview">
              <header className="note-preview-header">
                <h2 className="note-preview-title">{selectedNode.name}</h2>
                <div className="note-preview-path">
                  <span className="path-prompt">❯</span>
                  {selectedNode.path.replace('/笔记/', '')}
                </div>
              </header>
              
              <article className="note-preview-body markdown-body">
                {noteContent ? (
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      pre: CustomCodeBlock,
                    }}
                    skipHtml={false}
                  >
                    {preprocessMarkdown(noteContent)}
                  </ReactMarkdown>
                ) : (
                  <div className="note-loading">
                    <RefreshCw size={20} className="loading-spinner" />
                    <span>加载内容...</span>
                  </div>
                )}
              </article>
            </div>
          ) : (
            <div className="notes-welcome">
              <div className="welcome-icon">
                <FileText size={64} />
              </div>
              <h2 className="welcome-title">选择一篇笔记</h2>
              <p className="welcome-text">
                从左侧目录树中选择一篇笔记，在这里查看内容
              </p>
              {treeData && (
                <div className="welcome-stats">
                  <div className="stat-item">
                    <span className="stat-number">{treeData.children?.length || 0}</span>
                    <span className="stat-label">分类</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{getFileCount(treeData)}</span>
                    <span className="stat-label">笔记</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Notes;