import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, LogSection, Input, useStepGuide } from "../shared";

export default function StackViz(){
  const [stack,setStack]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Push values to build the stack");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const guide = useStepGuide();

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

  const runDemo=async()=>{
    guide.resetGuide();
    setStack([]);setHighlighted(-1);setLog([]);setLabel("⚡ Guided demo...");
    const T_STEPS = 8;

    await guide.showGuide({
      title:"What is a Stack?",
      body:"A Stack is a LIFO (Last In, First Out) data structure. Think of a stack of plates — you can only add/remove from the top.",
      tip:"Real-world uses: function call stack, undo/redo, browser back button, bracket matching."
    }, 1, T_STEPS);

    // Push 5 values
    const vals=[42,17,65,8,91];
    for(let i=0;i<vals.length;i++){
      if(guide.isSkipped()) break;
      const v=vals[i];const s=vals.slice(0,i+1);
      setStack(s);setHighlighted(s.length-1);
      addLog(`push(${v}) → size=${s.length}`,"ok");
      setLabel(`<strong>push(${v})</strong> — stack size = ${s.length}`);
      await new Promise(r=>setTimeout(r,400));
      if(i===0) await guide.showGuide({
        title:"Push Operation",
        body:`We push(${v}) onto the stack. The value goes to the TOP. push() is always O(1) — constant time regardless of stack size.`,
        tip:"push() adds to the top. The stack grows upward — the newest element is always on top."
      }, 2, T_STEPS);
      if(i===2) await guide.showGuide({
        title:"Stack Growing",
        body:`We've pushed 3 values: [42, 17, 65]. Notice: 65 is now on top — it was pushed last. If we pop(), 65 comes off first (LIFO).`,
        tip:"Elements can ONLY be accessed from the top. There's no way to reach 42 without removing 65 and 17 first."
      }, 3, T_STEPS);
      setHighlighted(-1);
      await new Promise(r=>setTimeout(r,150));
    }

    // Peek
    if(!guide.isSkipped()){
      setHighlighted(4);addLog(`peek() → ${vals[4]}`,"ok");
      setLabel(`<strong>peek()</strong> → top is ${vals[4]}`);
      await guide.showGuide({
        title:"Peek — Look Without Removing",
        body:`peek() returns the top element (91) WITHOUT removing it. The stack stays unchanged. This is also O(1).`,
        tip:"Use peek() when you need to check the top value but want to keep it in the stack."
      }, 4, T_STEPS);
      setHighlighted(-1);
    }

    // Pop 2
    if(!guide.isSkipped()){
      for(let i=0;i<2;i++){
        const cur=vals.slice(0,vals.length-i);setHighlighted(cur.length-1);
        addLog(`pop() → ${cur[cur.length-1]}`,"warn");
        setLabel(`<strong>pop()</strong> → ${cur[cur.length-1]} removed`);
        await new Promise(r=>setTimeout(r,400));
        if(i===0) await guide.showGuide({
          title:"Pop — Remove from Top",
          body:`pop() removes and returns the TOP element (91). After popping, 8 becomes the new top. pop() is O(1).`,
          tip:"Pop always removes the MOST RECENTLY pushed item. That's the LIFO principle — Last In, First Out."
        }, 5, T_STEPS);
        setStack(cur.slice(0,-1));setHighlighted(-1);
        await new Promise(r=>setTimeout(r,150));
      }
    }

    if(!guide.isSkipped()){
      await guide.showGuide({
        title:"Stack After Operations",
        body:`We pushed 5 values, peeked at the top, then popped 2. The stack now has 3 elements: [42, 17, 65]. 65 is the current top.`,
        tip:"All stack operations (push, pop, peek) are O(1). This makes stacks extremely efficient for managing order-dependent data."
      }, 6, T_STEPS);

      await guide.showGuide({
        title:"When to Use a Stack?",
        body:`Use stacks when you need LIFO behavior: function call tracking, expression evaluation, DFS traversal, undo operations, and parsing (balanced brackets).`,
        tip:"Interview tip: If a problem involves nested structures, reversing, or backtracking — think Stack!"
      }, 7, T_STEPS);

      await guide.showGuide({
        title:"Complexity Summary",
        body:`Push: O(1) | Pop: O(1) | Peek: O(1) | Search: O(n). Stacks excel at top-access operations. Searching requires popping elements one by one.`,
        tip:"In most languages, arrays can serve as stacks using push/pop. In interviews, always mention the O(1) time complexity for core operations."
      }, 8, T_STEPS);
    }

    setLabel("✓ Demo complete! Stack has 3 elements");
  };

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Push Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={push} mono/></div></div>
        <Btn onClick={push} variant="primary" full>⊕ Push</Btn>
        <Btn onClick={pop} variant="red" disabled={!stack.length} full>⊖ Pop</Btn>
        <Btn onClick={peek} variant="teal" disabled={!stack.length} full>👁 Peek</Btn>
        <Btn onClick={runDemo} variant="yellow" full>⚡ Learn Stack</Btn>
        <Btn onClick={()=>{setStack([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <LogSection entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:28,position:"relative"}}>
          <guide.Overlay/>
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
