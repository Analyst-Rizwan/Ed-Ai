// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Flame, Target, TrendingUp, Calendar, Award,
  MapPin, Link as LinkIcon, Github, Linkedin,
  Loader2, BookOpen, BarChart3, Settings, Zap,
  CheckCircle2,
} from "lucide-react";
import { authApi, profileApi, ProfileStats, User } from "@/lib/api";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { activities } from "@/lib/placeholder";

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  const xpToNextLevel = 500;
  const xp = user?.xp || 0;
  const xpProgress = ((xp % xpToNextLevel) / xpToNextLevel) * 100;
  const level = user?.level || 1;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [userData, statsData] = await Promise.all([
        authApi.getCurrentUser(),
        profileApi.getStats().catch(() => null),
      ]);
      setUser(userData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const achievements = [
    { id: 1, title: "First Steps", description: "Solved your first problem", icon: Trophy, earned: true },
    { id: 2, title: "Week Warrior", description: "7-day streak milestone", icon: Flame, earned: true },
    { id: 3, title: "Century Club", description: "Solved 100 problems", icon: Target, earned: true },
    { id: 4, title: "Road Master", description: "Completed 5 roadmaps", icon: Award, earned: false },
    { id: 5, title: "Speed Demon", description: "Solved 10 problems in a day", icon: TrendingUp, earned: false },
    { id: 6, title: "Consistency King", description: "30-day streak", icon: Calendar, earned: false },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Failed to load profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-10">
      {/* ══════════ HERO HEADER ══════════ */}
      <Card className="glass border-border/50 overflow-hidden relative">
        {/* Gradient banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.1),transparent_60%)]" />
        </div>

        <CardContent className="relative px-4 sm:px-6 pb-6">
          {/* Avatar — overlapping the banner */}
          <div className="-mt-14 sm:-mt-16 mb-4 flex flex-col sm:flex-row items-start gap-4">
            <div className="relative">
              <AvatarUpload user={user} onUpdate={handleUserUpdate} size="lg" />
              {/* Level badge on avatar */}
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center shadow-md ring-2 ring-background">
                {level}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2 pt-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold break-words leading-tight">
                  {user.full_name || user.username}
                </h1>
                <p className="text-muted-foreground text-sm">@{user.username}</p>
                {user.bio && (
                  <p className="text-sm mt-2 text-muted-foreground max-w-lg leading-relaxed">{user.bio}</p>
                )}
              </div>

              {/* Social links */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {user.location}
                  </div>
                )}
                {user.website_url && (
                  <a href={user.website_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors">
                    <LinkIcon className="h-3.5 w-3.5" /> Website
                  </a>
                )}
                {user.github_url && (
                  <a href={user.github_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {user.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                  <Zap className="h-3 w-3" /> Level {level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {user.is_superuser ? "Admin" : "Member"}
                </Badge>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">Progress to Level {level + 1}</span>
              <span className="text-xs font-medium text-primary">{xp % xpToNextLevel} / {xpToNextLevel} XP</span>
            </div>
            <div className="relative">
              <Progress value={xpProgress} className="h-2" />
              <div
                className="absolute top-0 left-0 h-2 rounded-full bg-primary/20 blur-sm transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ STATS GRID ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Target, label: "Solved",
            value: stats?.solved ?? 0, color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            icon: Flame, label: "Streak",
            value: 0, suffix: " days", color: "text-destructive",
            bg: "bg-destructive/10",
          },
          {
            icon: Trophy, label: "Total XP",
            value: xp, color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            icon: BarChart3, label: "Completion",
            value: stats?.completion_percentage ?? 0, suffix: "%", color: "text-success",
            bg: "bg-success/10",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="glass border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <div className={`rounded-full p-2 ${stat.bg} mb-1`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  {stat.suffix && <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ══════════ TABS ══════════ */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass border border-border/50 w-full flex">
          <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm gap-1.5">
            <BookOpen className="h-3.5 w-3.5 hidden sm:block" /> Overview
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex-1 text-xs sm:text-sm gap-1.5">
            <Trophy className="h-3.5 w-3.5 hidden sm:block" /> Achievements
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs sm:text-sm gap-1.5">
            <Settings className="h-3.5 w-3.5 hidden sm:block" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet. Start learning to see your progress here!
                </p>
              ) : (
                activities.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className={`flex-shrink-0 rounded-full p-2 ${
                      activity.type === "problem_solved" ? "bg-primary/10" :
                      activity.type === "streak_milestone" ? "bg-destructive/10" :
                      activity.type === "level_up" ? "bg-success/10" :
                      "bg-info/10"
                    }`}>
                      <Target className={`h-4 w-4 ${
                        activity.type === "problem_solved" ? "text-primary" :
                        activity.type === "streak_milestone" ? "text-destructive" :
                        activity.type === "level_up" ? "text-success" :
                        "text-info"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-xs text-muted-foreground">{activity.time || activity.description}</p>
                    </div>

                    {activity.xpGained && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        +{activity.xpGained} XP
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {stats && (
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Problem Solving</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Problems Solved</span>
                    <span className="font-medium">{stats.solved} / {stats.total_problems}</span>
                  </div>
                  <Progress value={stats.completion_percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {stats.completion_percentage}% complete
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ACHIEVEMENTS TAB ── */}
        <TabsContent value="achievements">
          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Achievements</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {achievements.filter(a => a.earned).length} / {achievements.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        a.earned
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:shadow-sm"
                          : "bg-muted/20 border-border/30 opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2.5 ${a.earned ? "bg-primary/10" : "bg-muted/50"}`}>
                          <Icon className={`h-5 w-5 ${a.earned ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{a.title}</h4>
                            {a.earned && <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SETTINGS TAB ── */}
        <TabsContent value="settings">
          <SettingsTab user={user} onUpdate={handleUserUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
