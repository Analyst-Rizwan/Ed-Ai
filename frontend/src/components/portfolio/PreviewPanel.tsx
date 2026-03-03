// frontend/src/components/portfolio/PreviewPanel.tsx
import { useMemo, useState } from "react";
import type { PortfolioState } from "@/hooks/usePortfolioState";
import { generatePortfolioHTML } from "@/lib/portfolioPreview";

interface Props {
    state: PortfolioState;
}

const PreviewPanel = ({ state }: Props) => {
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

    const html = useMemo(() => generatePortfolioHTML(state), [state]);
    const previewUrl = `https://${(state.github || "your-username").replace(/[^a-z0-9-]/gi, "").toLowerCase()}.github.io`;

    const isMobile = previewMode === "mobile";

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
            {/* Top Bar */}
            <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                gap: 10,
            }}>
                <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e85d4a" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f5c842" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4acf82" }} />
                </div>
                <div style={{
                    flex: 1,
                    background: "var(--surface2)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: "var(--muted2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <span style={{ color: "var(--green)", fontSize: 10 }}>🔒</span>
                    <span>{previewUrl}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    <button
                        onClick={() => setPreviewMode("desktop")}
                        style={{
                            padding: "5px 10px", fontSize: 11, borderRadius: 100, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'DM Sans'",
                            background: previewMode === "desktop" ? "rgba(124,92,252,0.12)" : "var(--surface)",
                            color: previewMode === "desktop" ? "var(--accent)" : "var(--muted2)",
                            transition: "all .18s",
                        }}
                    >
                        🖥
                    </button>
                    <button
                        onClick={() => setPreviewMode("mobile")}
                        style={{
                            padding: "5px 10px", fontSize: 11, borderRadius: 100, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", fontFamily: "'DM Sans'",
                            background: previewMode === "mobile" ? "rgba(124,92,252,0.12)" : "var(--surface)",
                            color: previewMode === "mobile" ? "var(--accent)" : "var(--muted2)",
                            transition: "all .18s",
                        }}
                    >
                        📱
                    </button>
                </div>
            </div>

            {/* iframe */}
            <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <iframe
                    srcDoc={html}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    style={{
                        width: isMobile ? 390 : "100%",
                        minHeight: "100%",
                        border: "none",
                        display: "block",
                        margin: isMobile ? "16px auto" : 0,
                        boxShadow: isMobile ? "0 0 0 12px #2c2c2c, 0 0 0 14px #333" : "none",
                        borderRadius: isMobile ? 20 : 0,
                        transition: "all .3s ease",
                    }}
                />
            </div>
        </div>
    );
};

export default PreviewPanel;
