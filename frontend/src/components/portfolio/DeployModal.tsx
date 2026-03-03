// frontend/src/components/portfolio/DeployModal.tsx
import { useMemo } from "react";
import type { PortfolioState } from "@/hooks/usePortfolioState";
import { generatePortfolioHTML, generateDeployWorkflow } from "@/lib/portfolioPreview";

interface Props {
    state: PortfolioState;
    open: boolean;
    onClose: () => void;
}

const DeployModal = ({ state, open, onClose }: Props) => {
    const username = state.github || "your-username";
    const deployUrl = `https://${username}.github.io`;
    const html = useMemo(() => generatePortfolioHTML(state), [state]);

    const copyToClipboard = (text: string, btnEl?: HTMLButtonElement | null) => {
        navigator.clipboard.writeText(text).catch(() => { });
        if (btnEl) {
            const original = btnEl.textContent;
            btnEl.textContent = "✓";
            btnEl.style.color = "var(--green)";
            setTimeout(() => { btnEl.textContent = original; btnEl.style.color = ""; }, 1500);
        }
    };

    const downloadHTML = () => {
        const blob = new Blob([html], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "index.html";
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const downloadWorkflow = () => {
        const workflow = generateDeployWorkflow();
        const blob = new Blob([workflow], { type: "text/yaml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "deploy.yml";
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleDownloadPackage = () => {
        downloadHTML();
        setTimeout(downloadWorkflow, 500);
    };

    if (!open) return null;

    const stepBlockStyle: React.CSSProperties = {
        background: "var(--surface2)", border: "1px solid var(--border)",
        borderRadius: 14, padding: 16, marginBottom: 12,
    };
    const stepNumStyle: React.CSSProperties = {
        width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "#fff",
        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Space Mono', monospace", flexShrink: 0,
    };
    const codeBlockStyle: React.CSSProperties = {
        background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10,
        padding: "12px 14px", fontFamily: "'Space Mono', monospace", fontSize: 11,
        color: "var(--muted2)", lineHeight: 1.8, position: "relative", overflowX: "auto", whiteSpace: "pre",
    };
    const copyBtnStyle: React.CSSProperties = {
        position: "absolute", top: 8, right: 8, background: "var(--surface2)",
        border: "1px solid rgba(255,255,255,0.12)", color: "var(--muted)", fontSize: 11,
        padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans'",
        transition: "all .15s",
    };

    const gitCommands = `git init
git add .
git commit -m "Initial portfolio deploy"
git branch -M main
git remote add origin https://github.com/${username}/${username}.github.io.git
git push -u origin main`;

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, backdropFilter: "blur(6px)",
            }}
        >
            <div style={{
                background: "var(--surface)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20, padding: 28, width: 560, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 28 }}>🚀</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>Deploy to GitHub Pages</div>
                        <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                            Your portfolio will be live at <span style={{ color: "var(--accent)" }}>{deployUrl}</span>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div style={{
                    background: "rgba(74,207,130,0.13)", border: "1px solid rgba(74,207,130,.2)",
                    borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6,
                }}>
                    ✅ This generates a complete repository with a <strong style={{ color: "var(--text)" }}>GitHub Actions workflow</strong> that automatically builds and deploys your portfolio every time you push a change. <strong style={{ color: "var(--text)" }}>Free forever</strong> on GitHub Pages.
                </div>

                {/* Step 1: Download */}
                <div style={stepBlockStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={stepNumStyle}>1</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Download your portfolio files</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, lineHeight: 1.6 }}>
                        Click below to download your <code style={{ color: "var(--accent)" }}>index.html</code> and the GitHub Actions deploy workflow.
                    </div>
                    <button
                        onClick={handleDownloadPackage}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 100,
                            fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "var(--accent)",
                            color: "#fff", fontFamily: "'DM Sans'", boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
                        }}
                    >
                        ⬇ Download Portfolio Files
                    </button>
                </div>

                {/* Step 2: Create repo */}
                <div style={stepBlockStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={stepNumStyle}>2</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Create a GitHub repository</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, lineHeight: 1.6 }}>
                        Name it exactly:
                    </div>
                    <div style={{ ...codeBlockStyle, position: "relative" }}>
                        {username}.github.io
                        <button style={copyBtnStyle} onClick={e => copyToClipboard(`${username}.github.io`, e.currentTarget)}>Copy</button>
                    </div>
                </div>

                {/* Step 3: Push */}
                <div style={stepBlockStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={stepNumStyle}>3</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Push your files</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 10, lineHeight: 1.6 }}>
                        Open a terminal, place the downloaded files, and run:
                    </div>
                    <div style={{ ...codeBlockStyle, position: "relative" }}>
                        {gitCommands}
                        <button style={copyBtnStyle} onClick={e => copyToClipboard(gitCommands, e.currentTarget)}>Copy</button>
                    </div>
                </div>

                {/* Step 4: Enable Pages */}
                <div style={stepBlockStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={stepNumStyle}>4</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Enable GitHub Pages</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                        In your repo: <strong style={{ color: "var(--text)" }}>Settings → Pages → Source → GitHub Actions</strong>. Usually takes 2–3 minutes.
                    </div>
                </div>

                {/* Step 5: Auto-deploy */}
                <div style={{ ...stepBlockStyle, borderColor: "rgba(124,92,252,.2)", background: "rgba(124,92,252,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ ...stepNumStyle, background: "var(--purple)" }}>5</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-deploy on changes</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                        Every time you update and download a new version, just run <code style={{ color: "var(--accent)" }}>git add . && git commit -m "Update portfolio" && git push</code> and GitHub Actions will redeploy automatically.
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        onClick={onClose}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 100,
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
                            color: "var(--muted2)", fontFamily: "'DM Sans'",
                        }}
                    >
                        Close
                    </button>
                    <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                        <button style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 100,
                            fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "var(--accent)",
                            color: "#fff", fontFamily: "'DM Sans'", boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
                        }}>
                            Open GitHub →
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DeployModal;
