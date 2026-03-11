import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  onOpenAITutor: () => void;
}

const navItems = [
  { icon: "⊞", label: "Dashboard", path: "/" },
  { icon: "🗺", label: "Roadmaps", path: "/roadmaps" },
  { icon: "</>", label: "Practice", path: "/practice" },
  { icon: "⚡", label: "Code Viz", path: "/dsa" },
  { icon: "◈", label: "Opportunities", path: "/opportunities" },
  { icon: "🌐", label: "Portfolio", path: "/portfolio" },
  { icon: "◉", label: "Profile", path: "/profile" },
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
      padding: "24px 16px",
      gap: 4,
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
        padding: "0 8px 24px",
        fontFamily: "'Space Mono', monospace",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--yellow)",
      }}>
        <span style={{ fontSize: 22 }}>⚡</span> EduAI
      </div>

      {/* Nav Items */}
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--muted)",
            cursor: "pointer",
            transition: "all 0.18s",
            textDecoration: "none",
          }}
          className="sidebar-nav-item"
          activeClassName="sidebar-nav-active"
        >
          <span style={{ width: 18, textAlign: "center", fontSize: 16 }}>
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}

      {/* AI Tutor */}
      <button
        onClick={onOpenAITutor}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--muted)",
          cursor: "pointer",
          transition: "all 0.18s",
          background: "none",
          border: "none",
          width: "100%",
          textAlign: "left",
        }}
        className="sidebar-nav-item"
      >
        <span style={{ width: 18, textAlign: "center", fontSize: 16 }}>✦</span>
        AI Tutor
      </button>

      {/* Footer */}
      <div style={{
        marginTop: "auto",
        paddingTop: 16,
        borderTop: "1px solid var(--border2)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {user && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
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
                background: "linear-gradient(135deg, #b46ef5, #5b8df0)",
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
            <div style={{ color: "var(--muted)", cursor: "pointer", fontSize: 14 }}>⚙</div>
          </div>
        )}

        <button
          onClick={() => logout()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 12,
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
          <span style={{ width: 18, textAlign: "center" }}>→</span>
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
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
