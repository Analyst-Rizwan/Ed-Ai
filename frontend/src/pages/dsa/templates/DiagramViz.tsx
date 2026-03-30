// DiagramViz.tsx — Architecture/class diagram with animated data flow
import { useState } from "react";
import { T } from "../theme";

export interface DiagNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;        // 0-100 (percentage of container width)
  y: number;        // 0-100 (percentage of container height)
  color?: string;
  shape?: "rect" | "circle" | "diamond";
  highlight?: boolean;
}

export interface DiagEdge {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
  color?: string;
  dashed?: boolean;
}

export interface DiagramStep {
  title: string;
  note: string;
  highlightNodes?: string[];
  highlightEdges?: string[];  // "fromId->toId"
}

export interface DiagramConfig {
  nodes: DiagNode[];
  edges: DiagEdge[];
  steps: DiagramStep[];
}

interface Props { config: DiagramConfig; }

export default function DiagramViz({ config }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = config.steps[stepIdx];
  const hlNodes = new Set(step.highlightNodes || []);
  const hlEdges = new Set(step.highlightEdges || []);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={() => setStepIdx(i => Math.max(0,i-1))} disabled={stepIdx===0} style={navBtn}>‹ Prev</button>
        <span style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:T.muted }}>{stepIdx+1}/{config.steps.length}</span>
        <button onClick={() => setStepIdx(i => Math.min(config.steps.length-1,i+1))} disabled={stepIdx===config.steps.length-1} style={navBtn}>Next ›</button>
        <div style={{ marginLeft:12, padding:"5px 14px", background:T.accentSoft, border:`1px solid ${T.accent}33`, borderRadius:100, fontSize:12, color:T.accent, fontWeight:600 }}>
          {step.title}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {config.steps.map((_,i) => (
            <div key={i} onClick={() => setStepIdx(i)} style={{ width:8, height:8, borderRadius:99, background:i===stepIdx?T.accent:T.surface3, cursor:"pointer" }} />
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding:"9px 20px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.muted2, lineHeight:1.6, flexShrink:0, background:T.surface }}>
        💡 {step.note}
      </div>

      {/* Diagram SVG */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <svg width="100%" height="100%" style={{ position:"absolute", top:0, left:0 }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.border2} />
            </marker>
            <marker id="arrow-hl" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.accent} />
            </marker>
          </defs>

          {/* Edges */}
          <EdgeLayer nodes={config.nodes} edges={config.edges} hlEdges={hlEdges} />
        </svg>

        {/* Nodes (positioned absolute so they can have divs with text) */}
        {config.nodes.map(node => {
          const isHl = hlNodes.has(node.id);
          const col = isHl ? (node.color || T.accent) : T.muted;
          const bg  = isHl ? `${node.color || T.accent}22` : T.surface2;
          return (
            <div key={node.id} style={{
              position:"absolute",
              left:`${node.x}%`, top:`${node.y}%`,
              transform:"translate(-50%,-50%)",
              background:bg,
              border:`1.5px solid ${isHl ? (node.color||T.accent) : T.border2}`,
              borderRadius: node.shape==="circle" ? "50%" : node.shape==="diamond" ? "4px" : "12px",
              padding: node.shape==="circle" ? "18px" : "10px 18px",
              minWidth: node.shape==="circle" ? 60 : 90,
              textAlign:"center",
              boxShadow: isHl ? `0 0 16px ${node.color||T.accent}55` : "none",
              transition:"all .3s",
              zIndex:2,
              cursor:"default",
            }}>
              <div style={{ fontSize:12, fontWeight:600, color:col, lineHeight:1.3 }}>{node.label}</div>
              {node.sublabel && <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{node.sublabel}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EdgeLayer({ nodes, edges, hlEdges }: { nodes: DiagNode[]; edges: DiagEdge[]; hlEdges: Set<string> }) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  return (
    <>
      {edges.map((e, i) => {
        const from = byId[e.from]; const to = byId[e.to];
        if (!from || !to) return null;
        const key = `${e.from}->${e.to}`;
        const isHl = hlEdges.has(key);
        const col = isHl ? (e.color || T.accent) : T.border2;
        // Use percentage — will be converted by viewBox via foreignObject trick:
        // Simply lay out in percentage coords of SVG viewport
        return (
          <g key={i}>
            <line
              x1={`${from.x}%`} y1={`${from.y}%`}
              x2={`${to.x}%`}   y2={`${to.y}%`}
              stroke={col} strokeWidth={isHl ? 2 : 1.5}
              strokeDasharray={e.dashed ? "5,4" : undefined}
              markerEnd={`url(#${isHl ? "arrow-hl" : "arrow"})`}
              style={{ transition:"stroke .3s" }}
            />
            {e.label && (
              <text
                x={`${(from.x+to.x)/2}%`} y={`${(from.y+to.y)/2}%`}
                textAnchor="middle" fill={col} fontSize="10"
                style={{ fontFamily:"'DM Sans',sans-serif" }}
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

const navBtn: React.CSSProperties = {
  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
  background:T.surface2, color:T.muted, border:"none", fontFamily:"'DM Sans',sans-serif",
};
