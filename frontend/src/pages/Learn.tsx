// frontend/src/pages/Learn.tsx
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamMessageFromAI } from "@/lib/ai";
import {
  LESSONS, CONCEPTS, FLASHCARDS,
  SUBJECT_COLORS, SUBJECT_ICONS, SUBJECT_LABELS,
  type Lesson,
} from "@/data/learnData";

// Lazy-loaded CodeViz modules
const SortingViz    = lazy(() => import("./dsa/modules/SortingViz"));
const MergeViz      = lazy(() => import("./dsa/modules/MergeViz"));
const GraphViz      = lazy(() => import("./dsa/modules/GraphViz"));
const HeapViz       = lazy(() => import("./dsa/modules/HeapViz"));
const DPViz         = lazy(() => import("./dsa/modules/DPViz"));
const HashViz       = lazy(() => import("./dsa/modules/HashViz"));
const TwoPointerViz = lazy(() => import("./dsa/modules/TwoPointerViz"));
const StackViz      = lazy(() => import("./dsa/modules/StackViz"));
const QueueViz      = lazy(() => import("./dsa/modules/QueueViz"));
const LinkedListViz = lazy(() => import("./dsa/modules/LinkedListViz"));
const BSTViz        = lazy(() => import("./dsa/modules/BSTViz"));
const TrieViz       = lazy(() => import("./dsa/modules/TrieViz"));
const NQueensViz    = lazy(() => import("./dsa/modules/NQueensViz"));
const KMPViz        = lazy(() => import("./dsa/modules/KMPViz"));

const VIZ_MODULES = [
  { id:"sort",    label:"📊 Sorting",        badge:"5 Algos",            Component: SortingViz },
  { id:"merge",   label:"🔀 Merge Arrays",    badge:"2 Ptrs",             Component: MergeViz },
  { id:"graph",   label:"🕸 Graph",           badge:"BFS·DFS·Dijkstra",   Component: GraphViz },
  { id:"heap",    label:"⛰ Heap",            badge:"Min-Heap",           Component: HeapViz },
  { id:"dp",      label:"🧮 Dynamic Prog.",   badge:"Fib·LCS·Knapsack",   Component: DPViz },
  { id:"hash",    label:"🔑 Hashing",         badge:"Probe·Chain",        Component: HashViz },
  { id:"twoptr",  label:"👆 Two Pointer",     badge:"Sliding Window",     Component: TwoPointerViz },
  { id:"stack",   label:"📚 Stack",           badge:"LIFO",               Component: StackViz },
  { id:"queue",   label:"🔄 Queue",           badge:"FIFO",               Component: QueueViz },
  { id:"linked",  label:"🔗 Linked List",     badge:"Singly",             Component: LinkedListViz },
  { id:"bst",     label:"🌲 BST",             badge:"Binary Search",      Component: BSTViz },
  { id:"trie",    label:"🔤 Trie",            badge:"Prefix Tree",        Component: TrieViz },
  { id:"nqueens", label:"♛ N-Queens",        badge:"Backtracking",       Component: NQueensViz },
  { id:"kmp",     label:"🔍 KMP Search",      badge:"String Match",       Component: KMPViz },
];

// ─── helpers ───────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:     { display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", background:"var(--bg)", fontFamily:"'DM Sans',sans-serif" },
  topbar:   { padding:"20px 28px 0", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 },
  tabRow:   { display:"flex", borderBottom:"1px solid var(--border)", padding:"0 28px", flexShrink:0 },
  body:     { flex:1, overflow:"hidden", display:"flex" },
  btn:      { display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:100, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", fontFamily:"'DM Sans',sans-serif", transition:"all .18s" },
  card:     { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:18 },
  scroll:   { overflowY:"auto" as const },
  muted:    { color:"var(--muted)", fontSize:12 },
  badge:    { padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:600, background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--muted)" },
};
const pill = (active:boolean): React.CSSProperties => ({
  padding:"9px 18px", fontSize:13, fontWeight:500, cursor:"pointer",
  borderBottom: active?"2px solid var(--accent)":"2px solid transparent",
  color: active?"var(--accent)":"var(--muted)",
  background:"none", border:"none", transition:"all .18s",
  whiteSpace:"nowrap" as const,
});
const primaryBtn: React.CSSProperties = { ...S.btn, background:"var(--accent)", color:"#fff", boxShadow:"0 4px 14px var(--accent-glow)" };
const ghostBtn:   React.CSSProperties = { ...S.btn, background:"var(--surface)", border:"1px solid var(--border2)", color:"var(--muted2)" };

// ─── Note type ──────────────────────────────────────────────────────────────
interface Note { id: number; title: string; body: string; tags: string[]; date: string; }

const loadNotes = (): Note[] => {
  try { return JSON.parse(localStorage.getItem("eduai_notes") || "[]") as Note[]; }
  catch { return []; }
};
const saveNotes = (notes: Note[]) => {
  localStorage.setItem("eduai_notes", JSON.stringify(notes));
};
const DEFAULT_NOTES: Note[] = [
  { id:1, title:"Arrays & Pointers — Key Points", body:"Access: O(1), Insert: O(n)\n\naddress = base + index × element_size\n\nPointers: arr[i] == *(arr + i)", tags:["Data Structures","Arrays"], date:"Today" },
  { id:2, title:"Python OOP Summary", body:"class Animal:\n    def __init__(self, name): self.name = name\n    def speak(self): raise NotImplementedError\n\nclass Dog(Animal):\n    def speak(self): return f'{self.name} says Woof'", tags:["Python","OOP"], date:"Yesterday" },
];

// ─── AI message type ────────────────────────────────────────────────────────
interface ChatMsg { id: string; role: "user"|"ai"; text: string; }

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
const Learn: React.FC = () => {
  const [tab, setTab] = useState<"lessons"|"concepts"|"notes"|"tutor"|"visualize">("lessons");

  // ── Lessons state ──────────────────────────────────────────────────────
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS.map(l => ({ ...l })));
  const [lessonIdx, setLessonIdx] = useState(0);
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [quizDone, setQuizDone] = useState<Record<number,boolean>>({});

  // ── Concepts state ─────────────────────────────────────────────────────
  const [conceptCat, setConceptCat] = useState("all");
  const [flashMode, setFlashMode] = useState(false);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // ── Notes state ────────────────────────────────────────────────────────
  const initNotes = () => { const n = loadNotes(); return n.length ? n : DEFAULT_NOTES; };
  const [notes, setNotes] = useState<Note[]>(initNotes);
  const [noteId, setNoteId] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState("Auto-saved");
  const saveTimeout = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => { saveNotes(notes); }, [notes]);
  const currentNote = notes.find(n => n.id === noteId);

  // ── AI Tutor state ─────────────────────────────────────────────────────
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [tutorSubject, setTutorSubject] = useState("Data Structures");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // ── Visualize state ─────────────────────────────────────────────────
  const [activeViz, setActiveViz] = useState("sort");

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs, aiLoading]);

  const sendAI = useCallback(async (msg: string) => {
    if (!msg.trim() || aiLoading) return;
    const userMsg: ChatMsg = { id: `${Date.now()}-u`, role:"user", text: msg.trim() };
    const aiId = `${Date.now()}-a`;
    const placeholder: ChatMsg = { id: aiId, role:"ai", text:"" };
    setChatMsgs(prev => [...prev, userMsg, placeholder]);
    setChatInput("");
    setAiLoading(true);
    try {
      await streamMessageFromAI(
        `[Subject: ${tutorSubject}] ${msg.trim()}`,
        (token) => setChatMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)),
        (full) => { if (full) setChatMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: full } : m)); setAiLoading(false); },
      );
    } catch { setAiLoading(false); }
  }, [aiLoading, tutorSubject]);

  // Init AI greeting
  useEffect(() => {
    if (tab === "tutor" && !initialized.current) {
      initialized.current = true;
      const greet: ChatMsg = { id:"greet", role:"ai", text:"👋 Hi! I'm your AI tutor. Ask me to explain a concept, quiz you, or debug your thinking.\n\nWhat are you working on today?" };
      setChatMsgs([greet]);
    }
  }, [tab]);

  // ── Computed ───────────────────────────────────────────────────────────
  const filteredLessons = lessons.filter(l =>
    (subject === "all" || l.subject === subject) &&
    (!search || l.title.toLowerCase().includes(search) || l.desc.toLowerCase().includes(search))
  );
  const currentLesson = lessons[lessonIdx];
  const completedCount = lessons.filter(l => l.done).length;
  const filteredConcepts = CONCEPTS.filter(c => conceptCat === "all" || c.cat === conceptCat);

  const markDone = () => {
    setLessons(prev => prev.map((l,i) => i === lessonIdx ? { ...l, done:true } : l));
  };

  const checkQuiz = (sIdx: number, chosen: number, ans: number) => {
    if (quizDone[sIdx]) return;
    setQuizDone(prev => ({ ...prev, [sIdx]: true }));
    // Mark correct/wrong via DOM (simple approach keeps component lean)
    const opts = document.querySelectorAll(`#quiz-${sIdx} .cc-opt`);
    opts.forEach((o, i) => {
      (o as HTMLElement).style.background = i === ans ? "var(--green-soft)" : i === chosen && chosen !== ans ? "var(--red-soft)" : "";
      (o as HTMLElement).style.color = i === ans ? "var(--green)" : i === chosen && chosen !== ans ? "var(--red)" : "";
      (o as HTMLElement).style.borderColor = i === ans ? "rgba(74,207,130,.3)" : i === chosen && chosen !== ans ? "rgba(232,93,74,.3)" : "";
    });
    const fb = document.getElementById(`quiz-fb-${sIdx}`);
    if (fb) {
      fb.style.display = "block";
      fb.textContent = chosen === ans ? "✓ Correct!" : `✕ Not quite — correct answer is ${["A","B","C","D"][ans]}.`;
      fb.style.color = chosen === ans ? "var(--green)" : "var(--red)";
    }
  };

  const saveNote = (patch: Partial<Note>) => {
    setSaveStatus("Saving…");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...patch, date:"Just now" } : n));
    saveTimeout.current = setTimeout(() => setSaveStatus("Auto-saved ✓"), 800);
  };

  const newNote = () => {
    const id = Date.now();
    const n: Note = { id, title:"Untitled Note", body:"", tags:[], date:"Just now" };
    setNotes(prev => [n, ...prev]);
    setNoteId(id);
  };

  const deleteNote = () => {
    const remaining = notes.filter(n => n.id !== noteId);
    setNotes(remaining);
    if (remaining.length) setNoteId(remaining[0].id);
  };

  // ────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ────────────────────────────────────────────────────────────────────────
  const renderLesson = (lesson: Lesson) => {
    const col = SUBJECT_COLORS[lesson.subject];
    const icon = SUBJECT_ICONS[lesson.subject];
    if (!lesson.content.intro && lesson.content.sections.length === 0) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:280, gap:14, textAlign:"center", padding:32 }}>
          <div style={{ fontSize:40 }}>{icon}</div>
          <div style={{ fontSize:18, fontWeight:600 }}>{lesson.title}</div>
          <div style={{ fontSize:13, color:"var(--muted2)", maxWidth:360, lineHeight:1.7 }}>{lesson.desc}</div>
          <button style={primaryBtn} onClick={() => setTab("tutor")}>✦ Ask AI Tutor about this topic</button>
        </div>
      );
    }
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:`${col}22`, color:col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{icon}</div>
          <div>
            <div style={{ fontSize:22, fontWeight:700 }}>{lesson.title}</div>
            <div style={{ display:"flex", gap:10, fontSize:13, color:"var(--muted2)", marginTop:2, alignItems:"center" }}>
              <span style={{ color:col, fontWeight:600 }}>{SUBJECT_LABELS[lesson.subject]}</span>
              <span>·</span><span>{lesson.duration}</span>
              <span>·</span><span style={{ color: lesson.done ? "var(--green)":"var(--muted)" }}>{lesson.done ? "✓ Completed" : "In progress"}</span>
            </div>
          </div>
        </div>
        <div style={{ background:"var(--accent-soft)", border:"1px solid rgba(124,92,252,.2)", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
          📌 {lesson.content.intro}
        </div>
        {lesson.content.sections.map((s, si) => {
          if (s.type === "text") return (
            <div key={si} style={{ marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>{s.heading}</div>
              <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html: s.body || "" }} />
            </div>
          );
          if (s.type === "code") return (
            <div key={si} style={{ marginBottom:18 }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>{s.heading}</div>
              <div style={{ background:"var(--surface3)", border:"1px solid var(--border2)", borderRadius:12, padding:"14px 18px", fontFamily:"'Space Mono',monospace", fontSize:12, color:"#a8d8a8", lineHeight:1.8, whiteSpace:"pre", overflowX:"auto" }}>
                {s.body}
              </div>
            </div>
          );
          if (s.type === "callout") return (
            <div key={si} style={{ marginBottom:18, padding:"12px 16px", borderRadius:12, background:s.style==="warn"?"var(--red-soft)":s.style==="tip"?"var(--yellow-soft)":"var(--accent-soft)", border:`1px solid ${s.style==="warn"?"rgba(232,93,74,.2)":s.style==="tip"?"rgba(245,200,66,.2)":"rgba(124,92,252,.2)"}`, fontSize:13, color:"var(--muted2)", lineHeight:1.7 }}>
              💡 <strong>{s.heading}:</strong> {s.body}
            </div>
          );
          if (s.type === "quiz") return (
            <div key={si} id={`quiz-${si}`} style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:14, padding:16, marginBottom:18 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🧠 Quick Check: {s.q}</div>
              {s.opts?.map((o, oi) => (
                <div key={oi} className="cc-opt" onClick={() => checkQuiz(si, oi, s.ans!)}
                  style={{ padding:"9px 12px", borderRadius:8, background:"var(--surface3)", border:"1px solid var(--border)", fontSize:12, color:"var(--muted2)", cursor:"pointer", marginBottom:6, transition:"all .15s", display:"flex", alignItems:"center", gap:8 }}>
                  {["A","B","C","D"][oi]}. {o}
                </div>
              ))}
              <div id={`quiz-fb-${si}`} style={{ fontSize:12, marginTop:8, display:"none" }} />
            </div>
          );
          return null;
        })}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* TOP BAR */}
      <div style={S.topbar}>
        <div>
          <div style={{ fontSize:22, fontWeight:600 }}>Learn <span style={{ color:"var(--accent)" }}>📖</span></div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Structured lessons, concept cards, notes & AI tutor</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <div style={{ fontSize:12, color:"var(--muted2)", background:"var(--surface2)", padding:"5px 14px", borderRadius:100, border:"1px solid var(--border)" }}>
            ✓ <strong style={{ color:"var(--text)" }}>{completedCount}</strong>/{lessons.length} lessons
          </div>
          <button style={primaryBtn} onClick={() => setTab("tutor")}>✦ Ask AI Tutor</button>
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabRow}>
        {(["lessons","concepts","visualize","notes","tutor"] as const).map(t => (
          <button key={t} style={pill(tab===t)} onClick={() => setTab(t)}>
            {t==="lessons"?"📚 Lessons":t==="concepts"?"⬡ Concepts":t==="visualize"?"⚡ Visualize":t==="notes"?"✏ Notes":"✦ AI Tutor"}
          </button>
        ))}
      </div>

      {/* BODY */}
      <div style={S.body}>

        {/* ── 1. LESSONS ── */}
        {tab === "lessons" && (
          <>
            {/* Left: lesson list */}
            <div style={{ width:260, minWidth:260, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"12px 12px 6px", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:100, padding:"7px 12px", marginBottom:8 }}>
                  <span style={{ color:"var(--muted)", fontSize:13 }}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons…" style={{ flex:1, background:"none", border:"none", outline:"none", color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:13 }} />
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["all","ds","algo","python","dbms","os","cn"].map(s => (
                    <button key={s} onClick={() => setSubject(s)} style={{ padding:"4px 10px", borderRadius:100, fontSize:11, fontWeight:500, cursor:"pointer", border:"1px solid var(--border2)", background:subject===s?"var(--accent-soft)":"var(--surface2)", color:subject===s?"var(--accent)":"var(--muted2)", transition:"all .15s" }}>
                      {s==="all"?"All":SUBJECT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0 8px 12px", display:"flex", flexDirection:"column", gap:4 }}>
                {filteredLessons.map(l => {
                  const col = SUBJECT_COLORS[l.subject];
                  const icon = SUBJECT_ICONS[l.subject];
                  const idx = lessons.indexOf(l);
                  const isActive = lessonIdx === idx;
                  return (
                    <div key={l.id} onClick={() => { setLessonIdx(idx); setQuizDone({}); }} style={{ padding:"11px 12px", borderRadius:12, background:isActive?"var(--accent-soft)":"var(--surface2)", border:`1px solid ${isActive?"rgba(124,92,252,.3)":"var(--border)"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:10, transition:"all .15s" }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`${col}22`, color:col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, lineHeight:1.4 }}>{l.title}</div>
                        <div style={{ fontSize:10, color:"var(--muted)", marginTop:2, display:"flex", gap:6 }}>
                          <span>{l.duration}</span>
                          <span style={{ color:col }}>{l.subject.toUpperCase()}</span>
                        </div>
                      </div>
                      {l.done && <span style={{ color:"var(--green)", fontSize:13 }}>✓</span>}
                    </div>
                  );
                })}
                {filteredLessons.length === 0 && <div style={{ textAlign:"center", color:"var(--muted)", fontSize:13, paddingTop:32 }}>No lessons found</div>}
              </div>
            </div>

            {/* Center: reader */}
            {currentLesson && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{currentLesson.title}</span>
                    <div style={{ width:120, height:4, background:"var(--surface3)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round(completedCount/lessons.length*100)}%`, background:"var(--accent)", borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:11, color:"var(--muted)", fontFamily:"'Space Mono',monospace" }}>{completedCount}/{lessons.length}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {!currentLesson.done && <button style={ghostBtn} onClick={markDone}>✓ Mark Done</button>}
                    <button style={{ ...ghostBtn, color:"var(--yellow)", borderColor:"rgba(245,200,66,.3)", background:"var(--yellow-soft)" }} onClick={() => setTab("notes")}>✏ Take Notes</button>
                  </div>
                </div>
                <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
                  {renderLesson(currentLesson)}
                </div>
                <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                  <button style={ghostBtn} onClick={() => { if(lessonIdx>0){setLessonIdx(lessonIdx-1);setQuizDone({});} }}>← Previous</button>
                  <span style={{ fontSize:12, color:"var(--muted)" }}>Lesson {lessonIdx+1} of {lessons.length}</span>
                  <button style={primaryBtn} onClick={() => { if(lessonIdx<lessons.length-1){setLessonIdx(lessonIdx+1);setQuizDone({});} }}>Next →</button>
                </div>
              </div>
            )}

            {/* Right panel */}
            <div style={{ width:240, minWidth:240, borderLeft:"1px solid var(--border)", padding:16, display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Up Next</div>
                {lessons.filter(l => !l.done).slice(0,3).map(l => {
                  const col = SUBJECT_COLORS[l.subject];
                  return (
                    <div key={l.id} onClick={() => { setLessonIdx(lessons.indexOf(l)); setQuizDone({}); }} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:10, cursor:"pointer", marginBottom:8 }}>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{l.title}</div>
                      <div style={{ fontSize:11, color:"var(--muted)" }}>{l.duration} · <span style={{ color:col }}>{SUBJECT_LABELS[l.subject]}</span></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background:"var(--accent-soft)", border:"1px solid rgba(124,92,252,.2)", borderRadius:14, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--accent)", marginBottom:6 }}>✦ Stuck? Ask AI</div>
                <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6, marginBottom:10 }}>Have the AI explain this concept differently.</div>
                <button style={{ ...primaryBtn, width:"100%", justifyContent:"center" }} onClick={() => setTab("tutor")}>Ask a question</button>
              </div>
            </div>
          </>
        )}

        {/* ── 2. CONCEPTS ── */}
        {tab === "concepts" && (
          <>
            <div style={{ width:220, minWidth:220, borderRight:"1px solid var(--border)", padding:14, display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Topics</div>
              {[["all","All Concepts",CONCEPTS.length],["ds","⬡ Data Structures",CONCEPTS.filter(c=>c.cat==="ds").length],["algo","◈ Algorithms",CONCEPTS.filter(c=>c.cat==="algo").length],["python","◆ Python",CONCEPTS.filter(c=>c.cat==="python").length],["dbms","◫ DBMS",CONCEPTS.filter(c=>c.cat==="dbms").length],["os","◎ OS",CONCEPTS.filter(c=>c.cat==="os").length],["cn","◌ Networks",CONCEPTS.filter(c=>c.cat==="cn").length]].map(([cat, label, count]) => (
                <div key={cat} onClick={() => setConceptCat(cat as string)} style={{ padding:"9px 12px", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", color:conceptCat===cat?"var(--accent)":"var(--muted)", background:conceptCat===cat?"var(--accent-soft)":"transparent", transition:"all .15s", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>{label}</span>
                  <span style={{ fontSize:10, fontFamily:"'Space Mono',monospace", background:"var(--surface2)", padding:"2px 6px", borderRadius:100 }}>{count}</span>
                </div>
              ))}
              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Mastered</div>
                <div style={{ fontSize:24, fontWeight:700, fontFamily:"'Space Mono',monospace", color:"var(--green)" }}>
                  {CONCEPTS.filter(c=>c.done).length}<span style={{ fontSize:13, color:"var(--muted)" }}>/{CONCEPTS.length}</span>
                </div>
                <div style={{ height:4, background:"var(--surface3)", borderRadius:99, overflow:"hidden", marginTop:6 }}>
                  <div style={{ height:"100%", width:`${Math.round(CONCEPTS.filter(c=>c.done).length/CONCEPTS.length*100)}%`, background:"var(--green)", borderRadius:99 }} />
                </div>
              </div>
              <button style={{ ...primaryBtn, justifyContent:"center", marginTop:12 }} onClick={() => { setFlashMode(true); setFcIdx(0); setFcFlipped(false); }}>⚡ Flashcard Mode</button>
              {flashMode && <button style={{ ...ghostBtn, justifyContent:"center", marginTop:6 }} onClick={() => setFlashMode(false)}>⊞ Grid View</button>}
            </div>

            <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
              {!flashMode ? (
                <>
                  <div style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>
                    {conceptCat === "all" ? "All Concepts" : SUBJECT_LABELS[conceptCat] || conceptCat}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {filteredConcepts.map(c => (
                      <div key={c.id} style={{ background:"var(--surface2)", border:`1px solid var(--border)${c.done?"":""}}`, borderLeft:c.done?`3px solid var(--green)`:undefined, borderRadius:16, padding:18, transition:"all .18s", cursor:"default" }}>
                        <div style={{ fontSize:24, marginBottom:10, color:c.color }}>{c.icon}</div>
                        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{c.title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:10 }}>{c.sub}</div>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                          {c.tags.map(t => <span key={t} style={{ padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:500, background:`${c.color}18`, color:c.color }}>{t}</span>)}
                          {c.done && <span style={{ padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:500, background:"var(--green-soft)", color:"var(--green)" }}>✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:20 }}>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>Card {fcIdx+1} of {FLASHCARDS.length}</div>
                  <div
                    onClick={() => setFcFlipped(f => !f)}
                    style={{ width:"100%", maxWidth:540, minHeight:200, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:20, padding:"32px 28px", textAlign:"center", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, transition:"transform .3s", transform:fcFlipped?"rotateY(180deg)":"none", transformStyle:"preserve-3d" }}>
                    {!fcFlipped ? (
                      <>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Term</div>
                        <div style={{ fontSize:22, fontWeight:600 }}>{FLASHCARDS[fcIdx].term}</div>
                        <div style={{ fontSize:11, color:"var(--muted)" }}>Click to reveal definition</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Definition</div>
                        <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.65 }}>{FLASHCARDS[fcIdx].def}</div>
                      </>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button style={ghostBtn} onClick={() => { setFcIdx((fcIdx-1+FLASHCARDS.length)%FLASHCARDS.length); setFcFlipped(false); }}>←</button>
                    <button style={{ ...S.btn, background:"var(--red-soft)", color:"var(--red)", border:"1px solid rgba(232,93,74,.25)" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Again</button>
                    <button style={{ ...S.btn, background:"var(--yellow-soft)", color:"var(--yellow)", border:"1px solid rgba(245,200,66,.25)" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Hard</button>
                    <button style={{ ...S.btn, background:"var(--green-soft)", color:"var(--green)", border:"1px solid rgba(74,207,130,.25)" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Got it ✓</button>
                    <button style={ghostBtn} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>→</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 2b. VISUALIZE ── */}
        {tab === "visualize" && (
          <>
            {/* Left: viz module list */}
            <div style={{ width:230, minWidth:230, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"14px 12px 8px", flexShrink:0 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>⚡ Visualizations</div>
                <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>Interactive DSA visualizers with guided demos</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0 8px 12px", display:"flex", flexDirection:"column", gap:3 }}>
                {VIZ_MODULES.map(v => {
                  const isActive = activeViz === v.id;
                  return (
                    <div key={v.id} onClick={() => setActiveViz(v.id)} style={{ padding:"10px 12px", borderRadius:12, background:isActive?"var(--accent-soft)":"var(--surface2)", border:`1px solid ${isActive?"rgba(124,92,252,.3)":"var(--border)"}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, transition:"all .15s" }}>
                      <span style={{ fontSize:13, fontWeight:isActive?600:400 }}>{v.label}</span>
                      <span style={{ fontSize:9, fontFamily:"'Space Mono',monospace", fontWeight:600, background:isActive?"rgba(124,92,252,.15)":"var(--surface3)", color:isActive?"var(--accent)":"var(--muted)", padding:"2px 7px", borderRadius:100 }}>{v.badge}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center: active viz */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, color:"var(--muted)" }}>Loading visualizer…</div>}>
                {(() => {
                  const mod = VIZ_MODULES.find(v => v.id === activeViz);
                  if (!mod) return null;
                  const Comp = mod.Component;
                  return <Comp key={mod.id} />;
                })()}
              </Suspense>
            </div>
          </>
        )}

        {/* ── 3. NOTES ── */}
        {tab === "notes" && (
          <>
            <div style={{ width:230, minWidth:230, borderRight:"1px solid var(--border)", padding:14, display:"flex", flexDirection:"column", gap:8, overflowY:"auto" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>My Notes</div>
                <button style={{ ...primaryBtn, padding:"5px 12px", fontSize:12 }} onClick={newNote}>+ New</button>
              </div>
              {notes.map(n => (
                <div key={n.id} onClick={() => setNoteId(n.id)} style={{ padding:"11px 12px", borderRadius:12, background:n.id===noteId?"var(--accent-soft)":"var(--surface2)", border:`1px solid ${n.id===noteId?"rgba(124,92,252,.35)":"var(--border)"}`, cursor:"pointer", transition:"all .15s" }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.body.slice(0,50)}…</div>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:4, fontFamily:"'Space Mono',monospace" }}>{n.date}</div>
                </div>
              ))}
              {notes.length === 0 && <div style={{ textAlign:"center", color:"var(--muted)", fontSize:13, paddingTop:24 }}>No notes yet. Click + New!</div>}
            </div>

            {currentNote ? (
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
                <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                  <input value={currentNote.title} onChange={e => saveNote({ title:e.target.value })} style={{ background:"none", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:18, fontWeight:600, color:"var(--text)", flex:1 }} />
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={ghostBtn} onClick={() => navigator.clipboard.writeText(`${currentNote.title}\n\n${currentNote.body}`)}>⎘ Copy</button>
                    <button style={{ ...S.btn, background:"var(--accent-soft)", color:"var(--accent)", border:"1px solid rgba(124,92,252,.3)" }} onClick={() => sendAI(`Summarise these notes: ${currentNote.body.slice(0,400)}`) && setTab("tutor") as any}>✦ Ask AI</button>
                    <button style={{ ...ghostBtn, color:"var(--red)" }} onClick={deleteNote}>✕</button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, padding:"8px 20px", borderBottom:"1px solid var(--border)", flexShrink:0, flexWrap:"wrap" }}>
                  {currentNote.tags.map(t => <span key={t} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, fontWeight:500, background:"var(--accent-soft)", border:"1px solid rgba(124,92,252,.3)", color:"var(--accent)" }}>{t}</span>)}
                  <span onClick={() => { const tag = prompt("Add tag:"); if(tag) saveNote({ tags:[...currentNote.tags,tag] }); }} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, background:"var(--surface2)", border:"1px solid var(--border2)", color:"var(--muted)", cursor:"pointer" }}>+ Add tag</span>
                </div>
                <textarea value={currentNote.body} onChange={e => saveNote({ body:e.target.value })} placeholder="Start typing your notes…" style={{ flex:1, padding:"18px 20px", background:"none", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"var(--muted2)", lineHeight:1.8, resize:"none", overflowY:"auto" }} />
                <div style={{ padding:"8px 20px", borderTop:"1px solid var(--border)", display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{currentNote.body.trim().split(/\s+/).filter(Boolean).length} words</span>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{saveStatus}</span>
                </div>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:14 }}>Select or create a note</div>
            )}
          </>
        )}

        {/* ── 4. AI TUTOR ── */}
        {tab === "tutor" && (
          <>
            {/* Config panel */}
            <div style={{ width:230, minWidth:230, borderRight:"1px solid var(--border)", padding:18, display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
              <div>
                <div style={{ fontSize:12, color:"var(--muted)", fontWeight:500, marginBottom:6 }}>Subject</div>
                <select value={tutorSubject} onChange={e => setTutorSubject(e.target.value)} style={{ width:"100%", background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, padding:"9px 13px", color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}>
                  {["Data Structures","Algorithms","Python Programming","Database Management","Operating Systems","Computer Networks"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Quick Questions</div>
                {["Explain this simply","Give me a real-world analogy","Quiz me on this topic","What are common mistakes?"].map(q => (
                  <div key={q} onClick={() => sendAI(q)} style={{ padding:"8px 12px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border2)", fontSize:12, color:"var(--muted2)", cursor:"pointer", marginBottom:6, transition:"all .15s" }}>{q}</div>
                ))}
              </div>
              <div style={{ marginTop:"auto", paddingTop:14, borderTop:"1px solid var(--border)" }}>
                <button style={{ ...ghostBtn, width:"100%", justifyContent:"center" }} onClick={() => { setChatMsgs([]); initialized.current = false; setTimeout(() => setTab("tutor"),0); }}>↺ New Session</button>
              </div>
            </div>

            {/* Chat area */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                {chatMsgs.map(m => (
                  <div key={m.id} style={{ maxWidth:"82%", alignSelf:m.role==="user"?"flex-end":"flex-start", background:m.role==="user"?"var(--surface2)":"var(--accent-soft)", border:`1px solid ${m.role==="user"?"var(--border2)":"rgba(124,92,252,.2)"}`, borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"12px 16px" }}>
                    <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:m.role==="user"?"var(--muted)":"var(--accent)", marginBottom:6 }}>{m.role==="user"?"You":"✦ AI Tutor"}</div>
                    {m.role === "ai" ? (
                      <div style={{ fontSize:13, lineHeight:1.65, color:"var(--muted2)" }} className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ fontSize:13, lineHeight:1.65, color:"var(--muted2)", whiteSpace:"pre-wrap" }}>{m.text}</div>
                    )}
                  </div>
                ))}
                {aiLoading && <div style={{ fontSize:12, color:"var(--muted)", animation:"pulse 1s ease infinite" }}>✦ Tutor is thinking…</div>}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"flex-end", gap:10, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:16, padding:"10px 14px" }}>
                  <textarea
                    value={chatInput}
                    onChange={e => { setChatInput(e.target.value); (e.target as HTMLTextAreaElement).style.height="auto"; (e.target as HTMLTextAreaElement).style.height=e.target.scrollHeight+"px"; }}
                    onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendAI(chatInput); } }}
                    placeholder="Ask anything about this topic…"
                    rows={1}
                    style={{ flex:1, background:"none", border:"none", outline:"none", color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.6, resize:"none", maxHeight:120, overflowY:"auto" }}
                  />
                  <button onClick={() => sendAI(chatInput)} disabled={aiLoading || !chatInput.trim()} style={{ width:32, height:32, borderRadius:10, background:"var(--accent)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, opacity:aiLoading||!chatInput.trim()?0.5:1 }}>→</button>
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:5 }}>Enter to send · Shift+Enter for new line</div>
              </div>
            </div>

            {/* Right tips */}
            <div style={{ width:220, minWidth:220, borderLeft:"1px solid var(--border)", padding:16, display:"flex", flexDirection:"column", gap:12, overflowY:"auto" }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Tips for Better Answers</div>
              {["💡 Be specific — ask 'why is array access O(1)?' not just 'explain arrays'","🎯 Paste your code and ask 'what am I getting wrong?'","📝 Switch subject in the panel for context-aware answers"].map((tip,i) => (
                <div key={i} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:10, fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>{tip}</div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .cc-opt:hover { border-color: var(--border2) !important; color: var(--text) !important; }
        .prose pre { background: var(--surface3); border-radius: 8px; padding: 10px 14px; font-size: 12px; overflow-x: auto; }
        .prose code { background: var(--surface3); padding: 2px 5px; border-radius: 4px; font-size: 12px; }
        .prose p { margin: 0 0 8px; }
        .prose ul, .prose ol { padding-left: 18px; }
      `}</style>
    </div>
  );
};

export default Learn;
