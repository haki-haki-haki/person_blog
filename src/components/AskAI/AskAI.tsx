import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pin, PinOff, Send, X } from 'lucide-react';
import './ask-ai.css';

/* ---- Hakii Cat icon — a custom cat with headset & tail ---- */
type IconProps = { size?: number; className?: string };

const HakiCatIcon = ({ size = 20, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    {/* body — sitting oval */}
    <ellipse cx="12" cy="17" rx="5" ry="4.5" fill="currentColor" />
    {/* head */}
    <circle cx="12" cy="10.5" r="4.5" fill="currentColor" />
    {/* left ear */}
    <polygon points="8.5,7 7,2.5 10.5,6" fill="currentColor" />
    {/* right ear */}
    <polygon points="15.5,7 17,2.5 13.5,6" fill="currentColor" />
    {/* inner left ear */}
    <polygon points="8.8,6.5 7.8,3.8 10.2,6" fill="var(--ask-ai-icon-inner, rgba(255,255,255,0.25))" />
    {/* inner right ear */}
    <polygon points="15.2,6.5 16.2,3.8 13.8,6" fill="var(--ask-ai-icon-inner, rgba(255,255,255,0.25))" />
    {/* eyes */}
    <circle cx="10.2" cy="10" r="0.9" fill="var(--ask-ai-icon-eye, #fff)" />
    <circle cx="13.8" cy="10" r="0.9" fill="var(--ask-ai-icon-eye, #fff)" />
    {/* pupils */}
    <circle cx="10.5" cy="9.8" r="0.45" fill="var(--ask-ai-icon-pupil, #111)" />
    <circle cx="14.1" cy="9.8" r="0.45" fill="var(--ask-ai-icon-pupil, #111)" />
    {/* nose */}
    <ellipse cx="12" cy="11.3" rx="0.55" ry="0.4" fill="var(--ask-ai-icon-nose, #ff9eb1)" />
    {/* mouth */}
    <path d="M11.3 11.7 Q12 12.3 12.7 11.7" stroke="var(--ask-ai-icon-nose, #ff9eb1)" strokeWidth="0.45" fill="none" strokeLinecap="round" />
    {/* whiskers */}
    <line x1="7.5" y1="11" x2="9.5" y2="10.6" stroke="var(--ask-ai-icon-whisker, rgba(255,255,255,0.55))" strokeWidth="0.35" />
    <line x1="7.5" y1="12" x2="9.5" y2="11.8" stroke="var(--ask-ai-icon-whisker, rgba(255,255,255,0.55))" strokeWidth="0.35" />
    <line x1="16.5" y1="11" x2="14.5" y2="10.6" stroke="var(--ask-ai-icon-whisker, rgba(255,255,255,0.55))" strokeWidth="0.35" />
    <line x1="16.5" y1="12" x2="14.5" y2="11.8" stroke="var(--ask-ai-icon-whisker, rgba(255,255,255,0.55))" strokeWidth="0.35" />
    {/* front paws */}
    <ellipse cx="9" cy="20.5" rx="1.5" ry="1" fill="currentColor" />
    <ellipse cx="15" cy="20.5" rx="1.5" ry="1" fill="currentColor" />
    {/* tail — curling up to the right */}
    <path
      d="M17 18 Q20 17 20.5 14.5 Q21 12 18.5 11.5"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

type Source = {
  id: string;
  title: string;
  category: string;
  heading: string;
  path: string;
  excerpt: string;
};

type AiIndexChunk = {
  id: string;
  title: string;
  category: string;
  heading: string;
  path: string;
  content: string;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  mode?: 'ai' | 'search-only' | 'local-search';
};

const quickQuestions = [
  'WWDG 和 IWDG 有什么区别？',
  'GitHub 远程同步怎么做？',
  'DMA 双缓冲有什么用？',
];

const MIN_W = 320;
const MIN_H = 380;
const DEFAULT_W = 420;
const DEFAULT_H = 620;

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const asciiWords = normalized.match(/[a-z0-9_#+.-]+/g) || [];
  const cjkChars = normalized.match(/[\u4e00-\u9fff]/g) || [];
  const cjkBigrams: string[] = [];

  for (let i = 0; i < cjkChars.length - 1; i += 1) {
    cjkBigrams.push(`${cjkChars[i]}${cjkChars[i + 1]}`);
  }

  return [...asciiWords, ...cjkChars, ...cjkBigrams];
}

function localSearch(question: string, chunks: AiIndexChunk[], limit = 5): Source[] {
  const queryTokens = new Set(tokenize(question));

  return chunks
    .map((chunk) => {
      const text = `${chunk.title} ${chunk.category} ${chunk.heading} ${chunk.content}`;
      let score = 0;
      tokenize(text).forEach((token) => {
        if (queryTokens.has(token)) score += token.length > 1 ? 2 : 1;
      });
      if (question.includes(chunk.title)) score += 8;
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => ({
      id: chunk.id,
      title: chunk.title,
      category: chunk.category,
      heading: chunk.heading,
      path: chunk.path,
      excerpt: chunk.content.slice(0, 240),
    }));
}

const AskAI = () => {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好，我是 Haki，可以根据 Hakii 的笔记帮你解释文章内容。你可以问我某个概念、某篇文章的步骤，或者让它用更简单的话讲一遍。',
    },
  ]);

  /* ---- resizable state ---- */
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const resizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: DEFAULT_W, h: DEFAULT_H });
  const panelRef = useRef<HTMLDivElement>(null);

  /* ---- click-outside handler ---- */
  useEffect(() => {
    if (!open || pinned) return;
    const handler = (e: MouseEvent) => {
      const panel = panelRef.current;
      if (panel && !panel.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // delay to avoid the same click that opened the panel from closing it
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler);
    });
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, pinned]);

  /* ---- resize handlers ---- */
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      setSize({
        w: Math.max(MIN_W, Math.min(window.innerWidth - 32, startSize.current.w + dx)),
        h: Math.max(MIN_H, Math.min(window.innerHeight - 32, startSize.current.h + dy)),
      });
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [size]);

  /* ---- double-click header to reset size ---- */
  const onHeaderDoubleClick = useCallback(() => {
    setSize({ w: DEFAULT_W, h: DEFAULT_H });
  }, []);

  const arkApiKey = useMemo(() => {
    return (import.meta.env.VITE_ARK_API_KEY || '').trim();
  }, []);

  const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
  const ARK_MODEL = 'ep-20260719233406-4gxpd';

  const askLocalIndex = async (value: string): Promise<{ text: string; sources: Source[] }> => {
    const response = await fetch(`${import.meta.env.BASE_URL}ai-index/notes-index.json`);
    const index = await response.json();
    const sources = localSearch(value, index.chunks || []);
    const text = sources.length
      ? '我在文章里没有找到明显相关的内容。你可以换个关键词试试。'
      : '我在文章里没有找到明显相关的内容。你可以换个关键词试试。';
    return { text, sources };
  };

  const askArk = async (value: string): Promise<{ text: string; sources: Source[]; mode: string }> => {
    // 1) local retrieval first — keep full chunks for prompt
    const response = await fetch(`${import.meta.env.BASE_URL}ai-index/notes-index.json`);
    const index = await response.json();
    const sources = localSearch(value, index.chunks || []);

    // 2) build prompt from full chunks
    const matchedChunks = (index.chunks || []).filter((c: AiIndexChunk) =>
      sources.some((s) => s.id === c.id),
    );
    const context = matchedChunks
      .map((c: AiIndexChunk, i: number) => `资料${i + 1}：${c.title}（${c.category}/${c.heading}）\n${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt =
      '你是这个个人博客的文章问答助手。请只根据给定资料回答用户问题，不要编造文章里没有的信息。如果资料不足，请直接说明"这部分文章里没有写清楚"。回答要口语化、清晰，适合给博客访客解释。最后用"参考文章"列出用到的文章标题。';

    const userPrompt = `用户问题：${value}\n\n可参考资料：\n${context || '没有检索到相关资料。'}`;

    // 3) call ark
    const arkRes = await fetch(`${ARK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${arkApiKey}`,
      },
      body: JSON.stringify({
        model: ARK_MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!arkRes.ok) {
      const errText = await arkRes.text();
      throw new Error(`模型调用失败：${arkRes.status} ${errText.slice(0, 200)}`);
    }

    const data = await arkRes.json();
    const answer = data?.choices?.[0]?.message?.content || '模型没有返回有效回答。';

    return { text: answer, sources, mode: 'ai' };
  };

  const submitQuestion = async (input?: string) => {
    const value = (input || question).trim();
    if (!value || loading) return;

    setQuestion('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: value }]);

    try {
      let result: { text: string; sources: Source[]; mode?: string };

      if (arkApiKey) {
        // 有密钥：本地检索 + 火山方舟 LLM
        result = await askArk(value);
      } else {
        // 无密钥：仅本地检索
        const local = await askLocalIndex(value);
        result = {
          text: local.sources.length
            ? '当前还没有配置 AI 密钥，我先帮你从文章里找到相关片段。配置火山方舟密钥后，我就能生成完整解释。'
            : '没有找到相关内容，换个关键词试试。',
          sources: local.sources,
          mode: 'local-search',
        };
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.text,
          sources: result.sources,
          mode: result.mode as Message['mode'],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Haki 服务暂时不可用，请稍后再试。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="ask-ai-fab" onClick={() => setOpen(true)} aria-label="打开 Haki 问答">
        <HakiCatIcon size={20} className="ask-ai-cat-icon" />
        <span>Ask Haki</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className={`ask-ai-panel${pinned ? ' ask-ai-pinned' : ''}`}
          style={{
            width: `${size.w}px`,
            height: `${size.h}px`,
          }}
        >
          <div className="ask-ai-header" onDoubleClick={onHeaderDoubleClick} title="双击恢复默认大小">
            <div>
              <div className="ask-ai-title">
                <HakiCatIcon size={18} className="ask-ai-cat-icon" />
                Haki 文章问答助手
                {pinned && <span className="ask-ai-pin-badge">已置顶</span>}
              </div>
              <p>根据博客笔记回答，不懂就问它。</p>
            </div>
            <div className="ask-ai-header-actions">
              <button
                onClick={() => setPinned((p) => !p)}
                aria-label={pinned ? '取消置顶' : '置顶'}
                title={pinned ? '取消置顶' : '置顶'}
              >
                {pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button onClick={() => setOpen(false)} aria-label="关闭 Haki 问答">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="ask-ai-messages">
            {messages.map((message, index) => (
              <div key={index} className={`ask-ai-message ask-ai-message-${message.role}`}>
                <div className="ask-ai-bubble">
                  <p>{message.content}</p>
                  {message.mode === 'local-search' && (
                    <span className="ask-ai-mode">本地检索模式</span>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="ask-ai-sources">
                      <strong>参考文章</strong>
                      {message.sources.map((source) => (
                        <a key={source.id} href={`${import.meta.env.BASE_URL}${source.path.replace(/^\//, '')}`}>
                          <span>{source.title}</span>
                          <small>{source.category} / {source.heading}</small>
                          <em>{source.excerpt}</em>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ask-ai-message ask-ai-message-assistant">
                <div className="ask-ai-bubble ask-ai-loading">
                  <Loader2 size={16} />
                  正在查文章...
                </div>
              </div>
            )}
          </div>

          <div className="ask-ai-quick">
            {quickQuestions.map((item) => (
              <button key={item} onClick={() => submitQuestion(item)} disabled={loading}>
                {item}
              </button>
            ))}
          </div>

          <form
            className="ask-ai-input"
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion();
            }}
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="问问这些文章..."
            />
            <button type="submit" disabled={loading || !question.trim()} aria-label="发送问题">
              <Send size={16} />
            </button>
          </form>

          {/* resize handle */}
          <div className="ask-ai-resize-handle" onMouseDown={onResizeStart} />
        </div>
      )}
    </>
  );
};

export default AskAI;
