// frontend/src/components/portfolio/DesignPanel.tsx
import type { PortfolioState, Sections } from "@/hooks/usePortfolioState";
import { THEMES, ACCENT_COLORS } from "@/hooks/usePortfolioState";

interface Props {
    state: PortfolioState;
    applyTheme: (key: string) => void;
    setAccent: (color: string) => void;
    setLayout: (layout: string) => void;
    setCustomCSS: (css: string) => void;
    toggleSection: (key: keyof Sections) => void;
}

const DesignPanel = ({ state, applyTheme, setAccent, setLayout, setCustomCSS, toggleSection }: Props) => {
    const previewUrl = `https://${(state.github || "your-username").replace(/[^a-z0-9-]/gi, "").toLowerCase()}.github.io`;
    const sectionTitleStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 600, color: "var(--muted)",
        textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10,
    };

    return (
        <div style={{
            width: 260, minWidth: 260,
            borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                Design Controls
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>Live</span>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                {/* Quick Themes */}
                <div style={sectionTitleStyle}>Quick Themes</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {Object.entries(THEMES).map(([key, t]) => (
                        <div
                            key={key}
                            onClick={() => applyTheme(key)}
                            style={{
                                border: `2px solid ${state.theme === key ? "var(--accent)" : "var(--border)"}`,
                                borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all .18s",
                            }}
                        >
                            <div style={{
                                height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: t.bg,
                            }}>
                                <span style={{
                                    fontFamily: key === "terminal" || key === "retro" ? "'Space Mono', monospace" : "'DM Sans'",
                                    fontSize: 11, color: t.accent,
                                }}>
                                    {key === "dark" ? "</>" : key === "terminal" ? "$_" : key === "minimal" ? "clean." : key === "glass" ? "✦" : key === "retro" ? "RETRO" : "🌊"}
                                </span>
                            </div>
                            <div style={{ padding: "6px 10px", fontSize: 11, fontWeight: 600, background: "var(--surface2)" }}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Accent Color */}
                <div style={sectionTitleStyle}>Accent Color</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {ACCENT_COLORS.map(c => (
                        <div
                            key={c}
                            onClick={() => setAccent(c)}
                            style={{
                                width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
                                border: `2px solid ${state.accent === c ? "#fff" : "transparent"}`,
                                transform: state.accent === c ? "scale(1.15)" : "none",
                                transition: "all .15s",
                            }}
                        />
                    ))}
                </div>

                {/* Section Toggles */}
                <div style={sectionTitleStyle}>Sections Visible</div>
                {(Object.keys(state.sections) as (keyof Sections)[]).map(key => (
                    <div
                        key={key}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 10px", borderRadius: 10, background: "var(--surface2)",
                            border: "1px solid var(--border)", marginBottom: 5,
                        }}
                    >
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <div
                            onClick={() => toggleSection(key)}
                            style={{
                                width: 32, height: 18, borderRadius: 100,
                                background: state.sections[key] ? "var(--accent)" : "var(--surface3)",
                                cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: 12, height: 12, borderRadius: "50%", background: "#fff",
                                position: "absolute", top: 3, left: state.sections[key] ? 17 : 3,
                                transition: "left .2s",
                            }} />
                        </div>
                    </div>
                ))}

                {/* Layout Style */}
                <div style={{ ...sectionTitleStyle, marginTop: 12 }}>Layout Style</div>
                <select
                    style={{
                        width: "100%", background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10, padding: "8px 12px", color: "var(--text)", fontFamily: "'DM Sans'",
                        fontSize: 12, outline: "none", cursor: "pointer", marginBottom: 12,
                    }}
                    value={state.layout}
                    onChange={e => setLayout(e.target.value)}
                >
                    <option value="centered">Centered (Classic)</option>
                    <option value="sidebar">Sidebar Left</option>
                    <option value="fullwidth">Full Width Cards</option>
                    <option value="magazine">Magazine Grid</option>
                </select>

                {/* Custom CSS */}
                <div style={sectionTitleStyle}>Custom CSS</div>
                <textarea
                    style={{
                        width: "100%", background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10, padding: "10px 12px", color: "var(--text)",
                        fontFamily: "'Space Mono', monospace", fontSize: 11,
                        outline: "none", resize: "none", lineHeight: 1.6, minHeight: 70,
                    }}
                    value={state.customCSS}
                    onChange={e => setCustomCSS(e.target.value)}
                    placeholder="/* Add your own CSS here */"
                    rows={4}
                />

                {/* Preview URL */}
                <div style={{
                    marginTop: 16, padding: 12, background: "var(--surface2)",
                    border: "1px solid var(--border)", borderRadius: 12,
                }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Preview URL</div>
                    <div style={{
                        fontSize: 11, fontFamily: "'Space Mono', monospace",
                        color: "var(--accent)", wordBreak: "break-all",
                    }}>
                        {previewUrl}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DesignPanel;
