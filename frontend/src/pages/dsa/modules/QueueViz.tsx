import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input, useStepGuide } from "../shared";

export default function QueueViz(){
  const [queue,setQueue]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Enqueue values to build the queue");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const guide = useStepGuide();

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

  const runDemo=async()=>{
    guide.resetGuide();
    setQueue([]);setHighlighted(-1);setLog([]);setLabel("⚡ Guided demo...");
    const T_STEPS = 7;

    await guide.showGuide({
      title:"What is a Queue?",
      body:"A Queue is a FIFO (First In, First Out) data structure. Think of a line at a store — the first person in line is served first.",
      tip:"Real-world uses: BFS traversal, task scheduling, print queues, message queues (Kafka, RabbitMQ)."
    }, 1, T_STEPS);

    const vals=[11,33,55,77,99];
    for(let i=0;i<vals.length;i++){
      if(guide.isSkipped()) break;
      const v=vals[i];
      setQueue(q=>{const nq=[...q,v];setHighlighted(nq.length-1);return nq;});
      addLog(`enqueue(${v})`,"ok");
      setLabel(`<strong>enqueue(${v})</strong>`);
      await new Promise(r=>setTimeout(r,400));
      if(i===0) await guide.showGuide({
        title:"Enqueue — Add to Rear",
        body:`enqueue(${v}) adds the element to the REAR (back) of the queue. New elements always join at the end, just like joining the back of a line.`,
        tip:"enqueue() is O(1) — we just append to the end."
      }, 2, T_STEPS);
      if(i===2) await guide.showGuide({
        title:"Queue Order — FIFO",
        body:"We now have [11, 33, 55]. Notice: 11 is at the FRONT (it entered first), and 55 is at the REAR (entered last). When we dequeue, 11 will come out first.",
        tip:"Unlike a stack (LIFO), the FIRST element in is the FIRST out. This is the fundamental difference."
      }, 3, T_STEPS);
      setHighlighted(-1);
      await new Promise(r=>setTimeout(r,150));
    }

    if(!guide.isSkipped()){
      await guide.showGuide({
        title:"Dequeue — Remove from Front",
        body:"dequeue() removes and returns the FRONT element. The element that has been waiting the longest gets served first — just like a real-world queue.",
        tip:"dequeue() is O(1). After removal, the next element becomes the new front."
      }, 4, T_STEPS);

      for(let i=0;i<2;i++){
        setHighlighted(0);
        await new Promise(r=>setTimeout(r,400));
        setQueue(q=>{addLog(`dequeue() → ${q[0]}`,"warn");setLabel(`<strong>dequeue()</strong> → ${q[0]}`);return q.slice(1);});
        setHighlighted(-1);
        await new Promise(r=>setTimeout(r,200));
      }

      await guide.showGuide({
        title:"Queue After Dequeue",
        body:"After dequeuing twice, 11 and 33 have been removed (they entered first). The queue now holds [55, 77, 99] with 55 at the front.",
        tip:"The order is always maintained — elements that entered earlier always leave earlier."
      }, 5, T_STEPS);

      await guide.showGuide({
        title:"When to Use a Queue?",
        body:"Use queues for: BFS graph traversal, scheduling tasks in order, handling requests (web servers), buffering data streams, and level-order tree traversal.",
        tip:"Interview tip: BFS always uses a queue. If the problem asks for 'shortest path in unweighted graph' or 'level by level' — think Queue!"
      }, 6, T_STEPS);

      await guide.showGuide({
        title:"Complexity Summary",
        body:"Enqueue: O(1) | Dequeue: O(1) | Front/Peek: O(1) | Search: O(n). Queues are optimized for ordered processing — add at back, remove from front.",
        tip:"In JavaScript, shift() is O(n) on arrays. For performance-critical code, use a linked list-based queue or a circular buffer."
      }, 7, T_STEPS);
    }

    setLabel("✓ Demo complete! Queue has 3 elements");
  };

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Enqueue Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={enqueue} mono/></div></div>
        <Btn onClick={enqueue} variant="primary" full>⊕ Enqueue</Btn>
        <Btn onClick={dequeue} variant="red" disabled={!queue.length} full>⊖ Dequeue</Btn>
        <Btn onClick={runDemo} variant="yellow" full>⚡ Learn Queue</Btn>
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
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28,overflowX:"auto",position:"relative"}}>
          <guide.Overlay/>
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
