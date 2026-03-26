import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, Map, Code2, Zap, Briefcase, Globe, UserCircle,
    Sparkles, LogOut, Settings, Mic, BookOpen,
} from "lucide-react";

interface SidebarProps {
    onOpenAITutor: () => void;
}

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Map, label: "Roadmaps", path: "/roadmaps" },
    { icon: Code2, label: "Practice", path: "/practice" },
    { icon: BookOpen, label: "Learn", path: "/learn" },
    { icon: Briefcase, label: "Opportunities", path: "/opportunities" },
    { icon: Mic, label: "Interview Prep", path: "/interview-prep" },
    { icon: Globe, label: "Portfolio", path: "/portfolio" },
    { icon: UserCircle, label: "Profile", path: "/profile" },
];

const Sidebar = ({ onOpenAITutor }: SidebarProps) => {
    const { user, logout } = useAuth();

    const initials = (() => {
        const name = user?.full_name || user?.username || "?";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    })();

    return (
        <aside style={{
            width: 220,
            minWidth: 220,
            background: "var(--surface)",
            borderRight: "1px solid var(--border2)",
            display: "flex",
            flexDirection: "column",
            padding: "24px 12px",
            gap: 2,
            height: "100vh",
            overflowY: "auto",
            boxShadow: "var(--shadow-sm)",
            transition: "background 0.25s ease, border-color 0.25s ease",
        }}>
            {/* Logo */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "4px 10px 22px",
                fontFamily: "'Space Mono', monospace",
                fontSize: 17,
                fontWeight: 700,
            }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <span style={{
                    background: "linear-gradient(135deg, var(--yellow), var(--orange))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}>EduAI</span>
            </div>

            {/* Section label */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", padding: "0 10px 8px" }}>
                Navigation
            </div>

            {/* Nav Items */}
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "9px 10px",
                        borderRadius: 10,
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: "var(--muted)",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        textDecoration: "none",
                    }}
                    className="sidebar-nav-item"
                    activeClassName="sidebar-nav-active"
                >
                    <item.icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    {item.label}
                </NavLink>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

            {/* AI Tutor */}
            <button
                onClick={onOpenAITutor}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "9px 10px",
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "var(--accent)",
                    cursor: "pointer",
                    transition: "all 0.18s",
                    background: "var(--accent-soft)",
                    border: "1px solid rgba(124,92,252,0.2)",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: 4,
                }}
            >
                <Sparkles size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                AI Tutor
            </button>

            {/* Footer */}
            <div style={{
                marginTop: "auto",
                paddingTop: 12,
                borderTop: "1px solid var(--border2)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}>
                {user && (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 10px",
                        borderRadius: 12,
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                    }}>
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={initials}
                                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, var(--purple), var(--blue))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#fff",
                                flexShrink: 0,
                            }}>
                                {initials}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {user.full_name || user.username}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>Level {user.level || 1}</div>
                        </div>
                        <Settings size={14} style={{ color: "var(--muted)", cursor: "pointer", flexShrink: 0 }} />
                    </div>
                )}

                <button
                    onClick={() => logout()}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "9px 10px",
                        borderRadius: 10,
                        fontSize: 13,
                        color: "var(--muted)",
                        background: "none",
                        border: "none",
                        width: "100%",
                        cursor: "pointer",
                        transition: "all 0.18s",
                        textAlign: "left",
                    }}
                    className="sidebar-nav-item"
                >
                    <LogOut size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    Logout
                </button>
            </div>

            <style>{`
                .sidebar-nav-item:hover {
                    background: var(--surface2) !important;
                    color: var(--text) !important;
                }
                .sidebar-nav-active {
                    background: var(--accent-soft) !important;
                    color: var(--accent) !important;
                    border-left: 2.5px solid var(--accent);
                    box-shadow: inset 4px 0 14px -6px var(--accent-glow);
                    font-weight: 600 !important;
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
