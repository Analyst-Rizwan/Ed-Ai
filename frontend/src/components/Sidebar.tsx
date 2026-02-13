import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Map,
  Code,
  User,
  MessageSquare,
  Settings,
  Trophy,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
  onOpenAITutor: () => void;
}

interface UserType {
  id: number;
  name: string;
  avatar?: string;
  role?: string;
  level?: number;
}

const Sidebar = ({ onOpenAITutor }: SidebarProps) => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Set default guest user
    setUser({
      id: 1,
      name: "Guest User",
      role: "user",
      level: 1,
      avatar: "https://github.com/shadcn.png"
    });
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Map, label: "Roadmaps", path: "/roadmaps" },
    { icon: Code, label: "Practice", path: "/practice" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-primary">EduAi</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-6 pt-6 border-t border-border">
          <Button
            onClick={onOpenAITutor}
            variant="outline"
            className="w-full justify-start gap-3 border-primary/20 hover:bg-primary/10 hover:text-primary"
          >
            <MessageSquare className="h-5 w-5" />
            <span>AI Tutor</span>
          </Button>
        </div>
      </div>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={user.name}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">Level {user.level || 1}</p>
            </div>
            <Button size="icon" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
