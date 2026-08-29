// --- Huffman Encoding Types ---

// Represents a node in the Huffman tree
export interface HuffmanNode {
  char: string | null; // Character (for leaf nodes)
  freq: number; // Frequency
  id: string; // Unique ID for React keys if rendering tree
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

// Represents a character and its frequency
export interface HuffmanFrequency {
  char: string;
  freq: number;
}

// Represents a character and its Huffman code
export interface HuffmanCode {
  char: string;
  code: string;
}

// Statistics about the compression
export interface HuffmanStats {
  originalSizeBits: number;
  compressedSizeBits: number;
  compressionRatio: number; // e.g., 0.6 for 60%
  averageCodeLength: number;
  uniqueChars: number;
}

// Bundles all results from the Huffman encoding process
export interface HuffmanResult {
  frequencies: HuffmanFrequency[];
  codes: HuffmanCode[];
  encodedString: string;
  stats: HuffmanStats | null;
  treeRoot: HuffmanNode | null;
}

// --- Huffman Tree Layout (for SVG rendering) ---
export interface HuffmanTreeLayoutNode {
  id: string;
  x: number;
  y: number;
  char: string | null;
  freq: number;
}

export interface HuffmanTreeLayoutEdge {
  x1: number; y1: number; x2: number; y2: number;
  label: '0' | '1';
  lx: number; ly: number;
}

export interface HuffmanTreeLayout {
  nodes: HuffmanTreeLayoutNode[];
  edges: HuffmanTreeLayoutEdge[];
  width: number;
  height: number;
}

// --- Monty Hall ---
export interface MontyDoor {
  id: number;
  hasCar: boolean;
  isOpen: boolean;
  isPlayerChoice: boolean;
}
