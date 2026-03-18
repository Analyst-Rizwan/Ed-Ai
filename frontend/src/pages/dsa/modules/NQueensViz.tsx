import { useState, useRef } from "react";
import { T } from "../theme";
import { Btn, Side, SLabel, SpeedRow, Log, Select, useStepGuide, useAnimation, Controls } from "../shared";

type Cell = "empty" | "queen" | "conflict" | "safe" | "backtrack" | "placed";

interface Step {
  board: Cell[][];
  row: number;
  col: number;
  action: "place" | "check" | "conflict" | "backtrack" | "done";
  msg: string;
  solutions: number;
}

function cloneBoard(b: Cell[][]): Cell[][] {
  return b.map(r => [...r]);
}

function isSafe(board: number[], row: number, col: number): boolean {
  for (let r = 0; r < row; r++) {
    const c = board[r];
    if (c === col || Math.abs(c - col) === Math.abs(r - row)) return false;
  }
  return true;
}

export default function NQueensViz() {
  const [n, setN] = useState("6");
  const [speed, setSpeed] = useState(300);
  const anim = useAnimation();
  const [board, setBoard] = useState<Cell[][]>([]);
  const [label, setLabel] = useState("Press ▶ Run to start backtracking");
  const [log, setLog] = useState<{ m: string; t: string }[]>([]);
  const [solutions, setSolutions] = useState(0);
  const [stats, setStats] = useState({ placements: 0, backtracks: 0 });
  const statsRef = useRef({ placements: 0, backtracks: 0 });
  const addLog = (m: string, t = "info") => setLog(l => [...l.slice(-28), { m, t }]);
  const guide = useStepGuide();

  const N = Math.min(Math.max(parseInt(n) || 6, 4), 8);

  const makeBoard = (size: number): Cell[][] =>
    Array.from({ length: size }, () => Array(size).fill("empty") as Cell[]);

  const reset = () => {
    anim.reset();
    setBoard([]);
    setLabel("Press ▶ Run to start backtracking");
    setSolutions(0);
    setStats({ placements: 0, backtracks: 0 });
    statsRef.current = { placements: 0, backtracks: 0 };
    setLog([]);
  };

  const run = async () => {
    guide.resetGuide();
    anim.start();
    statsRef.current = { placements: 0, backtracks: 0 };
    setStats({ placements: 0, backtracks: 0 });
    setSolutions(0);
    setLog([]);

    await guide.showGuide({
      title:"N-Queens & Backtracking",
      body:"The N-Queens problem: place N queens on an N×N chessboard so that no two queens attack each other (same row, column, or diagonal). Backtracking tries placements row by row, undoing ('backtracking') when a conflict is detected.",
      tip:"Backtracking prunes the search space — instead of trying all N² positions, it skips entire subtrees when a conflict is found early."
    }, 1, 2);
    if(!guide.isSkipped()) await guide.showGuide({
      title:`Solving ${N}-Queens`,
      body:`For a ${N}×${N} board, we go row by row. In each row, try each column. If safe (no queen attacks from above), place and move to next row. If no column works, backtrack to the previous row and try the next column.`,
      tip:`Time: O(N!) in worst case. A ${N}×${N} board has ${N===4?"2":N===5?"10":N===6?"4":N===7?"40":"92"} solutions. Watch the colors: green=queen, yellow=checking, red=conflict, orange=backtrack.`
    }, 2, 3);
    if(!guide.isSkipped()) await guide.showGuide({
      title:"Complexity Summary",
      body:"Time: O(N!) — we try all valid combinations, branching less and less as we place more queens. Space: O(N) to store the board state and recursion depth.",
      tip:"N-Queens is the classic backtracking interview question. The 'isSafe' check determines if a column or diagonal is already attacked."
    }, 3, 3);
    const queens: number[] = [];
    let solCount = 0;
    const vizBoard = makeBoard(N);
    setBoard(cloneBoard(vizBoard));

    const tick = async (b: Cell[][], msg: string, t = "info") => {
      if (anim.stopRef.current) throw new Error("stopped");
      setBoard(cloneBoard(b));
      setLabel(msg);
      addLog(msg, t);
      setStats({ ...statsRef.current });
      await anim.sleep(speed);
    };

    const solve = async (row: number): Promise<void> => {
      if (anim.stopRef.current) throw new Error("stopped");
      if (row === N) {
        solCount++;
        setSolutions(solCount);
        // Flash all queens green
        const b = cloneBoard(vizBoard);
        queens.forEach((c, r) => { b[r][c] = "placed"; });
        await tick(b, `🎉 Solution #${solCount} found!`, "ok");
        await anim.sleep(speed * 2);
        return;
      }

      for (let col = 0; col < N; col++) {
        if (anim.stopRef.current) throw new Error("stopped");

        // Show checking cell
        const b1 = cloneBoard(vizBoard);
        queens.forEach((c, r) => { b1[r][c] = "queen"; });
        b1[row][col] = "check" as any;
        await tick(b1, `Row ${row + 1}: Try col ${col + 1}`, "info");

        if (isSafe(queens, row, col)) {
          statsRef.current.placements++;
          queens[row] = col;
          vizBoard[row][col] = "queen";
          const b2 = cloneBoard(vizBoard);
          queens.forEach((c, r) => { b2[r][c] = "queen"; });
          await tick(b2, `✓ Place Queen at (${row + 1}, ${col + 1})`, "ok");
          await solve(row + 1);
          if (anim.stopRef.current) throw new Error("stopped");
          // Backtrack
          statsRef.current.backtracks++;
          vizBoard[row][col] = "empty";
          queens.splice(row, 1);
          const b3 = cloneBoard(vizBoard);
          queens.forEach((c, r) => { b3[r][c] = "queen"; });
          b3[row][col] = "backtrack";
          await tick(b3, `↩ Backtrack from (${row + 1}, ${col + 1})`, "warn");
          const b4 = cloneBoard(vizBoard);
          queens.forEach((c, r) => { b4[r][c] = "queen"; });
          setBoard(cloneBoard(b4));
        } else {
          // Show conflict
          const b2 = cloneBoard(vizBoard);
          queens.forEach((c, r) => { b2[r][c] = "queen"; });
          b2[row][col] = "conflict";
          await tick(b2, `✗ Conflict at (${row + 1}, ${col + 1})`, "err");
          const b3 = cloneBoard(vizBoard);
          queens.forEach((c, r) => { b3[r][c] = "queen"; });
          setBoard(cloneBoard(b3));
        }
      }
    };

    try {
      addLog(`Starting ${N}-Queens backtracking`, "info");
      await solve(0);
      setLabel(`✓ Done! Found ${solCount} solution${solCount !== 1 ? "s" : ""} for ${N}-Queens`);
      addLog(`Complete: ${solCount} solution${solCount !== 1 ? "s" : ""} found`, "ok");
    } catch (e: any) {
      if (e.message !== "stopped") throw e;
    }
    anim.setRunning(false);
  };

  const cellColor = (cell: Cell) => {
    if (cell === "queen") return { bg: T.accentSoft, border: T.accent, color: T.accent };
    if (cell === "placed") return { bg: T.greenSoft, border: T.green, color: T.green };
    if (cell === "conflict") return { bg: T.redSoft, border: T.red, color: T.red };
    if (cell === "backtrack") return { bg: T.orangeSoft, border: T.orange, color: T.orange };
    if (cell === "check" as any) return { bg: T.yellowSoft, border: T.yellow, color: T.yellow };
    return { bg: "transparent", border: "transparent", color: T.muted };
  };

  const isLight = (r: number, c: number) => (r + c) % 2 === 0;
  const baseSize = N <= 5 ? 56 : N <= 6 ? 48 : N <= 7 ? 42 : 38;

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full h-full">
      <Side>
        <div>
          <SLabel>Board Size (N)</SLabel>
          <div style={{ marginTop: 6 }}>
            <Select
              value={n}
              onChange={v => { if (!anim.running) { setN(v); reset(); } }}
              disabled={anim.running}
              options={[["4", "4×4 (2 solutions)"], ["5", "5×5 (10 solutions)"], ["6", "6×6 (4 solutions)"], ["7", "7×7 (40 solutions)"], ["8", "8×8 (92 solutions)"]]}
            />
          </div>
        </div>
        <Controls anim={anim} run={run} reset={reset} />
        <div><SLabel>Speed</SLabel><div style={{ marginTop: 6 }}><SpeedRow speed={speed} setSpeed={setSpeed} /></div></div>
        <div style={{ marginTop: 12, padding: "12px", background: T.surface2, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <SLabel>Legend</SLabel>
          {[
            { c: T.accent, l: "Queen placed" },
            { c: T.green, l: "Solution found" },
            { c: T.yellow, l: "Checking" },
            { c: T.red, l: "Conflict" },
            { c: T.orange, l: "Backtrack" },
          ].map(({ c, l }) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.muted }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
              {l}
            </div>
          ))}
        </div>
        <SLabel>Log</SLabel><Log entries={log} />
      </Side>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Stats bar */}
        <div style={{ padding: "8px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: T.accent }}>
            ♛ Solutions: {solutions}
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: T.green }}>
            ↓ Placements: {stats.placements}
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: T.orange }}>
            ↩ Backtracks: {stats.backtracks}
          </span>
        </div>

        {/* Board */}
        <div style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}>
          <guide.Overlay />
          {board.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }}>♛</div>
              <div style={{ color: T.muted, fontSize: 13 }}>Press ▶ Run to start</div>
              <div style={{ color: T.muted, fontSize: 11, marginTop: 6, fontFamily: "'Space Mono',monospace" }}>
                {N}-Queens: place {N} queens with no conflicts
              </div>
            </div>
          ) : (
            // Outer square: constrained to the smaller of available width or height
            <div style={{
              width: "min(100%, 100% * 1)",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                // This is the key: use aspectRatio + maxHeight to keep it square and fully visible
                aspectRatio: "1 / 1",
                maxHeight: "100%",
                maxWidth: "100%",
                width: "auto",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}>
                {board.map((row, r) => (
                  <div key={r} style={{ display: "flex", gap: 2, flex: 1, minHeight: 0 }}>
                    {row.map((cell, c) => {
                      const style = cellColor(cell);
                      const light = isLight(r, c);
                      return (
                        <div key={c} style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: 6,
                          background: style.bg !== "transparent"
                            ? style.bg
                            : light ? `${T.surface3}` : T.surface2,
                          border: style.border !== "transparent"
                            ? `2px solid ${style.border}`
                            : `1px solid ${T.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: `calc(min(${baseSize * 0.5}px, 35vmin / ${N}))`,
                          transition: "all .15s",
                          boxShadow: (cell === "queen" || cell === "placed" || cell === "conflict" || cell === "backtrack")
                            ? `0 0 10px ${style.border}66`
                            : "none",
                        }}>
                          {(cell === "queen" || cell === "placed") && "♛"}
                          {cell === "conflict" && "♛"}
                          {cell === "backtrack" && "↩"}
                          {cell === ("check" as any) && "·"}
                        </div>
                      );
                    })}
                  </div>
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
