import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, SpeedRow, Log, Input, Select, Badge, useStepGuide } from "../shared";

export default function DPViz(){
  const [dpType,setDpType]=useState("fib");
  const [n,setN]=useState("8");
  const [s1,setS1]=useState("ABCBDAB");
  const [s2,setS2]=useState("BDCABA");
  const [weights,setWeights]=useState("2 3 4 5");
  const [values,setValues]=useState("3 4 5 6");
  const [capacity,setCapacity]=useState("5");
  const [steps,setSteps]=useState<any[]>([]);
  const [stepIdx,setStepIdx]=useState(-1);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);

  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);
  const guide = useStepGuide();

  const buildFib=()=>{
    const N=Math.min(parseInt(n)||8,14);const dp=new Array(N+1).fill(0);
    const ss:any[]=[{dp:[...dp],hi:[0,1],desc:`Initialize dp[0]=0, dp[1]=1 (base cases)`}];
    dp[0]=0;dp[1]=1;
    for(let i=2;i<=N;i++){dp[i]=dp[i-1]+dp[i-2];ss.push({dp:[...dp],hi:[i],using:[i-1,i-2],desc:`dp[${i}] = dp[${i-1}](${dp[i-1]}) + dp[${i-2}](${dp[i-2]}) = ${dp[i]}`});}
    ss.push({dp:[...dp],hi:[N],done:true,desc:`fib(${N}) = ${dp[N]} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`Built Fibonacci DP for n=${N}`,t:"info"}]);
  };

  const buildLCS=()=>{
    const a=s1.toUpperCase(),b=s2.toUpperCase();const m=a.length,nn=b.length;
    const dp=Array.from({length:m+1},()=>new Array(nn+1).fill(0));
    const ss:any[]=[{dp:dp.map(r=>[...r]),hi:null,desc:"Initialize: dp[0][j]=0 and dp[i][0]=0"}];
    for(let i=1;i<=m;i++){
      for(let j=1;j<=nn;j++){
        if(a[i-1]===b[j-1]){dp[i][j]=dp[i-1][j-1]+1;ss.push({dp:dp.map(r=>[...r]),hi:[i,j],match:true,desc:`Match '${a[i-1]}'='${b[j-1]}' → dp[${i}][${j}]=${dp[i][j]}`});}
        else{dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);ss.push({dp:dp.map(r=>[...r]),hi:[i,j],match:false,desc:`No match '${a[i-1]}'≠'${b[j-1]}' → max(${dp[i-1][j]},${dp[i][j-1]})=${dp[i][j]}`});}
      }
    }
    ss.push({dp:dp.map(r=>[...r]),hi:[m,nn],done:true,desc:`LCS length = ${dp[m][nn]} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`LCS("${a}","${b}") — ${ss.length} steps`,t:"info"}]);
  };

  const buildKnapsack=()=>{
    const W2=weights.trim().split(/\s+/).map(Number);const V=values.trim().split(/\s+/).map(Number);
    const C=parseInt(capacity)||5;const n2=Math.min(W2.length,V.length,6);
    const dp=Array.from({length:n2+1},()=>new Array(C+1).fill(0));
    const ss:any[]=[{dp:dp.map(r=>[...r]),hi:null,desc:"Initialize dp[0][*]=0 — no items"}];
    for(let i=1;i<=n2;i++){
      for(let w=0;w<=C;w++){
        if(W2[i-1]>w){dp[i][w]=dp[i-1][w];ss.push({dp:dp.map(r=>[...r]),hi:[i,w],skip:true,desc:`Item ${i}(w=${W2[i-1]}) > capacity ${w} → skip`});}
        else{const take=dp[i-1][w-W2[i-1]]+V[i-1],skip=dp[i-1][w];dp[i][w]=Math.max(take,skip);ss.push({dp:dp.map(r=>[...r]),hi:[i,w],take:take>skip,desc:`Item ${i}: take=${take} vs skip=${skip} → ${dp[i][w]}`});}
      }
    }
    ss.push({dp:dp.map(r=>[...r]),hi:[n2,C],done:true,desc:`Max value = ${dp[n2][C]} for capacity ${C} ✓`});
    setSteps(ss);setStepIdx(0);setLog([{m:`Knapsack — ${ss.length} steps`,t:"info"}]);
  };

  const build=()=>{if(dpType==="fib")buildFib();else if(dpType==="lcs")buildLCS();else buildKnapsack();};
  const step=steps[stepIdx];

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div>
          <SLabel>Problem</SLabel>
          <div style={{marginTop:6}}>
            <Select
              value={dpType} onChange={(v)=>{setDpType(v);setSteps([]);setStepIdx(-1)}}
              options={[
                ["fib","Fibonacci (1D DP)"],
                ["lcs","LCS — Longest Common Subseq."],
                ["knapsack","0/1 Knapsack"]
              ]}
            />
          </div>
        </div>
        {dpType==="fib"&&<div><SLabel>n</SLabel><div style={{marginTop:6}}><Input value={n} onChange={setN} placeholder="8" mono/></div></div>}
        {dpType==="lcs"&&<><div><SLabel>String 1</SLabel><div style={{marginTop:5}}><Input value={s1} onChange={setS1} placeholder="ABCBDAB" mono/></div></div><div><SLabel>String 2</SLabel><div style={{marginTop:5}}><Input value={s2} onChange={setS2} placeholder="BDCABA" mono/></div></div></>}
        {dpType==="knapsack"&&<><div><SLabel>Weights</SLabel><div style={{marginTop:5}}><Input value={weights} onChange={setWeights} placeholder="2 3 4 5" mono/></div></div><div><SLabel>Values</SLabel><div style={{marginTop:5}}><Input value={values} onChange={setValues} placeholder="3 4 5 6" mono/></div></div><div><SLabel>Capacity</SLabel><div style={{marginTop:5}}><Input value={capacity} onChange={setCapacity} placeholder="5" mono/></div></div></>}
        <Btn onClick={build} variant="primary" full>⚙ Build DP Table</Btn>
        <Btn onClick={async()=>{
          guide.resetGuide();
          const dpNames:Record<string,string>={fib:"Fibonacci",lcs:"Longest Common Subsequence",knapsack:"0/1 Knapsack"};
          const dpDescs:Record<string,{body:string,tip:string}>={
            fib:{body:"Fibonacci with DP: instead of recomputing fib(n-1) + fib(n-2) recursively (O(2ⁿ)), we store intermediate results in a table. Each value is computed only ONCE.",tip:"Naive recursion: O(2ⁿ). With DP (bottom-up): O(n) time, O(n) space. This shows the power of memoization!"},
            lcs:{body:"LCS finds the longest subsequence common to two strings. We build a 2D table: dp[i][j] = LCS length of first i chars of s1 and j chars of s2. If chars match, dp[i][j] = dp[i-1][j-1]+1.",tip:"Time: O(mn), Space: O(mn). Used in diff tools, Git, DNA sequence alignment, and spell checkers."},
            knapsack:{body:"Given items with weights and values and a capacity, find the maximum value subset. dp[i][w] = max value using first i items with capacity w.",tip:"Time: O(n×W), Space: O(n×W). Classic interview problem. Can be optimized to O(W) space with a 1D array."},
          };
          const desc=dpDescs[dpType];
          await guide.showGuide({
            title:"Dynamic Programming",
            body:"DP solves problems by breaking them into overlapping subproblems and storing results to avoid redundant computation. Two approaches: top-down (memoization) and bottom-up (tabulation).",
            tip:"Key criteria for DP: 1) Overlapping subproblems, 2) Optimal substructure. If both exist, DP can dramatically reduce time complexity."
          }, 1, 2);
          if(!guide.isSkipped()) await guide.showGuide({
            title:`${dpNames[dpType]} Problem`,
            body:desc.body,
            tip:desc.tip
          }, 2, 2);
          if(dpType==="fib"){setN("10");setTimeout(()=>{setDpType("fib");build();},50);}
          else if(dpType==="lcs"){setS1("AGGTAB");setS2("GXTXAYB");setTimeout(build,50);}
          else{setWeights("1 3 4 5");setValues("1 4 5 7");setCapacity("7");setTimeout(build,50);}
        }} variant="yellow" full>⚡ Learn DP</Btn>

        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12,padding:"20px 24px",position:"relative"}}>
          <guide.Overlay/>
          <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
            {!step&&<div style={{color:T.muted,fontSize:13,paddingTop:60}}>Configure and click Build DP Table</div>}
            {step&&dpType==="fib"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
                <div style={{fontSize:12,color:T.muted}}>dp[i] = dp[i-1] + dp[i-2]</div>
                <div style={{display:"flex",gap:0}}>
                  {step.dp.map((v:number,i:number)=>{
                    const isHi=step.hi?.includes(i),isUsing=step.using?.includes(i);
                    return(
                      <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{width:48,height:48,borderTop:`2px solid ${isHi?T.yellow:isUsing?T.accent:T.surface3}`,borderBottom:`2px solid ${isHi?T.yellow:isUsing?T.accent:T.surface3}`,borderLeft:`1px solid ${T.surface3}`,borderRight:`1px solid ${T.surface3}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:14,background:isHi?T.yellowSoft:isUsing?T.accentSoft:T.surface2,color:isHi?T.yellow:isUsing?T.accent:T.muted2,transition:"all .25s",boxShadow:isHi?`0 0 14px ${T.yellow}66`:"none"}}>{v}</div>
                        <div style={{fontSize:10,color:T.muted,fontFamily:"'Space Mono',monospace"}}>[{i}]</div>
                      </div>
                    );
                  })}
                </div>
                {step.done&&<Badge color={T.green}>fib({n}) = {step.dp[step.dp.length-1]}</Badge>}
              </div>
            )}
            {step&&dpType==="lcs"&&(()=>{
              const a=s1.toUpperCase(),b=s2.toUpperCase();const cellSize=42;
              return(
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}>
                    <thead><tr>
                      <td style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted}}>DP</td>
                      <td style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted}}>{`""`}</td>
                      {b.split("").map((c,j)=><td key={j} style={{width:cellSize,height:cellSize,textAlign:"center",color:T.blue,fontWeight:700}}>{c}</td>)}
                    </tr></thead>
                    <tbody>
                      {step.dp.map((row:number[],i:number)=>(
                        <tr key={i}>
                          <td style={{textAlign:"center",color:i===0?T.muted:T.green,fontWeight:700,paddingRight:4}}>{i===0?`""`:`${a[i-1]}`}</td>
                          {row.map((v:number,j:number)=>{
                            const isHi=step.hi&&step.hi[0]===i&&step.hi[1]===j;
                            return(<td key={j} style={{width:cellSize,height:cellSize,textAlign:"center",fontWeight:700,background:isHi?(step.match?T.greenSoft:T.yellowSoft):T.surface2,border:`1px solid ${isHi?(step.match?T.green:T.yellow):T.surface3}`,color:isHi?(step.match?T.green:T.yellow):v>0?T.accent:T.muted,transition:"all .2s",fontSize:13}}>{v}</td>);
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {step.done&&<div style={{marginTop:14,textAlign:"center"}}><Badge color={T.green}>LCS Length = {step.dp[step.dp.length-1][step.dp[0].length-1]}</Badge></div>}
                </div>
              );
            })()}
            {step&&dpType==="knapsack"&&(()=>{
              const W2=weights.trim().split(/\s+/).map(Number);const V=values.trim().split(/\s+/).map(Number);const C=parseInt(capacity)||5;const cellSize=44;
              return(
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}>
                    <thead><tr>
                      <td style={{width:52,textAlign:"center",color:T.muted,padding:"0 4px"}}>Item\W</td>
                      {Array.from({length:C+1},(_,w)=><td key={w} style={{width:cellSize,height:cellSize,textAlign:"center",color:T.muted,fontWeight:700}}>{w}</td>)}
                    </tr></thead>
                    <tbody>
                      {step.dp.map((row:number[],i:number)=>(
                        <tr key={i}>
                          <td style={{textAlign:"center",color:T.orange,fontWeight:700,fontSize:10,padding:"0 4px"}}>{i===0?"—":`i${i}\n(w${W2[i-1]},v${V[i-1]})`}</td>
                          {row.map((v:number,j:number)=>{
                            const isHi=step.hi&&step.hi[0]===i&&step.hi[1]===j;const isTake=isHi&&step.take;const isSkip=isHi&&step.skip;
                            return(<td key={j} style={{width:cellSize,height:cellSize,textAlign:"center",fontWeight:700,fontSize:13,background:isTake?T.greenSoft:isSkip?T.redSoft:isHi?T.yellowSoft:T.surface2,border:`1px solid ${isTake?T.green:isSkip?T.red:isHi?T.yellow:T.surface3}`,color:isTake?T.green:isSkip?T.red:isHi?T.yellow:v>0?T.accent:T.muted,transition:"all .2s"}}>{v}</td>);
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
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,fontSize:12,color:T.muted2}}>{step?.desc||"–"}</div>
          <Btn onClick={()=>setStepIdx(i=>Math.max(0,i-1))} disabled={stepIdx<=0||!step}>← Back</Btn>
          <span style={{fontSize:11,color:T.muted,fontFamily:"'Space Mono',monospace"}}>{step?`${stepIdx+1}/${steps.length}`:"-"}</span>
          <Btn onClick={()=>{if(stepIdx<steps.length-1){setStepIdx(i=>i+1);addLog(steps[stepIdx+1]?.desc||"")}}} variant="primary" disabled={stepIdx>=steps.length-1||!step}>Next →</Btn>
        </div>
      </div>
    </div>
  );
}
