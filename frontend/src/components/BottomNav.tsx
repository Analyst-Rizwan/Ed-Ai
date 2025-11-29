import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Map, Code, User, MessageSquare } from "lucide-react";

interface BottomNavProps {
  onOpenAITutor: () => void;
}

const BottomNav = ({ onOpenAITutor }: BottomNavProps) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Map, label: "Roadmaps", path: "/roadmaps" },
    { icon: Code, label: "Practice", path: "/practice" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
        <Button
          onClick={onOpenAITutor}
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 px-3 py-2 h-auto"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">AI Tutor</span>
        </Button>
      </div>
    </nav>
  );
};

export default BottomNav;
