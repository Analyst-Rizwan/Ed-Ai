import { useState, useRef } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, Log, Input, useStepGuide, useAnimation, Controls } from "../shared";

export default function LinkedListViz(){
  const [nodes,setNodes]=useState<{val:number,id:number}[]>([]);
  const [val,setVal]=useState("");
  const [searchVal,setSearchVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [searchHL,setSearchHL]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to build the list");
  const idRef=useRef(0);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const guide = useStepGuide();
  const anim = useAnimation();

  const insertHead=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);setVal("");
    const n={val:v,id:idRef.current++};
    setNodes(ns=>[n,...ns]);setHighlighted(0);
    addLog(`insertHead(${v})`,"ok");setLabel(`<strong>insertHead(${v})</strong> — new head`);
    setTimeout(()=>setHighlighted(-1),600);
  };
  const insertTail=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);setVal("");
    const n={val:v,id:idRef.current++};
    setNodes(ns=>{const r=[...ns,n];setHighlighted(r.length-1);return r;});
    addLog(`insertTail(${v})`,"ok");setLabel(`<strong>insertTail(${v})</strong> — new tail`);
    setTimeout(()=>setHighlighted(-1),600);
  };
  const deleteHead=()=>{
    if(!nodes.length){addLog("List empty","err");return;}
    setHighlighted(0);
    addLog(`deleteHead() → ${nodes[0].val}`,"warn");setLabel(`<strong>deleteHead()</strong> → removed ${nodes[0].val}`);
    setTimeout(()=>{setNodes(ns=>ns.slice(1));setHighlighted(-1)},400);
  };
  const search=async()=>{
    if(anim.running)return;
    const k=parseInt(searchVal);if(isNaN(k))return;setSearchVal("");
    anim.start();
    try {
      for(let i=0;i<nodes.length;i++){
        setSearchHL(i);
        addLog(`node[${i}]=${nodes[i].val} ${nodes[i].val===k?"✓ FOUND":"≠ "+k}`,nodes[i].val===k?"ok":"info");
        await anim.sleep(400);
        if(anim.stopRef.current)throw new Error("stopped");
        if(nodes[i].val===k){setLabel(`<strong>search(${k})</strong> → found at position ${i}`);setTimeout(()=>setSearchHL(-1),800);anim.setRunning(false);return;}
      }
      setLabel(`<strong>search(${k})</strong> → not found`);addLog(`${k} not in list`,"err");setSearchHL(-1);
    }catch(e:any){if(e.message!=="stopped")throw e;}
    anim.setRunning(false);
  };

  const runDemo=async()=>{
    if(anim.running)return;
    guide.resetGuide();
    setNodes([]);setHighlighted(-1);setSearchHL(-1);setLog([]);setLabel("⚡ Guided demo...");
    const T_STEPS = 7;
    anim.start();

    try {
      await guide.showGuide({
        title:"What is a Linked List?",
        body:"A Linked List stores elements as nodes, where each node contains data and a pointer to the next node. Unlike arrays, elements are NOT stored contiguously in memory.",
        tip:"Key advantage: insertions and deletions don't require shifting elements. Key disadvantage: no random access (can't jump to index i directly)."
      }, 1, T_STEPS);

      const items=[20,15,30,10,25];
      for(let i=0;i<items.length;i++){
        if(guide.isSkipped()) break;
        const v=items[i];const n={val:v,id:idRef.current++};
        if(i%2===0){setNodes(ns=>{const r=[n,...ns];setHighlighted(0);return r;});addLog(`insertHead(${v})`,"ok");setLabel(`<strong>insertHead(${v})</strong>`);}
        else{setNodes(ns=>{const r=[...ns,n];setHighlighted(r.length-1);return r;});addLog(`insertTail(${v})`,"ok");setLabel(`<strong>insertTail(${v})</strong>`);}
        await anim.sleep(500);if(anim.stopRef.current)throw new Error("stopped");
        if(i===0) await guide.showGuide({
          title:"Insert at Head — O(1)",
          body:"insertHead(20) creates a new node and makes it the head. We just update the head pointer — no traversal needed. This is always O(1).",
          tip:"The new node's 'next' pointer is set to the old head, then the head reference is updated to the new node."
        }, 2, T_STEPS);
        if(i===1) await guide.showGuide({
          title:"Insert at Tail — O(n)",
          body:"insertTail(15) adds a node at the end. We must traverse the entire list to find the last node, then set its 'next' pointer to the new node.",
          tip:"Unlike insertHead, insertTail is O(n) because we need to walk to the end. A doubly-linked list with a tail pointer makes this O(1)."
        }, 3, T_STEPS);
        setHighlighted(-1);await anim.sleep(150);if(anim.stopRef.current)throw new Error("stopped");
      }

      if(!guide.isSkipped()){
        // Search
        await guide.showGuide({
          title:"Search — Sequential Traversal",
          body:"To find a value, we must start at the head and follow 'next' pointers one by one until we find it (or reach NULL). This is O(n) — no shortcuts.",
          tip:"This is the main tradeoff vs arrays: arrays give O(1) access by index, but linked lists need O(n) traversal."
        }, 4, T_STEPS);

        const target=30;
        for(let i=0;i<5;i++){
          if(guide.isSkipped()) break;
          setSearchHL(i);
          const nodeVal=[25,10,30,15,20][i];
          addLog(`checking node ${i}...`,nodeVal===target?"ok":"info");
          await anim.sleep(450);if(anim.stopRef.current)throw new Error("stopped");
          if(nodeVal===target){setLabel(`<strong>search(${target})</strong> → found!`);await anim.sleep(400);if(anim.stopRef.current)throw new Error("stopped");break;}
        }
        setSearchHL(-1);

        await guide.showGuide({
          title:"Delete Head — O(1)",
          body:"Deleting the head is simple: just move the head pointer to the next node. The old head is garbage collected. No traversal needed.",
          tip:"Deleting from the middle or tail requires traversal to find the previous node — that's O(n)."
        }, 5, T_STEPS);

        setHighlighted(0);addLog("deleteHead()","warn");setLabel(`<strong>deleteHead()</strong>`);
        await anim.sleep(500);if(anim.stopRef.current)throw new Error("stopped");setNodes(ns=>ns.slice(1));setHighlighted(-1);

        await guide.showGuide({
          title:"When to Use Linked Lists?",
          body:"Use linked lists when you need frequent insertions/deletions (especially at the head), when you don't know the size in advance, or when implementing stacks/queues.",
          tip:"Interview tip: Linked list problems often involve two-pointer technique, reversals, cycle detection (Floyd's), or merge operations."
        }, 6, T_STEPS);

        await guide.showGuide({
          title:"Complexity Summary",
          body:"Insert Head: O(1) | Insert Tail: O(n) | Delete Head: O(1) | Search: O(n) | Access by index: O(n). Space: O(n) with extra pointer overhead per node.",
          tip:"Compared to arrays: arrays have O(1) access but O(n) insertion. Linked lists have O(1) insertion at head but O(n) access."
        }, 7, T_STEPS);
      }
      setLabel("✓ Demo complete!");
    }catch(e:any){if(e.message!=="stopped")throw e;}
    anim.setRunning(false);
  };

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={insertHead} mono/></div></div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={insertHead} variant="primary" disabled={anim.running} style={{flex:1}}>+ Head</Btn>
          <Btn onClick={insertTail} variant="green" disabled={anim.running} style={{flex:1}}>+ Tail</Btn>
        </div>
        <Btn onClick={deleteHead} variant="red" disabled={anim.running||!nodes.length} full>⊖ Delete Head</Btn>
        <div><SLabel>Search</SLabel><div style={{marginTop:6}}><Input value={searchVal} onChange={setSearchVal} placeholder="find value" onEnter={search} mono/></div></div>
        
        {!anim.running ? (
          <>
            <Btn onClick={search} variant="ghost" full>🔍 Search</Btn>
            <Btn onClick={runDemo} variant="yellow" full>⚡ Learn Linked List</Btn>
          </>
        ) : (
          <Controls anim={anim} run={() => {}} reset={() => { anim.reset(); setSearchHL(-1); }} />
        )}
        <Btn onClick={()=>{setNodes([]);addLog("reset","info");anim.reset();}} variant="ghost" disabled={anim.running} full>↺ Reset</Btn>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28,overflowX:"auto",position:"relative"}}>
          <guide.Overlay/>
          {nodes.length===0?<div style={{color:T.muted,fontSize:13}}>List is empty — insert values</div>:(
            <div style={{display:"flex",gap:0,alignItems:"center"}}>
              <span style={{fontSize:9,color:T.accent,fontWeight:700,marginRight:8}}>HEAD</span>
              {nodes.map((n,i)=>{
                const isHL=i===highlighted,isSHL=i===searchHL;
                return(
                  <div key={n.id} style={{display:"flex",alignItems:"center"}} className={isHL?"pop":""}>
                    <div style={{width:64,height:48,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,background:isSHL?T.yellowSoft:isHL?T.greenSoft:T.surface2,border:`2px solid ${isSHL?T.yellow:isHL?T.green:T.border2}`,color:isSHL?T.yellow:isHL?T.green:T.muted2,boxShadow:isSHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s"}}>
                      {n.val}<span style={{fontSize:8,color:T.muted}}>{i===0?"head":i===nodes.length-1?"tail":""}</span>
                    </div>
                    {i<nodes.length-1&&<span style={{color:T.accent,fontSize:16,margin:"0 4px"}}>→</span>}
                  </div>
                );
              })}
              <span style={{color:T.red,fontSize:12,marginLeft:8}}>NULL</span>
            </div>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.muted}}>length={nodes.length}</span>
        </div>
      </div>
    </div>
  );
}
