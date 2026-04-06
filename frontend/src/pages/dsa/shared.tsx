import { useRef, useEffect, useState } from "react";
import { T } from "./theme";

/* ── Button ── */
export const Btn = ({children,onClick,variant="ghost",disabled,full,style={}}:{
  children:any,onClick:any,variant?:string,disabled?:any,full?:any,style?:any
})=>{
  const v: Record<string,any> = {
    primary:{background:T.accent,color:"#fff",border:"none",boxShadow:`0 4px 14px ${T.accent}44`},
    ghost:{background:T.surface2,color:T.muted2,border:`1px solid ${T.border2}`},
    green:{background:T.greenSoft,color:T.green,border:`1px solid ${T.green}44`},
    red:{background:T.redSoft,color:T.red,border:`1px solid ${T.red}44`},
    yellow:{background:T.yellowSoft,color:T.yellow,border:`1px solid ${T.yellow}44`},
    teal:{background:T.tealSoft,color:T.teal,border:`1px solid ${T.teal}44`},
    orange:{background:T.orangeSoft,color:T.orange,border:`1px solid ${T.orange}44`},
    blue:{background:T.blueSoft,color:T.blue,border:`1px solid ${T.blue}44`},
  };
  return <button onClick={onClick} disabled={disabled} style={{
    padding:"6px 12px",borderRadius:100,fontSize:11,fontWeight:600,
    fontFamily:"'DM Sans',sans-serif",cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?.38:1,transition:"all .18s",display:"flex",alignItems:"center",
    gap:5,whiteSpace:"nowrap",width:full?"100%":undefined,justifyContent:full?"center":undefined,
    ...v[variant],...style
  }}>{children}</button>;
};

/* ── Text Input ── */
export const Input = ({value,onChange,placeholder,onEnter,mono,style={}}:{
  value:string,onChange:(v:string)=>void,placeholder?:string,onEnter?:()=>void,mono?:boolean,style?:any
})=>(
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    onKeyDown={e=>e.key==="Enter"&&onEnter?.()} style={{
    background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",
    fontFamily:mono?"'Space Mono',monospace":"'DM Sans',sans-serif",...style
  }}/>
);

/* ── Section Label ── */
export const SLabel = ({children}:{children:any})=>(
  <div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{children}</div>
);

/* ── Info Box (Collapsible on Mobile) ── */
export const InfoBox = ({children,style={}}:{children:any,style?:any})=>(
  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.muted2,lineHeight:1.65,overflow:"hidden",...style}}>
    <details className="md:pointer-events-none group">
      <summary className="md:list-none p-2.5 md:p-3 cursor-pointer md:cursor-default font-semibold text-[10px] uppercase tracking-wider flex items-center justify-between outline-none" style={{color:T.muted}}>
         Complexity Details
        <span className="md:hidden opacity-50 group-open:rotate-180 transition-transform">⌄</span>
      </summary>
      <div className="px-3 pb-3 md:p-3 md:pt-0 border-t md:border-t-0" style={{borderColor:T.border}}>
        {children}
      </div>
    </details>
  </div>
);

/* ── Complexity Row ── */
export const CRow = ({op,val,color}:{op:string,val:string,color:string})=>(
  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
    <span style={{color:T.muted}}>{op}</span>
    <span style={{fontFamily:"'Space Mono',monospace",fontWeight:700,color}}>{val}</span>
  </div>
);

/* ── Activity Log ── */
export const Log = ({entries}:{entries:{m:string,t:string}[]})=>{
  const r=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(r.current)r.current.scrollTop=r.current.scrollHeight},[entries]);
  return <div ref={r} style={{background:T.surface3,borderRadius:10,padding:"8px 10px",fontFamily:"'Space Mono',monospace",fontSize:10,color:T.muted2,lineHeight:1.9,minHeight:48,maxHeight:120,overflowY:"auto"}}>
    {entries.map((e,i)=><div key={i} className="log" style={{color:e.t==="ok"?T.green:e.t==="err"?T.red:e.t==="warn"?T.yellow:T.accent}}>› {e.m}</div>)}
  </div>;
};

/* ── Log Section (hidden on mobile to maximise viz space) ── */
export const LogSection = ({entries}:{entries:{m:string,t:string}[]})=>(
  <div className="hidden md:block">
    <SLabel>Log</SLabel>
    <Log entries={entries}/>
  </div>
);

/* ── Sidebar Panel ── */
export const Side = ({children}:{children:any})=>(
  <div className="w-full max-h-[28vh] md:max-h-none md:w-56 md:min-w-[224px] border-b md:border-b-0 md:border-r p-3 md:p-4 flex flex-col gap-2.5 md:gap-4 overflow-y-auto shrink-0" style={{borderColor:T.border, background:T.bg}}>
    {children}
  </div>
);

/* ── Speed Selector ── */
export const SpeedRow = ({speed,setSpeed}:{speed:number,setSpeed:(n:number)=>void})=>(
  <div style={{display:"flex",gap:5}}>
    {([[800,"Slow"],[400,"Normal"],[150,"Fast"]] as [number,string][]).map(([ms,l])=>(
      <button key={ms} onClick={()=>setSpeed(ms)} style={{
        flex:1,padding:"5px 4px",borderRadius:8,fontSize:11,fontWeight:600,
        cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
        background:speed===ms?T.accentSoft:T.surface2,
        border:`1px solid ${speed===ms?T.accent+"66":T.border2}`,
        color:speed===ms?T.accent:T.muted2,transition:"all .15s"
      }}>{l}</button>
    ))}
  </div>
);

/* ── Badge ── */
export const Badge = ({children,color=T.accent}:{children:any,color?:string})=>(
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,padding:"2px 7px",borderRadius:100,fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{children}</span>
);

/* ── Select Dropdown ── */
export const Select = ({value,onChange,disabled,options,style={}}:{
  value:string,onChange:(v:string)=>void,disabled?:boolean,options:[string,string][],style?:any
})=>(
  <div style={{position:"relative",...style}}>
    <select
      value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
      style={{
        width:"100%",padding:"9px 32px 9px 12px",borderRadius:10,fontSize:12,fontWeight:600,
        fontFamily:"'DM Sans',sans-serif",background:T.surface2,color:disabled?T.muted:T.accent,
        border:`1px solid ${T.border2}`,cursor:disabled?"not-allowed":"pointer",
        appearance:"none",outline:"none"
      }}
    >
      {options.map(([k,l])=>(
        <option key={k} value={k} style={{background:T.surface,color:T.text}}>{l}</option>
      ))}
    </select>
    <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:T.muted,fontSize:10}}>▼</div>
  </div>
);

/* ── Step Guide (educational popup for demos) ── */
export interface GuideStep {
  title: string;
  body: string;
  tip?: string;
}

export function useStepGuide() {
  const [step, setStep] = useState<(GuideStep & { idx: number; total: number }) | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const show = (s: GuideStep, idx: number, total: number): Promise<void> =>
    new Promise(resolve => {
      resolveRef.current = resolve;
      setStep({ ...s, idx, total });
    });

  const next = () => {
    setStep(null);
    resolveRef.current?.();
    resolveRef.current = null;
  };

  const skip = () => {
    setStep(null);
    resolveRef.current?.();
    resolveRef.current = null;
    return true; // signals caller to skip remaining
  };

  const skipRef = useRef(false);
  const showGuide = async (s: GuideStep, idx: number, total: number) => {
    if (skipRef.current) return;
    await show(s, idx, total);
  };

  const Overlay = () => {
    if (!step) return null;
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn .2s ease",
        padding: "16px",
        overflowY: "auto",
      }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border2}`,
          borderRadius: 16, padding: "20px 22px", maxWidth: 420, width: "100%",
          boxShadow: `0 20px 60px rgba(0,0,0,.5), 0 0 20px ${T.accent}22`,
          animation: "popIn .3s cubic-bezier(.34,1.56,.64,1) both",
          maxHeight: "calc(100vh - 32px)", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              background: T.accentSoft, border: `1px solid ${T.accent}44`,
              borderRadius: 8, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700, color: T.accent,
            }}>{step.idx}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{step.title}</div>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace" }}>
                Step {step.idx} of {step.total}
              </div>
            </div>
            <div style={{
              fontSize: 18, opacity: 0.15,
            }}>📘</div>
          </div>

          {/* Body */}
          <div style={{
            fontSize: 13, color: T.muted2, lineHeight: 1.7,
            padding: "12px 14px", background: T.surface2,
            borderRadius: 10, border: `1px solid ${T.border}`,
            marginBottom: step.tip ? 10 : 16,
          }}>{step.body}</div>

          {/* Tip */}
          {step.tip && (
            <div style={{
              fontSize: 11, color: T.yellow, lineHeight: 1.6,
              padding: "8px 12px", background: T.yellowSoft,
              borderRadius: 8, border: `1px solid ${T.yellow}33`,
              marginBottom: 16, display: "flex", gap: 6, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
              <span>{step.tip}</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { skipRef.current = true; next(); }} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
              background: T.surface2, color: T.muted, border: `1px solid ${T.border2}`,
            }}>Skip All</button>
            <button onClick={next} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
              background: T.accent, color: "#fff", border: "none",
              boxShadow: `0 4px 14px ${T.accent}44`,
            }}>{step.idx === step.total ? "✓ Done" : "Next Step →"}</button>
          </div>
        </div>
      </div>
    );
  };

  const resetGuide = () => { skipRef.current = false; setStep(null); resolveRef.current = null; };

  return { showGuide, Overlay, resetGuide, isSkipped: () => skipRef.current };
}

/* ── Animation State Engine (Pausing / Resume) ── */
export function useAnimation() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const pauseResolver = useRef<(() => void) | null>(null);

  const start = () => {
    stopRef.current = false;
    pauseRef.current = false;
    setRunning(true);
    setPaused(false);
  };

  const pause = () => {
    /* Need state for UI rendering but refs for the async loop closure */
    pauseRef.current = true;
    setPaused(true);
  };

  const resume = () => {
    pauseRef.current = false;
    setPaused(false);
    if (pauseResolver.current) {
      pauseResolver.current();
      pauseResolver.current = null;
    }
  };

  const reset = () => {
    stopRef.current = true;
    setRunning(false);
    resume(); // Unblock any pending sleep calls so they can throw "stopped"
  };

  // Smart sleep function that indefinitely waits if paused
  const sleep = async (ms: number) => {
    if (stopRef.current) throw new Error("stopped");

    if (pauseRef.current) {
      await new Promise<void>(r => { pauseResolver.current = r; });
      if (stopRef.current) throw new Error("stopped");
    }

    await new Promise(r => setTimeout(r, ms));

    // Check again immediately after waking up
    if (pauseRef.current) {
      await new Promise<void>(r => { pauseResolver.current = r; });
    }
    
    if (stopRef.current) throw new Error("stopped");
  };

  return { running, paused, start, pause, resume, reset, sleep, stopRef, setRunning };
}

/* ── Unified Animation Controls ── */
export const Controls = ({ anim, run, reset }: { anim: ReturnType<typeof useAnimation>, run: () => void, reset: () => void }) => (
  <div style={{ display: "flex", gap: 10 }}>
    {!anim.running || anim.paused ? (
      <Btn full variant="primary" onClick={anim.paused ? anim.resume : run}>
        {anim.paused ? "▶ Resume" : "▶ Run"}
      </Btn>
    ) : (
      <Btn full variant="orange" onClick={anim.pause}>
        ⏸ Pause
      </Btn>
    )}
    <Btn full onClick={reset} disabled={!anim.running && !anim.paused}>
      ↺ Reset
    </Btn>
  </div>
);
