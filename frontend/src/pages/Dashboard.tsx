import { useEffect, useRef, useState } from "react";
import { authApi, dashboardApi, DashboardSummary } from "@/lib/api";
import { Link } from "react-router-dom";
import { loadSavedRoadmaps } from "@/lib/roadmaps";

// ── Helpers ─────────────────────────────────────────────────
function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ROADMAP_GRADIENTS = [
  "linear-gradient(90deg,var(--yellow),var(--orange))",
  "linear-gradient(90deg,var(--red),var(--orange))",
  "linear-gradient(90deg,var(--teal),var(--blue))",
];

const ACTIVITY_ICONS: Record<string, { icon: string; color: string }> = {
  problem_solved: { icon: "</>", color: "var(--accent)" },
  streak_milestone: { icon: "🔥", color: "var(--yellow)" },
  roadmap_completed: { icon: "✓", color: "var(--green)" },
  level_up: { icon: "⭐", color: "var(--blue)" },
};

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "var(--shadow-sm)",
  transition: "background 0.25s ease",
};

// ── Component ────────────────────────────────────────────────
const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const xpFillRef = useRef<HTMLDivElement>(null);

  // Load saved roadmaps from localStorage
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

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
        Loading dashboard…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div style={{ padding: 40, color: "var(--red)", fontSize: 14 }}>
        ⚠ {error || "Failed to load dashboard data"}
      </div>
    );
  }

  const xpToNextLevel = 500;
  const xpInLevel = summary.xp % xpToNextLevel;
  const xpPct = Math.min((xpInLevel / xpToNextLevel) * 100, 100);

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }} className="fade-up">
        <div>
          <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, color: "var(--text)" }}>
            Welcome back, <span style={{ color: "var(--accent)" }}>{username}</span> 👋
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
                  padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.18s",
                  background: activeTab === tab ? "var(--surface)" : "transparent",
                  color: activeTab === tab ? "var(--text)" : "var(--muted)",
                  boxShadow: activeTab === tab ? "var(--shadow-sm)" : "none",
                }}>{tab}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/roadmaps" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
            background: "var(--surface)", color: "var(--muted)",
            border: "1px solid var(--border2)", boxShadow: "var(--shadow-sm)",
            textDecoration: "none", transition: "all 0.18s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
          >🗺 Browse Roadmaps</Link>

          <Link to="/practice" style={{
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
            boxShadow: "var(--shadow-sm)",
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

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Current Streak", icon: "🔥", iconBg: "rgba(224,75,55,0.10)", value: summary.streak || "—", sub: "days in a row", color: "var(--red)" },
          { label: "Total XP", icon: "🏆", iconBg: "var(--yellow-soft)", value: summary.xp.toLocaleString(), sub: `Level ${summary.level}`, color: "var(--yellow)" },
          { label: "Problems Solved", icon: "✦", iconBg: "var(--accent-soft)", value: summary.problems_solved, sub: "total", color: "var(--accent)" },
          { label: "Roadmaps Done", icon: "◎", iconBg: "rgba(45,184,112,0.10)", value: summary.completed_roadmaps, sub: "completed", color: "var(--green)" },
        ].map((c, i) => (
          <div key={i} className={`fade-up-${i + 1}`}
            style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{c.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, fontFamily: "'Space Mono', monospace", lineHeight: 1, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── XP PROGRESS BAR ── */}
      <div className="fade-up-5" style={{ ...card }}>
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
        <div style={{ height: 6, background: "var(--surface2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--border)" }}>
          <div ref={xpFillRef} style={{ height: "100%", width: "0%", background: "linear-gradient(90deg,var(--accent),var(--blue))", borderRadius: 99, transition: "width 1s cubic-bezier(0.22,1,0.36,1)" }} />
        </div>
      </div>

      {/* ── TWO COLUMN ── */}
      <div className="fade-up-6" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Continue Learning */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Continue Learning</div>
            <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "var(--surface2)", color: "var(--muted)", fontFamily: "'Space Mono', monospace", border: "1px solid var(--border)" }}>
              {savedRoadmaps.length} active
            </span>
          </div>

          {savedRoadmaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>
              No roadmaps yet.{" "}
              <Link to="/roadmaps" style={{ color: "var(--accent)", textDecoration: "none" }}>Browse roadmaps →</Link>
            </div>
          ) : (
            savedRoadmaps.map((r, i) => {
              const grad = ROADMAP_GRADIENTS[i % ROADMAP_GRADIENTS.length];
              const totalDays = r.phases?.flatMap((p: any) => p.weeks?.flatMap((w: any) => w.days || []) || []).length || 0;
              const completedDays = r.phases?.flatMap((p: any) => p.weeks?.flatMap((w: any) => (w.days || []).filter((d: any) => d.completed)) || []).length || 0;
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
                  <div style={{ height: 4, background: "var(--bg, #f2f2f0)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: grad, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Recent Activity</div>

          {summary.recent_activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>
              No activity yet.{" "}
              <Link to="/practice" style={{ color: "var(--accent)", textDecoration: "none" }}>Start solving problems →</Link>
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
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{relativeTime(a.timestamp)}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── AI TUTOR BANNER ── */}
      <div className="fade-up-7" style={{ ...card, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Need help with a concept? ✦</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Ask the AI Tutor for explanations, debugging help, or learning strategies.</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
          background: "var(--accent)", color: "#fff",
          boxShadow: "0 4px 14px var(--accent-glow)",
          border: "none", cursor: "pointer", transition: "all 0.18s",
          fontFamily: "'DM Sans', sans-serif",
        }}>💬 Ask AI Tutor</button>
      </div>
    </>
  );
};

export default Dashboard;
