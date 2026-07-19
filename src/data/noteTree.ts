export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: TreeNode[];
  content?: string;
}

const notesGlob = import.meta.glob('../../笔记/**/*.md', { query: '?raw', import: 'default' });

const categoryNames: Record<string, string> = {
  '嵌入式开发': '嵌入式开发',
  '前端开发': '前端开发',
  'C_C++': 'C/C++',
  '计算机视觉与数学': '计算机视觉与数学',
  '项目实战': '项目实战',
  '杂项': '杂项',
  '工具与部署': '工具与部署',
};

export async function loadNoteTree(): Promise<TreeNode> {
  const root: TreeNode = {
    id: 'notes-root',
    name: '笔记',
    type: 'folder',
    path: '/笔记',
    children: [],
  };

  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set('notes-root', root);

  for (const [path, loader] of Object.entries(notesGlob)) {
    let content: unknown = '';
    try {
      content = await loader();
    } catch {
      // 跳过无法加载的文件（编码问题等）
      continue;
    }
    
    const cleanPath = path.replace(/\\/g, '/');
    const parts = cleanPath.split('/').filter(p => p && p !== '..');
    
    const fileName = parts[parts.length - 1];
    if (!fileName.endsWith('.md')) continue;
    
    const baseName = fileName.replace('.md', '');
    
    let categoryDir = '';
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      if (categoryNames[part]) {
        categoryDir = part;
        break;
      }
    }
    
    if (!categoryDir) {
      categoryDir = '其他';
    }
    
    const displayName = categoryNames[categoryDir] || categoryDir;
    const categoryId = `notes-root/${categoryDir}`;
    
    if (!nodeMap.has(categoryId)) {
      const categoryNode: TreeNode = {
        id: categoryId,
        name: displayName,
        type: 'folder',
        path: `/笔记/${categoryDir}`,
        children: [],
      };
      nodeMap.set(categoryId, categoryNode);
      
      const parentNode = nodeMap.get('notes-root');
      if (parentNode && parentNode.children) {
        parentNode.children.push(categoryNode);
      }
    }

    const fileId = `${categoryId}/${baseName}`;
    if (!nodeMap.has(fileId)) {
      const fileNode: TreeNode = {
        id: fileId,
        name: baseName,
        type: 'file',
        path: cleanPath,
        content: content as string,
      };
      nodeMap.set(fileId, fileNode);
      
      const parentNode = nodeMap.get(categoryId);
      if (parentNode && parentNode.children) {
        parentNode.children.push(fileNode);
      }
    }
  }

  function sortChildren(node: TreeNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name, 'zh-CN');
        }
        return a.type === 'folder' ? -1 : 1;
      });
      node.children.forEach(sortChildren);
    }
  }

  sortChildren(root);

  return root;
}

export async function getNoteContent(path: string): Promise<string | undefined> {
  const loader = notesGlob[path];
  if (loader) {
    try { return (await loader()) as string; } catch { /* ignore */ }
  }
  
  for (const [key, loader] of Object.entries(notesGlob)) {
    if (key.includes(path) || path.includes(key)) {
      try { return (await loader()) as string; } catch { /* ignore */ }
    }
  }
  return undefined;
}

/** 根据笔记文件路径加载内容（通过文件名匹配 glob） */
export async function getNoteContentByFilePath(filePath: string): Promise<string | undefined> {
  const fileName = filePath.split('/').pop()?.split('\\').pop() || '';
  if (!fileName) return undefined;

  for (const [key, loader] of Object.entries(notesGlob)) {
    const normalizedKey = key.replace(/\\/g, '/');
    if (normalizedKey.endsWith(fileName)) {
      try { return (await loader()) as string; } catch { /* ignore */ }
    }
  }
  return undefined;
}

export function findNodeByPath(root: TreeNode, path: string): TreeNode | undefined {
  if (root.path === path) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  
  return undefined;
}
