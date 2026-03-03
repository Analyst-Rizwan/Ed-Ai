// frontend/src/components/portfolio/StepDesign.tsx
import type { PortfolioState, Sections } from "@/hooks/usePortfolioState";
import { THEMES, ACCENT_COLORS, FONTS, ANIM_OPTIONS } from "@/hooks/usePortfolioState";

interface Props {
    state: PortfolioState;
    applyTheme: (key: string) => void;
    setAccent: (color: string) => void;
    setFont: (font: string) => void;
    setLayout: (layout: string) => void;
    setAnimation: (animation: string) => void;
    toggleSection: (key: keyof Sections) => void;
}

const StepDesign = ({ state, applyTheme, setAccent, setFont, setLayout, setAnimation, toggleSection }: Props) => {
    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Design & Theme</div>
                <div style={{ fontSize: 12, color: "var(--muted2)" }}>Click a theme to instantly preview. Customise everything.</div>
            </div>

            {/* Themes */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10 }}>Theme</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {Object.entries(THEMES).map(([key, t]) => (
                    <div
                        key={key}
                        onClick={() => applyTheme(key)}
                        style={{
                            border: `2px solid ${state.theme === key ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: 14,
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all .18s",
                        }}
                    >
                        <div style={{
                            height: 60,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: t.bg,
                        }}>
                            <span style={{ fontFamily: key === "terminal" || key === "retro" ? "'Space Mono', monospace" : "'DM Sans', sans-serif", fontSize: 12, color: t.accent }}>
                                {key === "dark" ? "</>" : key === "terminal" ? "$_" : key === "minimal" ? "clean." : key === "glass" ? "✦" : key === "retro" ? "RETRO" : "🌊"}
                            </span>
                        </div>
                        <div style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, background: "var(--surface2)" }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Accent Colors */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10 }}>Accent Color</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {ACCENT_COLORS.map(c => (
                    <div
                        key={c}
                        onClick={() => setAccent(c)}
                        style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: c, cursor: "pointer",
                            border: `2px solid ${state.accent === c ? "#fff" : "transparent"}`,
                            transform: state.accent === c ? "scale(1.15)" : "none",
                            transition: "all .15s",
                        }}
                    />
                ))}
            </div>

            {/* Fonts */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10 }}>Font</div>
            {FONTS.map(f => (
                <div
                    key={f.name}
                    onClick={() => setFont(f.name)}
                    style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${state.font === f.name ? "rgba(124,92,252,.4)" : "rgba(255,255,255,0.12)"}`,
                        background: state.font === f.name ? "rgba(124,92,252,0.12)" : "var(--surface2)",
                        cursor: "pointer",
                        marginBottom: 6,
                        transition: "all .15s",
                    }}
                >
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: f.css, marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{f.sample}</div>
                </div>
            ))}

            {/* Layout */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10, marginTop: 16 }}>Layout</div>
            <select
                style={{
                    width: "100%", background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12, padding: "10px 14px", color: "var(--text)", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13, outline: "none", cursor: "pointer", marginBottom: 16,
                }}
                value={state.layout}
                onChange={e => setLayout(e.target.value)}
            >
                <option value="centered">Centered (Classic)</option>
                <option value="sidebar">Sidebar Left</option>
                <option value="fullwidth">Full Width Cards</option>
                <option value="magazine">Magazine Grid</option>
            </select>

            {/* Sections */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10 }}>Sections</div>
            {(Object.keys(state.sections) as (keyof Sections)[]).map(key => (
                <div
                    key={key}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 12px", borderRadius: 10, background: "var(--surface2)",
                        border: "1px solid var(--border)", marginBottom: 6,
                    }}
                >
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <div
                        onClick={() => toggleSection(key)}
                        style={{
                            width: 36, height: 20, borderRadius: 100,
                            background: state.sections[key] ? "var(--accent)" : "var(--surface3)",
                            cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
                        }}
                    >
                        <div style={{
                            width: 14, height: 14, borderRadius: "50%", background: "#fff",
                            position: "absolute", top: 3, left: state.sections[key] ? 19 : 3,
                            transition: "left .2s",
                        }} />
                    </div>
                </div>
            ))}

            {/* Animation */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: ".08em", marginBottom: 10, marginTop: 16 }}>Animation</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ANIM_OPTIONS.map(a => (
                    <div
                        key={a}
                        onClick={() => setAnimation(a)}
                        style={{
                            padding: "6px 12px", borderRadius: 100, fontSize: 12, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: state.animation === a ? "rgba(124,92,252,0.12)" : "var(--surface2)",
                            color: state.animation === a ? "var(--accent)" : "var(--muted2)",
                        }}
                    >
                        {a}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepDesign;
