// frontend/src/components/portfolio/StepProjects.tsx
import { useState } from "react";
import type { Project, PortfolioState } from "@/hooks/usePortfolioState";
import { GITHUB_REPOS } from "@/hooks/usePortfolioState";
import { sendMessageToAI } from "@/lib/ai";

interface Props {
    state: PortfolioState;
    addProject: () => void;
    deleteProject: (id: number) => void;
    updateProject: (id: number, key: keyof Project, value: any) => void;
    importProjects: (repos: typeof GITHUB_REPOS, username: string) => void;
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "var(--text)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: "none",
    transition: "border-color .15s",
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: "var(--muted)", fontWeight: 500, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" };
const aiBtnStyle: React.CSSProperties = { fontSize: 11, color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(124,92,252,0.12)", border: "none", fontFamily: "'DM Sans', sans-serif", transition: "background .15s" };

const StepProjects = ({ state, addProject, deleteProject, updateProject, importProjects }: Props) => {
    const [showGithub, setShowGithub] = useState(false);
    const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());

    const toggleRepo = (i: number) => {
        setSelectedRepos(prev => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i); else next.add(i);
            return next;
        });
    };

    const handleImport = () => {
        const repos = Array.from(selectedRepos).map(i => GITHUB_REPOS[i]);
        importProjects(repos, state.github || "your-username");
        setShowGithub(false);
        setSelectedRepos(new Set());
    };

    const aiEnhanceProject = async (p: Project) => {
        try {
            const prompt = `Enhance this project description for a developer portfolio. Project: "${p.name}". Current description: "${p.desc}". Tech: ${p.tech.join(", ")}. Write a compelling 2-sentence description. Return ONLY the description text, no quotes.`;
            const result = await sendMessageToAI(prompt, { temperature: 0.7, max_tokens: 150 });
            if (result && !result.startsWith("⚠️")) {
                updateProject(p.id, "desc", result);
            }
        } catch {
            const enhanced = `${p.name} is a ${p.tech.slice(0, 2).join(" and ")} application that ${p.desc.toLowerCase().replace(/^a /, "").replace(/\.$/, "")}. Built with a focus on performance and user experience.`;
            updateProject(p.id, "desc", enhanced);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Projects</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>Your best work. Quality over quantity — 3–5 is ideal.</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setShowGithub(true)}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)", color: "var(--muted2)", fontFamily: "'DM Sans', sans-serif", transition: "all .18s" }}
                    >
                        ⬇ Import
                    </button>
                    <button
                        onClick={addProject}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)", color: "var(--muted2)", fontFamily: "'DM Sans', sans-serif", transition: "all .18s" }}
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* GitHub Import Section */}
            {showGithub && (
                <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>📦 GitHub Repos — <span style={{ color: "var(--muted)", fontWeight: 400 }}>{state.github || "your-username"}</span></div>
                        <button onClick={() => setShowGithub(false)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 100, padding: "4px 10px", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans'" }}>✕</button>
                    </div>
                    {GITHUB_REPOS.map((r, i) => (
                        <div
                            key={i}
                            onClick={() => toggleRepo(i)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: `1px solid ${selectedRepos.has(i) ? "rgba(124,92,252,.4)" : "var(--border)"}`,
                                background: selectedRepos.has(i) ? "rgba(124,92,252,0.12)" : "var(--surface3)",
                                marginBottom: 6,
                                cursor: "pointer",
                                transition: "all .15s",
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.name}</div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: "var(--surface2)", color: "var(--muted)" }}>{r.lang}</span>
                            <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3 }}>⭐ {r.stars}</span>
                        </div>
                    ))}
                    <button
                        onClick={handleImport}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "var(--accent)", color: "#fff", fontFamily: "'DM Sans'", marginTop: 8, boxShadow: "0 4px 14px rgba(124,92,252,0.25)" }}
                    >
                        Import Selected →
                    </button>
                </div>
            )}

            {/* Project Cards */}
            {state.projects.map(p => (
                <div key={p.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 10, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{p.emoji}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                            {p.featured && (
                                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 100, background: "rgba(245,200,66,0.13)", color: "var(--yellow)", border: "1px solid rgba(245,200,66,.2)" }}>★ Featured</span>
                            )}
                        </div>
                        <button
                            onClick={() => deleteProject(p.id)}
                            style={{ width: 24, height: 24, borderRadius: "50%", background: "none", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <div style={labelStyle}>Project Name</div>
                        <input style={inputStyle} value={p.name} onChange={e => updateProject(p.id, "name", e.target.value)} />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <div style={labelStyle}>
                            Description
                            <button style={aiBtnStyle} onClick={() => aiEnhanceProject(p)}>✦ AI Enhance</button>
                        </div>
                        <textarea
                            style={{ ...inputStyle, resize: "none", lineHeight: 1.6, minHeight: 60 }}
                            value={p.desc}
                            onChange={e => updateProject(p.id, "desc", e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <div style={labelStyle}>Impact / Result</div>
                        <input style={inputStyle} value={p.impact} onChange={e => updateProject(p.id, "impact", e.target.value)} placeholder="e.g. Used by 500+ users, Reduced load time by 40%..." />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                            <div style={labelStyle}>Live URL</div>
                            <input style={inputStyle} value={p.url} onChange={e => updateProject(p.id, "url", e.target.value)} placeholder="https://..." />
                        </div>
                        <div>
                            <div style={labelStyle}>GitHub</div>
                            <input style={inputStyle} value={p.github} onChange={e => updateProject(p.id, "github", e.target.value)} placeholder="https://github.com/..." />
                        </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <div style={labelStyle}>Tech Stack <span style={{ fontSize: 10, color: "var(--muted)" }}>(comma separated)</span></div>
                        <input
                            style={inputStyle}
                            value={p.tech.join(", ")}
                            onChange={e => updateProject(p.id, "tech", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                        />
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted2)", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={p.featured}
                            onChange={e => updateProject(p.id, "featured", e.target.checked)}
                            style={{ accentColor: "var(--accent)" }}
                        />
                        Featured project
                    </label>
                </div>
            ))}
        </div>
    );
};

export default StepProjects;
