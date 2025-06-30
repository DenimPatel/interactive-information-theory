import React, { useState, useMemo } from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import { processHuffmanEncoding } from '../utils/huffman'; // Import the main processing function
import type { HuffmanResult, HuffmanFrequency, HuffmanCode, HuffmanStats } from '../types';
import HuffmanTreeVisualizer from './HuffmanTreeVisualizer'; // Import the visualizer

interface HuffmanEncodingPageProps {
  onNavigateBack: () => void;
}

const HuffmanEncodingPage: React.FC<HuffmanEncodingPageProps> = ({ onNavigateBack }) => {
  const [inputText, setInputText] = useState<string>('banana'); // Default example text

  const huffmanResult: HuffmanResult = useMemo(() => {
    return processHuffmanEncoding(inputText);
  }, [inputText]);

  const whatIsHuffmanExplanation = [
    "Huffman Encoding is a popular algorithm for lossless data compression. Developed by David A. Huffman while he was a Ph.D. student at MIT, it was published in the 1952 paper \"A Method for the Construction of Minimum-Redundancy Codes\".",
    "The core idea is to assign variable-length codes to input characters, with the lengths of the assigned codes based on the frequencies of corresponding characters. More frequent characters get shorter codes, and less frequent characters get longer codes. This results in an overall reduction in the number of bits needed to represent the data.",
    "It's a prefix code, meaning the code assigned to any character is not a prefix of the code assigned to any other character. This property is crucial for unambiguous decoding."
  ];

  const stepsInvolvedExplanation = [
    "The Huffman coding algorithm generally involves these steps:",
    <ol key="steps-list" className="list-decimal list-inside space-y-1 mt-2">
      <li><strong>Calculate Frequencies:</strong> Determine the frequency of each character in the input data.</li>
      <li><strong>Build Leaf Nodes:</strong> Create a leaf node for each unique character, containing the character and its frequency. These nodes are often placed in a priority queue (min-heap), ordered by frequency.</li>
      <li><strong>Build the Tree:</strong>
        <ul key="build-tree-steps" className="list-disc list-inside ml-4 space-y-0.5">
            <li>While there is more than one node in the queue:</li>
            <li className="ml-4">Extract the two nodes with the lowest frequencies from the queue.</li>
            <li className="ml-4">Create a new internal node whose frequency is the sum of the two extracted nodes' frequencies. Make the first extracted node its left child and the second its right child.</li>
            <li className="ml-4">Insert this new internal node back into the priority queue.</li>
        </ul>
      </li>
      <li><strong>Assign Codes:</strong> The single remaining node in the queue is the root of the Huffman tree. Traverse the tree from the root to each leaf node. Assign '0' for a left branch and '1' for a right branch (or vice-versa). The sequence of 0s and 1s from the root to a leaf forms the Huffman code for the character at that leaf.</li>
      <li><strong>Encode Data:</strong> Replace each character in the original data with its Huffman code.</li>
    </ol>
  ];
  
  const keyCharacteristicsExplanation = [
    <ul key="char-list" className="list-disc list-inside space-y-1">
      <li><strong>Lossless:</strong> No information is lost during compression. The original data can be perfectly reconstructed from the compressed data.</li>
      <li><strong>Variable-Length Codes:</strong> Characters are represented by codes of different lengths.</li>
      <li><strong>Prefix Codes:</strong> No code is a prefix of another code, ensuring unique decodability.</li>
      <li><strong>Optimal for Symbol-by-Symbol Encoding:</strong> For a known probability distribution of symbols, Huffman coding is optimal in the sense that it produces the shortest average code length among all methods that encode symbols one at a time.</li>
      <li><strong>Requires Two Passes (or Pre-knowledge):</strong> Typically, one pass is needed to compute frequencies and another to encode. If frequencies are known beforehand (e.g., for a fixed character set like English text), one pass might suffice for encoding.</li>
    </ul>
  ];

  const renderStats = (stats: HuffmanStats | null) => {
    if (!stats) return <p className="text-slate-500">Enter text to see compression stats.</p>;
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <StatItem label="Unique Characters:" value={stats.uniqueChars} />
        <StatItem label="Original Size (bits):" value={`${stats.originalSizeBits.toLocaleString()} (assuming 8 bits/char)`}/>
        <StatItem label="Compressed Size (bits):" value={stats.compressedSizeBits.toLocaleString()} />
        <StatItem label="Average Code Length:" value={`${stats.averageCodeLength.toFixed(3)} bits/char`} />
        <StatItem label="Compression Ratio:" value={`${(stats.compressionRatio * 100).toFixed(2)}%`} description="(Compressed / Original)"/>
      </div>
    );
  };

  const StatItem: React.FC<{label: string; value: string | number; description?: string}> = ({label, value, description}) => (
    <>
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="text-slate-800">{value} {description && <span className="text-xs text-slate-500"> {description}</span>}</span>
    </>
  );


  return (
    <main className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-sky-700">Huffman Encoding</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="What is Huffman Encoding?"
          explanation={whatIsHuffmanExplanation}
        />

        <Card title="Interactive Huffman Encoder" className="mt-6 bg-slate-50">
          <div className="space-y-6">
            <div>
              <label htmlFor="huffmanInput" className="block text-sm font-medium text-slate-700 mb-1">
                Enter text to encode:
              </label>
              <textarea
                id="huffmanInput"
                rows={4}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste text here..."
                aria-label="Text input for Huffman encoding"
              />
            </div>

            {inputText && huffmanResult.treeRoot && (
              <Card title="Huffman Tree Visualization" titleClassName="text-lg" className="bg-white">
                <HuffmanTreeVisualizer treeRoot={huffmanResult.treeRoot} />
              </Card>
            )}

            {inputText && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Frequency Analysis" titleClassName="text-lg" className="bg-white">
                    {huffmanResult.frequencies.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Char</th>
                              <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Freq</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {huffmanResult.frequencies.map(({ char, freq }) => (
                              <tr key={`freq-${char}`}>
                                <td className="px-3 py-1.5 whitespace-nowrap font-mono text-sky-700">{char === ' ' ? "' '" : char}</td>
                                <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">{freq}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-500">No characters to analyze.</p>
                    )}
                  </Card>

                  <Card title="Huffman Codes" titleClassName="text-lg" className="bg-white">
                     {huffmanResult.codes.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Char</th>
                              <th className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wider">Code</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {huffmanResult.codes.map(({ char, code }) => (
                              <tr key={`code-${char}`}>
                                <td className="px-3 py-1.5 whitespace-nowrap font-mono text-sky-700">{char === ' ' ? "' '" : char}</td>
                                <td className="px-3 py-1.5 whitespace-nowrap font-mono text-emerald-700">{code}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                       <p className="text-slate-500">No codes generated.</p>
                    )}
                  </Card>
                </div>
                
                <Card title="Encoded Output" titleClassName="text-lg" className="bg-white">
                  {huffmanResult.encodedString ? (
                    <div 
                      className="p-2 bg-slate-100 rounded font-mono text-sm text-emerald-800 break-all max-h-40 overflow-y-auto shadow-inner"
                      aria-label="Huffman encoded binary string"
                    >
                      {huffmanResult.encodedString}
                    </div>
                  ) : (
                    <p className="text-slate-500">No encoded output.</p>
                  )}
                </Card>

                <Card title="Compression Statistics" titleClassName="text-lg" className="bg-white">
                  {renderStats(huffmanResult.stats)}
                </Card>
              </>
            )}
             {!inputText && (
                <p className="text-slate-500 text-center py-4">
                    Enter some text above to see the Huffman encoding process.
                </p>
            )}
          </div>
        </Card>

        <ConceptExplainer
          title="Steps Involved"
          explanation={stepsInvolvedExplanation}
        />

        <ConceptExplainer
          title="Key Characteristics"
          explanation={keyCharacteristicsExplanation}
        />
      </Card>
    </main>
  );
};

export default HuffmanEncodingPage;