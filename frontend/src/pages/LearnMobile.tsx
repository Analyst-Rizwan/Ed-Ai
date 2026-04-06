// frontend/src/pages/LearnMobile.tsx
// Dedicated mobile-only Learn page. No sidebar panels — uses chips/dropdowns and full-screen views.
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamMessageFromAI } from "@/lib/ai";
import {
  LESSONS, CONCEPTS, FLASHCARDS,
  SUBJECT_COLORS, SUBJECT_ICONS, SUBJECT_LABELS,
  type Lesson,
} from "@/data/learnData";

// ── Lazy viz modules ────────────────────────────────────────────────────────
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
  { id:"sort",    label:"📊 Sorting",       Component: SortingViz },
  { id:"merge",   label:"🔀 Merge Arrays",   Component: MergeViz },
  { id:"graph",   label:"🕸 Graph",          Component: GraphViz },
  { id:"heap",    label:"⛰ Heap",           Component: HeapViz },
  { id:"dp",      label:"🧮 Dynamic Prog.",  Component: DPViz },
  { id:"hash",    label:"🔑 Hashing",        Component: HashViz },
  { id:"twoptr",  label:"👆 Two Pointer",    Component: TwoPointerViz },
  { id:"stack",   label:"📚 Stack",          Component: StackViz },
  { id:"queue",   label:"🔄 Queue",          Component: QueueViz },
  { id:"linked",  label:"🔗 Linked List",    Component: LinkedListViz },
  { id:"bst",     label:"🌲 BST",            Component: BSTViz },
  { id:"trie",    label:"🔤 Trie",           Component: TrieViz },
  { id:"nqueens", label:"♛ N-Queens",       Component: NQueensViz },
  { id:"kmp",     label:"🔍 KMP Search",     Component: KMPViz },
];

const VIZ_SUBJECTS = [
  { id:"codeviz", label:"⚡", title:"Interactive" },
  { id:"c",       label:"©",  title:"C" },
  { id:"cpp",     label:"⊕",  title:"C++" },
  { id:"java",    label:"☕",  title:"Java" },
  { id:"python",  label:"◆",  title:"Python" },
  { id:"ds",      label:"⬡",  title:"D.S." },
  { id:"algo",    label:"◈",  title:"Algo" },
  { id:"dbms",    label:"◫",  title:"DBMS" },
  { id:"lld",     label:"🔧", title:"LLD" },
  { id:"hld",     label:"🏗",  title:"HLD" },
];

// ── Note type ───────────────────────────────────────────────────────────────
interface Note { id: number; title: string; body: string; tags: string[]; date: string; }
const loadNotes = (): Note[] => { try { return JSON.parse(localStorage.getItem("eduai_notes") || "[]") as Note[]; } catch { return []; } };
const saveNotes = (notes: Note[]) => { localStorage.setItem("eduai_notes", JSON.stringify(notes)); };
const DEFAULT_NOTES: Note[] = [
  { id:1, title:"Arrays & Pointers — Key Points", body:"Access: O(1), Insert: O(n)\n\naddress = base + index × element_size\n\nPointers: arr[i] == *(arr + i)", tags:["Data Structures","Arrays"], date:"Today" },
  { id:2, title:"Python OOP Summary", body:"class Animal:\n    def __init__(self, name): self.name = name\n    def speak(self): raise NotImplementedError\n\nclass Dog(Animal):\n    def speak(self): return f'{self.name} says Woof'", tags:["Python","OOP"], date:"Yesterday" },
];
interface ChatMsg { id: string; role: "user"|"ai"; text: string; }

// ── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "var(--bg)",
  surface:  "var(--surface)",
  surface2: "var(--surface2)",
  surface3: "var(--surface3)",
  border:   "var(--border)",
  border2:  "var(--border2)",
  text:     "var(--text)",
  muted:    "var(--muted)",
  muted2:   "var(--muted2)",
  accent:   "var(--accent)",
  accentS:  "var(--accent-soft)",
  green:    "var(--green)",
  greenS:   "var(--green-soft)",
  yellow:   "var(--yellow)",
  yellowS:  "var(--yellow-soft)",
  red:      "var(--red)",
  redS:     "var(--red-soft)",
};

// ── Tiny reusable style helpers ──────────────────────────────────────────────
const btn = (bg: string, color: string, border = "none"): React.CSSProperties => ({
  display:"flex", alignItems:"center", justifyContent:"center", gap:5,
  padding:"9px 16px", borderRadius:100, fontSize:13, fontWeight:600,
  cursor:"pointer", border, background:bg, color,
  fontFamily:"'DM Sans',sans-serif", transition:"all .18s", whiteSpace:"nowrap" as const,
});
const primaryBtn = btn(C.accent, "#fff");
const ghostBtn   = btn(C.surface2, C.muted2, `1px solid ${C.border2}`);
const chip = (active: boolean, col = C.accent): React.CSSProperties => ({
  padding:"5px 12px", borderRadius:100, fontSize:12, fontWeight:600,
  cursor:"pointer", whiteSpace:"nowrap" as const, transition:"all .15s",
  border: active ? `1px solid ${col}66` : `1px solid ${C.border2}`,
  background: active ? `${col}22` : C.surface2,
  color: active ? col : C.muted2,
});

// ── Main Component ───────────────────────────────────────────────────────────
const LearnMobile: React.FC = () => {
  const [tab, setTab] = useState<"lessons"|"concepts"|"visualize"|"notes"|"tutor">("lessons");

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS.map(l => ({ ...l })));
  const [lessonIdx, setLessonIdx] = useState(0);
  const [subject, setSubject] = useState("all");
  const [search, setSearch] = useState("");
  const [quizDone, setQuizDone] = useState<Record<number,boolean>>({});
  const [readerOpen, setReaderOpen] = useState(false);

  // Concepts state
  const [conceptCat, setConceptCat] = useState("all");
  const [flashMode, setFlashMode] = useState(false);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);

  // Notes state
  const initNotes = () => { const n = loadNotes(); return n.length ? n : DEFAULT_NOTES; };
  const [notes, setNotes] = useState<Note[]>(initNotes);
  const [noteId, setNoteId] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState("Auto-saved");
  const saveTimeout = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => { saveNotes(notes); }, [notes]);
  const currentNote = notes.find(n => n.id === noteId);

  // AI Tutor state
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [tutorSubject, setTutorSubject] = useState("Data Structures");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Visualize state
  const [activeViz, setActiveViz] = useState("sort");
  const [vizSubject, setVizSubject] = useState<string>("codeviz");
  const [subjectLessons, setSubjectLessons] = useState<Lesson[]>([]);
  const [vizLessonIdx, setVizLessonIdx] = useState(0);
  const [vizLoading, setVizLoading] = useState(false);

  useEffect(() => {
    if (vizSubject === "codeviz") { setSubjectLessons([]); return; }
    setVizLoading(true); setSubjectLessons([]); setVizLessonIdx(0);
    const loaders: Record<string, () => Promise<{default?: unknown}>> = {
      c: () => import("@/data/lessons/c"), cpp: () => import("@/data/lessons/cpp"),
      java: () => import("@/data/lessons/java"), python: () => import("@/data/lessons/python"),
      ds: () => import("@/data/lessons/ds"), algo: () => import("@/data/lessons/algo"),
      dbms: () => import("@/data/lessons/dbms"), lld: () => import("@/data/lessons/lld"),
      hld: () => import("@/data/lessons/hld"),
    };
    const loader = loaders[vizSubject];
    if (loader) {
      loader().then(mod => {
        const exported = Object.values(mod as Record<string, unknown>).find(Array.isArray) as Lesson[] | undefined;
        setSubjectLessons(exported ?? []); setVizLoading(false);
      }).catch(() => setVizLoading(false));
    } else setVizLoading(false);
  }, [vizSubject]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs, aiLoading]);

  const sendAI = useCallback(async (msg: string) => {
    if (!msg.trim() || aiLoading) return;
    const userMsg: ChatMsg = { id:`${Date.now()}-u`, role:"user", text:msg.trim() };
    const aiId = `${Date.now()}-a`;
    setChatMsgs(prev => [...prev, userMsg, { id:aiId, role:"ai", text:"" }]);
    setChatInput(""); setAiLoading(true);
    try {
      await streamMessageFromAI(
        `[Subject: ${tutorSubject}] ${msg.trim()}`,
        token => setChatMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)),
        full => { if (full) setChatMsgs(prev => prev.map(m => m.id === aiId ? { ...m, text: full } : m)); setAiLoading(false); },
      );
    } catch { setAiLoading(false); }
  }, [aiLoading, tutorSubject]);

  useEffect(() => {
    if (tab === "tutor" && !initialized.current) {
      initialized.current = true;
      setChatMsgs([{ id:"greet", role:"ai", text:"👋 Hi! I'm your AI tutor. Ask me to explain a concept, quiz you, or debug your thinking.\n\nWhat are you working on today?" }]);
    }
  }, [tab]);

  // Computed
  const filteredLessons = lessons.filter(l =>
    (subject === "all" || l.subject === subject) &&
    (!search || l.title.toLowerCase().includes(search) || l.desc.toLowerCase().includes(search))
  );
  const currentLesson = lessons[lessonIdx];
  const completedCount = lessons.filter(l => l.done).length;
  const filteredConcepts = CONCEPTS.filter(c => conceptCat === "all" || c.cat === conceptCat);

  const markDone = () => setLessons(prev => prev.map((l,i) => i === lessonIdx ? { ...l, done:true } : l));

  const checkQuiz = (sIdx: number, chosen: number, ans: number) => {
    if (quizDone[sIdx]) return;
    setQuizDone(prev => ({ ...prev, [sIdx]: true }));
    const opts = document.querySelectorAll(`#mquiz-${sIdx} .m-cc-opt`);
    opts.forEach((o, i) => {
      (o as HTMLElement).style.background = i === ans ? C.greenS : i === chosen && chosen !== ans ? C.redS : "";
      (o as HTMLElement).style.color = i === ans ? C.green : i === chosen && chosen !== ans ? C.red : "";
      (o as HTMLElement).style.borderColor = i === ans ? "rgba(74,207,130,.3)" : i === chosen && chosen !== ans ? "rgba(232,93,74,.3)" : "";
    });
    const fb = document.getElementById(`mquiz-fb-${sIdx}`);
    if (fb) {
      fb.style.display = "block";
      fb.textContent = chosen === ans ? "✓ Correct!" : `✕ Not quite — correct answer is ${["A","B","C","D"][ans]}.`;
      fb.style.color = chosen === ans ? C.green : C.red;
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
    setNotes(prev => [{ id, title:"Untitled Note", body:"", tags:[], date:"Just now" }, ...prev]);
    setNoteId(id);
  };
  const deleteNote = () => {
    const remaining = notes.filter(n => n.id !== noteId);
    setNotes(remaining);
    if (remaining.length) setNoteId(remaining[0].id);
  };

  // ── Render lesson content ────────────────────────────────────────────────
  const renderLesson = (lesson: Lesson) => {
    const col = SUBJECT_COLORS[lesson.subject];
    const icon = SUBJECT_ICONS[lesson.subject];
    if (!lesson.content.intro && lesson.content.sections.length === 0) {
      return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:200, gap:14, textAlign:"center", padding:24 }}>
          <div style={{ fontSize:36 }}>{icon}</div>
          <div style={{ fontSize:17, fontWeight:600 }}>{lesson.title}</div>
          <div style={{ fontSize:13, color:C.muted2, lineHeight:1.7 }}>{lesson.desc}</div>
          <button style={primaryBtn} onClick={() => { setTab("tutor"); setReaderOpen(false); }}>✦ Ask AI Tutor</button>
        </div>
      );
    }
    return (
      <div style={{ paddingBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`${col}22`, color:col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>{lesson.title}</div>
            <div style={{ fontSize:11, color:C.muted2, marginTop:2 }}>
              <span style={{ color:col, fontWeight:600 }}>{SUBJECT_LABELS[lesson.subject]}</span> · {lesson.duration} · <span style={{ color:lesson.done ? C.green : C.muted }}>{lesson.done ? "✓ Done" : "In progress"}</span>
            </div>
          </div>
        </div>
        <div style={{ background:C.accentS, border:"1px solid rgba(124,92,252,.2)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:C.muted2, lineHeight:1.7 }}>
          📌 {lesson.content.intro}
        </div>
        {lesson.content.sections.map((s, si) => {
          if (s.type === "text") return (
            <div key={si} style={{ marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{s.heading}</div>
              <div style={{ fontSize:13, color:C.muted2, lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html: s.body || "" }} />
            </div>
          );
          if (s.type === "code") return (
            <div key={si} style={{ marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{s.heading}</div>
              <div style={{ background:C.surface3, border:`1px solid ${C.border2}`, borderRadius:10, padding:"12px 14px", fontFamily:"'Space Mono',monospace", fontSize:11, color:"#a8d8a8", lineHeight:1.8, whiteSpace:"pre", overflowX:"auto" }}>{s.body}</div>
            </div>
          );
          if (s.type === "callout") return (
            <div key={si} style={{ marginBottom:16, padding:"10px 14px", borderRadius:10, background:s.style==="warn"?C.redS:s.style==="tip"?C.yellowS:C.accentS, border:`1px solid ${s.style==="warn"?"rgba(232,93,74,.2)":s.style==="tip"?"rgba(245,200,66,.2)":"rgba(124,92,252,.2)"}`, fontSize:12, color:C.muted2, lineHeight:1.7 }}>
              💡 <strong>{s.heading}:</strong> {s.body}
            </div>
          );
          if (s.type === "quiz") return (
            <div key={si} id={`mquiz-${si}`} style={{ background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:12, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>🧠 Quick Check: {s.q}</div>
              {s.opts?.map((o, oi) => (
                <div key={oi} className="m-cc-opt" onClick={() => checkQuiz(si, oi, s.ans!)}
                  style={{ padding:"10px 12px", borderRadius:8, background:C.surface3, border:`1px solid ${C.border}`, fontSize:12, color:C.muted2, cursor:"pointer", marginBottom:6, transition:"all .15s", display:"flex", alignItems:"center", gap:8 }}>
                  {["A","B","C","D"][oi]}. {o}
                </div>
              ))}
              <div id={`mquiz-fb-${si}`} style={{ fontSize:12, marginTop:8, display:"none" }} />
            </div>
          );
          return null;
        })}
      </div>
    );
  };

  // ── Page wrapper ─────────────────────────────────────────────────────────
  const page: React.CSSProperties = { display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", background:C.bg, fontFamily:"'DM Sans',sans-serif" };
  const scrollX: React.CSSProperties = { display:"flex", gap:8, overflowX:"auto", flexShrink:0, WebkitOverflowScrolling:"touch" as any, scrollbarWidth:"none" as any, padding:"0 16px" };

  return (
    <div style={page}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize:19, fontWeight:700 }}>Learn <span style={{ color:C.accent }}>📖</span></div>
          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Lessons · concepts · viz · notes · AI</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:11, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:100, padding:"4px 12px", color:C.muted2 }}>
            ✓ <strong style={{ color:C.text }}>{completedCount}</strong>/{lessons.length}
          </div>
        </div>
      </div>

      {/* ── TAB STRIP ──────────────────────────────────────────────────── */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, overflowX:"auto", flexShrink:0, WebkitOverflowScrolling:"touch" as any, scrollbarWidth:"none" as any }}>
        {(["lessons","concepts","visualize","notes","tutor"] as const).map(t => {
          const labels = { lessons:"📚 Lessons", concepts:"⬡ Concepts", visualize:"⚡ Viz", notes:"✏ Notes", tutor:"✦ Tutor" };
          const isA = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:"10px 14px", fontSize:12, fontWeight:isA ? 600 : 500, cursor:"pointer",
              borderBottom: isA ? `2px solid ${C.accent}` : "2px solid transparent",
              color: isA ? C.accent : C.muted, background:"none", border:"none",
              borderBottomWidth:2, borderBottomStyle:"solid" as const,
              borderBottomColor: isA ? C.accent : "transparent",
              whiteSpace:"nowrap" as const, transition:"all .15s", fontFamily:"'DM Sans',sans-serif",
            }}>{labels[t]}</button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: LESSONS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "lessons" && !readerOpen && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Search */}
          <div style={{ padding:"10px 16px 6px", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:100, padding:"8px 14px" }}>
              <span style={{ color:C.muted, fontSize:14 }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons…"
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13 }} />
            </div>
          </div>
          {/* Subject chips */}
          <div style={{ ...scrollX, paddingTop:4, paddingBottom:10 }}>
            {["all","ds","algo","python","dbms","os","cn"].map(s => (
              <button key={s} onClick={() => setSubject(s)} style={chip(subject === s, C.accent)}>
                {s === "all" ? "All" : SUBJECT_LABELS[s]}
              </button>
            ))}
          </div>
          {/* Lesson cards */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {filteredLessons.map(l => {
              const col = SUBJECT_COLORS[l.subject];
              const icon = SUBJECT_ICONS[l.subject];
              const idx = lessons.indexOf(l);
              return (
                <div key={l.id} onClick={() => { setLessonIdx(idx); setQuizDone({}); setReaderOpen(true); }}
                  style={{ padding:"13px 14px", borderRadius:14, background:C.surface2, border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,.15)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${col}22`, color:col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, lineHeight:1.4 }}>{l.title}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2, display:"flex", gap:8 }}>
                      <span>{l.duration}</span>
                      <span style={{ color:col }}>{(SUBJECT_LABELS[l.subject] || l.subject).toUpperCase()}</span>
                    </div>
                  </div>
                  {l.done ? <span style={{ color:C.green, fontSize:14, flexShrink:0 }}>✓</span>
                          : <span style={{ color:C.muted, fontSize:14, flexShrink:0 }}>›</span>}
                </div>
              );
            })}
            {filteredLessons.length === 0 && <div style={{ textAlign:"center", color:C.muted, fontSize:13, paddingTop:32 }}>No lessons found</div>}
          </div>
        </div>
      )}

      {/* ── LESSON READER (full-screen overlay within page) ────────────── */}
      {tab === "lessons" && readerOpen && currentLesson && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Reader toolbar */}
          <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, flexShrink:0, flexWrap:"wrap" }}>
            <button onClick={() => setReaderOpen(false)} style={{ ...ghostBtn, padding:"7px 12px", fontSize:12 }}>← Back</button>
            <div style={{ flex:1, fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentLesson.title}</div>
            <div style={{ display:"flex", gap:6 }}>
              {!currentLesson.done && <button style={{ ...btn(C.greenS, C.green, `1px solid rgba(74,207,130,.3)`), padding:"7px 12px", fontSize:12 }} onClick={markDone}>✓ Done</button>}
              <button style={{ ...btn(C.yellowS, C.yellow, `1px solid rgba(245,200,66,.3)`), padding:"7px 12px", fontSize:12 }} onClick={() => { setTab("notes"); setReaderOpen(false); }}>✏</button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height:3, background:C.surface3, flexShrink:0 }}>
            <div style={{ height:"100%", width:`${Math.round(completedCount/lessons.length*100)}%`, background:C.accent, transition:"width .3s" }} />
          </div>
          {/* Content */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {renderLesson(currentLesson)}
          </div>
          {/* Prev / Next */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <button style={{ ...ghostBtn, padding:"8px 14px", fontSize:12 }} onClick={() => { if(lessonIdx>0){setLessonIdx(lessonIdx-1);setQuizDone({});} }} disabled={lessonIdx===0}>← Prev</button>
            <span style={{ fontSize:11, color:C.muted }}>{lessonIdx+1}/{lessons.length}</span>
            <button style={{ ...primaryBtn, padding:"8px 14px", fontSize:12 }} onClick={() => { if(lessonIdx<lessons.length-1){setLessonIdx(lessonIdx+1);setQuizDone({});} }} disabled={lessonIdx===lessons.length-1}>Next →</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: CONCEPTS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "concepts" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {!flashMode ? (
            <>
              {/* Topic chips */}
              <div style={{ ...scrollX, padding:"10px 16px" }}>
                {[["all","All"],["ds","Data Structures"],["algo","Algorithms"],["python","Python"],["dbms","DBMS"],["os","OS"],["cn","Networks"]].map(([cat, label]) => (
                  <button key={cat} onClick={() => setConceptCat(cat)} style={chip(conceptCat === cat)}>{label}</button>
                ))}
              </div>
              {/* Mastery + flashcard button */}
              <div style={{ padding:"0 16px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                <div style={{ fontSize:12, color:C.muted }}>
                  <span style={{ color:C.green, fontWeight:700, fontSize:16 }}>{CONCEPTS.filter(c=>c.done).length}</span>
                  <span>/{CONCEPTS.length} mastered</span>
                </div>
                <button style={{ ...primaryBtn, padding:"7px 14px", fontSize:12 }} onClick={() => { setFlashMode(true); setFcIdx(0); setFcFlipped(false); }}>⚡ Flashcards</button>
              </div>
              {/* Single-col concept grid */}
              <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                {filteredConcepts.map(c => (
                  <div key={c.id} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderLeft:c.done?`3px solid ${C.green}`:`3px solid ${c.color}`, borderRadius:14, padding:16, transition:"all .18s" }}>
                    <div style={{ fontSize:22, marginBottom:8, color:c.color }}>{c.icon}</div>
                    <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{c.title}</div>
                    <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, marginBottom:10 }}>{c.sub}</div>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {c.tags.map(t => <span key={t} style={{ padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:500, background:`${c.color}18`, color:c.color }}>{t}</span>)}
                      {c.done && <span style={{ padding:"2px 8px", borderRadius:100, fontSize:10, fontWeight:500, background:C.greenS, color:C.green }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* FLASHCARD MODE */
            <div style={{ flex:1, display:"flex", flexDirection:"column", padding:16, gap:16, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:12, color:C.muted }}>Card {fcIdx+1} of {FLASHCARDS.length}</div>
                <button style={{ ...ghostBtn, padding:"6px 12px", fontSize:12 }} onClick={() => setFlashMode(false)}>⊞ Grid</button>
              </div>
              {/* Card */}
              <div onClick={() => setFcFlipped(f => !f)}
                style={{ flex:1, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:20, padding:"28px 20px", textAlign:"center", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, minHeight:200, boxShadow:"0 4px 24px rgba(0,0,0,.2)" }}>
                {!fcFlipped ? (
                  <>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Term</div>
                    <div style={{ fontSize:22, fontWeight:700 }}>{FLASHCARDS[fcIdx].term}</div>
                    <div style={{ fontSize:11, color:C.muted }}>Tap to reveal</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Definition</div>
                    <div style={{ fontSize:14, color:C.muted2, lineHeight:1.65 }}>{FLASHCARDS[fcIdx].def}</div>
                  </>
                )}
              </div>
              {/* Buttons */}
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button style={{ ...btn(C.redS, C.red, "1px solid rgba(232,93,74,.25)"), flex:1, padding:"10px 8px" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Again</button>
                <button style={{ ...btn(C.yellowS, C.yellow, "1px solid rgba(245,200,66,.25)"), flex:1, padding:"10px 8px" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Hard</button>
                <button style={{ ...btn(C.greenS, C.green, "1px solid rgba(74,207,130,.25)"), flex:1, padding:"10px 8px" }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Got it ✓</button>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button style={{ ...ghostBtn, flex:1 }} onClick={() => { setFcIdx((fcIdx-1+FLASHCARDS.length)%FLASHCARDS.length); setFcFlipped(false); }}>← Prev</button>
                <button style={{ ...ghostBtn, flex:1 }} onClick={() => { setFcIdx((fcIdx+1)%FLASHCARDS.length); setFcFlipped(false); }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: VISUALIZE — no outer sidebar; chips + dropdown only
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "visualize" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Subject chips */}
          <div style={{ ...scrollX, padding:"10px 16px 6px" }}>
            {VIZ_SUBJECTS.map(s => {
              const isA = vizSubject === s.id;
              const col = s.id === "codeviz" ? C.accent : SUBJECT_COLORS[s.id] ?? C.muted;
              return (
                <button key={s.id} onClick={() => setVizSubject(s.id)} style={chip(isA, col)}>
                  {s.label} {s.title}
                </button>
              );
            })}
          </div>

          {/* Module dropdown (codeviz) OR lesson dropdown (subject) */}
          {vizSubject === "codeviz" ? (
            <div style={{ padding:"0 16px 8px", flexShrink:0 }}>
              <select value={activeViz} onChange={e => setActiveViz(e.target.value)}
                style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:12, padding:"10px 14px", color:C.accent, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, outline:"none" }}>
                {VIZ_MODULES.map(v => <option key={v.id} value={v.id} style={{ background:C.surface, color:C.text }}>{v.label}</option>)}
              </select>
            </div>
          ) : subjectLessons.length > 0 ? (
            <div style={{ padding:"0 16px 8px", flexShrink:0 }}>
              <select value={vizLessonIdx} onChange={e => setVizLessonIdx(Number(e.target.value))}
                style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:12, padding:"10px 14px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}>
                {subjectLessons.map((l,i) => <option key={l.id} value={i} style={{ background:C.surface, color:C.text }}>{l.title}</option>)}
              </select>
            </div>
          ) : vizLoading ? (
            <div style={{ padding:"8px 16px", color:C.muted, fontSize:12, flexShrink:0 }}>Loading lessons…</div>
          ) : (
            <div style={{ padding:"8px 16px", color:C.muted, fontSize:12, flexShrink:0 }}>Select a subject above</div>
          )}

          {/* Viz or lesson content — fills ALL remaining space */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
            {vizSubject === "codeviz" ? (
              <Suspense fallback={<div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, color:C.muted }}>Loading…</div>}>
                {(() => {
                  const mod = VIZ_MODULES.find(v => v.id === activeViz);
                  if (!mod) return null;
                  const Comp = mod.Component;
                  return <Comp key={mod.id} />;
                })()}
              </Suspense>
            ) : subjectLessons[vizLessonIdx] ? (
              <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
                {renderLesson(subjectLessons[vizLessonIdx])}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                  <button style={{ ...ghostBtn, fontSize:12 }} onClick={() => setVizLessonIdx(i => Math.max(0,i-1))} disabled={vizLessonIdx===0}>← Prev</button>
                  <span style={{ fontSize:11, color:C.muted }}>{vizLessonIdx+1}/{subjectLessons.length}</span>
                  <button style={{ ...primaryBtn, fontSize:12 }} onClick={() => setVizLessonIdx(i => Math.min(subjectLessons.length-1,i+1))} disabled={vizLessonIdx===subjectLessons.length-1}>Next →</button>
                </div>
              </div>
            ) : !vizLoading ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, color:C.muted }}>
                <div style={{ fontSize:32 }}>{VIZ_SUBJECTS.find(s=>s.id===vizSubject)?.label}</div>
                <div style={{ fontSize:13 }}>Select a subject chip above</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: NOTES
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "notes" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Note selector row */}
          <div style={{ padding:"10px 16px 8px", display:"flex", gap:8, alignItems:"center", flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
            <select value={noteId} onChange={e => setNoteId(Number(e.target.value))}
              style={{ flex:1, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:10, padding:"9px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none" }}>
              {notes.map(n => <option key={n.id} value={n.id} style={{ background:C.surface, color:C.text }}>{n.title}</option>)}
            </select>
            <button style={{ ...primaryBtn, padding:"9px 14px", fontSize:12 }} onClick={newNote}>+ New</button>
          </div>

          {currentNote ? (
            <>
              {/* Note header */}
              <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <input value={currentNote.title} onChange={e => saveNote({ title:e.target.value })}
                  style={{ width:"100%", background:"none", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:17, fontWeight:600, color:C.text }} />
                <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap", alignItems:"center" }}>
                  {currentNote.tags.map(t => <span key={t} style={{ padding:"2px 10px", borderRadius:100, fontSize:11, fontWeight:500, background:C.accentS, border:"1px solid rgba(124,92,252,.3)", color:C.accent }}>{t}</span>)}
                  <span onClick={() => { const tag = prompt("Add tag:"); if(tag) saveNote({ tags:[...currentNote.tags, tag] }); }}
                    style={{ padding:"2px 10px", borderRadius:100, fontSize:11, background:C.surface2, border:`1px solid ${C.border2}`, color:C.muted, cursor:"pointer" }}>+ tag</span>
                  <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                    <button style={{ ...ghostBtn, padding:"5px 10px", fontSize:11 }} onClick={() => navigator.clipboard.writeText(`${currentNote.title}\n\n${currentNote.body}`)}>⎘</button>
                    <button style={{ ...btn(C.accentS, C.accent, "1px solid rgba(124,92,252,.3)"), padding:"5px 10px", fontSize:11 }} onClick={() => { sendAI(`Summarise these notes: ${currentNote.body.slice(0,400)}`); setTab("tutor"); }}>✦ AI</button>
                    <button style={{ ...ghostBtn, padding:"5px 10px", fontSize:11, color:C.red }} onClick={deleteNote}>✕</button>
                  </div>
                </div>
              </div>
              {/* Textarea */}
              <textarea value={currentNote.body} onChange={e => saveNote({ body:e.target.value })}
                placeholder="Start typing your notes…"
                style={{ flex:1, padding:"14px 16px", background:"none", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:C.muted2, lineHeight:1.8, resize:"none", overflowY:"auto" }} />
              {/* Footer */}
              <div style={{ padding:"6px 16px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", flexShrink:0 }}>
                <span style={{ fontSize:11, color:C.muted }}>{currentNote.body.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span style={{ fontSize:11, color:C.muted }}>{saveStatus}</span>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:14 }}>No notes. Tap + New!</div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: AI TUTOR
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "tutor" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Compact config bar */}
          <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
            <select value={tutorSubject} onChange={e => setTutorSubject(e.target.value)}
              style={{ flex:1, minWidth:140, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:10, padding:"8px 12px", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:12, outline:"none" }}>
              {["Data Structures","Algorithms","Python Programming","Database Management","Operating Systems","Computer Networks"].map(s => <option key={s}>{s}</option>)}
            </select>
            <button style={{ ...ghostBtn, padding:"8px 12px", fontSize:12 }} onClick={() => { setChatMsgs([]); initialized.current = false; setTimeout(() => setTab("tutor"),0); }}>↺ Reset</button>
          </div>
          {/* Quick questions */}
          <div style={{ ...scrollX, padding:"8px 16px" }}>
            {["Explain simply","Real-world analogy","Quiz me","Common mistakes?"].map(q => (
              <button key={q} onClick={() => sendAI(q)} style={{ ...chip(false), fontSize:11 }}>{q}</button>
            ))}
          </div>
          {/* Chat messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 16px", display:"flex", flexDirection:"column", gap:12 }}>
            {chatMsgs.map(m => (
              <div key={m.id} style={{ maxWidth:"88%", alignSelf:m.role==="user"?"flex-end":"flex-start", background:m.role==="user"?C.surface2:C.accentS, border:`1px solid ${m.role==="user"?C.border2:"rgba(124,92,252,.2)"}`, borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"10px 14px" }}>
                <div style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:m.role==="user"?C.muted:C.accent, marginBottom:5 }}>{m.role==="user"?"You":"✦ AI Tutor"}</div>
                {m.role === "ai" ? (
                  <div style={{ fontSize:13, lineHeight:1.65, color:C.muted2 }} className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ fontSize:13, lineHeight:1.65, color:C.muted2, whiteSpace:"pre-wrap" }}>{m.text}</div>
                )}
              </div>
            ))}
            {aiLoading && <div style={{ fontSize:12, color:C.muted, animation:"mPulse 1s ease infinite" }}>✦ Tutor is thinking…</div>}
            <div ref={chatEndRef} />
          </div>
          {/* Input — pinned at bottom */}
          <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:16, padding:"8px 12px" }}>
              <textarea value={chatInput}
                onChange={e => { setChatInput(e.target.value); (e.target as HTMLTextAreaElement).style.height="auto"; (e.target as HTMLTextAreaElement).style.height=e.target.scrollHeight+"px"; }}
                onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendAI(chatInput); } }}
                placeholder="Ask anything…" rows={1}
                style={{ flex:1, background:"none", border:"none", outline:"none", color:C.text, fontFamily:"'DM Sans',sans-serif", fontSize:13, lineHeight:1.6, resize:"none", maxHeight:100, overflowY:"auto" }} />
              <button onClick={() => sendAI(chatInput)} disabled={aiLoading || !chatInput.trim()}
                style={{ width:34, height:34, borderRadius:10, background:C.accent, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, opacity:aiLoading||!chatInput.trim()? 0.5:1 }}>→</button>
            </div>
            <div style={{ fontSize:10, color:C.muted, textAlign:"center", marginTop:4 }}>Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .m-cc-opt:hover { border-color: var(--border2) !important; color: var(--text) !important; }
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
        .prose pre { background: var(--surface3); border-radius: 8px; padding: 10px 14px; font-size: 11px; overflow-x: auto; }
        .prose code { background: var(--surface3); padding: 2px 5px; border-radius: 4px; font-size: 11px; }
        .prose p { margin: 0 0 8px; }
        .prose ul, .prose ol { padding-left: 18px; }
      `}</style>
    </div>
  );
};

export default LearnMobile;
