import { useState, useRef, useEffect, useCallback } from "react";
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
import NQueensViz    from "./dsa/modules/NQueensViz";
import KMPViz        from "./dsa/modules/KMPViz";

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
  {id:"bst",      label:"🌲 BST",           badge:"Binary Search"},
  {id:"trie",     label:"🔤 Trie",          badge:"Prefix Tree"},
  {id:"nqueens",  label:"♛ N-Queens",      badge:"Backtracking"},
  {id:"kmp",      label:"🔍 KMP Search",   badge:"String Match"},
];

const SCROLL_AMOUNT = 200;

export default function DSAVisualizer(){
  const [active,setActive] = useState("sort");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  const arrowBtnStyle: React.CSSProperties = {
    position:"absolute", top:0, bottom:0, width:32, zIndex:2,
    display:"flex", alignItems:"center", justifyContent:"center",
    border:"none", cursor:"pointer", color:T.text, fontSize:18, fontWeight:700,
    background:"transparent",
  };

  return(
    <div className="flex flex-col h-[calc(100dvh-72px)] sm:h-screen w-full overflow-hidden" style={{background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",margin:"-16px -16px 0",width:"calc(100% + 32px)",maxWidth:"100vw",overflowX:"hidden"}}>
      <style>{CSS}</style>



      {/* ── Tab Strip (Pill style) ── */}
      <div style={{position:"relative",flexShrink:0,background:T.bg,borderBottom:`1px solid ${T.border}`}}>
        {/* Left arrow + fade */}
        {canScrollLeft && (
          <>
            <div style={{position:"absolute",top:0,left:0,bottom:0,width:32,zIndex:1,background:`linear-gradient(to right, ${T.bg} 0%, transparent 100%)`,pointerEvents:"none"}}/>
            <button onClick={()=>scroll("left")} style={{...arrowBtnStyle, left:0}} aria-label="Scroll tabs left">‹</button>
          </>
        )}
        {/* Right arrow + fade */}
        {canScrollRight && (
          <>
            <div style={{position:"absolute",top:0,right:0,bottom:0,width:32,zIndex:1,background:`linear-gradient(to left, ${T.bg} 0%, transparent 100%)`,pointerEvents:"none"}}/>
            <button onClick={()=>scroll("right")} style={{...arrowBtnStyle, right:0}} aria-label="Scroll tabs right">›</button>
          </>
        )}
        <div ref={scrollRef} className="dsa-scroll-row" style={{display:"flex",alignItems:"center",padding:"6px 10px",gap:2}}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActive(tab.id)}
              className={`dsa-tab-pill${active===tab.id?" active":""}`}>
              {tab.label}
              <span className="hidden sm:inline" style={{fontSize:9,fontFamily:"'Space Mono',monospace",fontWeight:700,background:active===tab.id?T.accent+"22":"transparent",color:active===tab.id?T.accent:T.muted,padding:"1px 5px",borderRadius:100,marginLeft:4}}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>
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
        {active==="bst"      && <BSTViz/>}
        {active==="trie"     && <TrieViz/>}
        {active==="nqueens"  && <NQueensViz/>}
        {active==="kmp"      && <KMPViz/>}
      </div>
    </div>
  );
}
