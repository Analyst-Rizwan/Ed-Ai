import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input } from "../shared";

export default function StackViz(){
  const [stack,setStack]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Push values to build the stack");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const push=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);setVal("");
    const s=[...stack,v];setStack(s);setHighlighted(s.length-1);
    addLog(`push(${v}) → top is now ${v}. size=${s.length}`,"ok");
    setLabel(`<strong>push(${v})</strong> — added to top. Stack size = ${s.length}`);
    setTimeout(()=>setHighlighted(-1),600);
  };
  const pop=()=>{
    if(!stack.length){addLog("Stack underflow!","err");return;}
    const s=[...stack];const v=s.pop()!;setHighlighted(stack.length-1);
    addLog(`pop() → removed ${v}. size=${s.length}`,"warn");
    setLabel(`<strong>pop()</strong> → ${v}. ${s.length?`New top = ${s[s.length-1]}`:"Stack is empty"}`);
    setTimeout(()=>{setStack(s);setHighlighted(-1)},400);
  };
  const peek=()=>{
    if(!stack.length){addLog("Stack is empty","err");return;}
    const v=stack[stack.length-1];setHighlighted(stack.length-1);
    addLog(`peek() → ${v}`,"ok");setLabel(`<strong>peek()</strong> → top element is ${v}`);
    setTimeout(()=>setHighlighted(-1),800);
  };

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Push Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={push} mono/></div></div>
        <Btn onClick={push} variant="primary" full>⊕ Push</Btn>
        <Btn onClick={pop} variant="red" disabled={!stack.length} full>⊖ Pop</Btn>
        <Btn onClick={peek} variant="teal" disabled={!stack.length} full>👁 Peek</Btn>
        <Btn onClick={()=>{setStack([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Stack (LIFO)</strong><br/><br/>
          Last In, First Out. Think call stack, undo history, bracket matching.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Push" val="O(1)" color={T.green}/><CRow op="Pop" val="O(1)" color={T.green}/>
            <CRow op="Peek" val="O(1)" color={T.green}/><CRow op="Search" val="O(n)" color={T.yellow}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:28}}>
          {stack.length===0?<div style={{color:T.muted,fontSize:13}}>Stack is empty — push values</div>:(
            <div style={{display:"flex",flexDirection:"column-reverse",gap:4,alignItems:"center"}}>
              {stack.map((v,i)=>{
                const isTop=i===stack.length-1,isHL=i===highlighted;
                return(
                  <div key={i} className={isHL?"pop":""} style={{width:120,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,position:"relative",background:isHL?T.yellowSoft:isTop?T.accentSoft:T.surface2,border:`2px solid ${isHL?T.yellow:isTop?T.accent:T.border2}`,color:isHL?T.yellow:isTop?T.accent:T.muted2,boxShadow:isHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s"}}>
                    {v}
                    {isTop&&<span style={{position:"absolute",right:-50,fontSize:10,color:T.accent,fontWeight:600}}>← TOP</span>}
                    <span style={{position:"absolute",left:-30,fontSize:9,color:T.muted,fontFamily:"'Space Mono',monospace"}}>[{i}]</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.muted}}>size={stack.length}</span>
        </div>
      </div>
    </div>
  );
}
