// frontend/src/pages/PortfolioBuilder.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioState } from "@/hooks/usePortfolioState";
import { generatePortfolioHTML } from "@/lib/portfolioPreview";
import StepTabs from "@/components/portfolio/StepTabs";
import StepIdentity from "@/components/portfolio/StepIdentity";
import StepProjects from "@/components/portfolio/StepProjects";
import StepSkills from "@/components/portfolio/StepSkills";
import StepExperience from "@/components/portfolio/StepExperience";
import StepDesign from "@/components/portfolio/StepDesign";
import PreviewPanel from "@/components/portfolio/PreviewPanel";
import DesignPanel from "@/components/portfolio/DesignPanel";
import DeployModal from "@/components/portfolio/DeployModal";
import { useIsMobile } from "@/hooks/use-mobile";

const STEP_LABELS = ["Next: Projects →", "Next: Skills →", "Next: Experience →", "Next: Design →", "🚀 Deploy"];
const STEP_NAMES = ["Identity", "Projects", "Skills", "Experience", "Design"];

const PortfolioBuilder = () => {
    const {
        state, goStep, nextStep, prevStep,
        setField, setAvatar,
        applyTheme, setAccent, setFont, setLayout, setAnimation, setCustomCSS,
        toggleSection, toggleSkill, addCustomSkill,
        addProject, deleteProject, updateProject, importProjects,
        addExperience, deleteExperience, updateExperience,
    } = usePortfolioState();

    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const [deployOpen, setDeployOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
    const [mobileView, setMobileView] = useState<"form" | "preview" | "design">("form");
    const [designDrawerOpen, setDesignDrawerOpen] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pillsRef = useRef<HTMLDivElement>(null);

    // Auto-save indicator
    useEffect(() => {
        setSaveStatus("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus("saved"), 800);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [state]);

    // Scroll active step pill into view on mobile
    useEffect(() => {
        if (!isMobile || !pillsRef.current) return;
        const active = pillsRef.current.querySelector("[data-active='true']") as HTMLElement | null;
        if (active) {
            const container = pillsRef.current;
            const offset = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2;
            container.scrollTo({ left: offset, behavior: "smooth" });
        }
    }, [state.currentStep, isMobile]);

    const handleNextStep = useCallback(() => {
        if (state.currentStep === 4) {
            setDeployOpen(true);
        } else {
            nextStep();
        }
    }, [state.currentStep, nextStep]);

    const downloadHTML = useCallback(() => {
        const html = generatePortfolioHTML(state);
        const blob = new Blob([html], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${(state.github || "portfolio")}-portfolio.html`;
        a.click();
        URL.revokeObjectURL(a.href);
    }, [state]);

    const previewFullscreen = useCallback(() => {
        const html = generatePortfolioHTML(state);
        const w = window.open("", "_blank");
        if (w) { w.document.write(html); w.document.close(); }
    }, [state]);

    const previewUrl = `https://${state.github || "your-username"}.github.io`;

    // ─────────────────────────────────────────────────
    // MOBILE LAYOUT
    // ─────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div style={{
                display: "flex", flexDirection: "column",
                minHeight: "100dvh",
                margin: "-16px",
                background: "var(--bg)",
                position: "relative",
            }}>
                {/* ── MOBILE TOPBAR (fixed) ── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px 10px",
                    background: "var(--surface)", borderBottom: "1px solid var(--border)",
                    flexShrink: 0, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                    height: 52,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Back / Exit button */}
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Exit portfolio builder"
                            style={{
                                background: "none", border: "none", color: "var(--text)",
                                fontSize: 18, cursor: "pointer", padding: 4, display: "flex",
                                alignItems: "center", justifyContent: "center",
                            }}
                        >←</button>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--yellow)" }}>
                            ⚡ EduAI
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* Save indicator */}
                        <div style={{
                            fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 8px", background: "var(--surface2)", borderRadius: 100, border: "1px solid var(--border)",
                        }}>
                            <span style={{
                                width: 5, height: 5, borderRadius: "50%",
                                background: saveStatus === "saved" ? "var(--green)" : "var(--yellow)",
                                display: "inline-block", transition: "background 0.3s",
                            }} />
                            {saveStatus === "saved" ? "Saved" : "Saving..."}
                        </div>
                        {/* Download */}
                        <button onClick={downloadHTML} style={mIconBtn}>⬇</button>
                        {/* Deploy */}
                        <button onClick={() => setDeployOpen(true)} style={{ ...mIconBtn, background: "var(--accent)", borderColor: "var(--accent)", color: "#fff" }}>
                            🚀
                        </button>
                    </div>
                </div>
                {/* Spacer for fixed topbar */}
                <div style={{ height: 52, flexShrink: 0 }} />

                {/* ── MOBILE STEP PILLS ── */}
                <div
                    ref={pillsRef}
                    style={{
                        display: "flex", padding: "10px 14px", gap: 6,
                        overflowX: "auto", scrollbarWidth: "none",
                        background: "var(--surface)", borderBottom: "1px solid var(--border)",
                        flexShrink: 0,
                    }}
                    className="pb-hide-scrollbar"
                >
                    {STEP_NAMES.map((name, i) => {
                        const isActive = state.currentStep === i;
                        const isDone = state.currentStep > i;
                        return (
                            <div
                                key={i}
                                data-active={isActive ? "true" : "false"}
                                onClick={() => { goStep(i); setMobileView("form"); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "7px 13px", borderRadius: 100,
                                    fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
                                    cursor: "pointer", flexShrink: 0,
                                    border: `1px solid ${isActive ? "rgba(124,92,252,0.35)" : isDone ? "rgba(74,207,130,0.3)" : "var(--border2)"}`,
                                    background: isActive ? "var(--accent-soft)" : isDone ? "var(--green-soft)" : "var(--surface2)",
                                    color: isActive ? "var(--accent)" : isDone ? "var(--green)" : "var(--muted)",
                                    transition: "all 0.18s",
                                }}
                            >
                                <div style={{
                                    width: 17, height: 17, borderRadius: "50%", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 700,
                                    background: isActive ? "var(--accent)" : isDone ? "var(--green)" : "var(--surface3)",
                                    color: (isActive || isDone) ? "#fff" : "var(--muted)",
                                    flexShrink: 0,
                                }}>
                                    {isDone ? "✓" : i + 1}
                                </div>
                                {name}
                            </div>
                        );
                    })}
                </div>

                {/* ── MOBILE PREVIEW CHROME (shown when preview is active) ── */}
                {mobileView === "preview" && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", background: "var(--surface)",
                        borderBottom: "1px solid var(--border)", flexShrink: 0,
                    }}>
                        <button onClick={() => setMobileView("form")} style={{ ...mIconBtn, flexShrink: 0 }}>✕</button>
                        <div style={{
                            flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)",
                            borderRadius: 8, padding: "6px 10px",
                            fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--muted2)",
                            display: "flex", alignItems: "center", gap: 5, overflow: "hidden", minWidth: 0,
                        }}>
                            <span style={{ color: "var(--green)", fontSize: 10 }}>🔒</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewUrl}</span>
                        </div>
                        <button onClick={previewFullscreen} style={mIconBtn} title="Open in new tab">⛶</button>
                    </div>
                )}

                {/* ── MAIN CONTENT AREA ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>

                    {/* FORM PANEL */}
                    <div style={{
                        display: mobileView === "form" ? "flex" : "none",
                        flexDirection: "column", flex: 1,
                    }}>
                        <div style={{ flex: 1, padding: "14px 14px 60px", overflowY: "auto" }} className="pb-hide-scrollbar">
                            {state.currentStep === 0 && <StepIdentity state={state} setField={setField} setAvatar={setAvatar} />}
                            {state.currentStep === 1 && <StepProjects state={state} addProject={addProject} deleteProject={deleteProject} updateProject={updateProject} importProjects={importProjects} />}
                            {state.currentStep === 2 && <StepSkills state={state} toggleSkill={toggleSkill} addCustomSkill={addCustomSkill} />}
                            {state.currentStep === 3 && <StepExperience state={state} addExperience={addExperience} deleteExperience={deleteExperience} updateExperience={updateExperience} />}
                            {state.currentStep === 4 && <StepDesign state={state} applyTheme={applyTheme} setAccent={setAccent} setFont={setFont} setLayout={setLayout} setAnimation={setAnimation} toggleSection={toggleSection} />}
                        </div>
                    </div>

                    {/* PREVIEW PANEL (fullscreen) */}
                    {mobileView === "preview" && (
                        <div style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
                            <PreviewPanel state={state} />
                        </div>
                    )}

                </div>

                {/* ── FIXED FORM NAV (above bottom nav) ── */}
                {mobileView === "form" && (
                    <div style={{
                        position: "fixed",
                        bottom: 64,
                        left: 0, right: 0,
                        background: "var(--bg)", borderTop: "1px solid var(--border)",
                        padding: "10px 14px", display: "flex", gap: 8, zIndex: 100,
                    }}>
                        {state.currentStep > 0 && (
                            <button onClick={prevStep} style={btnGhost}>← Back</button>
                        )}
                        <button onClick={handleNextStep} style={{ ...btnPrimary, marginLeft: "auto" }}>
                            {STEP_LABELS[state.currentStep]}
                        </button>
                    </div>
                )}

                {/* ── MOBILE BOTTOM NAV ── */}
                <div style={{
                    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
                    background: "var(--surface)", borderTop: "1px solid rgba(255,255,255,0.12)",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "6px 4px 8px" }}>

                        {/* Edit */}
                        <button onClick={() => setMobileView("form")} style={bnItem(mobileView === "form")}>
                            <span style={bnIcon}>✏️</span>
                            <span style={{ ...bnLabel, color: mobileView === "form" ? "var(--accent)" : "var(--muted)" }}>Edit</span>
                        </button>

                        {/* Preview */}
                        <button onClick={() => setMobileView("preview")} style={bnItem(mobileView === "preview")}>
                            <span style={bnIcon}>👁</span>
                            <span style={{ ...bnLabel, color: mobileView === "preview" ? "var(--accent)" : "var(--muted)" }}>Preview</span>
                        </button>

                        {/* Deploy (elevated center button) */}
                        <button onClick={() => setDeployOpen(true)} style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                            cursor: "pointer", background: "none", border: "none", padding: "0 6px", flex: 1,
                        }}>
                            <div style={{
                                width: 46, height: 46, borderRadius: "50%",
                                background: "var(--accent)", boxShadow: "0 4px 16px var(--accent-glow)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18, marginTop: -16,
                                border: "3px solid var(--bg)", transition: "transform 0.15s",
                            }}>🚀</div>
                            <span style={{ ...bnLabel, color: "var(--muted)" }}>Deploy</span>
                        </button>

                        {/* Download */}
                        <button onClick={downloadHTML} style={bnItem(false)}>
                            <span style={bnIcon}>⬇️</span>
                            <span style={{ ...bnLabel, color: "var(--muted)" }}>Download</span>
                        </button>

                        {/* Design */}
                        <button onClick={() => setDesignDrawerOpen(true)} style={bnItem(false)}>
                            <span style={bnIcon}>🎨</span>
                            <span style={{ ...bnLabel, color: "var(--muted)" }}>Design</span>
                        </button>

                    </div>
                </div>

                {/* ── DESIGN BOTTOM SHEET DRAWER ── */}
                {designDrawerOpen && (
                    <>
                        <div
                            onClick={() => setDesignDrawerOpen(false)}
                            style={{
                                position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
                                zIndex: 700, backdropFilter: "blur(4px)",
                            }}
                        />
                        <div style={{
                            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 800,
                            background: "var(--surface)", borderTop: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "20px 20px 0 0",
                            maxHeight: "88dvh", display: "flex", flexDirection: "column",
                            animation: "pbSlideUp 0.32s cubic-bezier(0.22,1,0.36,1)",
                        }}>
                            {/* Drag pill */}
                            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--surface3)", margin: "12px auto 0", flexShrink: 0 }} />
                            {/* Header */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 15, fontWeight: 600 }}>Design Controls</span>
                                <button onClick={() => setDesignDrawerOpen(false)} style={mIconBtn}>✕</button>
                            </div>
                            {/* Body */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }} className="pb-hide-scrollbar">
                                <DesignPanel
                                    state={state}
                                    applyTheme={applyTheme}
                                    setAccent={setAccent}
                                    setLayout={setLayout}
                                    setCustomCSS={setCustomCSS}
                                    toggleSection={toggleSection}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Deploy Modal */}
                <DeployModal state={state} open={deployOpen} onClose={() => setDeployOpen(false)} />

                <style>{`
                    .pb-hide-scrollbar::-webkit-scrollbar { display: none; }
                    @keyframes pbSlideUp {
                        from { transform: translateY(100%); }
                        to   { transform: translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    // ─────────────────────────────────────────────────
    // DESKTOP LAYOUT (unchanged)
    // ─────────────────────────────────────────────────
    return (
        <div style={{
            display: "flex", flexDirection: "column",
            height: "calc(100vh - 0px)", overflow: "hidden",
            margin: "-32px -36px",
            background: "var(--bg)",
        }}>
            {/* TOPBAR */}
            <div style={{
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                borderBottom: "1px solid var(--border)",
            }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                        Portfolio Builder <span style={{ color: "var(--accent)" }}>🌐</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        Build, design and deploy your portfolio to GitHub Pages in minutes
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: saveStatus === "saved" ? "var(--green)" : "var(--yellow)",
                            display: "inline-block",
                        }} />
                        {saveStatus === "saved" ? "Auto-saved" : "Saving..."}
                    </div>
                    <button onClick={previewFullscreen} style={btnGhostSm}>⛶ Fullscreen</button>
                    <button onClick={downloadHTML} style={btnGhostSm}>⬇ Download HTML</button>
                    <button onClick={() => setDeployOpen(true)} style={btnPrimary}>🚀 Deploy to GitHub</button>
                </div>
            </div>

            {/* STEP TABS */}
            <StepTabs currentStep={state.currentStep} onGoStep={goStep} />

            {/* THREE-PANEL BUILDER BODY */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {/* LEFT: FORM PANEL */}
                <div style={{
                    width: 360, minWidth: 360,
                    borderRight: "1px solid var(--border)",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden",
                }}>
                    <div style={{ flex: 1, overflowY: "auto", padding: 20 }} className="portfolio-form-scroll">
                        {state.currentStep === 0 && <StepIdentity state={state} setField={setField} setAvatar={setAvatar} />}
                        {state.currentStep === 1 && <StepProjects state={state} addProject={addProject} deleteProject={deleteProject} updateProject={updateProject} importProjects={importProjects} />}
                        {state.currentStep === 2 && <StepSkills state={state} toggleSkill={toggleSkill} addCustomSkill={addCustomSkill} />}
                        {state.currentStep === 3 && <StepExperience state={state} addExperience={addExperience} deleteExperience={deleteExperience} updateExperience={updateExperience} />}
                        {state.currentStep === 4 && <StepDesign state={state} applyTheme={applyTheme} setAccent={setAccent} setFont={setFont} setLayout={setLayout} setAnimation={setAnimation} toggleSection={toggleSection} />}
                    </div>

                    {/* Form Navigation */}
                    <div style={{
                        padding: "14px 20px",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        gap: 8,
                        flexShrink: 0,
                    }}>
                        {state.currentStep > 0 && (
                            <button onClick={prevStep} style={btnGhostSm}>← Back</button>
                        )}
                        <button onClick={handleNextStep} style={{ ...btnPrimary, marginLeft: "auto" }}>
                            {STEP_LABELS[state.currentStep]}
                        </button>
                    </div>
                </div>

                {/* CENTER: PREVIEW */}
                <PreviewPanel state={state} />

                {/* RIGHT: DESIGN PANEL */}
                <DesignPanel
                    state={state}
                    applyTheme={applyTheme}
                    setAccent={setAccent}
                    setLayout={setLayout}
                    setCustomCSS={setCustomCSS}
                    toggleSection={toggleSection}
                />
            </div>

            {/* Deploy Modal */}
            <DeployModal state={state} open={deployOpen} onClose={() => setDeployOpen(false)} />

            <style>{`
                .portfolio-form-scroll::-webkit-scrollbar { width: 4px; }
                .portfolio-form-scroll::-webkit-scrollbar-thumb { background: #2c2c2c; border-radius: 99px; }
            `}</style>
        </div>
    );
};

// ── Shared style objects ──────────────────────────────
const mIconBtn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: "50%",
    background: "var(--surface2)", border: "1px solid var(--border2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, cursor: "pointer", color: "var(--text)",
    transition: "background 0.15s", flexShrink: 0,
};

const bnIcon: React.CSSProperties = { fontSize: 19, lineHeight: 1 };
const bnLabel: React.CSSProperties = { fontSize: 10, fontWeight: 500, whiteSpace: "nowrap" };

const bnItem = (active: boolean): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    padding: "6px 10px", borderRadius: 14, cursor: "pointer",
    background: "none", border: "none", flex: 1, minWidth: 0,
    filter: active ? "drop-shadow(0 0 4px var(--accent))" : "none",
});

const btnGhost: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 7, padding: "6px 13px",
    borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
    color: "var(--muted2)", fontFamily: "'DM Sans'", transition: "all .18s",
};

const btnGhostSm: React.CSSProperties = { ...btnGhost };

const btnPrimary: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
    borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer",
    border: "none", background: "var(--accent)", color: "#fff",
    fontFamily: "'DM Sans'", boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
    transition: "all .18s",
};

export default PortfolioBuilder;
