import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Play, RotateCcw, Clock, Copy, Sparkles, Mic, Send, RefreshCw, Trophy, ChevronLeft, CheckCircle2, Circle, Filter, ChevronDown, X, ArrowRight } from "lucide-react";
import { QUESTIONS, FEEDBACK_TEMPLATES, ALL_QUESTIONS, DEFAULT_STORIES, COMPANIES } from "./interview-prep/data";
import type { CompanyData } from "./interview-prep/data";
import { interviewApi } from "@/lib/api";

// ── Types ────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";
interface Story { title: string; theme: string; status: string; s: string; t: string; a: string; r: string }
type Tab = "bank" | "star" | "mock" | "company" | "salary";
type MockPhase = "setup" | "active" | "feedback";
interface MockMsg { role: "user" | "ai"; text: string }
interface MockFeedback { clarity: number; relevance: number; structure: number; text: string; closing: string }

// ── Constants ────────────────────────────────────────────
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "bank",    label: "Bank",    icon: "📚" },
  { key: "star",    label: "STAR",    icon: "⭐" },
  { key: "mock",    label: "Mock",    icon: "🎤" },
  { key: "company", label: "Intel",   icon: "🏢" },
  { key: "salary",  label: "Salary",  icon: "💰" },
];

const DIFF_PILL: Record<string, string> = {
  easy:   "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  hard:   "bg-red-500/15 text-red-400",
};
const CAT_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  behavioural: { bg: "bg-violet-500/15", text: "text-violet-400", icon: "🧠" },
  technical:   { bg: "bg-sky-500/15",    text: "text-sky-400",    icon: "⚙️" },
  situational: { bg: "bg-teal-500/15",   text: "text-teal-400",   icon: "💭" },
  hr:          { bg: "bg-rose-500/15",   text: "text-rose-400",   icon: "👤" },
};

function scoreColor(s: number) {
  return s >= 80 ? "text-emerald-400" : s >= 65 ? "text-amber-400" : "text-red-400";
}
function scoreBorder(s: number) {
  return s >= 80 ? "border-emerald-400" : s >= 65 ? "border-amber-400" : "border-red-400";
}

// ── Pill Badge ───────────────────────────────────────────
const Pill = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${className}`}>
    {children}
  </span>
);

// ── Score Ring ───────────────────────────────────────────
const ScoreRing = ({ score, label }: { score: number; label: string }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className={`w-[72px] h-[72px] rounded-full border-[3px] ${scoreBorder(score)} flex items-center justify-center`}>
      <span className={`text-xl font-bold font-mono ${scoreColor(score)}`}>{score}</span>
    </div>
    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
  </div>
);

// ── Section header ───────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">{children}</p>
);

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const InterviewPrepMobile = () => {
  const [activeTab, setActiveTab] = useState<Tab>("bank");

  // ── QUESTION BANK ─────────────────────────────────────
  const [bankFilter, setBankFilter] = useState("all");
  const [bankSearch, setBankSearch] = useState("");
  const [bankDiff, setBankDiff] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [practiced, setPracticed] = useState<Set<number>>(() => new Set([0, 3, 5, 9, 10, 14]));
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());

  const catMap: Record<string, string> = {
    behavioural: "behavioural", technical: "technical",
    situational: "situational", hr: "hr",
  };
  const filteredBank = ALL_QUESTIONS.filter((q) => {
    const matchCat  = bankFilter === "all" || q.cat === (catMap[bankFilter] || bankFilter);
    const matchDiff = bankDiff === "all"   || q.diff === bankDiff;
    const matchSrch = !bankSearch         || q.text.toLowerCase().includes(bankSearch.toLowerCase());
    return matchCat && matchDiff && matchSrch;
  });

  // ── STAR BUILDER ──────────────────────────────────────
  const [stories, setStories] = useState<Story[]>(() => {
    try { const s = localStorage.getItem("eduai_star_stories"); return s ? JSON.parse(s) : [...DEFAULT_STORIES]; } catch { return [...DEFAULT_STORIES]; }
  });
  const [activeStory, setActiveStory] = useState(0);
  const [polished, setPolished] = useState('Tap "✦ Polish" to generate an interview-ready version.');
  const [showStoriesList, setShowStoriesList] = useState(false);
  const [showPolished, setShowPolished] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("eduai_star_stories", JSON.stringify(stories)); } catch {}
  }, [stories]);

  const currentStory = stories[activeStory] || stories[0];
  const updateField = (field: keyof Story, value: string) =>
    setStories(prev => prev.map((s, i) => i === activeStory ? { ...s, [field]: value } : s));
  const polishStory = () => {
    const { s, t, a, r } = currentStory;
    if (!s || !a) { setPolished("Please fill in at least Situation and Action first."); setShowPolished(true); return; }
    setPolished(`${s.trim()} My responsibility was to ${t.trim().toLowerCase().replace(/^i needed to /, "")}.\n\nTo tackle this, ${a.trim()}.\n\nAs a result, ${r.trim()}`);
    setShowPolished(true);
  };

  // ── MOCK INTERVIEW ────────────────────────────────────
  const [mockPhase, setMockPhase] = useState<MockPhase>("setup");
  const [mockMessages, setMockMessages] = useState<MockMsg[]>([]);
  const [mockInput, setMockInput] = useState("");
  const [mockLoading, setMockLoading] = useState(false);
  const [mockFeedback, setMockFeedback] = useState<MockFeedback | null>(null);
  const [mockQuestion, setMockQuestion] = useState("");
  const [mockCategory, setMockCategory] = useState("behavioural");
  const [mockRole, setMockRole] = useState("Software Engineer");
  const [mockDifficulty, setMockDifficulty] = useState("medium");
  const [mockTimer, setMockTimer] = useState(0);
  const [mockTimerActive, setMockTimerActive] = useState(false);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mockTimerActive) {
      mockTimerRef.current = setInterval(() => setMockTimer(t => t + 1), 1000);
    } else if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    return () => { if (mockTimerRef.current) clearInterval(mockTimerRef.current); };
  }, [mockTimerActive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mockMessages, mockLoading]);

  const fmtTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getRandomQ = (cat: string, diff: string) => {
    const pool = ALL_QUESTIONS.filter(q =>
      (cat === "all" || q.cat === cat) && (diff === "all" || q.diff === diff)
    );
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].text : ALL_QUESTIONS[0].text;
  };

  const startMock = async () => {
    const q = getRandomQ(mockCategory, mockDifficulty);
    setMockQuestion(q); setMockMessages([]); setMockFeedback(null);
    setMockLoading(true); setMockPhase("active");
    setMockTimer(0); setMockTimerActive(true);
    try {
      const res = await interviewApi.startMock(q, mockCategory);
      setMockMessages([{ role: "ai", text: res.text || "Let's begin — here is your question." }]);
    } catch {
      setMockMessages([{ role: "ai", text: `Let's start! Here's your question: "${q}" — take your time.` }]);
    } finally { setMockLoading(false); }
  };

  const sendAnswer = async () => {
    if (!mockInput.trim() || mockLoading) return;
    const answer = mockInput.trim(); setMockInput("");
    const history = mockMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
    setMockMessages(prev => [...prev, { role: "user", text: answer }]);
    setMockLoading(true);
    try {
      const res = await interviewApi.sendMockAnswer(mockQuestion, mockCategory, history, answer);
      if (res.type === "feedback" && res.clarity !== undefined) {
        setMockFeedback({ clarity: res.clarity!, relevance: res.relevance!, structure: res.structure!, text: res.text!, closing: res.closing! });
        setMockPhase("feedback"); setMockTimerActive(false);
      } else {
        setMockMessages(prev => [...prev, { role: "ai", text: res.text || "Tell me more." }]);
      }
    } catch {
      setMockMessages(prev => [...prev, { role: "ai", text: "Interesting — could you elaborate on the actions you took?" }]);
    } finally { setMockLoading(false); }
  };

  const endMock = async () => {
    if (mockLoading) return;
    setMockLoading(true); setMockTimerActive(false);
    const history = mockMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
    try {
      const res = await interviewApi.sendMockAnswer(mockQuestion, mockCategory, history, "[END_SESSION_FEEDBACK_REQUESTED]");
      if (res.type === "feedback" && res.clarity !== undefined) {
        setMockFeedback({ clarity: res.clarity!, relevance: res.relevance!, structure: res.structure!, text: res.text!, closing: res.closing! });
        setMockPhase("feedback");
      }
    } catch {
      setMockFeedback({ clarity: 75, relevance: 80, structure: 72, text: "Good attempt! Remember to quantify your impact.", closing: "Keep practicing!" });
      setMockPhase("feedback");
    } finally { setMockLoading(false); }
  };

  const resetMock = () => {
    setMockPhase("setup"); setMockMessages([]); setMockFeedback(null);
    setMockInput(""); setMockTimer(0); setMockTimerActive(false);
    if (mockTimerRef.current) clearInterval(mockTimerRef.current);
  };

  // ── COMPANY INTEL ─────────────────────────────────────
  const [activeCompany, setActiveCompany] = useState("google");
  const [showCompanyList, setShowCompanyList] = useState(false);
  const company: CompanyData = COMPANIES[activeCompany] || COMPANIES.google;

  // ── SALARY ────────────────────────────────────────────
  const [salaryChat, setSalaryChat] = useState<{ role: string; text: string }[]>([]);
  const [salaryRunning, setSalaryRunning] = useState(false);
  const [salaryAnswer, setSalaryAnswer] = useState("");
  const [showTactics, setShowTactics] = useState(false);

  const startNeg = () => {
    setSalaryRunning(true);
    setSalaryChat([{ role: "interviewer", text: "Thanks for coming in today. We'd like to extend an offer. Before we discuss numbers — what are your salary expectations?" }]);
  };
  const submitSalary = () => {
    if (!salaryAnswer.trim()) return;
    const responses = [
      "That's a bit above our budget. We were thinking £52,000–£58,000. Would that work?",
      "I appreciate that. Let me check with the team. Is there anything beyond base salary that matters to you?",
      "We have some flexibility on equity. Would you consider a slightly lower base for a larger options grant?",
    ];
    setSalaryChat(prev => [
      ...prev,
      { role: "user", text: salaryAnswer },
      { role: "interviewer", text: responses[Math.floor(Math.random() * responses.length)] },
    ]);
    setSalaryAnswer("");
  };

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">

      {/* ── Static Header ─────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-border/40">
        <h1 className="text-lg font-bold tracking-tight">Interview Prep</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Mock interviews · question bank · STAR · company intel</p>
      </div>

      {/* ── Bottom Tab Bar ────────────────────────────── */}
      <div className="order-last flex-shrink-0 flex border-t border-border/40 bg-background/95 backdrop-blur-sm safe-area-pb">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
              activeTab === tab.key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.key && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
          </button>
        ))}
      </div>

      {/* ── Scrollable Content ────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-none">

        {/* ══ QUESTION BANK ══════════════════════════════ */}
        {activeTab === "bank" && (
          <div className="flex flex-col h-full">
            {/* Search + filter row */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 pt-3 pb-2 space-y-2 border-b border-border/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search questions…"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  className="w-full pl-9 pr-4 h-10 bg-muted/30 border border-border/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                />
              </div>
              {/* Category chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {[
                  { k: "all",         l: "All" },
                  { k: "behavioural", l: "🧠 Behavioural" },
                  { k: "technical",   l: "⚙️ Technical" },
                  { k: "situational", l: "💭 Situational" },
                  { k: "hr",          l: "👤 HR" },
                ].map(c => (
                  <button
                    key={c.k}
                    onClick={() => setBankFilter(c.k)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      bankFilter === c.k
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-muted-foreground border border-border/40"
                    }`}
                  >
                    {c.l}
                  </button>
                ))}
                {/* Difficulty toggle */}
                <button
                  onClick={() => setFilterOpen(p => !p)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-muted/40 border border-border/40 text-muted-foreground"
                >
                  <Filter className="h-3 w-3" />
                  {bankDiff === "all" ? "Diff" : bankDiff.charAt(0).toUpperCase() + bankDiff.slice(1)}
                </button>
              </div>
              {filterOpen && (
                <div className="flex gap-1.5 pb-1">
                  {["all", "easy", "medium", "hard"].map(d => (
                    <button key={d} onClick={() => { setBankDiff(d); setFilterOpen(false); }}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        bankDiff === d ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground border border-border/40"
                      }`}>
                      {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${(practiced.size / ALL_QUESTIONS.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{practiced.size}/{ALL_QUESTIONS.length} done</span>
              </div>
            </div>

            {/* Question cards */}
            <div className="px-4 py-3 space-y-2.5">
              {filteredBank.map((q) => {
                const idx = ALL_QUESTIONS.indexOf(q);
                const isPracticed = practiced.has(idx);
                const dc = DIFF_PILL[q.diff] || DIFF_PILL.easy;
                const cc = CAT_CONFIG[q.cat] || CAT_CONFIG.hr;
                const tipsOpen = expandedTips.has(idx);
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 transition-all ${
                      isPracticed
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-card border-border/40"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5 ${cc.bg}`}>
                        {cc.icon}
                      </div>
                      <p className="text-sm font-medium leading-snug flex-1">{q.text}</p>
                    </div>
                    {/* Badges row */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        <Pill className={dc}>{q.diff}</Pill>
                        <Pill className={`${cc.bg} ${cc.text}`}>{q.cat}</Pill>
                        {isPracticed && <Pill className="bg-emerald-500/15 text-emerald-400">✓ done</Pill>}
                      </div>
                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setExpandedTips(prev => {
                            const n = new Set(prev);
                            n.has(idx) ? n.delete(idx) : n.add(idx);
                            return n;
                          })}
                          className="text-xs text-muted-foreground active:text-primary"
                        >
                          Tips {tipsOpen ? "▴" : "▾"}
                        </button>
                        <button
                          onClick={() => setPracticed(prev => {
                            const n = new Set(prev);
                            n.has(idx) ? n.delete(idx) : n.add(idx);
                            return n;
                          })}
                          className={`text-xs font-medium ${isPracticed ? "text-muted-foreground" : "text-emerald-400"}`}
                        >
                          {isPracticed ? "Undo" : "✓ Done"}
                        </button>
                      </div>
                    </div>
                    {/* Tips */}
                    {tipsOpen && (
                      <div className="mt-3 p-3 bg-muted/20 rounded-xl text-xs text-muted-foreground leading-relaxed border border-border/30">
                        {q.tips}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="h-4" />
            </div>
          </div>
        )}

        {/* ══ STAR BUILDER ═══════════════════════════════ */}
        {activeTab === "star" && (
          <div className="px-4 py-4 space-y-4 pb-8">
            {/* Story selector */}
            <button
              onClick={() => setShowStoriesList(p => !p)}
              className="w-full flex items-center justify-between p-3.5 bg-card border border-border/40 rounded-2xl"
            >
              <div className="text-left">
                <p className="text-sm font-semibold">{currentStory.title}</p>
                <p className="text-[11px] text-muted-foreground">{currentStory.theme} · {currentStory.status}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showStoriesList ? "rotate-180" : ""}`} />
            </button>

            {showStoriesList && (
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden -mt-2">
                {stories.map((s, i) => (
                  <button key={i} onClick={() => { setActiveStory(i); setShowStoriesList(false); setPolished('Tap "✦ Polish" to generate an interview-ready version.'); setShowPolished(false); }}
                    className={`w-full text-left px-4 py-3 border-b border-border/30 last:border-b-0 transition-colors ${
                      i === activeStory ? "bg-primary/10" : "active:bg-muted/30"
                    }`}>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-[11px] text-muted-foreground">{s.theme} · {s.status}</p>
                  </button>
                ))}
                <button onClick={() => {
                  setStories(prev => [...prev, { title: "New Story", theme: "General", status: "Draft", s: "", t: "", a: "", r: "" }]);
                  setActiveStory(stories.length); setShowStoriesList(false);
                  setPolished('Fill in the STAR fields below, then tap "✦ Polish".');
                }}
                  className="w-full text-left px-4 py-3 text-sm text-primary font-medium">
                  + New Story
                </button>
              </div>
            )}

            {/* Editable title */}
            <input
              value={currentStory.title}
              onChange={e => updateField("title", e.target.value)}
              className="w-full bg-transparent border-none outline-none text-base font-bold text-foreground"
            />

            {/* STAR Blocks */}
            {([
              { key: "s" as const, label: "Situation", desc: "Set the scene — when, where, context", accent: "bg-sky-500/15 text-sky-500" },
              { key: "t" as const, label: "Task",      desc: "Your responsibility in the situation", accent: "bg-violet-500/15 text-violet-500" },
              { key: "a" as const, label: "Action",    desc: "Specific steps YOU took (use 'I' not 'we')", accent: "bg-emerald-500/15 text-emerald-500" },
              { key: "r" as const, label: "Result",    desc: "Quantify the outcome — numbers win", accent: "bg-amber-500/15 text-amber-500" },
            ] as const).map(block => (
              <div key={block.key} className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${block.accent}`}>
                    {block.key.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{block.label}</p>
                    <p className="text-[10px] text-muted-foreground">{block.desc}</p>
                  </div>
                </div>
                <textarea
                  value={currentStory[block.key]}
                  onChange={e => updateField(block.key, e.target.value)}
                  placeholder={`Enter ${block.label.toLowerCase()}…`}
                  rows={3}
                  className="w-full px-4 pb-4 bg-transparent border-none outline-none text-sm text-foreground resize-none leading-relaxed placeholder:text-muted-foreground"
                />
              </div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={polishStory}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/30 rounded-xl text-sm font-semibold text-primary active:bg-primary/20">
                <Sparkles className="h-4 w-4" /> Polish
              </button>
              <button onClick={() => { navigator.clipboard.writeText(polished); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted/30 border border-border/40 rounded-xl text-sm font-semibold text-foreground active:bg-muted/50">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>

            {/* Polished output */}
            {showPolished && (
              <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Polished Answer</p>
                  <span className="text-[10px] text-muted-foreground">~90 sec</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{polished}</p>
              </div>
            )}

            {/* Theme chips */}
            <div>
              <SectionLabel>Quick Themes</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {["Leadership", "Teamwork", "Problem Solving", "Failure", "Initiative", "Conflict"].map(t => (
                  <button key={t} onClick={() => updateField("title", `A time I demonstrated ${t}`)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-muted/40 border border-border/40 text-muted-foreground active:bg-muted/60">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-4" />
          </div>
        )}

        {/* ══ MOCK INTERVIEW ══════════════════════════════ */}
        {activeTab === "mock" && (
          <div className="flex flex-col h-full min-h-0">

            {/* SETUP */}
            {mockPhase === "setup" && (
              <div className="px-4 py-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl">🎤</div>
                  <h2 className="text-xl font-bold">Mock Interview</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Practice with an AI hiring manager. Get scored feedback on clarity, relevance, and structure.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <SectionLabel>Your Role</SectionLabel>
                    <select value={mockRole} onChange={e => setMockRole(e.target.value)}
                      className="w-full bg-card border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60">
                      {["Software Engineer","Product Manager","Data Scientist","Frontend Developer","Backend Developer","UX Designer","DevOps Engineer"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <SectionLabel>Category</SectionLabel>
                    <select value={mockCategory} onChange={e => setMockCategory(e.target.value)}
                      className="w-full bg-card border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60">
                      <option value="behavioural">🧠 Behavioural</option>
                      <option value="technical">⚙️ Technical</option>
                      <option value="situational">💭 Situational</option>
                      <option value="hr">👤 HR / Culture</option>
                      <option value="all">🎲 Mixed</option>
                    </select>
                  </div>
                  <div>
                    <SectionLabel>Difficulty</SectionLabel>
                    <div className="flex gap-2">
                      {["easy","medium","hard","all"].map(d => (
                        <button key={d} onClick={() => setMockDifficulty(d)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            mockDifficulty === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/40 text-muted-foreground"
                          }`}>
                          {d === "all" ? "Mix" : d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={startMock}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl text-base font-semibold active:opacity-90">
                  <Mic className="h-5 w-5" /> Start Interview
                </button>

                <div className="flex justify-around text-center text-xs text-muted-foreground">
                  <div><div className="text-lg font-bold text-primary mb-0.5">GPT-4o</div>AI Model</div>
                  <div><div className="text-lg font-bold text-emerald-400 mb-0.5">3</div>Metrics</div>
                  <div><div className="text-lg font-bold text-amber-400 mb-0.5">∞</div>Attempts</div>
                </div>
              </div>
            )}

            {/* ACTIVE */}
            {mockPhase === "active" && (
              <div className="flex flex-col h-full min-h-0">
                {/* Top bar */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-mono text-amber-400">
                    <Clock className="h-3.5 w-3.5" />{fmtTimer(mockTimer)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={endMock} disabled={mockLoading || mockMessages.length < 2}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-xl text-xs font-semibold text-primary disabled:opacity-40">
                      <Trophy className="h-3.5 w-3.5" /> Done
                    </button>
                    <button onClick={resetMock} className="p-1.5 rounded-xl border border-border/40 text-muted-foreground">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question banner */}
                <div className="flex-shrink-0 px-4 py-2.5 bg-primary/5 border-b border-primary/10">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-semibold">Q: </span>{mockQuestion}
                  </p>
                </div>

                {/* Chat scroll */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {mockMessages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                        m.role === "ai" ? "bg-primary/10" : "bg-muted/30"
                      }`}>
                        {m.role === "ai" ? "🤖" : "👤"}
                      </div>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                        m.role === "ai"
                          ? "bg-primary/5 border border-primary/10 rounded-tl-sm"
                          : "bg-muted/30 border border-border/40 rounded-tr-sm"
                      }`}>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                          {m.role === "ai" ? "Interviewer" : "You"}
                        </p>
                        <p className="text-sm leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  ))}
                  {mockLoading && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-sm">🤖</div>
                      <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                        {[0,150,300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-border/30 bg-background/95 backdrop-blur-sm">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={mockInput}
                      onChange={e => setMockInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                      placeholder="Type your answer…"
                      disabled={mockLoading}
                      rows={2}
                      className="flex-1 bg-muted/30 border border-border/40 rounded-2xl px-3.5 py-2.5 text-sm text-foreground resize-none focus:border-primary/60 focus:outline-none disabled:opacity-50 placeholder:text-muted-foreground"
                    />
                    <button onClick={sendAnswer} disabled={mockLoading || !mockInput.trim()}
                      className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform">
                      <Send className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-1.5">After 2 exchanges the AI will offer feedback</p>
                </div>
              </div>
            )}

            {/* FEEDBACK */}
            {mockPhase === "feedback" && mockFeedback && (
              <div className="px-4 py-6 space-y-5 pb-8">
                <div className="text-center space-y-1.5">
                  <div className="text-4xl">🏆</div>
                  <h2 className="text-xl font-bold">Feedback</h2>
                  <p className="text-xs text-muted-foreground">Duration: {fmtTimer(mockTimer)}</p>
                </div>

                {/* Score rings */}
                <div className="flex justify-center gap-6">
                  <ScoreRing score={mockFeedback.clarity}   label="Clarity" />
                  <ScoreRing score={mockFeedback.relevance} label="Relevance" />
                  <ScoreRing score={mockFeedback.structure} label="Structure" />
                </div>

                {/* Overall */}
                <div className="text-center">
                  <span className={`text-3xl font-bold font-mono ${scoreColor(Math.round((mockFeedback.clarity + mockFeedback.relevance + mockFeedback.structure) / 3))}`}>
                    {Math.round((mockFeedback.clarity + mockFeedback.relevance + mockFeedback.structure) / 3)}
                  </span>
                  <span className="text-base text-muted-foreground">/100 overall</span>
                </div>

                {/* Feedback text */}
                <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Feedback</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mockFeedback.text}</p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-sm text-emerald-400 leading-relaxed">✨ {mockFeedback.closing}</p>
                </div>

                <div className="bg-card border border-border/40 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Question</p>
                  <p className="text-sm text-muted-foreground">{mockQuestion}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={resetMock}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold">
                    <RefreshCw className="h-4 w-4" /> New Interview
                  </button>
                  <button onClick={startMock}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-card border border-border/40 rounded-2xl text-sm font-semibold">
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                </div>
                <div className="h-4" />
              </div>
            )}
          </div>
        )}

        {/* ══ COMPANY INTEL ══════════════════════════════ */}
        {activeTab === "company" && (
          <div className="px-4 py-4 space-y-4 pb-8">
            {/* Company selector */}
            <button
              onClick={() => setShowCompanyList(p => !p)}
              className="w-full flex items-center justify-between p-3.5 bg-card border border-border/40 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{company.emoji}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">{company.name}</p>
                  <p className="text-[11px] text-muted-foreground">{company.type}</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showCompanyList ? "rotate-180" : ""}`} />
            </button>

            {showCompanyList && (
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden -mt-2">
                {Object.entries(COMPANIES).map(([key, c]) => (
                  <button key={key} onClick={() => { setActiveCompany(key); setShowCompanyList(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-b-0 transition-colors ${
                      key === activeCompany ? "bg-primary/10" : "active:bg-muted/30"
                    }`}>
                    <span className="text-xl">{c.emoji}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Company header */}
            <div className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-4xl">{company.emoji}</span>
              <div>
                <h2 className="text-base font-bold">{company.name}</h2>
                <p className="text-xs text-muted-foreground">Founded {company.founded} · {company.size} employees</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {company.values.slice(0, 3).map(v => (
                    <Pill key={v} className="bg-muted/40 text-muted-foreground border border-border/30">{v}</Pill>
                  ))}
                </div>
              </div>
            </div>

            {/* Format card */}
            <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Interview Format</p>
              <p className="text-sm text-muted-foreground">{company.format}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span><span className="text-foreground font-medium">Timeline:</span> {company.duration}</span>
              </div>
              <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Style:</span> {company.style}</p>
            </div>

            {/* Tips */}
            <div className="bg-card border border-border/40 rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Insider Tips</p>
              {company.tips.map((t, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-base mt-0.5">💡</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t}</p>
                </div>
              ))}
            </div>

            {/* Questions */}
            <div className="space-y-2">
              <SectionLabel>Known Interview Questions</SectionLabel>
              {company.questions.map((q, i) => (
                <div key={i} className="flex gap-3 items-start p-3.5 bg-card border border-border/40 rounded-xl">
                  <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
            <div className="h-4" />
          </div>
        )}

        {/* ══ SALARY NEGOTIATION ═════════════════════════ */}
        {activeTab === "salary" && (
          <div className="flex flex-col h-full min-h-0">
            {/* Config (collapsed after start) */}
            {!salaryRunning && (
              <div className="px-4 py-5 space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl">💰</div>
                  <h2 className="text-xl font-bold">Salary Negotiation</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">Practice real negotiation scenarios with an AI hiring manager.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <SectionLabel>Your Role</SectionLabel>
                    <select className="w-full bg-card border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none">
                      {["Frontend Developer","Software Engineer","Product Manager","Data Scientist","UX Designer"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <SectionLabel>Experience Level</SectionLabel>
                    <select className="w-full bg-card border border-border/40 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none">
                      {["Graduate / Entry Level","1–3 years","3–5 years","5+ years"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <SectionLabel>Their Offer (£)</SectionLabel>
                      <input placeholder="55000" className="w-full bg-card border border-border/40 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60" />
                    </div>
                    <div>
                      <SectionLabel>Your Target (£)</SectionLabel>
                      <input placeholder="65000" className="w-full bg-card border border-border/40 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60" />
                    </div>
                  </div>
                </div>

                <button onClick={startNeg}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl text-base font-semibold active:opacity-90">
                  <Play className="h-5 w-5" /> Start Simulation
                </button>

                {/* Tactics toggle */}
                <button onClick={() => setShowTactics(p => !p)}
                  className="w-full flex items-center justify-between p-3.5 bg-card border border-border/40 rounded-2xl">
                  <p className="text-sm font-semibold">Negotiation Tactics</p>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showTactics ? "rotate-180" : ""}`} />
                </button>
                {showTactics && (
                  <div className="space-y-2 -mt-2">
                    {[
                      { n: "The Anchor",     c: "text-primary",     t: "State your target first, higher than your minimum." },
                      { n: "The Silence",    c: "text-emerald-400", t: "After naming your number, stop talking." },
                      { n: "The Flinch",     c: "text-amber-400",   t: "Show mild disappointment at their offer." },
                      { n: "Total Package",  c: "text-teal-400",    t: "Negotiate equity, remote days, title — not just salary." },
                    ].map(tac => (
                      <div key={tac.n} className="bg-card border border-border/40 rounded-2xl p-4">
                        <p className={`text-xs font-bold mb-1 ${tac.c}`}>{tac.n}</p>
                        <p className="text-xs text-muted-foreground">{tac.t}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-semibold">💡 Key principle:</span> Never give a number first. Always anchor high and justify with market data.
                  </p>
                </div>
                <div className="h-4" />
              </div>
            )}

            {/* Simulation chat */}
            {salaryRunning && (
              <div className="flex flex-col h-full min-h-0">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Simulation</span>
                  </div>
                  <button onClick={() => { setSalaryRunning(false); setSalaryChat([]); }}
                    className="p-1.5 rounded-xl border border-border/40 text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {salaryChat.map((b, i) => (
                    <div key={i} className={`flex gap-2.5 ${b.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
                        b.role === "user" ? "bg-muted/30" : "bg-amber-500/15"
                      }`}>
                        {b.role === "user" ? "👤" : "💼"}
                      </div>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                        b.role === "user"
                          ? "bg-muted/30 border border-border/40 rounded-tr-sm"
                          : "bg-amber-500/10 border border-amber-500/20 rounded-tl-sm"
                      }`}>
                        <p className="text-[10px] font-semibold mb-1" style={{ color: b.role === "user" ? "var(--muted-foreground)" : "#f59e0b" }}>
                          {b.role === "user" ? "You" : "Hiring Manager"}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-border/30 bg-background/95 backdrop-blur-sm">
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={salaryAnswer}
                      onChange={e => setSalaryAnswer(e.target.value)}
                      placeholder="Type your response…"
                      rows={2}
                      className="flex-1 bg-muted/30 border border-border/40 rounded-2xl px-3.5 py-2.5 text-sm text-foreground resize-none focus:border-primary/60 focus:outline-none placeholder:text-muted-foreground"
                    />
                    <button onClick={submitSalary} disabled={!salaryAnswer.trim()}
                      className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-transform">
                      <ArrowRight className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPrepMobile;
