import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Badge } from "../shared";

export default function MergeViz(){
  const [leftInput,setLeftInput]=useState("2 5 8 12");
  const [rightInput,setRightInput]=useState("1 3 7 11 15");
  const [steps,setSteps]=useState<any[]>([]);
  const [stepIdx,setStepIdx]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);

  const buildSteps=()=>{
    const L=leftInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    const R=rightInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    if(!L.length||!R.length)return;
    const ss:any[]=[]; let i=0,j=0; const merged:number[]=[];
    ss.push({L:[...L],R:[...R],merged:[],li:0,ri:0,desc:"Start: compare pointers at index 0 of each array"});
    while(i<L.length&&j<R.length){
      const take=L[i]<=R[j]?"left":"right";
      merged.push(take==="left"?L[i]:R[j]);
      const desc=take==="left"?`L[${i}]=${L[i]} ≤ R[${j}]=${R[j]} → take from Left`:`R[${j}]=${R[j]} < L[${i}]=${L[i]} → take from Right`;
      if(take==="left")i++;else j++;
      ss.push({L,R,merged:[...merged],li:i,ri:j,desc,last:take});
    }
    while(i<L.length){merged.push(L[i]);ss.push({L,R,merged:[...merged],li:i+1,ri:j,desc:`Drain Left: append ${L[i]}`,last:"left"});i++;}
    while(j<R.length){merged.push(R[j]);ss.push({L,R,merged:[...merged],li:i,ri:j+1,desc:`Drain Right: append ${R[j]}`,last:"right"});j++;}
    ss.push({L,R,merged:[...merged],li:i,ri:j,desc:"✓ Merged! Result is sorted.",done:true});
    setSteps(ss);setStepIdx(0);setLog([{m:"Built merge steps. Press Next →",t:"info"}]);
  };

  const step=steps[stepIdx]||null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Left Array (space-separated)</SLabel>
          <input value={leftInput} onChange={e=>setLeftInput(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",fontFamily:"'Space Mono',monospace",marginTop:6}}/>
        </div>
        <div><SLabel>Right Array</SLabel>
          <input value={rightInput} onChange={e=>setRightInput(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",fontFamily:"'Space Mono',monospace",marginTop:6}}/>
        </div>
        <Btn onClick={buildSteps} variant="primary" full>⚙ Build Merge Steps</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Merge (Two Sorted Arrays)</strong><br/><br/>
          Core of Merge Sort. Two pointers walk both arrays, always picking the smaller element.
          <div style={{marginTop:10,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
            <CRow op="Time" val="O(n+m)" color={T.green}/>
            <CRow op="Space" val="O(n+m)" color={T.orange}/>
            <CRow op="Stable" val="Yes ✓" color={T.teal}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28,padding:28}}>
          {step?(
            <>
              <div style={{display:"flex",gap:40}}>
                {[{label:"Left",arr:step.L,ptr:step.li,color:T.accent},{label:"Right",arr:step.R,ptr:step.ri,color:T.green}].map(({label,arr,ptr,color})=>(
                  <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{fontSize:11,fontWeight:600,color}}>{label}</div>
                    <div style={{display:"flex",gap:6}}>
                      {arr.map((v:number,i:number)=>{
                        const isPtr=i===ptr,isDone=i<ptr;
                        return(
                          <div key={i} className={isPtr?"pop":""} style={{
                            width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                            background:isDone?T.surface3:isPtr?color+"33":T.surface2,
                            border:`2px solid ${isDone?T.surface3:isPtr?color:color+"55"}`,
                            color:isDone?T.muted:isPtr?"#fff":color,
                            opacity:isDone?.45:1,boxShadow:isPtr?`0 0 14px ${color}66`:"none",transition:"all .2s",
                          }}>{v}</div>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:6,paddingTop:2}}>
                      {arr.map((_:any,i:number)=>(
                        <div key={i} style={{width:44,textAlign:"center",fontSize:10,color:i===ptr?color:T.muted,fontFamily:"'Space Mono',monospace"}}>
                          {i===ptr?"↑ ptr":""}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:20,color:T.muted}}>↓</div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{fontSize:11,fontWeight:600,color:step.done?T.yellow:T.muted2}}>Merged Result</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {step.merged.map((v:number,i:number)=>{
                    const isLast=i===step.merged.length-1&&!step.done;
                    return(
                      <div key={i} className={isLast?"mgr":""} style={{
                        width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                        background:step.done?T.yellowSoft:isLast?T.accentSoft:T.surface2,
                        border:`2px solid ${step.done?T.yellow:isLast?T.purple:T.border2}`,
                        color:step.done?T.yellow:isLast?T.purple:T.muted2,
                        boxShadow:isLast?`0 0 12px ${T.purple}66`:"none",
                      }}>{v}</div>
                    );
                  })}
                  {step.merged.length===0&&<div style={{color:T.muted,fontSize:13}}>empty so far</div>}
                </div>
              </div>
            </>
          ):(
            <div style={{color:T.muted,fontSize:13}}>Set arrays above and click Build</div>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,fontSize:12,color:T.muted2}}>{step?.desc||"–"}</div>
          <Btn onClick={()=>setStepIdx(i=>Math.max(0,i-1))} disabled={stepIdx<=0||!step}>← Back</Btn>
          <span style={{fontSize:11,color:T.muted,fontFamily:"'Space Mono',monospace"}}>{step?`${stepIdx+1}/${steps.length}`:"-"}</span>
          <Btn onClick={()=>{setStepIdx(i=>{const n=Math.min(steps.length-1,i+1);setLog(l=>[...l.slice(-30),{m:steps[n]?.desc||"",t:"ok"}]);return n;})}} variant="primary" disabled={stepIdx>=steps.length-1||!step}>Next →</Btn>
        </div>
      </div>
    </div>
  );
}
