import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, Log, Badge, Select, useStepGuide } from "../shared";

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
    { u: "A", v: "B", w: 4 }, { u: "A", v: "C", w: 2 },
    { u: "B", v: "D", w: 5 }, { u: "B", v: "E", w: 3 },
    { u: "C", v: "F", w: 6 }, { u: "C", v: "G", w: 1 },
    { u: "E", v: "F", w: 2 }, { u: "D", v: "E", w: 7 },
  ],
};

// Reconstruct the shortest path from the parent map
function reconstructPath(prev: Record<string, string | null>, target: string): string[] {
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null && cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  return path.length > 1 ? path : [];
}

export default function GraphViz() {
  const [algo, setAlgo] = useState("bfs");
  const [start, setStart] = useState("A");
  const [end, setEnd] = useState("G");
  const [visited, setVisited] = useState(new Set<string>());
  const [checking, setChecking] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [edgeState, setEdgeState] = useState<Record<string, string>>({});
  const [pathNodes, setPathNodes] = useState(new Set<string>());
  const [queue, setQueue] = useState<string[]>([]);
  const [dist, setDist] = useState<Record<string, number>>({});
  const [log, setLog] = useState<{ m: string; t: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [label, setLabel] = useState("Press Run to start");
  const stopRef = useRef(false);
  const addLog = (m: string, t = "info") => setLog(l => [...l.slice(-24), { m, t }]);
  const guide = useStepGuide();

  // Build adjacency list
  const adj: Record<string, { node: string; w: number }[]> = {};
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
  };

  const runExample = async () => {
    guide.resetGuide();
    resetState();
    setStart("A");
    setEnd("G");
    const algoDescs: Record<string, { body: string; tip: string }> = {
      bfs: { body: "BFS (Breadth-First Search) explores nodes level by level using a queue. It visits all neighbors of the current node before moving to the next level. Guarantees the shortest path in unweighted graphs.", tip: "BFS is O(V+E). Use it when you need the SHORTEST path in an unweighted graph. Think 'nearest' or 'minimum steps' problems." },
      dfs: { body: "DFS (Depth-First Search) explores as far as possible along each branch before backtracking. It uses a stack (or recursion). Does NOT guarantee shortest path.", tip: "DFS is O(V+E). Use for cycle detection, topological sorting, connected components, and maze solving. Think 'explore all paths' problems." },
      dijkstra: { body: "Dijkstra's algorithm finds the shortest path in WEIGHTED graphs using a priority queue. It greedily picks the closest unvisited node and relaxes its neighbors.", tip: "Dijkstra is O((V+E)log V). Cannot handle negative edge weights (use Bellman-Ford for that). Most common shortest-path algorithm in interviews." },
    };
    const desc = algoDescs[algo] || algoDescs.bfs;
    await guide.showGuide({
      title: "Graph Traversal Algorithms",
      body: "Graphs consist of vertices (nodes) and edges (connections). Traversal algorithms visit all reachable nodes from a starting point. The order of visits depends on the algorithm used.",
      tip: "Know BFS vs DFS: BFS uses a queue (level-order), DFS uses a stack (depth-first). Dijkstra extends BFS for weighted graphs."
    }, 1, 3);
    if (!guide.isSkipped()) await guide.showGuide({
      title: `How ${algo.toUpperCase()} Works`,
      body: desc.body,
      tip: desc.tip
    }, 2, 3);
    if (!guide.isSkipped()) await guide.showGuide({
      title: "Ready to Run!",
      body: `Example set: find path from A → G using ${algo.toUpperCase()}. Press ▶ Run to watch the algorithm explore the graph step-by-step. Green = visited, Yellow = active, Orange = checking.`,
      tip: "Watch the log panel to see each decision the algorithm makes. Try different algorithms on the same graph to compare!"
    }, 3, 4);
    if (!guide.isSkipped()) await guide.showGuide({
      title: "Time & Space Complexity",
      body: "BFS & DFS: Time O(V+E), Space O(V). Dijkstra: Time O((V+E)log V) with priority queue, Space O(V).",
      tip: "BFS finds shortest paths on unweighted graphs. Dijkstra handles weighted graphs (no negative edges)."
    }, 4, 4);
    setLabel(`⚡ Example: A→G loaded — press ▶ Run`);
  };

  // ── tick helper ──
  const tick = (opts: {
    vis?: Set<string>; cur?: string | null; chk?: string | null;
    es?: Record<string, string>; q?: string[]; msg: string;
    d?: Record<string, number>;
  }) => new Promise<void>(res => {
    const { vis, cur, chk, es, q, msg, d } = opts;
    if (vis) setVisited(new Set(vis));
    if (cur !== undefined) setActiveNode(cur);
    if (chk !== undefined) setChecking(chk);
    if (es) setEdgeState({ ...es });
    if (q) setQueue([...q]);
    if (d && Object.keys(d).length) setDist({ ...d });
    setLabel(msg); addLog(msg, "info");
    setTimeout(res, speed);
    if (stopRef.current) throw new Error("stopped");
  });

  // Flash the final path edges/nodes
  const flashPath = async (path: string[], es: Record<string, string>) => {
    const pSet = new Set(path);
    const pEdges = { ...es };
    for (let i = 0; i < path.length - 1; i++) {
      pEdges[`${path[i]}-${path[i + 1]}`] = "path";
      pEdges[`${path[i + 1]}-${path[i]}`] = "path";
    }
    setPathNodes(pSet);
    setEdgeState(pEdges);
    setActiveNode(null); setChecking(null);
    setLabel(`✓ Path: ${path.join(" → ")}  (${path.length - 1} hops)`);
    addLog(`Path found: ${path.join(" → ")}`, "ok");
  };

  // ── algorithms ──
  const run = async () => {
    if (running) return;
    setRunning(true); stopRef.current = false;
    setVisited(new Set()); setChecking(null); setActiveNode(null);
    setEdgeState({}); setPathNodes(new Set());
    setQueue([]); setDist({});

    try {
      if (algo === "bfs") {
        const vis = new Set([start]);
        const q = [start];
        const prev: Record<string, string | null> = { [start]: null };
        const es: Record<string, string> = {};
        await tick({ vis, cur: start, es, q: [...q], msg: `BFS: start at ${start}` });

        let found = false;
        while (q.length && !found) {
          const cur = q.shift()!;
          await tick({ vis, cur, chk: null, es, q: [...q], msg: `Dequeue ${cur} — queue: [${q.join(", ")}]` });

          for (const { node: nb } of (adj[cur] || [])) {
            await tick({ vis, cur, chk: nb, es, q: [...q], msg: `Check ${cur}→${nb}` });
            if (!vis.has(nb)) {
              vis.add(nb); prev[nb] = cur;
              q.push(nb);
              es[`${cur}-${nb}`] = "tree"; es[`${nb}-${cur}`] = "tree";
              await tick({ vis, cur, chk: nb, es, q: [...q], msg: `Discover ${nb} from ${cur}` });
              if (nb === end) { found = true; break; }
            }
          }
        }

        const path = reconstructPath(prev, end);
        if (path.length) await flashPath(path, es);
        else await tick({ vis, cur: null, chk: null, es, q: [], msg: `BFS complete — ${end} not reachable from ${start}` });

      } else if (algo === "dfs") {
        const vis = new Set<string>();
        const es: Record<string, string> = {};
        const prev: Record<string, string | null> = { [start]: null };
        let found = false;

        const dfs = async (node: string) => {
          if (stopRef.current || found) throw new Error("stopped");
          vis.add(node);
          await tick({ vis, cur: node, chk: null, es, q: [], msg: `DFS: enter ${node}` });

          if (node === end) { found = true; return; }

          for (const { node: nb } of (adj[node] || [])) {
            if (found) break;
            await tick({ vis, cur: node, chk: nb, es, q: [], msg: `Check ${node}→${nb}` });
            if (!vis.has(nb)) {
              prev[nb] = node;
              es[`${node}-${nb}`] = "tree"; es[`${nb}-${node}`] = "tree";
              await tick({ vis, cur: node, chk: nb, es, q: [], msg: `${node} → ${nb}` });
              await dfs(nb);
              if (!found) await tick({ vis, cur: node, chk: null, es, q: [], msg: `Backtrack to ${node}` });
            }
          }
        };

        await dfs(start);
        const path = reconstructPath(prev, end);
        if (path.length) await flashPath(path, es);
        else await tick({ vis, cur: null, chk: null, es, q: [], msg: `DFS complete — ${end} not reachable` });

      } else {
        // Dijkstra
        const INF = 99999;
        const d: Record<string, number> = {};
        const prev: Record<string, string | null> = {};
        GRAPH_PRESET.nodes.forEach(n => { d[n.id] = INF; prev[n.id] = null; });
        d[start] = 0;
        const pq: [number, string][] = [[0, start]];
        const vis = new Set<string>();
        const es: Record<string, string> = {};

        await tick({ vis, cur: null, chk: null, es, q: [], msg: `Dijkstra: dist[${start}]=0, all others ∞`, d: { ...d } });

        while (pq.length) {
          pq.sort((a, b) => a[0] - b[0]);
          const [cost, u] = pq.shift()!;
          if (vis.has(u)) continue;
          vis.add(u);
          await tick({ vis, cur: u, chk: null, es, q: [], msg: `Visit ${u}, dist=${cost}`, d: { ...d } });
          if (u === end) break;

          for (const { node: v, w } of (adj[u] || [])) {
            await tick({ vis, cur: u, chk: v, es, q: [], msg: `Relax ${u}→${v} (w=${w}): ${cost}+${w}=${cost + w} vs ${d[v] === INF ? "∞" : d[v]}`, d: { ...d } });
            if (!vis.has(v) && d[u] + w < d[v]) {
              d[v] = d[u] + w;
              prev[v] = u;
              es[`${u}-${v}`] = "tree"; es[`${v}-${u}`] = "tree";
              pq.push([d[v], v]);
              await tick({ vis, cur: u, chk: v, es, q: [], msg: `Updated dist[${v}]=${d[v]} via ${u}`, d: { ...d } });
            }
          }
        }

        const path = reconstructPath(prev, end);
        if (path.length) {
          await flashPath(path, es);
          setDist({ ...d });
          setLabel(`✓ Shortest path ${start}→${end}: ${path.join(" → ")}  cost=${d[end]}`);
        } else {
          await tick({ vis, cur: null, chk: null, es, q: [], msg: `${end} not reachable from ${start}`, d: { ...d } });
        }
      }
    } catch (e: any) { if (e.message !== "stopped") throw e; }
    setRunning(false); setActiveNode(null); setChecking(null);
  };

  const nodePos = Object.fromEntries(GRAPH_PRESET.nodes.map(n => [n.id, { x: n.x, y: n.y }]));

  // Node colour logic
  const getNodeStyle = (nid: string) => {
    const isPath = pathNodes.has(nid);
    const isActive = nid === activeNode;
    const isCheck = nid === checking;
    const isVis = visited.has(nid);
    const isStart = nid === start;
    const isEnd = nid === end;

    if (isPath) return { stroke: T.green, fill: T.greenSoft, glow: T.green, fw: 3 };
    if (isActive) return { stroke: T.yellow, fill: T.yellowSoft, glow: T.yellow, fw: 3 };
    if (isCheck) return { stroke: T.orange, fill: T.orangeSoft, glow: T.orange, fw: 2.5 };
    if (isVis) return { stroke: T.green, fill: T.greenSoft, glow: T.green, fw: 2 };
    if (isEnd) return { stroke: T.red, fill: T.redSoft, glow: null, fw: 2 };
    if (isStart) return { stroke: T.accent, fill: T.accentSoft, glow: null, fw: 2 };
    return { stroke: T.blue, fill: T.surface2, glow: null, fw: 1.5 };
  };

  // Edge colour logic
  const getEdgeStyle = (u: string, v: string) => {
    const key1 = `${u}-${v}`, key2 = `${v}-${u}`;
    const state = edgeState[key1] || edgeState[key2];
    if (state === "path") return { stroke: T.green, width: 3.5, glow: T.green };
    if (state === "checking") return { stroke: T.orange, width: 2.5, glow: T.orange };
    if (state === "tree") return { stroke: T.teal, width: 2.5, glow: null };
    return { stroke: T.surface3, width: 1.5, glow: null };
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div>
          <SLabel>Algorithm</SLabel>
          <div style={{ marginTop: 6 }}>
            <Select
              value={algo} onChange={(v) => { if (!running) { setAlgo(v); resetState(); } }} disabled={running}
              options={[
                ["bfs", "BFS — Breadth First"],
                ["dfs", "DFS — Depth First"],
                ["dijkstra", "Dijkstra — Shortest Path"]
              ]}
            />
          </div>
        </div>
        <div>
          <SLabel>Start Node</SLabel>
          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
            {GRAPH_PRESET.nodes.map(n => {
              const active = n.id === start;
              return (
                <button key={n.id} onClick={() => { if (!running) { setStart(n.id); resetState(); } }} style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "'Space Mono',monospace", background: active ? T.accentSoft : T.surface2, border: `1px solid ${active ? T.accent : T.border2}`, color: active ? T.accent : T.muted2 }}>{n.id}</button>
              );
            })}
          </div>
        </div>
        <div>
          <SLabel>End Node (Target)</SLabel>
          <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
            {GRAPH_PRESET.nodes.map(n => {
              const active = n.id === end;
              return (
                <button key={n.id} onClick={() => { if (!running) { setEnd(n.id); resetState(); } }} style={{ width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "'Space Mono',monospace", background: active ? T.redSoft : T.surface2, border: `1px solid ${active ? T.red : T.border2}`, color: active ? T.red : T.muted2 }}>{n.id}</button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={run} variant="primary" disabled={running} style={{ flex: 1 }}>▶ Run</Btn>
          <Btn onClick={resetState} variant="ghost" disabled={running} style={{ flex: 1 }}>↺ Reset</Btn>
        </div>
        <Btn onClick={runExample} variant="yellow" disabled={running} full>⚡ Learn Graph</Btn>
        <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>
        {algo === "dijkstra" && Object.keys(dist).length > 0 && (
          <div><SLabel>Distances from {start}</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {GRAPH_PRESET.nodes.map(n => (
                <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: pathNodes.has(n.id) ? T.green : visited.has(n.id) ? T.text : T.muted, fontWeight: pathNodes.has(n.id) ? 700 : 400 }}>{n.id}{n.id === end ? " ←target" : ""}</span>
                  <span style={{ fontFamily: "'Space Mono',monospace", color: pathNodes.has(n.id) ? T.green : visited.has(n.id) ? T.accent : T.muted }}>{dist[n.id] === 99999 ? "∞" : dist[n.id]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {algo === "bfs" && queue.length > 0 && (
          <div><SLabel>Queue</SLabel><div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>{queue.map((n, i) => <Badge key={i} color={T.yellow}>{n}</Badge>)}</div></div>
        )}
        <SLabel>Log</SLabel><Log entries={log} />
      </Side>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <guide.Overlay/>
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
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={26}
                    fill={ns.fill} stroke={ns.stroke} strokeWidth={ns.fw}
                    style={ns.glow ? { filter: `drop-shadow(0 0 12px ${ns.glow})` } : {}}
                  />
                  <text x={n.x} y={n.y + 5} textAnchor="middle"
                    fill={ns.stroke} fontSize="14" fontFamily="Space Mono" fontWeight="700">
                    {n.id}
                  </text>
                  {algo === "dijkstra" && d !== undefined && d !== 99999 && (
                    <text x={n.x} y={n.y - 34} textAnchor="middle"
                      fill={pathNodes.has(n.id) ? T.green : T.yellow}
                      fontSize="11" fontFamily="Space Mono" fontWeight="700">{d}</text>
                  )}
                  {n.id === start && !pathNodes.size && (
                    <text x={n.x} y={n.y + 43} textAnchor="middle" fill={T.accent} fontSize="9" fontFamily="DM Sans" fontWeight="700">START</text>
                  )}
                  {n.id === end && !pathNodes.size && (
                    <text x={n.x} y={n.y + 43} textAnchor="middle" fill={T.red} fontSize="9" fontFamily="DM Sans" fontWeight="700">TARGET</text>
                  )}
                </g>
              );
            })}

            {/* Legend */}
            {[
              { c: T.blue, l: "Unvisited" },
              { c: T.orange, l: "Checking" },
              { c: T.green, l: "Path" },
              { c: T.yellow, l: "Active" },
            ].map(({ c, l }, i) => (
              <g key={l} transform={`translate(${12 + i * 105}, 308)`}>
                <circle r="6" fill={c + "22"} stroke={c} strokeWidth="2" />
                <text x="12" y="4" fill={T.muted2} fontSize="11" fontFamily="DM Sans">{l}</text>
              </g>
            ))}
          </svg>
        </div>
        <div style={{
          padding: "9px 20px",
          borderTop: `1px solid ${T.border}`, background: T.surface,
          fontSize: 12, color: T.muted2, minHeight: 34,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
          <div style={{ display: "flex", gap: 12, flexShrink: 0, fontFamily: "'Space Mono',monospace", fontSize: 10 }}>
            {visited.size > 0 && <span style={{ color: T.green }}>✓ {visited.size}/{GRAPH_PRESET.nodes.length} visited</span>}
            {algo === "bfs" && queue.length > 0 && <span style={{ color: T.yellow }}>queue: {queue.length}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
