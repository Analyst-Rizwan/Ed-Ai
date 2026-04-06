import { useState, useRef } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, SpeedRow, LogSection, Input, useStepGuide, useAnimation, Controls } from "../shared";

export default function HeapViz(){
  const [heap,setHeap]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState<number[]>([]);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to build the heap");
  const anim=useAnimation();
  const [speed,setSpeed]=useState(400);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const guide = useStepGuide();

  const hl=async(h:number[],idxs:number[],msg:string,t="info")=>{
    if(anim.stopRef.current)throw new Error("s");
    setHeap([...h]);setHighlighted(idxs);setLabel(msg);addLog(msg,t);await anim.sleep(speed);
  };

  const insert=async()=>{
    if(anim.running)return;
    const v=parseInt(val)||Math.floor(Math.random()*90+5);
    setVal("");anim.start();
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
    anim.setRunning(false);
  };

  const extractMin=async()=>{
    if(!heap.length){addLog("Heap is empty","err");return;}
    if(anim.running)return;
    anim.start();
    try{
      const h=[...heap];const min=h[0];
      await hl(h,[0],`Extract min = ${min}`);
      h[0]=h[h.length-1];h.pop();
      if(!h.length){setHeap([]);setHighlighted([]);anim.setRunning(false);addLog(`extracted ${min}`,"ok");return;}
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
    anim.setRunning(false);
  };

  const loadExample=async()=>{
    guide.resetGuide();
    await guide.showGuide({
      title:"What is a Heap?",
      body:"A Heap is a complete binary tree stored as an array where the parent is always ≤ its children (min-heap) or ≥ (max-heap). The ROOT always holds the min (or max) value.",
      tip:"Heaps are used to implement Priority Queues. Common uses: Dijkstra's algorithm, job scheduling, finding k-th largest/smallest element."
    }, 1, 3);
    if(!guide.isSkipped()) await guide.showGuide({
      title:"Heap Operations",
      body:"Insert: Add at the end, then 'bubble up' (swap with parent until heap property is restored). Extract-Min: Remove root, move last element to root, then 'sink down' (swap with smaller child). Both are O(log n).",
      tip:"Array indexing: parent(i) = ⌊(i-1)/2⌋, left(i) = 2i+1, right(i) = 2i+2. No pointers needed!"
    }, 2, 3);
    const vals=[5,12,3,8,20,1,15,7];const h:number[]=[];
    vals.forEach(v=>{h.push(v);let i=h.length-1;while(i>0){const p=Math.floor((i-1)/2);if(h[p]>h[i]){[h[i],h[p]]=[h[p],h[i]];i=p;}else break;}});
    setHeap(h);setHighlighted([]);addLog("Loaded min-heap example","info");setLabel("Example heap loaded. Try extract-min or insert.");
    if(!guide.isSkipped()) await guide.showGuide({
      title:"Min-Heap Loaded!",
      body:"A min-heap with values [5,12,3,8,20,1,15,7] is loaded. The root (1) is the smallest. Try: Insert a value to see bubble-up, or Extract Min to see sink-down.",
      tip:"Notice the array view at the bottom — the tree is stored as a flat array! This is memory-efficient with no pointer overhead."
    }, 3, 4);
    if(!guide.isSkipped()) await guide.showGuide({
      title:"Complexity Breakdown",
      body:"Insert: O(log n) to bubble up. Extract Min: O(log n) to sink down. Peek Min: O(1).",
      tip:"A complete binary tree stored as an array is perfect for priority queues!"
    }, 4, 4);
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
        {!anim.running ? (
          <>
            <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
            <Btn onClick={extractMin} variant="red" disabled={!heap.length} full>⊖ Extract Min</Btn>
          </>
        ) : (
          <Controls anim={anim} run={() => {}} reset={() => { anim.reset(); setHighlighted([]); }} />
        )}
        <Btn onClick={loadExample} variant="yellow" disabled={anim.running} full>⚡ Load Example Heap</Btn>
        <Btn onClick={()=>{setHeap([]);setHighlighted([]);addLog("reset","info");anim.reset();}} variant="ghost" disabled={anim.running} full>↺ Clear Tree</Btn>
        <div><SLabel>Speed</SLabel><div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div></div>

        <LogSection entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <guide.Overlay/>
            {heap.length===0?(
              <div style={{color:T.muted,fontSize:13}}>Heap is empty — insert values</div>
            ):(
              <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{overflow:"visible"}}>
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
