import { useEffect, useRef, useState } from "react";
import { authApi, dashboardApi, DashboardSummary } from "@/lib/api";
import { Link } from "react-router-dom";
import { loadSavedRoadmaps } from "@/lib/roadmaps";
import { CardSkeleton, PremiumCard, SkeletonBlock } from "@/components/ui/premium-card";

// ── Helpers ─────────────────────────────────────────────────
function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

const ROADMAP_GRADIENTS = [
    "linear-gradient(90deg,var(--yellow),var(--orange))",
    "linear-gradient(90deg,var(--red),var(--orange))",
    "linear-gradient(90deg,var(--teal),var(--blue))",
];

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
    problem_solved: { icon: "</>" , color: "var(--accent)" },
    streak_milestone: { icon: "🔥", color: "var(--yellow)" },
    roadmap_completed: { icon: "✓", color: "var(--green)" },
    level_up: { icon: "⭐", color: "var(--blue)" },
};

// ── Dashboard Skeleton ────────────────────────────────────────
const DashboardSkeleton = () => (
    <>
        {/* Header skeleton */}
        <div className="fade-up" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <SkeletonBlock width="55%" height={24} radius={6} />
                <SkeletonBlock width="38%" height={14} radius={5} />
                <SkeletonBlock width={180} height={34} radius={100} style={{ marginTop: 4 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <SkeletonBlock width={130} height={38} radius={100} />
                <SkeletonBlock width={130} height={38} radius={100} />
                <SkeletonBlock width={38} height={38} radius={50} />
            </div>
        </div>

        {/* Stat cards skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} height={100} />)}
        </div>

        {/* XP bar skeleton */}
        <PremiumCard hover={false} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <SkeletonBlock width="30%" height={16} />
                <SkeletonBlock width="12%" height={16} />
            </div>
            <SkeletonBlock width="100%" height={8} radius={99} />
        </PremiumCard>

        {/* Two-col skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <CardSkeleton height={180} />
            <CardSkeleton height={180} />
        </div>
    </>
);

// ── Component ────────────────────────────────────────────────
const Dashboard = () => {
    const [username, setUsername] = useState("");
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("Overview");
    const xpFillRef = useRef<HTMLDivElement>(null);

    const savedRoadmaps = loadSavedRoadmaps().slice(0, 3);

    useEffect(() => {
        const load = async () => {
            try {
                const [user, sum] = await Promise.all([
                    authApi.getCurrentUser(),
                    dashboardApi.getSummary(),
                ]);
                setUsername(user.full_name || user.username);
                setSummary(sum);
            } catch (e: any) {
                setError(e.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
            return null;
        };
        load();
    }, []);

    // Animate XP bar after data loads
    useEffect(() => {
        if (!summary || !xpFillRef.current) return;
        const xpToNextLevel = 500;
        const pct = Math.min(((summary.xp % xpToNextLevel) / xpToNextLevel) * 100, 100);
        setTimeout(() => {
            if (xpFillRef.current) xpFillRef.current.style.width = `${pct}%`;
        }, 600);
    }, [summary]);

    if (loading) return <DashboardSkeleton />;

    if (error || !summary) {
        return (
            <PremiumCard style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 15, color: "var(--red)", fontWeight: 600 }}>{error || "Failed to load dashboard data"}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Try refreshing the page</div>
            </PremiumCard>
        );
    }

    const xpToNextLevel = 500;
    const xpInLevel = summary.xp % xpToNextLevel;
    const xpPct = Math.min((xpInLevel / xpToNextLevel) * 100, 100);
    const greeting = getGreeting();

    return (
        <>
            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }} className="fade-up">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, color: "var(--text)", wordBreak: "break-word" }}>
                        {greeting}, <span style={{ color: "var(--accent)" }}>{username}</span> 👋
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                        Ready to continue your learning journey?
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <div style={{
                            display: "inline-flex", background: "var(--surface2)",
                            borderRadius: 100, padding: 4, gap: 2, border: "1px solid var(--border)",
                        }}>
                            {["Overview", "Activity", "Goals"].map((tab) => (
                                <div key={tab} onClick={() => setActiveTab(tab)} style={{
                                    padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.18s",
                                    background: activeTab === tab ? "var(--surface)" : "transparent",
                                    color: activeTab === tab ? "var(--text)" : "var(--muted)",
                                    boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
                                }}>{tab}</div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
                    <Link to="/roadmaps" className="dash-desktop-only" style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                        background: "var(--surface)", color: "var(--muted)",
                        border: "1px solid var(--border2)", boxShadow: "var(--shadow-sm)",
                        textDecoration: "none", transition: "all 0.18s",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border2)"; }}
                    >🗺 Browse Roadmaps</Link>

                    <Link to="/practice" className="dash-desktop-only" style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                        background: "var(--accent)", color: "#fff",
                        boxShadow: "0 4px 14px var(--accent-glow)",
                        textDecoration: "none", transition: "all 0.18s",
                    }}>&lt;/&gt; Start Practice</Link>

                    <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "var(--surface)", border: "1px solid var(--border2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: 16, position: "relative",
                        boxShadow: "var(--shadow-sm)", flexShrink: 0,
                    }}>
                        🔔
                        <div style={{
                            position: "absolute", top: 7, right: 7,
                            width: 7, height: 7, background: "var(--red)", borderRadius: "50%",
                            border: "2px solid var(--notif-border)",
                        }} />
                    </div>
                </div>
            </div>

            {/* Mobile quick-action */}
            <div className="dash-mobile-only" style={{ display: "flex", gap: 10 }}>
                <Link to="/roadmaps" style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                    background: "var(--surface)", color: "var(--muted)",
                    border: "1px solid var(--border2)", boxShadow: "var(--shadow-sm)",
                    textDecoration: "none",
                }}>🗺 Roadmaps</Link>
                <Link to="/practice" style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                    background: "var(--accent)", color: "#fff",
                    boxShadow: "0 4px 14px var(--accent-glow)",
                    textDecoration: "none",
                }}>&lt;/&gt; Practice</Link>
            </div>

            {/* ── STAT CARDS ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                {[
                    { label: "Current Streak", icon: "🔥", iconBg: "rgba(224,75,55,0.10)", value: summary.streak || "—", sub: "days in a row", color: "var(--red)" },
                    { label: "Total XP", icon: "🏆", iconBg: "var(--yellow-soft)", value: summary.xp.toLocaleString(), sub: `Level ${summary.level}`, color: "var(--yellow)" },
                    { label: "Problems Solved", icon: "✦", iconBg: "var(--accent-soft)", value: summary.problems_solved, sub: "total", color: "var(--accent)" },
                    { label: "Roadmaps Done", icon: "◎", iconBg: "rgba(45,184,112,0.10)", value: summary.completed_roadmaps, sub: "completed", color: "var(--green)" },
                ].map((c, i) => (
                    <PremiumCard key={i} className={`fade-up-${i + 1}`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{c.label}</span>
                            <div style={{ width: 30, height: 30, borderRadius: 10, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{c.icon}</div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", lineHeight: 1, color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.sub}</div>
                    </PremiumCard>
                ))}
            </div>

            {/* ── XP PROGRESS BAR ── */}
            <PremiumCard hover={false} className="fade-up-5">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                        Level Progress
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", border: "1px solid var(--border)" }}>LVL {summary.level}</span>
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, color: "var(--muted)" }}>
                    <span>{xpInLevel} / {xpToNextLevel} XP</span>
                    <span style={{ color: "var(--accent)", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>{Math.round(xpPct)}%</span>
                </div>
                <div style={{ height: 8, background: "var(--surface2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <div
                        ref={xpFillRef}
                        style={{
                            height: "100%", width: "0%", borderRadius: 99,
                            background: "linear-gradient(90deg, var(--accent), var(--blue), var(--accent))",
                            backgroundSize: "200% 100%",
                            animation: "xp-shimmer 2.5s ease-in-out infinite, skeleton-shimmer 0s",
                            transition: "width 1.1s cubic-bezier(0.22,1,0.36,1)",
                        }}
                    />
                </div>
            </PremiumCard>

            {/* ── TWO COLUMN ── */}
            <div className="fade-up-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>

                {/* Continue Learning */}
                <PremiumCard hover={false}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Continue Learning</div>
                        <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", border: "1px solid var(--border)" }}>
                            {savedRoadmaps.length} active
                        </span>
                    </div>

                    {savedRoadmaps.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                            No roadmaps yet.{" "}
                            <Link to="/roadmaps" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Browse roadmaps →</Link>
                        </div>
                    ) : (
                        savedRoadmaps.map((r, i) => {
                            const grad = ROADMAP_GRADIENTS[i % ROADMAP_GRADIENTS.length];
                            const totalDays = r.roadmapJson?.phases?.flatMap((p: any) => p.weeks?.flatMap((w: any) => w.days || []) || []).length || 0;
                            const completedDays = r.roadmapJson?.phases?.flatMap((p: any) => p.weeks?.flatMap((w: any) => (w.days || []).filter((d: any) => d.completed)) || []).length || 0;
                            const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
                            const diff = r.level === "advanced" ? "hard" : r.level === "beginner" ? "easy" : "medium";
                            const diffStyle = diff === "hard"
                                ? { background: "rgba(224,75,55,0.10)", color: "var(--red)" }
                                : diff === "easy"
                                    ? { background: "rgba(45,184,112,0.10)", color: "var(--green)" }
                                    : { background: "var(--yellow-soft)", color: "var(--yellow)" };

                            return (
                                <div key={i} style={{
                                    display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 14,
                                    background: "var(--surface2)", marginBottom: 10, cursor: "pointer",
                                    transition: "all 0.18s", border: "1px solid var(--border)",
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.title}</span>
                                        <span style={{ ...diffStyle, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{diff}</span>
                                    </div>
                                    <div style={{ height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: grad, borderRadius: 99, transition: "width 0.8s ease" }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{pct}% complete</div>
                                </div>
                            );
                        })
                    )}
                </PremiumCard>

                {/* Recent Activity */}
                <PremiumCard hover={false}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Recent Activity</div>

                    {summary.recent_activity.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 13 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
                            No activity yet.{" "}
                            <Link to="/practice" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Start solving problems →</Link>
                        </div>
                    ) : (
                        summary.recent_activity.map((a) => {
                            const s = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.problem_solved;
                            return (
                                <div key={a.id} style={{
                                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                                    borderRadius: 14, background: "var(--surface2)", marginBottom: 10,
                                    border: "1px solid var(--border)",
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: "50%", background: "var(--accent-soft)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, fontSize: 14, color: s.color,
                                    }}>{s.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{a.title}</div>
                                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>{relativeTime(a.timestamp)}</div>
                                    </div>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                                </div>
                            );
                        })
                    )}
                </PremiumCard>
            </div>

            {/* ── AI TUTOR BANNER ── */}
            <PremiumCard hover={false} className="fade-up-7" style={{
                padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "linear-gradient(135deg, var(--surface) 0%, rgba(124,92,252,0.06) 100%)",
                borderColor: "rgba(124,92,252,0.2)",
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Need help with a concept? ✦</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Ask the AI Tutor for explanations, debugging help, or learning strategies.</div>
                </div>
                <button style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                    background: "var(--accent)", color: "#fff",
                    boxShadow: "0 4px 16px var(--accent-glow)",
                    border: "none", cursor: "pointer", transition: "all 0.18s",
                    fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                }}>💬 Ask AI Tutor</button>
            </PremiumCard>

            <style>{`
                @keyframes xp-shimmer {
                    0% { background-position: 0% center; }
                    50% { background-position: 200% center; }
                    100% { background-position: 0% center; }
                }
                @media (min-width: 640px) { .dash-mobile-only { display: none !important; } }
                @media (max-width: 639px) { .dash-desktop-only { display: none !important; } }
            `}</style>
        </>
    );
};

export default Dashboard;
