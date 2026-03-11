import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, InfoBox, CRow, Log, Badge } from "../shared";

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

export default function GraphViz(){
  const [algo,setAlgo]=useState("bfs");
  const [start,setStart]=useState("A");
  const [visited,setVisited]=useState(new Set<string>());
  const [active,setActive]=useState<string|null>(null);
  const [edgeState,setEdgeState]=useState<Record<string,string>>({});
  const [queue,setQueue]=useState<string[]>([]);
  const [dist,setDist]=useState<Record<string,number>>({});
  const [log,setLog]=useState<{m:string,t:string}[]>([]);
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(500);
  const [label,setLabel]=useState("Select algorithm and press Run");
  const stopRef=useRef(false);
  const addLog=(m:string,t="info")=>setLog(l=>[...l.slice(-30),{m,t}]);

  const reset=()=>{
    stopRef.current=true;
    setVisited(new Set());setActive(null);setEdgeState({});
    setQueue([]);setDist({});setRunning(false);setLabel("Press Run to start");
  };

  const run=async()=>{
    stopRef.current=false;reset();await sleep(100);setRunning(true);
    const adj:Record<string,{node:string,w:number}[]>={};
    GRAPH_PRESET.nodes.forEach(n=>{adj[n.id]=[];});
    GRAPH_PRESET.edges.forEach(({u,v,w})=>{adj[u].push({node:v,w});adj[v].push({node:u,w});});
    const tick=async(vis:Set<string>,act:string|null,es:Record<string,string>,q:string[],msg:string,d:Record<string,number>={})=>{
      if(stopRef.current)throw new Error("stopped");
      setVisited(new Set(vis));setActive(act);setEdgeState({...es});setQueue([...q]);setDist({...d});
      setLabel(msg);addLog(msg,"info");await sleep(speed);
    };
    try{
      if(algo==="bfs")await runBFS(adj,tick);
      else if(algo==="dfs")await runDFS(adj,tick);
      else await runDijkstra(adj,tick);
    }catch(e:any){if(e.message!=="stopped")throw e;}
    setRunning(false);addLog("✓ Done","ok");setActive(null);
  };

  async function runBFS(adj:any,tick:any){
    const vis=new Set([start]),q=[start],es:Record<string,string>={};
    while(q.length){
      const cur=q.shift()!;await tick(vis,cur,es,[...q],`Visit ${cur} — queue: [${q.join(", ")}]`);
      for(const {node:nb} of (adj[cur]||[])){
        if(!vis.has(nb)){vis.add(nb);q.push(nb);es[`${cur}-${nb}`]="tree";es[`${nb}-${cur}`]="tree";await tick(vis,cur,es,[...q],`Discover ${nb} from ${cur}`,"ok");}
      }
    }
    await tick(vis,null,es,[],"BFS complete — all reachable nodes visited","ok");
  }
  async function runDFS(adj:any,tick:any){
    const vis=new Set<string>(),es:Record<string,string>={};
    async function dfs(node:string){
      if(stopRef.current)throw new Error("stopped");
      vis.add(node);await tick(vis,node,es,[],`Enter ${node}`);
      for(const {node:nb} of (adj[node]||[])){
        if(!vis.has(nb)){es[`${node}-${nb}`]="tree";es[`${nb}-${node}`]="tree";await tick(vis,node,es,[],`Recurse: ${node} → ${nb}`,"ok");await dfs(nb);await tick(vis,node,es,[],`Backtrack to ${node}`);}
      }
    }
    await dfs(start);await tick(vis,null,es,[],"DFS complete","ok");
  }
  async function runDijkstra(adj:any,tick:any){
    const INF=99999;const d:Record<string,number>={};
    GRAPH_PRESET.nodes.forEach(n=>{d[n.id]=INF;});d[start]=0;
    const pq:[number,string][]=[[0,start]];const vis=new Set<string>();const es:Record<string,string>={};
    while(pq.length){
      pq.sort((a,b)=>a[0]-b[0]);const [cost,u]=pq.shift()!;
      if(vis.has(u))continue;vis.add(u);await tick(vis,u,es,[],`Visit ${u}, dist=${cost}`,{...d});
      for(const {node:v,w} of (adj[u]||[])){
        if(!vis.has(v)&&d[u]+w<d[v]){d[v]=d[u]+w;es[`${u}-${v}`]="tree";pq.push([d[v],v]);await tick(vis,u,es,[],`Relax ${u}→${v}: dist=${d[v]}`,{...d});}
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
              <button key={k} onClick={()=>{if(!running)setAlgo(k)}} style={{padding:"7px 10px",borderRadius:9,fontSize:11,fontWeight:600,cursor:running?"not-allowed":"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",background:algo===k?T.accentSoft:T.surface2,border:`1px solid ${algo===k?T.accent+"66":T.border2}`,color:algo===k?T.accent:T.muted2,transition:"all .15s"}}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <SLabel>Start Node</SLabel>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
            {GRAPH_PRESET.nodes.map(n=>(
              <button key={n.id} onClick={()=>setStart(n.id)} style={{width:32,height:32,borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Mono',monospace",background:start===n.id?T.accentSoft:T.surface2,border:`1px solid ${start===n.id?T.accent:T.border2}`,color:start===n.id?T.accent:T.muted2}}>{n.id}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <Btn onClick={run} variant="primary" disabled={running} style={{flex:1}}>▶ Run</Btn>
          <Btn onClick={reset} variant="ghost" disabled={running} style={{flex:1}}>↺ Reset</Btn>
        </div>
        <div><SLabel>Speed</SLabel><div style={{marginTop:6}}><SpeedRow speed={speed} setSpeed={setSpeed}/></div></div>
        {algo==="dijkstra"&&Object.keys(dist).length>0&&(
          <div><SLabel>Distances from {start}</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:6}}>
              {GRAPH_PRESET.nodes.map(n=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:visited.has(n.id)?T.text:T.muted}}>{n.id}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",color:visited.has(n.id)?T.green:T.muted}}>{dist[n.id]===99999?"∞":dist[n.id]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {algo==="bfs"&&queue.length>0&&(
          <div><SLabel>Queue</SLabel><div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>{queue.map((n,i)=><Badge key={i} color={T.yellow}>{n}</Badge>)}</div></div>
        )}
        <InfoBox>
          {algo==="bfs"&&<><strong style={{color:T.text}}>BFS</strong> — explores level by level using a queue. Finds shortest path (unweighted).<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(V+E)" color={T.green}/><CRow op="Space" val="O(V)" color={T.orange}/><CRow op="Shortest path" val="✓ (unweighted)" color={T.teal}/></div></>}
          {algo==="dfs"&&<><strong style={{color:T.text}}>DFS</strong> — goes deep before backtracking using recursion/stack.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O(V+E)" color={T.green}/><CRow op="Space" val="O(V)" color={T.orange}/><CRow op="Shortest path" val="✗ No" color={T.red}/></div></>}
          {algo==="dijkstra"&&<><strong style={{color:T.text}}>Dijkstra</strong> — greedy shortest path with priority queue. Edges must be ≥ 0.<div style={{marginTop:8,borderTop:`1px solid ${T.border}`,paddingTop:8}}><CRow op="Time" val="O((V+E)log V)" color={T.yellow}/><CRow op="Negative edges" val="✗ No" color={T.red}/><CRow op="Shortest path" val="✓ (weighted)" color={T.green}/></div></>}
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log}/>
      </Side>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <svg width="100%" height="100%" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid meet">
            {GRAPH_PRESET.edges.map(({u,v,w})=>{
              const pu=nodePos[u],pv=nodePos[v];
              const key1=`${u}-${v}`,key2=`${v}-${u}`;
              const isTree=edgeState[key1]==="tree"||edgeState[key2]==="tree";
              const col=isTree?T.green:T.surface3;
              const mx=(pu.x+pv.x)/2,my=(pu.y+pv.y)/2;
              return(
                <g key={key1}>
                  <line x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y} stroke={col} strokeWidth={isTree?3:1.5} style={isTree?{filter:`drop-shadow(0 0 6px ${T.green})`}:{}}/>
                  {algo==="dijkstra"&&<text x={mx} y={my-5} textAnchor="middle" fill={isTree?T.yellow:T.muted} fontSize="11" fontFamily="Space Mono" fontWeight="700">{w}</text>}
                </g>
              );
            })}
            {GRAPH_PRESET.nodes.map(n=>{
              const isActive=n.id===active,isVisited=visited.has(n.id);
              const col=isActive?T.yellow:isVisited?T.green:T.blue;
              const d=dist[n.id];
              return(
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={24} fill={isActive?T.yellowSoft:isVisited?T.greenSoft:T.surface2} stroke={col} strokeWidth={isActive?3:isVisited?2.5:1.5} style={isActive?{filter:`drop-shadow(0 0 14px ${T.yellow})`}:isVisited?{filter:`drop-shadow(0 0 8px ${T.green})`}:{}}/>
                  <text x={n.x} y={n.y+5} textAnchor="middle" fill={isActive?"#fff":col} fontSize="14" fontFamily="Space Mono" fontWeight="700">{n.id}</text>
                  {algo==="dijkstra"&&d!==undefined&&d!==99999&&<text x={n.x} y={n.y-30} textAnchor="middle" fill={T.yellow} fontSize="10" fontFamily="Space Mono">{d}</text>}
                </g>
              );
            })}
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
