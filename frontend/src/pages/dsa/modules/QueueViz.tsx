import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input } from "../shared";

export default function QueueViz(){
  const [queue,setQueue]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Enqueue values to build the queue");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const enqueue=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);setVal("");
    const q=[...queue,v];setQueue(q);setHighlighted(q.length-1);
    addLog(`enqueue(${v}) → rear. size=${q.length}`,"ok");
    setLabel(`<strong>enqueue(${v})</strong> — added to rear. size=${q.length}`);
    setTimeout(()=>setHighlighted(-1),600);
  };
  const dequeue=()=>{
    if(!queue.length){addLog("Queue underflow!","err");return;}
    const v=queue[0];setHighlighted(0);
    addLog(`dequeue() → ${v}. size=${queue.length-1}`,"warn");
    setLabel(`<strong>dequeue()</strong> → ${v}. ${queue.length>1?`New front = ${queue[1]}`:"Queue empty"}`);
    setTimeout(()=>{setQueue(q=>q.slice(1));setHighlighted(-1)},400);
  };

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Enqueue Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={enqueue} mono/></div></div>
        <Btn onClick={enqueue} variant="primary" full>⊕ Enqueue</Btn>
        <Btn onClick={dequeue} variant="red" disabled={!queue.length} full>⊖ Dequeue</Btn>
        <Btn onClick={()=>{setQueue([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Queue (FIFO)</strong><br/><br/>
          First In, First Out. Think BFS, task scheduling, print queue.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Enqueue" val="O(1)" color={T.green}/><CRow op="Dequeue" val="O(1)" color={T.green}/>
            <CRow op="Front" val="O(1)" color={T.green}/><CRow op="Search" val="O(n)" color={T.yellow}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28,overflowX:"auto"}}>
          {queue.length===0?<div style={{color:T.muted,fontSize:13}}>Queue is empty — enqueue values</div>:(
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:T.accent,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>FRONT →</span>
              {queue.map((v,i)=>{
                const isFront=i===0,isRear=i===queue.length-1,isHL=i===highlighted;
                return(
                  <div key={i} className={isHL?"pop":""} style={{width:56,height:56,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,background:isHL?T.yellowSoft:isFront?T.accentSoft:isRear?T.greenSoft:T.surface2,border:`2px solid ${isHL?T.yellow:isFront?T.accent:isRear?T.green:T.border2}`,color:isHL?T.yellow:isFront?T.accent:isRear?T.green:T.muted2,boxShadow:isHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s"}}>
                    {v}<span style={{fontSize:8,color:T.muted}}>[{i}]</span>
                  </div>
                );
              })}
              <span style={{fontSize:10,color:T.green,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>← REAR</span>
            </div>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.muted}}>size={queue.length}</span>
        </div>
      </div>
    </div>
  );
}
