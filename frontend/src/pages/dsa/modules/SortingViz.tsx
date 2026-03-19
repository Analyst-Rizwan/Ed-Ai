import { useState, useRef } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, SpeedRow, Log, Select, useStepGuide, useAnimation, Controls } from "../shared";
import { motion } from "framer-motion";

function genArr(n=16){return Array.from({length:n},(_,i)=>({id:`id-${Date.now()}-${i}`,val:Math.floor(Math.random()*90+8),state:"idle"}));}

export default function SortingViz(){
  const [bars,setBars]=useState<{id:string,val:number,state:string}[]>(genArr());
  const [algo,setAlgo]=useState("bubble");
  const anim = useAnimation();
  const [speed,setSpeed]=useState(400);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [stats,setStats]=useState({comps:0,swaps:0});
  const [label,setLabel]=useState("Pick an algorithm and press Run");
  const statsRef=useRef({comps:0,swaps:0});

  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-30),{m,t}]);
  const guide = useStepGuide();

  const reset=()=>{
    anim.reset();
    setBars(genArr());
    statsRef.current={comps:0,swaps:0};
    setStats({comps:0,swaps:0});
    setLabel("Press ▶ Run to start");
  };

  const runExample=async()=>{
    guide.resetGuide();
    anim.reset();
    const algoNames:Record<string,string>={bubble:"Bubble Sort",selection:"Selection Sort",insertion:"Insertion Sort",merge:"Merge Sort",quick:"Quick Sort"};
    const algoDescs:Record<string,{body:string,tip:string}>={ 
      bubble:{body:"Bubble Sort repeatedly compares adjacent elements and swaps them if they're in the wrong order. Each pass 'bubbles' the largest unsorted element to its final position.",tip:"Bubble Sort is O(n²) average/worst but O(n) best case (already sorted). It's adaptive and stable but rarely used in practice."},
      selection:{body:"Selection Sort divides the array into sorted and unsorted parts. It repeatedly finds the minimum element from the unsorted part and moves it to the sorted section.",tip:"Always O(n²) regardless of input. Makes minimal swap operations — useful when writes are expensive."},
      insertion:{body:"Insertion Sort builds the sorted array one element at a time. It takes each element and inserts it into its correct position among the previously sorted elements.",tip:"Excellent on nearly-sorted data (O(n)). Used in practice for small arrays — even within Timsort (Python/Java's built-in sort)."},
      merge:{body:"Merge Sort divides the array in half recursively, sorts each half, then merges them. It's a divide-and-conquer algorithm guaranteed O(n log n) in all cases.",tip:"Stable sort, always O(n log n), but requires O(n) extra space. Commonly used in external sorting (sorting data too large for memory)."},
      quick:{body:"Quick Sort picks a 'pivot' element, partitions the array so elements less than pivot go left and greater go right, then recursively sorts both partitions.",tip:"Fastest in practice — O(n log n) average. Worst case O(n²) on already sorted input. Used in C's qsort and many standard libraries."},
    };
    const desc=algoDescs[algo]||algoDescs.bubble;

    await guide.showGuide({
      title:"Sorting Algorithms Overview",
      body:"Sorting algorithms arrange elements in order. They differ in time complexity, space usage, stability (preserving order of equal elements), and adaptiveness (performance on nearly-sorted input).",
      tip:"In interviews, know when to use each: Merge Sort for stability guarantees, Quick Sort for average-case speed, Insertion Sort for small/nearly-sorted data."
    }, 1, 4);

    if(!guide.isSkipped()) await guide.showGuide({
      title:`How ${algoNames[algo]} Works`,
      body:desc.body,
      tip:desc.tip
    }, 2, 4);

    const examples:Record<string,number[]>={
      bubble:[72,14,55,27,88,43,61,9,36,79,24,52],
      selection:[64,25,12,22,11,90,47,38,56,73,8,44],
      insertion:[5,2,4,6,1,3,8,7,9,12,10,11],
      merge:[38,27,43,3,9,82,10,15,74,50,36,92],
      quick:[10,80,30,90,40,50,70,20,60,35,85,15],
    };
    const preset=examples[algo]||examples.bubble;
    setBars(preset.map((val,i)=>({id:`ex-${i}`,val,state:"idle"})));
    statsRef.current={comps:0,swaps:0};
    setStats({comps:0,swaps:0});

    if(!guide.isSkipped()) await guide.showGuide({
      title:"Example Array Loaded!",
      body:`A pre-set array is loaded for ${algoNames[algo]}. Press ▶ Run to watch the algorithm sort it step-by-step. Observe the compare (yellow), swap (orange), and sorted (green) highlights.`,
      tip:"Watch the comparison and swap counters at the bottom — they show the real cost of the algorithm."
    }, 3, 4);
    if(!guide.isSkipped()) await guide.showGuide({
      title:"Complexity: "+algoNames[algo],
      body:{
        bubble:"Time: O(n²) avg/worst, O(n) best (already sorted). Space: O(1) in-place. Stable sort — equal elements keep their relative order.",
        selection:"Time: O(n²) always — always scans the rest of the array regardless of input. Space: O(1). Unstable sort.",
        insertion:"Time: O(n²) avg/worst, O(n) best (nearly sorted). Space: O(1). Stable. Excellent for small or nearly-sorted arrays.",
        merge:"Time: O(n log n) always. Space: O(n) — needs auxiliary array. Stable. Preferred when stability matters.",
        quick:"Time: O(n log n) avg, O(n²) worst (bad pivot). Space: O(log n) stack. Unstable. Fastest in practice due to cache efficiency.",
      }[algo]||"O(n²)",
      tip:{
        bubble:"Never use bubble sort in production. Its O(n²) is always beaten by insertion sort for practical inputs.",
        selection:"Selection sort has O(n) swaps — useful when writes are expensive (flash memory). Otherwise, avoid it.",
        insertion:"Java uses insertion sort for arrays < 47 elements (in Arrays.sort). It's fast on nearly-sorted data!",
        merge:"JavaScript's Array.sort() in V8 uses Timsort — a hybrid of merge sort and insertion sort.",
        quick:"Quick sort is fastest in practice due to CPU cache locality and small constant factors vs merge sort.",
      }[algo]||""
    }, 4, 4);

    setLabel(`⚡ Example loaded — press ▶ Run to sort`);
    anim.setRunning(false);
  };

  const updateBars=(b:{id:string,val:number,state:string}[],label?:string,t="info")=>{
    setBars([...b]);
    if(label){setLabel(label);addLog(label,t);}
    setStats({...statsRef.current});
  };

  const cmp=(b:any[],i:number,j:number)=>{statsRef.current.comps++;b[i].state="compare";b[j].state="compare";};
  const swp=(b:any[],i:number,j:number)=>{statsRef.current.swaps++;[b[i],b[j]]=[b[j],b[i]];b[i].state="swap";b[j].state="swap";};

  const run=async()=>{
    anim.start();statsRef.current={comps:0,swaps:0};
    const b=bars.map(x=>({...x,state:"idle"}));
    const tick=async(b2:any[],msg:string,t="info")=>{
      if(anim.stopRef.current)throw new Error("stopped");
      updateBars(b2,msg,t);await anim.sleep(speed);
    };
    try{
      if(algo==="bubble")await bubbleSort(b,tick);
      else if(algo==="selection")await selectionSort(b,tick);
      else if(algo==="insertion")await insertionSort(b,tick);
      else if(algo==="merge")await mergeSort(b,tick,0,b.length-1);
      else if(algo==="quick")await quickSort(b,tick,0,b.length-1);
      b.forEach(x=>x.state="sorted");updateBars(b,"✓ Sorted!","ok");
    }catch(e:any){if(e.message!=="stopped")throw e;}
    anim.setRunning(false);
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
              value={algo} onChange={(v)=>{if(!anim.running)setAlgo(v)}} disabled={anim.running}
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
        <Controls anim={anim} run={run} reset={reset} />
        <Btn onClick={runExample} variant="yellow" disabled={anim.running} full>⚡ Learn Sorting</Btn>
        <div><SLabel>Speed</SLabel><div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {Object.entries(stateColor).map(([s,c])=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.muted}}>
              <div style={{width:10,height:10,borderRadius:3,background:c}}/>{s}
            </div>
          ))}
        </div>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden",position:"relative"}}>
        <guide.Overlay/>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",padding:"20px 12px 0",gap:3,minHeight:0,overflow:"hidden"}}>
          {bars.map((bar) => {
            const col = stateColor[bar.state] || T.blue;
            const hPct = Math.max(4, Math.floor((bar.val / maxVal) * 100));
            return (
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                key={bar.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 3,
                }}
              >
                <div style={{
                  fontSize: 9,
                  color: col,
                  fontFamily: "'Space Mono',monospace",
                  opacity: bar.state !== "idle" ? 1 : 0.5,
                  lineHeight: 1,
                }}>
                  {bar.val}
                </div>
                <motion.div
                  layout
                  style={{
                    width: "100%",
                    height: `${hPct}%`,
                    borderRadius: "4px 4px 0 0",
                    background: `linear-gradient(to top, ${col}cc, ${col}88)`,
                    border: `1px solid ${col}66`,
                    boxShadow: bar.state !== "idle" ? `0 0 10px ${col}88` : "none",
                    transform: bar.state === "swap" || bar.state === "compare"
                      ? "translateY(-4px)" : "none",
                    transition: "height 0.15s ease",
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── Overlaid stat bar (reference design style) ── */}
        <div className="dsa-stat-overlay">
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
          <span style={{color:T.accent,flexShrink:0}}>⚖ {stats.comps}</span>
          <span style={{color:T.yellow,flexShrink:0}}>↕ {stats.swaps}</span>
          <span style={{color:T.muted,flexShrink:0}}>n={bars.length}</span>
        </div>
      </div>
    </div>
  );
}
