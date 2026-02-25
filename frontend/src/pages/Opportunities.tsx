import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw, ExternalLink, Star, MapPin, Briefcase, Clock } from "lucide-react";
import { opportunitiesApi } from "@/lib/api";
import type { JobListing } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ── Constants ────────────────────────────────────────────────
type FilterKey = "all" | "job" | "internship" | "apprenticeship" | "remote" | "india" | "tech" | "finance" | "design";

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
    { key: "all", label: "All", emoji: "✦" },
    { key: "job", label: "Jobs", emoji: "💼" },
    { key: "internship", label: "Internships", emoji: "🎓" },
    { key: "apprenticeship", label: "Apprenticeships", emoji: "🔨" },
    { key: "remote", label: "Remote", emoji: "🌍" },
    { key: "india", label: "India", emoji: "🇮🇳" },
    { key: "tech", label: "Tech", emoji: "⚡" },
    { key: "finance", label: "Finance", emoji: "💰" },
    { key: "design", label: "Design", emoji: "🎨" },
];

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
    job: { bg: "bg-blue-500/10", text: "text-blue-400" },
    internship: { bg: "bg-purple-500/10", text: "text-purple-400" },
    apprenticeship: { bg: "bg-orange-500/10", text: "text-orange-400" },
};

const STATUS_LABELS: Record<string, string> = {
    saved: "⭐ Saved", applied: "📤 Applied", interview: "📞 Interview",
    assessment: "📋 Assessment", offer: "🎉 Offer", rejected: "✕ Rejected",
};

interface TrackerApp {
    id: string;
    title: string;
    company: string;
    emoji: string;
    status: string;
    source: string;
    date: string;
    color: string;
}

// ── Component ────────────────────────────────────────────────
const Opportunities = () => {
    const { toast } = useToast();

    // Jobs state
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
    const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
    const [stats, setStats] = useState({ total: 0, platforms: 0 });
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tracker state
    const [activeTab, setActiveTab] = useState<"jobs" | "tracker">("jobs");
    const [trackerView, setTrackerView] = useState<"kanban" | "list">("kanban");
    const [trackerApps, setTrackerApps] = useState<TrackerApp[]>(() => {
        const saved = localStorage.getItem("eduai_tracker");
        return saved ? JSON.parse(saved) : [];
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: "", company: "", source: "", emoji: "", status: "saved" });

    // Persist tracker
    useEffect(() => {
        localStorage.setItem("eduai_tracker", JSON.stringify(trackerApps));
    }, [trackerApps]);

    // ── Fetch jobs ─────────────────────────────────────────────
    const fetchJobs = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) setRefreshing(true); else setLoading(true);

            const params: Record<string, any> = { limit: 200 };
            if (searchQuery.trim()) params.q = searchQuery.trim();
            if (activeFilter === "remote") params.remote = true;
            else if (activeFilter === "india") params.region = "india";
            else if (["tech", "finance", "design"].includes(activeFilter)) params.field = activeFilter;
            else if (["job", "internship", "apprenticeship"].includes(activeFilter)) params.type = activeFilter;

            const data = forceRefresh
                ? await opportunitiesApi.refresh(searchQuery || "software")
                : await opportunitiesApi.getJobs(params);

            setJobs(data.jobs);
            setStats({ total: data.total, platforms: data.platforms });
        } catch (err: any) {
            toast({ title: "Error loading jobs", description: err?.message || "Backend unreachable", variant: "destructive" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, activeFilter, toast]);

    // Initial load
    useEffect(() => { fetchJobs(); }, []);

    // Debounced search + filter
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchJobs(), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, activeFilter]);

    // ── Tracker helpers ────────────────────────────────────────
    const isTracked = (id: string) => trackerApps.some(a => a.id === id);

    const toggleTrack = (job: JobListing) => {
        if (isTracked(job.id)) {
            setTrackerApps(prev => prev.filter(a => a.id !== job.id));
        } else {
            setTrackerApps(prev => [...prev, {
                id: job.id, title: job.title, company: job.company, emoji: job.emoji,
                status: "saved", source: job.platform, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                color: job.color,
            }]);
        }
    };

    const updateStatus = (id: string, status: string) => {
        setTrackerApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const deleteApp = (id: string) => {
        setTrackerApps(prev => prev.filter(a => a.id !== id));
    };

    const addManualApp = () => {
        if (!modalData.title || !modalData.company) {
            toast({ title: "Missing info", description: "Please enter title and company.", variant: "destructive" });
            return;
        }
        setTrackerApps(prev => [...prev, {
            id: `manual-${Date.now()}`, title: modalData.title, company: modalData.company,
            emoji: modalData.emoji || "🏢", status: modalData.status, source: modalData.source || "Manual",
            date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
            color: "#7c5cfc",
        }]);
        setModalOpen(false);
        setModalData({ title: "", company: "", source: "", emoji: "", status: "saved" });
    };

    // ── Render helpers ─────────────────────────────────────────
    const typeStyle = (t: string) => TYPE_STYLES[t] || TYPE_STYLES.job;
    const typeLabel = (t: string) => t === "job" ? "💼 Job" : t === "internship" ? "🎓 Internship" : "🔨 Apprenticeship";

    // ══════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════
    return (
        <div className="space-y-0 h-full flex flex-col overflow-hidden animate-in">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        Opportunities <span className="text-muted-foreground opacity-60">◈</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Jobs, internships & apprenticeships — all in one place</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setModalOpen(true); }}>
                        + Track Application
                    </Button>
                    <Button size="sm" onClick={() => fetchJobs(true)} disabled={refreshing}>
                        {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                        Refresh Feed
                    </Button>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────── */}
            <div className="flex border-b border-border/50 px-6 flex-shrink-0">
                {(["jobs", "tracker"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab === "jobs" ? `Browse Jobs (${stats.total})` : `Tracker (${trackerApps.length})`}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* JOBS TAB                                              */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === "jobs" && (
                <div className="flex flex-1 overflow-hidden">

                    {/* LEFT: Job list */}
                    <div className="flex-1 flex flex-col border-r border-border/50 min-w-0">

                        {/* Search + Filters */}
                        <div className="px-4 pt-4 pb-2 flex-shrink-0 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search roles, companies..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setActiveFilter(f.key)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${activeFilter === f.key
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        {f.emoji} {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-3 px-4 py-2 border-y border-border/30 text-xs text-muted-foreground flex-shrink-0">
                            <span><strong className="text-foreground">{stats.total}</strong> results</span>
                            <span>◎ <strong className="text-foreground">{stats.platforms}</strong> platforms</span>
                        </div>

                        {/* Job cards */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="glass rounded-xl p-4 animate-pulse space-y-2">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-muted/30" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3.5 bg-muted/30 rounded w-3/4" />
                                                <div className="h-2.5 bg-muted/30 rounded w-1/2" />
                                            </div>
                                        </div>
                                        <div className="h-6 bg-muted/30 rounded-full w-1/3" />
                                    </div>
                                ))
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground text-sm">
                                    No jobs found. Try adjusting your search or filters.
                                </div>
                            ) : (
                                jobs.map((job, i) => (
                                    <div
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`glass rounded-xl p-3.5 cursor-pointer transition-all hover:border-primary/30 group ${selectedJob?.id === job.id ? "border-primary/50 ring-1 ring-primary/20" : ""
                                            }`}
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        {/* Top: logo + meta */}
                                        <div className="flex gap-3 items-start">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                                style={{ background: `${job.color}18`, color: job.color }}
                                            >
                                                {job.emoji}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-sm truncate">{job.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">
                                                    {job.company} · {job.location}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex gap-1.5 mt-2 flex-wrap">
                                            <Badge variant="secondary" className={`${typeStyle(job.type).bg} ${typeStyle(job.type).text} text-[10px] px-2 py-0 border-0`}>
                                                {typeLabel(job.type)}
                                            </Badge>
                                            {job.remote && (
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0 border-0">
                                                    🌍 Remote
                                                </Badge>
                                            )}
                                            {job.region === "india" && (
                                                <Badge variant="secondary" className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0 border-0">
                                                    🇮🇳 India
                                                </Badge>
                                            )}
                                            {job.tags.slice(0, 2).map(t => (
                                                <Badge key={t} variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Bottom row */}
                                        <div className="flex items-center justify-between mt-2.5">
                                            <div className="flex gap-3 text-[10px] text-muted-foreground">
                                                {job.salary && <span>💰 {job.salary}</span>}
                                                <span>🕐 {job.posted}</span>
                                                <span>◎ {job.platform}</span>
                                            </div>
                                            <button
                                                onClick={e => { e.stopPropagation(); toggleTrack(job); }}
                                                className={`text-sm transition-transform hover:scale-110 ${isTracked(job.id) ? "opacity-100" : "opacity-30 group-hover:opacity-60"}`}
                                            >
                                                ⭐
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Job detail */}
                    <div className="w-[420px] flex-shrink-0 overflow-y-auto hidden lg:block">
                        {selectedJob ? (
                            <div className="p-5 space-y-5 animate-in">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="flex gap-3 items-start">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                            style={{ background: `${selectedJob.color}18`, color: selectedJob.color }}
                                        >
                                            {selectedJob.emoji}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg leading-tight">{selectedJob.title}</h2>
                                            <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                                            <span className="text-xs text-muted-foreground">◎ {selectedJob.platform}</span>
                                        </div>
                                    </div>

                                    {/* Chips */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            <MapPin className="h-3 w-3 mr-1" /> {selectedJob.location}
                                        </Badge>
                                        {selectedJob.salary && (
                                            <Badge variant="outline" className="text-xs">💰 {selectedJob.salary}</Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">{typeLabel(selectedJob.type)}</Badge>
                                        {selectedJob.remote && (
                                            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">🌍 Remote</Badge>
                                        )}
                                        {selectedJob.region === "india" && (
                                            <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">🇮🇳 India</Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            <Clock className="h-3 w-3 mr-1" /> {selectedJob.posted}
                                        </Badge>
                                    </div>

                                    {/* Tag pills */}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {selectedJob.tags.map(t => (
                                            <span key={t} className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted/50 border border-border/50 text-muted-foreground">
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    {/* CTAs */}
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => window.open(selectedJob.platform_url, "_blank")}>
                                            <ExternalLink className="h-4 w-4 mr-1" /> Apply on {selectedJob.platform}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => { toggleTrack(selectedJob); setActiveTab("tracker"); }}>
                                            <Star className="h-4 w-4 mr-1" /> {isTracked(selectedJob.id) ? "Untrack" : "Track"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Description */}
                                <Card className="glass border-border/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">About the role</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedJob.description || "No description available."}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="glass border-border/30">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Source</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            This listing was aggregated from <strong>{selectedJob.platform}</strong>.
                                            Click "Apply" to go directly to the original listing.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-3 px-8">
                                <Briefcase className="h-12 w-12 opacity-20" />
                                <p className="text-center">Select a job to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* TRACKER TAB                                           */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === "tracker" && (
                <div className="flex-1 overflow-hidden flex flex-col">

                    {/* Tracker header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 flex-shrink-0">
                        <div className="flex gap-3 text-xs">
                            {Object.entries(STATUS_LABELS).map(([key, label]) => {
                                const count = trackerApps.filter(a => a.status === key).length;
                                return (
                                    <span key={key} className="text-muted-foreground">
                                        {label.split(" ")[0]} <strong className="text-foreground">{count}</strong>
                                    </span>
                                );
                            })}
                        </div>
                        <div className="flex gap-1">
                            {(["kanban", "list"] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setTrackerView(v)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${trackerView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kanban view */}
                    {trackerView === "kanban" ? (
                        <div className="flex-1 overflow-x-auto px-4 py-3">
                            <div className="flex gap-4 min-w-max h-full">
                                {Object.entries(STATUS_LABELS).map(([status, label]) => {
                                    const apps = trackerApps.filter(a => a.status === status);
                                    return (
                                        <div key={status} className="w-60 flex-shrink-0 flex flex-col">
                                            <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground">
                                                {label} <span className="ml-auto text-[10px]">{apps.length}</span>
                                            </div>
                                            <div className="flex-1 space-y-2 overflow-y-auto">
                                                {apps.map(a => (
                                                    <div key={a.id} className="glass rounded-xl p-3 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{a.emoji}</span>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-semibold truncate">{a.title}</div>
                                                                <div className="text-[10px] text-muted-foreground truncate">{a.company}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                            <span>{a.date}</span>
                                                            <button onClick={() => deleteApp(a.id)} className="opacity-40 hover:opacity-100 transition-opacity text-destructive">✕</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* List view */
                        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
                            {trackerApps.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground text-sm">
                                    No applications tracked yet. Add a job from the browse tab or click + Add.
                                </div>
                            ) : trackerApps.map(a => (
                                <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-3">
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                        style={{ background: `${a.color}18`, color: a.color }}
                                    >
                                        {a.emoji}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold truncate">{a.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{a.company} · {a.source}</div>
                                    </div>
                                    <select
                                        value={a.status}
                                        onChange={e => updateStatus(a.id, e.target.value)}
                                        className="text-xs bg-muted/30 border border-border/50 rounded-md px-2 py-1 text-foreground"
                                    >
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                    <span className="text-xs text-muted-foreground w-20 text-right">{a.date}</span>
                                    <button onClick={() => deleteApp(a.id)} className="text-muted-foreground hover:text-destructive transition-colors text-sm">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ADD APPLICATION MODAL                                 */}
            {/* ══════════════════════════════════════════════════════ */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
                    <div className="glass rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg">Track an Application</h3>
                        <Input placeholder="Job Title *" value={modalData.title} onChange={e => setModalData(d => ({ ...d, title: e.target.value }))} />
                        <Input placeholder="Company *" value={modalData.company} onChange={e => setModalData(d => ({ ...d, company: e.target.value }))} />
                        <Input placeholder="Source (e.g. LinkedIn)" value={modalData.source} onChange={e => setModalData(d => ({ ...d, source: e.target.value }))} />
                        <Input placeholder="Emoji (optional)" value={modalData.emoji} onChange={e => setModalData(d => ({ ...d, emoji: e.target.value }))} />
                        <select
                            value={modalData.status}
                            onChange={e => setModalData(d => ({ ...d, status: e.target.value }))}
                            className="w-full text-sm bg-muted/30 border border-border/50 rounded-md px-3 py-2 text-foreground"
                        >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={addManualApp}>Add Application</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Opportunities;
