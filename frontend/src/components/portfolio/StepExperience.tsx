// frontend/src/components/portfolio/StepExperience.tsx
import type { Experience, PortfolioState } from "@/hooks/usePortfolioState";
import { askAI } from "@/lib/ai";

interface Props {
    state: PortfolioState;
    addExperience: () => void;
    deleteExperience: (id: number) => void;
    updateExperience: (id: number, key: keyof Experience, value: any) => void;
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
const aiBtnStyle: React.CSSProperties = { fontSize: 11, color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(124,92,252,0.12)", border: "none", fontFamily: "'DM Sans', sans-serif" };

const StepExperience = ({ state, addExperience, deleteExperience, updateExperience }: Props) => {
    const aiEnhanceExp = async (e: Experience) => {
        try {
            const prompt = `Enhance this ${e.type === "work" ? "work experience" : "education"} description for a portfolio. Role: "${e.role}" at "${e.org}". Current: "${e.desc}". Make it more impactful, 2-3 sentences. Return ONLY the text.`;
            const result = await askAI(prompt, { temperature: 0.7, max_tokens: 150 });
            if (result && !result.startsWith("⚠️")) {
                updateExperience(e.id, "desc", result);
            }
        } catch {
            if (e.type === "work") {
                updateExperience(e.id, "desc", `${e.desc} Collaborated closely with senior engineers in an agile environment, consistently delivering features ahead of schedule.`);
            } else {
                updateExperience(e.id, "desc", `${e.desc} Developed strong foundations in computer science theory while applying skills to practical projects and hackathons.`);
            }
        }
    };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Experience & Education</div>
                    <div style={{ fontSize: 12, color: "var(--muted2)" }}>Work experience, education, certifications.</div>
                </div>
                <button
                    onClick={addExperience}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)", color: "var(--muted2)", fontFamily: "'DM Sans'", transition: "all .18s" }}
                >
                    + Add
                </button>
            </div>

            {state.experience.map(e => (
                <div key={e.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{e.emoji}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{e.role}</span>
                            <span style={{
                                fontSize: 10, padding: "2px 7px", borderRadius: 100,
                                background: e.type === "work" ? "rgba(91,141,240,0.13)" : "rgba(180,110,245,0.13)",
                                color: e.type === "work" ? "var(--blue)" : "var(--purple)",
                            }}>
                                {e.type === "work" ? "Work" : "Education"}
                            </span>
                        </div>
                        <button
                            onClick={() => deleteExperience(e.id)}
                            style={{ width: 24, height: 24, borderRadius: "50%", background: "none", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                            <div style={labelStyle}>Role / Degree</div>
                            <input style={inputStyle} value={e.role} onChange={ev => updateExperience(e.id, "role", ev.target.value)} />
                        </div>
                        <div>
                            <div style={labelStyle}>Organisation</div>
                            <input style={inputStyle} value={e.org} onChange={ev => updateExperience(e.id, "org", ev.target.value)} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <div style={labelStyle}>Period</div>
                        <input style={inputStyle} value={e.period} onChange={ev => updateExperience(e.id, "period", ev.target.value)} placeholder="e.g. Jun 2024 – Present" />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <div style={labelStyle}>
                            Type
                        </div>
                        <select
                            style={{ ...inputStyle, cursor: "pointer" }}
                            value={e.type}
                            onChange={ev => updateExperience(e.id, "type", ev.target.value)}
                        >
                            <option value="work">Work</option>
                            <option value="education">Education</option>
                        </select>
                    </div>

                    <div>
                        <div style={labelStyle}>
                            Description
                            <button style={aiBtnStyle} onClick={() => aiEnhanceExp(e)}>✦ AI Enhance</button>
                        </div>
                        <textarea
                            style={{ ...inputStyle, resize: "none", lineHeight: 1.6, minHeight: 50 }}
                            value={e.desc}
                            onChange={ev => updateExperience(e.id, "desc", ev.target.value)}
                            rows={2}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StepExperience;
