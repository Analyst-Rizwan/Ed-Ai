import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input } from "../shared";

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
    const k=parseInt(searchVal);if(isNaN(k))return;setSearchVal("");
    for(let i=0;i<nodes.length;i++){
      setSearchHL(i);
      addLog(`node[${i}]=${nodes[i].val} ${nodes[i].val===k?"✓ FOUND":"≠ "+k}`,nodes[i].val===k?"ok":"info");
      await sleep(400);
      if(nodes[i].val===k){setLabel(`<strong>search(${k})</strong> → found at position ${i}`);setTimeout(()=>setSearchHL(-1),800);return;}
    }
    setLabel(`<strong>search(${k})</strong> → not found`);addLog(`${k} not in list`,"err");setSearchHL(-1);
  };

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={insertHead} mono/></div></div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={insertHead} variant="primary" style={{flex:1}}>+ Head</Btn>
          <Btn onClick={insertTail} variant="green" style={{flex:1}}>+ Tail</Btn>
        </div>
        <Btn onClick={deleteHead} variant="red" disabled={!nodes.length} full>⊖ Delete Head</Btn>
        <div><SLabel>Search</SLabel><div style={{marginTop:6}}><Input value={searchVal} onChange={setSearchVal} placeholder="find value" onEnter={search} mono/></div></div>
        <Btn onClick={search} variant="ghost" full>🔍 Search</Btn>
        <Btn onClick={()=>{setNodes([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Singly Linked List</strong><br/><br/>
          Each node points to the next. No random access — must traverse.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert Head" val="O(1)" color={T.green}/><CRow op="Insert Tail" val="O(n)" color={T.yellow}/>
            <CRow op="Delete Head" val="O(1)" color={T.green}/><CRow op="Search" val="O(n)" color={T.yellow}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:28,overflowX:"auto"}}>
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
