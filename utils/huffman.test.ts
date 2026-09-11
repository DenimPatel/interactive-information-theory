import { describe, it, expect } from 'vitest';
import {
  calculateFrequencies,
  buildHuffmanTree,
  generateHuffmanCodes,
  encodeTextWithHuffman,
  processHuffmanEncoding,
} from './huffman';

const decode = (bits: string, codes: Map<string, string>): string => {
  const reverse = new Map<string, string>();
  for (const [char, code] of codes) reverse.set(code, char);
  let result = '';
  let buffer = '';
  for (const bit of bits) {
    buffer += bit;
    const char = reverse.get(buffer);
    if (char !== undefined) {
      result += char;
      buffer = '';
    }
  }
  expect(buffer).toBe('');
  return result;
};

describe('Huffman encoding', () => {
  it('round-trips a varied text', () => {
    const text = 'the quick brown fox jumps over the lazy dog';
    const result = processHuffmanEncoding(text);
    const codes = new Map(result.codes.map((c) => [c.char, c.code]));
    expect(decode(result.encodedString, codes)).toBe(text);
  });

  it('round-trips texts with skewed frequencies', () => {
    for (const text of ['aaaaaaaabbbbccd', 'z', 'ab', 'mississippi']) {
      const result = processHuffmanEncoding(text);
      const codes = new Map(result.codes.map((c) => [c.char, c.code]));
      expect(decode(result.encodedString, codes)).toBe(text);
    }
  });

  it('produces prefix-free codes', () => {
    const result = processHuffmanEncoding('abracadabra');
    const codes = result.codes.map((c) => c.code);
    for (const a of codes) {
      for (const b of codes) {
        if (a !== b) expect(b.startsWith(a)).toBe(false);
      }
    }
  });

  it('satisfies the Kraft equality for complete trees', () => {
    const result = processHuffmanEncoding('the quick brown fox jumps over the lazy dog');
    const kraft = result.codes.reduce((sum, c) => sum + 2 ** -c.code.length, 0);
    expect(kraft).toBeCloseTo(1, 12);
  });

  it('keeps expected length within H and H + 1', () => {
    const text = 'this is an example of a huffman tree';
    const result = processHuffmanEncoding(text);
    const freqs = calculateFrequencies(text);
    const total = text.length;
    let entropy = 0;
    for (const freq of freqs.values()) {
      const p = freq / total;
      entropy -= p * Math.log2(p);
    }
    const L = result.stats!.averageCodeLength;
    expect(L).toBeGreaterThanOrEqual(entropy - 1e-9);
    expect(L).toBeLessThan(entropy + 1);
  });

  it('handles empty input without throwing', () => {
    const result = processHuffmanEncoding('');
    expect(result.treeRoot).toBeNull();
    expect(result.stats).toBeNull();
  });

  it('builds a usable tree from a frequency map', () => {
    const tree = buildHuffmanTree(calculateFrequencies('aab'));
    const codes = generateHuffmanCodes(tree);
    expect(codes.get('a')).toBeDefined();
    expect(codes.get('b')).toBeDefined();
    expect(codes.get('a')).not.toBe(codes.get('b'));
    expect(encodeTextWithHuffman('aab', codes)).toHaveLength(
      (codes.get('a')?.length ?? 0) * 2 + (codes.get('b')?.length ?? 0),
    );
  });
});
