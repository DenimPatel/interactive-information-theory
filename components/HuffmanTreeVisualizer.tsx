import React from 'react';
import type { HuffmanNode } from '../types';

interface HuffmanTreeVisualizerProps {
  treeRoot: HuffmanNode | null;
}

const NODE_RADIUS = 20;
const LEVEL_HEIGHT = 80;
const HORIZONTAL_SPACING_BASE = 50; // Base horizontal spacing, adjusted by depth

interface TreeNodePosition extends HuffmanNode {
  x: number;
  y: number;
  width: number; // Width of the subtree rooted at this node
}

interface LinePosition {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: '0' | '1';
  labelX: number;
  labelY: number;
}

const HuffmanTreeVisualizer: React.FC<HuffmanTreeVisualizerProps> = ({ treeRoot }) => {
  if (!treeRoot) {
    return <p className="text-slate-500">Enter text to generate a Huffman tree.</p>;
  }
   if (!treeRoot.left && !treeRoot.right && treeRoot.char) { // Single character input
    return (
      <div className="flex justify-center items-center p-4" style={{ minHeight: '100px' }}>
        <svg width={NODE_RADIUS * 2 + 20} height={NODE_RADIUS * 2 + 20}>
          <g transform={`translate(${NODE_RADIUS + 10}, ${NODE_RADIUS + 10})`}>
            <circle cx={0} cy={0} r={NODE_RADIUS} fill="#a7f3d0" stroke="#047857" strokeWidth="2" />
            <text x={0} y={5} textAnchor="middle" fontSize="12px" fill="#065f46">
              {treeRoot.char === ' ' ? '␣' : treeRoot.char} ({treeRoot.freq})
            </text>
            <text x={0} y={NODE_RADIUS + 15} textAnchor="middle" fontSize="10px" fill="#065f46">
              Code: 0
            </text>
          </g>
        </svg>
      </div>
    );
  }


  const positionedNodes: TreeNodePosition[] = [];
  const lines: LinePosition[] = [];
  let minX = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Calculate positions and subtree widths recursively
  const calculatePositions = (node: HuffmanNode | null, depth: number, xOffset: number): number => {
    if (!node) return 0;

    let currentX = xOffset;
    const y = depth * LEVEL_HEIGHT + NODE_RADIUS + 10; // +10 for top padding

    let leftWidth = 0;
    if (node.left) {
      leftWidth = calculatePositions(node.left, depth + 1, currentX);
    }
    
    // Adjust currentX based on left child's width
    // Place parent in the middle of its children or at the start if no left child
    currentX = xOffset + leftWidth;
    
    let rightWidth = 0;
    if (node.right) {
      // Spacing between left and right children, decreases with depth
      const childrenXSpread = Math.max(HORIZONTAL_SPACING_BASE / (depth + 1), NODE_RADIUS * 2.5);
      rightWidth = calculatePositions(node.right, depth + 1, currentX + (node.left ? childrenXSpread : 0) );
    }
    
    const totalWidth = leftWidth + rightWidth + (node.left && node.right ? Math.max(HORIZONTAL_SPACING_BASE / (depth + 1), NODE_RADIUS * 2.5) : 0);
    
    let nodeX = currentX;
    if(node.left && node.right) {
        const leftChildPos = positionedNodes.find(pn => pn.id === node.left!.id);
        const rightChildPos = positionedNodes.find(pn => pn.id === node.right!.id);
        if(leftChildPos && rightChildPos) {
            nodeX = (leftChildPos.x + rightChildPos.x) / 2;
        }
    } else if (node.left) { // Only left child
        const leftChildPos = positionedNodes.find(pn => pn.id === node.left!.id);
        if (leftChildPos) nodeX = leftChildPos.x + NODE_RADIUS / 2;
    } else if (node.right) { // Only right child
        const rightChildPos = positionedNodes.find(pn => pn.id === node.right!.id);
        if (rightChildPos) nodeX = rightChildPos.x - NODE_RADIUS / 2;
    }


    const positionedNode: TreeNodePosition = {
      ...node,
      x: nodeX,
      y,
      width: Math.max(NODE_RADIUS * 2, totalWidth)
    };
    positionedNodes.push(positionedNode);

    minX = Math.min(minX, nodeX - NODE_RADIUS);
    maxX = Math.max(maxX, nodeX + NODE_RADIUS);
    maxY = Math.max(maxY, y + NODE_RADIUS);

    return positionedNode.width;
  };
  
  calculatePositions(treeRoot, 0, 0);
  
  // Post-process to create lines based on calculated positions
  positionedNodes.forEach(node => {
    if (node.left) {
      const childPos = positionedNodes.find(pn => pn.id === node.left!.id);
      if (childPos) {
        lines.push({
          x1: node.x, y1: node.y, x2: childPos.x, y2: childPos.y, label: '0',
          labelX: (node.x + childPos.x) / 2 - 5, labelY: (node.y + childPos.y) / 2 - 5
        });
      }
    }
    if (node.right) {
      const childPos = positionedNodes.find(pn => pn.id === node.right!.id);
      if (childPos) {
        lines.push({
          x1: node.x, y1: node.y, x2: childPos.x, y2: childPos.y, label: '1',
          labelX: (node.x + childPos.x) / 2 + 5, labelY: (node.y + childPos.y) / 2 - 5
        });
      }
    }
  });
  
  const padding = 20;
  const svgWidth = maxX - minX + padding * 2;
  const svgHeight = maxY + padding; // maxY already includes top padding and radius
  const translateX = -minX + padding;


  return (
    <div className="overflow-x-auto py-4 bg-slate-50 rounded-md shadow-inner">
      <svg width={svgWidth} height={svgHeight} aria-labelledby="huffman-tree-title" role="img">
        <title id="huffman-tree-title">Huffman Tree Visualization</title>
        <g transform={`translate(${translateX}, 0)`}>
          {lines.map((line, index) => (
            <g key={`line-${index}`}>
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#94a3b8" strokeWidth="1.5" />
              <text x={line.labelX} y={line.labelY} fontSize="10px" fill="#475569" textAnchor="middle">
                {line.label}
              </text>
            </g>
          ))}
          {positionedNodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <circle
                cx={0}
                cy={0}
                r={NODE_RADIUS}
                fill={node.char ? '#cffafe' : '#e2e8f0'} // Leaf: light cyan, Internal: light gray
                stroke={node.char ? '#0891b2' : '#64748b'} // Leaf: cyan, Internal: slate
                strokeWidth="2"
              />
              <text x={0} y={5} textAnchor="middle" fontSize="10px" fontWeight={node.char ? "normal" : "bold"} fill={node.char ? '#0e7490' : '#334155'}>
                {node.char === ' ' ? '␣' : node.char} 
                {node.char ? `(${node.freq})` : node.freq}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default HuffmanTreeVisualizer;
