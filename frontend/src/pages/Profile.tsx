// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User as UserIcon,
  Trophy,
  Flame,
  Target,
  Share2,
  TrendingUp,
  Calendar,
  Award,
  MapPin,
  Link as LinkIcon,
  Github,
  Linkedin,
  Loader2
} from "lucide-react";
import { authApi, User } from "@/lib/api";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { activities } from "@/lib/placeholder"; // Start with placeholder activities for now

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Placeholder XP data until backend supports it
  const xpToNextLevel = 500;
  const xp = user?.xp || 0;
  const xpProgress = ((xp % xpToNextLevel) / xpToNextLevel) * 100;
  const level = user?.level || 1;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
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
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Failed to load profile.</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="glass border-border/50 flex-1">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <img
                src={user.avatar_url || "/avatar.png"}
                alt={user.full_name || user.username}
                className="h-24 w-24 rounded-full ring-4 ring-primary/20 object-cover"
              />

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-heading font-bold">{user.full_name || user.username}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  {user.bio && <p className="text-sm mt-2 max-w-lg">{user.bio}</p>}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {user.location}
                      </div>
                    )}
                    {user.website_url && (
                      <a href={user.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <LinkIcon className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {user.github_url && (
                      <a href={user.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary" className="text-sm">
                      Level {level}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {user.is_superuser ? "Admin" : "Member"}
                    </Badge>
                  </div>
                </div>

                {/* XP PROGRESS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress to Level {level + 1}</span>
                    <span className="font-medium text-primary">{Math.round(xpProgress)}%</span>
                  </div>

                  <Progress value={xpProgress} className="h-2" />
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <EditProfileDialog user={user} onUpdate={handleUserUpdate} />
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STATS CARDS */}
        <div className="flex flex-col gap-4 w-full md:w-64">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 text-destructive mx-auto mb-2" />
              <div className="text-3xl font-bold">0</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold">{(xp).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList className="glass border border-border/50">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="sync">Sync Profile</TabsTrigger>
        </TabsList>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                    <Target className="h-4 w-4 text-primary" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACHIEVEMENTS TAB */}
        <TabsContent value="achievements">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-lg border transition-all ${a.earned ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "bg-muted/30 border-border/50 opacity-60"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${a.earned ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${a.earned ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{a.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATS TAB */}
        <TabsContent value="stats">
          <p className="text-muted-foreground text-sm">Coming soon…</p>
        </TabsContent>

        {/* SYNC TAB */}
        <TabsContent value="sync">
          <p className="text-muted-foreground text-sm">Integration with LeetCode, GitHub, HackerRank coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
