// frontend/src/components/portfolio/StepSkills.tsx
import { useState } from "react";
import type { PortfolioState } from "@/hooks/usePortfolioState";
import { SKILL_GROUPS } from "@/hooks/usePortfolioState";

interface Props {
    state: PortfolioState;
    toggleSkill: (group: string, skill: string) => void;
    addCustomSkill: (skill: string) => void;
}

const StepSkills = ({ state, toggleSkill, addCustomSkill }: Props) => {
    const [customInput, setCustomInput] = useState("");

    const handleAdd = () => {
        if (customInput.trim()) {
            addCustomSkill(customInput.trim());
            setCustomInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
    };

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Skills & Technologies</div>
                <div style={{ fontSize: 12, color: "var(--muted2)" }}>Click to select. These appear as visual badges on your portfolio.</div>
            </div>

            {Object.entries(SKILL_GROUPS).map(([group, skills]) => (
                <div key={group} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted2)", marginBottom: 8 }}>{group}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {skills.map(skill => {
                            const isSelected = (state.skills[group] || []).includes(skill);
                            return (
                                <div
                                    key={skill}
                                    onClick={() => toggleSkill(group, skill)}
                                    style={{
                                        padding: "5px 12px",
                                        borderRadius: 100,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        border: `1px solid ${isSelected ? "rgba(124,92,252,.4)" : "rgba(255,255,255,0.12)"}`,
                                        color: isSelected ? "var(--accent)" : "var(--muted2)",
                                        background: isSelected ? "rgba(124,92,252,0.12)" : "var(--surface2)",
                                        transition: "all .15s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                    }}
                                >
                                    {skill}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Custom skill input */}
            <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginBottom: 6 }}>Add Custom Skill</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        style={{
                            flex: 1,
                            background: "var(--surface2)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            color: "var(--text)",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            outline: "none",
                        }}
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g. Solidity, Blender..."
                    />
                    <button
                        onClick={handleAdd}
                        style={{
                            display: "flex", alignItems: "center", gap: 7, padding: "6px 13px",
                            borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            border: "1px solid rgba(255,255,255,0.12)", background: "var(--surface)",
                            color: "var(--muted2)", fontFamily: "'DM Sans'", transition: "all .18s",
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StepSkills;
