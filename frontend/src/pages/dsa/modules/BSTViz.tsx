import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input } from "../shared";

type N={val:number,left:N|null,right:N|null};
function ins(root:N|null,v:number):N{if(!root)return{val:v,left:null,right:null};if(v<root.val)root.left=ins(root.left,v);else if(v>root.val)root.right=ins(root.right,v);return root;}
function srch(root:N|null,v:number):boolean{if(!root)return false;if(v===root.val)return true;return v<root.val?srch(root.left,v):srch(root.right,v);}
function minV(root:N):number{return root.left?minV(root.left):root.val;}
function del(root:N|null,v:number):N|null{if(!root)return null;if(v<root.val){root.left=del(root.left,v);return root;}if(v>root.val){root.right=del(root.right,v);return root;}if(!root.left)return root.right;if(!root.right)return root.left;root.val=minV(root.right);root.right=del(root.right,root.val);return root;}
function toArr(root:N|null,x:number,y:number,dx:number,arr:{val:number,x:number,y:number,px?:number,py?:number}[],px?:number,py?:number){if(!root)return;arr.push({val:root.val,x,y,px,py});toArr(root.left,x-dx,y+60,dx/2,arr,x,y);toArr(root.right,x+dx,y+60,dx/2,arr,x,y);}

export default function BSTViz(){
  const [root,setRoot]=useState<N|null>(null);
  const [val,setVal]=useState("");
  const [highlighted,setHighlighted]=useState<number|null>(null);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert values to build the BST");
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const insert=()=>{const v=parseInt(val);if(isNaN(v))return;setVal("");setRoot(r=>ins(r?JSON.parse(JSON.stringify(r)):null,v));setHighlighted(v);addLog(`insert(${v})`,"ok");setLabel(`<strong>insert(${v})</strong>`);setTimeout(()=>setHighlighted(null),800);};
  const search=()=>{const v=parseInt(val);if(isNaN(v))return;const found=srch(root,v);setHighlighted(v);addLog(`search(${v}) → ${found?"found":"not found"}`,found?"ok":"err");setLabel(`<strong>search(${v})</strong> → ${found?"✓ found":"✗ not found"}`);setTimeout(()=>setHighlighted(null),800);};
  const remove=()=>{const v=parseInt(val);if(isNaN(v))return;setVal("");setRoot(r=>del(r?JSON.parse(JSON.stringify(r)):null,v));addLog(`delete(${v})`,"warn");setLabel(`<strong>delete(${v})</strong>`);};
  const loadExample=()=>{let r:N|null=null;[50,30,70,20,40,60,80].forEach(v=>{r=ins(r,v);});setRoot(r);addLog("Loaded example BST","info");};

  const nodes:{val:number,x:number,y:number,px?:number,py?:number}[]=[];
  toArr(root,300,30,140,nodes);

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <Side>
        <div><SLabel>Value</SLabel><div style={{marginTop:6}}><Input value={val} onChange={setVal} placeholder="e.g. 50" onEnter={insert} mono/></div></div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
        <Btn onClick={search} variant="teal" full>🔍 Search</Btn>
        <Btn onClick={remove} variant="red" full>⊖ Delete</Btn>
        <Btn onClick={loadExample} variant="ghost" full>⚡ Load Example</Btn>
        <Btn onClick={()=>{setRoot(null);addLog("reset","info")}} variant="ghost" full>↺ Reset</Btn>
        <InfoBox>
          <strong style={{color:T.text}}>Binary Search Tree</strong><br/><br/>
          Left subtree &lt; root &lt; right subtree. In-order traversal gives sorted order.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert (avg)" val="O(log n)" color={T.green}/><CRow op="Search (avg)" val="O(log n)" color={T.green}/>
            <CRow op="Delete (avg)" val="O(log n)" color={T.green}/><CRow op="Worst (skewed)" val="O(n)" color={T.red}/>
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"auto"}}>
          {!root?<div style={{color:T.muted,fontSize:13,paddingTop:60}}>BST is empty — insert values</div>:(
            <svg width="600" height="360" viewBox="0 0 600 360" style={{overflow:"visible"}}>
              {nodes.map((n,i)=>n.px!==undefined&&n.py!==undefined?<line key={`e${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke={T.surface3} strokeWidth={1.5}/>:null)}
              {nodes.map((n,i)=>{
                const isHL=n.val===highlighted;const col=isHL?T.yellow:T.blue;
                return(<g key={`n${i}`}><circle cx={n.x} cy={n.y} r={20} fill={isHL?T.yellowSoft:T.surface2} stroke={col} strokeWidth={isHL?3:1.8} style={isHL?{filter:`drop-shadow(0 0 10px ${T.yellow})`}:{}}/><text x={n.x} y={n.y+5} textAnchor="middle" fill={isHL?"#fff":col} fontSize="12" fontFamily="Space Mono" fontWeight="700">{n.val}</text></g>);
              })}
            </svg>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
      </div>
    </div>
  );
}
