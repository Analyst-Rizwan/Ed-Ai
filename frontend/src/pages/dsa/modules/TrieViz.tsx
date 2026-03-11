import { useState } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, InfoBox, CRow, Log, Input, Badge } from "../shared";

type TN={children:Record<string,TN>,end:boolean};
function newNode():TN{return{children:{},end:false};}
function tiInsert(root:TN,word:string){let n=root;for(const c of word){if(!n.children[c])n.children[c]=newNode();n=n.children[c];}n.end=true;}
function tiSearch(root:TN,word:string):boolean{let n=root;for(const c of word){if(!n.children[c])return false;n=n.children[c];}return n.end;}
function tiAuto(root:TN,prefix:string):string[]{let n=root;for(const c of prefix){if(!n.children[c])return[];n=n.children[c];}const r:string[]=[];function dfs(node:TN,path:string){if(node.end)r.push(path);for(const[c,child] of Object.entries(node.children)){if(r.length<10)dfs(child,path+c);}}dfs(n,prefix);return r;}
function tiToTree(node:TN,ch:string,x:number,y:number,dx:number,arr:{ch:string,x:number,y:number,end:boolean,px?:number,py?:number}[],px?:number,py?:number){arr.push({ch,x,y,end:node.end,px,py});const keys=Object.keys(node.children);const startX=x-dx*(keys.length-1)/2;keys.forEach((k,i)=>tiToTree(node.children[k],k,startX+i*dx,y+55,Math.max(dx/2,30),arr,x,y));}

export default function TrieViz(){
  const [trie]=useState<TN>(()=>newNode());
  const [word,setWord]=useState("");
  const [results,setResults]=useState<string[]>([]);
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [label,setLabel]=useState("Insert words to build the trie");
  const [ver,setVer]=useState(0);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-25),{m,t}]);

  const insert=()=>{if(!word.trim())return;const w=word.trim().toLowerCase();setWord("");tiInsert(trie,w);setVer(v=>v+1);addLog(`insert("${w}")`,"ok");setLabel(`<strong>insert("${w}")</strong>`);};
  const search=()=>{if(!word.trim())return;const w=word.trim().toLowerCase();const found=tiSearch(trie,w);addLog(`search("${w}") → ${found?"found":"not found"}`,found?"ok":"err");setLabel(`<strong>search("${w}")</strong> → ${found?"✓ found":"✗ not found"}`);};
  const autocomplete=()=>{if(!word.trim())return;const w=word.trim().toLowerCase();const r=tiAuto(trie,w);setResults(r);addLog(`autocomplete("${w}") → ${r.length} results`,"info");setLabel(`<strong>autocomplete("${w}")</strong> → [${r.join(", ")}]`);};
  const loadWords=()=>{["apple","app","application","apply","apt","banana","band","ban","bat","bath"].forEach(w=>tiInsert(trie,w));setVer(v=>v+1);addLog("Loaded example words","info");};

  const nodes:{ch:string,x:number,y:number,end:boolean,px?:number,py?:number}[]=[];
  tiToTree(trie,"root",300,25,80,nodes);

  return(
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Word</SLabel><div style={{marginTop:6}}><Input value={word} onChange={setWord} placeholder={`e.g. "apple"`} onEnter={insert} mono/></div></div>
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
          Each edge is a character. Shared prefixes share nodes. Used for autocomplete, spell check.
          <div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
            <CRow op="Insert" val="O(m)" color={T.green}/><CRow op="Search" val="O(m)" color={T.green}/>
            <CRow op="Autocomplete" val="O(m+k)" color={T.yellow}/><CRow op="Space" val="O(ALPHABET·m·n)" color={T.orange}/>
          </div>
          <div style={{marginTop:6,fontSize:10,color:T.muted}}>m = word length, k = results count</div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",overflow:"auto",padding:16}}>
          {nodes.length<=1?<div style={{color:T.muted,fontSize:13,paddingTop:60}}>Trie is empty — insert words</div>:(
            <svg width="600" height="400" viewBox="0 0 600 400" style={{overflow:"visible"}} key={ver}>
              {nodes.map((n,i)=>n.px!==undefined&&n.py!==undefined?<line key={`e${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y} stroke={T.surface3} strokeWidth={1.5}/>:null)}
              {nodes.map((n,i)=>{
                const col=n.end?T.green:n.ch==="root"?T.accent:T.blue;
                return(<g key={`n${i}`}><circle cx={n.x} cy={n.y} r={16} fill={n.end?T.greenSoft:T.surface2} stroke={col} strokeWidth={n.end?2.5:1.5}/><text x={n.x} y={n.y+4} textAnchor="middle" fill={col} fontSize="11" fontFamily="Space Mono" fontWeight="700">{n.ch==="root"?"⊙":n.ch}</text></g>);
              })}
            </svg>
          )}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.surface,fontSize:12,color:T.muted2}} dangerouslySetInnerHTML={{__html:label}}/>
      </div>
    </div>
  );
}
