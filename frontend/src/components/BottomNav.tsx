import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Map, Code, User, MessageSquare, Briefcase, FolderOpen, Mic, BookOpen } from "lucide-react";
import { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface BottomNavProps {
  onOpenAITutor: () => void;
}

const BottomNav = ({ onOpenAITutor }: BottomNavProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Map, label: "Roadmaps", path: "/roadmaps" },
    { icon: Code, label: "Practice", path: "/practice" },
    { icon: BookOpen, label: "Learn", path: "/learn" },
    { icon: Code, label: "Code Viz", path: "/dsa" },
    { icon: Briefcase, label: "Jobs", path: "/opportunities" },
    { icon: Mic, label: "Interview", path: "/interview-prep" },
    { icon: FolderOpen, label: "Portfolio", path: "/portfolio" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  // Scroll active item into centre when route changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']") as HTMLElement | null;
    if (activeEl) {
      const offset = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [location.pathname]);

  // Publish nav height as a CSS variable so Layout can use it for padding
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--bottom-nav-h", `${h}px`);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--bottom-nav-h");
    };
  }, []);

  return (
    <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Subtle scroll hint gradient on right edge */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: 28, zIndex: 1,
        background: "linear-gradient(to left, var(--card, #1a1a1a) 0%, transparent 100%)",
        pointerEvents: "none",
      }} />

      <div
        ref={scrollRef}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "6px 8px",
          gap: 2,
        }}
        className="hide-scrollbar"
      >
        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              data-active={isActive ? "true" : "false"}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground transition-colors"
              activeClassName="text-primary"
              style={{ scrollSnapAlign: "center", flexShrink: 0, minWidth: 60 }}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs whitespace-nowrap">{item.label}</span>
            </NavLink>
          );
        })}

        {/* AI Tutor button */}
        <Button
          onClick={onOpenAITutor}
          variant="ghost"
          size="sm"
          style={{ scrollSnapAlign: "center", flexShrink: 0, minWidth: 60 }}
          className="flex flex-col items-center gap-1 px-3 py-2 h-auto rounded-lg"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs whitespace-nowrap">AI Tutor</span>
        </Button>
      </div>

      {/* Hide scrollbar in WebKit browsers */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </nav>
  );
};

export default BottomNav;
