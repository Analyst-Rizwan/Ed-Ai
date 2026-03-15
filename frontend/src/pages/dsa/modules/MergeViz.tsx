import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Badge, useStepGuide } from "../shared";
import { motion, AnimatePresence } from "framer-motion";

export default function MergeViz(){
  const [leftInput,setLeftInput]=useState("2 5 8 12");
  const [rightInput,setRightInput]=useState("1 3 7 11 15");
  const [steps,setSteps]=useState<any[]>([]);
  const [stepIdx,setStepIdx]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);

  const guide = useStepGuide();

  const buildSteps=()=>{
    const L=leftInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b).map((v,i)=>({v,id:`l-${i}`}));
    const R=rightInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b).map((v,i)=>({v,id:`r-${i}`}));
    if(!L.length||!R.length)return;
    const ss:any[]=[]; let i=0,j=0; const merged:any[]=[];
    ss.push({L:[...L],R:[...R],merged:[],li:0,ri:0,desc:"Start: compare pointers at index 0 of each array"});
    while(i<L.length&&j<R.length){
      const take=L[i].v<=R[j].v?"left":"right";
      merged.push(take==="left"?L[i]:R[j]);
      const desc=take==="left"?`L[${i}]=${L[i].v} ≤ R[${j}]=${R[j].v} → take from Left`:`R[${j}]=${R[j].v} < L[${i}]=${L[i].v} → take from Right`;
      if(take==="left")i++;else j++;
      ss.push({L,R,merged:[...merged],li:i,ri:j,desc,last:take});
    }
    while(i<L.length){merged.push(L[i]);ss.push({L,R,merged:[...merged],li:i+1,ri:j,desc:`Drain Left: append ${L[i].v}`,last:"left"});i++;}
    while(j<R.length){merged.push(R[j]);ss.push({L,R,merged:[...merged],li:i,ri:j+1,desc:`Drain Right: append ${R[j].v}`,last:"right"});j++;}
    ss.push({L,R,merged:[...merged],li:i,ri:j,desc:"✓ Merged! Result is sorted.",done:true});
    setSteps(ss);setStepIdx(0);setLog([{m:"Built merge steps. Press Next →",t:"info"}]);
  };

  const step=steps[stepIdx]||null;

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Left Array (space-separated)</SLabel>
          <input value={leftInput} onChange={e=>setLeftInput(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",fontFamily:"'Space Mono',monospace",marginTop:6}}/>
        </div>
        <div><SLabel>Right Array</SLabel>
          <input value={rightInput} onChange={e=>setRightInput(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",fontFamily:"'Space Mono',monospace",marginTop:6}}/>
        </div>
        <Btn onClick={buildSteps} variant="primary" full>⚙ Build Merge Steps</Btn>
        <Btn onClick={async()=>{
          guide.resetGuide();
          await guide.showGuide({
            title:"Merge Step (Merge Sort)",
            body:"Merging is the core operation of Merge Sort. Given two SORTED arrays, we combine them into one sorted array using two pointers. Each pointer starts at the beginning of its array.",
            tip:"The merge operation is O(n) where n = total elements. Merge Sort recursively divides, then merges — total: O(n log n)."
          }, 1, 2);
          if(!guide.isSkipped()) await guide.showGuide({
            title:"Two-Pointer Merge",
            body:"Compare elements at both pointers. Take the smaller one, advance that pointer. Repeat until one array is exhausted, then append the remaining elements.",
            tip:"This is why Merge Sort is STABLE — equal elements maintain their relative order. It always takes O(n) extra space for the merged output."
          }, 2, 2);
          setLeftInput("3 8 14 21 35");setRightInput("1 6 10 18 28 42");setTimeout(buildSteps,50);
        }} variant="yellow" full>⚡ Learn Merge</Btn>
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
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
            <guide.Overlay/>
          {step?(
            <>
              <div style={{display:"flex",gap:40}}>
                {[{label:"Left",arr:step.L,ptr:step.li,color:T.accent},{label:"Right",arr:step.R,ptr:step.ri,color:T.green}].map(({label,arr,ptr,color})=>(
                  <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{fontSize:11,fontWeight:600,color}}>{label}</div>
                    <div style={{display:"flex",gap:6}}>
                      {arr.map((item:any,i:number)=>{
                        const isPtr=i===ptr,isDone=i<ptr;
                        return(
                          <motion.div layout transition={{type:"spring",stiffness:300,damping:25}} key={item.id} className={isPtr?"pop":""} style={{
                            width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                            background:isDone?T.surface3:isPtr?color+"33":T.surface2,
                            border:`2px solid ${isDone?T.surface3:isPtr?color:color+"55"}`,
                            color:isDone?T.muted:isPtr?"#fff":color,
                            opacity:isDone?.45:1,boxShadow:isPtr?`0 0 14px ${color}66`:"none",transition:"all .2s",
                          }}>{item.v}</motion.div>
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
                  <AnimatePresence mode="popLayout">
                    {step.merged.map((item:any,i:number)=>{
                      const isLast=i===step.merged.length-1&&!step.done;
                      return(
                        <motion.div layout initial={{opacity:0,scale:0.5,y:-20}} animate={{opacity:1,scale:1,y:0}} transition={{type:"spring",stiffness:400,damping:25}} key={item.id} className={isLast?"mgr":""} style={{
                          width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                          fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                          background:step.done?T.yellowSoft:isLast?T.accentSoft:T.surface2,
                          border:`2px solid ${step.done?T.yellow:isLast?T.purple:T.border2}`,
                          color:step.done?T.yellow:isLast?T.purple:T.muted2,
                          boxShadow:isLast?`0 0 12px ${T.purple}66`:"none",
                        }}>{item.v}</motion.div>
                      );
                    })}
                  </AnimatePresence>
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
