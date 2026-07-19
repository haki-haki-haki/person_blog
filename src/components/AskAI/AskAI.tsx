import { useMemo, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import './ask-ai.css';

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
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好，我是 Haki，可以根据 Hakii 的笔记帮你解释文章内容。你可以问我某个概念、某篇文章的步骤，或者让它用更简单的话讲一遍。',
    },
  ]);

  const apiUrl = useMemo(() => {
    return (import.meta.env.VITE_AI_API_URL || '').trim();
  }, []);

  const askLocalIndex = async (value: string): Promise<Message> => {
    const response = await fetch(`${import.meta.env.BASE_URL}ai-index/notes-index.json`);
    const index = await response.json();
    const sources = localSearch(value, index.chunks || []);

    return {
      role: 'assistant',
      mode: 'local-search',
      content: sources.length
        ? '当前还没有连接 Haki 后端，我先帮你从文章里找到这些相关片段。配置 Vercel API 后，我就能基于这些片段生成完整解释。'
        : '当前还没有连接 Haki 后端，而且我没有在文章里找到明显相关的内容。你可以换个关键词试试。',
      sources,
    };
  };

  const askRemoteApi = async (value: string): Promise<Message> => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: value }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Haki 服务暂时不可用');
    }

    return {
      role: 'assistant',
      content: data.answer || '没有返回回答。',
      sources: data.sources || [],
      mode: data.mode || 'ai',
    };
  };

  const submitQuestion = async (input?: string) => {
    const value = (input || question).trim();
    if (!value || loading) return;

    setQuestion('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: value }]);

    try {
      const answer = apiUrl ? await askRemoteApi(value) : await askLocalIndex(value);
      setMessages((prev) => [...prev, answer]);
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
        <Bot size={20} />
        <span>Ask Haki</span>
      </button>

      {open && (
        <div className="ask-ai-panel">
          <div className="ask-ai-header">
            <div>
              <div className="ask-ai-title">
                <MessageCircle size={18} />
                Haki 文章问答助手
              </div>
              <p>根据博客笔记回答，不懂就问它。</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="关闭 Haki 问答">
              <X size={18} />
            </button>
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
        </div>
      )}
    </>
  );
};

export default AskAI;
