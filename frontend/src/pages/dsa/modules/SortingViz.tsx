import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, InfoBox, CRow, Log, Select } from "../shared";
import { motion } from "framer-motion";

function genArr(n=16){return Array.from({length:n},(_,i)=>({id:`id-${Date.now()}-${i}`,val:Math.floor(Math.random()*90+8),state:"idle"}));}

export default function SortingViz(){
  const [bars,setBars]=useState<{id:string,val:number,state:string}[]>(genArr());
  const [algo,setAlgo]=useState("bubble");
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(400);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [stats,setStats]=useState({comps:0,swaps:0});
  const [label,setLabel]=useState("Pick an algorithm and press Run");
  const stopRef=useRef(false);
  const statsRef=useRef({comps:0,swaps:0});

  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-30),{m,t}]);

  const reset=()=>{
    stopRef.current=true;
    setBars(genArr());
    statsRef.current={comps:0,swaps:0};
    setStats({comps:0,swaps:0});
    setLabel("Press ▶ Run to start");setRunning(false);
  };

  const updateBars=(b:{id:string,val:number,state:string}[],label?:string,t="info")=>{
    setBars([...b]);
    if(label){setLabel(label);addLog(label,t);}
    setStats({...statsRef.current});
  };

  const cmp=(b:any[],i:number,j:number)=>{statsRef.current.comps++;b[i].state="compare";b[j].state="compare";};
  const swp=(b:any[],i:number,j:number)=>{statsRef.current.swaps++;[b[i],b[j]]=[b[j],b[i]];b[i].state="swap";b[j].state="swap";};

  const run=async()=>{
    stopRef.current=false;statsRef.current={comps:0,swaps:0};setRunning(true);
    const b=bars.map(x=>({...x,state:"idle"}));
    const tick=async(b2:any[],msg:string,t="info")=>{
      if(stopRef.current)throw new Error("stopped");
      updateBars(b2,msg,t);await sleep(speed);
    };
    try{
      if(algo==="bubble")await bubbleSort(b,tick);
      else if(algo==="selection")await selectionSort(b,tick);
      else if(algo==="insertion")await insertionSort(b,tick);
      else if(algo==="merge")await mergeSort(b,tick,0,b.length-1);
      else if(algo==="quick")await quickSort(b,tick,0,b.length-1);
      b.forEach(x=>x.state="sorted");updateBars(b,"✓ Sorted!","ok");
    }catch(e:any){if(e.message!=="stopped")throw e;}
    setRunning(false);
  };

  async function bubbleSort(b:any[],tick:any){
    const n=b.length;
    for(let i=0;i<n-1;i++){
      let swapped=false;
      for(let j=0;j<n-1-i;j++){
        cmp(b,j,j+1);await tick(b,`Compare [${j}]=${b[j].val} vs [${j+1}]=${b[j+1].val}`);
        if(b[j].val>b[j+1].val){swp(b,j,j+1);swapped=true;await tick(b,`Swap → ${b[j].val} ↔ ${b[j+1].val}`,"warn");}
        b[j].state="idle";b[j+1].state="idle";
      }
      b[n-1-i].state="sorted";
      if(!swapped){b.forEach(x=>x.state="sorted");break;}
    }
  }
  async function selectionSort(b:any[],tick:any){
    for(let i=0;i<b.length;i++){
      let minIdx=i;b[i].state="compare";await tick(b,`Pass ${i+1}: find min from [${i}]`);
      for(let j=i+1;j<b.length;j++){
        b[j].state="compare";statsRef.current.comps++;
        await tick(b,`Compare ${b[j].val} < min ${b[minIdx].val}?`);
        if(b[j].val<b[minIdx].val){if(minIdx!==i)b[minIdx].state="idle";minIdx=j;}else{b[j].state="idle";}
      }
      if(minIdx!==i){swp(b,i,minIdx);await tick(b,`Swap min ${b[i].val} to pos [${i}]`,"warn");}
      b[i].state="sorted";if(minIdx!==i)b[minIdx].state="idle";
    }
  }
  async function insertionSort(b:any[],tick:any){
    b[0].state="sorted";
    for(let i=1;i<b.length;i++){
      const key=b[i].val;b[i].state="compare";await tick(b,`Insert key=${key}`);
      let j=i-1;
      while(j>=0&&b[j].val>key){
        statsRef.current.comps++;b[j+1].val=b[j].val;b[j+1].state="swap";b[j].state="compare";
        statsRef.current.swaps++;await tick(b,`Shift ${b[j].val} right`,"warn");
        b[j].state="sorted";j--;
      }
      b[j+1].val=key;b[j+1].state="sorted";await tick(b,`Placed key=${key} at [${j+1}]`,"ok");
    }
  }
  async function mergeSort(b:any[],tick:any,l:number,r:number){
    if(l>=r)return;
    const m=Math.floor((l+r)/2);
    for(let i=l;i<=r;i++)b[i].state="compare";
    await tick(b,`Split [${l}..${m}] | [${m+1}..${r}]`);
    await mergeSort(b,tick,l,m);await mergeSort(b,tick,m+1,r);
    const left=b.slice(l,m+1).map((x:any)=>({...x}));
    const right=b.slice(m+1,r+1).map((x:any)=>({...x}));
    let i=0,j=0,k=l;
    while(i<left.length&&j<right.length){
      statsRef.current.comps++;
      if(left[i].val<=right[j].val){b[k]={...left[i],state:"merge"};i++;}
      else{b[k]={...right[j],state:"merge"};j++;}
      await tick(b,`Merge: placed ${b[k].val} at [${k}]`,"warn");b[k].state="sorted";k++;
    }
    while(i<left.length){b[k]={...left[i],state:"sorted"};i++;k++;}
    while(j<right.length){b[k]={...right[j],state:"sorted"};j++;k++;}
    await tick(b,`Merged [${l}..${r}]`,"ok");
  }
  async function quickSort(b:any[],tick:any,lo:number,hi:number){
    if(lo>=hi)return;
    const pv=await partition(b,tick,lo,hi);b[pv].state="sorted";
    await quickSort(b,tick,lo,pv-1);await quickSort(b,tick,pv+1,hi);
  }
  async function partition(b:any[],tick:any,lo:number,hi:number){
    const pval=b[hi].val;b[hi].state="pivot";await tick(b,`Pivot = ${pval} at [${hi}]`);
    let i=lo-1;
    for(let j=lo;j<hi;j++){
      statsRef.current.comps++;b[j].state="compare";await tick(b,`Compare ${b[j].val} ≤ pivot ${pval}?`);
      if(b[j].val<=pval){i++;swp(b,i,j);await tick(b,`Swap ${b[i].val} ↔ ${b[j].val}`,"warn");}
      if(b[j].state!=="sorted")b[j].state="idle";
    }
    swp(b,i+1,hi);b[i+1].state="pivot";await tick(b,`Pivot ${pval} placed at [${i+1}]`,"ok");
    return i+1;
  }

  const stateColor:Record<string,string>={idle:T.blue,compare:T.yellow,swap:T.orange,sorted:T.green,pivot:T.red,merge:T.purple};
  const maxVal=Math.max(...bars.map(b=>b.val),1);
  const algoInfo:Record<string,any>={
    bubble:{best:"O(n)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Adaptive: stops early if no swaps."},
    selection:{best:"O(n²)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Always n² comparisons, minimal swaps."},
    insertion:{best:"O(n)",avg:"O(n²)",worst:"O(n²)",space:"O(1)",note:"Excellent on nearly-sorted data."},
    merge:{best:"O(n log n)",avg:"O(n log n)",worst:"O(n log n)",space:"O(n)",note:"Stable. Guaranteed n log n always."},
    quick:{best:"O(n log n)",avg:"O(n log n)",worst:"O(n²)",space:"O(log n)",note:"Fastest in practice. Worst on sorted input."},
  };
  const info=algoInfo[algo];

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div>
          <SLabel>Algorithm</SLabel>
          <div style={{marginTop:6}}>
            <Select
              value={algo} onChange={(v)=>{if(!running)setAlgo(v)}} disabled={running}
              options={[
                ["bubble","Bubble Sort"],
                ["selection","Selection Sort"],
                ["insertion","Insertion Sort"],
                ["merge","Merge Sort"],
                ["quick","Quick Sort"]
              ]}
            />
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={run} variant="primary" disabled={running} style={{flex:1}}>▶ Run</Btn>
          <Btn onClick={reset} variant="ghost" disabled={running} style={{flex:1}}>↺ New</Btn>
        </div>
        <div><SLabel>Speed</SLabel><div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div></div>
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
              <div style={{width:10,height:10,borderRadius:3,background:c}}/>{s}
            </div>
          ))}
        </div>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px 24px 0",gap:3,overflowX:"auto"}}>
          {bars.map((bar)=>{
            const col=stateColor[bar.state]||T.blue;
            const h=Math.max(6,Math.floor((bar.val/maxVal)*260));
            return(
              <motion.div layout transition={{type:"spring",stiffness:300,damping:25}} key={bar.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:col,fontFamily:"'Space Mono',monospace",opacity:bar.state!=="idle"?1:0.4}}>{bar.val}</div>
                <motion.div layout style={{
                  width:Math.max(16,Math.floor(620/bars.length)-3),height:h,
                  borderRadius:"5px 5px 0 0",
                  background:`linear-gradient(to top, ${col}cc, ${col}88)`,
                  border:`1px solid ${col}66`,
                  boxShadow:bar.state!=="idle"?`0 0 10px ${col}88`:"none",
                  transform:bar.state==="swap"||bar.state==="compare"?"translateY(-4px)":"none",
                }}/>
              </motion.div>
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
