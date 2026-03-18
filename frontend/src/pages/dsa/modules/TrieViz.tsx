import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, Log, Input, Badge, useStepGuide } from "../shared";

type TN = { children: Record<string, TN>; end: boolean; id: number };
let _id = 0;
function newNode(): TN { return { children: {}, end: false, id: _id++ }; }
function tiInsert(root: TN, word: string) {
  let n = root;
  for (const c of word) {
    if (!n.children[c]) n.children[c] = newNode();
    n = n.children[c];
  }
  n.end = true;
}
function tiSearch(root: TN, word: string): boolean {
  let n = root;
  for (const c of word) { if (!n.children[c]) return false; n = n.children[c]; }
  return n.end;
}
function tiAutoPath(root: TN, prefix: string): { node: TN | null; path: number[] } {
  let n = root;
  const path: number[] = [root.id];
  for (const c of prefix) {
    if (!n.children[c]) return { node: null, path };
    n = n.children[c];
    path.push(n.id);
  }
  return { node: n, path };
}
function tiAuto(root: TN, prefix: string): string[] {
  const { node } = tiAutoPath(root, prefix);
  if (!node) return [];
  const r: string[] = [];
  function dfs(n: TN, path: string) {
    if (n.end) r.push(path);
    for (const [c, child] of Object.entries(n.children)) { if (r.length < 10) dfs(child, path + c); }
  }
  dfs(node, prefix);
  return r;
}
function tiAutoIds(root: TN, prefix: string): number[] {
  const { node } = tiAutoPath(root, prefix);
  if (!node) return [];
  const ids: number[] = [];
  function dfs(n: TN) { ids.push(n.id); for (const child of Object.values(n.children)) dfs(child); }
  dfs(node);
  return ids;
}

type NodeEntry = { ch: string; x: number; y: number; end: boolean; id: number; px?: number; py?: number };
function tiToTree(node: TN, ch: string, x: number, y: number, dx: number, arr: NodeEntry[], px?: number, py?: number) {
  arr.push({ ch, x, y, end: node.end, id: node.id, px, py });
  const keys = Object.keys(node.children);
  const startX = x - dx * (keys.length - 1) / 2;
  keys.forEach((k, i) => tiToTree(node.children[k], k, startX + i * dx, y + 58, Math.max(dx / 2, 28), arr, x, y));
}

export default function TrieViz() {
  const [trie] = useState<TN>(() => newNode());
  const [word, setWord] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [log, setLog] = useState<{ m: string; t: string }[]>([]);
  const [label, setLabel] = useState("Insert words to build the trie");
  const [ver, setVer] = useState(0);
  // Visual state: map from node id → color mode
  const [highlight, setHighlight] = useState<Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend">>({});
  const runRef = useRef(false);
  const addLog = (m: string, t = "info") => setLog(l => [...l.slice(-25), { m, t }]);
  const guide = useStepGuide();

  const clearHL = () => setHighlight({});

  const insert = () => {
    if (!word.trim()) return;
    const w = word.trim().toLowerCase(); setWord("");
    tiInsert(trie, w); setVer(v => v + 1); clearHL();
    addLog(`insert("${w}")`, "ok");
    setLabel(`<strong>insert("${w}")</strong> — nodes created/updated`);
  };

  const searchAnimated = async () => {
    if (!word.trim() || runRef.current) return;
    const w = word.trim().toLowerCase(); setWord("");
    runRef.current = true;
    clearHL();
    addLog(`search("${w}") — traversing...`, "info");
    setLabel(`<strong>search("${w}")</strong> — traversing character by character...`);

    let n = trie;
    const visited: number[] = [trie.id];
    let found = true;

    for (let i = 0; i < w.length; i++) {
      const c = w[i];
      // Highlight path so far as "search"
      const hl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
      visited.forEach(id => hl[id] = "search");
      setHighlight({ ...hl });
      addLog(`checking '${c}' at depth ${i + 1}`, "info");
      await sleep(500);

      if (!n.children[c]) {
        found = false;
        // Mark current node as notfound
        const failHl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
        visited.forEach(id => failHl[id] = "search");
        failHl[n.id] = "notfound";
        setHighlight({ ...failHl });
        addLog(`'${c}' not found — word doesn't exist`, "err");
        break;
      }

      n = n.children[c];
      visited.push(n.id);
      await sleep(200);
    }

    if (found) {
      const isEnd = n.end;
      const finalHl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
      visited.forEach(id => finalHl[id] = isEnd ? "found" : "notfound");
      if (isEnd) finalHl[n.id] = "wordend";
      setHighlight({ ...finalHl });
      if (isEnd) {
        addLog(`search("${w}") → ✓ FOUND`, "ok");
        setLabel(`<strong>search("${w}")</strong> → <span style="color:${T.green}">✓ found!</span> End-of-word node is highlighted green.`);
      } else {
        addLog(`search("${w}") → prefix exists but not a complete word`, "err");
        setLabel(`<strong>search("${w}")</strong> → prefix exists but not a complete word (not marked as end).`);
      }
    }

    setTimeout(clearHL, 2500);
    runRef.current = false;
  };

  const autocompleteAnimated = async () => {
    if (!word.trim() || runRef.current) return;
    const w = word.trim().toLowerCase(); setWord("");
    runRef.current = true;
    clearHL();
    addLog(`autocomplete("${w}") — finding prefix...`, "info");
    setLabel(`<strong>autocomplete("${w}")</strong> — walking prefix path...`);

    // Animate prefix walk
    let n = trie;
    const prefixIds: number[] = [trie.id];
    let prefixExists = true;

    for (let i = 0; i < w.length; i++) {
      const c = w[i];
      const hl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
      prefixIds.forEach(id => hl[id] = "search");
      setHighlight({ ...hl });
      await sleep(450);

      if (!n.children[c]) {
        prefixExists = false;
        const failHl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
        prefixIds.forEach(id => failHl[id] = "notfound");
        setHighlight({ ...failHl });
        addLog(`prefix "${w}" not found`, "err");
        setLabel(`<strong>autocomplete("${w}")</strong> → prefix not in trie`);
        break;
      }
      n = n.children[c];
      prefixIds.push(n.id);
    }

    if (prefixExists) {
      await sleep(300);
      // Now highlight all nodes in the subtree
      const subtreeIds = tiAutoIds(trie, w);
      const hl: Record<number, "search" | "found" | "notfound" | "autocomplete" | "wordend"> = {};
      prefixIds.forEach(id => hl[id] = "found");
      subtreeIds.forEach(id => { if (!prefixIds.includes(id)) hl[id] = "autocomplete"; });
      // Mark end-of-word nodes in subtree specially
      function markEnds(node: TN, inSubtree: boolean) {
        if (inSubtree && node.end) hl[node.id] = "wordend";
        for (const child of Object.values(node.children)) markEnds(child, inSubtree || subtreeIds.includes(child.id));
      }
      markEnds(trie, false);
      setHighlight({ ...hl });

      const r = tiAuto(trie, w);
      setResults(r);
      addLog(`autocomplete("${w}") → [${r.join(", ")}]`, "ok");
      setLabel(`<strong>autocomplete("${w}")</strong> → ${r.length} words found: <span style="color:${T.green}">${r.join(", ")}</span>`);
    }

    setTimeout(clearHL, 3500);
    runRef.current = false;
  };

  const loadWords = async () => {
    guide.resetGuide();
    await guide.showGuide({
      title: "What is a Trie?",
      body: "A Trie (prefix tree) stores strings character by character. Each node represents a character, and paths from root to nodes form prefixes. Words share common prefixes — saving memory.",
      tip: "Tries enable O(L) lookup (L = word length) regardless of how many words are stored. Much faster than searching an array of strings."
    }, 1, 2);
    if (!guide.isSkipped()) await guide.showGuide({
      title: "Trie Use Cases",
      body: "Insert: walk/create nodes for each character. Search: walk the path — if it exists and is marked as word end. Autocomplete: find the prefix node, then collect all words in the subtree.",
      tip: "Used in: autocomplete, spell checkers, IP routing tables, word games (Boggle). Interview pattern: 'find all words with prefix X'."
    }, 2, 3);
    if (!guide.isSkipped()) await guide.showGuide({
      title: "Trie Complexity",
      body: "Time: O(m) for Insert and Search, where m is the length of the word — it ONLY depends on the word length, NOT the number of words in the tree! Space: O(A * n) where A=alphabet size, n=total nodes.",
      tip: "Tries are incredibly fast for string lookups, but can use a lot of memory compared to a hash map if strings don't share many common prefixes."
    }, 3, 3);
    ["apple", "app", "banana", "band", "bat", "car", "card"].forEach(w => tiInsert(trie, w));
    setVer(v => v + 1); clearHL();
    addLog("Loaded 7 example words", "info");
    setLabel("Words loaded! Try Search: <strong>app</strong> or Autocomplete: <strong>ba</strong>");
  };

  const nodes: NodeEntry[] = [];
  tiToTree(trie, "root", 300, 28, 82, nodes);

  // Color helper
  const getNodeStyle = (n: NodeEntry) => {
    const h = highlight[n.id];
    if (h === "wordend") return { fill: T.greenSoft, stroke: T.green, glow: `0 0 16px ${T.green}88`, textColor: T.green, sw: 3 };
    if (h === "found")   return { fill: T.accentSoft, stroke: T.accent, glow: `0 0 14px ${T.accent}66`, textColor: T.accent, sw: 2.5 };
    if (h === "search")  return { fill: T.yellowSoft, stroke: T.yellow, glow: `0 0 14px ${T.yellow}88`, textColor: T.yellow, sw: 2.5 };
    if (h === "notfound")return { fill: T.redSoft, stroke: T.red, glow: `0 0 14px ${T.red}66`, textColor: T.red, sw: 2.5 };
    if (h === "autocomplete") return { fill: `${T.teal}22`, stroke: T.teal, glow: `0 0 10px ${T.teal}55`, textColor: T.teal, sw: 2 };
    // default
    const col = n.end ? T.green : n.ch === "root" ? T.accent : T.blue;
    return { fill: n.end ? T.greenSoft : T.surface2, stroke: col, glow: "none", textColor: col, sw: n.end ? 2 : 1.5 };
  };

  const getEdgeColor = (n: NodeEntry) => {
    const h = highlight[n.id];
    if (h === "wordend" || h === "found") return T.accent;
    if (h === "search") return T.yellow;
    if (h === "notfound") return T.red;
    if (h === "autocomplete") return T.teal;
    return T.surface3;
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div><SLabel>Word / Prefix</SLabel><div style={{ marginTop: 6 }}><Input value={word} onChange={setWord} placeholder={`e.g. "app"`} onEnter={insert} mono /></div></div>
        <Btn onClick={insert} variant="primary" full>⊕ Insert Word</Btn>
        <Btn onClick={searchAnimated} variant="teal" full>🔍 Animated Search</Btn>
        <Btn onClick={autocompleteAnimated} variant="blue" full>⌨ Animated Autocomplete</Btn>
        <Btn onClick={loadWords} variant="yellow" full>⚡ Learn Trie</Btn>
        {results.length > 0 && (
          <div><SLabel>Autocomplete Results</SLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
              {results.map((r, i) => <Badge key={i} color={T.green}>{r}</Badge>)}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
          <SLabel>Color Legend</SLabel>
          {[
            { color: T.yellow, label: "Traversing" },
            { color: T.green,  label: "Word found (end node)" },
            { color: T.accent, label: "Prefix path" },
            { color: T.teal,   label: "Autocomplete subtree" },
            { color: T.red,    label: "Not found" },
          ].map(({ color, label: l }) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}88` }} />{l}
            </div>
          ))}
        </div>
        <SLabel>Log</SLabel><Log entries={log} />
      </Side>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "auto", padding: 24, position: "relative" }}>
          <guide.Overlay />
          {nodes.length <= 1 ? <div style={{ color: T.muted, fontSize: 13, paddingTop: 60 }}>Trie is empty — insert words or click ⚡ Learn Trie</div> : (
            <svg width="100%" height="100%" viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }} key={ver}>
              <defs>
                {nodes.map((n, i) => {
                  const s = getNodeStyle(n);
                  if (s.glow === "none") return null;
                  return (
                    <filter key={`f${i}`} id={`glow-${n.id}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  );
                })}
              </defs>
              {/* Edges */}
              {nodes.map((n, i) => n.px !== undefined && n.py !== undefined ? (
                <line key={`e${i}`} x1={n.px} y1={n.py} x2={n.x} y2={n.y}
                  stroke={getEdgeColor(n)} strokeWidth={highlight[n.id] ? 2.5 : 1.5}
                  strokeOpacity={highlight[n.id] ? 1 : 0.6}
                  style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                />
              ) : null)}
              {/* Edge char labels */}
              {nodes.map((n, i) => n.px !== undefined && n.py !== undefined ? (
                <text key={`el${i}`}
                  x={(n.x + n.px) / 2 - 8} y={(n.y + n.py) / 2 + 4}
                  fill={highlight[n.id] ? getEdgeColor(n) : T.muted}
                  fontSize="9" fontFamily="Space Mono" fontWeight="600"
                  style={{ transition: "fill 0.3s" }}>
                  {n.ch}
                </text>
              ) : null)}
              {/* Nodes */}
              {nodes.map((n, i) => {
                const s = getNodeStyle(n);
                return (
                  <g key={`n${i}`} style={{ transition: "all 0.3s" }}
                    filter={s.glow !== "none" ? `url(#glow-${n.id})` : undefined}>
                    <circle cx={n.x} cy={n.y} r={18}
                      fill={s.fill} stroke={s.stroke} strokeWidth={s.sw}
                      style={{ transition: "fill 0.3s, stroke 0.3s, stroke-width 0.2s" }}
                    />
                    {/* End-of-word marker ring */}
                    {(n.end || highlight[n.id] === "wordend") && (
                      <circle cx={n.x} cy={n.y} r={22} fill="none"
                        stroke={s.stroke} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7}
                        style={{ transition: "stroke 0.3s" }}
                      />
                    )}
                    <text x={n.x} y={n.y + 4} textAnchor="middle"
                      fill={s.textColor} fontSize={n.ch === "root" ? "9" : "12"}
                      fontFamily="Space Mono" fontWeight="700"
                      style={{ transition: "fill 0.3s" }}>
                      {n.ch === "root" ? "ROOT" : n.ch.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: 12, color: T.muted2 }}
          dangerouslySetInnerHTML={{ __html: label }} />
      </div>
    </div>
  );
}
