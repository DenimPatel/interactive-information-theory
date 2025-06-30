import type { HuffmanNode, HuffmanFrequency, HuffmanCode, HuffmanStats, HuffmanResult } from '../types';

/**
 * Calculates the frequency of each character in a given text.
 */
export const calculateFrequencies = (text: string): Map<string, number> => {
  const freqMap = new Map<string, number>();
  for (const char of text) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }
  return freqMap;
};

/**
 * Builds the Huffman tree from character frequencies.
 */
export const buildHuffmanTree = (frequencies: Map<string, number>): HuffmanNode | null => {
  if (frequencies.size === 0) {
    return null;
  }

  // Create leaf nodes and add them to a list (acting as a priority queue)
  const nodes: HuffmanNode[] = [];
  let nodeIdCounter = 0;
  for (const [char, freq] of frequencies) {
    nodes.push({ char, freq, left: null, right: null, id: `leaf-${nodeIdCounter++}` });
  }

  // Handle single character case separately for correct code ('0')
  if (nodes.length === 1) {
    const singleNode = nodes[0];
    const root: HuffmanNode = {
        char: null,
        freq: singleNode.freq,
        left: singleNode,
        right: null, // Or another dummy node if strict binary tree needed, but for codes this is fine
        id: `root-single-${nodeIdCounter++}`
    };
    return root;
  }
  

  // Build the tree
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq || (a.char || "").localeCompare(b.char || "")); // Sort by freq, then char for stable tree

    const left = nodes.shift()!;
    const right = nodes.shift()!;

    const parent: HuffmanNode = {
      char: null, // Internal node
      freq: left.freq + right.freq,
      left,
      right,
      id: `internal-${nodeIdCounter++}`,
    };
    nodes.push(parent);
  }

  return nodes[0] || null; // The root of the tree
};

/**
 * Generates Huffman codes by traversing the Huffman tree.
 */
const generateCodesRecursive = (node: HuffmanNode | null, currentCode: string, codes: Map<string, string>): void => {
  if (!node) {
    return;
  }

  // If it's a leaf node, store the code
  if (node.char !== null) {
    codes.set(node.char, currentCode || '0'); // Handle root-only tree for single char
    return;
  }

  generateCodesRecursive(node.left, currentCode + '0', codes);
  generateCodesRecursive(node.right, currentCode + '1', codes);
};

export const generateHuffmanCodes = (treeRoot: HuffmanNode | null): Map<string, string> => {
  const codes = new Map<string, string>();
  if (!treeRoot) {
    return codes;
  }
  generateCodesRecursive(treeRoot, '', codes);
  return codes;
};

/**
 * Encodes the input text using the generated Huffman codes.
 */
export const encodeTextWithHuffman = (text: string, codes: Map<string, string>): string => {
  let encoded = '';
  for (const char of text) {
    encoded += codes.get(char) || '';
  }
  return encoded;
};

/**
 * Calculates compression statistics.
 */
export const calculateHuffmanStats = (
  originalText: string,
  encodedText: string,
  codes: Map<string, string>,
  frequencies: Map<string,number>
): HuffmanStats | null => {
  if (!originalText) return null;

  const originalSizeBits = originalText.length * 8; // Assuming 8 bits per char (ASCII/UTF-8 simple)
  const compressedSizeBits = encodedText.length;
  const uniqueChars = codes.size;

  let totalWeightedLength = 0;
   for (const [char, freq] of frequencies) {
    totalWeightedLength += freq * (codes.get(char)?.length || 0);
  }
  const averageCodeLength = originalText.length > 0 ? totalWeightedLength / originalText.length : 0;


  return {
    originalSizeBits,
    compressedSizeBits,
    compressionRatio: originalSizeBits > 0 ? compressedSizeBits / originalSizeBits : 0,
    averageCodeLength: averageCodeLength,
    uniqueChars
  };
};

/**
 * Full process: text -> frequencies -> tree -> codes -> encoded string -> stats
 */
export const processHuffmanEncoding = (text: string): HuffmanResult => {
  if (!text) {
    return {
      frequencies: [],
      codes: [],
      encodedString: '',
      stats: null,
      treeRoot: null,
    };
  }

  const freqMap = calculateFrequencies(text);
  const sortedFrequencies: HuffmanFrequency[] = Array.from(freqMap.entries())
    .map(([char, freq]) => ({ char, freq }))
    .sort((a, b) => b.freq - a.freq || a.char.localeCompare(b.char));

  const treeRoot = buildHuffmanTree(freqMap);
  const codeMap = generateHuffmanCodes(treeRoot);
  
  const sortedCodes: HuffmanCode[] = Array.from(codeMap.entries())
    .map(([char, code]) => ({ char, code }))
    .sort((a, b) => a.char.localeCompare(b.char));

  const encodedString = encodeTextWithHuffman(text, codeMap);
  const stats = calculateHuffmanStats(text, encodedString, codeMap, freqMap);

  return {
    frequencies: sortedFrequencies,
    codes: sortedCodes,
    encodedString,
    stats,
    treeRoot, // Tree can be used for visualization later
  };
};
