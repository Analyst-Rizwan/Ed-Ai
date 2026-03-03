// frontend/src/components/portfolio/StepTabs.tsx
import type { PortfolioState } from "@/hooks/usePortfolioState";

const STEPS = ["Identity", "Projects", "Skills", "Experience", "Design"];

interface StepTabsProps {
    currentStep: number;
    onGoStep: (n: number) => void;
}

const StepTabs = ({ currentStep, onGoStep }: StepTabsProps) => {
    return (
        <div style={{
            display: "flex",
            padding: "0 24px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--surface)",
            gap: 0,
        }}>
            {STEPS.map((label, i) => {
                const isActive = i === currentStep;
                const isDone = i < currentStep;
                return (
                    <div
                        key={label}
                        onClick={() => onGoStep(i)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 18px",
                            fontSize: 13,
                            fontWeight: 500,
                            color: isActive ? "var(--accent)" : isDone ? "var(--green)" : "var(--muted)",
                            cursor: "pointer",
                            borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                            marginBottom: -1,
                            transition: "all .18s",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: isActive ? "var(--accent)" : isDone ? "var(--green)" : "var(--surface2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 700,
                            color: isActive || isDone ? "#fff" : "inherit",
                            transition: "all .18s",
                        }}>
                            {i + 1}
                        </div>
                        {label}
                    </div>
                );
            })}
        </div>
    );
};

export default StepTabs;
