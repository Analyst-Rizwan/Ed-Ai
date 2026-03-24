import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Play, RotateCcw, Clock, Copy, Sparkles, Mic, Send, RefreshCw, Trophy, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QUESTIONS, FEEDBACK_TEMPLATES, ALL_QUESTIONS, DEFAULT_STORIES, COMPANIES } from "./interview-prep/data";
import type { CompanyData } from "./interview-prep/data";
import { interviewApi } from "@/lib/api";

// ── Types ────────────────────────────────────────────────
type Difficulty = "easy" | "medium" | "hard";
interface FeedbackItem { clarity: number; relevance: number; structure: number; text: string }
interface FeedbackItem { clarity: number; relevance: number; structure: number; text: string }
interface Story { title: string; theme: string; status: string; s: string; t: string; a: string; r: string }

type Tab = "bank" | "star" | "company" | "salary" | "mock";
const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key: "bank", label: "Question Bank", emoji: "📚" },
    { key: "star", label: "STAR Builder", emoji: "⭐" },
    { key: "mock", label: "Mock Interview", emoji: "🎤" },
    { key: "company", label: "Company Intel", emoji: "🏢" },
    { key: "salary", label: "Salary Negotiation", emoji: "💰" },
];

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
    easy: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    medium: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
    hard: { bg: "bg-red-500/10", text: "text-red-400" },
};
const CAT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    behavioural: { bg: "bg-purple-500/10", text: "text-purple-400", icon: "🧠" },
    technical: { bg: "bg-blue-500/10", text: "text-blue-400", icon: "⚙️" },
    situational: { bg: "bg-teal-500/10", text: "text-teal-400", icon: "💭" },
    hr: { bg: "bg-orange-500/10", text: "text-orange-400", icon: "👤" },
};

function scoreColor(s: number) { return s >= 80 ? "text-emerald-400" : s >= 65 ? "text-yellow-400" : "text-red-400"; }

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const InterviewPrep = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>("bank");

    // ── QUESTION BANK STATE ────────────────────────────────
    const [bankFilter, setBankFilter] = useState("all");
    const [bankSearch, setBankSearch] = useState("");
    const [bankDiff, setBankDiff] = useState("all");
    const [practiced, setPracticed] = useState<Set<number>>(() => new Set([0, 3, 5, 9, 10, 14]));
    const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());

    // ── STAR BUILDER STATE ─────────────────────────────────
    const [stories, setStories] = useState<Story[]>(() => {
        const saved = localStorage.getItem("eduai_star_stories");
        return saved ? JSON.parse(saved) : [...DEFAULT_STORIES];
    });
    const [activeStory, setActiveStory] = useState(0);
    const [polishedOutput, setPolishedOutput] = useState("Click \"✦ AI Polish\" to generate an interview-ready version.");

    useEffect(() => { localStorage.setItem("eduai_star_stories", JSON.stringify(stories)); }, [stories]);

    // ── MOCK INTERVIEW STATE ───────────────────────────────
    type MockPhase = "setup" | "active" | "feedback";
    interface MockMsg { role: "user" | "ai"; text: string; }
    interface MockFeedback { clarity: number; relevance: number; structure: number; text: string; closing: string; }
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
    const mockChatRef = useRef<HTMLDivElement>(null);

    // ── COMPANY INTEL STATE ────────────────────────────────
    const [activeCompany, setActiveCompany] = useState("google");

    // ── SALARY STATE ───────────────────────────────────────
    const [salaryChat, setSalaryChat] = useState<{ role: string; text: string }[]>([]);
    const [salaryRunning, setSalaryRunning] = useState(false);
    const [salaryAnswer, setSalaryAnswer] = useState("");

    // ── BANK HELPERS ───────────────────────────────────────
    const catMap: Record<string, string> = { behavioural: "behavioural", technical: "technical", situational: "situational", hr: "hr", system: "technical", frontend: "technical", backend: "technical", product: "situational", data: "technical", design: "situational", finance: "hr" };
    const filteredBank = ALL_QUESTIONS.filter((q, _i) => {
        const matchCat = bankFilter === "all" || q.cat === (catMap[bankFilter] || bankFilter);
        const matchDiff = bankDiff === "all" || q.diff === bankDiff;
        const matchSearch = !bankSearch || q.text.toLowerCase().includes(bankSearch.toLowerCase());
        return matchCat && matchDiff && matchSearch;
    });

    // ── STAR HELPERS ───────────────────────────────────────
    const currentStory = stories[activeStory] || stories[0];
    const updateStoryField = (field: keyof Story, value: string) => {
        setStories(prev => prev.map((s, i) => i === activeStory ? { ...s, [field]: value } : s));
    };
    const polishStory = () => {
        const { s, t, a, r } = currentStory;
        if (!s || !a) { setPolishedOutput("Please fill in at least the Situation and Action fields first."); return; }
        setPolishedOutput(`${s.trim()} My responsibility was to ${t.trim().toLowerCase().replace(/^i needed to /, "")}.\n\nTo tackle this, ${a.trim()}.\n\nAs a result, ${r.trim()}`);
    };
    const addNewStory = () => {
        setStories(prev => [...prev, { title: "New Story", theme: "General", status: "Draft", s: "", t: "", a: "", r: "" }]);
        setActiveStory(stories.length);
        setPolishedOutput("Fill in the STAR fields above, then click \"✦ AI Polish\".");
    };

    // ── SALARY HELPERS ─────────────────────────────────────
    const startNegotiation = () => {
        setSalaryRunning(true);
        setSalaryChat([
            { role: "interviewer", text: "Thanks for coming in today. We'd like to extend an offer for the role. Before we discuss numbers, could you tell me what your salary expectations are?" },
        ]);
    };
    const submitSalaryResponse = () => {
        if (!salaryAnswer.trim()) return;
        const responses = [
            "That's a bit above what we had budgeted for this role. We were thinking more in the range of £52,000–£58,000. Would that work for you?",
            "I appreciate you sharing that. Let me discuss this with the team and get back to you. Is there anything else beyond base salary that's important to you?",
            "Interesting. We have some flexibility on the equity side. Would you be open to a slightly lower base if we increased the stock option grant?",
        ];
        setSalaryChat(prev => [
            ...prev,
            { role: "user", text: salaryAnswer },
            { role: "interviewer", text: responses[Math.floor(Math.random() * responses.length)] },
        ]);
        setSalaryAnswer("");
    };

    // ── MOCK INTERVIEW HELPERS ─────────────────────────────
    // Pick a random question from the selected category
    const getRandomMockQuestion = (cat: string, diff: string) => {
        const pool = ALL_QUESTIONS.filter(q =>
            (cat === "all" || q.cat === cat) && (diff === "all" || q.diff === diff)
        );
        return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)].text : ALL_QUESTIONS[0].text;
    };

    const startMockInterview = async () => {
        const q = getRandomMockQuestion(mockCategory, mockDifficulty);
        setMockQuestion(q);
        setMockMessages([]);
        setMockFeedback(null);
        setMockLoading(true);
        setMockPhase("active");
        setMockTimer(0);
        setMockTimerActive(true);
        try {
            const res = await interviewApi.startMock(q, mockCategory);
            setMockMessages([{ role: "ai", text: res.text || "Let's begin — here is your question." }]);
        } catch {
            setMockMessages([{ role: "ai", text: `Let's start! Here's your question: "${q}" — take your time and answer fully.` }]);
        } finally {
            setMockLoading(false);
        }
    };

    const sendMockAnswer = async () => {
        if (!mockInput.trim() || mockLoading) return;
        const answer = mockInput.trim();
        setMockInput("");
        const updated: { role: string; text: string }[] = [
            ...mockMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text })),
        ];
        setMockMessages(prev => [...prev, { role: "user", text: answer }]);
        setMockLoading(true);
        try {
            const res = await interviewApi.sendMockAnswer(mockQuestion, mockCategory, updated, answer);
            if (res.type === "feedback" && res.clarity !== undefined) {
                setMockFeedback({ clarity: res.clarity!, relevance: res.relevance!, structure: res.structure!, text: res.text!, closing: res.closing! });
                setMockPhase("feedback");
                setMockTimerActive(false);
            } else {
                setMockMessages(prev => [...prev, { role: "ai", text: res.text || "Interesting — tell me more." }]);
            }
        } catch {
            setMockMessages(prev => [...prev, { role: "ai", text: "I heard you. Good points — could you elaborate on the specific actions you took?" }]);
        } finally {
            setMockLoading(false);
            setTimeout(() => mockChatRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 100);
        }
    };

    const endAndGetFeedback = async () => {
        if (mockLoading) return;
        setMockLoading(true);
        setMockTimerActive(false);
        const history = mockMessages.map(m => ({ role: m.role === "ai" ? "assistant" : "user", text: m.text }));
        try {
            const res = await interviewApi.sendMockAnswer(mockQuestion, mockCategory, history, "[END_SESSION_FEEDBACK_REQUESTED]");
            if (res.type === "feedback" && res.clarity !== undefined) {
                setMockFeedback({ clarity: res.clarity!, relevance: res.relevance!, structure: res.structure!, text: res.text!, closing: res.closing! });
                setMockPhase("feedback");
            } else {
                toast({ title: "Almost there...", description: res.text || "Please exchange a few more messages first." });
            }
        } catch {
            setMockFeedback({ clarity: 75, relevance: 80, structure: 72, text: "Good attempt! Remember to quantify your impact and use the STAR structure clearly.", closing: "Keep practicing!" });
            setMockPhase("feedback");
        } finally {
            setMockLoading(false);
        }
    };

    const resetMock = () => {
        setMockPhase("setup");
        setMockMessages([]);
        setMockFeedback(null);
        setMockInput("");
        setMockTimer(0);
        setMockTimerActive(false);
        if (mockTimerRef.current) clearInterval(mockTimerRef.current);
    };

    // Timer effect
    useEffect(() => {
        if (mockTimerActive) {
            mockTimerRef.current = setInterval(() => setMockTimer(t => t + 1), 1000);
        } else {
            if (mockTimerRef.current) clearInterval(mockTimerRef.current);
        }
        return () => { if (mockTimerRef.current) clearInterval(mockTimerRef.current); };
    }, [mockTimerActive]);

    const fmtTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    const scoreRing = (score: number, label: string, color: string) => (
        <div className="flex flex-col items-center gap-1">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${color}`}>
                <span className="text-2xl font-bold">{score}</span>
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );

    // ── COMPANY INTEL ──────────────────────────────────────
    const company: CompanyData = COMPANIES[activeCompany] || COMPANIES.google;


    // ══════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════
    return (
        <div className="space-y-0 h-full flex flex-col overflow-hidden animate-in">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">Interview Prep <span className="text-muted-foreground opacity-60">🎯</span></h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Mock interviews, question bank, STAR stories & company intel</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50 px-6 flex-shrink-0">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                        {tab.emoji} {tab.label}
                    </button>
                ))}
            </div>

            {/* ══ TAB: QUESTION BANK ═══════════════════════════ */}
            {
                activeTab === "bank" && (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-[220px] flex-shrink-0 border-r border-border/50 p-4 overflow-y-auto space-y-1">
                            <div className="text-xs font-semibold mb-2">Categories</div>
                            {[{ k: "all", l: "All Questions", c: ALL_QUESTIONS.length }, { k: "behavioural", l: "🧠 Behavioural", c: ALL_QUESTIONS.filter(q => q.cat === "behavioural").length }, { k: "technical", l: "⚙️ Technical", c: ALL_QUESTIONS.filter(q => q.cat === "technical").length }, { k: "situational", l: "💭 Situational", c: ALL_QUESTIONS.filter(q => q.cat === "situational").length }, { k: "hr", l: "👤 HR / Culture", c: ALL_QUESTIONS.filter(q => q.cat === "hr").length }].map(cat => (
                                <button key={cat.k} onClick={() => setBankFilter(cat.k)}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${bankFilter === cat.k ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"}`}>
                                    {cat.l} <span className="text-[10px] font-mono bg-muted/30 px-1.5 py-0.5 rounded-full">{cat.c}</span>
                                </button>
                            ))}
                            <div className="pt-3 mt-3 border-t border-border/30 text-[10px] text-muted-foreground">
                                <div className="text-lg font-bold font-mono text-emerald-400">{practiced.size}<span className="text-xs text-muted-foreground">/{ALL_QUESTIONS.length}</span></div>
                                <div className="mb-2">practiced</div>
                                <div className="h-1 bg-muted/30 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(practiced.size / ALL_QUESTIONS.length) * 100}%` }} /></div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="px-5 py-3 border-b border-border/30 flex gap-3 items-center flex-shrink-0">
                                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search questions..." value={bankSearch} onChange={e => setBankSearch(e.target.value)} className="pl-9 h-9 text-sm" /></div>
                                <select value={bankDiff} onChange={e => setBankDiff(e.target.value)} className="text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-foreground">
                                    <option value="all">All Difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                </select>
                                <Button variant="outline" size="sm" onClick={() => { const unpracticed = ALL_QUESTIONS.map((_, i) => i).filter(i => !practiced.has(i)); if (unpracticed.length) { const el = document.getElementById(`qcard-${unpracticed[Math.floor(Math.random() * unpracticed.length)]}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); } }}>🎲 Random</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
                                {filteredBank.map((q, _fi) => {
                                    const realIdx = ALL_QUESTIONS.indexOf(q);
                                    const isPracticed = practiced.has(realIdx);
                                    const dc = DIFF_COLORS[q.diff] || DIFF_COLORS.easy;
                                    const cc = CAT_COLORS[q.cat] || CAT_COLORS.hr;
                                    return (
                                        <div key={realIdx} id={`qcard-${realIdx}`} className={`glass rounded-2xl p-4 transition-all ${isPracticed ? "border-l-2 border-l-emerald-400" : ""}`}>
                                            <div className="flex gap-3 items-start mb-2">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${cc.bg}`}>{cc.icon}</div>
                                                <p className="text-sm font-medium leading-relaxed flex-1">{q.text}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-1.5">
                                                    <Badge variant="secondary" className={`${dc.bg} ${dc.text} text-[10px] px-2 py-0 border-0`}>{q.diff}</Badge>
                                                    <Badge variant="secondary" className={`${cc.bg} ${cc.text} text-[10px] px-2 py-0 border-0`}>{q.cat}</Badge>
                                                    {isPracticed && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0 border-0">✓ practiced</Badge>}
                                                </div>
                                                <div className="flex gap-2 text-xs">
                                                    <button onClick={() => setExpandedTips(prev => { const n = new Set(prev); if (n.has(realIdx)) { n.delete(realIdx); } else { n.add(realIdx); } return n; })} className="text-muted-foreground hover:text-primary transition-colors">Tips ▾</button>
                                                    <button onClick={() => setPracticed(prev => { const n = new Set(prev); if (n.has(realIdx)) { n.delete(realIdx); } else { n.add(realIdx); } return n; })} className="text-muted-foreground hover:text-emerald-400 transition-colors">{isPracticed ? "↺ Undo" : "✓ Done"}</button>
                                                </div>
                                            </div>
                                            {expandedTips.has(realIdx) && <div className="mt-3 p-3 bg-muted/20 rounded-xl text-xs text-muted-foreground leading-relaxed">{q.tips}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ══ TAB: STAR BUILDER ════════════════════════════ */}
            {
                activeTab === "star" && (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-[260px] flex-shrink-0 border-r border-border/50 p-4 overflow-y-auto space-y-2">
                            <div className="text-xs font-semibold mb-2">My Stories</div>
                            {stories.map((s, i) => (
                                <button key={i} onClick={() => { setActiveStory(i); setPolishedOutput("Click \"✦ AI Polish\" to generate an interview-ready version."); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${activeStory === i ? "bg-primary/10 border-primary/30" : "bg-muted/10 border-border/50 hover:border-border"}`}>
                                    <div className="text-xs font-semibold truncate">{s.title}</div>
                                    <div className="text-[10px] text-muted-foreground">{s.theme} · {s.status}</div>
                                </button>
                            ))}
                            <Button variant="outline" size="sm" className="w-full" onClick={addNewStory}>+ New Story</Button>
                            <div className="pt-3 mt-3 border-t border-border/30">
                                <div className="text-[10px] text-muted-foreground font-semibold mb-2">Common Themes</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Leadership", "Teamwork", "Problem Solving", "Failure", "Initiative", "Conflict"].map(t => (
                                        <button key={t} onClick={() => updateStoryField("title", `A time I demonstrated ${t}`)} className="text-[10px] px-2 py-1 rounded-full bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50 transition-colors">{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <input value={currentStory.title} onChange={e => updateStoryField("title", e.target.value)} className="bg-transparent border-none outline-none text-lg font-bold flex-1 text-foreground" />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="text-emerald-400 border-emerald-400/30" onClick={polishStory}><Sparkles className="h-4 w-4 mr-1" /> AI Polish</Button>
                                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(polishedOutput); toast({ title: "Copied!" }); }}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Tip: Be specific and quantify your impact wherever possible.</p>
                            {[{ key: "s" as const, label: "Situation", desc: "Set the scene — when, where, context", color: "bg-blue-500/10 text-blue-400" },
                            { key: "t" as const, label: "Task", desc: "Your responsibility in the situation", color: "bg-purple-500/10 text-purple-400" },
                            { key: "a" as const, label: "Action", desc: "Specific steps YOU took (use 'I' not 'we')", color: "bg-emerald-500/10 text-emerald-400" },
                            { key: "r" as const, label: "Result", desc: "Quantify the outcome — numbers win", color: "bg-yellow-500/10 text-yellow-400" }].map(block => (
                                <Card key={block.key} className="glass border-border/30 overflow-hidden">
                                    <CardHeader className="pb-0 flex-row items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${block.color}`}>{block.key.toUpperCase()}</div>
                                        <div><CardTitle className="text-sm">{block.label}</CardTitle><p className="text-[10px] text-muted-foreground">{block.desc}</p></div>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <textarea value={currentStory[block.key]} onChange={e => updateStoryField(block.key, e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-sm text-foreground resize-none min-h-[60px] leading-relaxed" placeholder={`Enter ${block.label.toLowerCase()}...`} />
                                    </CardContent>
                                </Card>
                            ))}
                            <Card className="glass border-border/30">
                                <CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">Polished Answer</CardTitle><span className="text-[10px] text-muted-foreground">~90 seconds to deliver</span></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{polishedOutput}</p></CardContent>
                            </Card>
                        </div>
                    </div>
                )
            }

            {/* ══ TAB: COMPANY INTEL ═══════════════════════════ */}
            {
                activeTab === "company" && (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-[240px] flex-shrink-0 border-r border-border/50 p-4 overflow-y-auto space-y-1.5">
                            <div className="text-xs font-semibold mb-2">Companies</div>
                            {Object.entries(COMPANIES).map(([key, c]) => (
                                <button key={key} onClick={() => setActiveCompany(key)}
                                    className={`w-full text-left p-3 rounded-xl flex items-center gap-3 border transition-all ${activeCompany === key ? "bg-primary/10 border-primary/30" : "bg-muted/10 border-border/50 hover:border-border"}`}>
                                    <span className="text-xl">{c.emoji}</span>
                                    <div><div className="text-xs font-semibold">{c.name}</div><div className="text-[10px] text-muted-foreground">{c.type}</div></div>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="flex items-center gap-4 p-5 glass rounded-2xl border-border/30">
                                <span className="text-4xl">{company.emoji}</span>
                                <div>
                                    <h2 className="text-xl font-bold">{company.name}</h2>
                                    <p className="text-sm text-muted-foreground">{company.type} · Founded {company.founded} · {company.size} employees</p>
                                    <div className="flex gap-2 mt-2 flex-wrap">{company.values.slice(0, 3).map(v => <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>)}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="glass border-border/30">
                                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Interview Format</CardTitle></CardHeader>
                                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                                        <p>{company.format}</p><p><strong className="text-foreground">Timeline:</strong> {company.duration}</p><p><strong className="text-foreground">Style:</strong> {company.style}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass border-border/30">
                                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Insider Tips</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">{company.tips.map((t, i) => <p key={i} className="text-sm text-muted-foreground">💡 {t}</p>)}</CardContent>
                                </Card>
                            </div>
                            <Card className="glass border-border/30">
                                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Known Interview Questions</CardTitle></CardHeader>
                                <CardContent className="space-y-2">{company.questions.map((q, i) => (
                                    <div key={i} className="flex gap-3 items-start p-3 bg-muted/10 rounded-xl">
                                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{q}</p>
                                    </div>
                                ))}</CardContent>
                            </Card>
                        </div>
                    </div>
                )
            }

            {/* ══ TAB: SALARY NEGOTIATION ══════════════════════ */}
            {
                activeTab === "salary" && (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-[260px] flex-shrink-0 border-r border-border/50 p-5 overflow-y-auto space-y-4">
                            <div><label className="text-xs text-muted-foreground font-medium block mb-1">Your Role</label>
                                <select className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground">
                                    {["Frontend Developer", "Software Engineer", "Product Manager", "Data Scientist", "UX Designer"].map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div><label className="text-xs text-muted-foreground font-medium block mb-1">Experience Level</label>
                                <select className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground">
                                    {["Graduate / Entry Level", "1–3 years", "3–5 years", "5+ years"].map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div><label className="text-xs text-muted-foreground font-medium block mb-1">Their Offer (£)</label><Input placeholder="e.g. 55000" className="h-9 text-sm" /></div>
                            <div><label className="text-xs text-muted-foreground font-medium block mb-1">Your Target (£)</label><Input placeholder="e.g. 65000" className="h-9 text-sm" /></div>
                            <Button className="w-full" onClick={startNegotiation} disabled={salaryRunning}><Play className="h-4 w-4 mr-1" /> Start Simulation</Button>
                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed"><strong className="text-primary">💡 Key principle:</strong> Never give a number first. Always anchor high and justify with market data.</div>
                            <div className="space-y-2 pt-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tactics</div>
                                {[{ n: "The Anchor", c: "text-primary", t: "State your target first, higher than your minimum." }, { n: "The Silence", c: "text-emerald-400", t: "After naming your number, stop talking." }, { n: "The Flinch", c: "text-yellow-400", t: "Show mild disappointment at their offer." }, { n: "Total Package", c: "text-teal-400", t: "Negotiate equity, remote days, title — not just salary." }].map(tac => (
                                    <div key={tac.n} className="bg-muted/20 border border-border/50 rounded-xl p-3">
                                        <div className={`text-xs font-semibold mb-1 ${tac.c}`}>{tac.n}</div>
                                        <div className="text-[10px] text-muted-foreground">{tac.t}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {salaryChat.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 px-8">
                                        <span className="text-5xl">💰</span>
                                        <h2 className="text-lg font-bold">Salary Negotiation Simulator</h2>
                                        <p className="text-sm text-muted-foreground max-w-sm">Fill in the details on the left and start the simulation. Practice real negotiation scenarios with an AI hiring manager.</p>
                                    </div>
                                ) : salaryChat.map((b, i) => (
                                    <div key={i} className={`max-w-[80%] animate-in ${b.role === "user" ? "ml-auto" : ""}`}>
                                        <div className={`rounded-2xl p-4 ${b.role === "user" ? "bg-muted/30 border border-border/50 rounded-br-sm" : "bg-orange-500/10 border border-orange-500/20 rounded-bl-sm"}`}>
                                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: b.role === "user" ? "var(--muted-foreground)" : "#f4924a" }}>{b.role === "user" ? "You" : "Hiring Manager"}</div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {salaryRunning && (
                                <div className="px-5 py-3 border-t border-border/30 flex-shrink-0">
                                    <textarea value={salaryAnswer} onChange={e => setSalaryAnswer(e.target.value)} placeholder="Type your response to the hiring manager..."
                                        className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground resize-none min-h-[60px] focus:border-primary outline-none" rows={2} />
                                    <div className="flex justify-end mt-2"><Button size="sm" onClick={submitSalaryResponse}>Send →</Button></div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            {/* ══ TAB: MOCK INTERVIEW ══════════════════════════*/}
            {activeTab === "mock" && (
                <div className="flex flex-1 overflow-hidden">

                    {/* ── SETUP PHASE ─────────────────────────────── */}
                    {mockPhase === "setup" && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                            <div className="text-center">
                                <div className="text-6xl mb-3">🎤</div>
                                <h2 className="text-2xl font-bold mb-1">Mock Interview</h2>
                                <p className="text-sm text-muted-foreground max-w-md">Powered by GPT-4o. Practice a real interview with an AI hiring manager — get scored feedback on clarity, relevance, and structure.</p>
                            </div>
                            <div className="w-full max-w-md grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium block mb-1.5">Your Role</label>
                                    <select value={mockRole} onChange={e => setMockRole(e.target.value)} className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground">
                                        {["Software Engineer", "Product Manager", "Data Scientist", "Frontend Developer", "Backend Developer", "UX Designer", "DevOps Engineer"].map(r => <option key={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium block mb-1.5">Question Category</label>
                                    <select value={mockCategory} onChange={e => setMockCategory(e.target.value)} className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground">
                                        <option value="behavioural">🧠 Behavioural</option>
                                        <option value="technical">⚙️ Technical</option>
                                        <option value="situational">💭 Situational</option>
                                        <option value="hr">👤 HR / Culture</option>
                                        <option value="all">🎲 Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-medium block mb-1.5">Difficulty</label>
                                    <select value={mockDifficulty} onChange={e => setMockDifficulty(e.target.value)} className="w-full text-sm bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-foreground">
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button className="w-full" onClick={startMockInterview}>
                                        <Mic className="h-4 w-4 mr-2" /> Start Interview
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-6 text-center text-xs text-muted-foreground">
                                <div><div className="text-lg font-bold text-primary">GPT-4o</div>AI Model</div>
                                <div><div className="text-lg font-bold text-emerald-400">3</div>Score Metrics</div>
                                <div><div className="text-lg font-bold text-yellow-400">∞</div>Attempts</div>
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVE PHASE ────────────────────────────── */}
                    {mockPhase === "active" && (
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Top bar */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Interview</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-sm font-mono text-yellow-400">
                                        <Clock className="h-3.5 w-3.5" /> {fmtTimer(mockTimer)}
                                    </div>
                                    <Button size="sm" variant="outline" onClick={endAndGetFeedback} disabled={mockLoading || mockMessages.length < 2}>
                                        <Trophy className="h-3.5 w-3.5 mr-1" /> End & Get Feedback
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={resetMock}><RotateCcw className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>

                            {/* Question banner */}
                            <div className="px-5 py-2 bg-primary/5 border-b border-primary/10 flex-shrink-0">
                                <p className="text-xs text-muted-foreground"><span className="text-primary font-semibold">Question: </span>{mockQuestion}</p>
                            </div>

                            {/* Chat */}
                            <div ref={mockChatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                {mockMessages.length === 0 && (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex gap-1.5"><span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"0ms"}} /><span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"150ms"}} /><span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"300ms"}} /></div>
                                    </div>
                                )}
                                {mockMessages.map((m, i) => (
                                    <div key={i} className={`flex gap-3 animate-in ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${m.role === "ai" ? "bg-primary/10 text-primary" : "bg-muted/30"}`}>
                                            {m.role === "ai" ? "🤖" : "👤"}
                                        </div>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.role === "ai" ? "bg-primary/5 border border-primary/10 rounded-tl-sm" : "bg-muted/30 border border-border/50 rounded-tr-sm"}`}>
                                            <p className="text-xs font-semibold mb-1 text-muted-foreground">{m.role === "ai" ? "Interviewer" : "You"}</p>
                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {mockLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <div className="flex gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"0ms"}} /><span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"150ms"}} /><span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"300ms"}} /></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="px-5 py-3 border-t border-border/30 flex-shrink-0">
                                <div className="flex gap-2">
                                    <textarea
                                        value={mockInput}
                                        onChange={e => setMockInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMockAnswer(); } }}
                                        placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                                        disabled={mockLoading}
                                        className="flex-1 bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground resize-none min-h-[56px] focus:border-primary outline-none disabled:opacity-50"
                                        rows={2}
                                    />
                                    <Button onClick={sendMockAnswer} disabled={mockLoading || !mockInput.trim()} className="self-end">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-center">After 2 exchanges the AI will offer feedback · or click "End & Get Feedback" anytime</p>
                            </div>
                        </div>
                    )}

                    {/* ── FEEDBACK PHASE ───────────────────────────── */}
                    {mockPhase === "feedback" && mockFeedback && (
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="text-center">
                                <div className="text-5xl mb-2">🏆</div>
                                <h2 className="text-2xl font-bold mb-1">Interview Feedback</h2>
                                <p className="text-sm text-muted-foreground">Assessed by GPT-4o</p>
                            </div>

                            {/* Score rings */}
                            <div className="flex justify-center gap-8">
                                {scoreRing(mockFeedback.clarity, "Clarity", mockFeedback.clarity >= 80 ? "border-emerald-400 text-emerald-400" : mockFeedback.clarity >= 65 ? "border-yellow-400 text-yellow-400" : "border-red-400 text-red-400")}
                                {scoreRing(mockFeedback.relevance, "Relevance", mockFeedback.relevance >= 80 ? "border-emerald-400 text-emerald-400" : mockFeedback.relevance >= 65 ? "border-yellow-400 text-yellow-400" : "border-red-400 text-red-400")}
                                {scoreRing(mockFeedback.structure, "Structure", mockFeedback.structure >= 80 ? "border-emerald-400 text-emerald-400" : mockFeedback.structure >= 65 ? "border-yellow-400 text-yellow-400" : "border-red-400 text-red-400")}
                            </div>

                            {/* Overall score */}
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${scoreColor(Math.round((mockFeedback.clarity + mockFeedback.relevance + mockFeedback.structure) / 3))}`}>
                                    {Math.round((mockFeedback.clarity + mockFeedback.relevance + mockFeedback.structure) / 3)}
                                    <span className="text-lg text-muted-foreground">/100 overall</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Duration: {fmtTimer(mockTimer)}</p>
                            </div>

                            {/* Feedback cards */}
                            <Card className="glass border-border/30">
                                <CardHeader className="pb-2"><CardTitle className="text-sm">💬 AI Interviewer's Feedback</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{mockFeedback.text}</p></CardContent>
                            </Card>

                            <Card className="glass border-emerald-500/20 bg-emerald-500/5">
                                <CardContent className="pt-4"><p className="text-sm text-emerald-400 leading-relaxed">✨ {mockFeedback.closing}</p></CardContent>
                            </Card>

                            {/* Question recap */}
                            <Card className="glass border-border/30">
                                <CardHeader className="pb-1"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Question Asked</CardTitle></CardHeader>
                                <CardContent><p className="text-sm text-muted-foreground">{mockQuestion}</p></CardContent>
                            </Card>

                            {/* Actions */}
                            <div className="flex gap-3 justify-center">
                                <Button onClick={resetMock}><RefreshCw className="h-4 w-4 mr-2" /> New Interview</Button>
                                <Button variant="outline" onClick={startMockInterview}><RotateCcw className="h-4 w-4 mr-2" /> Same Settings</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div >
    );
};

export default InterviewPrep;
