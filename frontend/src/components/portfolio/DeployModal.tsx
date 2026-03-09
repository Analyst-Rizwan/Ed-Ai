// frontend/src/components/portfolio/DeployModal.tsx
import { useMemo, useState, useEffect } from "react";
import type { PortfolioState } from "@/hooks/usePortfolioState";
import { generatePortfolioHTML, generateDeployWorkflow } from "@/lib/portfolioPreview";
import api, { GitHubStatus } from "@/lib/api";
import { toast } from "sonner";

interface Props {
    state: PortfolioState;
    open: boolean;
    onClose: () => void;
}

const DeployModal = ({ state, open, onClose }: Props) => {
    const defaultUsername = state.github || "your-username";
    const [status, setStatus] = useState<GitHubStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [repoName, setRepoName] = useState(`${defaultUsername}.github.io`);

    const html = useMemo(() => generatePortfolioHTML(state), [state]);
    const workflow = useMemo(() => generateDeployWorkflow(), []);

    useEffect(() => {
        if (!open) return;
        const fetchStatus = async () => {
            setLoading(true);
            try {
                const res = await api.github.getStatus();
                setStatus(res);
                if (res.connected && res.github_username) {
                    setRepoName(`${res.github_username}.github.io`);
                }
            } catch (error) {
                console.error("Failed to fetch GitHub status", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, [open]);

    const handleConnect = async () => {
        try {
            const res = await api.github.getAuthUrl();
            window.location.href = res.url;
        } catch (error: any) {
            toast.error(error.message || "Failed to get GitHub auth URL");
        }
    };

    const handleDeploy = async () => {
        if (!repoName) {
            toast.error("Repository name is required");
            return;
        }
        setDeploying(true);
        toast.info(<div><strong>Deploying...</strong><br />Creating repository and pushing files. This may take a few seconds.</div>, { duration: 5000 });
        try {
            const res = await api.github.deployPortfolio({
                html_content: html,
                repo_name: repoName,
                workflow_yaml: workflow
            });
            toast.success(
                <div>
                    <strong>Successfully deployed!</strong><br />
                    GitHub Actions is building your site. It will be live in ~1-2 minutes at: <br />
                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "var(--accent)" }}>{res.url}</a>
                </div>,
                { duration: 10000 }
            );
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Deployment failed");
        } finally {
            setDeploying(false);
        }
    };

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
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ fontSize: 28 }}>🚀</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>Deploy to GitHub Pages</div>
                        <div style={{ fontSize: 12, color: "var(--muted2)" }}>
                            Automated 1-Click Deployment
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Checking GitHub connection...</div>
                ) : status?.connected ? (
                    <div style={{ ...stepBlockStyle, borderColor: "rgba(124,92,252,.3)", background: "rgba(124,92,252,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--green)" }} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Connected as <span style={{ color: "var(--accent)" }}>{status.github_username}</span></span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted2)", marginBottom: 6 }}>
                                Repository Name
                            </label>
                            <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                                <input
                                    value={repoName}
                                    onChange={(e) => setRepoName(e.target.value)}
                                    placeholder="yourusername.github.io"
                                    style={{
                                        flex: 1, padding: "10px 14px", background: "transparent", border: "none",
                                        color: "var(--text)", fontSize: 13, outline: "none", fontFamily: "'Space Mono', monospace"
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                                Tip: Use <code style={{ color: "var(--accent)" }}>{status.github_username}.github.io</code> for a root domain deployment.
                            </div>
                        </div>

                        <button
                            onClick={handleDeploy}
                            disabled={deploying}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                padding: "12px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: deploying ? "not-allowed" : "pointer",
                                border: "none", background: "var(--accent)", color: "#fff",
                                opacity: deploying ? 0.7 : 1, transition: "all .2s"
                            }}
                        >
                            {deploying ? "Deploying (takes a moment)..." : "🚀 1-Click Deploy"}
                        </button>
                    </div>
                ) : (
                    <div style={stepBlockStyle}>
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>🐙</div>
                            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Connect to GitHub</div>
                            <div style={{ fontSize: 13, color: "var(--muted2)", marginBottom: 20 }}>
                                Connect your account to enable 1-click deployments directly from EduAi to GitHub Pages.
                            </div>
                            <button
                                onClick={handleConnect}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px",
                                    borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.1)", background: "#24292e", color: "#fff",
                                }}
                            >
                                Connect GitHub Account
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 32, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>Or Do It Manually</div>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                {/* Manual Fallback */}
                <div style={{ ...stepBlockStyle, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Download Source Code</div>
                            <div style={{ fontSize: 11, color: "var(--muted2)" }}>Get the HTML and Actions workflow files</div>
                        </div>
                        <button
                            onClick={handleDownloadPackage}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 100,
                                fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid var(--border)",
                                background: "var(--surface2)", color: "var(--text)"
                            }}
                        >
                            ⬇ Download
                        </button>
                    </div>
                </div>

                <div style={{ ...stepBlockStyle, padding: 12, marginBottom: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Manual Push Commands</div>
                    <div style={{ ...codeBlockStyle, position: "relative", fontSize: 10, padding: 10 }}>
                        {`git init\ngit add .\ngit commit -m "Initial portfolio"\ngit branch -M main\ngit remote add origin https://github.com/${defaultUsername}/${defaultUsername}.github.io.git\ngit push -u origin main`}
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
                </div>
            </div>
        </div>
    );
};

export default DeployModal;
