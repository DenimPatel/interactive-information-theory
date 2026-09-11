import React, { useEffect, useMemo, useState } from 'react';
import Slider from '../Slider';
import LecturePage from '../shell/LecturePage';
import Formula from '../ui/Formula';
import Quiz, { type QuizQuestion } from '../quiz/Quiz';
import Callout from '../ui/Callout';

type EdgeTuple = [number, number];

interface EncodeStep {
  leaf: number;
  neighbor: number;
  sequence: number[];
  edges: EdgeTuple[];
}

interface DecodeStep {
  leaf: number;
  neighbor: number;
  edge: EdgeTuple;
  degrees: number[];
  edges: EdgeTuple[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'five-trees',
    kind: 'numeric',
    prompt: 'How many labelled trees are there on 5 vertices?',
    answer: 125,
    tolerance: 0.5,
    unit: 'trees',
    explanation: 'Cayley: n^{n−2} = 5³ = 125.',
  },
  {
    id: 'prufer-length',
    kind: 'choice',
    prompt: 'A Prüfer sequence for a labelled tree on n vertices has length…',
    options: [
      { label: 'n' },
      { label: 'n − 1' },
      { label: 'n − 2', correct: true },
      { label: 'n + 1' },
    ],
    explanation: 'Each of the n − 2 leaf-removal steps appends exactly one label.',
  },
  {
    id: 'star',
    kind: 'choice',
    prompt: 'Decoding the Prüfer sequence (1, 1, …, 1) produces which tree?',
    options: [
      { label: 'A path through all vertices' },
      { label: 'A star centred on vertex 1', correct: true },
      { label: 'A single edge' },
      { label: 'A cycle' },
    ],
    explanation: 'Vertex 1 appears n − 2 times, so its degree is n − 1; every other vertex is a leaf attached to it.',
  },
  {
    id: 'four-trees',
    kind: 'numeric',
    prompt: 'How many labelled trees are there on 4 vertices?',
    answer: 16,
    tolerance: 0.5,
    unit: 'trees',
    explanation: '4² = 16, matching the 16 Prüfer sequences of length 2 over four labels.',
  },
];

const pathEdges = (n: number): EdgeTuple[] =>
  Array.from({ length: n - 1 }, (_, i) => [i + 1, i + 2] as EdgeTuple);

const starEdges = (n: number): EdgeTuple[] =>
  Array.from({ length: n - 1 }, (_, i) => [1, i + 2] as EdgeTuple);

const adjacency = (n: number, edges: EdgeTuple[]): number[][] => {
  const adj: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [u, v] of edges) {
    if (u >= 1 && u <= n && v >= 1 && v <= n) {
      adj[u].push(v);
      adj[v].push(u);
    }
  }
  return adj;
};

const isConnected = (n: number, edges: EdgeTuple[]): boolean => {
  if (n <= 1) return true;
  const adj = adjacency(n, edges);
  const seen = new Array<boolean>(n + 1).fill(false);
  const stack = [1];
  seen[1] = true;
  let count = 0;
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === undefined) break;
    count += 1;
    for (const next of adj[node]) {
      if (!seen[next]) {
        seen[next] = true;
        stack.push(next);
      }
    }
  }
  return count === n;
};

const areConnected = (n: number, edges: EdgeTuple[], a: number, b: number): boolean => {
  const adj = adjacency(n, edges);
  const seen = new Array<boolean>(n + 1).fill(false);
  const stack = [a];
  seen[a] = true;
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === undefined) break;
    if (node === b) return true;
    for (const next of adj[node]) {
      if (!seen[next]) {
        seen[next] = true;
        stack.push(next);
      }
    }
  }
  return false;
};

const encodeSteps = (n: number, initialEdges: EdgeTuple[]): EncodeStep[] => {
  let edges = initialEdges.map((edge) => [...edge] as EdgeTuple);
  const sequence: number[] = [];
  const steps: EncodeStep[] = [];
  for (let k = 0; k < n - 2; k++) {
    const adj = adjacency(n, edges);
    let leaf = -1;
    for (let v = 1; v <= n; v++) {
      if (adj[v].length === 1) {
        leaf = v;
        break;
      }
    }
    if (leaf === -1) break;
    const neighbor = adj[leaf][0];
    sequence.push(neighbor);
    edges = edges.filter(([u, v]) => u !== leaf && v !== leaf);
    steps.push({ leaf, neighbor, sequence: [...sequence], edges: edges.map((edge) => [...edge] as EdgeTuple) });
  }
  return steps;
};

const decodeSteps = (n: number, sequence: number[]): DecodeStep[] => {
  const degree = new Array<number>(n + 1).fill(1);
  for (const value of sequence) if (value >= 1 && value <= n) degree[value] += 1;
  const degrees = degree.slice();
  let edges: EdgeTuple[] = [];
  const steps: DecodeStep[] = [];
  for (const value of sequence) {
    let leaf = -1;
    for (let v = 1; v <= n; v++) {
      if (degrees[v] === 1) {
        leaf = v;
        break;
      }
    }
    if (leaf === -1) break;
    edges = [...edges, [leaf, value] as EdgeTuple];
    degrees[leaf] -= 1;
    degrees[value] -= 1;
    steps.push({ leaf, neighbor: value, edge: [leaf, value] as EdgeTuple, degrees: [...degrees], edges: edges.map((edge) => [...edge] as EdgeTuple) });
  }
  const remaining: number[] = [];
  for (let v = 1; v <= n; v++) if (degrees[v] === 1) remaining.push(v);
  if (remaining.length === 2) {
    edges = [...edges, [remaining[0], remaining[1]] as EdgeTuple];
    steps.push({
      leaf: remaining[0],
      neighbor: remaining[1],
      edge: [remaining[0], remaining[1]] as EdgeTuple,
      degrees: [...degrees],
      edges: edges.map((edge) => [...edge] as EdgeTuple),
    });
  }
  return steps;
};

const decodeToEdges = (n: number, sequence: number[]): EdgeTuple[] => {
  const steps = decodeSteps(n, sequence);
  return steps.length > 0 ? steps[steps.length - 1].edges : [];
};

const initialDegrees = (n: number, sequence: number[]): number[] => {
  const degrees = new Array<number>(n + 1).fill(1);
  for (const value of sequence) if (value >= 1 && value <= n) degrees[value] += 1;
  return degrees;
};

const CountingTreesPage: React.FC = () => {
  const [n, setN] = useState<number>(5);
  const [edges, setEdges] = useState<EdgeTuple[]>(() => pathEdges(5));
  const [selected, setSelected] = useState<number | null>(null);
  const [encodeStep, setEncodeStep] = useState<number>(0);
  const [decodeSeq, setDecodeSeq] = useState<number[]>(() => new Array<number>(3).fill(1));
  const [decodeStep, setDecodeStep] = useState<number>(0);

  useEffect(() => {
    setEdges(pathEdges(n));
    setSelected(null);
    setEncodeStep(0);
    setDecodeSeq(new Array<number>(Math.max(0, n - 2)).fill(1));
    setDecodeStep(0);
  }, [n]);

  const treeValid = edges.length === n - 1 && isConnected(n, edges);
  const encSteps = useMemo(() => (treeValid ? encodeSteps(n, edges) : []), [n, edges, treeValid]);
  const safeSeq = useMemo(() => decodeSeq.map((value) => Math.min(n, Math.max(1, value))), [decodeSeq, n]);
  const decSteps = useMemo(() => decodeSteps(n, safeSeq), [n, safeSeq]);

  useEffect(() => {
    setEncodeStep(0);
  }, [edges]);

  useEffect(() => {
    setDecodeStep(0);
  }, [decodeSeq]);

  const onNodeClick = (node: number) => {
    if (selected === null) {
      setSelected(node);
      return;
    }
    if (selected === node) {
      setSelected(null);
      return;
    }
    const a = selected;
    const b = node;
    setEdges((previous) => {
      const hasEdge = previous.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
      if (hasEdge) return previous.filter(([u, v]) => !((u === a && v === b) || (u === b && v === a)));
      if (previous.length >= n - 1) return previous;
      if (areConnected(n, previous, a, b)) return previous;
      return [...previous, [a, b] as EdgeTuple];
    });
    setSelected(null);
  };

  const renderTree = (
    treeEdges: EdgeTuple[],
    highlightEdge: EdgeTuple | null,
    highlightNode: number | null,
    size: number,
    interactive: boolean,
  ) => {
    const center = size / 2;
    const radius = size * 0.36;
    const position = (label: number) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * (label - 1)) / n;
      return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
    };
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Labelled tree">
        {treeEdges.map(([u, v], index) => {
          const a = position(u);
          const b = position(v);
          const highlighted =
            highlightEdge !== null &&
            ((highlightEdge[0] === u && highlightEdge[1] === v) || (highlightEdge[0] === v && highlightEdge[1] === u));
          return (
            <line
              key={index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={highlighted ? 'var(--color-accent-2-700)' : 'var(--color-neutral-600)'}
              strokeWidth={highlighted ? 4 : 2}
            />
          );
        })}
        {Array.from({ length: n }, (_, index) => {
          const label = index + 1;
          const point = position(label);
          const highlighted = highlightNode === label;
          const isSelected = selected === label;
          return (
            <g
              key={label}
              onClick={interactive ? () => onNodeClick(label) : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={15}
                fill={highlighted ? 'var(--color-accent-2-700)' : isSelected ? 'var(--color-accent-100)' : 'var(--color-bg)'}
                stroke={isSelected ? 'var(--color-accent)' : 'var(--color-neutral-600)'}
                strokeWidth={2}
              />
              <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize={12} fill={highlighted ? 'var(--color-bg)' : 'var(--color-text)'}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const liveSequence = encSteps.length > 0 ? encSteps[encSteps.length - 1].sequence : [];
  const encodeEdges = encodeStep === 0 ? edges : encSteps[encodeStep - 1]?.edges ?? edges;
  const encodeSequence = encodeStep === 0 ? [] : encSteps[encodeStep - 1]?.sequence ?? [];
  const encodeLeaf = encodeStep > 0 ? encSteps[encodeStep - 1]?.leaf ?? null : null;

  const decodeEdges = decodeStep === 0 ? [] : decSteps[decodeStep - 1]?.edges ?? [];
  const decodeHighlight = decodeStep > 0 ? decSteps[decodeStep - 1]?.edge ?? null : null;
  const decodeDegrees = decodeStep === 0 ? initialDegrees(n, safeSeq) : decSteps[decodeStep - 1]?.degrees ?? initialDegrees(n, safeSeq);

  const countRows = Array.from({ length: 9 }, (_, index) => index + 2);
  const enumeration = useMemo(() => {
    if (n > 4) return [];
    const rows: { sequence: string; edges: string }[] = [];
    const total = n ** (n - 2);
    for (let index = 0; index < total; index++) {
      const sequence = new Array<number>(n - 2).fill(1);
      let value = index;
      for (let position = 0; position < n - 2; position++) {
        sequence[position] = (value % n) + 1;
        value = Math.floor(value / n);
      }
      const treeEdges = decodeToEdges(n, sequence);
      rows.push({
        sequence: sequence.length > 0 ? `(${sequence.join(', ')})` : '(empty)',
        edges: treeEdges.map(([u, v]) => `${u}–${v}`).join(', '),
      });
    }
    return rows;
  }, [n]);

  return (
    <LecturePage slug="counting-trees" quiz={<Quiz slug="counting-trees" questions={QUESTIONS} />}>
      <p className="it-body-block">
        Cayley&rsquo;s formula says there are {'n^{n−2}'} labelled trees on n vertices. Prüfer sequences make
        this a bijection with strings: every tree encodes to a unique length-(n−2) sequence over its
        labels, and every such sequence decodes back to exactly one tree.
      </p>
      <Formula
        tex="n^{\,n-2}"
        note="the number of labelled trees on n vertices (Cayley's formula)"
        label="Cayley's formula"
      />
      <Formula
        tex="\#\{\text{Prüfer sequences}\} = \underbrace{n \times n \times \cdots \times n}_{n-2} = n^{\,n-2}"
        note="counting the strings is immediate; the theorem is that they correspond one-to-one with trees"
        label="Prüfer bijection count"
      />

      <h4>Build a labelled tree</h4>
      <p className="it-body-block">
        Click a vertex to select it, then click another to add or remove the edge between them. Edges that
        would create a cycle or exceed n − 1 are ignored, so you always have a tree or a forest on the way
        to one.
      </p>
      <Slider
        label="Vertices n"
        valueLabel={n}
        value={n}
        min={3}
        max={7}
        step={1}
        onChange={setN}
        style={{ maxWidth: 320, marginBottom: 'var(--space-3)' }}
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setEdges(pathEdges(n))}>Path</button>
        <button type="button" className="btn btn-secondary" onClick={() => setEdges(starEdges(n))}>Star</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setEdges(pathEdges(n)); setSelected(null); }}>Reset</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>{renderTree(edges, null, null, 280, true)}</div>
        <div style={{ minWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            Edges: <b>{edges.map(([u, v]) => `${u}–${v}`).join(', ') || '(none)'}</b>
          </div>
          <div>
            Is a tree?{' '}
            <b style={{ color: treeValid ? 'var(--color-accent-700)' : 'var(--color-accent-2-700)' }}>
              {treeValid ? 'yes' : 'not yet'}
            </b>
          </div>
          <div>
            Prüfer sequence: <b style={{ color: 'var(--color-accent-2-700)' }}>{liveSequence.length > 0 ? `(${liveSequence.join(', ')})` : '(none)'}</b>
          </div>
          <div className="text-muted" style={{ fontSize: 13 }}>
            The sequence is produced by repeatedly deleting the smallest-labelled leaf and recording its
            neighbour.
          </div>
        </div>
      </div>

      <h4 style={{ marginTop: 'var(--space-6)' }}>Encode: tree → Prüfer sequence</h4>
      <Slider
        label="Leaf-removal step"
        valueLabel={encodeStep === 0 ? 'start' : `${encodeStep} / ${encSteps.length}`}
        value={encodeStep}
        min={0}
        max={Math.max(0, encSteps.length)}
        step={1}
        onChange={setEncodeStep}
        style={{ maxWidth: 420, marginBottom: 'var(--space-3)' }}
      />
      {treeValid ? (
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>{renderTree(encodeEdges, null, encodeLeaf, 260, false)}</div>
          <div style={{ minWidth: 240 }}>
            <div className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>
              {encodeStep === 0
                ? 'Press step to remove the smallest leaf.'
                : `Removed leaf ${encSteps[encodeStep - 1].leaf}, its neighbour ${encSteps[encodeStep - 1].neighbor} was appended.`}
            </div>
            <div>
              Sequence so far:{' '}
              <b style={{ color: 'var(--color-accent-2-700)' }}>{encodeSequence.length > 0 ? `(${encodeSequence.join(', ')})` : '(empty)'}</b>
            </div>
            <div style={{ marginTop: 6 }}>Remaining edges: <b>{encodeEdges.map(([u, v]) => `${u}–${v}`).join(', ') || '(one edge)'}</b></div>
          </div>
        </div>
      ) : (
        <Callout title="Connect the vertices" tone="warn">
          The current edges do not form a tree yet, so there is no Prüfer sequence to compute.
        </Callout>
      )}

      <h4 style={{ marginTop: 'var(--space-6)' }}>Decode: Prüfer sequence → tree</h4>
      <p className="it-body-block">
        Choose a sequence, then step through the reconstruction: each label starts with degree 1 plus its
        multiplicity in the sequence; repeatedly attach the smallest degree-1 vertex to the next label.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        {decodeSeq.map((value, index) => (
          <label key={index} className="field" style={{ maxWidth: 90 }}>
            <span className="text-muted" style={{ fontSize: 12 }}>pos {index + 1}</span>
            <select
              className="input"
              value={value}
              onChange={(event) => {
                const next = Number(event.target.value);
                setDecodeSeq((previous) => {
                  const updated = previous.slice();
                  updated[index] = Math.min(n, Math.max(1, next));
                  return updated;
                });
              }}
            >
              {Array.from({ length: n }, (_, option) => (
                <option key={option + 1} value={option + 1}>{option + 1}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <Slider
        label="Reconstruction step"
        valueLabel={decodeStep === 0 ? 'degrees' : `${decodeStep} / ${decSteps.length}`}
        value={decodeStep}
        min={0}
        max={Math.max(0, decSteps.length)}
        step={1}
        onChange={setDecodeStep}
        style={{ maxWidth: 420, marginBottom: 'var(--space-3)' }}
      />
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>{renderTree(decodeEdges, decodeHighlight, decodeStep > 0 ? decSteps[decodeStep - 1].leaf : null, 260, false)}</div>
        <div style={{ minWidth: 260 }}>
          <div className="text-muted" style={{ fontSize: 13, marginBottom: 6 }}>
            {decodeStep === 0
              ? `Prüfer sequence (${safeSeq.join(', ')}) — degrees start at 1 + multiplicity.`
              : `Attached leaf ${decSteps[decodeStep - 1].leaf} to ${decSteps[decodeStep - 1].neighbor}.`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {Array.from({ length: n }, (_, index) => (
              <span key={index} className="tag tag-neutral">
                {index + 1}: deg {decodeDegrees[index + 1]}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            Tree edges: <b>{decodeEdges.map(([u, v]) => `${u}–${v}`).join(', ') || '(none yet)'}</b>
          </div>
        </div>
      </div>

      <h4 style={{ marginTop: 'var(--space-6)' }}>How many trees?</h4>
      <table className="table" style={{ maxWidth: 520 }}>
        <thead>
          <tr>
            <th>n</th>
            <th>Prüfer sequences</th>
            <th>labelled trees</th>
          </tr>
        </thead>
        <tbody>
          {countRows.map((k) => (
            <tr key={k}>
              <td>{k}</td>
              <td>
                {k}^{k - 2}
              </td>
              <td><b>{(k ** (k - 2)).toLocaleString()}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

      {enumeration.length > 0 ? (
        <>
          <h4>Enumeration for n = {n}</h4>
          <p className="it-body-block">
            All {enumeration.length} Prüfer sequences of length {n - 2} and the tree each one decodes to.
          </p>
          <div style={{ maxHeight: 360, overflowY: 'auto', maxWidth: 520 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Prüfer sequence</th>
                  <th>decoded tree</th>
                </tr>
              </thead>
              <tbody>
                {enumeration.map((row, index) => (
                  <tr key={index}>
                    <td>{row.sequence}</td>
                    <td>{row.edges}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <Callout title="Why the count is n^{n−2}">
        A Prüfer sequence is just a string of n − 2 symbols drawn from n labels, and there are {'n^{n−2}'} of
        them. The encode/decode algorithms above are exact inverses, so the strings and the labelled trees
        are in bijection — which proves Cayley&rsquo;s formula without enumerating any trees.
      </Callout>
    </LecturePage>
  );
};

export default CountingTreesPage;
