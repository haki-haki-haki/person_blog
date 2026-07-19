import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const notesDir = path.join(rootDir, '笔记');
const outputDir = path.join(rootDir, 'public', 'ai-index');
const outputFile = path.join(outputDir, 'notes-index.json');

const MAX_CHUNK_LENGTH = 900;
const MIN_CHUNK_LENGTH = 60;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath];
    return [];
  });
}

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoChunks(markdown) {
  const lines = normalizeMarkdown(markdown).split('\n');
  const chunks = [];
  let currentTitle = '';
  let buffer = [];

  const pushBuffer = () => {
    const text = buffer.join('\n').trim();
    if (text.length >= MIN_CHUNK_LENGTH) {
      if (text.length <= MAX_CHUNK_LENGTH) {
        chunks.push({ heading: currentTitle, content: text });
      } else {
        const paragraphs = text.split(/\n\s*\n/);
        let part = '';
        paragraphs.forEach((paragraph) => {
          if ((part + '\n\n' + paragraph).length > MAX_CHUNK_LENGTH && part.length >= MIN_CHUNK_LENGTH) {
            chunks.push({ heading: currentTitle, content: part.trim() });
            part = paragraph;
          } else {
            part = part ? `${part}\n\n${paragraph}` : paragraph;
          }
        });
        if (part.trim().length >= MIN_CHUNK_LENGTH) {
          chunks.push({ heading: currentTitle, content: part.trim() });
        }
      }
    }
    buffer = [];
  };

  lines.forEach((line) => {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      pushBuffer();
      currentTitle = heading[2].replace(/[`*_~]/g, '').trim();
      buffer.push(line);
      return;
    }
    buffer.push(line);
  });

  pushBuffer();
  return chunks;
}

function routeFor(relativePath) {
  return `/notes/${relativePath.split(path.sep).map(encodeURIComponent).join('/')}`;
}

function main() {
  if (!fs.existsSync(notesDir)) {
    throw new Error(`找不到笔记目录：${notesDir}`);
  }

  const files = walk(notesDir);
  const chunks = [];

  files.forEach((filePath) => {
    const relativePath = path.relative(notesDir, filePath);
    const category = relativePath.split(path.sep)[0] || '未分类';
    const fileName = path.basename(filePath, '.md');
    const markdown = fs.readFileSync(filePath, 'utf-8');
    const noteChunks = splitIntoChunks(markdown);

    noteChunks.forEach((chunk, index) => {
      chunks.push({
        id: `${relativePath.replace(/\\/g, '/')}#${index + 1}`,
        title: fileName,
        category,
        heading: chunk.heading || fileName,
        path: routeFor(relativePath),
        content: chunk.content,
      });
    });
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        chunks,
      },
      null,
      2,
    ),
    'utf-8',
  );

  console.log(`AI 索引已生成：${chunks.length} 个片段 -> ${path.relative(rootDir, outputFile)}`);
}

main();
