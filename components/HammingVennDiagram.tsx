
import React from 'react';

const HammingVennDiagram: React.FC = () => {
  const circleRadius = 55;
  const svgWidth = 280;
  const svgHeight = 230;

  // Adjusted coordinates for a visually balanced Venn diagram
  const p0_circle = { cx: svgWidth / 2 - circleRadius * 0.7, cy: svgHeight / 2 - circleRadius * 0.4, color: "rgba(239, 68, 68, 0.3)", stroke: "rgb(220, 38, 38)" }; // Red-ish
  const p1_circle = { cx: svgWidth / 2 + circleRadius * 0.7, cy: svgHeight / 2 - circleRadius * 0.4, color: "rgba(59, 130, 246, 0.3)", stroke: "rgb(37, 99, 235)" }; // Blue-ish
  const p2_circle = { cx: svgWidth / 2, cy: svgHeight / 2 + circleRadius * 0.6, color: "rgba(22, 163, 74, 0.3)", stroke: "rgb(21, 128, 61)" }; // Green-ish

  // Approximate text positions (fine-tuned by eye)
  const textPositions = {
    p0: { x: p0_circle.cx - circleRadius * 0.7, y: p0_circle.cy },
    p1: { x: p1_circle.cx + circleRadius * 0.7, y: p1_circle.cy },
    p2: { x: p2_circle.cx, y: p2_circle.cy + circleRadius * 0.75 },
    d0: { x: svgWidth / 2, y: p0_circle.cy - circleRadius * 0.1 },          // p0 ∩ p1 \ p2
    d1: { x: p0_circle.cx + circleRadius * 0.2, y: p0_circle.cy + circleRadius * 0.55 }, // p0 ∩ p2 \ p1
    d2: { x: p1_circle.cx - circleRadius * 0.2, y: p1_circle.cy + circleRadius * 0.55 }, // p1 ∩ p2 \ p0
    d3: { x: svgWidth / 2, y: svgHeight / 2 + circleRadius * 0.05 }           // p0 ∩ p1 ∩ p2 (center)
  };
  
  const bitLabelStyle = { fontSize: "13px", fill: "#1f2937", textAnchor: "middle", dominantBaseline: "central", fontWeight: "500" } as React.CSSProperties;
  const circleLabelStyle = { fontSize: "14px", fill: "#4b5563", textAnchor: "middle", fontWeight: "bold" } as React.CSSProperties;


  return (
    <svg width={svgWidth} height={svgHeight} aria-labelledby="hamming-venn-title" role="img" className="bg-slate-50 p-2 rounded-md shadow">
      <title id="hamming-venn-title">(7,4) Hamming Code Venn Diagram</title>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.1"/>
        </filter>
      </defs>

      {/* Circles */}
      <circle cx={p0_circle.cx} cy={p0_circle.cy} r={circleRadius} fill={p0_circle.color} stroke={p0_circle.stroke} strokeWidth="1.5" filter="url(#shadow)" />
      <circle cx={p1_circle.cx} cy={p1_circle.cy} r={circleRadius} fill={p1_circle.color} stroke={p1_circle.stroke} strokeWidth="1.5" filter="url(#shadow)" />
      <circle cx={p2_circle.cx} cy={p2_circle.cy} r={circleRadius} fill={p2_circle.color} stroke={p2_circle.stroke} strokeWidth="1.5" filter="url(#shadow)" />

      {/* Circle Labels */}
      <text x={p0_circle.cx} y={p0_circle.cy - circleRadius - 10} style={circleLabelStyle}>P₀</text>
      <text x={p1_circle.cx} y={p1_circle.cy - circleRadius - 10} style={circleLabelStyle}>P₁</text>
      <text x={p2_circle.cx} y={p2_circle.cy + circleRadius + 15} style={circleLabelStyle}>P₂</text>
      
      {/* Bit Labels */}
      <text x={textPositions.p0.x} y={textPositions.p0.y} style={bitLabelStyle}>p₀</text>
      <text x={textPositions.p1.x} y={textPositions.p1.y} style={bitLabelStyle}>p₁</text>
      <text x={textPositions.p2.x} y={textPositions.p2.y} style={bitLabelStyle}>p₂</text>
      
      <text x={textPositions.d0.x} y={textPositions.d0.y} style={bitLabelStyle}>d₀</text>
      <text x={textPositions.d1.x} y={textPositions.d1.y} style={bitLabelStyle}>d₁</text>
      <text x={textPositions.d2.x} y={textPositions.d2.y} style={bitLabelStyle}>d₂</text>
      <text x={textPositions.d3.x} y={textPositions.d3.y} style={{...bitLabelStyle, fontWeight: "bold"}}>d₃</text>
    </svg>
  );
};

export default HammingVennDiagram;
