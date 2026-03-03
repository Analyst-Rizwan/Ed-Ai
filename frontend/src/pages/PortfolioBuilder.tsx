// frontend/src/pages/PortfolioBuilder.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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

const STEP_LABELS = ["Next: Projects →", "Next: Skills →", "Next: Experience →", "Next: Design →", "🚀 Deploy"];

const PortfolioBuilder = () => {
    const {
        state, goStep, nextStep, prevStep,
        setField, setAvatar,
        applyTheme, setAccent, setFont, setLayout, setAnimation, setCustomCSS,
        toggleSection, toggleSkill, addCustomSkill,
        addProject, deleteProject, updateProject, importProjects,
        addExperience, deleteExperience, updateExperience,
    } = usePortfolioState();

    const [deployOpen, setDeployOpen] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-save indicator
    useEffect(() => {
        setSaveStatus("saving");
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus("saved"), 800);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [state]);

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
        if (w) {
            w.document.write(html);
            w.document.close();
        }
    }, [state]);

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
                    <button
                        onClick={previewFullscreen}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "6px 13px",
                            borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
                            color: "var(--muted2)", fontFamily: "'DM Sans'", transition: "all .18s",
                        }}
                    >
                        ⛶ Fullscreen
                    </button>
                    <button
                        onClick={downloadHTML}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "6px 13px",
                            borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
                            color: "var(--muted2)", fontFamily: "'DM Sans'", transition: "all .18s",
                        }}
                    >
                        ⬇ Download HTML
                    </button>
                    <button
                        onClick={() => setDeployOpen(true)}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                            borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer",
                            border: "none", background: "var(--accent)", color: "#fff",
                            fontFamily: "'DM Sans'", boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
                            transition: "all .18s",
                        }}
                    >
                        🚀 Deploy to GitHub
                    </button>
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
                    <div style={{
                        flex: 1, overflowY: "auto", padding: 20,
                    }}
                        className="portfolio-form-scroll"
                    >
                        {state.currentStep === 0 && (
                            <StepIdentity state={state} setField={setField} setAvatar={setAvatar} />
                        )}
                        {state.currentStep === 1 && (
                            <StepProjects
                                state={state}
                                addProject={addProject}
                                deleteProject={deleteProject}
                                updateProject={updateProject}
                                importProjects={importProjects}
                            />
                        )}
                        {state.currentStep === 2 && (
                            <StepSkills state={state} toggleSkill={toggleSkill} addCustomSkill={addCustomSkill} />
                        )}
                        {state.currentStep === 3 && (
                            <StepExperience
                                state={state}
                                addExperience={addExperience}
                                deleteExperience={deleteExperience}
                                updateExperience={updateExperience}
                            />
                        )}
                        {state.currentStep === 4 && (
                            <StepDesign
                                state={state}
                                applyTheme={applyTheme}
                                setAccent={setAccent}
                                setFont={setFont}
                                setLayout={setLayout}
                                setAnimation={setAnimation}
                                toggleSection={toggleSection}
                            />
                        )}
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
                            <button
                                onClick={prevStep}
                                style={{
                                    display: "flex", alignItems: "center", gap: 7, padding: "6px 13px",
                                    borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
                                    color: "var(--muted2)", fontFamily: "'DM Sans'",
                                }}
                            >
                                ← Back
                            </button>
                        )}
                        <button
                            onClick={handleNextStep}
                            style={{
                                display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
                                borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                border: "none", background: "var(--accent)", color: "#fff",
                                fontFamily: "'DM Sans'", boxShadow: "0 4px 14px rgba(124,92,252,0.25)",
                                marginLeft: "auto",
                            }}
                        >
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

            {/* Scrollbar styles */}
            <style>{`
        .portfolio-form-scroll::-webkit-scrollbar { width: 4px; }
        .portfolio-form-scroll::-webkit-scrollbar-thumb { background: #2c2c2c; border-radius: 99px; }
      `}</style>
        </div>
    );
};

export default PortfolioBuilder;
