// CodeStepViz.tsx — Animated code step-through with variable tracking
import { useState, useEffect, useRef } from "react";
import { T } from "../theme";

export interface CodeStep {
  line: number;       // 0-indexed line to highlight
  vars?: Record<string, string | number>; // current variable state
  output?: string;    // console output at this step
  note?: string;      // human-readable explanation
}

export interface CodeStepConfig {
  code: string;             // full code block (newline separated)
  steps: CodeStep[];        // walkthrough steps
  language?: string;        // "c" | "cpp" | "java" | "python" (cosmetic)
}

const SPEED_MS = 900;

function highlight(line: string): string {
  // Simple keyword highlight for display
  return line
    .replace(/\b(int|char|float|double|void|return|if|else|for|while|do|struct|class|public|private|static|new|delete|nullptr|null|true|false|import|def|pass|print|cout|cin|printf|scanf|const|let|var|function|async|await|yield|lambda|from|import|try|except|finally|raise)\b/g,
      '<span style="color:#c792ea">$1</span>')
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span style="color:#c3e88d">$1</span>')
    .replace(/(\/\/.*|#.*)/g, '<span style="color:#546E7A">$1</span>')
    .replace(/\b(\d+)\b/g, '<span style="color:#F78C6C">$1</span>');
}

interface Props { config: CodeStepConfig; }

export default function CodeStepViz({ config }: Props) {
  const { code, steps } = config;
  const lines = code.split("\n");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEED_MS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIdx] ?? { line: -1, vars: {}, output: "", note: "" };

  const clearTimer = () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };

  useEffect(() => {
    if (!playing) { clearTimer(); return; }
    intervalRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, speed);
    return clearTimer;
  }, [playing, speed, steps.length]);

  const reset = () => { clearTimer(); setStepIdx(0); setPlaying(false); };
  const prev  = () => { clearTimer(); setPlaying(false); setStepIdx(i => Math.max(0, i - 1)); };
  const next  = () => { clearTimer(); setPlaying(false); setStepIdx(i => Math.min(steps.length - 1, i + 1)); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0, flexWrap:"wrap" }}>
        <button onClick={reset}  style={ctrlBtn(T.surface2, T.muted)}>↺ Reset</button>
        <button onClick={prev}   style={ctrlBtn(T.surface2, T.muted)} disabled={stepIdx===0}>‹ Prev</button>
        <button onClick={() => setPlaying(p => !p)} style={ctrlBtn(playing ? T.redSoft : T.accentSoft, playing ? T.red : T.accent)}>
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={next}   style={ctrlBtn(T.surface2, T.muted)} disabled={stepIdx>=steps.length-1}>Next ›</button>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
          <span>Speed:</span>
          {[1200,800,400].map(s => (
            <button key={s} onClick={() => setSpeed(s)} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, background:speed===s?T.accentSoft:"transparent", color:speed===s?T.accent:T.muted, border:speed===s?`1px solid ${T.accent}33`:`1px solid ${T.border}`, cursor:"pointer" }}>
              {s===1200?"Slow":s===800?"Normal":"Fast"}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:T.muted, fontFamily:"'Space Mono',monospace" }}>
          {stepIdx+1}/{steps.length}
        </span>
      </div>

      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        {/* Code panel */}
        <div style={{ flex:1, overflowY:"auto", padding:"12px 0", background:"#0d1117", borderRight:`1px solid ${T.border}` }}>
          {lines.map((ln, i) => {
            const isActive = i === currentStep.line;
            return (
              <div key={i} style={{
                display:"flex", alignItems:"flex-start", gap:0,
                background: isActive ? "rgba(124,92,252,0.18)" : "transparent",
                borderLeft: isActive ? `3px solid ${T.accent}` : "3px solid transparent",
                transition:"background .2s",
              }}>
                <span style={{ width:38, flexShrink:0, textAlign:"right", paddingRight:14, paddingLeft:8, color:isActive?T.accent:T.muted, fontSize:11, fontFamily:"'Space Mono',monospace", userSelect:"none", lineHeight:"22px" }}>
                  {i+1}
                </span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12, lineHeight:"22px", whiteSpace:"pre", color:"#e6edf3" }}
                  dangerouslySetInnerHTML={{ __html: highlight(ln) || "&nbsp;" }}
                />
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ width:260, minWidth:220, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          {/* Step note */}
          {currentStep.note && (
            <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`, background:T.accentSoft, fontSize:12, color:T.muted2, lineHeight:1.6 }}>
              <div style={{ fontSize:10, fontWeight:600, color:T.accent, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>📌 Step</div>
              {currentStep.note}
            </div>
          )}

          {/* Variables */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Variables</div>
            {Object.keys(currentStep.vars || {}).length === 0
              ? <div style={{ fontSize:11, color:T.muted }}>—</div>
              : Object.entries(currentStep.vars || {}).map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 8px", borderRadius:8, background:T.surface2, border:`1px solid ${T.border}`, marginBottom:4, fontSize:12, fontFamily:"'Space Mono',monospace" }}>
                  <span style={{ color:T.accent }}>{k}</span>
                  <span style={{ color:T.yellow }}>{String(v)}</span>
                </div>
              ))
            }
          </div>

          {/* Output */}
          <div style={{ padding:"12px 14px", flex:1 }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Output</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:T.green, background:"#0d1117", borderRadius:8, padding:"10px 12px", minHeight:60, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
              {currentStep.output || ""}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}` }}>
            <div style={{ height:4, background:T.surface3, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${((stepIdx+1)/steps.length)*100}%`, background:T.accent, borderRadius:99, transition:"width .2s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ctrlBtn = (bg: string, color: string): React.CSSProperties => ({
  padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer",
  background:bg, color, border:"none", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
});
