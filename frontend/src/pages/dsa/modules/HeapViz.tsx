import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, InfoBox, CRow, Log, Input } from "../shared";

export default function HeapViz(){
  const [heap,setHeap]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState<number[]>([]);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to build the heap");
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(400);
  const stopRef=useRef(false);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const hl=async(h:number[],idxs:number[],msg:string,t="info")=>{
    if(stopRef.current)throw new Error("s");
    setHeap([...h]);setHighlighted(idxs);setLabel(msg);addLog(msg,t);await sleep(speed);
  };

  const insert=async()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);
    setVal("");stopRef.current=false;setRunning(true);
    try{
      const h=[...heap,v];await hl(h,[h.length-1],`Insert ${v} at end [${h.length-1}]`);
      let i=h.length-1;
      while(i>0){
        const par=Math.floor((i-1)/2);
        if(h[par]>h[i]){await hl(h,[i,par],`Bubble up: ${h[i]} < parent ${h[par]} → swap`,"warn");[h[i],h[par]]=[h[par],h[i]];await hl(h,[par],`Swapped → ${h[par]} at [${par}]`,"ok");i=par;}
        else{await hl(h,[i,par],`${h[i]} ≥ parent ${h[par]} — heap OK`,"ok");break;}
      }
      setHeap([...h]);setHighlighted([]);addLog(`insert(${v}) done — size=${h.length}`,"ok");
    }catch(e){}
    setRunning(false);
  };

  const extractMin=async()=>{
    if(!heap.length){addLog("Heap is empty","err");return;}
    stopRef.current=false;setRunning(true);
    try{
      const h=[...heap];const min=h[0];
      await hl(h,[0],`Extract min = ${min}`);
      h[0]=h[h.length-1];h.pop();
      if(!h.length){setHeap([]);setHighlighted([]);setRunning(false);addLog(`extracted ${min}`,"ok");return;}
      await hl(h,[0],`Move last element to root`);
      let i=0;
      while(true){
        const l=2*i+1,r=2*i+2;let smallest=i;
        if(l<h.length&&h[l]<h[smallest])smallest=l;
        if(r<h.length&&h[r]<h[smallest])smallest=r;
        if(smallest===i){await hl(h,[i],`Heap property restored at [${i}]`,"ok");break;}
        await hl(h,[i,smallest],`Sink down: ${h[i]} > child ${h[smallest]} → swap`,"warn");
        [h[i],h[smallest]]=[h[smallest],h[i]];await hl(h,[smallest],`Swapped`,"ok");i=smallest;
      }
      setHeap([...h]);setHighlighted([]);addLog(`extracted min=${min}. New root=${h[0]}`,"ok");
    }catch(e){}
    setRunning(false);
  };

  const loadExample=()=>{
    const vals=[5,12,3,8,20,1,15,7];const h:number[]=[];
    vals.forEach(v=>{h.push(v);let i=h.length-1;while(i>0){const p=Math.floor((i-1)/2);if(h[p]>h[i]){[h[i],h[p]]=[h[p],h[i]];i=p;}else break;}});
    setHeap(h);setHighlighted([]);addLog("Loaded min-heap example","info");setLabel("Example heap loaded. Try extract-min or insert.");
  };

  const W=600,H=280,R=22;
  function getPos(i:number){
    const depth=Math.floor(Math.log2(i+1));
    const posInRow=i-(Math.pow(2,depth)-1);
    const totalInRow=Math.pow(2,depth);
    return{x:W*(posInRow+0.5)/totalInRow,y:40+depth*68};
  }

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Insert Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 14" onEnter={insert} mono/></div></div>
        <Btn onClick={insert} variant="primary" disabled={running} full>⊕ Insert</Btn>
        <Btn onClick={extractMin} variant="red" disabled={running||!heap.length} full>⊖ Extract Min</Btn>
        <Btn onClick={loadExample} variant="ghost" disabled={running} full>⚡ Load Example</Btn>
        <Btn onClick={()=>{setHeap([]);setHighlighted([]);addLog("reset","info")}} variant="ghost" disabled={running} full>↺ Reset</Btn>
        <div><SLabel>Speed</SLabel><div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div></div>
        <InfoBox>
          <strong style={{color:T.text}}>Min-Heap</strong><br/><br/>
          Parent ≤ Children always. Root = minimum element. Complete binary tree stored as array.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert" val="O(log n)" color={T.green}/>
            <CRow op="Extract Min" val="O(log n)" color={T.green}/>
            <CRow op="Peek Min" val="O(1)" color={T.green}/>
            <CRow op="Used in" val="Priority Queue" color={T.teal}/>
          </div>
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8,fontSize:10,fontFamily:"'Space Mono',monospace",color:T.muted}}>
            parent(i) = ⌊(i-1)/2⌋<br/>left(i) = 2i+1<br/>right(i) = 2i+2
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {heap.length===0?(
              <div style={{color:T.muted,fontSize:13}}>Heap is empty — insert values</div>
            ):(
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
                {heap.map((_,i)=>{
                  if(i===0)return null;
                  const par=Math.floor((i-1)/2),p=getPos(i),pp=getPos(par);
                  const isHL=highlighted.includes(i)||highlighted.includes(par);
                  return<line key={`e${i}`} x1={pp.x} y1={pp.y} x2={p.x} y2={p.y} stroke={isHL?T.yellow:T.surface3} strokeWidth={isHL?2.5:1.5}/>;
                })}
                {heap.map((v,i)=>{
                  const{x,y}=getPos(i),isHL=highlighted.includes(i),isMin=i===0;
                  const col=isHL?T.yellow:isMin?T.accent:T.blue;
                  return(
                    <g key={`n${i}`}>
                      <circle cx={x} cy={y} r={R} fill={isHL?T.yellowSoft:isMin?T.accentSoft:T.surface2} stroke={col} strokeWidth={isHL?3:1.8} style={isHL?{filter:`drop-shadow(0 0 10px ${T.yellow})`}:{}}/>
                      <text x={x} y={y+5} textAnchor="middle" fill={isHL?"#fff":col} fontSize="12" fontFamily="Space Mono" fontWeight="700">{v}</text>
                      <text x={x} y={y+R+14} textAnchor="middle" fill={T.surface3} fontSize="9" fontFamily="Space Mono">[{i}]</text>
                      {isMin&&<text x={x} y={y-R-6} textAnchor="middle" fill={T.accent} fontSize="9" fontFamily="DM Sans" fontWeight="600">MIN</text>}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,overflowX:"auto",background:T.surface2}}>
            <span style={{fontSize:10,color:T.muted,fontFamily:"'Space Mono',monospace",whiteSpace:"nowrap"}}>array:</span>
            {heap.map((v,i)=>(
              <div key={i} style={{width:36,height:32,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,flexShrink:0,background:highlighted.includes(i)?T.yellowSoft:T.surface3,border:`1px solid ${highlighted.includes(i)?T.yellow:T.border2}`,color:highlighted.includes(i)?T.yellow:T.muted2}}>{v}</div>
            ))}
          </div>
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}}>{label}</div>
      </div>
    </div>
  );
}
