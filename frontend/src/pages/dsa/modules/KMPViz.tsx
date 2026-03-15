import { useState, useRef } from "react";
import { T, sleep } from "../theme";
import { Btn, Side, SLabel, SpeedRow, InfoBox, CRow, Log, Input, Badge, useStepGuide } from "../shared";

type CharState = "idle" | "match" | "mismatch" | "active" | "skip" | "found";

function buildFailureTable(pattern: string): number[] {
  const lps = new Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) { lps[i++] = ++len; }
    else if (len > 0) { len = lps[len - 1]; }
    else { lps[i++] = 0; }
  }
  return lps;
}

const EXAMPLES = [
  { label: "Simple Match", text: "AAABAAABAAAB", pattern: "AAAB" },
  { label: "Multiple Matches", text: "AABABCAABABCAABABC", pattern: "ABABC" },
  { label: "KMP Classic", text: "ABABDABACDABABCABAB", pattern: "ABABCABAB" },
  { label: "No Match", text: "AABCAADAABCA", pattern: "AABCAAB" },
];

export default function KMPViz() {
  const [text, setText] = useState("AABABCAABABCAABABC");
  const [pattern, setPattern] = useState("ABABC");
  const [speed, setSpeed] = useState(400);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "lps" | "search" | "done">("idle");
  const [lps, setLps] = useState<number[]>([]);
  const [lpsHL, setLpsHL] = useState<number>(-1);
  const [textStates, setTextStates] = useState<CharState[]>([]);
  const [patStates, setPatStates] = useState<CharState[]>([]);
  const [matches, setMatches] = useState<number[]>([]);
  const [label, setLabel] = useState("Enter text & pattern, then press ▶ Run");
  const [log, setLog] = useState<{ m: string; t: string }[]>([]);
  const stopRef = useRef(false);
  const addLog = (m: string, t = "info") => setLog(l => [...l.slice(-28), { m, t }]);
  const guide = useStepGuide();

  const reset = () => {
    stopRef.current = true;
    setPhase("idle"); setLps([]); setLpsHL(-1);
    setTextStates([]); setPatStates([]); setMatches([]);
    setLabel("Enter text & pattern, then press ▶ Run");
    setRunning(false); setLog([]);
  };

  const loadExample = async (ex: typeof EXAMPLES[0]) => {
    if (running) return;
    reset();
    setText(ex.text);
    setPattern(ex.pattern);
    guide.resetGuide();
    await guide.showGuide({
      title:"KMP String Search",
      body:"KMP (Knuth-Morris-Pratt) finds pattern occurrences in text in O(n+m) time. It precomputes a failure/LPS table from the pattern to avoid redundant comparisons on mismatch.",
      tip:"Brute force string search is O(nm). KMP never goes backward in the text — on mismatch, it uses the LPS table to skip to the right position in the pattern."
    }, 1, 2);
    if(!guide.isSkipped()) await guide.showGuide({
      title:"LPS (Longest Proper Prefix which is also Suffix)",
      body:`LPS table for pattern '${ex.pattern}': for each position i, lps[i] = length of the longest proper prefix of pattern[0..i] that is also a suffix. On mismatch at position j, jump pattern to lps[j-1] instead of restarting.`,
      tip:"This is what makes KMP O(n+m) — the LPS table is built in O(m) time, and the search never revisits text characters."
    }, 2, 2);
    setLabel(`Loaded: \"${ex.label}\" — press ▶ Run`);
  };

  const run = async () => {
    if (!text.trim() || !pattern.trim()) return;
    const T_str = text.toUpperCase().replace(/\s/g, "");
    const P_str = pattern.toUpperCase().replace(/\s/g, "");
    if (P_str.length > T_str.length) { setLabel("Pattern longer than text!"); return; }

    stopRef.current = false;
    setRunning(true);
    setMatches([]);
    setLog([]);

    // ── Phase 1: Build LPS / failure table ──
    setPhase("lps");
    addLog("Phase 1: Build KMP failure (LPS) table", "info");
    const lpsArr = new Array(P_str.length).fill(0);
    setLps([...lpsArr]);

    let len = 0, i = 1;
    setLpsHL(0);
    setLabel(`LPS[0] = 0 (always, by definition)`);
    await sleep(speed);
    if (stopRef.current) { setRunning(false); return; }

    while (i < P_str.length) {
      if (stopRef.current) { setRunning(false); return; }
      setLpsHL(i);
      if (P_str[i] === P_str[len]) {
        lpsArr[i] = ++len;
        setLps([...lpsArr]);
        setLabel(`LPS[${i}]: '${P_str[i]}'='${P_str[len - 1]}' → match → lps[${i}]=${lpsArr[i]}`);
        addLog(`lps[${i}] = ${lpsArr[i]}`, "ok");
        i++;
      } else if (len > 0) {
        setLabel(`'${P_str[i]}'≠'${P_str[len - 1]}' → fallback: len=${lpsArr[len - 1]}`);
        addLog(`Fallback: len=${lpsArr[len - 1]}`, "warn");
        len = lpsArr[len - 1];
      } else {
        lpsArr[i] = 0;
        setLps([...lpsArr]);
        setLabel(`LPS[${i}]: no prefix match → lps[${i}]=0`);
        addLog(`lps[${i}] = 0`, "info");
        i++;
      }
      await sleep(speed);
    }
    setLpsHL(-1);
    addLog("LPS table complete — starting search", "ok");

    // ── Phase 2: String matching ──
    setPhase("search");
    addLog("Phase 2: KMP pattern matching", "info");
    const foundAt: number[] = [];
    let tI = 0, pI = 0;
    const tStates: CharState[] = Array(T_str.length).fill("idle");
    const pStates: CharState[] = Array(P_str.length).fill("idle");
    setTextStates([...tStates]);
    setPatStates([...pStates]);

    while (tI < T_str.length) {
      if (stopRef.current) { setRunning(false); return; }

      // Highlight current comparison
      const ts2 = tStates.map((s, idx) => idx === tI ? "active" : s) as CharState[];
      const ps2 = pStates.map((s, idx) => idx === pI ? "active" : s) as CharState[];
      setTextStates(ts2); setPatStates(ps2);
      setLabel(`Compare text[${tI}]='${T_str[tI]}' vs pattern[${pI}]='${P_str[pI]}'`);
      await sleep(speed);
      if (stopRef.current) { setRunning(false); return; }

      if (T_str[tI] === P_str[pI]) {
        tStates[tI] = "match"; pStates[pI] = "match";
        setTextStates([...tStates]); setPatStates([...pStates]);
        addLog(`✓ Match: '${T_str[tI]}' at text[${tI}]`, "ok");
        tI++; pI++;
        if (pI === P_str.length) {
          const start = tI - pI;
          foundAt.push(start);
          setMatches([...foundAt]);
          for (let k = start; k < tI; k++) tStates[k] = "found";
          setTextStates([...tStates]);
          pStates.fill("found");
          setPatStates([...pStates]);
          setLabel(`🎉 Match found at index ${start}!`);
          addLog(`Match found at index ${start}`, "ok");
          await sleep(speed * 2);
          pStates.fill("idle");
          setPatStates([...pStates]);
          pI = lpsArr[pI - 1];
        }
      } else {
        tStates[tI] = "mismatch"; pStates[pI] = "mismatch";
        setTextStates([...tStates]); setPatStates([...pStates]);
        addLog(`✗ Mismatch: '${T_str[tI]}'≠'${P_str[pI]}'`, "err");
        await sleep(speed);
        if (stopRef.current) { setRunning(false); return; }
        if (pI > 0) {
          addLog(`Use lps[${pI - 1}]=${lpsArr[pI - 1]} → skip ${pI - lpsArr[pI - 1]} chars`, "warn");
          pI = lpsArr[pI - 1];
          pStates.fill("idle");
        } else {
          tStates[tI] = "skip";
          tI++;
          pStates.fill("idle");
        }
        setTextStates([...tStates]); setPatStates([...pStates]);
      }
    }

    setPhase("done");
    const msg = foundAt.length > 0
      ? `✓ Found ${foundAt.length} match${foundAt.length > 1 ? "es" : ""} at index${foundAt.length > 1 ? "es" : ""}: ${foundAt.join(", ")}`
      : `✗ Pattern not found in text`;
    setLabel(msg);
    addLog(msg, foundAt.length > 0 ? "ok" : "err");
    setRunning(false);
  };

  const charColor = (s: CharState) => {
    if (s === "match") return { bg: T.greenSoft, border: T.green, col: T.green };
    if (s === "found") return { bg: T.greenSoft, border: T.green, col: T.green };
    if (s === "mismatch") return { bg: T.redSoft, border: T.red, col: T.red };
    if (s === "active") return { bg: T.yellowSoft, border: T.yellow, col: T.yellow };
    if (s === "skip") return { bg: T.surface3, border: T.surface3, col: T.muted };
    return { bg: T.surface2, border: T.border2, col: T.muted2 };
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div>
          <SLabel>Quick Examples</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            {EXAMPLES.map(ex => (
              <Btn key={ex.label} onClick={() => loadExample(ex)} variant="ghost" disabled={running} full>
                ⚡ {ex.label}
              </Btn>
            ))}
          </div>
        </div>
        <div><SLabel>Text</SLabel><div style={{ marginTop: 6 }}><Input value={text} onChange={setText} placeholder="e.g. AABABCAABABC" mono /></div></div>
        <div><SLabel>Pattern</SLabel><div style={{ marginTop: 6 }}><Input value={pattern} onChange={setPattern} placeholder="e.g. ABABC" mono /></div></div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={run} variant="primary" disabled={running} style={{ flex: 1 }}>▶ Run</Btn>
          <Btn onClick={reset} variant="ghost" disabled={running} style={{ flex: 1 }}>↺ Reset</Btn>
        </div>
        <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>
        <InfoBox>
          <strong style={{ color: T.text }}>KMP String Search</strong><br /><br />
          Build a failure/LPS table from the pattern. During search, on mismatch, skip using LPS — no redundant re-comparisons.
          <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
            <CRow op="Preprocess" val="O(m)" color={T.teal} />
            <CRow op="Search" val="O(n)" color={T.green} />
            <CRow op="Total" val="O(n + m)" color={T.green} />
            <CRow op="Space" val="O(m)" color={T.yellow} />
          </div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { c: T.yellow, l: "Active comparison" },
              { c: T.green, l: "Match / Found" },
              { c: T.red, l: "Mismatch" },
              { c: T.muted, l: "Skipped" },
            ].map(({ c, l }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: T.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
              </div>
            ))}
          </div>
        </InfoBox>
        <SLabel>Log</SLabel><Log entries={log} />
      </Side>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Phase indicator */}
        <div style={{ padding: "8px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", gap: 12, alignItems: "center" }}>
          {[["lps", "1. Build LPS Table"], ["search", "2. Pattern Match"], ["done", "3. Complete"]].map(([p, l]) => (
            <div key={p} style={{ fontSize: 11, fontWeight: 600, color: phase === p ? T.accent : T.muted, fontFamily: "'DM Sans',sans-serif" }}>
              {phase === p ? "▶ " : ""}{l}
            </div>
          ))}
          {matches.length > 0 && <div style={{ marginLeft: "auto" }}>
            <Badge color={T.green}>{matches.length} match{matches.length > 1 ? "es" : ""}</Badge>
          </div>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24, justifyContent: lps.length === 0 ? "center" : "flex-start", alignItems: lps.length === 0 ? "center" : "stretch", position: "relative" }}>
          <guide.Overlay/>

          {lps.length === 0 && phase === "idle" && (
            <div style={{ textAlign: "center", color: T.muted, fontSize: 13 }}>
              <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>🔍</div>
              Enter text & pattern above, then press ▶ Run
            </div>
          )}

          {/* LPS Table */}
          {lps.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                LPS (Failure) Table
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Pattern chars */}
                <div style={{ display: "flex", gap: 3 }}>
                  <div style={{ width: 52, fontSize: 10, color: T.muted, display: "flex", alignItems: "center" }}>Pattern</div>
                  {pattern.toUpperCase().split("").map((c, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, background: lpsHL === i ? T.yellowSoft : T.surface2, border: `1px solid ${lpsHL === i ? T.yellow : T.border2}`, color: lpsHL === i ? T.yellow : T.accent, transition: "all .15s" }}>{c}</div>
                  ))}
                </div>
                {/* Index row */}
                <div style={{ display: "flex", gap: 3 }}>
                  <div style={{ width: 52, fontSize: 10, color: T.muted, display: "flex", alignItems: "center" }}>Index</div>
                  {pattern.split("").map((_, i) => (
                    <div key={i} style={{ width: 36, textAlign: "center", fontSize: 9, color: T.muted, fontFamily: "'Space Mono',monospace" }}>{i}</div>
                  ))}
                </div>
                {/* LPS values */}
                <div style={{ display: "flex", gap: 3 }}>
                  <div style={{ width: 52, fontSize: 10, color: T.muted, display: "flex", alignItems: "center" }}>LPS</div>
                  {lps.map((v, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, background: lpsHL === i ? T.accentSoft : v > 0 ? T.greenSoft : T.surface2, border: `1px solid ${lpsHL === i ? T.accent : v > 0 ? T.green : T.surface3}`, color: lpsHL === i ? T.accent : v > 0 ? T.green : T.muted, transition: "all .2s" }}>{v}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Text display */}
          {textStates.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                Text
              </div>
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {text.toUpperCase().split("").map((c, i) => {
                  const s = textStates[i] || "idle";
                  const style = charColor(s);
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, background: style.bg, border: `1px solid ${style.border}`, color: style.col, transition: "all .15s", boxShadow: (s === "active" || s === "found") ? `0 0 8px ${style.border}55` : "none" }}>{c}</div>
                      <div style={{ fontSize: 8, color: T.muted, fontFamily: "'Space Mono',monospace" }}>{i}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pattern display */}
          {patStates.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                Pattern
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {pattern.toUpperCase().split("").map((c, i) => {
                  const s = patStates[i] || "idle";
                  const style = charColor(s);
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, background: style.bg, border: `1px solid ${style.border}`, color: style.col, transition: "all .15s", boxShadow: s === "active" ? `0 0 8px ${style.border}55` : "none" }}>{c}</div>
                      <div style={{ fontSize: 8, color: T.muted, fontFamily: "'Space Mono',monospace" }}>{i}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Match indices */}
          {matches.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Matches Found
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {matches.map((idx, i) => (
                  <Badge key={i} color={T.green}>index {idx}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "10px 20px", borderTop: `1px solid ${T.border}`, background: T.surface, fontSize: 12, color: T.muted2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
