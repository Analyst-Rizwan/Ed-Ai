// TableViz.tsx — Interactive SQL table with query/join animation
import { useState } from "react";
import { T } from "../theme";

export interface TableRow {
  [key: string]: string | number;
}

export interface TableDef {
  name: string;
  columns: string[];
  rows: TableRow[];
}

export interface TableStep {
  title: string;
  note: string;
  query?: string;           // SQL query to display
  tables: TableDef[];       // tables to show (1 or 2)
  resultTable?: TableDef;   // result after operation
  highlightRows?: { table: string; rowIndex: number }[];
  highlightCols?: { table: string; col: string }[];
}

export interface TableConfig {
  steps: TableStep[];
}

interface Props { config: TableConfig; }

export default function TableViz({ config }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = config.steps[stepIdx];

  const hlRowSet = new Set((step.highlightRows || []).map(r => `${r.table}:${r.rowIndex}`));
  const hlColSet = new Set((step.highlightCols || []).map(c => `${c.table}:${c.col}`));

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={() => setStepIdx(i => Math.max(0,i-1))} disabled={stepIdx===0} style={navBtn}>‹ Prev</button>
        <span style={{ fontSize:12, fontFamily:"'Space Mono',monospace", color:T.muted }}>{stepIdx+1}/{config.steps.length}</span>
        <button onClick={() => setStepIdx(i => Math.min(config.steps.length-1,i+1))} disabled={stepIdx===config.steps.length-1} style={navBtn}>Next ›</button>
        <div style={{ marginLeft:12, fontSize:12, color:T.accent, fontWeight:600, background:T.accentSoft, padding:"5px 14px", borderRadius:100, border:`1px solid ${T.accent}33` }}>
          {step.title}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {config.steps.map((_,i) => (
            <div key={i} onClick={() => setStepIdx(i)} style={{ width:8, height:8, borderRadius:99, background:i===stepIdx?T.accent:T.surface3, cursor:"pointer" }} />
          ))}
        </div>
      </div>

      {/* SQL Query */}
      {step.query && (
        <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, background:"#0d1117", fontFamily:"'Space Mono',monospace", fontSize:12, color:"#c3e88d", lineHeight:1.7, flexShrink:0 }}>
          {step.query.split("\n").map((ln,i) => <div key={i}>{ln || "\u00a0"}</div>)}
        </div>
      )}

      {/* Note */}
      <div style={{ padding:"9px 20px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.muted2, lineHeight:1.6, flexShrink:0, background:T.surface }}>
        💡 {step.note}
      </div>

      {/* Tables */}
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {step.tables.map(tbl => (
            <DBTable key={tbl.name} tbl={tbl} hlRowSet={hlRowSet} hlColSet={hlColSet} />
          ))}
        </div>

        {/* Result table */}
        {step.resultTable && (
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:T.green, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              ⟹ Result
            </div>
            <DBTable tbl={step.resultTable} hlRowSet={hlRowSet} hlColSet={hlColSet} result />
          </div>
        )}
      </div>
    </div>
  );
}

function DBTable({ tbl, hlRowSet, hlColSet, result = false }: {
  tbl: TableDef; hlRowSet: Set<string>; hlColSet: Set<string>; result?: boolean;
}) {
  return (
    <div style={{ border:`1px solid ${result ? T.green : T.border2}`, borderRadius:12, overflow:"hidden", minWidth:180 }}>
      {/* Table name */}
      <div style={{ padding:"7px 14px", background:result?T.greenSoft:T.surface2, borderBottom:`1px solid ${result?T.green:T.border2}`, fontSize:12, fontWeight:600, color:result?T.green:T.muted2, fontFamily:"'Space Mono',monospace" }}>
        {tbl.name}
      </div>
      <table style={{ borderCollapse:"collapse", width:"100%" }}>
        <thead>
          <tr>
            {tbl.columns.map(col => {
              const isHlCol = hlColSet.has(`${tbl.name}:${col}`);
              return (
                <th key={col} style={{ padding:"7px 12px", fontSize:11, fontWeight:600, textAlign:"left", color:isHlCol?T.yellow:T.muted, background:isHlCol?T.yellowSoft:"transparent", borderBottom:`1px solid ${T.border}`, fontFamily:"'Space Mono',monospace" }}>
                  {col}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tbl.rows.map((row, ri) => {
            const isHlRow = hlRowSet.has(`${tbl.name}:${ri}`);
            return (
              <tr key={ri} style={{ background:isHlRow?T.accentSoft:"transparent", transition:"background .25s" }}>
                {tbl.columns.map(col => {
                  const isHlCol = hlColSet.has(`${tbl.name}:${col}`);
                  return (
                    <td key={col} style={{ padding:"7px 12px", fontSize:12, color:isHlRow?T.accent:isHlCol?T.yellow:T.muted2, borderBottom:`1px solid ${T.border}33`, fontFamily:"'Space Mono',monospace", fontWeight:isHlRow?600:400 }}>
                      {String(row[col] ?? "")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
  background:T.surface2, color:T.muted, border:"none", fontFamily:"'DM Sans',sans-serif",
};
