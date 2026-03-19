import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    padding?: number | string;
    hover?: boolean;
}

/**
 * PremiumCard — shared card component with consistent styling.
 * Replaces ad-hoc inline card styles throughout the app.
 */
export const PremiumCard = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, style, padding = 20, hover = true, className, ...props }, ref) => {
        const [hovered, setHovered] = React.useState(false);

        return (
            <div
                ref={ref}
                className={className}
                onMouseEnter={(e) => {
                    if (hover) setHovered(true);
                    props.onMouseEnter?.(e);
                }}
                onMouseLeave={(e) => {
                    if (hover) setHovered(false);
                    props.onMouseLeave?.(e);
                }}
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding,
                    boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
                    transition: "box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease",
                    transform: hovered ? "translateY(-2px)" : "translateY(0)",
                    borderColor: hovered ? "var(--border2)" : "var(--border)",
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        );
    }
);
PremiumCard.displayName = "PremiumCard";

/**
 * SkeletonBlock — pulsing placeholder for loading states.
 */
export const SkeletonBlock = ({ width = "100%", height = 16, radius = 8, style }: {
    width?: number | string;
    height?: number | string;
    radius?: number;
    style?: React.CSSProperties;
}) => (
    <div style={{
        width,
        height,
        borderRadius: radius,
        background: "var(--surface2)",
        backgroundImage: "linear-gradient(90deg, var(--surface2) 0%, var(--border2) 40%, var(--surface2) 80%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.6s ease-in-out infinite",
        ...style,
    }} />
);

/**
 * CardSkeleton — a full skeleton card placeholder.
 */
export const CardSkeleton = ({ height = 100 }: { height?: number }) => (
    <PremiumCard hover={false} style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: height }}>
        <SkeletonBlock width="45%" height={12} />
        <SkeletonBlock width="65%" height={28} radius={6} />
        <SkeletonBlock width="35%" height={11} />
    </PremiumCard>
);
