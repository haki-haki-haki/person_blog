import fs from 'fs';
import path from 'path';

type AiChunk = {
  id: string;
  title: string;
  category: string;
  heading: string;
  path: string;
  content: string;
};

type ChatRequest = {
  question?: string;
};

const DEFAULT_API_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const DEFAULT_MODEL = 'doubao-seed-1-6-flash-250828';

function json(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const asciiWords = normalized.match(/[a-z0-9_#+.-]+/g) || [];
  const cjkChars = normalized.match(/[\u4e00-\u9fff]/g) || [];
  const cjkBigrams: string[] = [];

  for (let i = 0; i < cjkChars.length - 1; i += 1) {
    cjkBigrams.push(`${cjkChars[i]}${cjkChars[i + 1]}`);
  }

  return [...asciiWords, ...cjkChars, ...cjkBigrams].filter((token) => token.length > 0);
}

function loadIndex(): AiChunk[] {
  const indexPath = path.join(process.cwd(), 'public', 'ai-index', 'notes-index.json');
  const raw = fs.readFileSync(indexPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.chunks) ? parsed.chunks : [];
}

function searchChunks(question: string, limit = 6): AiChunk[] {
  const chunks = loadIndex();
  const queryTokens = tokenize(question);
  const querySet = new Set(queryTokens);

  return chunks
    .map((chunk) => {
      const searchableText = `${chunk.title} ${chunk.category} ${chunk.heading} ${chunk.content}`;
      const tokens = tokenize(searchableText);
      let score = 0;

      tokens.forEach((token) => {
        if (querySet.has(token)) score += token.length > 1 ? 2 : 1;
      });

      if (question.includes(chunk.title)) score += 8;
      if (question.includes(chunk.heading)) score += 5;

      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}

function buildPrompt(question: string, chunks: AiChunk[]) {
  const context = chunks
    .map((chunk, index) => {
      return [
        `资料 ${index + 1}`,
        `标题：${chunk.title}`,
        `分类：${chunk.category}`,
        `小节：${chunk.heading}`,
        `链接：${chunk.path}`,
        `内容：${chunk.content}`,
      ].join('\n');
    })
    .join('\n\n---\n\n');

  return [
    '你是这个个人博客的文章问答助手。',
    '请只根据给定资料回答用户问题，不要编造文章里没有的信息。',
    '如果资料不足，请直接说明“这部分文章里没有写清楚”。',
    '回答要口语化、清晰，适合给博客访客解释。',
    '最后用“参考文章”列出用到的文章标题。',
    '',
    `用户问题：${question}`,
    '',
    `可参考资料：\n${context || '没有检索到相关资料。'}`,
  ].join('\n');
}

async function callModel(question: string, chunks: AiChunk[]) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return {
      mode: 'search-only',
      answer: chunks.length
        ? 'AI 后端还没有配置密钥，先展示我从文章里找到的相关片段。'
        : 'AI 后端还没有配置密钥，也没有检索到相关片段。',
    };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: '你是一个严谨的中文博客文章问答助手，只能依据用户提供的资料回答。',
        },
        {
          role: 'user',
          content: buildPrompt(question, chunks),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型接口调用失败：${response.status} ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  return {
    mode: 'ai',
    answer: data?.choices?.[0]?.message?.content || '模型没有返回有效回答。',
  };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return json(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: '只支持 POST 请求' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}) as ChatRequest;
    const question = String(body.question || '').trim();

    if (!question) {
      return json(res, 400, { error: '问题不能为空' });
    }

    const sources = searchChunks(question);
    const modelResult = await callModel(question, sources);

    return json(res, 200, {
      answer: modelResult.answer,
      mode: modelResult.mode,
      sources: sources.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        category: chunk.category,
        heading: chunk.heading,
        path: chunk.path,
        excerpt: chunk.content.slice(0, 240),
      })),
    });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : '服务暂时不可用',
    });
  }
}
