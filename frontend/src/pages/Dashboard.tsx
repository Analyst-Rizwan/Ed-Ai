import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { authApi, User } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  Flame,
  Trophy,
  Target,
  TrendingUp,
  MapPin,
  Code,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { activities, roadmaps } from "@/lib/placeholder";
import { relativeTime } from "@/lib/utils";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (!user) {
    return <div className="p-8">Failed to load user data.</div>;
  }

  const xpToNextLevel = 500;
  const xp = user.xp || 0;
  const xpProgress = ((xp % xpToNextLevel) / xpToNextLevel) * 100;

  return (
    <div className="space-y-6 animate-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Welcome back, {user.full_name || user.username}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to continue your learning journey?
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/roadmaps">
              <MapPin className="h-4 w-4 mr-2" />
              Browse Roadmaps
            </Link>
          </Button>

          <Button className="gradient-primary" asChild>
            <Link to="/practice">
              <Code className="h-4 w-4 mr-2" />
              Start Practice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Streak */}
        <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Current Streak</CardTitle>
            <Flame className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.streak}</div>
            <p className="text-xs text-muted-foreground mt-1">days in a row</p>
          </CardContent>
        </Card>

        {/* XP */}
        <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total XP</CardTitle>
            <Trophy className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{xp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Level {user.level}</p>
          </CardContent>
        </Card>

        {/* Roadmaps */}
        <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Roadmaps</CardTitle>
            <MapPin className="h-5 w-5 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {roadmaps.filter(r => r.progress > 0 && r.progress < 100).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">in progress</p>
          </CardContent>
        </Card>

        {/* Problems */}
        <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Problems Solved</CardTitle>
            <Target className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">127</div>
            <p className="text-xs text-muted-foreground mt-1">this month</p>
          </CardContent>
        </Card>

      </div>

      {/* Level Progress */}
      <Card className="glass border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Level Progress
            </CardTitle>
            <Badge variant="secondary">Level {user.level}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {xp % xpToNextLevel} / {xpToNextLevel} XP
            </span>
            <span className="font-medium text-primary">{Math.round(xpProgress)}%</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Continue Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Roadmaps */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmaps
              .filter(r => r.progress > 0 && r.progress < 100)
              .slice(0, 3)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium group-hover:text-primary transition-colors">
                        {r.title}
                      </h4>
                      <Badge variant="outline">{r.difficulty}</Badge>
                    </div>

                    <Progress value={r.progress} className="h-2 mt-2" />
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
              >

                <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                  <Code className="h-4 w-4 text-primary" />
                </div>

                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">{a.title}</h4>

                  <p className="text-xs text-muted-foreground">
                    {relativeTime(a.timestamp)}
                  </p>

                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* AI Tutor CTA */}
      <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-heading font-bold mb-2">
                Need help with a concept?
              </h3>
              <p className="text-muted-foreground">
                Ask the AI Tutor for explanations, debugging help, or learning strategies.
              </p>
            </div>

            <Button size="lg" className="gradient-primary shadow-glow">
              <MessageSquare className="h-5 w-5 mr-2" />
              Ask AI Tutor
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;
