import { useRef, useEffect } from "react";
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
    padding:"8px 14px",borderRadius:100,fontSize:12,fontWeight:600,
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

/* ── Info Box ── */
export const InfoBox = ({children,style={}}:{children:any,style?:any})=>(
  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:13,fontSize:12,color:T.muted2,lineHeight:1.65,...style}}>
    {children}
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
  return <div ref={r} style={{background:T.surface3,borderRadius:10,padding:"8px 10px",fontFamily:"'Space Mono',monospace",fontSize:10,color:T.muted2,lineHeight:1.9,maxHeight:100,overflowY:"auto"}}>
    {entries.map((e,i)=><div key={i} className="log" style={{color:e.t==="ok"?T.green:e.t==="err"?T.red:e.t==="warn"?T.yellow:T.accent}}>› {e.m}</div>)}
  </div>;
};

/* ── Sidebar Panel ── */
export const Side = ({children}:{children:any})=>(
  <div style={{width:224,minWidth:224,borderRight:`1px solid ${T.border}`,padding:14,display:"flex",flexDirection:"column",gap:11,overflowY:"auto",background:T.surface,flexShrink:0}}>
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
