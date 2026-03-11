import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input, Badge } from "../shared";

export default function HashViz(){
  const SIZE=11;
  const [mode,setMode]=useState("linear");
  const [table,setTable]=useState<number[][]>(Array.from({length:SIZE},()=>[]));
  const [val,setVal]=useState("");
  const [searchVal,setSearchVal]=useState("");
  const [highlighted,setHighlighted]=useState<number[]>([]);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to see hashing in action");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const hash=(k:number)=>((k%SIZE)+SIZE)%SIZE;
  const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

  const insert=async()=>{
    const k=parseInt(val)||Math.floor(Math.random()*99+1);setVal("");
    const h=hash(k);const t=[...table.map(b=>[...b])];
    addLog(`hash(${k}) = ${k} % ${SIZE} = ${h}`,"info");
    if(mode==="chaining"){
      setHighlighted([h]);await sleep(400);
      t[h]=[...t[h],k];setTable(t);setHighlighted([]);
      addLog(`insert ${k} → chain at [${h}], length=${t[h].length}`,"ok");
      setLabel(`<strong>insert(${k})</strong> — hash=${h}, chained. Bucket [${h}] has ${t[h].length} items`);
    } else {
      let idx=h,probes=0;
      while(t[idx].length>0&&probes<SIZE){
        setHighlighted([idx]);addLog(`Slot [${idx}] occupied → probe +1`,"warn");await sleep(350);idx=(idx+1)%SIZE;probes++;
      }
      if(probes>=SIZE){addLog("Hash table full!","err");return;}
      setHighlighted([idx]);await sleep(300);t[idx]=[k];setTable(t);setHighlighted([]);
      addLog(`insert ${k} → slot [${idx}] (${probes} probe${probes!==1?"s":""})`,"ok");
      setLabel(`<strong>insert(${k})</strong> — hash=${h}, placed at [${idx}] after ${probes} probe${probes!==1?"s":""}`);
    }
  };

  const search=async()=>{
    const k=parseInt(searchVal);if(isNaN(k))return;
    const h=hash(k);addLog(`search(${k}) → hash=${h}`,"info");
    if(mode==="chaining"){
      setHighlighted([h]);await sleep(400);
      const found=table[h].includes(k);
      setLabel(`<strong>search(${k})</strong> → bucket [${h}]: ${found?"✓ found":"✗ not found"}`);
      addLog(`bucket [${h}]: ${found?"found":"not found"}`,found?"ok":"err");
      setTimeout(()=>setHighlighted([]),900);
    } else {
      let idx=h,probes=0;
      while(probes<SIZE){
        setHighlighted([idx]);await sleep(350);
        if(table[idx].length===0){setLabel(`search(${k}) → ✗ not found`);addLog("not found","err");setTimeout(()=>setHighlighted([]),800);return;}
        if(table[idx][0]===k){setLabel(`<strong>search(${k})</strong> → ✓ found at [${idx}]`);addLog(`found at [${idx}]`,"ok");setTimeout(()=>setHighlighted([]),800);return;}
        idx=(idx+1)%SIZE;probes++;
      }
      addLog("not found","err");
    }
    setSearchVal("");
  };

  const reset=()=>{setTable(Array.from({length:SIZE},()=>[]));setHighlighted([]);addLog("reset","info");};

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Collision Strategy</SLabel>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            {[["linear","Linear Probe"],["chaining","Chaining"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setMode(k);reset()}} style={{flex:1,padding:"7px 6px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:mode===k?T.accentSoft:T.surface2,border:`1px solid ${mode===k?T.accent+"66":T.border2}`,color:mode===k?T.accent:T.muted2,transition:"all .15s"}}>{l}</button>
            ))}
          </div>
        </div>
        <div><SLabel>Insert Key</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="integer key" onEnter={insert} mono/></div></div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
        <div><SLabel>Search Key</SLabel><div style={{marginTop:6}}><Input value={searchVal} onChange={setSearchVal} placeholder="find key" onEnter={search} mono/></div></div>
        <Btn onClick={search} variant="ghost" full>🔍 Search</Btn>
        <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>{mode==="linear"?"Linear Probing":"Chaining"}</strong><br/><br/>
          hash(k) = k mod {SIZE}<br/><br/>
          {mode==="linear"?"On collision: try next slot (+1). Can cause clustering.":"On collision: store in linked list at same bucket."}
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert (avg)" val="O(1)" color={T.green}/>
            <CRow op="Search (avg)" val="O(1)" color={T.green}/>
            <CRow op="Worst case" val="O(n)" color={T.red}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 20px",overflowY:"auto"}}>
          <div style={{display:"flex",flexDirection:"column",gap:5,width:"100%",maxWidth:560}}>
            {table.map((bucket,i)=>{
              const isHL=highlighted.includes(i),isEmpty=bucket.length===0;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,flexShrink:0,background:isHL?T.yellowSoft:T.surface3,color:isHL?T.yellow:T.muted,border:`1px solid ${isHL?T.yellow:T.surface3}`,transition:"all .2s",boxShadow:isHL?`0 0 12px ${T.yellow}66`:"none"}}>{i}</div>
                  <div style={{flex:1,minHeight:36,borderRadius:10,border:`1px solid ${isHL?T.yellow:isEmpty?T.surface3:T.border2}`,background:isHL?T.yellowSoft:isEmpty?T.surface3+"44":T.surface2,display:"flex",alignItems:"center",gap:6,padding:"0 10px",transition:"all .2s",boxShadow:isHL?`0 0 8px ${T.yellow}44`:"none"}}>
                    {isEmpty?(
                      <span style={{color:T.surface3,fontSize:12,fontFamily:"'Space Mono',monospace"}}>empty</span>
                    ):(
                      bucket.map((v,bi)=>(
                        <div key={bi} style={{background:T.accentSoft,border:`1px solid ${T.accent}55`,borderRadius:7,padding:"3px 10px",fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,color:T.accent,display:"flex",alignItems:"center",gap:6}}>
                          {v}{mode==="chaining"&&bi<bucket.length-1&&<span style={{color:T.muted,fontSize:10}}>→</span>}
                        </div>
                      ))
                    )}
                  </div>
                  {bucket.length>0&&<div style={{width:4,height:Math.min(36,8*bucket.length),borderRadius:2,background:bucket.length>3?T.red:bucket.length>1?T.yellow:T.green,flexShrink:0}}/>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.muted}}>load: {table.flat().length}/{SIZE} ({Math.round(table.flat().length/SIZE*100)}%)</div>
        </div>
      </div>
    </div>
  );
}
