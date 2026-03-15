import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════ */
const T = {
  bg:"#0f0f0f", surface:"#1a1a1a", surface2:"#212121", surface3:"#2a2a2a",
  border:"rgba(255,255,255,0.07)", border2:"rgba(255,255,255,0.13)",
  text:"#e8e8e8", muted:"#555", muted2:"#888",
  accent:"#7c5cfc", accentSoft:"rgba(124,92,252,0.15)",
  yellow:"#f5c842", yellowSoft:"rgba(245,200,66,0.13)",
  green:"#4acf82", greenSoft:"rgba(74,207,130,0.13)",
  red:"#e85d4a", redSoft:"rgba(232,93,74,0.13)",
  orange:"#f4924a", orangeSoft:"rgba(244,146,74,0.13)",
  teal:"#3ec6c6", tealSoft:"rgba(62,198,198,0.13)",
  blue:"#5b8df0", blueSoft:"rgba(91,141,240,0.13)",
  purple:"#b46ef5", purpleSoft:"rgba(180,110,245,0.13)",
  pink:"#f06292", pinkSoft:"rgba(240,98,146,0.13)",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html{touch-action:manipulation}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;overscroll-behavior:none;-webkit-text-size-adjust:100%}
  input,button,select,textarea{font-family:inherit}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${T.surface3};border-radius:99px}
  button:active{opacity:0.8}

  @keyframes popIn{0%{opacity:0;transform:scale(0.3)}70%{transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
  @keyframes slideUpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.7) drop-shadow(0 0 10px currentColor)}}
  @keyframes logIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  @keyframes drawIn{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}
  @keyframes queenDrop{from{opacity:0;transform:translateY(-20px) scale(0.5)}to{opacity:1;transform:none}}

  .pop   {animation:popIn .34s cubic-bezier(.34,1.56,.64,1) both}
  .sup   {animation:slideUp .26s ease both}
  .sdn   {animation:slideDown .22s ease both}
  .fin   {animation:fadeIn .2s ease both}
  .glw   {animation:glow .6s ease}
  .log   {animation:logIn .16s ease both}
  .pulse {animation:pulse 1.2s ease infinite}
  .shake {animation:shake .3s ease}
  .sheet {animation:slideUpSheet .3s cubic-bezier(.32,1,.32,1) both}
  .draw  {stroke-dasharray:200;animation:drawIn .4s ease both}
  .qdrop {animation:queenDrop .3s cubic-bezier(.34,1.56,.64,1) both}
`;

/* ═══════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════ */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 700);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function useSwipe(ref, onLeft, onRight) {
  const startX = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = e => { startX.current = e.touches[0].clientX; };
    const end = e => {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (Math.abs(dx) > 45) { dx < 0 ? onLeft?.() : onRight?.(); }
      startX.current = null;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchend", end, { passive: true });
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchend", end); };
  }, [onLeft, onRight]);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ═══════════════════════════════════════════════════════════════
   PSEUDOCODE DATA
═══════════════════════════════════════════════════════════════ */
const PSEUDO = {
  bubble: [
    "for i = 0 to n-1:",
    "  swapped = false",
    "  for j = 0 to n-i-2:",
    "    if A[j] > A[j+1]:",
    "      swap(A[j], A[j+1])",
    "      swapped = true",
    "  if not swapped: break  ← early exit",
  ],
  selection: [
    "for i = 0 to n-1:",
    "  minIdx = i",
    "  for j = i+1 to n-1:",
    "    if A[j] < A[minIdx]:",
    "      minIdx = j",
    "  swap(A[i], A[minIdx])",
  ],
  insertion: [
    "for i = 1 to n-1:",
    "  key = A[i]",
    "  j = i - 1",
    "  while j ≥ 0 and A[j] > key:",
    "    A[j+1] = A[j]",
    "    j = j - 1",
    "  A[j+1] = key",
  ],
  merge: [
    "mergeSort(A, l, r):",
    "  if l >= r: return",
    "  mid = (l + r) / 2",
    "  mergeSort(A, l, mid)",
    "  mergeSort(A, mid+1, r)",
    "  merge(A, l, mid, r)",
  ],
  quick: [
    "quickSort(A, lo, hi):",
    "  if lo >= hi: return",
    "  pivot = A[hi]",
    "  i = lo - 1",
    "  for j = lo to hi-1:",
    "    if A[j] ≤ pivot: swap(A[++i], A[j])",
    "  swap(A[i+1], A[hi])  ← place pivot",
    "  quickSort(A, lo, i)",
    "  quickSort(A, i+2, hi)",
  ],
  bfs: [
    "BFS(graph, start):",
    "  visited = {start}",
    "  queue = [start]",
    "  while queue not empty:",
    "    node = queue.dequeue()",
    "    for each neighbor of node:",
    "      if neighbor not visited:",
    "        visited.add(neighbor)",
    "        queue.enqueue(neighbor)",
  ],
  dfs: [
    "DFS(graph, node, visited):",
    "  visited.add(node)",
    "  for each neighbor of node:",
    "    if neighbor not visited:",
    "      DFS(graph, neighbor, visited)",
  ],
  dijkstra: [
    "Dijkstra(graph, start):",
    "  dist[start] = 0; dist[*] = ∞",
    "  pq = [(0, start)]",
    "  while pq not empty:",
    "    (cost, u) = pq.pop_min()",
    "    if u visited: continue",
    "    mark u visited",
    "    for each (v, w) in adj[u]:",
    "      if dist[u]+w < dist[v]:",
    "        dist[v] = dist[u]+w",
    "        pq.push((dist[v], v))",
  ],
  binarySearch: [
    "binarySearch(A, target):",
    "  lo = 0, hi = n-1",
    "  while lo ≤ hi:",
    "    mid = (lo + hi) / 2",
    "    if A[mid] == target: return mid",
    "    if A[mid] < target: lo = mid+1",
    "    else: hi = mid-1",
    "  return -1  ← not found",
  ],
  twoSum: [
    "twoPointers(A, target):",
    "  sort(A)",
    "  l = 0, r = n-1",
    "  while l < r:",
    "    sum = A[l] + A[r]",
    "    if sum == target: return [l,r]",
    "    if sum < target: l++",
    "    else: r--",
  ],
  sliding: [
    "slidingWindow(A, k):",
    "  windowSum = sum(A[0..k-1])",
    "  maxSum = windowSum",
    "  for i = k to n-1:",
    "    windowSum += A[i]",
    "    windowSum -= A[i-k]",
    "    maxSum = max(maxSum, windowSum)",
    "  return maxSum",
  ],
  nqueens: [
    "solve(board, row):",
    "  if row == N: ← solution found!",
    "    record solution; return true",
    "  for col = 0 to N-1:",
    "    if isSafe(board, row, col):",
    "      board[row][col] = QUEEN",
    "      if solve(board, row+1):",
    "        return true",
    "      board[row][col] = EMPTY  ← backtrack",
    "  return false",
  ],
  kmp: [
    "// Phase 1: Build failure (LPS) array",
    "buildLPS(pattern):",
    "  lps[0] = 0; len = 0; i = 1",
    "  while i < m:",
    "    if P[i] == P[len]: lps[i++] = ++len",
    "    elif len > 0: len = lps[len-1]",
    "    else: lps[i++] = 0",
    "// Phase 2: KMP Search",
    "search(text, pattern, lps):",
    "  ti = 0; pi = 0",
    "  while ti < n:",
    "    if T[ti]==P[pi]: ti++; pi++",
    "    if pi==m: match at ti-m; pi=lps[pi-1]",
    "    elif T[ti]!=P[pi]:",
    "      if pi>0: pi=lps[pi-1] else: ti++",
  ],
  heapInsert: [
    "insert(heap, val):",
    "  heap.append(val)",
    "  i = len(heap) - 1",
    "  while i > 0:",
    "    parent = (i-1) // 2",
    "    if heap[i] < heap[parent]:",
    "      swap(heap[i], heap[parent])",
    "      i = parent",
    "    else: break  ← heap satisfied",
  ],
  heapExtract: [
    "extractMin(heap):",
    "  min = heap[0]",
    "  heap[0] = heap.pop()  ← move last to root",
    "  i = 0",
    "  while true:",
    "    l = 2i+1; r = 2i+2",
    "    smallest = argmin(heap[i],heap[l],heap[r])",
    "    if smallest != i:",
    "      swap(heap[i], heap[smallest])",
    "      i = smallest",
    "    else: break  ← heap satisfied",
  ],
  inorder: [
    "inorder(node):",
    "  if node == null: return",
    "  inorder(node.left)   ← go left",
    "  visit(node)          ← process root",
    "  inorder(node.right)  ← go right",
    "  // Result: sorted order (L < Root < R)",
  ],
  preorder: [
    "preorder(node):",
    "  if node == null: return",
    "  visit(node)           ← process root",
    "  preorder(node.left)   ← go left",
    "  preorder(node.right)  ← go right",
    "  // Root visited before children",
  ],
  postorder: [
    "postorder(node):",
    "  if node == null: return",
    "  postorder(node.left)   ← go left",
    "  postorder(node.right)  ← go right",
    "  visit(node)            ← process root",
    "  // Root visited after children",
  ],
  fib: [
    "fibonacci_dp(n):",
    "  dp[0] = 0; dp[1] = 1",
    "  for i = 2 to n:",
    "    dp[i] = dp[i-1] + dp[i-2]",
    "  return dp[n]",
    "  // O(n) vs naive O(2ⁿ) recursion",
  ],
  lcs: [
    "LCS(s1, s2):",
    "  dp[i][j] = LCS(s1[0..i], s2[0..j])",
    "  for i = 1 to m:",
    "    for j = 1 to n:",
    "      if s1[i]==s2[j]:",
    "        dp[i][j] = dp[i-1][j-1] + 1",
    "      else:",
    "        dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
  ],
  knapsack: [
    "knapsack(items, capacity):",
    "  dp[i][w] = max value, i items, cap w",
    "  for i = 1 to n:",
    "    for w = 0 to W:",
    "      if weight[i] > w:",
    "        dp[i][w] = dp[i-1][w]  ← skip",
    "      else:",
    "        dp[i][w] = max(",
    "          dp[i-1][w],            ← skip",
    "          dp[i-1][w-w[i]]+v[i]   ← take",
    "        )",
  ],
};

/* ═══════════════════════════════════════════════════════════════
   PSEUDOCODE PANEL COMPONENT
═══════════════════════════════════════════════════════════════ */
const PseudoPanel = ({ lines, activeLine, label = "Pseudocode", mobile }) => {
  const activeRef = useRef(null);
  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeLine]);

  if (!lines || lines.length === 0) return null;
  if (mobile) return null; // on mobile we use the label bar instead

  return (
    <div style={{
      width: 230, minWidth: 230, borderLeft: `1px solid ${T.border}`,
      background: T.surface, display: "flex", flexDirection: "column",
      flexShrink: 0, overflow: "hidden",
    }}>
      <div style={{ padding: "9px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 9, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em" }}>{label}</span>
      </div>
      <div style={{ overflowY: "auto", padding: "8px 0", flex: 1 }}>
        {lines.map((line, i) => {
          const isActive = i === activeLine;
          const indent = line.match(/^(\s+)/)?.[1]?.length || 0;
          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              style={{
                padding: `${isActive ? 4 : 2}px 10px`,
                paddingLeft: 10 + indent * 6,
                background: isActive ? T.accentSoft : "transparent",
                borderLeft: isActive ? `3px solid ${T.accent}` : "3px solid transparent",
                fontFamily: "'Space Mono',monospace",
                fontSize: 10,
                color: isActive ? T.text : line.startsWith("//") || line.includes("←") ? T.muted : T.muted2,
                lineHeight: 1.7,
                transition: "all .15s",
                whiteSpace: "pre",
                fontStyle: line.includes("←") ? "italic" : "normal",
              }}
            >
              <span style={{ color: T.surface3, marginRight: 8, userSelect: "none", fontSize: 9 }}>
                {String(i + 1).padStart(2, " ")}
              </span>
              {isActive && (
                <span style={{
                  display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                  background: T.accent, marginRight: 5, verticalAlign: "middle",
                  boxShadow: `0 0 6px ${T.accent}`,
                }} />
              )}
              {line.trim()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STEP PLAYER HOOK — auto-play + keyboard for step-based vizes
═══════════════════════════════════════════════════════════════ */
function useStepPlayer(steps, stepIdx, setStepIdx, speed = 600) {
  const [playing, setPlaying] = useState(false);

  // Auto-advance
  useEffect(() => {
    if (!playing || steps.length === 0) return;
    if (stepIdx >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), speed);
    return () => clearTimeout(t);
  }, [playing, stepIdx, steps.length, speed]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (steps.length === 0) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setStepIdx(i => Math.min(i + 1, steps.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setStepIdx(i => Math.max(0, i - 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.key === "Home") {
        e.preventDefault();
        setStepIdx(0); setPlaying(false);
      } else if (e.key === "End") {
        e.preventDefault();
        setStepIdx(steps.length - 1); setPlaying(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [steps.length]);

  const toggle = () => {
    if (stepIdx >= steps.length - 1) { setStepIdx(0); setPlaying(true); }
    else setPlaying(p => !p);
  };

  return { playing, setPlaying, toggle };
}

/* ═══════════════════════════════════════════════════════════════
   COMPARISON MODE — side-by-side sorting
═══════════════════════════════════════════════════════════════ */
function SortingCompareViz({ onClose }) {
  const mobile = useIsMobile();
  const [algoA, setAlgoA] = useState("bubble");
  const [algoB, setAlgoB] = useState("merge");
  const [runningA, setRunningA] = useState(false);
  const [runningB, setRunningB] = useState(false);
  const [barsA, setBarsA] = useState(null);
  const [barsB, setBarsB] = useState(null);
  const [statsA, setStatsA] = useState({ comps: 0, swaps: 0 });
  const [statsB, setStatsB] = useState({ comps: 0, swaps: 0 });
  const [labelA, setLabelA] = useState("–");
  const [labelB, setLabelB] = useState("–");
  const [speed, setSpeed] = useState(200);
  const stopRefA = useRef(false), stopRefB = useRef(false);
  const statsRefA = useRef({ comps: 0, swaps: 0 }), statsRefB = useRef({ comps: 0, swaps: 0 });

  const newArr = () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 88 + 8));

  const reset = () => {
    stopRefA.current = true; stopRefB.current = true;
    const base = newArr();
    setTimeout(() => {
      setBarsA(base.map(v => ({ val: v, state: "idle" })));
      setBarsB(base.map(v => ({ val: v, state: "idle" })));
      statsRefA.current = { comps: 0, swaps: 0 }; setStatsA({ comps: 0, swaps: 0 });
      statsRefB.current = { comps: 0, swaps: 0 }; setStatsB({ comps: 0, swaps: 0 });
      setLabelA("Ready"); setLabelB("Ready");
      setRunningA(false); setRunningB(false);
    }, 80);
  };

  useEffect(() => { reset(); }, []); // eslint-disable-line

  const runSingle = async (algo, getBars, setBars, setRunning, setLabel, setStats, statsRef, stopRef) => {
    const b = getBars().map(x => ({ ...x, state: "idle" }));
    statsRef.current = { comps: 0, swaps: 0 };
    setRunning(true); stopRef.current = false;

    const tick = async (b2, msg) => {
      setBars([...b2]); setLabel(msg);
      await new Promise(res => setTimeout(res, speed));
      if (stopRef.current) throw new Error("stopped");
    };
    const swp = (b2, i, j) => {
      [b2[i], b2[j]] = [b2[j], b2[i]];
      b2[i].state = "swap"; b2[j].state = "swap";
      statsRef.current.swaps++; setStats({ ...statsRef.current });
    };
    const cmp = async (b2, i, j, msg) => {
      b2[i].state = "compare"; b2[j].state = "compare";
      statsRef.current.comps++; setStats({ ...statsRef.current });
      await tick(b2, msg);
      if (b2[i].state !== "sorted") b2[i].state = "idle";
      if (b2[j].state !== "sorted") b2[j].state = "idle";
    };

    try {
      if (algo === "bubble") {
        for (let i = 0; i < b.length; i++) {
          let sw = false;
          for (let j = 0; j < b.length - i - 1; j++) {
            await cmp(b, j, j+1, `${algo}: cmp ${b[j].val} vs ${b[j+1].val}`);
            if (b[j].val > b[j+1].val) { swp(b, j, j+1); await tick(b, `swap ${b[j].val}↔${b[j+1].val}`); sw = true; }
            if (b[j].state !== "sorted") b[j].state = "idle";
            if (b[j+1].state !== "sorted") b[j+1].state = "idle";
          }
          b[b.length-i-1].state = "sorted";
          if (!sw) { b.forEach(x => x.state = "sorted"); break; }
        }
      } else if (algo === "selection") {
        for (let i = 0; i < b.length; i++) {
          let mi = i;
          for (let j = i+1; j < b.length; j++) {
            await cmp(b, mi, j, `${algo}: min=${b[mi].val} vs ${b[j].val}`);
            if (b[j].val < b[mi].val) { if (b[mi].state !== "sorted") b[mi].state = "idle"; mi = j; }
            else if (b[j].state !== "sorted") b[j].state = "idle";
          }
          if (mi !== i) { swp(b, i, mi); await tick(b, `place min ${b[i].val}`); }
          b[i].state = "sorted";
        }
      } else if (algo === "insertion") {
        for (let i = 1; i < b.length; i++) {
          let j = i;
          while (j > 0) {
            await cmp(b, j-1, j, `${algo}: ${b[j].val}<${b[j-1].val}?`);
            if (b[j].val < b[j-1].val) { swp(b, j, j-1); await tick(b, `shift left`); j--; }
            else { b[j].state = "idle"; break; }
          }
          b[j].state = "idle";
        }
        b.forEach(x => x.state = "sorted");
      } else if (algo === "merge") {
        const mergeSort = async (b2, l, r) => {
          if (l >= r) return;
          const m = Math.floor((l+r)/2);
          await mergeSort(b2, l, m); await mergeSort(b2, m+1, r);
          const lft = b2.slice(l, m+1).map(x => ({...x})), rgt = b2.slice(m+1, r+1).map(x => ({...x}));
          let i = 0, j = 0, k = l;
          while (i < lft.length && j < rgt.length) {
            statsRef.current.comps++; setStats({...statsRef.current});
            b2[k] = { val: lft[i].val <= rgt[j].val ? lft[i++].val : rgt[j++].val, state: "merge" };
            await tick(b2, `merge: placed ${b2[k].val}`); b2[k].state = "sorted"; k++;
          }
          while (i < lft.length) { b2[k] = { val: lft[i++].val, state: "sorted" }; k++; }
          while (j < rgt.length) { b2[k] = { val: rgt[j++].val, state: "sorted" }; k++; }
          await tick(b2, `merged [${l}..${r}]`);
        };
        await mergeSort(b, 0, b.length-1);
      } else {
        const quickSort = async (b2, lo, hi) => {
          if (lo >= hi) return;
          const pval = b2[hi].val; b2[hi].state = "pivot";
          await tick(b2, `${algo}: pivot=${pval}`);
          let i = lo-1;
          for (let j = lo; j < hi; j++) {
            statsRef.current.comps++; b2[j].state = "compare";
            await tick(b2, `${b2[j].val}≤${pval}?`);
            if (b2[j].val <= pval) { i++; swp(b2, i, j); await tick(b2, `swap`); }
            if (b2[j].state !== "sorted") b2[j].state = "idle";
          }
          swp(b2, i+1, hi); b2[i+1].state = "sorted";
          await tick(b2, `pivot placed`);
          await quickSort(b2, lo, i); await quickSort(b2, i+2, hi);
        };
        await quickSort(b, 0, b.length-1);
      }
      b.forEach(x => x.state = "sorted"); setBars([...b]); setLabel("✓ Done!");
    } catch (e) { if (e.message !== "stopped") throw e; }
    setRunning(false);
  };

  const runBoth = () => {
    if (runningA || runningB) return;
    runSingle(algoA, () => barsA, setBarsA, setRunningA, setLabelA, setStatsA, statsRefA, stopRefA);
    runSingle(algoB, () => barsB, setBarsB, setRunningB, setLabelB, setStatsB, statsRefB, stopRefB);
  };

  const stateColor = { idle: T.blue, compare: T.yellow, swap: T.orange, sorted: T.green, pivot: T.red, merge: T.purple };
  const algoOptions = [["bubble","Bubble"],["selection","Select"],["insertion","Insert"],["merge","Merge"],["quick","Quick"]];

  const MiniBar = ({ bars, stats, label, algo, setAlgo, running }) => {
    if (!bars) return null;
    const maxV = Math.max(...bars.map(b => b.val), 1);
    const h = mobile ? 100 : 160;
    const info = ALGO_INFO[algo];
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.surface }}>
        {/* Header */}
        <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <select value={algo} onChange={e => { if (!running) setAlgo(e.target.value); }}
            disabled={running}
            style={{ background: T.surface3, border: `1px solid ${T.border2}`, color: T.text, borderRadius: 7, padding: "4px 8px", fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", cursor: running ? "not-allowed" : "pointer" }}>
            {algoOptions.map(([k, l]) => <option key={k} value={k}>{l} Sort</option>)}
          </select>
          <div style={{ display: "flex", gap: 10, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
            <span style={{ color: T.yellow }}>⚖ {stats.comps}</span>
            <span style={{ color: T.orange }}>↕ {stats.swaps}</span>
          </div>
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", padding: "8px 6px 0", gap: 2, minHeight: h }}>
          {bars.map((bar, i) => {
            const col = stateColor[bar.state] || T.blue;
            const bh = Math.max(3, Math.floor((bar.val / maxV) * h));
            return (
              <div key={i} style={{ flex: 1, height: bh, borderRadius: "2px 2px 0 0", background: `linear-gradient(to top, ${col}dd, ${col}66)`, boxShadow: bar.state !== "idle" ? `0 0 6px ${col}88` : "none", transform: bar.state === "swap" ? "translateY(-5px)" : "none", transition: "height .1s ease, transform .1s ease" }} />
            );
          })}
        </div>
        {/* Complexity */}
        <div style={{ padding: "5px 10px", display: "flex", gap: 8, borderTop: `1px solid ${T.border}`, background: T.surface2 }}>
          <span style={{ fontSize: 9, color: T.green, fontFamily: "'Space Mono',monospace" }}>Best {info.best}</span>
          <span style={{ fontSize: 9, color: T.yellow, fontFamily: "'Space Mono',monospace" }}>Avg {info.avg}</span>
          <span style={{ fontSize: 9, color: T.red, fontFamily: "'Space Mono',monospace" }}>Worst {info.worst}</span>
        </div>
        {/* Label */}
        <div style={{ padding: "6px 10px", fontSize: 10, color: T.muted2, borderTop: `1px solid ${T.border}`, minHeight: 28, fontFamily: "'Space Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface2, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>⚡ Side-by-Side Comparison</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: T.muted }}>Speed:</span>
        <SpeedRow speed={speed} setSpeed={setSpeed} />
        <Btn onClick={runBoth} variant="primary" disabled={runningA || runningB} sm>▶ Run Both</Btn>
        <Btn onClick={reset} variant="ghost" sm>↺ New Array</Btn>
        <Btn onClick={onClose} variant="ghost" sm>✕ Close</Btn>
      </div>
      {/* Charts side-by-side */}
      <div style={{ flex: 1, display: "flex", gap: 10, padding: 12, overflow: "hidden" }}>
        <MiniBar bars={barsA} stats={statsA} label={labelA} algo={algoA} setAlgo={setAlgoA} running={runningA} />
        <MiniBar bars={barsB} stats={statsB} label={labelB} algo={algoB} setAlgo={setAlgoB} running={runningB} />
      </div>
      {/* Winner stats */}
      {(!runningA && !runningB && statsA.comps > 0 && statsB.comps > 0) && (
        <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", gap: 14, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em" }}>Result:</span>
          <span style={{ fontSize: 11, color: statsA.comps < statsB.comps ? T.green : T.muted2, fontFamily: "'Space Mono',monospace" }}>
            {ALGO_INFO[algoA] && algoA.charAt(0).toUpperCase()+algoA.slice(1)}: {statsA.comps} cmps, {statsA.swaps} swaps
          </span>
          <span style={{ fontSize: 11, color: T.muted }}>vs</span>
          <span style={{ fontSize: 11, color: statsB.comps < statsA.comps ? T.green : T.muted2, fontFamily: "'Space Mono',monospace" }}>
            {ALGO_INFO[algoB] && algoB.charAt(0).toUpperCase()+algoB.slice(1)}: {statsB.comps} cmps, {statsB.swaps} swaps
          </span>
          <span style={{ fontSize: 10, color: T.accent }}>
            → {statsA.comps < statsB.comps ? algoA : algoB} fewer comparisons on this array
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════════════════════════ */
const Btn = ({ children, onClick, variant = "ghost", disabled, full, sm, xs, style = {} }) => {
  const v = {
    primary: { background: T.accent, color: "#fff", border: "none", boxShadow: `0 3px 12px ${T.accent}44` },
    ghost:   { background: T.surface2, color: T.muted2, border: `1px solid ${T.border2}` },
    green:   { background: T.greenSoft, color: T.green, border: `1px solid ${T.green}44` },
    red:     { background: T.redSoft, color: T.red, border: `1px solid ${T.red}44` },
    yellow:  { background: T.yellowSoft, color: T.yellow, border: `1px solid ${T.yellow}44` },
    teal:    { background: T.tealSoft, color: T.teal, border: `1px solid ${T.teal}44` },
    orange:  { background: T.orangeSoft, color: T.orange, border: `1px solid ${T.orange}44` },
    blue:    { background: T.blueSoft, color: T.blue, border: `1px solid ${T.blue}44` },
    purple:  { background: T.purpleSoft, color: T.purple, border: `1px solid ${T.purple}44` },
  };
  const pad = xs ? "4px 9px" : sm ? "6px 12px" : "8px 14px";
  const fs = xs ? 10 : sm ? 11 : 12;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: pad, borderRadius: 100, fontSize: fs, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.38 : 1,
      transition: "all .16s", display: "flex", alignItems: "center", gap: 5,
      whiteSpace: "nowrap", width: full ? "100%" : undefined,
      justifyContent: full ? "center" : undefined, minHeight: sm ? 30 : 34,
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Input = ({ value, onChange, placeholder, onEnter, mono, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    onKeyDown={e => e.key === "Enter" && onEnter?.()}
    style={{
      background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 10,
      padding: "8px 11px", color: T.text, fontSize: 13, width: "100%", outline: "none",
      fontFamily: mono ? "'Space Mono',monospace" : "'DM Sans',sans-serif", ...style,
    }} />
);

const SLabel = ({ children, style = {} }) => (
  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", ...style }}>
    {children}
  </div>
);

const Badge = ({ children, color = T.accent }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, padding: "2px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{children}</span>
);

const CRow = ({ op, val, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
    <span style={{ color: T.muted }}>{op}</span>
    <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, color }}>{val}</span>
  </div>
);

const InfoBox = ({ children, style = {} }) => (
  <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 13, fontSize: 12, color: T.muted2, lineHeight: 1.65, ...style }}>
    {children}
  </div>
);

const Log = ({ entries }) => {
  const r = useRef();
  useEffect(() => { if (r.current) r.current.scrollTop = r.current.scrollHeight; }, [entries]);
  return (
    <div ref={r} style={{ background: T.surface3, borderRadius: 10, padding: "8px 10px", fontFamily: "'Space Mono',monospace", fontSize: 10, color: T.muted2, lineHeight: 1.9, maxHeight: 80, overflowY: "auto" }}>
      {entries.map((e, i) => (
        <div key={i} className="log" style={{ color: e.t === "ok" ? T.green : e.t === "err" ? T.red : e.t === "warn" ? T.yellow : T.accent }}>
          › {e.m}
        </div>
      ))}
    </div>
  );
};

const SpeedRow = ({ speed, setSpeed }) => (
  <div style={{ display: "flex", gap: 5 }}>
    {[[700, "Slow"], [350, "Normal"], [130, "Fast"]].map(([ms, l]) => (
      <button key={ms} onClick={() => setSpeed(ms)} style={{
        flex: 1, padding: "6px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600,
        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        background: speed === ms ? T.accentSoft : T.surface2,
        border: `1px solid ${speed === ms ? T.accent + "66" : T.border2}`,
        color: speed === ms ? T.accent : T.muted2, transition: "all .15s",
      }}>{l}</button>
    ))}
  </div>
);

/* ── Progress bar step footer ── */
const StepFooter = ({ label, stepIdx, total, onBack, onFwd, extra, mobile, playing, onTogglePlay }) => {
  const pct = total > 1 ? (stepIdx / (total - 1)) * 100 : 0;
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: T.surface3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: T.accent, transition: "width .2s ease", borderRadius: 1 }} />
      </div>
      <div style={{ padding: mobile ? "7px 10px" : "9px 18px", display: "flex", alignItems: "center", gap: mobile ? 6 : 10 }}>
        <div style={{ flex: 1, fontSize: mobile ? 11 : 12, color: T.muted2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
          dangerouslySetInnerHTML={{ __html: label }} />
        {extra}
        {onTogglePlay && (
          <button onClick={onTogglePlay} title="Space to play/pause" style={{
            padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
            cursor: "pointer", background: playing ? T.yellowSoft : T.accentSoft,
            border: `1px solid ${playing ? T.yellow+"66" : T.accent+"66"}`,
            color: playing ? T.yellow : T.accent, flexShrink: 0,
          }}>{playing ? "⏸" : "▶"}</button>
        )}
        <Btn onClick={onBack} disabled={stepIdx === 0} sm>← Back</Btn>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap", flexShrink: 0 }}>{stepIdx + 1}/{total}</span>
        <Btn onClick={onFwd} variant="primary" disabled={stepIdx === total - 1} sm>Next →</Btn>
        {!mobile && <span style={{ fontSize: 9, color: T.surface3, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap", flexShrink: 0 }}>← →  Space</span>}
      </div>
    </div>
  );
};

/* ── Bottom Sheet ── */
function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="fin" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40 }} />
      <div className="sheet" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: T.surface, borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border2}`, maxHeight: "85vh", display: "flex", flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.surface3 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{title}</span>
          <button onClick={onClose} style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 20, padding: "5px 12px", color: T.muted2, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "14px 18px 28px", display: "flex", flexDirection: "column", gap: 13 }}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ── Desktop Side panel ── */
const Side = ({ children }) => (
  <div style={{ width: 220, minWidth: 220, borderRight: `1px solid ${T.border}`, padding: 14, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto", background: T.surface, flexShrink: 0 }}>
    {children}
  </div>
);

/* ── Quick Info overlay (mobile — slides from top) ── */
function QuickInfo({ title, desc, time, space, note, visible, onClose }) {
  if (!visible) return null;
  return (
    <div className="sdn" style={{
      position: "absolute", top: 8, left: 10, right: 10, zIndex: 20,
      background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 14,
      padding: "12px 14px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11, color: T.muted2, lineHeight: 1.5, marginBottom: 8 }}>{desc}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {time && <Badge color={T.green}>⏱ {time}</Badge>}
            {space && <Badge color={T.teal}>💾 {space}</Badge>}
            {note && <Badge color={T.yellow}>💡 {note}</Badge>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 2, flexShrink: 0 }}>✕</button>
      </div>
    </div>
  );
}

/* ── Swipe hint pill ── */
const InfoPill = ({ onClick }) => (
  <button onClick={onClick} style={{
    position: "absolute", top: 10, left: 10, zIndex: 10,
    background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 100,
    padding: "5px 12px", fontSize: 11, fontWeight: 600, color: T.muted2,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
    boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
  }}>ℹ Info</button>
);

/* ── Chip strip (algo selector) ── */
const ChipStrip = ({ options, active, onSelect, disabled, style = {} }) => (
  <div style={{ display: "flex", gap: 5, overflowX: "auto", ...style }}>
    {options.map(([k, l]) => (
      <button key={k} onClick={() => !disabled && onSelect(k)} style={{
        padding: "5px 11px", borderRadius: 100, fontSize: 11, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0,
        fontFamily: "'DM Sans',sans-serif",
        background: active === k ? T.accent : T.surface3,
        border: `1px solid ${active === k ? T.accent : T.border2}`,
        color: active === k ? "#fff" : T.muted2, transition: "all .14s",
      }}>{l}</button>
    ))}
  </div>
);

/* ── Mobile quick strip wrapper ── */
const MobileStrip = ({ children, style = {} }) => (
  <div style={{
    display: "flex", gap: 6, padding: "8px 10px",
    borderBottom: `1px solid ${T.border}`, background: T.surface2,
    flexShrink: 0, alignItems: "center", overflowX: "auto", ...style,
  }}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   1. STACK & QUEUE
═══════════════════════════════════════════════════════════════ */
function StackQueueViz() {
  const mobile = useIsMobile();
  const [mode, setMode] = useState("stack");
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);
  const [highlight, setHighlight] = useState(null); // index
  const [label, setLabel] = useState("Push/enqueue values to begin");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-20), { m, t }]);

  const push = () => {
    const v = input.trim() || String(Math.floor(Math.random() * 99 + 1));
    setInput("");
    if (items.length >= 10) { addLog("Full! (max 10)", "err"); return; }
    const idx = mode === "stack" ? items.length : items.length;
    setItems(prev => [...prev, { val: v, id: Date.now() }]);
    setHighlight(idx);
    setTimeout(() => setHighlight(null), 600);
    setLabel(mode === "stack" ? `push(${v}) → top of stack` : `enqueue(${v}) → rear of queue`);
    addLog(`${mode === "stack" ? "push" : "enqueue"}(${v})`, "ok");
  };

  const pop = async () => {
    if (!items.length) { addLog("Empty!", "err"); setLabel("Nothing to remove"); return; }
    const idx = mode === "stack" ? items.length - 1 : 0;
    const v = items[idx].val;
    setHighlight(idx);
    await sleep(350);
    setItems(prev => mode === "stack" ? prev.slice(0, -1) : prev.slice(1));
    setHighlight(null);
    setLabel(mode === "stack" ? `pop() → removed ${v} from top` : `dequeue() → removed ${v} from front`);
    addLog(`${mode === "stack" ? "pop" : "dequeue"}() = ${v}`, "warn");
  };

  const peek = () => {
    if (!items.length) { addLog("Empty!", "err"); return; }
    const idx = mode === "stack" ? items.length - 1 : 0;
    const v = items[idx].val;
    setHighlight(idx);
    setTimeout(() => setHighlight(null), 800);
    setLabel(mode === "stack" ? `peek() → ${v} (top, not removed)` : `front() → ${v} (front, not removed)`);
    addLog(`peek = ${v}`, "info");
  };

  const reset = () => { setItems([]); setLog([]); setLabel("Cleared"); };

  const isStack = mode === "stack";
  const displayItems = isStack ? [...items].reverse() : items;

  const infoData = {
    stack: { title: "Stack (LIFO)", desc: "Last-In First-Out. Like a stack of plates — you add and remove from the top.", time: "O(1) push/pop", space: "O(n)", note: "LIFO" },
    queue: { title: "Queue (FIFO)", desc: "First-In First-Out. Like a line — new items join the rear, items leave from the front.", time: "O(1) enqueue/dequeue", space: "O(n)", note: "FIFO" },
  };

  const controlsContent = (
    <>
      <div><SLabel>Insert Value</SLabel><div style={{ marginTop: 6 }}><Input value={input} onChange={setInput} placeholder="value or blank for random" onEnter={push} mono /></div></div>
      <Btn onClick={push} variant="primary" full>⊕ {isStack ? "Push" : "Enqueue"}</Btn>
      <Btn onClick={pop} variant="red" disabled={!items.length} full>⊖ {isStack ? "Pop" : "Dequeue"}</Btn>
      <Btn onClick={peek} variant="yellow" disabled={!items.length} full>👁 {isStack ? "Peek (top)" : "Peek (front)"}</Btn>
      <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>{infoData[mode].title}</strong><br /><br />
        {infoData[mode].desc}
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Push/Enqueue" val="O(1)" color={T.green} />
          <CRow op="Pop/Dequeue" val="O(1)" color={T.green} />
          <CRow op="Peek" val="O(1)" color={T.green} />
          <CRow op="Search" val="O(n)" color={T.yellow} />
          <CRow op="Space" val="O(n)" color={T.teal} />
        </div>
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <ChipStrip options={[["stack","Stack"],["queue","Queue"]]} active={mode} onSelect={m => { setMode(m); reset(); }} />
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <Btn onClick={push} variant="primary" sm>⊕</Btn>
            <Btn onClick={pop} variant="red" disabled={!items.length} sm>⊖</Btn>
            <Btn onClick={peek} variant="yellow" disabled={!items.length} sm>👁</Btn>
            <Btn onClick={reset} variant="ghost" sm>↺</Btn>
          </MobileStrip>
        )}
        {mobile && (
          <div style={{ padding: "6px 10px 0", background: T.surface2, flexShrink: 0 }}>
            <Input value={input} onChange={setInput} placeholder={`Value to ${isStack ? "push" : "enqueue"}…`} onEnter={push} mono style={{ fontSize: 12 }} />
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? "12px 12px" : "20px 32px", position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)} {...infoData[mode]} />}

          {/* Mode labels */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            {!mobile && (
              <ChipStrip
                options={[["stack","📚 Stack"],["queue","🚶 Queue"]]}
                active={mode} onSelect={m => { setMode(m); reset(); }}
              />
            )}
            <div style={{ fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace" }}>
              {items.length}/10 items
            </div>
          </div>

          {/* Visualization */}
          <div style={{ display: "flex", gap: 40, alignItems: "flex-start", justifyContent: "center", width: "100%" }}>
            {isStack ? (
              /* Stack — vertical column */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginBottom: 6 }}>↑ TOP</div>
                {items.length === 0 ? (
                  <div style={{ width: mobile ? 110 : 140, height: 44, borderRadius: 10, border: `1px dashed ${T.surface3}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 11, color: T.muted }}>empty</span>
                  </div>
                ) : displayItems.map((item, i) => {
                  const realIdx = items.length - 1 - i;
                  const isHL = realIdx === highlight;
                  const isTop = i === 0;
                  return (
                    <div key={item.id} className={isHL ? "pop" : ""} style={{
                      width: mobile ? 110 : 140, height: 44,
                      borderRadius: isTop ? "10px 10px 0 0" : i === displayItems.length - 1 ? "0 0 10px 10px" : 0,
                      border: `1px solid ${isHL ? T.accent : isTop ? T.accent + "88" : T.border2}`,
                      borderBottom: i < displayItems.length - 1 ? "none" : undefined,
                      background: isHL ? T.accentSoft : isTop ? T.surface3 : T.surface2,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0 12px", transition: "all .2s",
                      boxShadow: isHL ? `0 0 14px ${T.accent}55` : "none",
                    }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 12 : 14, color: isHL ? T.accent : isTop ? T.text : T.muted2 }}>{item.val}</span>
                      {isTop && <span style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>TOP</span>}
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>↓ BOTTOM</div>
              </div>
            ) : (
              /* Queue — horizontal row */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>FRONT →</span>
                  <div style={{ display: "flex", gap: 0, overflowX: "auto", maxWidth: mobile ? 280 : 420 }}>
                    {items.length === 0 ? (
                      <div style={{ width: 110, height: 52, borderRadius: 10, border: `1px dashed ${T.surface3}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, color: T.muted }}>empty</span>
                      </div>
                    ) : items.map((item, i) => {
                      const isHL = i === highlight;
                      const isFront = i === 0, isRear = i === items.length - 1;
                      return (
                        <div key={item.id} className={isHL ? "pop" : ""} style={{
                          width: mobile ? 54 : 64, height: 52, flexShrink: 0,
                          borderRadius: isFront ? "10px 0 0 10px" : isRear ? "0 10px 10px 0" : 0,
                          border: `1px solid ${isHL ? T.accent : T.border2}`,
                          borderLeft: i > 0 ? "none" : undefined,
                          background: isHL ? T.accentSoft : isFront ? T.greenSoft : isRear ? T.purpleSoft : T.surface2,
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          gap: 2, transition: "all .2s",
                          boxShadow: isHL ? `0 0 12px ${T.accent}55` : "none",
                        }}>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 11 : 13, color: isHL ? T.accent : T.muted2 }}>{item.val}</span>
                          {isFront && <span style={{ fontSize: 8, color: T.green, fontWeight: 700 }}>FRONT</span>}
                          {isRear && !isFront && <span style={{ fontSize: 8, color: T.purple, fontWeight: 700 }}>REAR</span>}
                        </div>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 10, color: T.purple, fontWeight: 700 }}>← REAR</span>
                </div>
                {/* Array internals view */}
                <div style={{ fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace", marginTop: 4 }}>
                  Internal array: [{items.map(i => i.val).join(", ")}]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34 }}>{label}</div>

        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Stack / Queue">{controlsContent}</BottomSheet>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. LINKED LIST
═══════════════════════════════════════════════════════════════ */
function LinkedListViz() {
  const mobile = useIsMobile();
  const [nodes, setNodes] = useState([
    { id: 1, val: "10" }, { id: 2, val: "20" }, { id: 3, val: "30" }, { id: 4, val: "40" }
  ]);
  const [input, setInput] = useState("");
  const [posInput, setPosInput] = useState("0");
  const [highlight, setHighlight] = useState([]); // ids
  const [log, setLog] = useState([]);
  const [label, setLabel] = useState("Singly Linked List — 4 nodes");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const nextId = useRef(100);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-20), { m, t }]);

  const hl = async (ids, delay = 500) => {
    setHighlight(ids);
    await sleep(delay);
    setHighlight([]);
  };

  const insertAt = async () => {
    const v = input.trim() || String(Math.floor(Math.random() * 99 + 1));
    const pos = Math.max(0, Math.min(parseInt(posInput) || 0, nodes.length));
    setInput("");
    const newNode = { id: nextId.current++, val: v };
    // Traverse highlight
    for (let i = 0; i <= pos; i++) {
      if (nodes[i]) { setHighlight([nodes[i].id]); await sleep(250); }
    }
    setNodes(prev => { const a = [...prev]; a.splice(pos, 0, newNode); return a; });
    setHighlight([newNode.id]);
    setTimeout(() => setHighlight([]), 600);
    setLabel(`insert(${v}) at position ${pos}`);
    addLog(`insert(${v}) at [${pos}]`, "ok");
  };

  const deleteAt = async (idx) => {
    if (!nodes.length) return;
    const i = idx !== undefined ? idx : Math.max(0, Math.min(parseInt(posInput) || 0, nodes.length - 1));
    for (let j = 0; j <= i; j++) {
      if (nodes[j]) { setHighlight([nodes[j].id]); await sleep(200); }
    }
    const v = nodes[i]?.val;
    setHighlight([nodes[i]?.id]);
    await sleep(300);
    setNodes(prev => prev.filter((_, pi) => pi !== i));
    setHighlight([]);
    setLabel(`delete at position ${i} → removed ${v}`);
    addLog(`delete[${i}] = ${v}`, "warn");
  };

  const reverse = async () => {
    const reversed = [...nodes].reverse();
    for (let i = 0; i < nodes.length; i++) {
      setHighlight([nodes[i].id]);
      await sleep(150);
    }
    setNodes(reversed);
    setHighlight([]);
    setLabel("List reversed ✓");
    addLog("reversed", "ok");
  };

  const searchNode = async () => {
    const v = input.trim();
    if (!v) return;
    let found = false;
    for (let i = 0; i < nodes.length; i++) {
      setHighlight([nodes[i].id]);
      setLabel(`Checking node[${i}] = ${nodes[i].val}…`);
      await sleep(300);
      if (nodes[i].val === v) {
        found = true;
        setLabel(`Found "${v}" at index ${i} ✓`);
        addLog(`found "${v}" at [${i}]`, "ok");
        await sleep(800);
        break;
      }
    }
    if (!found) { setLabel(`"${v}" not found`); addLog(`"${v}" not found`, "err"); }
    setHighlight([]);
  };

  const reset = () => {
    setNodes([{ id: 1, val: "10" }, { id: 2, val: "20" }, { id: 3, val: "30" }, { id: 4, val: "40" }]);
    setLog([]); setHighlight([]); setLabel("Reset to default");
  };

  const SVG_H = mobile ? 90 : 110;
  const NODE_W = mobile ? 48 : 62, NODE_H = mobile ? 36 : 44, NODE_R = 8;
  const GAP = mobile ? 32 : 44;
  const totalW = nodes.length * NODE_W + (nodes.length - 1) * GAP;

  const controlsContent = (
    <>
      <div><SLabel>Value</SLabel><div style={{ marginTop: 6 }}><Input value={input} onChange={setInput} placeholder="value" mono /></div></div>
      <div><SLabel>Position</SLabel><div style={{ marginTop: 6 }}><Input value={posInput} onChange={setPosInput} placeholder="0" mono /></div></div>
      <Btn onClick={insertAt} variant="primary" full>⊕ Insert at pos</Btn>
      <Btn onClick={() => deleteAt()} variant="red" disabled={!nodes.length} full>⊖ Delete at pos</Btn>
      <Btn onClick={searchNode} variant="teal" full>🔍 Search value</Btn>
      <Btn onClick={reverse} variant="yellow" disabled={nodes.length < 2} full>⇄ Reverse list</Btn>
      <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>Singly Linked List</strong><br /><br />
        Each node holds a value and a pointer to the next node.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Insert head/tail" val="O(1)" color={T.green} />
          <CRow op="Insert at pos" val="O(n)" color={T.yellow} />
          <CRow op="Delete" val="O(n)" color={T.yellow} />
          <CRow op="Search" val="O(n)" color={T.yellow} />
          <CRow op="Random access" val="O(n)" color={T.red} />
        </div>
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={input} onChange={setInput} placeholder="Value…" mono style={{ fontSize: 11, width: 80 }} />
            <Input value={posInput} onChange={setPosInput} placeholder="Pos" mono style={{ fontSize: 11, width: 46 }} />
            <Btn onClick={insertAt} variant="primary" sm>⊕</Btn>
            <Btn onClick={() => deleteAt()} variant="red" disabled={!nodes.length} sm>⊖</Btn>
            <Btn onClick={searchNode} variant="teal" sm>🔍</Btn>
            <Btn onClick={reverse} variant="yellow" disabled={nodes.length < 2} sm>⇄</Btn>
            <Btn onClick={reset} variant="ghost" sm>↺</Btn>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? 10 : 24, position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Linked List" desc="Each node points to the next. No random access — you must traverse." time="O(n) search" space="O(n)" note="Pointer-based" />}

          {nodes.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 13 }}>List is empty — insert a node</div>
          ) : (
            <div style={{ overflowX: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
              <svg width={Math.max(totalW + 40, 300)} height={SVG_H} style={{ overflow: "visible" }}>
                {/* HEAD label */}
                <text x={20} y={SVG_H / 2 - 4} textAnchor="middle" fill={T.accent} fontSize="10" fontFamily="Space Mono" fontWeight="700">HEAD</text>
                <text x={20} y={SVG_H / 2 + 10} textAnchor="middle" fill={T.accent} fontSize="8" fontFamily="Space Mono">↓</text>

                {nodes.map((node, i) => {
                  const x = 36 + i * (NODE_W + GAP);
                  const y = (SVG_H - NODE_H) / 2;
                  const isHL = highlight.includes(node.id);
                  const col = isHL ? T.accent : T.blue;

                  return (
                    <g key={node.id}>
                      {/* Arrow from prev */}
                      {i > 0 && (
                        <g>
                          <line
                            x1={36 + (i-1) * (NODE_W + GAP) + NODE_W}
                            y1={SVG_H / 2}
                            x2={x - 6}
                            y2={SVG_H / 2}
                            stroke={isHL ? T.accent : T.surface3}
                            strokeWidth={isHL ? 2 : 1.5}
                          />
                          <polygon
                            points={`${x-6},${SVG_H/2-4} ${x-6},${SVG_H/2+4} ${x},${SVG_H/2}`}
                            fill={isHL ? T.accent : T.surface3}
                          />
                        </g>
                      )}

                      {/* Node box — split: val | next */}
                      <rect x={x} y={y} width={NODE_W * 0.65} height={NODE_H} rx={NODE_R} ry={0}
                        fill={isHL ? T.accentSoft : T.surface2}
                        stroke={isHL ? T.accent : T.border2} strokeWidth={isHL ? 2 : 1} />
                      <rect x={x + NODE_W * 0.65} y={y} width={NODE_W * 0.35} height={NODE_H} rx={0} ry={NODE_R}
                        fill={isHL ? T.accentSoft : T.surface3}
                        stroke={isHL ? T.accent : T.border2} strokeWidth={isHL ? 2 : 1} />
                      <line x1={x + NODE_W * 0.65} y1={y} x2={x + NODE_W * 0.65} y2={y + NODE_H} stroke={isHL ? T.accent + "66" : T.border2} strokeWidth={1} />

                      {/* Value */}
                      <text x={x + NODE_W * 0.32} y={SVG_H / 2 + 5} textAnchor="middle"
                        fill={isHL ? T.accent : T.text} fontSize={mobile ? 11 : 13}
                        fontFamily="Space Mono" fontWeight="700">{node.val}</text>

                      {/* Next pointer dot */}
                      {i < nodes.length - 1 ? (
                        <circle cx={x + NODE_W * 0.825} cy={SVG_H / 2} r={3}
                          fill={isHL ? T.accent : T.muted} />
                      ) : (
                        <text x={x + NODE_W * 0.825} y={SVG_H / 2 + 4} textAnchor="middle"
                          fill={T.red} fontSize="9" fontFamily="Space Mono">∅</text>
                      )}

                      {/* Index label */}
                      <text x={x + NODE_W / 2} y={y + NODE_H + 14} textAnchor="middle"
                        fill={T.muted} fontSize="9" fontFamily="Space Mono">[{i}]</text>

                      {/* Delete button on node click */}
                      <rect x={x} y={y} width={NODE_W} height={NODE_H}
                        fill="transparent" style={{ cursor: "pointer" }}
                        onClick={() => deleteAt(i)} />
                    </g>
                  );
                })}

                {/* NULL terminator */}
                {nodes.length > 0 && (
                  <text
                    x={36 + nodes.length * (NODE_W + GAP) - GAP + NODE_W + 12}
                    y={SVG_H / 2 + 4}
                    fill={T.red} fontSize="11" fontFamily="Space Mono" fontWeight="700">NULL</text>
                )}
              </svg>
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace" }}>
            {mobile ? "Tap a node to delete it" : "Click a node to delete it • Use controls to insert/search/reverse"}
          </div>
        </div>

        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34 }}>{label}</div>

        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Linked List Controls">{controlsContent}</BottomSheet>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. BINARY SEARCH
═══════════════════════════════════════════════════════════════ */
function BinarySearchViz() {
  const mobile = useIsMobile();
  const [arrInput, setArrInput] = useState("2 5 8 12 16 23 31 42 50 64 77 85 93");
  const [target, setTarget] = useState("42");
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const vizRef = useRef();

  useSwipe(vizRef,
    () => stepIdx < steps.length - 1 && setStepIdx(i => i + 1),
    () => stepIdx > 0 && setStepIdx(i => i - 1)
  );

  const build = () => {
    const arr = [...new Set(arrInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n)))].sort((a,b) => a-b);
    const t = parseInt(target);
    const ss = [];
    let lo = 0, hi = arr.length - 1;
    ss.push({ arr, lo, hi, mid: null, found: null, desc: `Start: lo=0, hi=${arr.length-1}, target=${t}` });
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid] === t) {
        ss.push({ arr, lo, hi, mid, found: mid, desc: `✓ arr[${mid}]=${arr[mid]} === ${t} — Found!` });
        break;
      } else if (arr[mid] < t) {
        ss.push({ arr, lo, hi, mid, found: null, desc: `arr[${mid}]=${arr[mid]} < ${t} → search right half` });
        lo = mid + 1;
      } else {
        ss.push({ arr, lo, hi, mid, found: null, desc: `arr[${mid}]=${arr[mid]} > ${t} → search left half` });
        hi = mid - 1;
      }
    }
    if (!ss[ss.length-1].found !== null && ss[ss.length-1].found === null && lo > hi) {
      ss.push({ arr, lo: -1, hi: -1, mid: null, found: null, notFound: true, desc: `✗ ${t} not in array` });
    }
    setSteps(ss);
    setStepIdx(0);
  };

  const step = steps[stepIdx];
  const cellSz = mobile ? 34 : 44;

  // Derive active pseudocode line from step
  const pseudoLine = !step ? -1 :
    stepIdx === 0 ? 1 :
    step.found !== null ? (step.found !== undefined && step.found >= 0 ? 4 : 7) :
    step.lo > step.hi ? 7 :
    step.mid === null ? 2 :
    step.arr?.[step.mid] !== undefined && parseInt(target) === step.arr[step.mid] ? 4 :
    step.arr?.[step.mid] < parseInt(target) ? 5 : 6;

  const { playing, toggle } = useStepPlayer(steps, stepIdx, setStepIdx, 700);

  const controlsContent = (
    <>
      <div><SLabel>Array (auto-sorted)</SLabel><div style={{ marginTop: 6 }}><Input value={arrInput} onChange={setArrInput} placeholder="space-separated numbers" mono /></div></div>
      <div><SLabel>Target</SLabel><div style={{ marginTop: 6 }}><Input value={target} onChange={setTarget} placeholder="42" mono onEnter={build} /></div></div>
      <Btn onClick={build} variant="primary" full>🔍 Run Binary Search</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>Binary Search</strong><br /><br />
        Requires sorted array. Eliminate half the search space each step — O(log n) vs O(n) linear.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Best" val="O(1)" color={T.green} />
          <CRow op="Average/Worst" val="O(log n)" color={T.yellow} />
          <CRow op="Space" val="O(1)" color={T.green} />
          <CRow op="Requires" val="Sorted array" color={T.teal} />
        </div>
        <div style={{ marginTop: 8, fontSize: 10, fontFamily: "'Space Mono',monospace", color: T.muted }}>
          mid = ⌊(lo + hi) / 2⌋
        </div>
      </InfoBox>
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={target} onChange={setTarget} placeholder="Target…" onEnter={build} mono style={{ fontSize: 11, width: 80 }} />
            <Btn onClick={build} variant="primary" sm>🔍 Search</Btn>
            <Btn onClick={() => setSheetOpen(true)} variant="ghost" sm>Array</Btn>
          </MobileStrip>
        )}

        <div ref={vizRef} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? "10px 8px" : "20px 28px", position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Binary Search" desc="Eliminate half the array each step. Must be sorted." time="O(log n)" space="O(1)" note="Requires sorted" />}

          {!step ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
              <div style={{ color: T.muted2, fontSize: 13 }}>Enter a target and click Search</div>
              {mobile && <div style={{ color: T.muted, fontSize: 11, marginTop: 6 }}>Swipe ← → to step through</div>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: mobile ? 16 : 24, width: "100%" }}>
              {/* Target display */}
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Target</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 22 : 28, fontWeight: 700, color: step.found !== null ? T.green : T.accent }}>{target}</div>
                </div>
                {step.mid !== null && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Mid value</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 22 : 28, fontWeight: 700, color: T.yellow }}>{step.arr[step.mid]}</div>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Remaining</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 22 : 28, fontWeight: 700, color: T.teal }}>
                    {step.lo >= 0 && step.hi >= step.lo ? step.hi - step.lo + 1 : 0}
                  </div>
                </div>
              </div>

              {/* Array cells */}
              <div style={{ display: "flex", gap: mobile ? 3 : 5, overflowX: "auto", maxWidth: "100%", padding: "10px 4px" }}>
                {step.arr.map((v, i) => {
                  const isMid = i === step.mid;
                  const inRange = step.lo >= 0 && i >= step.lo && i <= step.hi;
                  const isFound = i === step.found;
                  const isElim = !inRange && step.lo >= 0;

                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {/* Pointer label */}
                      <div style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                        {i === step.lo && step.lo >= 0 && <span style={{ fontSize: 8, color: T.green, fontWeight: 700 }}>LO</span>}
                        {i === step.hi && step.hi >= 0 && i !== step.lo && <span style={{ fontSize: 8, color: T.red, fontWeight: 700 }}>HI</span>}
                        {isMid && <span style={{ fontSize: 8, color: T.yellow, fontWeight: 700 }}>MID</span>}
                      </div>
                      <div className={isMid ? "glw" : ""} style={{
                        width: cellSz, height: cellSz,
                        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 11 : 13,
                        background: isFound ? T.greenSoft : isMid ? T.yellowSoft : isElim ? T.surface3 + "44" : T.surface2,
                        border: `2px solid ${isFound ? T.green : isMid ? T.yellow : i === step.lo ? T.green + "66" : i === step.hi ? T.red + "66" : isElim ? T.surface3 : T.border2}`,
                        color: isFound ? T.green : isMid ? T.yellow : isElim ? T.muted + "55" : T.muted2,
                        opacity: isElim ? 0.35 : 1,
                        boxShadow: isFound ? `0 0 14px ${T.green}77` : isMid ? `0 0 10px ${T.yellow}55` : "none",
                        transition: "all .25s",
                        textDecoration: isElim ? "line-through" : "none",
                      }}>{v}</div>
                      <div style={{ fontSize: 8, color: T.muted, fontFamily: "'Space Mono',monospace" }}>[{i}]</div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {[
                  { c: T.yellow, l: "MID" }, { c: T.green, l: "LO/Found" }, { c: T.red, l: "HI" },
                  { c: T.muted + "55", l: "Eliminated" },
                ].map(({ c, l }) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.muted }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{l}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {step && (
          <StepFooter
            label={step.desc} stepIdx={stepIdx} total={steps.length}
            onBack={() => setStepIdx(i => Math.max(0, i - 1))}
            onFwd={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
            mobile={mobile} playing={playing} onTogglePlay={toggle}
          />
        )}

        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Binary Search Setup">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO.binarySearch} activeLine={pseudoLine} label="Binary Search" mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. HASH TABLE
═══════════════════════════════════════════════════════════════ */
function HashTableViz() {
  const mobile = useIsMobile();
  const SIZE = 11;
  const [mode, setMode] = useState("linear");
  const [table, setTable] = useState(Array.from({ length: SIZE }, () => []));
  const [val, setVal] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [highlighted, setHighlighted] = useState([]);
  const [log, setLog] = useState([]);
  const [label, setLabel] = useState("Insert values to see hashing");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const hash = k => ((k % SIZE) + SIZE) % SIZE;
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-25), { m, t }]);

  const insert = async () => {
    const k = parseInt(val) || Math.floor(Math.random() * 88 + 1);
    setVal("");
    const h = hash(k); const t = [...table.map(b => [...b])];
    addLog(`hash(${k}) = ${k}%${SIZE} = ${h}`, "info");
    if (mode === "chaining") {
      setHighlighted([h]); await sleep(400); t[h] = [...t[h], k];
      setTable(t); setHighlighted([]); addLog(`${k} → chain [${h}]`, "ok");
      setLabel(`insert(${k}) — hash=${h}, chained at bucket [${h}]`);
    } else {
      let idx = h, probes = 0;
      while (t[idx].length > 0 && probes < SIZE) {
        setHighlighted([idx]); addLog(`[${idx}] occupied → probe +1`, "warn");
        setLabel(`Collision at [${idx}] → linear probe`); await sleep(300);
        idx = (idx + 1) % SIZE; probes++;
      }
      if (probes >= SIZE) { addLog("Table full!", "err"); return; }
      setHighlighted([idx]); await sleep(300);
      t[idx] = [k]; setTable(t); setHighlighted([]);
      addLog(`${k} → slot [${idx}] (${probes} probe${probes !== 1 ? "s" : ""})`, "ok");
      setLabel(`insert(${k}) — hash=${h}, placed at [${idx}]`);
    }
  };

  const search = async () => {
    const k = parseInt(searchVal); if (isNaN(k)) return;
    const h = hash(k);
    if (mode === "chaining") {
      setHighlighted([h]); await sleep(400);
      const found = table[h].includes(k);
      setLabel(`search(${k}) → bucket [${h}]: ${found ? "✓ found" : "✗ not found"}`);
      addLog(`[${h}]: ${found ? "found" : "not found"}`, found ? "ok" : "err");
      setTimeout(() => setHighlighted([]), 900);
    } else {
      let idx = h, probes = 0;
      while (probes < SIZE) {
        setHighlighted([idx]); await sleep(300);
        if (!table[idx].length) { setLabel(`search(${k}) → ✗ not found`); addLog("not found", "err"); setTimeout(() => setHighlighted([]), 800); return; }
        if (table[idx][0] === k) { setLabel(`search(${k}) → ✓ found at [${idx}]`); addLog(`found at [${idx}]`, "ok"); setTimeout(() => setHighlighted([]), 800); return; }
        idx = (idx + 1) % SIZE; probes++;
      }
      addLog("not found", "err");
    }
    setSearchVal("");
  };

  const reset = () => { setTable(Array.from({ length: SIZE }, () => [])); setHighlighted([]); addLog("reset", "info"); };
  const load = () => { [14, 27, 4, 36, 18, 52, 7].forEach((v, i) => setTimeout(() => { setVal(String(v)); }, i * 100)); };

  const loadFactor = table.flat().length / SIZE;
  const loadColor = loadFactor > 0.7 ? T.red : loadFactor > 0.4 ? T.yellow : T.green;

  const controlsContent = (
    <>
      <div>
        <SLabel>Strategy</SLabel>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {[["linear","Linear Probe"],["chaining","Chaining"]].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); reset(); }} style={{ flex: 1, padding: "7px 6px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: mode === k ? T.accentSoft : T.surface2, border: `1px solid ${mode === k ? T.accent+"66" : T.border2}`, color: mode === k ? T.accent : T.muted2 }}>{l}</button>
          ))}
        </div>
      </div>
      <div><SLabel>Insert Key</SLabel><div style={{ marginTop: 6 }}><Input value={val} onChange={setVal} placeholder="integer" onEnter={insert} mono /></div></div>
      <Btn onClick={insert} variant="primary" full>⊕ Insert</Btn>
      <Btn onClick={load} variant="ghost" full>⚡ Load example</Btn>
      <div><SLabel>Search Key</SLabel><div style={{ marginTop: 6 }}><Input value={searchVal} onChange={setSearchVal} placeholder="find key" onEnter={search} mono /></div></div>
      <Btn onClick={search} variant="teal" full>🔍 Search</Btn>
      <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>{mode === "linear" ? "Linear Probing" : "Chaining"}</strong><br /><br />
        hash(k) = k mod {SIZE}
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Insert avg" val="O(1)" color={T.green} />
          <CRow op="Search avg" val="O(1)" color={T.green} />
          <CRow op="Worst case" val="O(n)" color={T.red} />
          <CRow op="Load factor" val={loadFactor.toFixed(2)} color={loadColor} />
        </div>
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {mobile && (
          <MobileStrip>
            <ChipStrip options={[["linear","Linear"],["chaining","Chain"]]} active={mode} onSelect={m => { setMode(m); reset(); }} />
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <button onClick={reset} style={{ padding: "5px 10px", borderRadius: 100, fontSize: 12, cursor: "pointer", background: T.surface3, border: `1px solid ${T.border2}`, color: T.muted2 }}>↺</button>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: mobile ? "10px 10px" : "16px 20px", overflowY: "auto", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Hash Table" desc="Maps keys to buckets via hash function. Fast O(1) average insert/search." time="O(1) avg" space="O(n)" note={`Load: ${(loadFactor*100).toFixed(0)}%`} />}

          <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 3 : 4, width: "100%", maxWidth: 500 }}>
            {/* Load factor bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap" }}>Load: {(loadFactor*100).toFixed(0)}%</span>
              <div style={{ flex: 1, height: 4, background: T.surface3, borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${loadFactor*100}%`, background: loadColor, borderRadius: 2, transition: "all .3s" }} />
              </div>
            </div>
            {table.map((bucket, i) => {
              const isHL = highlighted.includes(i), isEmpty = bucket.length === 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: mobile ? 6 : 8 }}>
                  <div style={{ width: mobile ? 26 : 32, height: mobile ? 28 : 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 9 : 11, fontWeight: 700, flexShrink: 0, background: isHL ? T.yellowSoft : T.surface3, color: isHL ? T.yellow : T.muted, border: `1px solid ${isHL ? T.yellow : T.surface3}`, transition: "all .2s", boxShadow: isHL ? `0 0 10px ${T.yellow}66` : "none" }}>{i}</div>
                  <div style={{ flex: 1, minHeight: mobile ? 28 : 32, borderRadius: 9, border: `1px solid ${isHL ? T.yellow : isEmpty ? T.surface3 : T.border2}`, background: isHL ? T.yellowSoft : isEmpty ? "transparent" : T.surface2, display: "flex", alignItems: "center", gap: 4, padding: "0 8px", transition: "all .2s" }}>
                    {isEmpty ? <span style={{ color: T.surface3, fontSize: mobile ? 9 : 11, fontFamily: "'Space Mono',monospace" }}>—</span> :
                      bucket.map((v, bi) => (
                        <div key={bi} style={{ background: T.accentSoft, border: `1px solid ${T.accent}44`, borderRadius: 6, padding: mobile ? "2px 6px" : "3px 9px", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 10 : 11, fontWeight: 700, color: T.accent, display: "flex", alignItems: "center", gap: 3 }} className="pop">
                          {v}{mode === "chaining" && bi < bucket.length - 1 && <span style={{ color: T.muted, fontSize: 9 }}>→</span>}
                        </div>
                      ))}
                  </div>
                  {bucket.length > 1 && (
                    <div style={{ width: 3, height: Math.min(24, 5 * bucket.length), borderRadius: 2, background: bucket.length > 3 ? T.red : T.yellow, flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {mobile && (
          <div style={{ padding: "8px 10px", borderTop: `1px solid ${T.border}`, background: T.surface2, flexShrink: 0, display: "flex", gap: 6 }}>
            <Input value={val} onChange={setVal} placeholder="Insert key…" onEnter={insert} mono style={{ fontSize: 12 }} />
            <Btn onClick={insert} variant="primary" sm>⊕</Btn>
            <Input value={searchVal} onChange={setSearchVal} placeholder="Search…" onEnter={search} mono style={{ fontSize: 12 }} />
            <Btn onClick={search} variant="teal" sm>🔍</Btn>
          </div>
        )}

        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 34 }}>
          <div style={{ fontSize: mobile ? 11 : 12, color: T.muted2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }} dangerouslySetInnerHTML={{ __html: label }} />
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 10 : 11, color: T.muted, flexShrink: 0, marginLeft: 8 }}>{table.flat().length}/{SIZE}</div>
        </div>
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Hash Controls">{controlsContent}</BottomSheet>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. BST
═══════════════════════════════════════════════════════════════ */
function BSTViz() {
  const mobile = useIsMobile();
  const [tree, setTree] = useState(null);
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState([]);
  const [traversalPath, setTraversalPath] = useState([]);
  const [log, setLog] = useState([]);
  const [label, setLabel] = useState("Insert values to build BST");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-20), { m, t }]);

  const insert = (node, val) => {
    if (!node) return { val, left: null, right: null };
    if (val < node.val) return { ...node, left: insert(node.left, val) };
    if (val > node.val) return { ...node, right: insert(node.right, val) };
    return node;
  };

  const insertVal = async () => {
    const v = parseInt(input) || Math.floor(Math.random() * 90 + 5);
    setInput("");
    setTree(t => insert(t, v));
    setHighlight([v]);
    setTimeout(() => setHighlight([]), 700);
    setLabel(`insert(${v}) ✓`);
    addLog(`insert(${v})`, "ok");
  };

  const doTraversal = async (type) => {
    if (!tree) return;
    const result = [];
    const collect = (node) => {
      if (!node) return;
      if (type === "inorder") { collect(node.left); result.push(node.val); collect(node.right); }
      else if (type === "preorder") { result.push(node.val); collect(node.left); collect(node.right); }
      else { collect(node.left); collect(node.right); result.push(node.val); }
    };
    collect(tree);
    setTraversalPath([]);
    for (let i = 0; i < result.length; i++) {
      setTraversalPath(result.slice(0, i + 1));
      setHighlight([result[i]]);
      setLabel(`${type}: visiting ${result[i]} — [${result.slice(0, i+1).join(" → ")}]`);
      await sleep(500);
    }
    setHighlight([]);
    setLabel(`${type} complete: [${result.join(", ")}]`);
    addLog(`${type}: [${result.join(", ")}]`, "ok");
  };

  const searchVal = async () => {
    const v = parseInt(input); if (isNaN(v)) return;
    let node = tree;
    while (node) {
      setHighlight([node.val]);
      setLabel(`Comparing ${node.val} vs ${v}…`);
      await sleep(450);
      if (node.val === v) { setLabel(`✓ Found ${v}!`); addLog(`found ${v}`, "ok"); setTimeout(() => setHighlight([]), 800); return; }
      node = v < node.val ? node.left : node.right;
    }
    setLabel(`✗ ${v} not in BST`); addLog(`${v} not found`, "err");
    setHighlight([]);
  };

  const reset = () => { setTree(null); setLog([]); setHighlight([]); setTraversalPath([]); setLabel("Cleared"); };
  const loadExample = () => {
    let t = null;
    [50, 30, 70, 20, 40, 60, 80, 10, 35].forEach(v => { t = insert(t, v); });
    setTree(t); setLabel("Example BST loaded");
  };

  // Layout calculation
  const positions = {};
  const assignPos = (node, depth, lo, hi) => {
    if (!node) return;
    const x = (lo + hi) / 2;
    positions[node.val] = { x, y: depth };
    assignPos(node.left, depth + 1, lo, x);
    assignPos(node.right, depth + 1, x, hi);
  };
  if (tree) assignPos(tree, 0, 0, 1);

  const W = mobile ? 320 : 480, H = mobile ? 240 : 320;
  const R = mobile ? 17 : 22;
  const maxDepth = Math.max(...Object.values(positions).map(p => p.y), 0) + 1;
  const SVGNodes = Object.entries(positions).map(([val, pos]) => ({
    val: parseInt(val), x: pos.x * W, y: 30 + pos.y * (H / (maxDepth + 0.5))
  }));

  const edges = [];
  const collectEdges = (node) => {
    if (!node) return;
    if (node.left) { const p = positions[node.val], c = positions[node.left.val]; edges.push({ x1: p.x * W, y1: 30 + p.y * H / (maxDepth + 0.5), x2: c.x * W, y2: 30 + c.y * H / (maxDepth + 0.5) }); collectEdges(node.left); }
    if (node.right) { const p = positions[node.val], c = positions[node.right.val]; edges.push({ x1: p.x * W, y1: 30 + p.y * H / (maxDepth + 0.5), x2: c.x * W, y2: 30 + c.y * H / (maxDepth + 0.5) }); collectEdges(node.right); }
  };
  collectEdges(tree);

  const controlsContent = (
    <>
      <div><SLabel>Value</SLabel><div style={{ marginTop: 6 }}><Input value={input} onChange={setInput} placeholder="integer" onEnter={insertVal} mono /></div></div>
      <div style={{ display: "flex", gap: 6 }}>
        <Btn onClick={insertVal} variant="primary" style={{ flex: 1 }}>⊕ Insert</Btn>
        <Btn onClick={searchVal} variant="teal" disabled={!tree} style={{ flex: 1 }}>🔍</Btn>
      </div>
      <Btn onClick={loadExample} variant="ghost" full>⚡ Load example</Btn>
      <Btn onClick={reset} variant="ghost" full>↺ Reset</Btn>
      <div><SLabel>Traversals</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          <Btn onClick={() => doTraversal("inorder")} variant="green" disabled={!tree} full>Inorder (L→Root→R)</Btn>
          <Btn onClick={() => doTraversal("preorder")} variant="blue" disabled={!tree} full>Preorder (Root→L→R)</Btn>
          <Btn onClick={() => doTraversal("postorder")} variant="orange" disabled={!tree} full>Postorder (L→R→Root)</Btn>
        </div>
      </div>
      <InfoBox>
        <strong style={{ color: T.text }}>Binary Search Tree</strong><br /><br />
        left &lt; node &lt; right. Inorder gives sorted order.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Search" val="O(log n) avg" color={T.green} />
          <CRow op="Insert" val="O(log n) avg" color={T.green} />
          <CRow op="Worst (skewed)" val="O(n)" color={T.red} />
        </div>
      </InfoBox>
      {traversalPath.length > 0 && <InfoBox><SLabel>Path</SLabel><div style={{ marginTop: 4, fontFamily: "'Space Mono',monospace", fontSize: 10, color: T.accent }}>{traversalPath.join(" → ")}</div></InfoBox>}
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={input} onChange={setInput} placeholder="Value…" onEnter={insertVal} mono style={{ fontSize: 11, width: 80 }} />
            <Btn onClick={insertVal} variant="primary" sm>⊕ Insert</Btn>
            <Btn onClick={searchVal} variant="teal" disabled={!tree} sm>🔍</Btn>
            <Btn onClick={() => doTraversal("inorder")} variant="green" disabled={!tree} sm>In</Btn>
            <Btn onClick={() => doTraversal("preorder")} variant="blue" disabled={!tree} sm>Pre</Btn>
            <Btn onClick={() => doTraversal("postorder")} variant="orange" disabled={!tree} sm>Post</Btn>
            <Btn onClick={loadExample} variant="ghost" sm>⚡</Btn>
            <Btn onClick={reset} variant="ghost" sm>↺</Btn>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Binary Search Tree" desc="left < root < right. Inorder traversal gives sorted order." time="O(log n) avg" space="O(n)" note="Balanced = fast" />}

          {!tree ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🌳</div>
              <div style={{ color: T.muted2, fontSize: 13 }}>Insert values to grow the tree</div>
            </div>
          ) : (
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
              {edges.map((e, i) => (
                <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={T.surface3} strokeWidth={1.5} />
              ))}
              {SVGNodes.map(({ val, x, y }) => {
                const isHL = highlight.includes(val);
                const isPath = traversalPath.includes(val);
                const col = isHL ? T.yellow : isPath ? T.green : T.blue;
                return (
                  <g key={val}>
                    <circle cx={x} cy={y} r={R}
                      fill={isHL ? T.yellowSoft : isPath ? T.greenSoft : T.surface2}
                      stroke={col} strokeWidth={isHL ? 2.5 : 1.5}
                      style={isHL ? { filter: `drop-shadow(0 0 10px ${T.yellow})` } : {}} />
                    <text x={x} y={y + 4} textAnchor="middle" fill={isHL ? "#fff" : col}
                      fontSize={mobile ? "10" : "12"} fontFamily="Space Mono" fontWeight="700">{val}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34 }}>{label}</div>
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="BST Controls">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel
        lines={traversalPath.length > 0 ? PSEUDO[traversalPath.length > 0 && label.includes("inorder") ? "inorder" : label.includes("preorder") ? "preorder" : "postorder"] : PSEUDO.inorder}
        activeLine={highlight.length > 0 ? 2 : -1}
        label="BST Traversal"
        mobile={mobile}
      />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. HEAP
═══════════════════════════════════════════════════════════════ */
function HeapViz() {
  const mobile = useIsMobile();
  const [heap, setHeap] = useState([]);
  const [val, setVal] = useState("");
  const [highlighted, setHighlighted] = useState([]);
  const [log, setLog] = useState([]);
  const [label, setLabel] = useState("Insert values to build min-heap");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [pseudoLine, setPseudoLine] = useState(-1);
  const [opMode, setOpMode] = useState("insert"); // track insert vs extract for pseudocode
  const stopRef = useRef(false);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-25), { m, t }]);

  const hl = async (h, idxs, msg, t = "info", pLine = -1) => {
    setHighlighted(idxs); setLabel(msg); addLog(msg, t);
    setPseudoLine(pLine);
    setHeap([...h]); await sleep(speed); if (stopRef.current) throw new Error("stopped");
  };

  const insert = async () => {
    if (running) return;
    const v = parseInt(val) || Math.floor(Math.random() * 90 + 2);
    setVal(""); setRunning(true); stopRef.current = false; setOpMode("insert");
    try {
      const h = [...heap, v]; let i = h.length - 1;
      await hl(h, [i], `insert(${v}) at [${i}]`, "ok", 1);
      while (i > 0) {
        const par = Math.floor((i - 1) / 2);
        await hl(h, [i, par], `Compare ${h[i]} < ${h[par]}?`, "info", 4);
        if (h[i] < h[par]) { [h[i], h[par]] = [h[par], h[i]]; await hl(h, [par], `Swap → ${h[par]} bubbles up`, "warn", 5); i = par; }
        else { await hl(h, [i], `${h[i]} ≥ ${h[par]} — heap satisfied ✓`, "ok", 8); break; }
      }
      setHeap([...h]); setHighlighted([]); setLabel(`insert(${v}) done ✓`); setPseudoLine(-1);
    } catch (e) { if (e.message !== "stopped") throw e; }
    setRunning(false);
  };

  const extractMin = async () => {
    if (!heap.length || running) return;
    setRunning(true); stopRef.current = false; setOpMode("extract");
    try {
      const h = [...heap];
      const min = h[0]; addLog(`extract min = ${min}`, "warn");
      h[0] = h[h.length - 1]; h.pop();
      await hl(h, [0], `Moved last to root, sinking down…`, "info", 2);
      let i = 0;
      while (true) {
        let smallest = i, l = 2*i+1, r = 2*i+2;
        if (l < h.length) { await hl(h, [i, l], `Compare root ${h[i]} vs left ${h[l]}`, "info", 5); if (h[l] < h[smallest]) smallest = l; }
        if (r < h.length) { await hl(h, [i, r], `Compare root ${h[i]} vs right ${h[r]}`, "info", 6); if (h[r] < h[smallest]) smallest = r; }
        if (smallest !== i) { [h[i], h[smallest]] = [h[smallest], h[i]]; await hl(h, [smallest], `Swap → sink to [${smallest}]`, "warn", 8); i = smallest; }
        else { await hl(h, [i], `Heap property satisfied ✓`, "ok", 9); break; }
      }
      setHeap([...h]); setHighlighted([]); setLabel(`extractMin() = ${min} ✓`); setPseudoLine(-1);
    } catch (e) { if (e.message !== "stopped") throw e; }
    setRunning(false);
  };

  const loadExample = () => { [12, 3, 7, 18, 5, 9, 1, 24, 15].forEach((v, i) => setTimeout(() => setVal(String(v)), i * 50)); };

  const W = mobile ? 300 : 440, H = mobile ? 180 : 260, R = mobile ? 16 : 20;
  const getPos = (i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const posInRow = i - (Math.pow(2, depth) - 1);
    const totalInRow = Math.pow(2, depth);
    return { x: W * (posInRow + 0.5) / totalInRow, y: (mobile ? 26 : 36) + depth * (mobile ? 48 : 64) };
  };

  const controlsContent = (
    <>
      <div><SLabel>Value</SLabel><div style={{ marginTop: 6 }}><Input value={val} onChange={setVal} placeholder="e.g. 14" onEnter={insert} mono /></div></div>
      <Btn onClick={insert} variant="primary" disabled={running} full>⊕ Insert</Btn>
      <Btn onClick={extractMin} variant="red" disabled={running || !heap.length} full>⊖ Extract Min</Btn>
      <Btn onClick={loadExample} variant="ghost" disabled={running} full>⚡ Load Example</Btn>
      <Btn onClick={() => { setHeap([]); setHighlighted([]); addLog("reset", "info"); }} variant="ghost" disabled={running} full>↺ Reset</Btn>
      <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>
      <InfoBox>
        <strong style={{ color: T.text }}>Min-Heap</strong><br /><br />
        Parent ≤ Children. Root = minimum.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Insert" val="O(log n)" color={T.green} />
          <CRow op="Extract Min" val="O(log n)" color={T.green} />
          <CRow op="Peek Min" val="O(1)" color={T.green} />
        </div>
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8, fontSize: 10, fontFamily: "'Space Mono',monospace", color: T.muted }}>
          parent(i) = ⌊(i-1)/2⌋<br />left = 2i+1 · right = 2i+2
        </div>
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={val} onChange={setVal} placeholder="Value…" onEnter={insert} mono style={{ fontSize: 11, width: 90 }} />
            <Btn onClick={insert} variant="primary" disabled={running} sm>⊕ Insert</Btn>
            <Btn onClick={extractMin} variant="red" disabled={running || !heap.length} sm>⊖ Extract</Btn>
            <Btn onClick={loadExample} disabled={running} variant="ghost" sm>⚡</Btn>
            <Btn onClick={() => { setHeap([]); setHighlighted([]); }} disabled={running} variant="ghost" sm>↺</Btn>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Min-Heap" desc="Parent is always ≤ its children. Root is the minimum. Built as complete binary tree." time="O(log n)" space="O(n)" note="Root = min" />}

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "36px 4px 4px" : "8px" }}>
            {heap.length === 0 ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>⛰</div>
                <div style={{ color: T.muted, fontSize: 13 }}>Insert values to build heap</div>
              </div>
            ) : (
              <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ maxHeight: mobile ? 200 : 280 }}>
                {heap.map((_, i) => {
                  if (i === 0) return null;
                  const par = Math.floor((i - 1) / 2);
                  const p = getPos(i), pp = getPos(par);
                  return <line key={`e${i}`} x1={pp.x} y1={pp.y} x2={p.x} y2={p.y} stroke={highlighted.includes(i) || highlighted.includes(par) ? T.yellow : T.surface3} strokeWidth={highlighted.includes(i) || highlighted.includes(par) ? 2 : 1.5} />;
                })}
                {heap.map((v, i) => {
                  const { x, y } = getPos(i); const isHL = highlighted.includes(i); const isMin = i === 0;
                  const col = isHL ? T.yellow : isMin ? T.accent : T.blue;
                  return (
                    <g key={`n${i}`}>
                      <circle cx={x} cy={y} r={R} fill={isHL ? T.yellowSoft : isMin ? T.accentSoft : T.surface2} stroke={col} strokeWidth={isHL ? 2.5 : 1.5} style={isHL ? { filter: `drop-shadow(0 0 8px ${T.yellow})` } : {}} />
                      <text x={x} y={y + 4} textAnchor="middle" fill={isHL ? "#fff" : col} fontSize={mobile ? "10" : "12"} fontFamily="Space Mono" fontWeight="700">{v}</text>
                      {isMin && <text x={x} y={y - R - 4} textAnchor="middle" fill={T.accent} fontSize="8" fontFamily="DM Sans" fontWeight="700">MIN</text>}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div style={{ padding: "5px 10px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 4, overflowX: "auto", background: T.surface2, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: T.muted, fontFamily: "'Space Mono',monospace", whiteSpace: "nowrap", flexShrink: 0 }}>array:</span>
            {heap.map((v, i) => (
              <div key={i} style={{ width: mobile ? 26 : 32, height: mobile ? 24 : 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 9 : 10, fontWeight: 700, flexShrink: 0, background: highlighted.includes(i) ? T.yellowSoft : T.surface3, border: `1px solid ${highlighted.includes(i) ? T.yellow : T.border2}`, color: highlighted.includes(i) ? T.yellow : T.muted2 }}>{v}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          {heap.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexShrink: 0, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
              <span style={{ color: T.teal }}>size: {heap.length}</span>
              <span style={{ color: T.accent }}>min: {heap[0]}</span>
            </div>
          )}
        </div>
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Heap Controls">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={opMode === "insert" ? PSEUDO.heapInsert : PSEUDO.heapExtract} activeLine={pseudoLine} label={opMode === "insert" ? "Heap Insert" : "Heap Extract"} mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. TRIE
═══════════════════════════════════════════════════════════════ */
function TrieViz() {
  const mobile = useIsMobile();
  const mkNode = () => ({ children: {}, isEnd: false });
  const [trie, setTrie] = useState(() => {
    const root = mkNode();
    const ins = (r, w) => { let n = r; for (const c of w.toLowerCase()) { if (!n.children[c]) n.children[c] = mkNode(); n = n.children[c]; } n.isEnd = true; };
    ["cat","car","card","care","dog","do","dart"].forEach(w => ins(root, w));
    return root;
  });
  const [input, setInput] = useState("");
  const [highlight, setHighlight] = useState([]);
  const [log, setLog] = useState([]);
  const [label, setLabel] = useState("Trie pre-loaded with: cat, car, card, care, dog, do, dart");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-20), { m, t }]);

  const insertWord = async () => {
    const w = input.trim().toLowerCase(); if (!w) return; setInput("");
    const path = [];
    const ins = (node, word, idx) => {
      if (idx === word.length) { node.isEnd = true; return; }
      const c = word[idx];
      if (!node.children[c]) node.children[c] = mkNode();
      path.push(c);
      ins(node.children[c], word, idx + 1);
    };
    const newTrie = JSON.parse(JSON.stringify(trie));
    ins(newTrie, w, 0);
    for (let i = 1; i <= w.length; i++) {
      setHighlight([w.slice(0, i)]); await sleep(300);
    }
    setTrie(newTrie); setHighlight([]);
    setLabel(`insert("${w}") ✓`); addLog(`insert "${w}"`, "ok");
  };

  const searchWord = async () => {
    const w = input.trim().toLowerCase(); if (!w) return;
    let node = trie;
    const path = [];
    for (const c of w) {
      path.push(c); setHighlight([...path.map((_, i) => w.slice(0, i + 1))]);
      await sleep(350);
      if (!node.children[c]) {
        setLabel(`search("${w}") → ✗ not found at '${c}'`);
        addLog(`"${w}" not found`, "err"); setHighlight([]); return;
      }
      node = node.children[c];
    }
    const found = node.isEnd;
    setLabel(`search("${w}") → ${found ? "✓ found (end of word)" : "✗ prefix exists but not a word"}`);
    addLog(`"${w}" ${found ? "found ✓" : "prefix only"}`, found ? "ok" : "warn");
    setTimeout(() => setHighlight([]), 800);
  };

  // Flatten trie for display
  const flatNodes = [];
  const flatEdges = [];
  const buildFlat = (node, prefix, x, y, spread) => {
    const id = prefix || "·";
    flatNodes.push({ id, x, y, isEnd: node.isEnd, isRoot: !prefix });
    const keys = Object.keys(node.children).sort();
    const count = keys.length;
    keys.forEach((c, i) => {
      const cx = x + (i - (count - 1) / 2) * spread;
      const cy = y + (mobile ? 48 : 60);
      const childId = prefix + c;
      flatEdges.push({ x1: x, y1: y, x2: cx, y2: cy, label: c, parentHL: highlight.includes(prefix + c) || highlight.some(h => h.startsWith(prefix + c)) });
      buildFlat(node.children[c], prefix + c, cx, cy, Math.max(spread * 0.6, mobile ? 18 : 22));
    });
  };
  const SVG_W = mobile ? 340 : 500, SVG_H = mobile ? 280 : 360;
  buildFlat(trie, "", SVG_W / 2, 20, mobile ? 80 : 110);

  const controlsContent = (
    <>
      <div><SLabel>Word</SLabel><div style={{ marginTop: 6 }}><Input value={input} onChange={setInput} placeholder="type a word" onEnter={insertWord} mono /></div></div>
      <Btn onClick={insertWord} variant="primary" full>⊕ Insert word</Btn>
      <Btn onClick={searchWord} variant="teal" full>🔍 Search word</Btn>
      <Btn onClick={() => { const root = mkNode(); setTrie(root); setLabel("Cleared"); addLog("reset","info"); }} variant="ghost" full>↺ Reset</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>Trie (Prefix Tree)</strong><br /><br />
        Each node = one character. Shared prefixes share nodes. Perfect for autocomplete.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Insert" val="O(m) m=word len" color={T.green} />
          <CRow op="Search" val="O(m)" color={T.green} />
          <CRow op="Prefix search" val="O(m + outputs)" color={T.teal} />
          <CRow op="Space" val="O(ALPHABET·m·n)" color={T.yellow} />
        </div>
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={input} onChange={setInput} placeholder="Word…" onEnter={insertWord} mono style={{ fontSize: 11, width: 110 }} />
            <Btn onClick={insertWord} variant="primary" sm>⊕ Insert</Btn>
            <Btn onClick={searchWord} variant="teal" sm>🔍 Search</Btn>
            <Btn onClick={() => { const root = mkNode(); setTrie(root); setLabel("Cleared"); }} variant="ghost" sm>↺</Btn>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="Trie (Prefix Tree)" desc="Characters stored node by node. Shared prefixes share paths. Powers autocomplete." time="O(m) insert/search" space="O(nodes)" note="Autocomplete" />}
          <svg width={SVG_W} height={SVG_H} style={{ overflow: "visible" }}>
            {flatEdges.map((e, i) => (
              <g key={i}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={e.parentHL ? T.accent : T.surface3}
                  strokeWidth={e.parentHL ? 2 : 1.2} />
                <text x={(e.x1+e.x2)/2 - 6} y={(e.y1+e.y2)/2} fill={e.parentHL ? T.accent : T.muted}
                  fontSize={mobile ? "9" : "11"} fontFamily="Space Mono" fontWeight="700">{e.label}</text>
              </g>
            ))}
            {flatNodes.map((n) => {
              const isHL = highlight.some(h => h === n.id || n.id.endsWith(h));
              const col = n.isRoot ? T.accent : isHL ? T.yellow : n.isEnd ? T.green : T.blue;
              const r = n.isRoot ? (mobile ? 12 : 15) : (mobile ? 9 : 11);
              return (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={r}
                    fill={isHL ? T.yellowSoft : n.isEnd ? T.greenSoft : T.surface2}
                    stroke={col} strokeWidth={n.isEnd ? 2 : 1.2}
                    style={isHL ? { filter: `drop-shadow(0 0 8px ${T.yellow})` } : {}} />
                  {n.isRoot && <text x={n.x} y={n.y + 4} textAnchor="middle" fill={T.accent} fontSize="9" fontFamily="Space Mono" fontWeight="700">ROOT</text>}
                  {n.isEnd && !n.isRoot && <text x={n.x} y={n.y + 3} textAnchor="middle" fill={T.green} fontSize="8" fontFamily="Space Mono">$</text>}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ padding: mobile ? "7px 12px" : "9px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34 }}>{label}</div>
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Trie Controls">{controlsContent}</BottomSheet>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. SORTING
═══════════════════════════════════════════════════════════════ */
function genArr(n = 14) { return Array.from({ length: n }, () => Math.floor(Math.random() * 88 + 8)); }

const ALGO_INFO = {
  bubble:    { best:"O(n)", avg:"O(n²)", worst:"O(n²)", space:"O(1)", note:"Adaptive: stops early if no swaps." },
  selection: { best:"O(n²)", avg:"O(n²)", worst:"O(n²)", space:"O(1)", note:"Always n² comparisons, minimal swaps." },
  insertion: { best:"O(n)", avg:"O(n²)", worst:"O(n²)", space:"O(1)", note:"Excellent on nearly-sorted data." },
  merge:     { best:"O(n log n)", avg:"O(n log n)", worst:"O(n log n)", space:"O(n)", note:"Stable. Guaranteed O(n log n) always." },
  quick:     { best:"O(n log n)", avg:"O(n log n)", worst:"O(n²)", space:"O(log n)", note:"Fastest in practice. Worst on sorted input." },
};

function SortingViz() {
  const mobile = useIsMobile();
  const [bars, setBars] = useState(() => genArr().map(v => ({ val: v, state: "idle", cmpLabel: "" })));
  const [algo, setAlgo] = useState("bubble");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(350);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ comps: 0, swaps: 0 });
  const [label, setLabel] = useState("Pick an algorithm and press Run");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [pseudoLine, setPseudoLine] = useState(-1);
  const [compareMode, setCompareMode] = useState(false);
  const stopRef = useRef(false);
  const statsRef = useRef({ comps: 0, swaps: 0 });

  const addLog = (m, t = "info") => setLog(l => [...l.slice(-25), { m, t }]);
  const updateBars = (b, msg, t = "info") => { setBars([...b]); setLabel(msg); addLog(msg, t); };
  const tick = (b, msg, t = "info", pLine = -1) => new Promise(res => {
    updateBars(b, msg, t);
    setPseudoLine(pLine);
    setTimeout(() => { if (stopRef.current) res(); else res(); }, speed);
    if (stopRef.current) throw new Error("stopped");
  });
  const swp = (b, i, j) => {
    [b[i], b[j]] = [b[j], b[i]];
    b[i].state = "swap"; b[j].state = "swap";
    statsRef.current.swaps++;
    setStats({ ...statsRef.current });
  };

  const reset = () => {
    stopRef.current = true;
    setTimeout(() => {
      setBars(genArr().map(v => ({ val: v, state: "idle", cmpLabel: "" })));
      setStats({ comps: 0, swaps: 0 }); statsRef.current = { comps: 0, swaps: 0 };
      setLog([]); setLabel("Ready"); setRunning(false); setPseudoLine(-1);
    }, 80);
  };

  const run = async () => {
    if (running) return;
    setRunning(true); stopRef.current = false; setPseudoLine(-1);
    statsRef.current = { comps: 0, swaps: 0 };
    const b = bars.map(x => ({ ...x, state: "idle", cmpLabel: "" }));

    const compare = async (b, i, j, msg, pLine) => {
      b[i].state = "compare"; b[j].state = "compare";
      b[i].cmpLabel = "?"; b[j].cmpLabel = "?";
      statsRef.current.comps++; setStats({ ...statsRef.current });
      await tick(b, msg, "info", pLine);
      b[i].cmpLabel = ""; b[j].cmpLabel = "";
    };

    try {
      if (algo === "bubble") {
        for (let i = 0; i < b.length; i++) {
          let swapped = false;
          await tick(b, `Pass ${i+1}: scanning…`, "info", 1);
          for (let j = 0; j < b.length - i - 1; j++) {
            await compare(b, j, j+1, `Compare [${j}]=${b[j].val} vs [${j+1}]=${b[j+1].val}`, 2);
            if (b[j].val > b[j+1].val) { swp(b, j, j+1); await tick(b, `Swap ${b[j].val} ↔ ${b[j+1].val}`, "warn", 4); swapped = true; }
            if (b[j].state !== "sorted") b[j].state = "idle";
            if (b[j+1].state !== "sorted") b[j+1].state = "idle";
          }
          b[b.length - i - 1].state = "sorted";
          if (!swapped) { b.forEach(x => x.state = "sorted"); await tick(b, "No swaps — array sorted!", "ok", 6); break; }
        }
      } else if (algo === "selection") {
        for (let i = 0; i < b.length; i++) {
          let minIdx = i; b[i].state = "compare"; await tick(b, `Find min from [${i}]…`, "info", 1);
          for (let j = i+1; j < b.length; j++) {
            await compare(b, minIdx, j, `Min so far: ${b[minIdx].val} vs ${b[j].val}`, 3);
            if (b[j].val < b[minIdx].val) { if (b[minIdx].state !== "sorted") b[minIdx].state = "idle"; minIdx = j; await tick(b, `New min: ${b[minIdx].val}`, "info", 4); }
            else if (b[j].state !== "sorted") b[j].state = "idle";
          }
          if (minIdx !== i) { swp(b, i, minIdx); await tick(b, `Place min ${b[i].val} at [${i}]`, "warn", 5); }
          b[i].state = "sorted";
        }
      } else if (algo === "insertion") {
        for (let i = 1; i < b.length; i++) {
          let j = i; await tick(b, `Key = ${b[i].val}`, "info", 1);
          while (j > 0) {
            await compare(b, j-1, j, `${b[j].val} < ${b[j-1].val}?`, 3);
            if (b[j].val < b[j-1].val) { swp(b, j, j-1); await tick(b, `Shift ${b[j].val} left`, "warn", 4); j--; }
            else { b[j].state = "idle"; await tick(b, `${b[j+1]?.val ?? b[j].val} in place ✓`, "ok", 6); break; }
          }
          b[j].state = "idle";
        }
        b.forEach(x => x.state = "sorted");
      } else if (algo === "merge") {
        const mergeSort = async (b, l, r) => {
          if (l >= r) return;
          const m = Math.floor((l + r) / 2);
          await tick(b, `Split [${l}..${r}] at mid=${m}`, "info", 2);
          await mergeSort(b, l, m); await mergeSort(b, m+1, r);
          const lft = b.slice(l, m+1).map(x => ({...x})), rgt = b.slice(m+1, r+1).map(x => ({...x}));
          let i = 0, j = 0, k = l;
          while (i < lft.length && j < rgt.length) {
            statsRef.current.comps++; setStats({...statsRef.current});
            b[k] = { val: lft[i].val <= rgt[j].val ? lft[i++].val : rgt[j++].val, state: "merge", cmpLabel: "" };
            await tick(b, `Merge: placed ${b[k].val} at [${k}]`, "warn", 5); b[k].state = "sorted"; k++;
          }
          while (i < lft.length) { b[k] = { val: lft[i++].val, state: "sorted", cmpLabel: "" }; k++; }
          while (j < rgt.length) { b[k] = { val: rgt[j++].val, state: "sorted", cmpLabel: "" }; k++; }
          await tick(b, `Merged [${l}..${r}]`, "ok", 5);
        };
        await mergeSort(b, 0, b.length - 1);
      } else {
        const quickSort = async (b, lo, hi) => {
          if (lo >= hi) return;
          const pval = b[hi].val; b[hi].state = "pivot";
          await tick(b, `Pivot=${pval} at [${hi}]`, "info", 2);
          let i = lo - 1;
          for (let j = lo; j < hi; j++) {
            statsRef.current.comps++; b[j].state = "compare";
            await tick(b, `${b[j].val} ≤ pivot ${pval}?`, "info", 4);
            if (b[j].val <= pval) { i++; swp(b, i, j); await tick(b, `Swap ${b[i].val} ↔ ${b[j].val}`, "warn", 5); }
            if (b[j].state !== "sorted") b[j].state = "idle";
          }
          swp(b, i+1, hi); b[i+1].state = "pivot";
          await tick(b, `Pivot ${pval} placed at [${i+1}]`, "ok", 6);
          const pv = i+1; b[pv].state = "sorted";
          await quickSort(b, lo, pv-1); await quickSort(b, pv+1, hi);
        };
        await quickSort(b, 0, b.length - 1);
      }
      b.forEach(x => x.state = "sorted"); updateBars(b, "✓ Sorted!", "ok"); setPseudoLine(-1);
    } catch (e) { if (e.message !== "stopped") throw e; }
    setRunning(false);
  };

  const stateColor = { idle: T.blue, compare: T.yellow, swap: T.orange, sorted: T.green, pivot: T.red, merge: T.purple };
  const maxVal = Math.max(...bars.map(b => b.val), 1);
  const barH = mobile ? 140 : 210;
  const info = ALGO_INFO[algo];

  const controlsContent = (
    <>
      <div>
        <SLabel>Algorithm</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          {[["bubble","Bubble Sort"],["selection","Selection Sort"],["insertion","Insertion Sort"],["merge","Merge Sort"],["quick","Quick Sort"]].map(([k,l]) => (
            <button key={k} onClick={() => { if (!running) setAlgo(k); }} style={{ padding: "7px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: running ? "not-allowed" : "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", background: algo === k ? T.accentSoft : T.surface2, border: `1px solid ${algo === k ? T.accent+"66" : T.border2}`, color: algo === k ? T.accent : T.muted2 }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Btn onClick={run} variant="primary" disabled={running} style={{ flex: 1 }}>▶ Run</Btn>
        <Btn onClick={reset} variant="ghost" style={{ flex: 1 }}>↺ New</Btn>
      </div>
      {!mobile && <Btn onClick={() => setCompareMode(true)} variant="purple" full disabled={running}>⚡ Compare Mode</Btn>}
      <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>
      <InfoBox>
        <strong style={{ color: T.text }}>{algo.charAt(0).toUpperCase() + algo.slice(1)} Sort</strong><br /><br />
        {info.note}
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Best" val={info.best} color={T.green} />
          <CRow op="Average" val={info.avg} color={T.yellow} />
          <CRow op="Worst" val={info.worst} color={T.red} />
          <CRow op="Space" val={info.space} color={T.teal} />
        </div>
      </InfoBox>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {Object.entries(stateColor).map(([s,c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: T.muted }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{s}
          </div>
        ))}
      </div>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && !compareMode && <Side>{controlsContent}</Side>}
      {compareMode ? (
        <SortingCompareViz onClose={() => setCompareMode(false)} />
      ) : (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <ChipStrip
              options={[["bubble","Bubble"],["selection","Select"],["insertion","Insert"],["merge","Merge"],["quick","Quick"]]}
              active={algo} onSelect={setAlgo} disabled={running}
            />
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <button onClick={run} disabled={running} style={{ padding: "5px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, background: T.accent, border: "none", color: "#fff", opacity: running ? 0.4 : 1 }}>▶</button>
            <button onClick={reset} disabled={running} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, background: T.surface3, border: `1px solid ${T.border2}`, color: T.muted2, opacity: running ? 0.4 : 1 }}>↺</button>
          </MobileStrip>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title={`${algo.charAt(0).toUpperCase()+algo.slice(1)} Sort`}
            desc={info.note} time={info.avg} space={info.space} />}

          {/* Bar chart */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: mobile ? "36px 8px 0" : "16px 20px 0", gap: mobile ? 2 : 3 }}>
            {bars.map((bar, i) => {
              const col = stateColor[bar.state] || T.blue;
              const h = Math.max(4, Math.floor((bar.val / maxVal) * barH));
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                  {!mobile && <div style={{ fontSize: 8, color: col, fontFamily: "'Space Mono',monospace", opacity: bar.state !== "idle" ? 1 : 0.5, transition: "opacity .2s" }}>{bar.val}</div>}
                  {bar.cmpLabel && <div style={{ fontSize: 7, color: T.yellow, fontWeight: 700 }}>{bar.cmpLabel}</div>}
                  <div style={{
                    width: "100%", height: h, borderRadius: "3px 3px 0 0",
                    background: `linear-gradient(to top, ${col}dd, ${col}88)`,
                    border: `1px solid ${col}44`,
                    boxShadow: bar.state !== "idle" ? `0 0 8px ${col}88` : "none",
                    transform: bar.state === "swap" ? "translateY(-8px)" : "none",
                    transition: "height .12s ease, transform .12s ease",
                  }} />
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div style={{ padding: mobile ? "6px 10px" : "8px 18px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: mobile ? 11 : 12, color: T.muted2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{label}</div>
            <div style={{ display: "flex", gap: mobile ? 10 : 16, fontFamily: "'Space Mono',monospace", fontSize: mobile ? 10 : 11, flexShrink: 0 }}>
              <span title="Comparisons" style={{ color: T.yellow }}>⚖ {stats.comps}</span>
              <span title="Swaps" style={{ color: T.orange }}>↕ {stats.swaps}</span>
              {!mobile && <button onClick={() => setCompareMode(true)} disabled={running} style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: "pointer", background: T.purpleSoft, border: `1px solid ${T.purple}44`, color: T.purple, opacity: running ? 0.4 : 1 }}>⚡ Compare</button>}
            </div>
          </div>
        </div>

        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={`${algo.charAt(0).toUpperCase()+algo.slice(1)} Sort`}>{controlsContent}</BottomSheet>}
      </div>
      )}
      {!mobile && !compareMode && <PseudoPanel lines={PSEUDO[algo]} activeLine={pseudoLine} label={`${algo.charAt(0).toUpperCase()+algo.slice(1)} Sort`} mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   9. GRAPH
═══════════════════════════════════════════════════════════════ */
const GRAPH_PRESET = {
  nodes: [
    { id: "A", x: 300, y: 55  },
    { id: "B", x: 145, y: 160 },
    { id: "C", x: 455, y: 160 },
    { id: "D", x: 65,  y: 270 },
    { id: "E", x: 255, y: 270 },
    { id: "F", x: 415, y: 270 },
    { id: "G", x: 535, y: 175 },
  ],
  edges: [
    { u:"A", v:"B", w:4 }, { u:"A", v:"C", w:2 },
    { u:"B", v:"D", w:5 }, { u:"B", v:"E", w:3 },
    { u:"C", v:"F", w:6 }, { u:"C", v:"G", w:1 },
    { u:"E", v:"F", w:2 }, { u:"D", v:"E", w:7 },
  ],
};

// Reconstruct the shortest path from the parent map
function reconstructPath(prev, target) {
  const path = [];
  let cur = target;
  while (cur !== null && cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  return path.length > 1 ? path : [];
}

function GraphViz() {
  const mobile = useIsMobile();
  const [algo, setAlgo]           = useState("bfs");
  const [dropOpen, setDropOpen]   = useState(false);
  const [start, setStart]         = useState("A");
  const [end, setEnd]             = useState("G");
  const [visited, setVisited]     = useState(new Set());
  const [checking, setChecking]   = useState(null);   // currently examined node
  const [activeNode, setActiveNode] = useState(null);
  const [edgeState, setEdgeState] = useState({});     // "tree" | "path" | "checking"
  const [pathNodes, setPathNodes] = useState(new Set());
  const [queue, setQueue]         = useState([]);
  const [dist, setDist]           = useState({});
  const [log, setLog]             = useState([]);
  const [running, setRunning]     = useState(false);
  const [speed, setSpeed]         = useState(500);
  const [label, setLabel]         = useState("Press Run to start");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [pseudoLine, setPseudoLine]   = useState(-1);
  const [nodesVisited, setNodesVisited] = useState(0);
  const stopRef = useRef(false);
  const addLog = (m, t = "info") => setLog(l => [...l.slice(-24), { m, t }]);

  // Build adjacency list
  const adj = {};
  GRAPH_PRESET.nodes.forEach(n => { adj[n.id] = []; });
  GRAPH_PRESET.edges.forEach(({ u, v, w }) => {
    adj[u].push({ node: v, w });
    adj[v].push({ node: u, w });
  });

  const resetState = () => {
    stopRef.current = true;
    setVisited(new Set()); setChecking(null); setActiveNode(null);
    setEdgeState({}); setPathNodes(new Set());
    setQueue([]); setDist({});
    setRunning(false); setLabel("Press Run to start");
    setPseudoLine(-1); setNodesVisited(0);
  };

  // ── tick helpers ──────────────────────────────────────────────
  const tick = (opts = {}) => new Promise(res => {
    const { vis, cur, chk = null, es, q = [], msg, d = {}, pLine = -1 } = opts;
    if (vis)  { setVisited(new Set(vis)); setNodesVisited(vis.size); }
    if (cur !== undefined) setActiveNode(cur);
    if (chk !== undefined) setChecking(chk);
    if (es)   setEdgeState({ ...es });
    if (q)    setQueue([...q]);
    if (Object.keys(d).length) setDist({ ...d });
    setPseudoLine(pLine);
    setLabel(msg); addLog(msg, "info");
    setTimeout(res, speed);
    if (stopRef.current) throw new Error("stopped");
  });

  // Flash the final path edges/nodes in green
  const flashPath = async (path, es) => {
    const pSet = new Set(path);
    const pEdges = { ...es };
    for (let i = 0; i < path.length - 1; i++) {
      pEdges[`${path[i]}-${path[i+1]}`] = "path";
      pEdges[`${path[i+1]}-${path[i]}`] = "path";
    }
    setPathNodes(pSet);
    setEdgeState(pEdges);
    setActiveNode(null); setChecking(null);
    setLabel(`✓ Path: ${path.join(" → ")}  (${path.length - 1} hops)`);
    addLog(`Path found: ${path.join(" → ")}`, "ok");
  };

  // ── algorithms ───────────────────────────────────────────────
  const run = async () => {
    if (running) return;
    setRunning(true); stopRef.current = false;
    setVisited(new Set()); setChecking(null); setActiveNode(null);
    setEdgeState({}); setPathNodes(new Set());
    setQueue([]); setDist({}); setNodesVisited(0); setPseudoLine(-1);

    try {
      if (algo === "bfs") {
        // BFS — also tracks prev for path reconstruction
        const vis = new Set([start]);
        const q = [start];
        const prev = { [start]: null };
        const es = {};
        await tick({ vis, cur: start, es, q: [...q], msg: `BFS: start at ${start}`, pLine: 1 });

        let found = false;
        while (q.length && !found) {
          const cur = q.shift();
          await tick({ vis, cur, chk: null, es, q: [...q], msg: `Dequeue ${cur} — queue: [${q.join(", ")}]`, pLine: 3 });

          for (const { node: nb } of (adj[cur] || [])) {
            await tick({ vis, cur, chk: nb, es, q: [...q], msg: `Check ${cur}→${nb}`, pLine: 5 });
            if (!vis.has(nb)) {
              vis.add(nb); prev[nb] = cur;
              q.push(nb);
              es[`${cur}-${nb}`] = "tree"; es[`${nb}-${cur}`] = "tree";
              await tick({ vis, cur, chk: nb, es, q: [...q], msg: `Discover ${nb} from ${cur}`, pLine: 6 });
              if (nb === end) { found = true; break; }
            }
          }
        }

        const path = reconstructPath(prev, end);
        if (path.length) await flashPath(path, es);
        else await tick({ vis, cur: null, chk: null, es, q: [], msg: `BFS complete — ${end} not reachable from ${start}`, pLine: -1 });

      } else if (algo === "dfs") {
        const vis = new Set();
        const es = {};
        const prev = { [start]: null };
        let found = false;

        const dfs = async (node) => {
          if (stopRef.current || found) throw new Error("stopped");
          vis.add(node);
          await tick({ vis, cur: node, chk: null, es, q: [], msg: `DFS: enter ${node}`, pLine: 1 });

          if (node === end) { found = true; return; }

          for (const { node: nb } of (adj[node] || [])) {
            if (found) break;
            await tick({ vis, cur: node, chk: nb, es, q: [], msg: `Check ${node}→${nb}`, pLine: 2 });
            if (!vis.has(nb)) {
              prev[nb] = node;
              es[`${node}-${nb}`] = "tree"; es[`${nb}-${node}`] = "tree";
              await tick({ vis, cur: node, chk: nb, es, q: [], msg: `${node} → ${nb}`, pLine: 3 });
              await dfs(nb);
              if (!found) await tick({ vis, cur: node, chk: null, es, q: [], msg: `Backtrack to ${node}`, pLine: 4 });
            }
          }
        };

        await dfs(start);
        const path = reconstructPath(prev, end);
        if (path.length) await flashPath(path, es);
        else await tick({ vis, cur: null, chk: null, es, q: [], msg: `DFS complete — ${end} not reachable`, pLine: -1 });

      } else {
        // Dijkstra — full shortest-path with path reconstruction
        const INF = 99999;
        const d = {};
        const prev = {};
        GRAPH_PRESET.nodes.forEach(n => { d[n.id] = INF; prev[n.id] = null; });
        d[start] = 0;
        const pq = [[0, start]];
        const vis = new Set();
        const es = {};

        await tick({ vis, cur: null, chk: null, es, q: [], msg: `Dijkstra: dist[${start}]=0, all others ∞`, d: { ...d }, pLine: 1 });

        while (pq.length) {
          pq.sort((a, b) => a[0] - b[0]);
          const [cost, u] = pq.shift();
          if (vis.has(u)) continue;
          vis.add(u);
          await tick({ vis, cur: u, chk: null, es, q: [], msg: `Visit ${u}, dist=${cost}`, d: { ...d }, pLine: 5 });
          if (u === end) break;

          for (const { node: v, w } of (adj[u] || [])) {
            await tick({ vis, cur: u, chk: v, es, q: [], msg: `Relax ${u}→${v} (w=${w}): ${cost}+${w}=${cost+w} vs ${d[v] === INF ? "∞" : d[v]}`, d: { ...d }, pLine: 7 });
            if (!vis.has(v) && d[u] + w < d[v]) {
              d[v] = d[u] + w;
              prev[v] = u;
              es[`${u}-${v}`] = "tree"; es[`${v}-${u}`] = "tree";
              pq.push([d[v], v]);
              await tick({ vis, cur: u, chk: v, es, q: [], msg: `Updated dist[${v}]=${d[v]} via ${u}`, d: { ...d }, pLine: 8 });
            }
          }
        }

        const path = reconstructPath(prev, end);
        if (path.length) {
          await flashPath(path, es);
          setDist({ ...d });
          setLabel(`✓ Shortest path ${start}→${end}: ${path.join(" → ")}  cost=${d[end]}`);
        } else {
          await tick({ vis, cur: null, chk: null, es, q: [], msg: `${end} not reachable from ${start}`, d: { ...d }, pLine: -1 });
        }
      }
    } catch (e) { if (e.message !== "stopped") throw e; }
    setRunning(false); setActiveNode(null); setChecking(null); setPseudoLine(-1);
  };

  const nodePos = Object.fromEntries(GRAPH_PRESET.nodes.map(n => [n.id, { x: n.x, y: n.y }]));

  // Dropdown for algorithm selection
  const algoOptions = [
    ["bfs",      "BFS — Breadth First"],
    ["dfs",      "DFS — Depth First"],
    ["dijkstra", "Dijkstra — Shortest Path"],
  ];

  // Node picker row
  const NodePicker = ({ value, onChange, label: pickLabel, color }) => (
    <div>
      <SLabel style={{ marginBottom: 6 }}>{pickLabel}</SLabel>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {GRAPH_PRESET.nodes.map(n => {
          const active = n.id === value;
          return (
            <button key={n.id} onClick={() => !running && onChange(n.id)} style={{
              width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer", fontFamily: "'Space Mono',monospace",
              background: active ? color + "22" : T.surface2,
              border: `1px solid ${active ? color : T.border2}`,
              color: active ? color : T.muted2,
              transition: "all .13s",
            }}>{n.id}</button>
          );
        })}
      </div>
    </div>
  );

  const controlsContent = (
    <>
      {/* Dropdown algo selector */}
      <div style={{ position: "relative" }}>
        <SLabel style={{ marginBottom: 6 }}>Algorithm</SLabel>
        <button onClick={() => setDropOpen(o => !o)} disabled={running} style={{
          width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif",
          background: T.accentSoft, border: `1px solid ${T.accent}66`,
          color: T.accent, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{algoOptions.find(([k]) => k === algo)?.[1]}</span>
          <span style={{ fontSize: 10 }}>{dropOpen ? "▲" : "▼"}</span>
        </button>
        {dropOpen && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30,
            background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 10,
            marginTop: 4, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {algoOptions.map(([k, l]) => (
              <button key={k} onClick={() => { setAlgo(k); setDropOpen(false); resetState(); }} style={{
                width: "100%", padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: algo === k ? T.accentSoft : "transparent",
                border: "none", borderBottom: `1px solid ${T.border}`, color: algo === k ? T.accent : T.muted2,
              }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      <NodePicker value={start} onChange={v => { setStart(v); resetState(); }} label="Start Node" color={T.accent} />
      <NodePicker value={end}   onChange={v => { setEnd(v);   resetState(); }} label="End Node (Target)" color={T.red} />

      <div style={{ display: "flex", gap: 6 }}>
        <Btn onClick={run} variant="primary" disabled={running} style={{ flex: 1 }}>▶ Run</Btn>
        <Btn onClick={resetState} variant="ghost" style={{ flex: 1 }}>↺ Reset</Btn>
      </div>

      <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>

      {/* Complexity details */}
      <InfoBox>
        <SLabel style={{ marginBottom: 6 }}>Complexity Details</SLabel>
        {algo === "bfs"      && <><CRow op="Time"  val="O(V+E)"       color={T.green} /><CRow op="Space" val="O(V)"         color={T.teal}  /><CRow op="Shortest path" val="✓ (unweighted)" color={T.green} /></>}
        {algo === "dfs"      && <><CRow op="Time"  val="O(V+E)"       color={T.green} /><CRow op="Space" val="O(V)"         color={T.teal}  /><CRow op="Shortest path" val="✗"             color={T.red}   /></>}
        {algo === "dijkstra" && <><CRow op="Time"  val="O((V+E)logV)" color={T.yellow}/><CRow op="Space" val="O(V)"         color={T.teal}  /><CRow op="Negative edges" val="✗"            color={T.red}   /></>}
      </InfoBox>

      {/* Dijkstra distances table */}
      {algo === "dijkstra" && Object.keys(dist).length > 0 && (
        <div>
          <SLabel style={{ marginBottom: 6 }}>Distances from {start}</SLabel>
          {GRAPH_PRESET.nodes.map(n => (
            <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: pathNodes.has(n.id) ? T.green : visited.has(n.id) ? T.text : T.muted, fontWeight: pathNodes.has(n.id) ? 700 : 400 }}>{n.id}{n.id === end ? " ←target" : ""}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", color: pathNodes.has(n.id) ? T.green : visited.has(n.id) ? T.accent : T.muted }}>{dist[n.id] === 99999 ? "∞" : dist[n.id]}</span>
            </div>
          ))}
        </div>
      )}

      {/* BFS queue */}
      {algo === "bfs" && queue.length > 0 && (
        <div><SLabel style={{ marginBottom: 6 }}>Queue</SLabel>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{queue.map((n, i) => <Badge key={i} color={T.yellow}>{n}</Badge>)}</div>
        </div>
      )}

      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  // Node colour logic
  const getNodeStyle = (nid) => {
    const isPath    = pathNodes.has(nid);
    const isActive  = nid === activeNode;
    const isCheck   = nid === checking;
    const isVis     = visited.has(nid);
    const isStart   = nid === start;
    const isEnd     = nid === end;

    if (isPath)   return { stroke: T.green,  fill: T.greenSoft,   glow: T.green,  fw: 3 };
    if (isActive) return { stroke: T.yellow, fill: T.yellowSoft,  glow: T.yellow, fw: 3 };
    if (isCheck)  return { stroke: T.orange, fill: T.orangeSoft,  glow: T.orange, fw: 2.5 };
    if (isVis)    return { stroke: T.green,  fill: T.greenSoft,   glow: T.green,  fw: 2 };
    if (isEnd)    return { stroke: T.red,    fill: T.redSoft,     glow: null,     fw: 2 };
    if (isStart)  return { stroke: T.accent, fill: T.accentSoft,  glow: null,     fw: 2 };
    return         { stroke: T.blue,   fill: T.surface2,    glow: null,     fw: 1.5 };
  };

  // Edge colour logic
  const getEdgeStyle = (u, v) => {
    const key1 = `${u}-${v}`, key2 = `${v}-${u}`;
    const state = edgeState[key1] || edgeState[key2];
    if (state === "path")     return { stroke: T.green,  width: 3.5, glow: T.green };
    if (state === "checking") return { stroke: T.orange, width: 2.5, glow: T.orange };
    if (state === "tree")     return { stroke: T.teal,   width: 2.5, glow: null };
    return { stroke: T.surface3, width: 1.5, glow: null };
  };

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }} onClick={() => dropOpen && setDropOpen(false)}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {mobile && (
          <MobileStrip>
            <ChipStrip
              options={[["bfs","BFS"],["dfs","DFS"],["dijkstra","Dijkstra"]]}
              active={algo} onSelect={a => { if (!running) { setAlgo(a); resetState(); } }}
            />
            <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>S:</span>
            {GRAPH_PRESET.nodes.map(n => (
              <button key={n.id} onClick={() => setStart(n.id)} style={{
                width: 26, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Space Mono',monospace", flexShrink: 0,
                background: start === n.id ? T.accentSoft : T.surface3,
                border: `1px solid ${start === n.id ? T.accent : T.border2}`,
                color: start === n.id ? T.accent : T.muted2,
              }}>{n.id}</button>
            ))}
            <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>E:</span>
            {GRAPH_PRESET.nodes.map(n => (
              <button key={n.id} onClick={() => setEnd(n.id)} style={{
                width: 26, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Space Mono',monospace", flexShrink: 0,
                background: end === n.id ? T.redSoft : T.surface3,
                border: `1px solid ${end === n.id ? T.red : T.border2}`,
                color: end === n.id ? T.red : T.muted2,
              }}>{n.id}</button>
            ))}
            <button onClick={run} disabled={running} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", flexShrink: 0, background: T.accent, border: "none", color: "#fff", opacity: running ? 0.4 : 1 }}>▶</button>
            <button onClick={resetState} style={{ padding: "5px 10px", borderRadius: 100, fontSize: 11, cursor: "pointer", flexShrink: 0, background: T.surface3, border: `1px solid ${T.border2}`, color: T.muted2 }}>↺</button>
          </MobileStrip>
        )}

        {/* SVG canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && (
            <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
              title={algoOptions.find(([k]) => k === algo)?.[1]}
              desc={algo === "bfs" ? "Level-by-level, shortest path (unweighted)." : algo === "dfs" ? "Recurse as deep as possible, then backtrack." : "Greedy shortest path for weighted graphs."}
              time={algo === "dijkstra" ? "O((V+E)logV)" : "O(V+E)"} space="O(V)"
            />
          )}

          <svg width="100%" height="100%" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">
            {/* Edges */}
            {GRAPH_PRESET.edges.map(({ u, v, w }) => {
              const pu = nodePos[u], pv = nodePos[v];
              const es = getEdgeStyle(u, v);
              const mx = (pu.x + pv.x) / 2, my = (pu.y + pv.y) / 2;
              return (
                <g key={`${u}-${v}`}>
                  <line x1={pu.x} y1={pu.y} x2={pv.x} y2={pv.y}
                    stroke={es.stroke} strokeWidth={es.width}
                    style={es.glow ? { filter: `drop-shadow(0 0 6px ${es.glow})` } : {}}
                  />
                  {/* Weight label — always for dijkstra, on tree edges for others */}
                  {(algo === "dijkstra" || edgeState[`${u}-${v}`] || edgeState[`${v}-${u}`]) && (
                    <text x={mx} y={my - 7} textAnchor="middle"
                      fill={es.stroke === T.surface3 ? T.muted : es.stroke}
                      fontSize="11" fontFamily="Space Mono" fontWeight="700">{w}</text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {GRAPH_PRESET.nodes.map(n => {
              const ns = getNodeStyle(n.id);
              const d = dist[n.id];
              return (
                <g key={n.id} style={{ cursor: "pointer" }}
                  onClick={() => { if (!running) { setStart(n.id); resetState(); } }}>
                  <circle cx={n.x} cy={n.y} r={26}
                    fill={ns.fill} stroke={ns.stroke} strokeWidth={ns.fw}
                    style={ns.glow ? { filter: `drop-shadow(0 0 12px ${ns.glow})` } : {}}
                  />
                  <text x={n.x} y={n.y + 5} textAnchor="middle"
                    fill={ns.stroke} fontSize="14" fontFamily="Space Mono" fontWeight="700">
                    {n.id}
                  </text>
                  {/* Dijkstra distance badge above node */}
                  {algo === "dijkstra" && d !== undefined && d !== 99999 && (
                    <text x={n.x} y={n.y - 34} textAnchor="middle"
                      fill={pathNodes.has(n.id) ? T.green : T.yellow}
                      fontSize="11" fontFamily="Space Mono" fontWeight="700">{d}</text>
                  )}
                  {/* Start / End labels */}
                  {n.id === start && !pathNodes.size && (
                    <text x={n.x} y={n.y + 43} textAnchor="middle" fill={T.accent} fontSize="9" fontFamily="DM Sans" fontWeight="700">START</text>
                  )}
                  {n.id === end && !pathNodes.size && (
                    <text x={n.x} y={n.y + 43} textAnchor="middle" fill={T.red} fontSize="9" fontFamily="DM Sans" fontWeight="700">TARGET</text>
                  )}
                </g>
              );
            })}

            {/* Legend — matching the screenshot */}
            {[
              { c: T.blue,   l: "Unvisited" },
              { c: T.orange, l: "Checking"  },
              { c: T.green,  l: "Path"      },
              { c: T.yellow, l: "Active"    },
            ].map(({ c, l }, i) => (
              <g key={l} transform={`translate(${12 + i * 105}, 308)`}>
                <circle r="6" fill={c + "22"} stroke={c} strokeWidth="2" />
                <text x="12" y="4" fill={T.muted2} fontSize="11" fontFamily="DM Sans">{l}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Status bar */}
        <div style={{
          padding: mobile ? "7px 12px" : "9px 20px",
          borderTop: `1px solid ${T.border}`, background: T.surface,
          fontSize: mobile ? 11 : 12, color: T.muted2, minHeight: 34,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <div style={{ display: "flex", gap: 12, flexShrink: 0, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
            {nodesVisited > 0 && <span style={{ color: T.green }}>✓ {nodesVisited}/{GRAPH_PRESET.nodes.length} visited</span>}
            {algo === "bfs" && queue.length > 0 && <span style={{ color: T.yellow }}>queue: {queue.length}</span>}
          </div>
        </div>

        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Graph Controls">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO[algo]} activeLine={pseudoLine} label={algoOptions.find(([k]) => k === algo)?.[1]} mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   10. DYNAMIC PROGRAMMING
═══════════════════════════════════════════════════════════════ */
function DPViz() {
  const mobile = useIsMobile();
  const [dpType, setDpType] = useState("fib");
  const [n, setN] = useState("9");
  const [s1, setS1] = useState("ABCBDAB");
  const [s2, setS2] = useState("BDCABA");
  const [weights, setWeights] = useState("2 3 4 5");
  const [values, setValues] = useState("3 4 5 6");
  const [capacity, setCapacity] = useState("5");
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [log, setLog] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const vizRef = useRef();

  useSwipe(vizRef,
    () => stepIdx < steps.length - 1 && setStepIdx(i => i + 1),
    () => stepIdx > 0 && setStepIdx(i => i - 1)
  );

  const build = () => {
    if (dpType === "fib") {
      const nv = Math.min(parseInt(n) || 9, 12);
      const dp = [0, 1]; const ss = [{ dp: [0, 1], hi: [0, 1], desc: "Base cases: dp[0]=0, dp[1]=1" }];
      for (let i = 2; i <= nv; i++) {
        dp.push(dp[i-1] + dp[i-2]);
        ss.push({ dp: [...dp, ...Array(nv+1-dp.length).fill(0)], hi: [i], using: [i-1, i-2], desc: `dp[${i}] = dp[${i-1}](${dp[i-1]}) + dp[${i-2}](${dp[i-2]}) = ${dp[i]}` });
      }
      ss.push({ dp: [...dp], hi: [nv], done: true, desc: `fib(${nv}) = ${dp[nv]} ✓` });
      setSteps(ss);
    } else if (dpType === "lcs") {
      const a = s1.toUpperCase().slice(0, 8), b = s2.toUpperCase().slice(0, 8);
      const dp = Array.from({ length: a.length+1 }, () => new Array(b.length+1).fill(0));
      const ss = [{ dp: dp.map(r => [...r]), hi: null, desc: "Init: dp[0][*]=dp[*][0]=0" }];
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
        const match = a[i-1] === b[j-1];
        dp[i][j] = match ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
        ss.push({ dp: dp.map(r => [...r]), hi: [i, j], match, desc: match ? `'${a[i-1]}'='${b[j-1]}' match → dp[${i}][${j}]=${dp[i][j]}` : `'${a[i-1]}'≠'${b[j-1]}' → max(↑${dp[i-1][j]}, ←${dp[i][j-1]})=${dp[i][j]}` });
      }
      ss.push({ dp: dp.map(r => [...r]), hi: [a.length, b.length], done: true, desc: `LCS length = ${dp[a.length][b.length]} ✓` });
      setSteps(ss);
    } else {
      const W2 = weights.trim().split(/\s+/).map(Number), V = values.trim().split(/\s+/).map(Number), C = parseInt(capacity) || 5, n2 = Math.min(W2.length, V.length, 5);
      const dp = Array.from({ length: n2+1 }, () => new Array(C+1).fill(0));
      const ss = [{ dp: dp.map(r => [...r]), hi: null, desc: "Init: dp[0][*]=0 — no items" }];
      for (let i = 1; i <= n2; i++) for (let w = 0; w <= C; w++) {
        if (W2[i-1] > w) { dp[i][w] = dp[i-1][w]; ss.push({ dp: dp.map(r => [...r]), hi: [i,w], skip: true, desc: `Item ${i}(w=${W2[i-1]}) > cap ${w} → skip` }); }
        else { const take = dp[i-1][w-W2[i-1]] + V[i-1], skip = dp[i-1][w]; dp[i][w] = Math.max(take, skip); ss.push({ dp: dp.map(r => [...r]), hi: [i,w], take: take > skip, desc: `take=${take} vs skip=${skip} → ${dp[i][w]}` }); }
      }
      ss.push({ dp: dp.map(r => [...r]), hi: [n2, C], done: true, desc: `Max value=${dp[n2][C]} ✓` });
      setSteps(ss);
    }
    setStepIdx(0); setLog([{ m: `Built ${dpType} DP`, t: "info" }]); setSheetOpen(false);
  };

  const step = steps[stepIdx];
  const cellSz = mobile ? 32 : 40;

  // derive pseudo line from step
  const dpPseudoLine = !step ? -1 :
    step.done ? (dpType === "fib" ? 4 : dpType === "lcs" ? 6 : 10) :
    step.hi === null ? 1 :
    dpType === "fib" ? (step.using ? 3 : 1) :
    dpType === "lcs" ? (step.match ? 4 : 6) :
    step.skip ? 4 : (step.take ? 8 : 7);

  const { playing, toggle } = useStepPlayer(steps, stepIdx, setStepIdx, 400);

  const controlsContent = (
    <>
      <div><SLabel>Problem</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          {[["fib","Fibonacci (1D DP)"],["lcs","LCS — Longest Common Subseq"],["knapsack","0/1 Knapsack"]].map(([k,l]) => (
            <button key={k} onClick={() => { setDpType(k); setSteps([]); setStepIdx(-1); }} style={{ padding: "7px 10px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", background: dpType === k ? T.accentSoft : T.surface2, border: `1px solid ${dpType === k ? T.accent+"66" : T.border2}`, color: dpType === k ? T.accent : T.muted2 }}>{l}</button>
          ))}
        </div>
      </div>
      {dpType === "fib" && <div><SLabel>n</SLabel><div style={{ marginTop: 6 }}><Input value={n} onChange={setN} placeholder="9" mono /></div></div>}
      {dpType === "lcs" && <><div><SLabel>String 1</SLabel><div style={{ marginTop: 5 }}><Input value={s1} onChange={setS1} placeholder="ABCBDAB" mono /></div></div><div><SLabel>String 2</SLabel><div style={{ marginTop: 5 }}><Input value={s2} onChange={setS2} placeholder="BDCABA" mono /></div></div></>}
      {dpType === "knapsack" && <><div><SLabel>Weights</SLabel><div style={{ marginTop: 5 }}><Input value={weights} onChange={setWeights} placeholder="2 3 4 5" mono /></div></div><div><SLabel>Values</SLabel><div style={{ marginTop: 5 }}><Input value={values} onChange={setValues} placeholder="3 4 5 6" mono /></div></div><div><SLabel>Capacity</SLabel><div style={{ marginTop: 5 }}><Input value={capacity} onChange={setCapacity} placeholder="5" mono /></div></div></>}
      <Btn onClick={build} variant="primary" full>⚙ Build DP Table</Btn>
      <InfoBox>
        {dpType === "fib" && <><strong style={{ color: T.text }}>Fibonacci DP</strong><br /><br />Naive O(2ⁿ) → DP O(n). Cache overlapping subproblems.</>}
        {dpType === "lcs" && <><strong style={{ color: T.text }}>LCS</strong><br /><br />dp[i][j] = LCS of s1[0..i] and s2[0..j].<div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}><CRow op="Time" val="O(mn)" color={T.yellow} /></div></>}
        {dpType === "knapsack" && <><strong style={{ color: T.text }}>0/1 Knapsack</strong><br /><br />Take or skip. dp[i][w] = max value using first i items, capacity w.<div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}><CRow op="Time" val="O(nW)" color={T.yellow} /></div></>}
      </InfoBox>
      <SLabel>Log</SLabel><Log entries={log} />
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {mobile && (
          <MobileStrip>
            <ChipStrip options={[["fib","Fibonacci"],["lcs","LCS"],["knapsack","Knapsack"]]} active={dpType}
              onSelect={k => { setDpType(k); setSteps([]); setStepIdx(-1); }} />
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <button onClick={build} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, background: T.accent, border: "none", color: "#fff" }}>⚙ Build</button>
            <button onClick={() => setSheetOpen(true)} style={{ padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0, background: T.surface3, border: `1px solid ${T.border2}`, color: T.muted2 }}>✎</button>
          </MobileStrip>
        )}

        <div ref={vizRef} style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: mobile ? "12px 10px" : "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "center", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title={dpType === "fib" ? "Fibonacci DP" : dpType === "lcs" ? "LCS" : "0/1 Knapsack"}
            desc={dpType === "fib" ? "Cache subproblem results to avoid recomputation." : dpType === "lcs" ? "Find longest common subsequence of two strings." : "Maximize value within weight capacity."}
            time={dpType === "fib" ? "O(n)" : dpType === "lcs" ? "O(mn)" : "O(nW)"} space="O(n) or O(nm)" note="Swipe ← →" />}

          {!step ? (
            <div style={{ color: T.muted, fontSize: 13, paddingTop: 40 }}>Configure and click Build DP Table</div>
          ) : (
            <div className="fin" key={`${dpType}-${stepIdx}`}>
              {dpType === "fib" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", paddingTop: 36 }}>
                  <div style={{ fontSize: 11, color: T.muted }}>dp[i] = dp[i-1] + dp[i-2]</div>
                  <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                    {step.dp.slice(0, parseInt(n)+1).map((v, i) => {
                      const isHi = step.hi?.includes(i), isUsing = step.using?.includes(i);
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                          <div style={{ width: cellSz, height: cellSz, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 11 : 13, background: isHi ? T.yellowSoft : isUsing ? T.accentSoft : T.surface2, border: `2px solid ${isHi ? T.yellow : isUsing ? T.accent : T.surface3}`, color: isHi ? T.yellow : isUsing ? T.accent : T.muted2, transition: "all .22s", boxShadow: isHi ? `0 0 12px ${T.yellow}66` : "none" }}>{v}</div>
                          <div style={{ fontSize: 9, color: T.muted, fontFamily: "'Space Mono',monospace" }}>[{i}]</div>
                        </div>
                      );
                    })}
                  </div>
                  {step.done && <Badge color={T.green}>fib({n}) = {step.dp[parseInt(n)]}</Badge>}
                </div>
              )}
              {dpType === "lcs" && (() => {
                const a = s1.toUpperCase().slice(0, 8), b = s2.toUpperCase().slice(0, 8);
                return (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 9 : 11 }}>
                      <thead><tr>
                        <td style={{ width: cellSz, height: cellSz, textAlign: "center", color: T.muted }}></td>
                        <td style={{ width: cellSz, textAlign: "center", color: T.muted, fontSize: 9 }}>""</td>
                        {b.split("").map((c, j) => <td key={j} style={{ width: cellSz, height: cellSz, textAlign: "center", color: T.blue, fontWeight: 700 }}>{c}</td>)}
                      </tr></thead>
                      <tbody>
                        {step.dp.map((row, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center", color: i === 0 ? T.muted : T.green, fontWeight: 700, padding: "0 4px" }}>{i === 0 ? '""' : a[i-1]}</td>
                            {row.map((v, j) => {
                              const isHi = step.hi && step.hi[0] === i && step.hi[1] === j;
                              return <td key={j} style={{ width: cellSz, height: cellSz, textAlign: "center", fontWeight: 700, background: isHi ? (step.match ? T.greenSoft : T.yellowSoft) : T.surface2, border: `1px solid ${isHi ? (step.match ? T.green : T.yellow) : T.surface3}`, color: isHi ? (step.match ? T.green : T.yellow) : v > 0 ? T.accent : T.muted, transition: "all .2s", fontSize: mobile ? 10 : 12 }}>{v}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {step.done && <div style={{ marginTop: 12, textAlign: "center" }}><Badge color={T.green}>LCS = {step.dp[step.dp.length-1][step.dp[0].length-1]}</Badge></div>}
                  </div>
                );
              })()}
              {dpType === "knapsack" && (() => {
                const W2 = weights.trim().split(/\s+/).map(Number), V2 = values.trim().split(/\s+/).map(Number), C = parseInt(capacity) || 5;
                return (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 9 : 11 }}>
                      <thead><tr>
                        <td style={{ width: 46, textAlign: "center", color: T.muted, padding: "0 4px", fontSize: 8 }}>i\w</td>
                        {Array.from({ length: C+1 }, (_, w) => <td key={w} style={{ width: cellSz, height: cellSz, textAlign: "center", color: T.muted, fontWeight: 700 }}>{w}</td>)}
                      </tr></thead>
                      <tbody>
                        {step.dp.map((row, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center", color: T.orange, fontWeight: 700, fontSize: 8, padding: "0 3px" }}>{i === 0 ? "—" : `i${i}(w${W2[i-1]},v${V2[i-1]})`}</td>
                            {row.map((v, j) => {
                              const isHi = step.hi && step.hi[0] === i && step.hi[1] === j;
                              return <td key={j} style={{ width: cellSz, height: cellSz, textAlign: "center", fontWeight: 700, fontSize: mobile ? 10 : 12, background: isHi && step.take ? T.greenSoft : isHi && step.skip ? T.redSoft : isHi ? T.yellowSoft : T.surface2, border: `1px solid ${isHi && step.take ? T.green : isHi && step.skip ? T.red : isHi ? T.yellow : T.surface3}`, color: isHi && step.take ? T.green : isHi && step.skip ? T.red : isHi ? T.yellow : v > 0 ? T.accent : T.muted, transition: "all .2s" }}>{v}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {step.done && <div style={{ marginTop: 12, textAlign: "center" }}><Badge color={T.green}>Max Value = {step.dp[step.dp.length-1][C]}</Badge></div>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <StepFooter
          label={step?.desc || "–"} stepIdx={stepIdx >= 0 ? stepIdx : 0} total={steps.length || 1}
          onBack={() => setStepIdx(i => Math.max(0, i-1))}
          onFwd={() => { setStepIdx(i => { const nx = Math.min(steps.length-1, i+1); setLog(l => [...l.slice(-30), { m: steps[nx]?.desc || "", t: "info" }]); return nx; }); }}
          mobile={mobile} playing={playing} onTogglePlay={toggle}
        />
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="DP Setup">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO[dpType]} activeLine={dpPseudoLine} label={dpType === "fib" ? "Fibonacci DP" : dpType === "lcs" ? "LCS" : "0/1 Knapsack"} mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   11. TWO POINTER + SLIDING WINDOW
═══════════════════════════════════════════════════════════════ */
function TwoPointerViz() {
  const mobile = useIsMobile();
  const [mode, setMode] = useState("twosum");
  const [arrInput, setArrInput] = useState("1 3 5 7 9 11 14 17 20");
  const [targetInput, setTargetInput] = useState("18");
  const [windowK, setWindowK] = useState("3");
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const vizRef = useRef();

  useSwipe(vizRef,
    () => stepIdx < steps.length - 1 && setStepIdx(i => i + 1),
    () => stepIdx > 0 && setStepIdx(i => i - 1)
  );

  const build = () => {
    const arr = arrInput.trim().split(/\s+/).map(Number);
    if (mode === "twosum") {
      const sorted = [...arr].sort((a, b) => a - b), target = parseInt(targetInput) || 18;
      const ss = [{ arr: sorted, l: 0, r: sorted.length-1, found: null, desc: `Start: l=0(${sorted[0]}), r=${sorted.length-1}(${sorted[sorted.length-1]}), target=${target}` }];
      let l = 0, r = sorted.length - 1;
      while (l < r) {
        const sum = sorted[l] + sorted[r];
        if (sum === target) { ss.push({ arr: sorted, l, r, found: [l, r], desc: `✓ Found! ${sorted[l]} + ${sorted[r]} = ${target}` }); break; }
        else if (sum < target) { ss.push({ arr: sorted, l, r, action: "moveL", desc: `Sum ${sum} < ${target} → move L right` }); l++; }
        else { ss.push({ arr: sorted, l, r, action: "moveR", desc: `Sum ${sum} > ${target} → move R left` }); r--; }
      }
      if (!ss[ss.length-1].found) ss.push({ arr: sorted, l, r, notFound: true, desc: "No pair sums to target" });
      setSteps(ss);
    } else {
      const k = parseInt(windowK) || 3;
      const ss = [{ arr, l: 0, r: k-1, sum: arr.slice(0, k).reduce((a, b) => a + b, 0), maxSum: arr.slice(0, k).reduce((a, b) => a + b, 0), maxL: 0, desc: `Init window [0..${k-1}], sum=${arr.slice(0, k).reduce((a, b) => a + b, 0)}` }];
      let maxSum = ss[0].sum, maxL = 0;
      for (let i = k; i < arr.length; i++) {
        const newSum = ss[ss.length-1].sum - arr[i-k] + arr[i];
        if (newSum > maxSum) { maxSum = newSum; maxL = i-k+1; }
        ss.push({ arr, l: i-k+1, r: i, sum: newSum, maxSum, maxL, desc: `Remove ${arr[i-k]}, add ${arr[i]} → sum=${newSum}${newSum >= maxSum ? " ← new max!" : ""}` });
      }
      ss.push({ ...ss[ss.length-1], done: true, desc: `Max sum window [${maxL}..${maxL+k-1}] = ${maxSum} ✓` });
      setSteps(ss);
    }
    setStepIdx(0); setSheetOpen(false);
  };

  const step = steps[stepIdx];
  const cellSz = mobile ? 34 : 44;

  const { playing: tpPlaying, toggle: tpToggle } = useStepPlayer(steps, stepIdx, setStepIdx, 500);

  const controlsContent = (
    <>
      <div><SLabel>Technique</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
          {[["twosum","Two Pointer — Two Sum"],["sliding","Sliding Window — Max Sum"]].map(([k,l]) => (
            <button key={k} onClick={() => { setMode(k); setSteps([]); setStepIdx(-1); }} style={{ padding: "7px 10px", borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", background: mode === k ? T.accentSoft : T.surface2, border: `1px solid ${mode === k ? T.accent+"66" : T.border2}`, color: mode === k ? T.accent : T.muted2 }}>{l}</button>
          ))}
        </div>
      </div>
      <div><SLabel>Array</SLabel><div style={{ marginTop: 6 }}><Input value={arrInput} onChange={setArrInput} placeholder="1 3 5 7 9..." mono /></div></div>
      {mode === "twosum" && <div><SLabel>Target</SLabel><div style={{ marginTop: 6 }}><Input value={targetInput} onChange={setTargetInput} placeholder="18" mono /></div></div>}
      {mode === "sliding" && <div><SLabel>Window Size k</SLabel><div style={{ marginTop: 6 }}><Input value={windowK} onChange={setWindowK} placeholder="3" mono /></div></div>}
      <Btn onClick={build} variant="primary" full>⚙ Build Steps</Btn>
      <InfoBox>
        {mode === "twosum" && <><strong style={{ color: T.text }}>Two Pointers</strong><br /><br />Sorted array, converge from both ends. O(n) vs O(n²) brute force.</>}
        {mode === "sliding" && <><strong style={{ color: T.text }}>Sliding Window</strong><br /><br />Fixed window slides right. Add new, remove oldest. O(n) vs O(nk).</>}
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Time" val="O(n)" color={T.green} />
          <CRow op="Space" val="O(1)" color={T.green} />
        </div>
      </InfoBox>
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <ChipStrip options={[["twosum","Two Sum"],["sliding","Sliding Win"]]} active={mode} onSelect={m => { setMode(m); setSteps([]); setStepIdx(-1); }} />
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <button onClick={build} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, background: T.accent, border: "none", color: "#fff" }}>⚙ Build</button>
            <button onClick={() => setSheetOpen(true)} style={{ padding: "5px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0, background: T.surface3, border: `1px solid ${T.border2}`, color: T.muted2 }}>✎</button>
          </MobileStrip>
        )}

        <div ref={vizRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "12px 8px" : "20px 24px", overflowX: "auto", position: "relative" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title={mode === "twosum" ? "Two Pointers" : "Sliding Window"}
            desc={mode === "twosum" ? "Converge from both ends of sorted array." : "Slide a fixed-size window across the array."}
            time="O(n)" space="O(1)" note="Swipe ← →" />}

          {!step ? (
            <div style={{ color: T.muted, fontSize: 13 }}>Configure and click Build Steps</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: mobile ? 14 : 20, width: "100%" }}>
              <div style={{ display: "flex", gap: mobile ? 2 : 4, flexWrap: "wrap", justifyContent: "center" }}>
                {step.arr.map((v, i) => {
                  const isL = i === step.l, isR = i === step.r;
                  const inWin = i >= step.l && i <= step.r;
                  const isFound = step.found && (i === step.found[0] || i === step.found[1]);
                  const isMaxWin = step.maxL !== undefined && i >= step.maxL && i < step.maxL + (parseInt(windowK) || 3) && step.done;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      {mode === "twosum" && <div style={{ fontSize: 9, color: isL ? T.accent : isR ? T.green : "transparent", fontWeight: 700, height: 12 }}>{isL ? "L" : isR ? "R" : ""}</div>}
                      <div style={{ width: cellSz, height: cellSz, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: mobile ? 11 : 13, fontWeight: 700, background: isFound ? T.greenSoft : isMaxWin ? T.yellowSoft : inWin && mode === "sliding" ? T.accentSoft : T.surface2, border: `2px solid ${isFound ? T.green : (isL || isR || isMaxWin) ? T.yellow : inWin && mode === "sliding" ? T.accent : T.border2}`, color: isFound ? T.green : isL ? T.accent : isR ? T.green : inWin && mode === "sliding" ? T.accent : T.muted2, boxShadow: isFound ? `0 0 12px ${T.green}66` : (isL || isR) ? `0 0 8px ${T.yellow}55` : "none", transition: "all .22s" }}>{v}</div>
                      <div style={{ fontSize: 8, color: T.muted, fontFamily: "'Space Mono',monospace" }}>[{i}]</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: mobile ? 16 : 28 }}>
                {mode === "twosum" && <>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Sum</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 20 : 26, fontWeight: 700, color: step.found ? T.green : T.yellow }}>{step.arr[step.l] + step.arr[step.r]}</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Target</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 20 : 26, fontWeight: 700, color: T.accent }}>{targetInput}</div></div>
                </>}
                {mode === "sliding" && <>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Window Sum</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 20 : 26, fontWeight: 700, color: T.accent }}>{step.sum}</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Max Sum</div><div style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 20 : 26, fontWeight: 700, color: T.yellow }}>{step.maxSum}</div></div>
                </>}
              </div>
            </div>
          )}
        </div>

        <StepFooter
          label={step?.desc || "–"} stepIdx={stepIdx >= 0 ? stepIdx : 0} total={steps.length || 1}
          onBack={() => setStepIdx(i => Math.max(0, i-1))}
          onFwd={() => setStepIdx(i => Math.min(steps.length-1, i+1))}
          mobile={mobile} playing={tpPlaying} onTogglePlay={tpToggle}
        />
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Two Pointer Setup">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO[mode === "twosum" ? "twoSum" : "sliding"]} activeLine={
        !step ? -1 : step.done ? 7 : mode === "twosum" ?
          (step.found ? 5 : step.arr[step.l] + step.arr[step.r] < parseInt(targetInput) ? 6 : 7) :
          (stepIdx === 0 ? 1 : 5)
      } label={mode === "twosum" ? "Two Pointers" : "Sliding Window"} mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   12. N-QUEENS (BACKTRACKING)
═══════════════════════════════════════════════════════════════ */
function BacktrackingViz() {
  const mobile = useIsMobile();
  const [n, setN] = useState(6);
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const vizRef = useRef();

  useSwipe(vizRef,
    () => stepIdx < steps.length - 1 && setStepIdx(i => i + 1),
    () => stepIdx > 0 && setStepIdx(i => i - 1)
  );

  const build = () => {
    const size = n;
    const ss = [];
    const board = Array.from({ length: size }, () => Array(size).fill(0)); // 0=empty,1=queen,2=conflict

    const isSafe = (b, row, col) => {
      for (let i = 0; i < row; i++) if (b[i][col] === 1) return false;
      for (let i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--) if (b[i][j] === 1) return false;
      for (let i = row-1, j = col+1; i >= 0 && j < size; i--, j++) if (b[i][j] === 1) return false;
      return true;
    };

    const solve = (b, row) => {
      if (row === size) {
        ss.push({ board: b.map(r => [...r]), row, solved: true, desc: `✓ Solution found! All ${size} queens placed safely` });
        return true;
      }
      for (let col = 0; col < size; col++) {
        if (isSafe(b, row, col)) {
          b[row][col] = 1;
          ss.push({ board: b.map(r => [...r]), row, col, tryCol: col, safe: true, desc: `Row ${row}: Try col ${col} — safe ✓, place queen` });
          if (solve(b, row + 1)) return true;
          b[row][col] = 0;
          ss.push({ board: b.map(r => [...r]), row, col, backtrack: true, desc: `Row ${row}: Remove from col ${col} — backtrack ↩` });
        } else {
          ss.push({ board: b.map(r => [...r]), row, col, safe: false, desc: `Row ${row}: Col ${col} — conflict! ✗` });
        }
      }
      return false;
    };

    solve(board, 0);
    setSteps(ss); setStepIdx(0);
  };

  const step = steps[stepIdx];
  const cellSize = mobile ? Math.floor(280 / n) : Math.floor(360 / n);

  const { playing: btPlaying, toggle: btToggle } = useStepPlayer(steps, stepIdx, setStepIdx, 300);

  // Derive pseudo line
  const btPseudoLine = !step ? -1 :
    step.solved ? 1 :
    step.backtrack ? 8 :
    step.safe ? 5 :
    step.safe === false ? 3 : 3;

  const controlsContent = (
    <>
      <div><SLabel>Board Size N</SLabel>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {[4, 5, 6, 7, 8].map(v => (
            <button key={v} onClick={() => { setN(v); setSteps([]); setStepIdx(-1); }} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono',monospace", background: n === v ? T.accentSoft : T.surface2, border: `1px solid ${n === v ? T.accent : T.border2}`, color: n === v ? T.accent : T.muted2 }}>{v}</button>
          ))}
        </div>
      </div>
      <Btn onClick={build} variant="primary" full>▶ Solve with Backtracking</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>N-Queens</strong><br /><br />
        Place N queens on an N×N board so no two attack each other. Backtracking tries every possibility, undoing choices that lead to conflicts.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Time" val="O(N!)" color={T.red} />
          <CRow op="Space" val="O(N)" color={T.yellow} />
          <CRow op="Solutions (N=8)" val="92" color={T.teal} />
        </div>
      </InfoBox>
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>N =</span>
            {[4,5,6,7,8].map(v => (
              <button key={v} onClick={() => { setN(v); setSteps([]); setStepIdx(-1); }} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono',monospace", flexShrink: 0, background: n === v ? T.accent : T.surface3, border: `1px solid ${n === v ? T.accent : T.border2}`, color: n === v ? "#fff" : T.muted2 }}>{v}</button>
            ))}
            <div style={{ width: 1, background: T.border2, flexShrink: 0 }} />
            <button onClick={build} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, background: T.accent, border: "none", color: "#fff" }}>▶ Solve</button>
          </MobileStrip>
        )}

        <div ref={vizRef} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "10px" : "20px", position: "relative", overflow: "hidden" }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="N-Queens Backtracking" desc="Try placing queens row by row. If conflict, remove and try next column." time="O(N!)" space="O(N)" note="Swipe ← →" />}

          {!step ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>♛</div>
              <div style={{ color: T.muted2, fontSize: 13, marginBottom: 8 }}>N-Queens with Backtracking</div>
              <div style={{ color: T.muted, fontSize: 11 }}>Select N and click Solve to see step-by-step backtracking</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {/* Stats */}
              <div style={{ display: "flex", gap: 14 }}>
                <Badge color={T.accent}>Step {stepIdx + 1}/{steps.length}</Badge>
                {step.solved && <Badge color={T.green}>✓ Solved!</Badge>}
                {step.backtrack && <Badge color={T.red}>↩ Backtrack</Badge>}
                {step.safe === false && <Badge color={T.orange}>✗ Conflict</Badge>}
              </div>

              {/* Board */}
              <div style={{ display: "inline-block", border: `2px solid ${step.solved ? T.green : step.backtrack ? T.red : T.border2}`, borderRadius: 8, overflow: "hidden", boxShadow: step.solved ? `0 0 20px ${T.green}44` : "none", transition: "box-shadow .3s" }}>
                {step.board.map((row, ri) => (
                  <div key={ri} style={{ display: "flex" }}>
                    {row.map((cell, ci) => {
                      const isDark = (ri + ci) % 2 === 0;
                      const isTryCell = ri === step.row && ci === step.col;
                      const isConflict = isTryCell && step.safe === false;
                      const isBacktrack = isTryCell && step.backtrack;
                      return (
                        <div key={ci} style={{
                          width: cellSize, height: cellSize,
                          background: isConflict ? T.redSoft : isBacktrack ? T.yellowSoft : isDark ? T.surface3 : T.surface2,
                          border: isTryCell ? `2px solid ${isConflict ? T.red : isBacktrack ? T.yellow : T.accent}` : "1px solid " + T.border,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all .15s",
                          boxShadow: isTryCell && !isConflict && !isBacktrack ? `inset 0 0 10px ${T.accent}44` : "none",
                        }}>
                          {cell === 1 && (
                            <div className={isTryCell && step.safe ? "qdrop" : ""} style={{ fontSize: cellSize * 0.55, lineHeight: 1, filter: step.solved ? "drop-shadow(0 0 6px gold)" : "none" }}>♛</div>
                          )}
                          {isConflict && <div style={{ fontSize: cellSize * 0.45, lineHeight: 1 }}>✗</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Row indicator */}
              <div style={{ display: "flex", gap: 4 }}>
                {Array.from({ length: n }, (_, i) => (
                  <div key={i} style={{ width: cellSize, height: 6, borderRadius: 3, background: i < step.row ? T.green : i === step.row ? T.accent : T.surface3, transition: "all .2s" }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {step && (
          <StepFooter
            label={step.desc} stepIdx={stepIdx} total={steps.length}
            onBack={() => setStepIdx(i => Math.max(0, i-1))}
            onFwd={() => setStepIdx(i => Math.min(steps.length-1, i+1))}
            mobile={mobile} playing={btPlaying} onTogglePlay={btToggle}
          />
        )}
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="N-Queens Setup">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO.nqueens} activeLine={btPseudoLine} label="N-Queens Backtrack" mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   13. STRING KMP
═══════════════════════════════════════════════════════════════ */
function KMPViz() {
  const mobile = useIsMobile();
  const [text, setText] = useState("AABABACABABACABC");
  const [pattern, setPattern] = useState("ABABAC");
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const vizRef = useRef();

  useSwipe(vizRef,
    () => stepIdx < steps.length - 1 && setStepIdx(i => i + 1),
    () => stepIdx > 0 && setStepIdx(i => i - 1)
  );

  const buildLPS = (pat) => {
    const lps = new Array(pat.length).fill(0);
    let len = 0, i = 1;
    while (i < pat.length) {
      if (pat[i] === pat[len]) { lps[i++] = ++len; }
      else if (len > 0) { len = lps[len - 1]; }
      else { lps[i++] = 0; }
    }
    return lps;
  };

  const build = () => {
    const T2 = text.toUpperCase(), P = pattern.toUpperCase();
    const lps = buildLPS(P);
    const ss = [];

    // LPS build steps
    ss.push({ phase: "lps", lps: [...lps], hi: -1, desc: `Build failure function for "${P}"` });
    const lps2 = new Array(P.length).fill(0); let len2 = 0, i2 = 1;
    while (i2 < P.length) {
      if (P[i2] === P[len2]) { lps2[i2] = ++len2; ss.push({ phase: "lps", lps: [...lps2], hi: i2, desc: `lps[${i2}]=${lps2[i2]}: "${P[i2]}"="${P[len2]}" match, len=${len2}` }); i2++; }
      else if (len2 > 0) { len2 = lps2[len2-1]; ss.push({ phase: "lps", lps: [...lps2], hi: i2, desc: `Mismatch, fallback: len=${len2}` }); }
      else { lps2[i2] = 0; ss.push({ phase: "lps", lps: [...lps2], hi: i2, desc: `lps[${i2}]=0: no prefix-suffix` }); i2++; }
    }
    ss.push({ phase: "lps", lps: [...lps2], hi: -1, done: true, lpsComplete: true, desc: `Failure function built: [${lps.join(",")}]` });

    // Search steps
    ss.push({ phase: "search", ti: 0, pi: 0, matches: [], thi: [], phi: [], desc: `Search: text="${T2}", pattern="${P}"` });
    let ti = 0, pi = 0;
    const matches = [];
    while (ti < T2.length) {
      if (T2[ti] === P[pi]) {
        const phi = Array.from({ length: pi+1 }, (_, k) => k);
        const thi = Array.from({ length: pi+1 }, (_, k) => ti - pi + k);
        ss.push({ phase: "search", ti, pi, matches: [...matches], thi, phi, match: true, desc: `T[${ti}]='${T2[ti]}' = P[${pi}]='${P[pi]}' ✓` });
        ti++; pi++;
        if (pi === P.length) {
          const start = ti - pi;
          matches.push(start);
          ss.push({ phase: "search", ti, pi, matches: [...matches], thi: Array.from({ length: P.length }, (_, k) => start+k), phi: Array.from({ length: P.length }, (_, k) => k), found: true, foundAt: start, desc: `✓ Pattern found at index ${start}!` });
          pi = lps[pi-1];
        }
      } else {
        ss.push({ phase: "search", ti, pi, matches: [...matches], thi: [ti], phi: pi > 0 ? [pi] : [], mismatch: true, desc: `T[${ti}]='${T2[ti]}' ≠ P[${pi}]='${P[pi]}' ✗${pi > 0 ? ` → jump pi to lps[${pi-1}]=${lps[pi-1]}` : " → advance ti"}` });
        if (pi > 0) pi = lps[pi-1];
        else ti++;
      }
    }
    ss.push({ phase: "search", ti: T2.length, pi, matches, thi: [], phi: [], done: true, desc: `Search complete. Found ${matches.length} match${matches.length !== 1 ? "es" : ""} at: [${matches.join(", ")}]` });
    setSteps(ss); setStepIdx(0);
  };

  const step = steps[stepIdx];
  const T2 = text.toUpperCase(), P = pattern.toUpperCase();
  const charW = mobile ? 22 : 28;

  const { playing: kmpPlaying, toggle: kmpToggle } = useStepPlayer(steps, stepIdx, setStepIdx, 450);

  // pseudo line: phase=lps -> lines 0-7, phase=search -> lines 8-15
  const kmpPseudoLine = !step ? -1 :
    step.phase === "lps" ? (step.lpsComplete ? 6 : step.hi < 0 ? 0 : 4) :
    step.done ? 14 : step.found ? 12 : step.match ? 10 : 13;

  const controlsContent = (
    <>
      <div><SLabel>Text</SLabel><div style={{ marginTop: 6 }}><Input value={text} onChange={setText} placeholder="AABABACABABAC..." mono /></div></div>
      <div><SLabel>Pattern</SLabel><div style={{ marginTop: 6 }}><Input value={pattern} onChange={setPattern} placeholder="ABABAC" mono /></div></div>
      <Btn onClick={build} variant="primary" full>▶ Run KMP</Btn>
      <InfoBox>
        <strong style={{ color: T.text }}>KMP Algorithm</strong><br /><br />
        Uses a failure function (LPS array) to skip unnecessary comparisons on mismatch.
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
          <CRow op="Preprocessing" val="O(m)" color={T.teal} />
          <CRow op="Search" val="O(n)" color={T.green} />
          <CRow op="Total" val="O(n+m)" color={T.green} />
          <CRow op="Naive" val="O(nm)" color={T.red} />
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: T.muted }}>
          LPS = Longest Proper Prefix which is also Suffix
        </div>
      </InfoBox>
    </>
  );

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {!mobile && <Side>{controlsContent}</Side>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {mobile && (
          <MobileStrip>
            <Input value={pattern} onChange={setPattern} placeholder="Pattern…" mono style={{ fontSize: 11, width: 100 }} />
            <Btn onClick={build} variant="primary" sm>▶ KMP</Btn>
            <Btn onClick={() => setSheetOpen(true)} variant="ghost" sm>Text</Btn>
          </MobileStrip>
        )}

        <div ref={vizRef} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: mobile ? "8px 8px" : "16px 20px", position: "relative", overflow: "auto", gap: 20 }}>
          {mobile && <InfoPill onClick={() => setInfoVisible(v => !v)} />}
          {mobile && <QuickInfo visible={infoVisible} onClose={() => setInfoVisible(false)}
            title="KMP String Search" desc="Build failure function to skip comparisons. Much faster than naive O(nm) approach." time="O(n+m)" space="O(m)" note="Swipe ← →" />}

          {!step ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>🔤</div>
              <div style={{ color: T.muted2, fontSize: 13 }}>Enter text + pattern and click Run KMP</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
              {/* Phase badge */}
              <div style={{ display: "flex", gap: 8 }}>
                <Badge color={step.phase === "lps" ? T.accent : T.surface3}>Phase 1: Build LPS</Badge>
                <Badge color={step.phase === "search" ? T.accent : T.surface3}>Phase 2: Search</Badge>
                {step.matches?.length > 0 && <Badge color={T.green}>{step.matches.length} match{step.matches.length !== 1 ? "es" : ""}</Badge>}
              </div>

              {/* LPS table (always visible once built) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: ".05em" }}>FAILURE FUNCTION (LPS)</div>
                <div style={{ display: "flex", gap: 1 }}>
                  {P.split("").map((c, i) => {
                    const isHi = step.phase === "lps" && step.hi === i;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <div style={{ width: charW, height: charW, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 10 : 12, background: isHi ? T.accentSoft : T.surface2, border: `1px solid ${isHi ? T.accent : T.border2}`, color: isHi ? T.accent : T.muted2 }}>{c}</div>
                        <div style={{ width: charW, height: charW - 4, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 9 : 11, background: isHi ? T.yellowSoft : T.surface3, border: `1px solid ${isHi ? T.yellow : T.border}`, color: isHi ? T.yellow : T.muted }}>{step.lps?.[i] ?? "–"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search visualization */}
              {step.phase === "search" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%", overflowX: "auto" }}>
                  {/* Text row */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 2 }}>TEXT</div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {T2.split("").map((c, i) => {
                        const isTHi = step.thi?.includes(i);
                        const isMatchedFinal = step.matches?.some(start => i >= start && i < start + P.length);
                        const isNewMatch = step.found && step.foundAt !== undefined && i >= step.foundAt && i < step.foundAt + P.length;
                        return (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: charW, height: charW, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 10 : 12, background: isNewMatch ? T.greenSoft : isTHi ? (step.mismatch ? T.redSoft : T.yellowSoft) : isMatchedFinal ? T.tealSoft : T.surface2, border: `1px solid ${isNewMatch ? T.green : isTHi ? (step.mismatch ? T.red : T.yellow) : isMatchedFinal ? T.teal : T.border2}`, color: isNewMatch ? T.green : isTHi ? (step.mismatch ? T.red : T.yellow) : isMatchedFinal ? T.teal : T.muted2, transition: "all .18s" }}>{c}</div>
                            <div style={{ fontSize: 8, color: T.muted, fontFamily: "'Space Mono',monospace" }}>{i}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pattern row — aligned under current position */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 2 }}>PATTERN</div>
                    <div style={{ display: "flex", gap: 1, marginLeft: `${(step.ti - step.pi) * (charW + 1)}px`, transition: "margin .2s" }}>
                      {P.split("").map((c, i) => {
                        const isPHi = step.phi?.includes(i);
                        return (
                          <div key={i} style={{ width: charW, height: charW, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: mobile ? 10 : 12, background: isPHi ? (step.mismatch && i === step.pi ? T.redSoft : step.found ? T.greenSoft : T.yellowSoft) : T.surface3, border: `1px solid ${isPHi ? (step.mismatch && i === step.pi ? T.red : step.found ? T.green : T.yellow) : T.border}`, color: isPHi ? (step.mismatch && i === step.pi ? T.red : step.found ? T.green : T.yellow) : T.muted }}>{c}</div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {step && (
          <StepFooter
            label={step.desc} stepIdx={stepIdx} total={steps.length}
            onBack={() => setStepIdx(i => Math.max(0, i-1))}
            onFwd={() => setStepIdx(i => Math.min(steps.length-1, i+1))}
            mobile={mobile} playing={kmpPlaying} onTogglePlay={kmpToggle}
          />
        )}
        {mobile && <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="KMP Setup">{controlsContent}</BottomSheet>}
      </div>
      {!mobile && <PseudoPanel lines={PSEUDO.kmp} activeLine={kmpPseudoLine} label="KMP Search" mobile={mobile} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   14. COMPLEXITY QUIZ
═══════════════════════════════════════════════════════════════ */
const QUIZ_BANK = [
  { q: "Binary search on a sorted array of n elements", a: "O(log n)", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], why: "Each step eliminates half the remaining elements." },
  { q: "Bubble sort worst case", a: "O(n²)", opts: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"], why: "n passes, each up to n comparisons." },
  { q: "Inserting into a hash table (average)", a: "O(1)", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], why: "Direct index computation via hash function." },
  { q: "Merge sort on n elements", a: "O(n log n)", opts: ["O(n)", "O(n log n)", "O(n²)", "O(n²log n)"], why: "log n split levels × O(n) merge per level." },
  { q: "Inserting a node in a linked list (at head)", a: "O(1)", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], why: "Only update head pointer — constant time." },
  { q: "BST search in a balanced tree of n nodes", a: "O(log n)", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], why: "Height of balanced tree is log n." },
  { q: "BFS/DFS traversal of a graph with V vertices and E edges", a: "O(V+E)", opts: ["O(V)", "O(E)", "O(V+E)", "O(V·E)"], why: "Every vertex and edge is visited exactly once." },
  { q: "Inserting a key into a min-heap", a: "O(log n)", opts: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], why: "Bubble-up at most log n levels." },
  { q: "Trie insert/search for a word of length m", a: "O(m)", opts: ["O(1)", "O(m)", "O(log m)", "O(m·n)"], why: "Traverse one node per character, word length m." },
  { q: "QuickSort average case", a: "O(n log n)", opts: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], why: "Random pivot gives balanced partitions on average." },
  { q: "Fibonacci with memoization (DP)", a: "O(n)", opts: ["O(1)", "O(n)", "O(n²)", "O(2ⁿ)"], why: "Each subproblem computed once and cached." },
  { q: "Two-pointer technique on a sorted array", a: "O(n)", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], why: "Each pointer moves at most n steps total." },
  { q: "Naive string matching (n text, m pattern)", a: "O(nm)", opts: ["O(n+m)", "O(n log m)", "O(nm)", "O(m²)"], why: "For each position, compare up to m chars." },
  { q: "KMP string matching", a: "O(n+m)", opts: ["O(n)", "O(n+m)", "O(nm)", "O(n log m)"], why: "O(m) preprocess + O(n) search, never re-examines chars." },
  { q: "Stack push / pop operations", a: "O(1)", opts: ["O(1)", "O(log n)", "O(n)", "O(n²)"], why: "Only operates on the top of the stack." },
];

function QuizViz() {
  const mobile = useIsMobile();
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [history, setHistory] = useState([]);
  const [shuffled] = useState(() => [...QUIZ_BANK].sort(() => Math.random() - 0.5));

  const q = shuffled[qIdx % shuffled.length];
  const isAnswered = selected !== null;

  const answer = (opt) => {
    if (isAnswered) return;
    setSelected(opt);
    const correct = opt === q.a;
    if (correct) setScore(s => s + 1);
    setAnswered(a => a + 1);
    setHistory(h => [...h, { q: q.q, correct, chosen: opt, answer: q.a }]);
  };

  const next = () => {
    setSelected(null);
    setQIdx(i => i + 1);
  };

  const reset = () => { setSelected(null); setScore(0); setAnswered(0); setHistory([]); setQIdx(0); };

  const pct = answered > 0 ? Math.round(score / answered * 100) : 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header bar */}
      <div style={{ padding: mobile ? "8px 14px" : "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Badge color={T.accent}>Q {(qIdx % shuffled.length) + 1}/{shuffled.length}</Badge>
          <Badge color={pct >= 70 ? T.green : pct >= 40 ? T.yellow : T.red}>Score: {score}/{answered}</Badge>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {answered > 0 && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 12, color: pct >= 70 ? T.green : T.yellow }}>{pct}%</div>}
          <Btn onClick={reset} variant="ghost" sm>↺ Reset</Btn>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: T.surface3 }}>
        <div style={{ height: "100%", width: `${((qIdx % shuffled.length) / shuffled.length) * 100}%`, background: T.accent, transition: "width .3s" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "20px 16px" : "28px 40px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 600, width: "100%", alignSelf: "center" }}>
        {/* Question */}
        <div className="sup" key={qIdx} style={{ background: T.surface, border: `1px solid ${T.border2}`, borderRadius: 16, padding: mobile ? "16px 18px" : "20px 24px" }}>
          <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Time Complexity</div>
          <div style={{ fontSize: mobile ? 15 : 17, color: T.text, fontWeight: 500, lineHeight: 1.5 }}>{q.q}</div>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.opts.map(opt => {
            const isSelected = opt === selected;
            const isCorrect = opt === q.a;
            const showResult = isAnswered;
            const bg = showResult && isCorrect ? T.greenSoft : showResult && isSelected && !isCorrect ? T.redSoft : isSelected ? T.accentSoft : T.surface;
            const border = showResult && isCorrect ? T.green : showResult && isSelected && !isCorrect ? T.red : isSelected ? T.accent : T.border2;
            const color = showResult && isCorrect ? T.green : showResult && isSelected && !isCorrect ? T.red : isSelected ? T.accent : T.text;
            return (
              <button key={opt} onClick={() => answer(opt)} className={showResult && isCorrect ? "pop" : ""} style={{
                padding: mobile ? "12px 16px" : "14px 20px", borderRadius: 12, textAlign: "left",
                cursor: isAnswered ? "default" : "pointer", fontFamily: "'Space Mono',monospace",
                fontSize: mobile ? 13 : 15, fontWeight: 700,
                background: bg, border: `2px solid ${border}`, color,
                transition: "all .2s",
                boxShadow: showResult && isCorrect ? `0 0 14px ${T.green}44` : "none",
              }}>
                {showResult && isCorrect && "✓ "}{showResult && isSelected && !isCorrect && "✗ "}{opt}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div className="sup" style={{ background: selected === q.a ? T.greenSoft : T.redSoft, border: `1px solid ${selected === q.a ? T.green : T.red}44`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: selected === q.a ? T.green : T.red, marginBottom: 6 }}>
              {selected === q.a ? "✓ Correct!" : `✗ Answer: ${q.a}`}
            </div>
            <div style={{ fontSize: 12, color: T.muted2, lineHeight: 1.55 }}>{q.why}</div>
            <button onClick={next} style={{
              marginTop: 12, padding: "8px 20px", borderRadius: 100, background: T.accent,
              border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}>Next Question →</button>
          </div>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <div>
            <SLabel style={{ marginBottom: 8 }}>Recent Answers</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {history.slice(-4).reverse().map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.surface, borderRadius: 10, border: `1px solid ${h.correct ? T.green + "33" : T.red + "33"}` }}>
                  <span style={{ fontSize: 12 }}>{h.correct ? "✓" : "✗"}</span>
                  <div style={{ flex: 1, fontSize: 11, color: T.muted2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.q}</div>
                  <Badge color={h.correct ? T.green : T.red}>{h.answer}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP — 2-LEVEL NAVIGATION
═══════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  {
    id: "linear", icon: "📦", label: "Linear",
    tabs: [
      { id: "stack",    icon: "📚", label: "Stack/Queue",  badge: "LIFO·FIFO",  component: StackQueueViz },
      { id: "linkedlist", icon: "🔗", label: "Linked List", badge: "ptr",       component: LinkedListViz },
      { id: "bsearch",  icon: "🔍", label: "Bin. Search",  badge: "O(log n)",  component: BinarySearchViz },
      { id: "hash",     icon: "🔑", label: "Hash Table",   badge: "O(1)",      component: HashTableViz },
    ]
  },
  {
    id: "trees", icon: "🌳", label: "Trees",
    tabs: [
      { id: "bst",   icon: "🌲", label: "BST",       badge: "traversal", component: BSTViz },
      { id: "heap",  icon: "⛰", label: "Heap",      badge: "min-heap",  component: HeapViz },
      { id: "trie",  icon: "🔤", label: "Trie",      badge: "prefix",    component: TrieViz },
    ]
  },
  {
    id: "algos", icon: "📐", label: "Algorithms",
    tabs: [
      { id: "sort",    icon: "📊", label: "Sorting",     badge: "5 algos",  component: SortingViz },
      { id: "graph",   icon: "🕸",  label: "Graph",       badge: "BFS·DFS", component: GraphViz },
      { id: "dp",      icon: "🧮", label: "DP",           badge: "3 types", component: DPViz },
      { id: "twoptr",  icon: "👆", label: "Two Pointer",  badge: "O(n)",    component: TwoPointerViz },
      { id: "backtrack", icon: "♛", label: "Backtrack", badge: "N-Queens", component: BacktrackingViz },
      { id: "kmp",     icon: "🔎", label: "KMP",          badge: "O(n+m)",  component: KMPViz },
    ]
  },
  {
    id: "practice", icon: "🧠", label: "Practice",
    tabs: [
      { id: "quiz", icon: "⚡", label: "Complexity Quiz", badge: "15 Qs", component: QuizViz },
    ]
  },
];

export default function App() {
  const [catId, setCatId] = useState("linear");
  const [tabId, setTabId] = useState("stack");
  const mobile = useIsMobile();

  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
      document.head.appendChild(meta);
    }
  }, []);

  const activeCat = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  const activeTab = activeCat.tabs.find(t => t.id === tabId) || activeCat.tabs[0];
  const ActiveComponent = activeTab.component;

  const switchCat = (newCatId) => {
    const cat = CATEGORIES.find(c => c.id === newCatId);
    setCatId(newCatId);
    setTabId(cat.tabs[0].id);
  };

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <div style={{ padding: mobile ? "8px 14px" : "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: mobile ? 12 : 14, fontWeight: 700, color: T.yellow }}>⚡ EduAI</span>
          {!mobile && <span style={{ color: T.surface3 }}>/</span>}
          {!mobile && <span style={{ fontSize: 13, color: T.muted2 }}>DSA Visualizer</span>}
          {mobile && <span style={{ fontSize: 11, color: T.muted, marginLeft: 2 }}>DSA Viz</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!mobile && (
            <div style={{ fontSize: 11, color: T.muted2, background: T.surface2, padding: "3px 10px", borderRadius: 100, border: `1px solid ${T.border}` }}>
              {activeTab.label} · {activeTab.badge}
            </div>
          )}
          {mobile && (
            <div style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>
              {activeTab.icon} {activeTab.label}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop: Category tabs ── */}
      {!mobile && (
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface, paddingLeft: 8, flexShrink: 0 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => switchCat(cat.id)} style={{
              padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", background: "none",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: catId === cat.id ? `2px solid ${T.accent}` : "2px solid transparent",
              marginBottom: -1, color: catId === cat.id ? T.accent : T.muted,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all .14s",
            }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop: Sub-tabs ── */}
      {!mobile && (
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface2, paddingLeft: 12, overflowX: "auto", flexShrink: 0 }}>
          {activeCat.tabs.map(tab => (
            <button key={tab.id} onClick={() => setTabId(tab.id)} style={{
              padding: "7px 14px", fontSize: 11, fontWeight: 500, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", background: "none",
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottom: tabId === tab.id ? `2px solid ${T.accent}` : "2px solid transparent",
              marginBottom: -1, color: tabId === tab.id ? T.text : T.muted,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all .14s",
            }}>
              {tab.icon} {tab.label}
              <span style={{ fontSize: 9, fontFamily: "'Space Mono',monospace", background: tabId === tab.id ? T.accentSoft : T.surface3, color: tabId === tab.id ? T.accent : T.muted, padding: "1px 5px", borderRadius: 100, border: `1px solid ${tabId === tab.id ? T.accent+"44" : T.border2}` }}>{tab.badge}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ActiveComponent />
      </div>

      {/* ── Mobile: Bottom category nav ── */}
      {mobile && (
        <div style={{ flexShrink: 0, background: T.surface, borderTop: `1px solid ${T.border}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* Sub-tab strip for current category */}
          <div style={{ display: "flex", overflowX: "auto", padding: "6px 8px", borderBottom: `1px solid ${T.border}`, gap: 5, background: T.surface2 }}>
            {activeCat.tabs.map(tab => (
              <button key={tab.id} onClick={() => setTabId(tab.id)} style={{
                padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                fontFamily: "'DM Sans',sans-serif",
                background: tabId === tab.id ? T.accent : "transparent",
                border: `1px solid ${tabId === tab.id ? T.accent : T.border2}`,
                color: tabId === tab.id ? "#fff" : T.muted,
              }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Category nav */}
          <div style={{ display: "flex" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => switchCat(cat.id)} style={{
                flex: 1, padding: "7px 2px 5px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, cursor: "pointer", background: "none",
                border: "none", borderTop: catId === cat.id ? `2px solid ${T.accent}` : "2px solid transparent",
                color: catId === cat.id ? T.accent : T.muted, transition: "color .14s",
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{cat.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
