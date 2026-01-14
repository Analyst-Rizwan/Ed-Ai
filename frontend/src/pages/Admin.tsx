import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Code,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";

// Use relative URL to leverage Vite's proxy (see vite.config.ts)
const API_BASE = "/api";

// ###############################################
// PRODUCTION: Fetch real stats from backend API
// ###############################################

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRoadmaps: number;
  totalProblems: number;
  subscriptions: {
    free: number;
    premium: number;
  };
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch admin stats from backend
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/progress/admin-stats`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load stats");

      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error("Admin stats error:", err);
      setError("Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Placeholder while loading
  if (loading) {
    return (
      <div className="p-10 text-center text-lg">
        <div className="animate-pulse">Loading admin data…</div>
      </div>
    );
  }

  // Error handling
  if (error || !stats) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-500">{error}</p>
        <Button className="mt-4" onClick={fetchStats}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and management
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin Access
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users */}
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-medium text-success">
                {stats.activeUsers.toLocaleString()}
              </span>
              <Badge variant="secondary" className="text-xs">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Content Library
            </CardTitle>
            <BookOpen className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRoadmaps}</div>
            <p className="text-sm text-muted-foreground mt-1">Roadmaps</p>

            <div className="text-2xl font-bold mt-4">
              {stats.totalProblems.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Problems</p>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscriptions
            </CardTitle>
            <CreditCard className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Free */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Free</span>
                  <span className="text-lg font-bold">
                    {stats.subscriptions.free.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground"
                    style={{
                      width: `${(stats.subscriptions.free / stats.totalUsers) * 100
                        }%`,
                    }}
                  />
                </div>
              </div>

              {/* Premium */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Premium
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {stats.subscriptions.premium.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(stats.subscriptions.premium / stats.totalUsers) * 100
                        }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              View All Users
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              User Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Roadmaps
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Code className="h-4 w-4 mr-2" />
              Manage Problems
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Content Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Placeholder */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Live activity feed coming soon…
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
