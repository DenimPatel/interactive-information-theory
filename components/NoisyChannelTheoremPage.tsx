
import React from 'react';
import Card from './Card';
import ConceptExplainer from './ConceptExplainer';
import HammingVennDiagram from './HammingVennDiagram'; // Import new component
import HammingMatrixEncoding from './HammingMatrixEncoding'; // Import new component

interface NoisyChannelTheoremPageProps {
  onNavigateBack: () => void;
}

const MatrixDisplay: React.FC<{ matrix: number[][]; rowLabels?: string[]; colLabels?: string[]; matrixName?: string; caption?: string }> = ({ matrix, rowLabels, colLabels, matrixName, caption }) => (
  <div className="my-2 flex flex-col items-center">
    {matrixName && <div className="text-sm font-semibold text-slate-600">{matrixName}</div>}
    <div className="inline-block border border-slate-300 bg-white rounded shadow-sm p-0.5 my-1">
      {colLabels && (
        <div className="flex">
          {rowLabels && <div className="w-6 sm:w-8 h-6 sm:h-8"></div>} {/* Spacer for row labels column */}
          {colLabels.map((label, idx) => (
            <div key={`col-${label}`} className="flex items-center justify-center p-1 sm:p-1.5 text-xs font-semibold text-sky-600 min-w-[22px] sm:min-w-[28px] h-6 sm:h-8">
              {label}
            </div>
          ))}
        </div>
      )}
      {matrix.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className={`flex ${rowIndex > 0 && !colLabels ? "border-t border-slate-200" : ""}`}>
          {rowLabels && (
            <div className="flex items-center justify-center p-1 sm:p-1.5 text-xs font-semibold text-emerald-600 min-w-[22px] sm:min-w-[28px] h-6 sm:h-8 border-r border-slate-200">
              {rowLabels[rowIndex]}
            </div>
          )}
          {row.map((val, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={`flex items-center justify-center p-1 sm:p-1.5 text-xs sm:text-sm font-mono text-slate-700 min-w-[22px] sm:min-w-[28px] h-6 sm:h-8 ${colIndex > 0 && !rowLabels ? "border-l border-slate-200" : ""}`}
            >
              {val}
            </div>
          ))}
        </div>
      ))}
    </div>
    {caption && <div className="text-xs text-slate-500 mt-0.5">{caption}</div>}
  </div>
);


const NoisyChannelTheoremPage: React.FC<NoisyChannelTheoremPageProps> = ({ onNavigateBack }) => {

  const theoremStatementExplanation = [
    "Shannon's Noisy Channel Coding Theorem, also known as Shannon's Fundamental Theorem of Information Theory, is a cornerstone of modern digital communication. Published by Claude Shannon in 1948, it establishes the theoretical limits to reliable communication over noisy channels.",
    "The theorem states: For any given noisy communication channel, there is a maximum rate, called the channel capacity (C), at which information can be transmitted with an arbitrarily low probability of error. If the transmission rate (R) is less than C (R < C), then codes exist that allow the probability of error at the receiver to be made as small as desired. Conversely, if the rate R is greater than C (R > C), then it's impossible to achieve arbitrarily low error probability; errors will occur with some non-zero probability, no matter how sophisticated the coding scheme.",
    "It's important to note that the theorem is an 'existence theorem'. It proves that such good codes exist but doesn't provide a specific method for constructing them. Finding practical codes that approach this theoretical limit has been a major area of research for decades."
  ];

  const capacityExplanation = [
    "Channel Capacity (C) represents the maximum rate at which information can be transmitted reliably (with arbitrarily low error) over a specific communication channel. It is a fundamental property of the channel itself, determined by its physical characteristics, such as bandwidth and noise level.",
    <>As explored on the 'BSC & Mutual Information' page, we saw that the capacity of a BSC with crossover probability 'p' is <code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">C = 1 - H(p)</code> bits per channel use. More generally, capacity is the maximum mutual information I(X;Y) between the channel input X and output Y, optimized over all possible input probability distributions p(x).</>
  ];

  const rateExplanation = [
    "The transmission rate (R), often simply called 'rate', is the amount of actual information (data bits) being sent per channel use or per unit of time. It doesn't include the overhead bits added by error-correcting codes.",
    "For example, if we send k information bits using n total channel symbols (where n-k bits are redundancy for error correction), the rate is R = k/n bits per channel use. The goal is to maximize R while keeping it below C to ensure reliability."
  ];

  const errorProbExplanation = [
    "The probability of error (Pₑ) is the likelihood that the message decoded by the receiver does not match the original message sent by the transmitter. This can be measured per bit (bit error rate, BER) or per block of bits/message (block error rate).",
    "Shannon's theorem asserts that if R < C, we can design coding schemes such that Pₑ can be made arbitrarily close to zero by using sufficiently long and sophisticated codes. If R > C, Pₑ cannot be made arbitrarily small."
  ];

  const implicationsExplanation = [
    <ul key="implications-list" className="list-disc list-inside space-y-2">
      <li>
        <strong className="font-semibold text-slate-700">Possibility of Reliable Communication:</strong> Perhaps the most profound implication is that near-perfect communication is theoretically possible even over imperfect, noisy channels. Before Shannon, it was widely believed that noise would always impose a fundamental limit on reliability.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">The Ultimate Speed Limit (C):</strong> Channel capacity acts as a strict speed limit for reliable communication for a given channel. Attempting to transmit information faster than C will inevitably lead to a significant number of errors that cannot be fully corrected.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">The Power and Necessity of Coding:</strong> The theorem underscores the critical role of error-correcting codes. To achieve reliable communication at rates approaching C, sophisticated coding schemes are required. These codes add structured redundancy to the data, allowing the decoder to detect and correct errors introduced by channel noise.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Design Trade-offs:</strong> While the theorem guarantees the existence of good codes, practical implementation involves trade-offs. Codes that perform closer to the Shannon limit (i.e., achieve lower Pₑ at rates R near C) are often more complex, requiring more computational resources for encoding and decoding, and potentially introducing more latency due to longer block lengths.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Separation Principle:</strong> Shannon also showed that the problem of source coding (compressing data) and channel coding (adding redundancy for noisy transmission) can be treated separately without loss of optimality. This simplifies the design of communication systems.
      </li>
    </ul>
  ];
  
  const relationsExplanation = [
    <ul key="relations-list" className="list-disc list-inside space-y-2">
      <li>
        <strong className="font-semibold text-slate-700">Binary Symmetric Channel (BSC):</strong> The BSC is a classic model used to illustrate Shannon's theorem. On the 'BSC & Mutual Information' page, we saw that the capacity of a BSC with crossover probability 'p' is <code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">C = 1 - H(p)</code>. This 'C' is exactly the channel capacity referred to in the theorem. If you transmit data at a rate R &lt; <code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">1 - H(p)</code> over this BSC, you can find codes to make errors negligible.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Mutual Information I(X;Y):</strong> The concept of mutual information is central to defining channel capacity. C is the maximum possible I(X;Y) between the channel input X and output Y. This means achieving capacity involves choosing an input distribution that maximizes the information conveyed to the output, considering the channel's noise characteristics.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Entropy H(p):</strong> For the BSC, the entropy of the noise H(p) directly determines the capacity (<code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">C = 1 - H(p)</code>). This highlights how the uncertainty introduced by the channel (noise) quantifiably reduces the maximum rate of reliable communication. A perfectly noiseless channel (p=0 or p=1, so H(p)=0) has <code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">C=1</code> bit per channel use. A completely random channel (p=0.5, H(p)=1) has <code className="font-mono bg-slate-100 text-slate-700 text-xs px-1 py-0.5 rounded-sm">C=0</code>, meaning no information can be reliably transmitted.
      </li>
    </ul>
  ];

  const H_matrix = [
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 1, 0, 0, 1, 1],
    [0, 0, 0, 1, 1, 1, 1],
  ];
  const H_col_labels = ['p₀', 'p₁', 'd₀', 'p₂', 'd₁', 'd₂', 'd₃'];
  const H_row_labels = ['s₀', 's₁', 's₂'];

  const syndromeTable = [
    { syndrome: "000", error_pos: "No single error", bit_label: "None" },
    { syndrome: "001", error_pos: "4th bit", bit_label: "p₂" },
    { syndrome: "010", error_pos: "2nd bit", bit_label: "p₁" },
    { syndrome: "011", error_pos: "6th bit", bit_label: "d₂" },
    { syndrome: "100", error_pos: "1st bit", bit_label: "p₀" },
    { syndrome: "101", error_pos: "5th bit", bit_label: "d₁" },
    { syndrome: "110", error_pos: "3rd bit", bit_label: "d₀" },
    { syndrome: "111", error_pos: "7th bit", bit_label: "d₃" },
  ];


  const hammingCodeExample = [
    "The (7,4) Hamming code is a classic example of a linear block code, providing a simple way to understand how error correction works and relates to Shannon's theorem.",
    <React.Fragment key="hamming-params">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Code Parameters:</h4>
      <ul className="list-disc list-inside ml-2 space-y-0.5 text-sm sm:text-base">
        <li>It takes <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">k = 4</code> information bits (the message, denoted d₀, d₁, d₂, d₃).</li>
        <li>It adds <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">n-k = 3</code> redundancy bits (parity bits, denoted p₀, p₁, p₂).</li>
        <li>This results in a codeword of <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">n = 7</code> total bits. The codeword structure is <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">[p₀ p₁ d₀ p₂ d₁ d₂ d₃]</code>.</li>
        <li>The transmission rate of this code is <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">R = k/n = 4/7 ≈ 0.571</code> bits per channel use.</li>
      </ul>
    </React.Fragment>,
    <React.Fragment key="hamming-capability">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Error Correction Capability:</h4>
      <p className="text-sm sm:text-base">The (7,4) Hamming code can detect up to two bit errors and, crucially, can <strong className="text-emerald-700">correct any single bit error</strong> that occurs within the 7-bit codeword.</p>
    </React.Fragment>,
    <React.Fragment key="hamming-mechanism">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Simplified Encoding Mechanism & Parity Checks:</h4>
      <p className="text-sm sm:text-base">The 3 parity bits are calculated based on specific combinations of the 4 data bits to satisfy even parity for each check. When the 7-bit codeword is received, the receiver recalculates these parity checks. If there's a mismatch (called a non-zero "syndrome"), it indicates an error. For a single bit error, the syndrome pattern uniquely identifies the position of the flipped bit, allowing it to be corrected.</p>
      <p className="text-xs text-slate-500 mt-1">The parity check equations (mod 2) are:</p>
      <ul className="list-disc list-inside ml-4 space-y-0.5 text-xs text-slate-500">
          <li><code className="font-mono">p₀ + d₀ + d₁ + d₃ = 0</code>  (Circle P₀ checks these)</li>
          <li><code className="font-mono">p₁ + d₀ + d₂ + d₃ = 0</code>  (Circle P₁ checks these)</li>
          <li><code className="font-mono">p₂ + d₁ + d₂ + d₃ = 0</code>  (Circle P₂ checks these)</li>
      </ul>
    </React.Fragment>,
    <React.Fragment key="hamming-venn-intro">
      <h5 className="font-semibold mt-3 mb-1 text-base text-slate-600">Visualizing Parity Checks (Venn Diagram):</h5>
      <p className="text-sm sm:text-base">The relationship between data bits (d₀, d₁, d₂, d₃) and parity bits (p₀, p₁, p₂) for the (7,4) Hamming code can be visualized using a Venn diagram. Each circle represents a parity check group. The bits are positioned according to which parity checks they are involved in:</p>
      <div className="flex justify-center my-3">
         <HammingVennDiagram />
      </div>
      <p className="text-xs text-slate-500 mt-1">In this diagram, each parity bit (p₀, p₁, p₂) is set so that the total number of '1's within its corresponding circle (including itself and the data bits it checks) is even.</p>
    </React.Fragment>,
    <React.Fragment key="hamming-matrix-intro">
      <h5 className="font-semibold mt-3 mb-1 text-base text-slate-600">Encoding with a Generator Matrix (G):</h5>
      <p className="text-sm sm:text-base">The encoding process can also be represented by matrix multiplication. A 4-bit message <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">m = [d₀ d₁ d₂ d₃]</code> is multiplied by a 4x7 generator matrix <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">G</code> to produce the 7-bit codeword <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">c = [p₀ p₁ d₀ p₂ d₁ d₂ d₃]</code> (all calculations are modulo 2).</p>
      <p className="text-sm sm:text-base text-center my-2"><code className="font-mono bg-slate-100 text-md px-2 py-1 rounded-sm">c = m G</code></p>
      <HammingMatrixEncoding />
      <p className="text-xs text-slate-500 mt-2">The generator matrix G shown above is constructed to place the data bits systematically into the codeword and to calculate the parity bits according to the equations:
        <ul className="list-disc list-inside ml-4 space-y-0.5 mt-1">
            <li><code className="font-mono">p₀ = d₀ + d₁ + d₃</code></li>
            <li><code className="font-mono">p₁ = d₀ + d₂ + d₃</code></li>
            <li><code className="font-mono">p₂ = d₁ + d₂ + d₃</code></li>
        </ul>
        (All additions are modulo 2.)
      </p>
    </React.Fragment>,
    <React.Fragment key="hamming-decoding">
      <h5 className="font-semibold mt-3 mb-1 text-base text-slate-600">Decoding with Parity Check Matrix (H) and Syndrome:</h5>
      <p className="text-sm sm:text-base">When a 7-bit vector <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">r = [r₀ r₁ r₂ r₃ r₄ r₅ r₆]</code> (corresponding to positions <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">[p₀ p₁ d₀ p₂ d₁ d₂ d₃]</code>) is received, the decoder uses a Parity Check Matrix <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">H</code> to check for errors.</p>
      <p className="text-sm sm:text-base">The Parity Check Matrix <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">H</code> for this Hamming code (consistent with the codeword structure and parity equations) is a 3x7 matrix:</p>
      <MatrixDisplay matrix={H_matrix} colLabels={H_col_labels} rowLabels={H_row_labels} matrixName="H =" caption="Parity Check Matrix (rows are syndrome bits s₀,s₁,s₂)" />
      <p className="text-sm sm:text-base mt-2">The syndrome <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s = [s₀ s₁ s₂]</code> is calculated as <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s = rHᵀ</code> (modulo 2). This is equivalent to checking the parity equations with the received bits:</p>
      <ul className="list-disc list-inside ml-4 space-y-0.5 text-xs text-slate-600">
          <li><code className="font-mono">s₀ = r₀(p₀) + r₂(d₀) + r₄(d₁) + r₆(d₃)</code></li>
          <li><code className="font-mono">s₁ = r₁(p₁) + r₂(d₀) + r₅(d₂) + r₆(d₃)</code></li>
          <li><code className="font-mono">s₂ = r₃(p₂) + r₄(d₁) + r₅(d₂) + r₆(d₃)</code></li>
      </ul>
      <p className="text-sm sm:text-base mt-2">
        If <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s = [0 0 0]</code>, no single error is detected, and <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">r</code> is assumed correct.
        If <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s</code> is non-zero, it indicates an error. The value of <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s</code> (interpreted as a binary number, e.g., <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">[s₂ s₁ s₀]</code>) directly points to the bit position that is in error. The columns of <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">H</code> are unique and correspond to these syndrome values (when read as <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">[s₀ s₁ s₂]</code>, the columns of H match the error patterns).
      </p>
      <p className="text-sm font-medium text-slate-700 mt-2 mb-1">Syndrome Table (s = [s₀s₁s₂] &rarr; Error in bit):</p>
      <div className="overflow-x-auto">
        <table className="min-w-full w-auto text-xs border border-slate-300 bg-white shadow-sm mb-2">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-2 py-1 border-b border-slate-300">Syndrome [s₀s₁s₂]</th>
              <th className="px-2 py-1 border-b border-slate-300">Error Position in Codeword</th>
              <th className="px-2 py-1 border-b border-slate-300">Bit Label</th>
            </tr>
          </thead>
          <tbody>
            {syndromeTable.map(item => (
              <tr key={item.syndrome}>
                <td className="px-2 py-1 border-b border-slate-200 text-center font-mono">{item.syndrome}</td>
                <td className="px-2 py-1 border-b border-slate-200 text-center">{item.error_pos}</td>
                <td className="px-2 py-1 border-b border-slate-200 text-center font-mono text-emerald-700">{item.bit_label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm sm:text-base">For example, if syndrome <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">s = [1 1 0]</code>, this matches the 3rd column of H (corresponding to <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">d₀</code>). So, the bit <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">r₂(d₀)</code> is flipped to correct the error. After correction, the 4 data bits (<code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">d₀, d₁, d₂, d₃</code>) are extracted.</p>
    </React.Fragment>,
    <React.Fragment key="hamming-shannon">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Relation to Shannon's Theorem (with a BSC):</h4>
      <p className="text-sm sm:text-base">Let's consider a Binary Symmetric Channel (BSC) with crossover probability 'p'. The capacity is <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">C = 1 - H(p)</code>, where <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">H(p) = -[p log₂(p) + (1-p) log₂(1-p)]</code>. The Hamming code's rate is <code className="font-mono bg-slate-100 text-xs px-1 rounded-sm">R ≈ 0.571</code>.</p>
      <ul className="list-disc list-inside ml-2 space-y-1 text-sm sm:text-base mt-2">
        <li>
          <strong>Scenario 1: R &lt; C (Reliable communication aided by the code)</strong>
          <ul className="list-disc list-inside ml-4 space-y-0.5 text-xs sm:text-sm">
            <li>Let <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">p = 0.05</code> (5% chance of a bit flip).</li>
            <li>Then <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">H(0.05) ≈ 0.286</code> bits.</li>
            <li>So, <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">C ≈ 1 - 0.286 = 0.714</code> bits/use.</li>
            <li>Here, <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">R (0.571) &lt; C (0.714)</code>. Shannon's theorem states reliable communication is possible.</li>
            <li>Without coding (4 bits): P(at least one error) = <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">1 - (1-0.05)⁴ ≈ 1 - 0.8145 = 0.1855</code>.</li>
            <li>With (7,4) Hamming code: It corrects all single-bit errors. An uncorrected error occurs if 2 or more bits flip in the 7-bit codeword.
                P(uncorrected) = 1 - [P(0 errors) + P(1 error)] = <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">1 - [(1-0.05)⁷ + 7*0.05*(1-0.05)⁶] ≈ 1 - [0.6983 + 0.2573] = 1 - 0.9556 = 0.0444</code>.
            </li>
            <li>The code significantly reduces block error probability (from 0.1855 to 0.0444).</li>
          </ul>
        </li>
        <li>
          <strong>Scenario 2: R &gt; C (Reliable communication not guaranteed by this code)</strong>
          <ul className="list-disc list-inside ml-4 space-y-0.5 text-xs sm:text-sm">
            <li>Let <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">p = 0.15</code> (15% chance of a bit flip).</li>
            <li>Then <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">H(0.15) ≈ 0.610</code> bits.</li>
            <li>So, <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">C ≈ 1 - 0.610 = 0.390</code> bits/use.</li>
            <li>Here, <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">R (0.571) &gt; C (0.390)</code>. Shannon's theorem implies that this code cannot achieve arbitrarily low error probability for this highly noisy channel. While it corrects single errors, multiple errors will be frequent enough to cause uncorrected block errors.</li>
             <li>P(uncorrected for p=0.15) = <code className="font-mono bg-slate-100 text-xs px-0.5 rounded-sm">1 - [(0.85)⁷ + 7*0.15*(0.85)⁶] ≈ 1 - [0.3206 + 0.3960] = 1 - 0.7166 = 0.2834</code>. This is a high error rate.</li>
          </ul>
        </li>
      </ul>
    </React.Fragment>,
    <React.Fragment key="hamming-limits">
      <h4 className="font-semibold mt-3 mb-1 text-md text-slate-700">Limitations:</h4>
      <p className="text-sm sm:text-base">The (7,4) Hamming code is simple and illustrative. To achieve rates very close to channel capacity C with extremely low error probabilities, especially on challenging channels, more powerful and complex codes like LDPC (Low-Density Parity-Check) codes, Turbo codes, or Polar codes are necessary. These codes often use much longer block lengths (larger 'n' and 'k').</p>
    </React.Fragment>
  ];

  const analogyExplanation = [
    <ul key="analogy-list" className="list-disc list-inside space-y-2">
      <li>
        Imagine trying to communicate by shouting messages across a noisy room. The 'room' is the channel, and the 'noise' is the ambient sound.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Channel Capacity (C):</strong> This is like the maximum loudness or clarity with which you can effectively shout and be understood despite the noise. It's a property of the room's acoustics and the noise level.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Transmission Rate (R):</strong> This is how fast you try to speak your message.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">Coding:</strong> This is like choosing your words carefully, speaking slowly and clearly, using repetition, or agreeing on special shorthand to make your message more robust against the noise.
      </li>
      <li>
        <strong className="font-semibold text-slate-700">The Theorem's Insight:</strong> Shannon's theorem says that as long as you don't try to speak too fast (R &lt; C), by being clever about how you phrase and deliver your message (coding), you can make sure your listener understands you almost perfectly. If you speak too fast (R &gt; C), no matter how clearly or cleverly you try to speak, your listener will inevitably miss or misunderstand parts of your message.
      </li>
    </ul>
  ];

  const conceptualDiagram = (
    <div className="my-4 p-4 bg-slate-100 rounded-lg shadow-inner text-center">
      <p className="text-sm text-slate-700 mb-2">Conceptual Flow of a Communication System:</p>
      <div className="font-mono text-xs md:text-sm text-sky-700 space-y-1">
        <p>Source &rarr; Encoder &rarr; <span className="text-rose-600">Channel (Noise, Capacity C)</span> &rarr; Decoder &rarr; Destination</p>
        <p>Transmission Rate (R) &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Probability of Error (P<sub>e</sub>)</p>
      </div>
      <p className="text-xs text-slate-600 mt-2">
        If R &lt; C, coding can make P<sub>e</sub> &rarr; 0.
      </p>
       <p className="text-xs text-slate-600">
        If R &gt; C, P<sub>e</sub> remains significantly &gt; 0.
      </p>
    </div>
  );


  return (
    <main className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <Card>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-sky-700">Shannon's Noisy Channel Coding Theorem</h2>
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors duration-150"
            aria-label="Back to Main Concepts"
          >
            &larr; Back to Main Concepts
          </button>
        </div>

        <ConceptExplainer
          title="What is the Noisy Channel Coding Theorem?"
          explanation={theoremStatementExplanation}
          formula="If R < C ⇒ Pₑ → 0 achievable. If R > C ⇒ Pₑ > 0 certain."
        />
        
        {conceptualDiagram}

        <ConceptExplainer
          title="Key Concept: Channel Capacity (C)"
          explanation={capacityExplanation}
          formula="C = maxₚ₍ₓ₎ I(X;Y)   (For BSC: C = 1 - H(p))"
        />

        <ConceptExplainer
          title="Key Concept: Transmission Rate (R)"
          explanation={rateExplanation}
          formula="R = (k information bits) / (n channel uses)"
        />

        <ConceptExplainer
          title="Key Concept: Probability of Error (Pₑ)"
          explanation={errorProbExplanation}
        />
        
        <ConceptExplainer
          title="Implications of the Theorem"
          explanation={implicationsExplanation}
        />

        <ConceptExplainer
          title="How it Relates to What We've Learned"
          explanation={relationsExplanation}
        />

        <ConceptExplainer
          title="Example: The (7,4) Hamming Code"
          explanation={hammingCodeExample}
        />

        <ConceptExplainer
          title="A Simple Analogy"
          explanation={analogyExplanation}
        />
      </Card>
    </main>
  );
};

export default NoisyChannelTheoremPage;
