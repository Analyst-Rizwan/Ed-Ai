import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const T = {
  bg:"#141414",surface:"#1e1e1e",surface2:"#252525",surface3:"#2c2c2c",
  border:"rgba(255,255,255,0.07)",border2:"rgba(255,255,255,0.14)",
  text:"#e8e8e8",muted:"#666",muted2:"#888",
  accent:"#7c5cfc",accentSoft:"rgba(124,92,252,0.13)",
  yellow:"#f5c842",yellowSoft:"rgba(245,200,66,0.13)",
  green:"#4acf82",greenSoft:"rgba(74,207,130,0.13)",
  red:"#e85d4a",redSoft:"rgba(232,93,74,0.13)",
  orange:"#f4924a",orangeSoft:"rgba(244,146,74,0.13)",
  teal:"#3ec6c6",tealSoft:"rgba(62,198,198,0.13)",
  blue:"#5b8df0",blueSoft:"rgba(91,141,240,0.13)",
  purple:"#b46ef5",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${T.surface3};border-radius:99px}
  @keyframes popIn{0%{opacity:0;transform:scale(0.4)}70%{transform:scale(1.14)}100%{opacity:1;transform:scale(1)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes swapBounce{0%{transform:translateY(0)}40%{transform:translateY(-18px)}100%{transform:translateY(0)}}
  @keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.6) drop-shadow(0 0 8px currentColor)}}
  @keyframes logIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
  @keyframes barGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  @keyframes mergeSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(124,92,252,0.5)}100%{box-shadow:0 0 0 10px rgba(124,92,252,0)}}
  .pop{animation:popIn .36s cubic-bezier(.34,1.56,.64,1) both}
  .sup{animation:slideUp .28s ease both}
  .fin{animation:fadeIn .22s ease both}
  .swp{animation:swapBounce .35s ease both}
  .glw{animation:glow .6s ease}
  .log{animation:logIn .18s ease both}
  .mgr{animation:mergeSlide .3s ease both}
  .prg{animation:pulseRing .8s ease}
`;

/* ── Primitives ── */
const Btn = ({children,onClick,variant="ghost",disabled,full,style={}}:{children:any,onClick:any,variant?:string,disabled?:any,full?:any,style?:any})=>{
  const v={
    primary:{background:T.accent,color:"#fff",border:"none",boxShadow:`0 4px 14px ${T.accent}44`},
    ghost:{background:T.surface2,color:T.muted2,border:`1px solid ${T.border2}`},
    green:{background:T.greenSoft,color:T.green,border:`1px solid ${T.green}44`},
    red:{background:T.redSoft,color:T.red,border:`1px solid ${T.red}44`},
    yellow:{background:T.yellowSoft,color:T.yellow,border:`1px solid ${T.yellow}44`},
    teal:{background:T.tealSoft,color:T.teal,border:`1px solid ${T.teal}44`},
    orange:{background:T.orangeSoft,color:T.orange,border:`1px solid ${T.orange}44`},
    blue:{background:T.blueSoft,color:T.blue,border:`1px solid ${T.blue}44`},
  };
  return <button onClick={onClick} disabled={disabled} style={{
    padding:"8px 14px",borderRadius:100,fontSize:12,fontWeight:600,
    fontFamily:"'DM Sans',sans-serif",cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?.38:1,transition:"all .18s",display:"flex",alignItems:"center",
    gap:5,whiteSpace:"nowrap",width:full?"100%":undefined,justifyContent:full?"center":undefined,
    ...v[variant],...style
  }}>{children}</button>;
};

const Input=({value,onChange,placeholder,onEnter,mono,style={}})=>(
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    onKeyDown={e=>e.key==="Enter"&&onEnter?.()} style={{
    background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:10,
    padding:"8px 11px",color:T.text,fontSize:13,width:"100%",outline:"none",
    fontFamily:mono?"'Space Mono',monospace":"'DM Sans',sans-serif",...style
  }}/>
);

const SLabel=({children})=><div style={{fontSize:11,color:T.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em"}}>{children}</div>;

const InfoBox=({children,style={}})=>(
  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:13,fontSize:12,color:T.muted2,lineHeight:1.65,...style}}>
    {children}
  </div>
);

const CRow=({op,val,color})=>(
  <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}`,fontSize:11}}>
    <span style={{color:T.muted}}>{op}</span>
    <span style={{fontFamily:"'Space Mono',monospace",fontWeight:700,color}}>{val}</span>
  </div>
);

const Log=({entries})=>{
  const r=useRef(); useEffect(()=>{if(r.current)r.current.scrollTop=r.current.scrollHeight},[entries]);
  return <div ref={r} style={{background:T.surface3,borderRadius:10,padding:"8px 10px",fontFamily:"'Space Mono',monospace",fontSize:10,color:T.muted2,lineHeight:1.9,maxHeight:100,overflowY:"auto"}}>
    {entries.map((e,i)=><div key={i} className="log" style={{color:e.t==="ok"?T.green:e.t==="err"?T.red:e.t==="warn"?T.yellow:T.accent}}>› {e.m}</div>)}
  </div>;
};

const Side=({children})=><div style={{width:224,minWidth:224,borderRight:`1px solid ${T.border}`,padding:14,display:"flex",flexDirection:"column",gap:11,overflowY:"auto",background:T.surface,flexShrink:0}}>{children}</div>;

const SpeedRow=({speed,setSpeed})=>(
  <div style={{display:"flex",gap:5}}>
    {[[800,"Slow"],[400,"Normal"],[150,"Fast"]].map(([ms,l])=>(
      <button key={ms} onClick={()=>setSpeed(ms)} style={{
        flex:1,padding:"5px 4px",borderRadius:8,fontSize:11,fontWeight:600,
        cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
        background:speed===ms?T.accentSoft:T.surface2,
        border:`1px solid ${speed===ms?T.accent+"66":T.border2}`,
        color:speed===ms?T.accent:T.muted2,transition:"all .15s"
      }}>{l}</button>
    ))}
  </div>
);

const Badge=({children,color=T.accent})=>(
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,padding:"2px 7px",borderRadius:100,fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{children}</span>
);

/* ── sleep helper ── */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════════════════════════════
   1. SORTING VISUALIZER  (Bubble · Selection · Insertion · Merge · Quick)
══════════════════════════════════════════════════════════════ */
function genArr(n=16){return Array.from({length:n},()=>Math.floor(Math.random()*90+8));}

function SortingViz(){
  const [arr,setArr]=useState(genArr());
  const [bars,setBars]=useState([]); // {val,state:'idle'|'compare'|'swap'|'sorted'|'pivot'|'left'|'right'|'merge'}
  const [algo,setAlgo]=useState("bubble");
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(400);
  const [log,setLog]=useState([]);
  const [stats,setStats]=useState({comps:0,swaps:0});
  const [label,setLabel]=useState("Pick an algorithm and press Run");
  const stopRef=useRef(false);
  const statsRef=useRef({comps:0,swaps:0});

  useEffect(()=>{reset()},[algo]);// eslint-disable-line

  const addLog=(m,t="info")=>setLog(l=>[...l.slice(-30),{m,t}]);

  const reset=()=>{
    stopRef.current=true;
    const a=genArr();
    setArr(a);
    setBars(a.map(v=>({val:v,state:"idle"})));
    statsRef.current={comps:0,swaps:0};
    setStats({comps:0,swaps:0});
    setLabel("Press ▶ Run to start");
    setRunning(false);
  };

  const setCustom=()=>{
    stopRef.current=true;
    const v=arr;
    setBars(v.map(x=>({val:x,state:"idle"})));
    statsRef.current={comps:0,swaps:0};
    setStats({comps:0,swaps:0});
    setRunning(false);
  };

  const updateBars=(b,label,t="info")=>{
    setBars([...b]);
    if(label){setLabel(label);addLog(label,t);}
    setStats({...statsRef.current});
  };

  const run=async()=>{
    stopRef.current=false;
    statsRef.current={comps:0,swaps:0};
    setRunning(true);
    const b=bars.map(x=>({...x,state:"idle"}));
    const tick=async(b2,msg,t)=>{
      if(stopRef.current)throw new Error("stopped");
      updateBars(b2,msg,t);
      await sleep(speed);
    };

    try{
      if(algo==="bubble") await bubbleSort(b,tick);
      else if(algo==="selection") await selectionSort(b,tick);
      else if(algo==="insertion") await insertionSort(b,tick);
      else if(algo==="merge") await mergeSort(b,tick,0,b.length-1);
      else if(algo==="quick") await quickSort(b,tick,0,b.length-1);
      b.forEach(x=>x.state="sorted");
      updateBars(b,"✓ Sorted!","ok");
    }catch(e){if(e.message!=="stopped")throw e;}
    setRunning(false);
  };

  const cmp=(b,i,j)=>{statsRef.current.comps++;b[i].state="compare";b[j].state="compare";};
  const swp=(b,i,j)=>{statsRef.current.swaps++;[b[i],b[j]]=[b[j],b[i]];b[i].state="swap";b[j].state="swap";};

  async function bubbleSort(b,tick){
    const n=b.length;
    for(let i=0;i<n-1;i++){
      let swapped=false;
      for(let j=0;j<n-1-i;j++){
        cmp(b,j,j+1);
        await tick(b,`Compare [${j}]=${b[j].val} vs [${j+1}]=${b[j+1].val}`);
        if(b[j].val>b[j+1].val){swp(b,j,j+1);swapped=true;await tick(b,`Swap → ${b[j].val} ↔ ${b[j+1].val}`,"warn");}
        b[j].state="idle";b[j+1].state="idle";
      }
      b[n-1-i].state="sorted";
      if(!swapped){b.forEach(x=>x.state="sorted");break;}
    }
  }

  async function selectionSort(b,tick){
    for(let i=0;i<b.length;i++){
      let minIdx=i; b[i].state="compare";
      await tick(b,`Pass ${i+1}: find min from [${i}]`);
      for(let j=i+1;j<b.length;j++){
        b[j].state="compare";
        statsRef.current.comps++;
        await tick(b,`Compare ${b[j].val} < min ${b[minIdx].val}?`);
        if(b[j].val<b[minIdx].val){
          if(minIdx!==i)b[minIdx].state="idle";
          minIdx=j;
        } else {b[j].state="idle";}
      }
      if(minIdx!==i){swp(b,i,minIdx);await tick(b,`Swap min ${b[i].val} to pos [${i}]`,"warn");}
      b[i].state="sorted"; if(minIdx!==i)b[minIdx].state="idle";
    }
  }

  async function insertionSort(b,tick){
    b[0].state="sorted";
    for(let i=1;i<b.length;i++){
      const key=b[i].val; b[i].state="compare";
      await tick(b,`Insert key=${key} into sorted portion`);
      let j=i-1;
      while(j>=0&&b[j].val>key){
        statsRef.current.comps++;
        b[j+1].val=b[j].val; b[j+1].state="swap"; b[j].state="compare";
        statsRef.current.swaps++;
        await tick(b,`Shift ${b[j].val} right`,"warn");
        b[j].state="sorted"; j--;
      }
      b[j+1].val=key; b[j+1].state="sorted";
      await tick(b,`Placed key=${key} at [${j+1}]`,"ok");
    }
  }

  async function mergeSort(b,tick,l,r){
    if(l>=r)return;
    const m=Math.floor((l+r)/2);
    for(let i=l;i<=r;i++)b[i].state="compare";
    await tick(b,`Split [${l}..${m}] | [${m+1}..${r}]`);
    await mergeSort(b,tick,l,m);
    await mergeSort(b,tick,m+1,r);
    await merge(b,tick,l,m,r);
  }

  async function merge(b,tick,l,m,r){
    const left=b.slice(l,m+1).map(x=>({...x}));
    const right=b.slice(m+1,r+1).map(x=>({...x}));
    let i=0,j=0,k=l;
    while(i<left.length&&j<right.length){
      statsRef.current.comps++;
      if(left[i].val<=right[j].val){
        b[k]={val:left[i].val,state:"merge"};i++;
      } else {
        b[k]={val:right[j].val,state:"merge"};j++;
      }
      await tick(b,`Merge: placed ${b[k].val} at [${k}]`,"warn");
      b[k].state="sorted"; k++;
    }
    while(i<left.length){b[k]={val:left[i].val,state:"sorted"};i++;k++;}
    while(j<right.length){b[k]={val:right[j].val,state:"sorted"};j++;k++;}
    await tick(b,`Merged [${l}..${r}]`,"ok");
  }

  async function quickSort(b,tick,lo,hi){
    if(lo>=hi)return;
    const pv=await partition(b,tick,lo,hi);
    b[pv].state="sorted";
    await quickSort(b,tick,lo,pv-1);
    await quickSort(b,tick,pv+1,hi);
  }

  async function partition(b,tick,lo,hi){
    const pval=b[hi].val; b[hi].state="pivot";
    await tick(b,`Pivot = ${pval} at [${hi}]`);
    let i=lo-1;
    for(let j=lo;j<hi;j++){
      statsRef.current.comps++;
      b[j].state="compare";
      await tick(b,`Compare ${b[j].val} ≤ pivot ${pval}?`);
      if(b[j].val<=pval){i++;swp(b,i,j);await tick(b,`Swap ${b[i].val} ↔ ${b[j].val}`,"warn");}
      if(b[j].state!=="sorted")b[j].state="idle";
    }
    swp(b,i+1,hi); b[i+1].state="pivot";
    await tick(b,`Pivot ${pval} placed at [${i+1}]`,"ok");
    return i+1;
  }

  const stateColor={idle:T.blue,compare:T.yellow,swap:T.orange,sorted:T.green,pivot:T.red,merge:T.purple};
  const maxVal=Math.max(...bars.map(b=>b.val),1);

  const algoInfo={
    bubble:{best:"O(n)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Adaptive: stops early if no swaps."},
    selection:{best:"O(n²)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Always n² comparisons, minimal swaps."},
    insertion:{best:"O(n)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Excellent on nearly-sorted data."},
    merge:{best:"O(n log n)",avg:"O(n log n)",worst:"O(n log n)",space:"O(n)",note:"Stable sort. Guaranteed n log n always."},
    quick:{best:"O(n log n)",avg:"O(n log n)",worst:"O(n²)",space:"O(log n)",note:"Fastest in practice. Worst on sorted input."},
  };
  const info=algoInfo[algo];

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Algorithm</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
            {[["bubble","Bubble Sort"],["selection","Selection Sort"],["insertion","Insertion Sort"],["merge","Merge Sort"],["quick","Quick Sort"]].map(([k,l])=>(
              <button key={k} onClick={()=>{if(!running){setAlgo(k)}}} style={{
                padding:"7px 12px",borderRadius:9,fontSize:11,fontWeight:600,
                cursor:running?"not-allowed":"pointer",textAlign:"left",
                fontFamily:"'DM Sans',sans-serif",background:algo===k?T.accentSoft:T.surface2,
                border:`1px solid ${algo===k?T.accent+"66":T.border2}`,
                color:algo===k?T.accent:T.muted2,transition:"all .15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={run} variant="primary" disabled={running} style={{flex:1}}>▶ Run</Btn>
          <Btn onClick={reset} variant="ghost" disabled={running} style={{flex:1}}>↺ New</Btn>
        </div>
        <div>
          <SLabel>Speed</SLabel>
          <div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div>
        </div>
        <InfoBox>
          <strong style={{color:T.text}}>{algo.charAt(0).toUpperCase()+algo.slice(1)} Sort</strong><br/><br/>
          {info.note}
          <div style={{marginTop:10,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
            <CRow op="Best" val={info.best} color={T.green}/>
            <CRow op="Average" val={info.avg} color={T.yellow}/>
            <CRow op="Worst" val={info.worst} color={T.red}/>
            <CRow op="Space" val={info.space} color={T.teal}/>
          </div>
        </InfoBox>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {Object.entries(stateColor).map(([s,c])=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
              <div style={{width:10,height:10,borderRadius:3,background:c}}/>
              {s}
            </div>
          ))}
        </div>
        <SLabel>Log</SLabel>
        <Log entries={log}/>
      </Side>

      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px 24px 0",gap:3,overflowX:"auto"}}>
          {bars.map((bar,i)=>{
            const col=stateColor[bar.state]||T.blue;
            const h=Math.max(6,Math.floor((bar.val/maxVal)*260));
            return(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:col,fontFamily:"'Space Mono',monospace",opacity:bar.state!=="idle"?1:0.4}}>{bar.val}</div>
                <div style={{
                  width:Math.max(16,Math.floor(620/bars.length)-3),height:h,
                  borderRadius:"5px 5px 0 0",
                  background:`linear-gradient(to top, ${col}cc, ${col}88)`,
                  border:`1px solid ${col}66`,
                  transition:running?"none":"height .3s ease",
                  boxShadow:bar.state!=="idle"?`0 0 10px ${col}88`:"none",
                  transform:bar.state==="swap"?"translateY(-8px)":"none",
                  transitionProperty:"transform",
                }}/>
              </div>
            );
          })}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <div style={{display:"flex",gap:16,fontFamily:"'Space Mono',monospace",fontSize:11}}>
            <span style={{color:T.yellow}}>⚖ {stats.comps} compares</span>
            <span style={{color:T.orange}}>↕ {stats.swaps} swaps</span>
            <span style={{color:T.muted}}>n={bars.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. MERGE VISUALIZER  (step-by-step merge of two sorted arrays)
══════════════════════════════════════════════════════════════ */
function MergeViz(){
  const [leftInput,setLeftInput]=useState("2 5 8 12");
  const [rightInput,setRightInput]=useState("1 3 7 11 15");
  const [steps,setSteps]=useState([]);
  const [stepIdx,setStepIdx]=useState(-1);
  const [log,setLog]=useState([]);

  const buildSteps=()=>{
    const L=leftInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    const R=rightInput.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    if(!L.length||!R.length)return;
    const ss=[];
    let i=0,j=0;
    const merged=[];
    ss.push({L:[...L],R:[...R],merged:[],li:0,ri:0,desc:"Start: compare pointers at index 0 of each array"});
    while(i<L.length&&j<R.length){
      const take=L[i]<=R[j]?"left":"right";
      merged.push(take==="left"?L[i]:R[j]);
      const desc=take==="left"
        ?`L[${i}]=${L[i]} ≤ R[${j}]=${R[j]} → take from Left`
        :`R[${j}]=${R[j]} < L[${i}]=${L[i]} → take from Right`;
      if(take==="left")i++; else j++;
      ss.push({L,R,merged:[...merged],li:i,ri:j,desc,last:take});
    }
    while(i<L.length){merged.push(L[i]);ss.push({L,R,merged:[...merged],li:i+1,ri:j,desc:`Drain Left: append ${L[i]}`,last:"left"});i++;}
    while(j<R.length){merged.push(R[j]);ss.push({L,R,merged:[...merged],li:i,ri:j+1,desc:`Drain Right: append ${R[j]}`,last:"right"});j++;}
    ss.push({L,R,merged:[...merged],li:i,ri:j,desc:"✓ Merged! Result is sorted.",done:true});
    setSteps(ss); setStepIdx(0);
    setLog([{m:"Built merge steps. Press Next →",t:"info"}]);
  };

  const step=steps[stepIdx]||null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Left Array (space-separated)</SLabel>
          <div style={{marginTop:6}}><Input value={leftInput} onChange={setLeftInput} placeholder="2 5 8 12" mono/></div>
        </div>
        <div>
          <SLabel>Right Array</SLabel>
          <div style={{marginTop:6}}><Input value={rightInput} onChange={setRightInput} placeholder="1 3 7 11 15" mono/></div>
        </div>
        <Btn onClick={buildSteps} variant="primary" full>⚙ Build Merge Steps</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Merge (Two Sorted Arrays)</strong><br/><br/>
          Core of Merge Sort. Two pointers walk both arrays, always picking the smaller element.
          <div style={{marginTop:10,borderTop:`1px solid ${T.border}`,paddingTop:10}}>
            <CRow op="Time" val="O(n+m)" color={T.green}/>
            <CRow op="Space" val="O(n+m)" color={T.orange}/>
            <CRow op="Stable" val="Yes ✓" color={T.teal}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel>
        <Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28,padding:28}}>
          {step?(
            <>
              {/* Left + Right arrays */}
              <div style={{display:"flex",gap:40}}>
                {[{label:"Left",arr:step.L,ptr:step.li,color:T.accent},{label:"Right",arr:step.R,ptr:step.ri,color:T.green}].map(({label,arr,ptr,color})=>(
                  <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                    <div style={{fontSize:11,fontWeight:600,color,fontFamily:"'DM Sans',sans-serif"}}>{label}</div>
                    <div style={{display:"flex",gap:6}}>
                      {arr.map((v,i)=>{
                        const isPtr=i===ptr;
                        const isDone=i<ptr;
                        return(
                          <div key={i} className={isPtr?"pop":""} style={{
                            width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                            background:isDone?T.surface3:isPtr?color+"33":T.surface2,
                            border:`2px solid ${isDone?T.surface3:isPtr?color:color+"55"}`,
                            color:isDone?T.muted:isPtr?"#fff":color,
                            opacity:isDone?.45:1,
                            boxShadow:isPtr?`0 0 14px ${color}66`:"none",
                            transition:"all .2s",
                          }}>{v}</div>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:6,paddingTop:2}}>
                      {arr.map((_,i)=>(
                        <div key={i} style={{width:44,textAlign:"center",fontSize:10,color:i===ptr?color:T.muted,fontFamily:"'Space Mono',monospace"}}>
                          {i===ptr?"↑ ptr":""}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <div style={{fontSize:20,color:T.muted}}>↓</div>

              {/* Merged result */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{fontSize:11,fontWeight:600,color:step.done?T.yellow:T.muted2}}>Merged Result</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {step.merged.map((v,i)=>{
                    const isLast=i===step.merged.length-1&&!step.done;
                    return(
                      <div key={i} className={isLast?"mgr":""} style={{
                        width:44,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                        background:step.done?T.yellowSoft:isLast?T.purpleSoft||T.accentSoft:T.surface2,
                        border:`2px solid ${step.done?T.yellow:isLast?T.purple:T.border2}`,
                        color:step.done?T.yellow:isLast?T.purple:T.muted2,
                        boxShadow:isLast?`0 0 12px ${T.purple}66`:"none",
                        transition:"background .2s",
                      }}>{v}</div>
                    );
                  })}
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
          <Btn onClick={()=>{setStepIdx(i=>Math.min(steps.length-1,i+1));setLog(l=>[...l.slice(-30),{m:steps[Math.min(steps.length-1,stepIdx+1)]?.desc||"",t:"ok"}])}} variant="primary" disabled={stepIdx>=steps.length-1||!step}>Next →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. GRAPH VISUALIZER  (BFS · DFS · Dijkstra)
══════════════════════════════════════════════════════════════ */
const GRAPH_PRESET={
  nodes:[
    {id:"A",x:300,y:60},{id:"B",x:160,y:160},{id:"C",x:440,y:160},
    {id:"D",x:80,y:280},{id:"E",x:260,y:280},{id:"F",x:400,y:280},{id:"G",x:540,y:180},
  ],
  edges:[
    {u:"A",v:"B",w:4},{u:"A",v:"C",w:2},{u:"B",v:"D",w:5},{u:"B",v:"E",w:3},
    {u:"C",v:"F",w:6},{u:"C",v:"G",w:1},{u:"E",v:"F",w:2},{u:"D",v:"E",w:7},
  ],
};

function GraphViz(){
  const [algo,setAlgo]=useState("bfs");
  const [start,setStart]=useState("A");
  const [visited,setVisited]=useState(new Set());
  const [active,setActive]=useState(null);
  const [edgeState,setEdgeState]=useState({});// key:"A-B" → "tree"|"cross"
  const [queue,setQueue]=useState([]);
  const [dist,setDist]=useState({});
  const [log,setLog]=useState([]);
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(500);
  const [label,setLabel]=useState("Select algorithm and press Run");
  const stopRef=useRef(false);

  const addLog=(m,t="info")=>setLog(l=>[...l.slice(-30),{m,t}]);

  const reset=()=>{
    stopRef.current=true;
    setVisited(new Set());setActive(null);setEdgeState({});
    setQueue([]);setDist({});setRunning(false);
    setLabel("Press Run to start");
  };

  const run=async()=>{
    stopRef.current=false; reset();
    await sleep(100);
    setRunning(true);
    const adj={};
    GRAPH_PRESET.nodes.forEach(n=>{adj[n.id]=[];});
    GRAPH_PRESET.edges.forEach(({u,v,w})=>{adj[u].push({node:v,w});adj[v].push({node:u,w});});

    const tick=async(vis,act,es,q,msg,d={})=>{
      if(stopRef.current)throw new Error("stopped");
      setVisited(new Set(vis));setActive(act);setEdgeState({...es});setQueue([...q]);setDist({...d});
      setLabel(msg);addLog(msg,"info");
      await sleep(speed);
    };

    try{
      if(algo==="bfs") await runBFS(adj,tick);
      else if(algo==="dfs") await runDFS(adj,tick);
      else await runDijkstra(adj,tick);
    }catch(e){if(e.message!=="stopped")throw e;}
    setRunning(false);addLog("✓ Done","ok");setActive(null);
  };

  async function runBFS(adj,tick){
    const vis=new Set([start]),q=[start],es={};
    setLabel(`BFS from ${start}`);
    while(q.length){
      const cur=q.shift();
      await tick(vis,cur,es,[...q],`Visit ${cur} — queue: [${q.join(", ")}]`);
      for(const {node:nb} of (adj[cur]||[])){
        if(!vis.has(nb)){
          vis.add(nb);q.push(nb);
          es[`${cur}-${nb}`]="tree";es[`${nb}-${cur}`]="tree";
          await tick(vis,cur,es,[...q],`Discover ${nb} from ${cur}`,"ok");
        }
      }
    }
    await tick(vis,null,es,[],"BFS complete — all reachable nodes visited","ok");
  }

  async function runDFS(adj,tick){
    const vis=new Set(),es={};
    async function dfs(node,parent){
      if(stopRef.current)throw new Error("stopped");
      vis.add(node);
      await tick(vis,node,es,[],`Enter ${node}`);
      for(const {node:nb} of (adj[node]||[])){
        if(!vis.has(nb)){
          es[`${node}-${nb}`]="tree";es[`${nb}-${node}`]="tree";
          await tick(vis,node,es,[],`Recurse: ${node} → ${nb}`,"ok");
          await dfs(nb,node);
          await tick(vis,node,es,[],`Backtrack to ${node}`);
        }
      }
    }
    await dfs(start,null);
    await tick(vis,null,es,[],"DFS complete","ok");
  }

  async function runDijkstra(adj,tick){
    const INF=99999;
    const d={};GRAPH_PRESET.nodes.forEach(n=>{d[n.id]=INF;});d[start]=0;
    const prev={};const pq=[[0,start]];const vis=new Set();const es={};
    while(pq.length){
      pq.sort((a,b)=>a[0]-b[0]);
      const [cost,u]=pq.shift();
      if(vis.has(u))continue;
      vis.add(u);
      await tick(vis,u,es,[],`Visit ${u}, dist=${cost}`,{...d});
      for(const {node:v,w} of (adj[u]||[])){
        if(!vis.has(v)&&d[u]+w<d[v]){
          d[v]=d[u]+w;prev[v]=u;
          es[`${u}-${v}`]="tree";
          pq.push([d[v],v]);
          await tick(vis,u,es,[],`Relax ${u}→${v}: dist=${d[v]}`,{...d});
        }
      }
    }
    await tick(vis,null,es,[],`Dijkstra done from ${start}`,{...d});
  }

  const nodePos=Object.fromEntries(GRAPH_PRESET.nodes.map(n=>[n.id,{x:n.x,y:n.y}]));

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Algorithm</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
            {[["bfs","BFS — Breadth First"],["dfs","DFS — Depth First"],["dijkstra","Dijkstra — Shortest Path"]].map(([k,l])=>(
              <button key={k} onClick={()=>{if(!running)setAlgo(k)}} style={{
                padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:600,
                cursor:running?"not-allowed":"pointer",textAlign:"left",
                fontFamily:"'DM Sans',sans-serif",background:algo===k?T.accentSoft:T.surface2,
                border:`1px solid ${algo===k?T.accent+"66":T.border2}`,
                color:algo===k?T.accent:T.muted2,transition:"all .15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <SLabel>Start Node</SLabel>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
            {GRAPH_PRESET.nodes.map(n=>(
              <button key={n.id} onClick={()=>setStart(n.id)} style={{
                width:32,height:32,borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                fontFamily:"'Space Mono',monospace",
                background:start===n.id?T.accentSoft:T.surface2,
                border:`1px solid ${start===n.id?T.accent:T.border2}`,
                color:start===n.id?T.accent:T.muted2,
              }}>{n.id}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={run} variant="primary" disabled={running} style={{flex:1}}>▶ Run</Btn>
          <Btn onClick={reset} variant="ghost" disabled={running} style={{flex:1}}>↺ Reset</Btn>
        </div>
        <div>
          <SLabel>Speed</SLabel>
          <div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div>
        </div>
        {algo==="dijkstra"&&Object.keys(dist).length>0&&(
          <div>
            <SLabel>Distances from {start}</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:6}}>
              {GRAPH_PRESET.nodes.map(n=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:visited.has(n.id)?T.text:T.muted}}>{n.id}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",color:visited.has(n.id)?T.green:T.muted}}>
                    {dist[n.id]===99999?"∞":dist[n.id]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {algo==="bfs"&&queue.length>0&&(
          <div>
            <SLabel>Queue</SLabel>
            <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
              {queue.map((n,i)=><Badge key={i} color={T.yellow}>{n}</Badge>)}
            </div>
          </div>
        )}
        <InfoBox>
          {algo==="bfs"&&<><strong style={{color:T.text}}>BFS</strong> — explores level by level using a queue. Finds shortest path (unweighted).<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(V+E)" color={T.green}/><CRow op="Space" val="O(V)" color={T.orange}/><CRow op="Shortest path" val="✓ (unweighted)" color={T.teal}/></div></>}
          {algo==="dfs"&&<><strong style={{color:T.text}}>DFS</strong> — goes deep before backtracking using recursion/stack.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(V+E)" color={T.green}/><CRow op="Space" val="O(V)" color={T.orange}/><CRow op="Shortest path" val="✗ No" color={T.red}/></div></>}
          {algo==="dijkstra"&&<><strong style={{color:T.text}}>Dijkstra</strong> — greedy shortest path with priority queue. Edges must be ≥ 0.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O((V+E)log V)" color={T.yellow}/><CRow op="Negative edges" val="✗ No" color={T.red}/><CRow op="Shortest path" val="✓ (weighted)" color={T.green}/></div></>}
        </InfoBox>
        <SLabel>Log</SLabel>
        <Log entries={log}/>
      </Side>

      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
            {/* Edges */}
            {GRAPH_PRESET.edges.map(({u,v,w})=>{
              const pu=nodePos[u],pv=nodePos[v];
              const key1=`${u}-${v}`,key2=`${v}-${u}`;
              const isTree=edgeState[key1]==="tree"||edgeState[key2]==="tree";
              const col=isTree?T.green:T.surface3;
              const mx=(pu.x+pv.x)/2,my=(pu.y+pv.y)/2;
              return(
                <g key={key1}>
                  <line x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y}
                    stroke={col} strokeWidth={isTree?3:1.5}
                    style={isTree?{filter:`drop-shadow(0 0 6px ${T.green})`}:{}}/>
                  {algo==="dijkstra"&&<text x={mx} y={my-5} textAnchor="middle" fill={isTree?T.yellow:T.muted}
                    fontSize="11" fontFamily="Space Mono" fontWeight="700">{w}</text>}
                </g>
              );
            })}
            {/* Nodes */}
            {GRAPH_PRESET.nodes.map(n=>{
              const isActive=n.id===active;
              const isVisited=visited.has(n.id);
              const col=isActive?T.yellow:isVisited?T.green:T.blue;
              const d=dist[n.id];
              return(
                <g key={n.id} style={isActive?{animation:"traversePulse .4s ease"}:{}}>
                  <circle cx={n.x} cy={n.y} r={24}
                    fill={isActive?T.yellowSoft:isVisited?T.greenSoft:T.surface2}
                    stroke={col} strokeWidth={isActive?3:isVisited?2.5:1.5}
                    style={isActive?{filter:`drop-shadow(0 0 14px ${T.yellow})`}:isVisited?{filter:`drop-shadow(0 0 8px ${T.green})`}:{}}/>
                  <text x={n.x} y={n.y+5} textAnchor="middle" fill={isActive?"#fff":col}
                    fontSize="14" fontFamily="Space Mono" fontWeight="700">{n.id}</text>
                  {algo==="dijkstra"&&d!==undefined&&d!==99999&&(
                    <text x={n.x} y={n.y-30} textAnchor="middle" fill={T.yellow}
                      fontSize="10" fontFamily="Space Mono">{d}</text>
                  )}
                </g>
              );
            })}
            {/* Legend */}
            {[{c:T.blue,l:"Unvisited"},{c:T.green,l:"Visited"},{c:T.yellow,l:"Active"}].map(({c,l},i)=>(
              <g key={l} transform={`translate(${12+i*90},${340})`}>
                <circle r="6" fill={c+"33"} stroke={c} strokeWidth="1.5"/>
                <text x="12" y="4" fill={T.muted} fontSize="10" fontFamily="DM Sans">{l}</text>
              </g>
            ))}
          </svg>
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}}>{label}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. HEAP VISUALIZER  (Min-Heap: insert · extract-min · heapify)
══════════════════════════════════════════════════════════════ */
function HeapViz(){
  const [heap,setHeap]=useState([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState([]);
  const [log,setLog]=useState([]);
  const [label,setLabel]=useState("Insert values to build the heap");
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(400);
  const stopRef=useRef(false);

  const addLog=(m,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const hl=async(h,idxs,msg,t="info")=>{
    if(stopRef.current)throw new Error("s");
    setHeap([...h]);setHighlighted(idxs);setLabel(msg);addLog(msg,t);
    await sleep(speed);
  };

  const insert=async()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);
    setVal("");stopRef.current=false;setRunning(true);
    try{
      const h=[...heap,v];
      await hl(h,[h.length-1],`Insert ${v} at end [${h.length-1}]`);
      let i=h.length-1;
      while(i>0){
        const par=Math.floor((i-1)/2);
        if(h[par]>h[i]){
          await hl(h,[i,par],`Bubble up: ${h[i]} < parent ${h[par]} → swap`,"warn");
          [h[i],h[par]]=[h[par],h[i]];
          await hl(h,[par],`Swapped → ${h[par]} at [${par}]`,"ok");
          i=par;
        } else {await hl(h,[i,par],`${h[i]} ≥ parent ${h[par]} — heap property satisfied`,"ok");break;}
      }
      setHeap([...h]);setHighlighted([]);
      addLog(`insert(${v}) done — size=${h.length}`,"ok");
    }catch(e){}
    setRunning(false);
  };

  const extractMin=async()=>{
    if(!heap.length){addLog("Heap is empty","err");return;}
    stopRef.current=false;setRunning(true);
    try{
      const h=[...heap];
      const min=h[0];
      await hl(h,[0],`Extract min = ${min}`)
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
        [h[i],h[smallest]]=[h[smallest],h[i]];
        await hl(h,[smallest],`Swapped`,"ok");
        i=smallest;
      }
      setHeap([...h]);setHighlighted([]);
      addLog(`extracted min=${min}. New root=${h[0]}`,"ok");
    }catch(e){}
    setRunning(false);
  };

  const loadExample=()=>{
    const vals=[5,12,3,8,20,1,15,7];
    const h=[];
    vals.forEach(v=>{
      h.push(v);
      let i=h.length-1;
      while(i>0){const p=Math.floor((i-1)/2);if(h[p]>h[i]){[h[i],h[p]]=[h[p],h[i]];i=p;}else break;}
    });
    setHeap(h);setHighlighted([]);addLog("Loaded min-heap example","info");
    setLabel("Example heap loaded. Try extract-min or insert.");
  };

  // Tree layout
  const W=600,H=280,R=22;
  function getPos(i){
    const depth=Math.floor(Math.log2(i+1));
    const posInRow=i-(Math.pow(2,depth)-1);
    const totalInRow=Math.pow(2,depth);
    const x=W*(posInRow+0.5)/totalInRow;
    const y=40+depth*68;
    return{x,y};
  }

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Insert Value</SLabel>
          <div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 14" onEnter={insert} mono/></div>
        </div>
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
          {/* Tree view */}
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {heap.length===0?(
              <div style={{color:T.muted,fontSize:13}}>Heap is empty — insert values</div>
            ):(
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
                {heap.map((_,i)=>{
                  if(i===0)return null;
                  const par=Math.floor((i-1)/2);
                  const p=getPos(i),pp=getPos(par);
                  const isHL=highlighted.includes(i)||highlighted.includes(par);
                  return<line key={`e${i}`} x1={pp.x} y1={pp.y} x2={p.x} y2={p.y}
                    stroke={isHL?T.yellow:T.surface3} strokeWidth={isHL?2.5:1.5}/>;
                })}
                {heap.map((v,i)=>{
                  const{x,y}=getPos(i);
                  const isHL=highlighted.includes(i);
                  const isMin=i===0;
                  const col=isHL?T.yellow:isMin?T.accent:T.blue;
                  return(
                    <g key={`n${i}`}>
                      <circle cx={x} cy={y} r={R} fill={isHL?T.yellowSoft:isMin?T.accentSoft:T.surface2}
                        stroke={col} strokeWidth={isHL?3:1.8}
                        style={isHL?{filter:`drop-shadow(0 0 10px ${T.yellow})`}:{}}/>
                      <text x={x} y={y+5} textAnchor="middle" fill={isHL?"#fff":col}
                        fontSize="12" fontFamily="Space Mono" fontWeight="700">{v}</text>
                      <text x={x} y={y+R+14} textAnchor="middle" fill={T.surface3}
                        fontSize="9" fontFamily="Space Mono">[{i}]</text>
                      {isMin&&<text x={x} y={y-R-6} textAnchor="middle" fill={T.accent}
                        fontSize="9" fontFamily="DM Sans" fontWeight="600">MIN</text>}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          {/* Array view */}
          <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,overflowX:"auto",background:T.surface2}}>
            <span style={{fontSize:10,color:T.muted,fontFamily:"'Space Mono',monospace",whiteSpace:"nowrap"}}>array:</span>
            {heap.map((v,i)=>(
              <div key={i} style={{
                width:36,height:32,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,flexShrink:0,
                background:highlighted.includes(i)?T.yellowSoft:T.surface3,
                border:`1px solid ${highlighted.includes(i)?T.yellow:T.border2}`,
                color:highlighted.includes(i)?T.yellow:T.muted2,
              }}>{v}</div>
            ))}
          </div>
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}}>{label}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. DYNAMIC PROGRAMMING  (Fibonacci · LCS · 0/1 Knapsack)
══════════════════════════════════════════════════════════════ */
function DPViz(){
  const [dpType,setDpType]=useState("fib");
  const [n,setN]=useState("8");
  const [s1,setS1]=useState("ABCBDAB");
  const [s2,setS2]=useState("BDCABA");
  const [weights,setWeights]=useState("2 3 4 5");
  const [values,setValues]=useState("3 4 5 6");
  const [capacity,setCapacity]=useState("5");
  const [steps,setSteps]=useState([]);
  const [stepIdx,setStepIdx]=useState(-1);
  const [log,setLog]=useState([]);

  const buildFib=()=>{
    const N=Math.min(parseInt(n)||8,14);
    const dp=new Array(N+1).fill(0);
    const ss=[{dp:[...dp],hi:[0,1],desc:`Initialize dp[0]=0, dp[1]=1 (base cases)`}];
    dp[0]=0;dp[1]=1;
    for(let i=2;i<=N;i++){
      const prev=[...dp];
      dp[i]=dp[i-1]+dp[i-2];
      ss.push({dp:[...dp],hi:[i],using:[i-1,i-2],desc:`dp[${i}] = dp[${i-1}](${dp[i-1]}) + dp[${i-2}](${dp[i-2]}) = ${dp[i]}`});
    }
    ss.push({dp:[...dp],hi:[N],done:true,desc:`fib(${N}) = ${dp[N]} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`Built Fibonacci DP table for n=${N}`,t:"info"}]);
  };

  const buildLCS=()=>{
    const a=s1.toUpperCase(),b=s2.toUpperCase();
    const m=a.length,nn=b.length;
    const dp=Array.from({length:m+1},()=>new Array(nn+1).fill(0));
    const ss=[{dp:dp.map(r=>[...r]),hi:null,desc:"Initialize: dp[0][j]=0 and dp[i][0]=0 (empty string base cases)"}];
    for(let i=1;i<=m;i++){
      for(let j=1;j<=nn;j++){
        const prev=dp.map(r=>[...r]);
        if(a[i-1]===b[j-1]){dp[i][j]=dp[i-1][j-1]+1;ss.push({dp:dp.map(r=>[...r]),hi:[i,j],match:true,desc:`Match: '${a[i-1]}' == '${b[j-1]}' → dp[${i}][${j}] = dp[${i-1}][${j-1}]+1 = ${dp[i][j]}`});}
        else{dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);ss.push({dp:dp.map(r=>[...r]),hi:[i,j],match:false,desc:`No match: '${a[i-1]}' ≠ '${b[j-1]}' → dp[${i}][${j}] = max(${dp[i-1][j]},${dp[i][j-1]}) = ${dp[i][j]}`});}
      }
    }
    ss.push({dp:dp.map(r=>[...r]),hi:[m,nn],done:true,desc:`LCS length = ${dp[m][nn]} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`LCS("${a}","${b}") — ${ss.length} steps`,t:"info"}]);
  };

  const buildKnapsack=()=>{
    const W2=weights.trim().split(/\s+/).map(Number);
    const V=values.trim().split(/\s+/).map(Number);
    const C=parseInt(capacity)||5;
    const n2=Math.min(W2.length,V.length,6);
    const dp=Array.from({length:n2+1},()=>new Array(C+1).fill(0));
    const ss=[{dp:dp.map(r=>[...r]),hi:null,desc:"Initialize dp[0][*]=0 — no items means no value"}];
    for(let i=1;i<=n2;i++){
      for(let w=0;w<=C;w++){
        const prev=dp.map(r=>[...r]);
        if(W2[i-1]>w){dp[i][w]=dp[i-1][w];ss.push({dp:dp.map(r=>[...r]),hi:[i,w],skip:true,desc:`Item ${i}(w=${W2[i-1]}) > capacity ${w} → skip: dp[${i}][${w}]=${dp[i][w]}`});}
        else{const take=dp[i-1][w-W2[i-1]]+V[i-1],skip=dp[i-1][w];dp[i][w]=Math.max(take,skip);ss.push({dp:dp.map(r=>[...r]),hi:[i,w],take:take>skip,desc:`Item ${i}: take=${take} vs skip=${skip} → dp[${i}][${w}]=${dp[i][w]}`});}
      }
    }
    ss.push({dp:dp.map(r=>[...r]),hi:[n2,C],done:true,desc:`Max value = ${dp[n2][C]} for capacity ${C} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`Knapsack built — ${ss.length} steps`,t:"info"}]);
  };

  const build=()=>{if(dpType==="fib")buildFib();else if(dpType==="lcs")buildLCS();else buildKnapsack();};
  const step=steps[stepIdx];

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Problem</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
            {[["fib","Fibonacci (1D DP)"],["lcs","LCS — Longest Common Subsequence"],["knapsack","0/1 Knapsack"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setDpType(k);setSteps([]);setStepIdx(-1)}} style={{
                padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",
                fontFamily:"'DM Sans',sans-serif",background:dpType===k?T.accentSoft:T.surface2,
                border:`1px solid ${dpType===k?T.accent+"66":T.border2}`,
                color:dpType===k?T.accent:T.muted2,transition:"all .15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        {dpType==="fib"&&<div><SLabel>n</SLabel><div style={{marginTop:6}}><Input value={n} onChange={setN} placeholder="8" mono/></div></div>}
        {dpType==="lcs"&&<><div><SLabel>String 1</SLabel><div style={{marginTop:5}}><Input value={s1} onChange={setS1} placeholder="ABCBDAB" mono/></div></div><div><SLabel>String 2</SLabel><div style={{marginTop:5}}><Input value={s2} onChange={setS2} placeholder="BDCABA" mono/></div></div></>}
        {dpType==="knapsack"&&<><div><SLabel>Weights</SLabel><div style={{marginTop:5}}><Input value={weights} onChange={setWeights} placeholder="2 3 4 5" mono/></div></div><div><SLabel>Values</SLabel><div style={{marginTop:5}}><Input value={values} onChange={setValues} placeholder="3 4 5 6" mono/></div></div><div><SLabel>Capacity</SLabel><div style={{marginTop:5}}><Input value={capacity} onChange={setCapacity} placeholder="5" mono/></div></div></>}
        <Btn onClick={build} variant="primary" full>⚙ Build DP Table</Btn>
        <InfoBox>
          {dpType==="fib"&&<><strong style={{color:T.text}}>Fibonacci DP</strong><br/><br/>Naive recursion = O(2ⁿ). DP memoizes → O(n) time, O(n) space. Classic 1D table fill.</>}
          {dpType==="lcs"&&<><strong style={{color:T.text}}>LCS</strong> — Longest Common Subsequence<br/><br/>2D table. dp[i][j] = length of LCS of first i chars of s1 and j chars of s2.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(mn)" color={T.yellow}/><CRow op="Space" val="O(mn)" color={T.orange}/></div></>}
          {dpType==="knapsack"&&<><strong style={{color:T.text}}>0/1 Knapsack</strong><br/><br/>Each item: take it or skip it. dp[i][w] = max value using first i items with capacity w.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(nW)" color={T.yellow}/><CRow op="Space" val="O(nW)" color={T.orange}/></div></>}
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
          {!step&&<div style={{color:T.muted,fontSize:13,paddingTop:60}}>Configure and click Build DP Table</div>}

          {/* Fibonacci 1D table */}
          {step&&dpType==="fib"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
              <div style={{fontSize:12,color:T.muted}}>dp[i] = dp[i-1] + dp[i-2]</div>
              <div style={{display:"flex",gap:0}}>
                {step.dp.map((v,i)=>{
                  const isHi=step.hi?.includes(i);
                  const isUsing=step.using?.includes(i);
                  return(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{
                        width:48,height:48,borderRadius:0,
                        borderTop:`2px solid ${isHi?T.yellow:isUsing?T.accent:T.surface3}`,
                        borderBottom:`2px solid ${isHi?T.yellow:isUsing?T.accent:T.surface3}`,
                        borderLeft:`1px solid ${T.surface3}`,borderRight:`1px solid ${T.surface3}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:14,
                        background:isHi?T.yellowSoft:isUsing?T.accentSoft:T.surface2,
                        color:isHi?T.yellow:isUsing?T.accent:T.muted2,
                        transition:"all .25s",
                        boxShadow:isHi?`0 0 14px ${T.yellow}66`:"none",
                      }}>{v}</div>
                      <div style={{fontSize:10,color:T.muted,fontFamily:"'Space Mono',monospace"}}>[{i}]</div>
                    </div>
                  );
                })}
              </div>
              {step.done&&<Badge color={T.green}>fib({n}) = {step.dp[step.dp.length-1]}</Badge>}
            </div>
          )}

          {/* LCS 2D grid */}
          {step&&dpType==="lcs"&&(()=>{
            const a=s1.toUpperCase(),b=s2.toUpperCase();
            const cellSize=42;
            return(
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}>
                  <thead>
                    <tr>
                      <td style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted}}>DP</td>
                      <td style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted}}>""</td>
                      {b.split("").map((c,j)=><td key={j} style={{width:cellSize,height:cellSize,textAlign:"center",color:T.blue,fontWeight:700}}>{c}</td>)}
                    </tr>
                  </thead>
                  <tbody>
                    {step.dp.map((row,i)=>(
                      <tr key={i}>
                        <td style={{textAlign:"center",color:i===0?T.muted:T.green,fontWeight:700,paddingRight:4}}>{i===0?'""':a[i-1]}</td>
                        {row.map((v,j)=>{
                          const isHi=step.hi&&step.hi[0]===i&&step.hi[1]===j;
                          return(
                            <td key={j} style={{
                              width:cellSize,height:cellSize,textAlign:"center",fontWeight:700,
                              background:isHi?(step.match?T.greenSoft:T.yellowSoft):T.surface2,
                              border:`1px solid ${isHi?(step.match?T.green:T.yellow):T.surface3}`,
                              color:isHi?(step.match?T.green:T.yellow):v>0?T.accent:T.muted,
                              transition:"all .2s",
                              boxShadow:isHi?`0 0 10px ${step.match?T.green:T.yellow}66`:"none",
                              fontSize:13,
                            }}>{v}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {step.done&&<div style={{marginTop:14,textAlign:"center"}}><Badge color={T.green}>LCS Length = {step.dp[step.dp.length-1][step.dp[0].length-1]}</Badge></div>}
              </div>
            );
          })()}

          {/* Knapsack 2D grid */}
          {step&&dpType==="knapsack"&&(()=>{
            const W2=weights.trim().split(/\s+/).map(Number);
            const V=values.trim().split(/\s+/).map(Number);
            const C=parseInt(capacity)||5;
            const cellSize=44;
            return(
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}>
                  <thead>
                    <tr>
                      <td style={{width:52,textAlign:"center",color:T.muted,padding:"0 4px"}}>Item\W</td>
                      {Array.from({length:C+1},(_,w)=><td key={w} style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted,fontWeight:700}}>{w}</td>)}
                    </tr>
                  </thead>
                  <tbody>
                    {step.dp.map((row,i)=>(
                      <tr key={i}>
                        <td style={{textAlign:"center",color:T.orange,fontWeight:700,fontSize:10,padding:"0 4px"}}>
                          {i===0?"—":`i${i}\n(w${W2[i-1]},v${V[i-1]})`}
                        </td>
                        {row.map((v,j)=>{
                          const isHi=step.hi&&step.hi[0]===i&&step.hi[1]===j;
                          const isTake=isHi&&step.take;
                          const isSkip=isHi&&step.skip;
                          return(
                            <td key={j} style={{
                              width:cellSize,height:cellSize,textAlign:"center",fontWeight:700,fontSize:13,
                              background:isTake?T.greenSoft:isSkip?T.redSoft:isHi?T.yellowSoft:T.surface2,
                              border:`1px solid ${isTake?T.green:isSkip?T.red:isHi?T.yellow:T.surface3}`,
                              color:isTake?T.green:isSkip?T.red:isHi?T.yellow:v>0?T.accent:T.muted,
                              transition:"all .2s",
                            }}>{v}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {step.done&&<div style={{marginTop:14,textAlign:"center"}}><Badge color={T.green}>Max Value = {step.dp[step.dp.length-1][C]} for capacity {C}</Badge></div>}
              </div>
            );
          })()}
        </div>

        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,fontSize:12,color:T.muted2}}>{step?.desc||"–"}</div>
          <Btn onClick={()=>setStepIdx(i=>Math.max(0,i-1))} disabled={stepIdx<=0||!step}>← Back</Btn>
          <span style={{fontSize:11,color:T.muted,fontFamily:"'Space Mono',monospace"}}>{step?`${stepIdx+1}/${steps.length}`:"-"}</span>
          <Btn onClick={()=>{if(stepIdx<steps.length-1){setStepIdx(i=>i+1);setLog(l=>[...l.slice(-30),{m:steps[stepIdx+1]?.desc||"",t:"info"}])}}} variant="primary" disabled={stepIdx>=steps.length-1||!step}>Next →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. HASHING VISUALIZER  (linear probe · chaining)
══════════════════════════════════════════════════════════════ */
function HashViz(){
  const SIZE=11;
  const [mode,setMode]=useState("linear"); // linear | chaining
  const [table,setTable]=useState(Array.from({length:SIZE},()=>[]));
  const [val,setVal]=useState("");
  const [searchVal,setSearchVal]=useState("");
  const [highlighted,setHighlighted]=useState([]);
  const [log,setLog]=useState([]);
  const [label,setLabel]=useState("Insert values to see hashing in action");

  const addLog=(m,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const hash=k=>((k%SIZE)+SIZE)%SIZE;

  const insert=async()=>{
    const k=parseInt(val)||Math.floor(Math.random()*99+1);
    setVal("");
    const h=hash(k);
    const t=[...table.map(b=>[...b])];
    addLog(`hash(${k}) = ${k} % ${SIZE} = ${h}`, "info");

    if(mode==="chaining"){
      setHighlighted([h]);
      await sleep(400);
      t[h]=[...t[h],k];
      setTable(t);setHighlighted([]);
      addLog(`insert ${k} → chain at [${h}], length=${t[h].length}`,"ok");
      setLabel(`<strong>insert(${k})</strong> — hash=${h}, chained. Bucket [${h}] has ${t[h].length} items`);
    } else {
      // linear probing
      let idx=h,probes=0;
      while(t[idx].length>0&&probes<SIZE){
        setHighlighted([idx]);
        addLog(`Slot [${idx}] occupied → probe +1`,"warn");
        setLabel(`Collision at [${idx}] → linear probe`);
        await sleep(350);
        idx=(idx+1)%SIZE;probes++;
      }
      if(probes>=SIZE){addLog("Hash table full!","err");return;}
      setHighlighted([idx]);
      await sleep(300);
      t[idx]=[k];
      setTable(t);setHighlighted([]);
      addLog(`insert ${k} → slot [${idx}] (${probes} probe${probes!==1?"s":""})`,"ok");
      setLabel(`<strong>insert(${k})</strong> — hash=${h}, placed at [${idx}] after ${probes} probe${probes!==1?"s":""}`);
    }
  };

  const search=async()=>{
    const k=parseInt(searchVal);
    if(isNaN(k))return;
    const h=hash(k);
    addLog(`search(${k}) → hash=${h}`,"info");
    if(mode==="chaining"){
      setHighlighted([h]);
      await sleep(400);
      const found=table[h].includes(k);
      setLabel(`<strong>search(${k})</strong> → bucket [${h}]: ${found?"✓ found":"✗ not found"}`);
      addLog(`bucket [${h}]: ${found?"found":"not found"}`,found?"ok":"err");
      setTimeout(()=>setHighlighted([]),900);
    } else {
      let idx=h,probes=0;
      while(probes<SIZE){
        setHighlighted([idx]);
        await sleep(350);
        if(table[idx].length===0){setLabel(`search(${k}) → ✗ not found (empty slot after ${probes} probes)`);addLog("not found","err");setTimeout(()=>setHighlighted([]),800);return;}
        if(table[idx][0]===k){setLabel(`<strong>search(${k})</strong> → ✓ found at [${idx}] after ${probes+1} probe${probes!==0?"s":""}`);addLog(`found at [${idx}]`,"ok");setTimeout(()=>setHighlighted([]),800);return;}
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
              <button key={k} onClick={()=>{setMode(k);reset()}} style={{
                flex:1,padding:"7px 6px",borderRadius:8,fontSize:10,fontWeight:600,
                cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                background:mode===k?T.accentSoft:T.surface2,
                border:`1px solid ${mode===k?T.accent+"66":T.border2}`,
                color:mode===k?T.accent:T.muted2,transition:"all .15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <SLabel>Insert Key</SLabel>
          <div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="integer key" onEnter={insert} mono/></div>
        </div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
        <div>
          <SLabel>Search Key</SLabel>
          <div style={{marginTop:6}}><Input value={searchVal} onChange={setSearchVal} placeholder="find key" onEnter={search} mono/></div>
        </div>
        <Btn onClick={search} variant="ghost" full>🔍 Search</Btn>
        <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>{mode==="linear"?"Linear Probing":"Chaining"}</strong><br/><br/>
          hash(k) = k mod {SIZE}<br/><br/>
          {mode==="linear"?"On collision: try next slot (+1) until empty found. Can cause clustering.":"On collision: store in linked list at same bucket. Simple, handles high load."}
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
              const isHL=highlighted.includes(i);
              const isEmpty=bucket.length===0;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  {/* Index */}
                  <div style={{
                    width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,flexShrink:0,
                    background:isHL?T.yellowSoft:T.surface3,
                    color:isHL?T.yellow:T.muted,
                    border:`1px solid ${isHL?T.yellow:T.surface3}`,
                    transition:"all .2s",boxShadow:isHL?`0 0 12px ${T.yellow}66`:"none",
                  }}>{i}</div>
                  {/* Bucket */}
                  <div style={{
                    flex:1,minHeight:36,borderRadius:10,border:`1px solid ${isHL?T.yellow:isEmpty?T.surface3:T.border2}`,
                    background:isHL?T.yellowSoft:isEmpty?T.surface3+"44":T.surface2,
                    display:"flex",alignItems:"center",gap:6,padding:"0 10px",
                    transition:"all .2s",boxShadow:isHL?`0 0 8px ${T.yellow}44`:"none",
                  }}>
                    {isEmpty?(
                      <span style={{color:T.surface3,fontSize:12,fontFamily:"'Space Mono',monospace"}}>empty</span>
                    ):(
                      bucket.map((v,bi)=>(
                        <div key={bi} style={{
                          background:T.accentSoft,border:`1px solid ${T.accent}55`,borderRadius:7,
                          padding:"3px 10px",fontFamily:"'Space Mono',monospace",fontSize:12,
                          fontWeight:700,color:T.accent,display:"flex",alignItems:"center",gap:6,
                        }}>
                          {v}
                          {mode==="chaining"&&bi<bucket.length-1&&<span style={{color:T.muted,fontSize:10}}>→</span>}
                        </div>
                      ))
                    )}
                  </div>
                  {/* Load indicator */}
                  {bucket.length>0&&<div style={{
                    width:4,height:Math.min(36,8*bucket.length),borderRadius:2,
                    background:bucket.length>3?T.red:bucket.length>1?T.yellow:T.green,flexShrink:0,
                  }}/>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.muted}}>
            load: {table.flat().length}/{SIZE} ({Math.round(table.flat().length/SIZE*100)}%)
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   7. TWO-POINTER & SLIDING WINDOW
══════════════════════════════════════════════════════════════ */
function TwoPointerViz(){
  const [mode,setMode]=useState("twosum");
  const [arrInput,setArrInput]=useState("1 3 5 7 9 11 14 17 20");
  const [targetInput,setTargetInput]=useState("18");
  const [windowK,setWindowK]=useState("3");
  const [steps,setSteps]=useState([]);
  const [stepIdx,setStepIdx]=useState(-1);

  const buildTwoSum=()=>{
    const arr=arrInput.trim().split(/\s+/).map(Number).sort((a,b)=>a-b);
    const target=parseInt(targetInput)||18;
    const ss=[{arr,l:0,r:arr.length-1,found:null,desc:`Start: l=0(${arr[0]}), r=${arr.length-1}(${arr[arr.length-1]}), target=${target}`}];
    let l=0,r=arr.length-1;
    while(l<r){
      const sum=arr[l]+arr[r];
      if(sum===target){ss.push({arr,l,r,found:[l,r],desc:`✓ Found! arr[${l}]=${arr[l]} + arr[${r}]=${arr[r]} = ${target}`});break;}
      else if(sum<target){ss.push({arr,l,r,action:"moveL",desc:`Sum ${sum} < ${target} → move l right`});l++;}
      else{ss.push({arr,l,r,action:"moveR",desc:`Sum ${sum} > ${target} → move r left`});r--;}
    }
    if(!ss[ss.length-1].found)ss.push({arr,l,r,notFound:true,desc:"No pair found that sums to target"});
    setSteps(ss);setStepIdx(0);
  };

  const buildSliding=()=>{
    const arr=arrInput.trim().split(/\s+/).map(Number);
    const k=parseInt(windowK)||3;
    const ss=[{arr,l:0,r:k-1,sum:arr.slice(0,k).reduce((a,b)=>a+b,0),maxSum:arr.slice(0,k).reduce((a,b)=>a+b,0),maxL:0,desc:`Init window [0..${k-1}], sum=${arr.slice(0,k).reduce((a,b)=>a+b,0)}`}];
    let maxSum=arr.slice(0,k).reduce((a,b)=>a+b,0),maxL=0;
    for(let i=k;i<arr.length;i++){
      const newSum=ss[ss.length-1].sum-arr[i-k]+arr[i];
      if(newSum>maxSum){maxSum=newSum;maxL=i-k+1;}
      ss.push({arr,l:i-k+1,r:i,sum:newSum,maxSum,maxL,desc:`Slide: remove arr[${i-k}]=${arr[i-k]}, add arr[${i}]=${arr[i]} → sum=${newSum}${newSum>=maxSum?" ← new max!":""}`});
    }
    ss.push({...ss[ss.length-1],done:true,desc:`Max sum window: [${maxL}..${maxL+k-1}] = ${maxSum}`});
    setSteps(ss);setStepIdx(0);
  };

  const build=()=>{if(mode==="twosum")buildTwoSum();else buildSliding();};
  const step=steps[stepIdx];

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div>
          <SLabel>Technique</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
            {[["twosum","Two Pointer — Two Sum"],["sliding","Sliding Window — Max Sum"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setMode(k);setSteps([]);setStepIdx(-1)}} style={{
                padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"left",
                fontFamily:"'DM Sans',sans-serif",background:mode===k?T.accentSoft:T.surface2,
                border:`1px solid ${mode===k?T.accent+"66":T.border2}`,
                color:mode===k?T.accent:T.muted2,transition:"all .15s"
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div><SLabel>Array (space-separated)</SLabel><div style={{marginTop:6}}><Input value={arrInput} onChange={setArrInput} placeholder="1 3 5 7 9..." mono/></div></div>
        {mode==="twosum"&&<div><SLabel>Target Sum</SLabel><div style={{marginTop:6}}><Input value={targetInput} onChange={setTargetInput} placeholder="18" mono/></div></div>}
        {mode==="sliding"&&<div><SLabel>Window Size k</SLabel><div style={{marginTop:6}}><Input value={windowK} onChange={setWindowK} placeholder="3" mono/></div></div>}
        <Btn onClick={build} variant="primary" full>⚙ Build Steps</Btn>
        <InfoBox>
          {mode==="twosum"&&<><strong style={{color:T.text}}>Two Pointers</strong><br/><br/>Works on sorted arrays. Start from both ends, move inward based on sum comparison. O(n) time vs O(n²) brute force.</>}
          {mode==="sliding"&&<><strong style={{color:T.text}}>Sliding Window</strong><br/><br/>Maintain a fixed window, slide right. Add new element, remove oldest. O(n) instead of O(nk).</>}
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Time" val="O(n)" color={T.green}/>
            <CRow op="Space" val="O(1)" color={T.green}/>
          </div>
        </InfoBox>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflowX:"auto"}}>
          {!step?<div style={{color:T.muted,fontSize:13}}>Configure and click Build Steps</div>:(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,width:"100%"}}>
              {/* Array display */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
                {step.arr.map((v,i)=>{
                  const isL=i===step.l,isR=i===step.r;
                  const inWindow=i>=step.l&&i<=step.r;
                  const isFound=step.found&&(i===step.found[0]||i===step.found[1]);
                  const isMaxWin=step.maxL!==undefined&&i>=step.maxL&&i<step.maxL+(parseInt(windowK)||3)&&step.done;
                  return(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {mode==="twosum"&&<div style={{fontSize:10,color:isL?T.accent:isR?T.green:"transparent",fontWeight:700}}>{isL?"L":isR?"R":"."}</div>}
                      <div style={{
                        width:46,height:46,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,
                        background:isFound?T.greenSoft:isMaxWin?T.yellowSoft:inWindow&&mode==="sliding"?T.accentSoft:T.surface2,
                        border:`2px solid ${isFound?T.green:isL||isR||isMaxWin?T.yellow:inWindow&&mode==="sliding"?T.accent:T.border2}`,
                        color:isFound?T.green:isL?T.accent:isR?T.green:inWindow&&mode==="sliding"?T.accent:T.muted2,
                        boxShadow:isFound?`0 0 14px ${T.green}66`:isL||isR?`0 0 10px ${T.yellow}55`:"none",
                        transition:"all .25s",
                      }}>{v}</div>
                      <div style={{fontSize:9,color:T.muted,fontFamily:"'Space Mono',monospace"}}>[{i}]</div>
                    </div>
                  );
                })}
              </div>
              {/* Status */}
              <div style={{display:"flex",gap:20}}>
                {mode==="twosum"&&<>
                  <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.muted}}>Sum</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:step.found?T.green:T.yellow}}>{step.arr[step.l]+step.arr[step.r]}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.muted}}>Target</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:T.accent}}>{targetInput}</div></div>
                </>}
                {mode==="sliding"&&<>
                  <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.muted}}>Window Sum</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:T.accent}}>{step.sum}</div></div>
                  <div style={{textAlign:"center"}}><div style={{fontSize:10,color:T.muted}}>Max Sum</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:T.yellow}}>{step.maxSum}</div></div>
                </>}
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,fontSize:12,color:T.muted2}}>{step?.desc||"–"}</div>
          <Btn onClick={()=>setStepIdx(i=>Math.max(0,i-1))} disabled={stepIdx<=0||!step}>← Back</Btn>
          <span style={{fontSize:11,color:T.muted,fontFamily:"'Space Mono',monospace"}}>{step?`${stepIdx+1}/${steps.length}`:"-"}</span>
          <Btn onClick={()=>setStepIdx(i=>Math.min(steps.length-1,i+1))} variant="primary" disabled={stepIdx>=steps.length-1||!step}>Next →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   8. STACK VISUALIZER (Push · Pop · Peek)
══════════════════════════════════════════════════════════════ */
function StackViz(){
  const [stack,setStack]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Push values to build the stack");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const push=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);
    setVal("");
    const s=[...stack,v];
    setStack(s);setHighlighted(s.length-1);
    addLog(`push(${v}) → top is now ${v}. size=${s.length}`,"ok");
    setLabel(`<strong>push(${v})</strong> — added to top. Stack size = ${s.length}`);
    setTimeout(()=>setHighlighted(-1),600);
  };

  const pop=()=>{
    if(!stack.length){addLog("Stack underflow!","err");return;}
    const s=[...stack];const v=s.pop()!;
    setHighlighted(stack.length-1);
    addLog(`pop() → removed ${v}. size=${s.length}`,"warn");
    setLabel(`<strong>pop()</strong> → ${v}. ${s.length?`New top = ${s[s.length-1]}`:"Stack is empty"}`);
    setTimeout(()=>{setStack(s);setHighlighted(-1)},400);
  };

  const peek=()=>{
    if(!stack.length){addLog("Stack is empty","err");return;}
    const v=stack[stack.length-1];
    setHighlighted(stack.length-1);
    addLog(`peek() → ${v}`,"ok");
    setLabel(`<strong>peek()</strong> → top element is ${v}`);
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
            <CRow op="Push" val="O(1)" color={T.green}/>
            <CRow op="Pop" val="O(1)" color={T.green}/>
            <CRow op="Peek" val="O(1)" color={T.green}/>
            <CRow op="Search" val="O(n)" color={T.yellow}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:28}}>
          {stack.length===0?<div style={{color:T.muted,fontSize:13}}>Stack is empty — push values</div>:(
            <div style={{display:"flex",flexDirection:"column-reverse",gap:4,alignItems:"center"}}>
              {stack.map((v,i)=>{
                const isTop=i===stack.length-1;
                const isHL=i===highlighted;
                return(
                  <div key={i} className={isHL?"pop":""} style={{
                    width:120,height:44,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                    fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,position:"relative",
                    background:isHL?T.yellowSoft:isTop?T.accentSoft:T.surface2,
                    border:`2px solid ${isHL?T.yellow:isTop?T.accent:T.border2}`,
                    color:isHL?T.yellow:isTop?T.accent:T.muted2,
                    boxShadow:isHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s",
                  }}>
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

/* ══════════════════════════════════════════════════════════════
   9. QUEUE VISUALIZER (Enqueue · Dequeue · Front · Rear)
══════════════════════════════════════════════════════════════ */
function QueueViz(){
  const [queue,setQueue]=useState<number[]>([]);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Enqueue values to build the queue");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const enqueue=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);
    setVal("");
    const q=[...queue,v];
    setQueue(q);setHighlighted(q.length-1);
    addLog(`enqueue(${v}) → rear. size=${q.length}`,"ok");
    setLabel(`<strong>enqueue(${v})</strong> — added to rear. size=${q.length}`);
    setTimeout(()=>setHighlighted(-1),600);
  };

  const dequeue=()=>{
    if(!queue.length){addLog("Queue underflow!","err");return;}
    const v=queue[0];
    setHighlighted(0);
    addLog(`dequeue() → ${v}. size=${queue.length-1}`,"warn");
    setLabel(`<strong>dequeue()</strong> → ${v}. ${queue.length>1?`New front = ${queue[1]}`:"Queue empty"}`);
    setTimeout(()=>{setQueue(q=>q.slice(1));setHighlighted(-1)},400);
  };

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Enqueue Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={enqueue} mono/></div></div>
        <Btn onClick={enqueue} variant="primary" full>⊕ Enqueue</Btn>
        <Btn onClick={dequeue} variant="red" disabled={!queue.length} full>⊖ Dequeue</Btn>
        <Btn onClick={()=>{setQueue([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Queue (FIFO)</strong><br/><br/>
          First In, First Out. Think BFS, task scheduling, print queue.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Enqueue" val="O(1)" color={T.green}/>
            <CRow op="Dequeue" val="O(1)" color={T.green}/>
            <CRow op="Front" val="O(1)" color={T.green}/>
            <CRow op="Search" val="O(n)" color={T.yellow}/>
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
                  <div key={i} className={isHL?"pop":""} style={{
                    width:56,height:56,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
                    flexDirection:"column",fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,
                    background:isHL?T.yellowSoft:isFront?T.accentSoft:isRear?T.greenSoft:T.surface2,
                    border:`2px solid ${isHL?T.yellow:isFront?T.accent:isRear?T.green:T.border2}`,
                    color:isHL?T.yellow:isFront?T.accent:isRear?T.green:T.muted2,
                    boxShadow:isHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s",
                  }}>
                    {v}
                    <span style={{fontSize:8,color:T.muted}}>[{i}]</span>
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

/* ══════════════════════════════════════════════════════════════
   10. LINKED LIST VISUALIZER (Insert · Delete · Search)
══════════════════════════════════════════════════════════════ */
function LinkedListViz(){
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
    addLog(`insertHead(${v})`,"ok");
    setLabel(`<strong>insertHead(${v})</strong> — new head`);
    setTimeout(()=>setHighlighted(-1),600);
  };

  const insertTail=()=>{
    const v=parseInt(val)||Math.floor(Math.random()*90+5);setVal("");
    const n={val:v,id:idRef.current++};
    setNodes(ns=>{const r=[...ns,n];setHighlighted(r.length-1);return r;});
    addLog(`insertTail(${v})`,"ok");
    setLabel(`<strong>insertTail(${v})</strong> — new tail`);
    setTimeout(()=>setHighlighted(-1),600);
  };

  const deleteHead=()=>{
    if(!nodes.length){addLog("List empty","err");return;}
    setHighlighted(0);
    addLog(`deleteHead() → ${nodes[0].val}`,"warn");
    setLabel(`<strong>deleteHead()</strong> → removed ${nodes[0].val}`);
    setTimeout(()=>{setNodes(ns=>ns.slice(1));setHighlighted(-1)},400);
  };

  const search=async()=>{
    const k=parseInt(searchVal);if(isNaN(k))return;
    setSearchVal("");
    for(let i=0;i<nodes.length;i++){
      setSearchHL(i);
      addLog(`Traverse: node[${i}]=${nodes[i].val} ${nodes[i].val===k?"✓ FOUND":"≠ "+k}`,nodes[i].val===k?"ok":"info");
      await sleep(400);
      if(nodes[i].val===k){setLabel(`<strong>search(${k})</strong> → found at position ${i}`);setTimeout(()=>setSearchHL(-1),800);return;}
    }
    setLabel(`<strong>search(${k})</strong> → not found`);addLog(`${k} not in list`,"err");
    setSearchHL(-1);
  };

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 42" onEnter={insertHead} mono/></div></div>
        <div style={{display:"flex",gap:6}}><Btn onClick={insertHead} variant="primary" style={{flex:1}}>+ Head</Btn><Btn onClick={insertTail} variant="green" style={{flex:1}}>+ Tail</Btn></div>
        <Btn onClick={deleteHead} variant="red" disabled={!nodes.length} full>⊖ Delete Head</Btn>
        <div><SLabel>Search</SLabel><div style={{marginTop:6}}><Input value={searchVal} onChange={setSearchVal} placeholder="find value" onEnter={search} mono/></div></div>
        <Btn onClick={search} variant="ghost" full>🔍 Search</Btn>
        <Btn onClick={()=>{setNodes([]);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Singly Linked List</strong><br/><br/>
          Each node points to the next. No random access — must traverse.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert Head" val="O(1)" color={T.green}/>
            <CRow op="Insert Tail" val="O(n)" color={T.yellow}/>
            <CRow op="Delete Head" val="O(1)" color={T.green}/>
            <CRow op="Search" val="O(n)" color={T.yellow}/>
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
                    <div style={{
                      width:64,height:48,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                      flexDirection:"column",fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,
                      background:isSHL?T.yellowSoft:isHL?T.greenSoft:T.surface2,
                      border:`2px solid ${isSHL?T.yellow:isHL?T.green:T.border2}`,
                      color:isSHL?T.yellow:isHL?T.green:T.muted2,
                      boxShadow:isSHL?`0 0 14px ${T.yellow}66`:"none",transition:"all .25s",
                    }}>
                      {n.val}
                      <span style={{fontSize:8,color:T.muted}}>{i===0?"head":i===nodes.length-1?"tail":""}</span>
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

/* ══════════════════════════════════════════════════════════════
   11. BST VISUALIZER (Insert · Search · Delete)
══════════════════════════════════════════════════════════════ */
type BSTNode={val:number,left:BSTNode|null,right:BSTNode|null};
function bstInsert(root:BSTNode|null,v:number):BSTNode{
  if(!root)return{val:v,left:null,right:null};
  if(v<root.val)root.left=bstInsert(root.left,v);
  else if(v>root.val)root.right=bstInsert(root.right,v);
  return root;
}
function bstSearch(root:BSTNode|null,v:number):boolean{
  if(!root)return false;
  if(v===root.val)return true;
  return v<root.val?bstSearch(root.left,v):bstSearch(root.right,v);
}
function bstMin(root:BSTNode):number{return root.left?bstMin(root.left):root.val;}
function bstDelete(root:BSTNode|null,v:number):BSTNode|null{
  if(!root)return null;
  if(v<root.val){root.left=bstDelete(root.left,v);return root;}
  if(v>root.val){root.right=bstDelete(root.right,v);return root;}
  if(!root.left)return root.right; if(!root.right)return root.left;
  root.val=bstMin(root.right);root.right=bstDelete(root.right,root.val);return root;
}
function bstToArray(root:BSTNode|null,x:number,y:number,dx:number,arr:{val:number,x:number,y:number,px?:number,py?:number}[],px?:number,py?:number){
  if(!root)return;
  arr.push({val:root.val,x,y,px,py});
  bstToArray(root.left,x-dx,y+60,dx/2,arr,x,y);
  bstToArray(root.right,x+dx,y+60,dx/2,arr,x,y);
}

function BSTViz(){
  const [root,setRoot]=useState<BSTNode|null>(null);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState<number|null>(null);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to build the BST");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const insert=()=>{
    const v=parseInt(val);if(isNaN(v))return;setVal("");
    setRoot(r=>{const nr=bstInsert(r?JSON.parse(JSON.stringify(r)):null,v);return nr;});
    setHighlighted(v);addLog(`insert(${v})`,"ok");setLabel(`<strong>insert(${v})</strong>`);
    setTimeout(()=>setHighlighted(null),800);
  };

  const search=()=>{
    const v=parseInt(val);if(isNaN(v))return;
    const found=bstSearch(root,v);
    setHighlighted(v);addLog(`search(${v}) → ${found?"found":"not found"}`,found?"ok":"err");
    setLabel(`<strong>search(${v})</strong> → ${found?"✓ found":"✗ not found"}`);
    setTimeout(()=>setHighlighted(null),800);
  };

  const del=()=>{
    const v=parseInt(val);if(isNaN(v))return;setVal("");
    setRoot(r=>bstDelete(r?JSON.parse(JSON.stringify(r)):null,v));
    addLog(`delete(${v})`,"warn");setLabel(`<strong>delete(${v})</strong>`);
  };

  const loadExample=()=>{
    let r:BSTNode|null=null;
    [50,30,70,20,40,60,80].forEach(v=>{r=bstInsert(r,v);});
    setRoot(r);addLog("Loaded example BST","info");
  };

  const nodes:{val:number,x:number,y:number,px?:number,py?:number}[]=[];
  bstToArray(root,300,30,140,nodes);

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 50" onEnter={insert} mono/></div></div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
        <Btn onClick={search} variant="teal" full>🔍 Search</Btn>
        <Btn onClick={del} variant="red" full>⊖ Delete</Btn>
        <Btn onClick={loadExample} variant="ghost" full>⚡ Load Example</Btn>
        <Btn onClick={()=>{setRoot(null);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Binary Search Tree</strong><br/><br/>
          Left subtree &lt; root &lt; right subtree. In-order traversal gives sorted order.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert (avg)" val="O(log n)" color={T.green}/>
            <CRow op="Search (avg)" val="O(log n)" color={T.green}/>
            <CRow op="Delete (avg)" val="O(log n)" color={T.green}/>
            <CRow op="Worst (skewed)" val="O(n)" color={T.red}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"auto"}}>
          {!root?<div style={{color:T.muted,fontSize:13,paddingTop:60}}>BST is empty — insert values</div>:(
            <svg width="600" height="360" viewBox="0 0 600 360" style={{overflow:"visible"}}>
              {nodes.map((n,i)=>{
                if(n.px!==undefined&&n.py!==undefined){
                  return<line key={`e${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke={T.surface3} strokeWidth={1.5}/>;
                }return null;
              })}
              {nodes.map((n,i)=>{
                const isHL=n.val===highlighted;
                const col=isHL?T.yellow:T.blue;
                return(
                  <g key={`n${i}`}>
                    <circle cx={n.x} cy={n.y} r={20} fill={isHL?T.yellowSoft:T.surface2}
                      stroke={col} strokeWidth={isHL?3:1.8}
                      style={isHL?{filter:`drop-shadow(0 0 10px ${T.yellow})`}:{}}/>
                    <text x={n.x} y={n.y+5} textAnchor="middle" fill={isHL?"#fff":col}
                      fontSize="12" fontFamily="Space Mono" fontWeight="700">{n.val}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   12. TRIE VISUALIZER (Insert · Search · Autocomplete)
══════════════════════════════════════════════════════════════ */
type TrieNode={children:Record<string,TrieNode>,end:boolean};
function newTrieNode():TrieNode{return{children:{},end:false};}
function trieInsert(root:TrieNode,word:string){let n=root;for(const c of word){if(!n.children[c])n.children[c]=newTrieNode();n=n.children[c];}n.end=true;}
function trieSearch(root:TrieNode,word:string):boolean{let n=root;for(const c of word){if(!n.children[c])return false;n=n.children[c];}return n.end;}
function trieAutocomplete(root:TrieNode,prefix:string):string[]{
  let n=root;for(const c of prefix){if(!n.children[c])return[];n=n.children[c];}
  const results:string[]=[];
  function dfs(node:TrieNode,path:string){if(node.end)results.push(path);for(const[c,child]of Object.entries(node.children)){if(results.length<10)dfs(child,path+c);}}
  dfs(n,prefix);return results;
}
function trieToTree(node:TrieNode,ch:string,x:number,y:number,dx:number,arr:{ch:string,x:number,y:number,end:boolean,px?:number,py?:number}[],px?:number,py?:number){
  arr.push({ch,x,y,end:node.end,px,py});
  const keys=Object.keys(node.children);
  const total=keys.length;const startX=x-dx*(total-1)/2;
  keys.forEach((k,i)=>{trieToTree(node.children[k],k,startX+i*dx,y+55,Math.max(dx/2,30),arr,x,y);});
}

function TrieViz(){
  const [trie]=useState<TrieNode>(()=>newTrieNode());
  const [word,setWord]=useState("");
  const [results,setResults]=useState<string[]>([]);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert words to build the trie");
  const [ver,setVer]=useState(0);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const insert=()=>{
    if(!word.trim())return;const w=word.trim().toLowerCase();setWord("");
    trieInsert(trie,w);setVer(v=>v+1);
    addLog(`insert("${w}")`,"ok");setLabel(`<strong>insert("${w}")</strong>`);
  };

  const search=()=>{
    if(!word.trim())return;const w=word.trim().toLowerCase();
    const found=trieSearch(trie,w);
    addLog(`search("${w}") → ${found?"found":"not found"}`,found?"ok":"err");
    setLabel(`<strong>search("${w}")</strong> → ${found?"✓ found":"✗ not found"}`);
  };

  const autocomplete=()=>{
    if(!word.trim())return;const w=word.trim().toLowerCase();
    const r=trieAutocomplete(trie,w);setResults(r);
    addLog(`autocomplete("${w}") → ${r.length} results`,"info");
    setLabel(`<strong>autocomplete("${w}")</strong> → [${r.join(", ")}]`);
  };

  const loadWords=()=>{
    ["apple","app","application","apply","apt","banana","band","ban","bat","bath"].forEach(w=>trieInsert(trie,w));
    setVer(v=>v+1);addLog("Loaded example words","info");
  };

  const nodes:{ch:string,x:number,y:number,end:boolean,px?:number,py?:number}[]=[];
  trieToTree(trie,"root",300,25,80,nodes);

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Word</SLabel><div style={{marginTop:6}}><Input value={word} onChange={setWord} placeholder='e.g. "apple"' onEnter={insert} mono/></div></div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert Word</Btn>
        <Btn onClick={search} variant="teal" full>🔍 Search</Btn>
        <Btn onClick={autocomplete} variant="blue" full>⌨ Autocomplete</Btn>
        <Btn onClick={loadWords} variant="ghost" full>⚡ Load Examples</Btn>
        {results.length>0&&(
          <div><SLabel>Autocomplete Results</SLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
              {results.map((r,i)=><Badge key={i} color={T.green}>{r}</Badge>)}
            </div>
          </div>
        )}
        <InfoBox>
          <strong style={{color:T.text}}>Trie (Prefix Tree)</strong><br/><br/>
          Tree where each edge is a character. Shared prefixes share nodes. Used for autocomplete, spell check.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert" val="O(m)" color={T.green}/>
            <CRow op="Search" val="O(m)" color={T.green}/>
            <CRow op="Autocomplete" val="O(m+k)" color={T.yellow}/>
            <CRow op="Space" val="O(ALPHABET*m*n)" color={T.orange}/>
          </div>
          <div style={{marginTop:6,fontSize:10,color:T.muted}}>m = word length, k = results count</div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"auto",padding:16}}>
          {nodes.length<=1?<div style={{color:T.muted,fontSize:13,paddingTop:60}}>Trie is empty — insert words</div>:(
            <svg width="600" height="400" viewBox="0 0 600 400" style={{overflow:"visible"}} key={ver}>
              {nodes.map((n,i)=>{
                if(n.px!==undefined&&n.py!==undefined){
                  return<line key={`e${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke={T.surface3} strokeWidth={1.5}/>;
                }return null;
              })}
              {nodes.map((n,i)=>{
                const col=n.end?T.green:n.ch==="root"?T.accent:T.blue;
                return(
                  <g key={`n${i}`}>
                    <circle cx={n.x} cy={n.y} r={16} fill={n.end?T.greenSoft:T.surface2}
                      stroke={col} strokeWidth={n.end?2.5:1.5}/>
                    <text x={n.x} y={n.y+4} textAnchor="middle" fill={col}
                      fontSize="11" fontFamily="Space Mono" fontWeight="700">{n.ch==="root"?"⊙":n.ch}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
const TABS=[
  {id:"sort",   label:"📊 Sorting",          badge:"5 Algos"},
  {id:"merge",  label:"🔀 Merge Arrays",      badge:"2 Ptrs"},
  {id:"graph",  label:"🕸 Graph",             badge:"BFS·DFS·Dijkstra"},
  {id:"heap",   label:"⛰ Heap",              badge:"Min-Heap"},
  {id:"dp",     label:"🧮 Dynamic Prog.",     badge:"Fib·LCS·Knapsack"},
  {id:"hash",   label:"🔑 Hashing",           badge:"Probe·Chain"},
  {id:"twoptr", label:"👆 Two Pointer",       badge:"Sliding Window"},
  {id:"stack",  label:"📚 Stack",             badge:"LIFO"},
  {id:"queue",  label:"🔄 Queue",             badge:"FIFO"},
  {id:"linked", label:"🔗 Linked List",       badge:"Singly"},
  {id:"bst",    label:"🌲 BST",              badge:"Binary Search"},
  {id:"trie",   label:"🔤 Trie",             badge:"Prefix Tree"},
];

export default function DSAVisualizer(){
  const[active,setActive]=useState("sort");
  return(
    <div style={{height:"calc(100vh - 0px)",display:"flex",flexDirection:"column",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",overflow:"hidden",borderRadius:12,margin:"-24px -24px 0",width:"calc(100% + 48px)"}}>
      <style>{CSS}</style>
      {/* Topbar */}
      <div style={{padding:"11px 22px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:T.yellow}}>⚡ EduAI</span>
          <span style={{color:T.surface3}}>/</span>
          <span style={{fontSize:13,color:T.muted2}}>Advanced DSA Visualizer</span>
        </div>
        <div style={{fontSize:11,color:T.muted2,background:T.surface2,padding:"4px 12px",borderRadius:100,border:`1px solid ${T.border}`}}>
          12 Visualizers · Sorting · Graph · DP · Trees
        </div>
      </div>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:12,overflowX:"auto",flexShrink:0}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActive(tab.id)} style={{
            padding:"10px 14px",fontSize:12,fontWeight:500,cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",background:"none",
            borderTop:"none",borderLeft:"none",borderRight:"none",
            borderBottom:active===tab.id?`2px solid ${T.accent}`:"2px solid transparent",
            marginBottom:-1,color:active===tab.id?T.accent:T.muted,
            display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap",transition:"all .15s",
          }}>
            {tab.label}
            <span style={{
              fontSize:9,fontFamily:"'Space Mono',monospace",fontWeight:700,
              background:active===tab.id?T.accentSoft:T.surface2,
              color:active===tab.id?T.accent:T.muted,padding:"1px 6px",borderRadius:100,
              border:`1px solid ${active===tab.id?T.accent+"44":T.border2}`,
            }}>{tab.badge}</span>
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {active==="sort"   &&<SortingViz/>}
        {active==="merge"  &&<MergeViz/>}
        {active==="graph"  &&<GraphViz/>}
        {active==="heap"   &&<HeapViz/>}
        {active==="dp"     &&<DPViz/>}
        {active==="hash"   &&<HashViz/>}
        {active==="twoptr" &&<TwoPointerViz/>}
        {active==="stack"  &&<StackViz/>}
        {active==="queue"  &&<QueueViz/>}
        {active==="linked" &&<LinkedListViz/>}
        {active==="bst"    &&<BSTViz/>}
        {active==="trie"   &&<TrieViz/>}
      </div>
    </div>
  );
}

