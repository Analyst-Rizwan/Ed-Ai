import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Input, Select } from "../shared";

export default function TwoPointerViz(){
  const [mode,setMode]=useState("twosum");
  const [arrInput,setArrInput]=useState("1 3 5 7 9 11 14 17 20");
  const [targetInput,setTargetInput]=useState("18");
  const [windowK,setWindowK]=useState("3");
  const [steps,setSteps]=useState<any[]>([]);
  const [stepIdx,setStepIdx]=useState(-1);

  const buildTwoSum=()=>{
    const arr=arrInput.trim().split(/\s+/).map(Number).sort((a,b)=>a-b);
    const target=parseInt(targetInput)||18;
    const ss:any[]=[{arr,l:0,r:arr.length-1,found:null,desc:`Start: l=0(${arr[0]}), r=${arr.length-1}(${arr[arr.length-1]}), target=${target}`}];
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
    const arr=arrInput.trim().split(/\s+/).map(Number);const k=parseInt(windowK)||3;
    const initSum=arr.slice(0,k).reduce((a,b)=>a+b,0);
    const ss:any[]=[{arr,l:0,r:k-1,sum:initSum,maxSum:initSum,maxL:0,desc:`Init window [0..${k-1}], sum=${initSum}`}];
    let maxSum=initSum,maxL=0;
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
          <div style={{marginTop:6}}>
            <Select
              value={mode} onChange={(v)=>{setMode(v);setSteps([]);setStepIdx(-1)}}
              options={[
                ["twosum","Two Pointer — Two Sum"],
                ["sliding","Sliding Window — Max Sum"]
              ]}
            />
          </div>
        </div>
        <div><SLabel>Array (space-separated)</SLabel><div style={{marginTop:6}}><Input value={arrInput} onChange={setArrInput} placeholder="1 3 5 7 9..." mono/></div></div>
        {mode==="twosum"&&<div><SLabel>Target Sum</SLabel><div style={{marginTop:6}}><Input value={targetInput} onChange={setTargetInput} placeholder="18" mono/></div></div>}
        {mode==="sliding"&&<div><SLabel>Window Size k</SLabel><div style={{marginTop:6}}><Input value={windowK} onChange={setWindowK} placeholder="3" mono/></div></div>}
        <Btn onClick={build} variant="primary" full>⚙ Build Steps</Btn>
        <InfoBox>
          {mode==="twosum"&&<><strong style={{color:T.text}}>Two Pointers</strong><br/><br/>Works on sorted arrays. Start from both ends, move inward. O(n) vs O(n²) brute force.</>}
          {mode==="sliding"&&<><strong style={{color:T.text}}>Sliding Window</strong><br/><br/>Maintain a fixed window, slide right. Add new, remove oldest. O(n) instead of O(nk).</>}
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
              <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
                {step.arr.map((v:number,i:number)=>{
                  const isL=i===step.l,isR=i===step.r;
                  const inWindow=i>=step.l&&i<=step.r;
                  const isFound=step.found&&(i===step.found[0]||i===step.found[1]);
                  const isMaxWin=step.maxL!==undefined&&i>=step.maxL&&i<step.maxL+(parseInt(windowK)||3)&&step.done;
                  return(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {mode==="twosum"&&<div style={{fontSize:10,color:isL?T.accent:isR?T.green:"transparent",fontWeight:700}}>{isL?"L":isR?"R":"."}</div>}
                      <div style={{width:46,height:46,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700,background:isFound?T.greenSoft:isMaxWin?T.yellowSoft:inWindow&&mode==="sliding"?T.accentSoft:T.surface2,border:`2px solid ${isFound?T.green:isL||isR||isMaxWin?T.yellow:inWindow&&mode==="sliding"?T.accent:T.border2}`,color:isFound?T.green:isL?T.accent:isR?T.green:inWindow&&mode==="sliding"?T.accent:T.muted2,boxShadow:isFound?`0 0 14px ${T.green}66`:isL||isR?`0 0 10px ${T.yellow}55`:"none",transition:"all .25s"}}>{v}</div>
                      <div style={{fontSize:9,color:T.muted,fontFamily:"'Space Mono',monospace"}}>[{i}]</div>
                    </div>
                  );
                })}
              </div>
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
