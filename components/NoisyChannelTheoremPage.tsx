import React from 'react';

const SYNDROME_TABLE = [
  { syndrome: '000', pos: 'No error', bit: '—' },
  { syndrome: '001', pos: '4th bit', bit: 'p₂' },
  { syndrome: '010', pos: '2nd bit', bit: 'p₁' },
  { syndrome: '011', pos: '6th bit', bit: 'd₂' },
  { syndrome: '100', pos: '1st bit', bit: 'p₀' },
  { syndrome: '101', pos: '5th bit', bit: 'd₁' },
  { syndrome: '110', pos: '3rd bit', bit: 'd₀' },
  { syndrome: '111', pos: '7th bit', bit: 'd₃' },
];

const NoisyChannelTheoremPage: React.FC = () => (
  <section>
    <div className="card-kicker">Theorems</div>
    <h2>Shannon&rsquo;s Noisy Channel Coding Theorem</h2>
    <p className="text-muted" style={{ maxWidth: 680 }}>
      Published in 1948: below channel capacity C, codes exist making the error probability arbitrarily small;
      above C, errors cannot be made arbitrarily small.
    </p>
    <p style={{ fontStyle: 'italic', color: 'var(--color-accent-700)', margin: 'var(--space-3) 0 var(--space-6) 0' }}>
      R &lt; C &rArr; P&#8339; &rarr; 0 achievable &nbsp;&middot;&nbsp; R &gt; C &rArr; P&#8339; &gt; 0 guaranteed
    </p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
      <div className="card elev-sm">
        <div className="card-title">Channel Capacity (C)</div>
        <p className="card-body">Max reliable transmission rate &mdash; the maximum mutual information over all input distributions.</p>
      </div>
      <div className="card elev-sm">
        <div className="card-title">Transmission Rate (R)</div>
        <p className="card-body">Information bits sent per channel use: R = k/n for k data bits in n symbols.</p>
      </div>
      <div className="card elev-sm">
        <div className="card-title">Error Probability (P&#8339;)</div>
        <p className="card-body">Likelihood the decoded message differs from what was sent.</p>
      </div>
    </div>

    <h4>Example: The (7,4) Hamming Code</h4>
    <p style={{ maxWidth: 640 }}>
      Takes k=4 data bits, adds 3 parity bits, for a 7-bit codeword &mdash; rate R = 4/7 &asymp; 0.571. It corrects
      any single-bit error in the codeword.
    </p>
    <table className="table" style={{ maxWidth: 420, marginTop: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      <thead><tr><th>Syndrome</th><th>Error Position</th><th>Bit</th></tr></thead>
      <tbody>
        {SYNDROME_TABLE.map(row => (
          <tr key={row.syndrome}>
            <td>{row.syndrome}</td>
            <td>{row.pos}</td>
            <td style={{ color: 'var(--color-accent-700)' }}><b>{row.bit}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
    <p className="text-muted" style={{ maxWidth: 660, marginBottom: 'var(--space-6)' }}>
      With p=0.05 crossover, C &asymp; 0.714 &gt; R (0.571) &mdash; the code cuts block-error probability from
      ~18.6% (uncoded) to ~4.4%. With p=0.15, C &asymp; 0.390 &lt; R &mdash; this code cannot make errors
      arbitrarily rare on so noisy a channel.
    </p>

    <h4>A Simple Analogy</h4>
    <p style={{ maxWidth: 640 }}>
      Shouting across a noisy room: capacity is the clarity limit set by the room&rsquo;s noise; rate is how fast
      you speak; coding is choosing your words carefully. Speak below capacity and clever phrasing makes you
      understood almost perfectly &mdash; speak faster than capacity and no phrasing saves you.
    </p>
  </section>
);

export default NoisyChannelTheoremPage;
