import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { TreeNode } from '@/data/noteTree';
import './tree.css';

interface TreeProps {
  node: TreeNode;
  expandedKeys: Set<string>;
  selectedKey: string | null;
  onExpand: (key: string) => void;
  onSelect: (node: TreeNode) => void;
  depth?: number;
}

const Tree: React.FC<TreeProps> = ({
  node,
  expandedKeys,
  selectedKey,
  onExpand,
  onSelect,
  depth = 0,
}) => {
  const isExpanded = expandedKeys.has(node.id);
  const isSelected = selectedKey === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      onExpand(node.id);
      return;
    }
    onSelect(node);
  };

  return (
    <div className="tree-node" style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : '8px' }}>
      <div
        className={`tree-item ${isSelected ? 'tree-item-selected' : ''} ${node.type === 'folder' ? 'tree-folder' : 'tree-file'}`}
        onClick={handleClick}
      >
        <div className="tree-item-left">
          {node.type === 'folder' && (
            <span className="tree-expand-icon">
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
          )}
          {node.type === 'file' && (
            <span className="tree-expand-placeholder" />
          )}
          
          <span className="tree-icon">
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen size={16} className="folder-open-icon" />
              ) : (
                <Folder size={16} className="folder-icon" />
              )
            ) : (
              <FileText size={14} className="file-icon" />
            )}
          </span>
          
          <span className="tree-name">{node.name}</span>
        </div>
        
        {node.type === 'folder' && node.children && (
          <span className="tree-count">{node.children.length}</span>
        )}
      </div>

      {node.type === 'folder' && node.children && isExpanded && (
        <div className="tree-children">
          {node.children.map((child) => (
            <Tree
              key={child.id}
              node={child}
              expandedKeys={expandedKeys}
              selectedKey={selectedKey}
              onExpand={onExpand}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tree;
