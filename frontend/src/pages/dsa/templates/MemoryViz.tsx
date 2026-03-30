// MemoryViz.tsx — Stack + Heap memory model with pointer arrows
import { useState } from "react";
import { T } from "../theme";

export interface MemoryCell {
  id: string;
  label: string;        // variable name
  value: string;        // displayed value
  type: "stack" | "heap";
  address: string;      // e.g. "0x1000"
  pointsTo?: string;    // id of another MemoryCell this points to
  highlight?: boolean;
  color?: string;
}

export interface MemoryStep {
  title: string;
  note: string;
  cells: MemoryCell[];
}

export interface MemoryConfig {
  steps: MemoryStep[];
}

interface Props { config: MemoryConfig; }

export default function MemoryViz({ config }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = config.steps[stepIdx];
  const stackCells = step.cells.filter(c => c.type === "stack");
  const heapCells  = step.cells.filter(c => c.type === "heap");

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={() => setStepIdx(i => Math.max(0, i-1))} disabled={stepIdx===0} style={navBtn}>‹ Prev</button>
        <span style={{ fontSize:12, color:T.muted, fontFamily:"'Space Mono',monospace" }}>{stepIdx+1}/{config.steps.length}</span>
        <button onClick={() => setStepIdx(i => Math.min(config.steps.length-1, i+1))} disabled={stepIdx===config.steps.length-1} style={navBtn}>Next ›</button>
        <div style={{ marginLeft:16, padding:"6px 14px", background:T.accentSoft, border:`1px solid ${T.accent}33`, borderRadius:100, fontSize:12, color:T.accent, fontWeight:600 }}>
          {step.title}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding:"10px 20px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.muted2, lineHeight:1.6, flexShrink:0, background:T.surface }}>
        💡 {step.note}
      </div>

      {/* Memory layout */}
      <div style={{ flex:1, display:"flex", gap:0, overflow:"hidden" }}>
        {/* Stack */}
        <div style={{ flex:1, borderRight:`1px solid ${T.border}`, padding:16, overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>
            📦 Stack (LIFO)
          </div>
          {stackCells.length === 0 && <div style={{ color:T.muted, fontSize:12 }}>Empty</div>}
          {[...stackCells].reverse().map(cell => (
            <MemBlock key={cell.id} cell={cell} />
          ))}
        </div>

        {/* Heap */}
        <div style={{ flex:1.2, padding:16, overflowY:"auto" }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>
            🌀 Heap (Dynamic)
          </div>
          {heapCells.length === 0 && <div style={{ color:T.muted, fontSize:12 }}>Empty</div>}
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {heapCells.map(cell => (
              <MemBlock key={cell.id} cell={cell} wide />
            ))}
          </div>
        </div>
      </div>

      {/* Legend + step dots */}
      <div style={{ padding:"8px 16px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
        {[["Highlighted",T.accent],["Pointer",T.yellow],["Freed",T.red]].map(([l,c]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:T.muted }}>
            <div style={{ width:10, height:10, borderRadius:3, background:c as string }} />{l}
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {config.steps.map((_,i) => (
            <div key={i} onClick={() => setStepIdx(i)} style={{ width:8, height:8, borderRadius:99, background:i===stepIdx?T.accent:T.surface3, cursor:"pointer", transition:"background .15s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemBlock({ cell, wide = false }: { cell: MemoryCell; wide?: boolean }) {
  const col = cell.highlight ? T.accent : cell.color || T.surface2;
  const borderCol = cell.highlight ? T.accent : T.border2;
  return (
    <div style={{
      width: wide ? "auto" : "100%",
      marginBottom: wide ? 0 : 6,
      border:`1px solid ${borderCol}`,
      borderRadius:10,
      padding:"8px 12px",
      background: cell.highlight ? `${T.accent}18` : T.surface2,
      boxShadow: cell.highlight ? `0 0 10px ${T.accent}44` : "none",
      transition:"all .25s",
      minWidth: wide ? 110 : undefined,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:12, fontWeight:600, color:col === T.surface2 ? T.muted2 : col }}>{cell.label}</span>
        {cell.pointsTo && <span style={{ fontSize:10, color:T.yellow }}>→ ptr</span>}
      </div>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700, color: cell.highlight ? T.accent : T.text, margin:"4px 0" }}>
        {cell.value}
      </div>
      <div style={{ fontSize:9, color:T.muted, fontFamily:"'Space Mono',monospace" }}>{cell.address}</div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
  background:T.surface2, color:T.muted, border:"none", fontFamily:"'DM Sans',sans-serif",
};
