import { useState } from "react";
import { T, CSS } from "./dsa/theme";
import SortingViz    from "./dsa/modules/SortingViz";
import MergeViz      from "./dsa/modules/MergeViz";
import GraphViz      from "./dsa/modules/GraphViz";
import HeapViz       from "./dsa/modules/HeapViz";
import DPViz         from "./dsa/modules/DPViz";
import HashViz       from "./dsa/modules/HashViz";
import TwoPointerViz from "./dsa/modules/TwoPointerViz";
import StackViz      from "./dsa/modules/StackViz";
import QueueViz      from "./dsa/modules/QueueViz";
import LinkedListViz from "./dsa/modules/LinkedListViz";
import BSTViz        from "./dsa/modules/BSTViz";
import TrieViz       from "./dsa/modules/TrieViz";

const TABS = [
  {id:"sort",   label:"📊 Sorting",        badge:"5 Algos"},
  {id:"merge",  label:"🔀 Merge Arrays",    badge:"2 Ptrs"},
  {id:"graph",  label:"🕸 Graph",           badge:"BFS·DFS·Dijkstra"},
  {id:"heap",   label:"⛰ Heap",            badge:"Min-Heap"},
  {id:"dp",     label:"🧮 Dynamic Prog.",   badge:"Fib·LCS·Knapsack"},
  {id:"hash",   label:"🔑 Hashing",         badge:"Probe·Chain"},
  {id:"twoptr", label:"👆 Two Pointer",     badge:"Sliding Window"},
  {id:"stack",  label:"📚 Stack",           badge:"LIFO"},
  {id:"queue",  label:"🔄 Queue",           badge:"FIFO"},
  {id:"linked", label:"🔗 Linked List",     badge:"Singly"},
  {id:"bst",    label:"🌲 BST",             badge:"Binary Search"},
  {id:"trie",   label:"🔤 Trie",            badge:"Prefix Tree"},
];

export default function DSAVisualizer(){
  const [active,setActive] = useState("sort");

  return(
    <div className="flex flex-col h-[calc(100vh-0px)] sm:h-screen w-full overflow-hidden rounded-xl" style={{background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",margin:"-24px -24px 0",width:"calc(100% + 48px)"}}>
      <style>{CSS}</style>

      {/* ── Top Bar ── */}
      <div style={{padding:"11px 22px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:T.yellow}}>⚡ EduAI</span>
          <span className="hidden sm:inline" style={{color:T.surface3}}>/</span>
          <span className="hidden sm:inline" style={{fontSize:13,color:T.muted2}}>Advanced DSA Visualizer</span>
        </div>
        <div className="hidden md:block" style={{fontSize:11,color:T.muted2,background:T.surface2,padding:"4px 12px",borderRadius:100,border:`1px solid ${T.border}`}}>
          12 Visualizers · Sorting · Graph · DP · Trees
        </div>
      </div>

      {/* ── Tab Strip ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,background:T.surface,paddingLeft:12,overflowX:"auto",flexShrink:0}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActive(tab.id)} style={{
            padding:"8px 12px",fontSize:12,fontWeight:500,cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",background:"none",
            borderTop:"none",borderLeft:"none",borderRight:"none",
            borderBottom:active===tab.id?`2px solid ${T.accent}`:"2px solid transparent",
            marginBottom:-1,color:active===tab.id?T.accent:T.muted,
            display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap",transition:"all .15s",
          }}>
            {tab.label}
            <span className="hidden xs:inline" style={{fontSize:9,fontFamily:"'Space Mono',monospace",fontWeight:700,background:active===tab.id?T.accentSoft:T.surface2,color:active===tab.id?T.accent:T.muted,padding:"1px 6px",borderRadius:100,border:`1px solid ${active===tab.id?T.accent+"44":T.border2}`}}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active Module ── */}
      <div className="flex flex-1 overflow-hidden w-full h-full">
        {active==="sort"   && <SortingViz/>}
        {active==="merge"  && <MergeViz/>}
        {active==="graph"  && <GraphViz/>}
        {active==="heap"   && <HeapViz/>}
        {active==="dp"     && <DPViz/>}
        {active==="hash"   && <HashViz/>}
        {active==="twoptr" && <TwoPointerViz/>}
        {active==="stack"  && <StackViz/>}
        {active==="queue"  && <QueueViz/>}
        {active==="linked" && <LinkedListViz/>}
        {active==="bst"    && <BSTViz/>}
        {active==="trie"   && <TrieViz/>}
      </div>
    </div>
  );
}
