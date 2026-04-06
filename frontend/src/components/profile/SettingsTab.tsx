import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Save, Loader2, Shield, CreditCard,
  Moon, Sun, User as UserIcon, AlertTriangle,
  Crown, CheckCircle2, XCircle, Clock,
  MapPin, Globe, Github, Linkedin
} from "lucide-react";
import { User, authApi } from "@/lib/api";
import { AvatarUpload } from "./AvatarUpload";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function SettingsTab({ user, onUpdate }: SettingsTabProps) {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: user.full_name || "",
    bio: user.bio || "",
    location: user.location || "",
    website_url: user.website_url || "",
    github_url: user.github_url || "",
    linkedin_url: user.linkedin_url || "",
  });

  useEffect(() => {
    setForm({
      full_name: user.full_name || "",
      bio: user.bio || "",
      location: user.location || "",
      website_url: user.website_url || "",
      github_url: user.github_url || "",
      linkedin_url: user.linkedin_url || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await authApi.updateProfile(form);
      onUpdate(updated);
      toast({ title: "Profile saved", description: "Your changes have been saved." });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  return (
    <div className="space-y-6 animate-in max-w-3xl">

      {/* ── Profile Section ─────────────────────────────── */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <AvatarUpload user={user} onUpdate={onUpdate} size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground">
                Click the avatar to upload. JPEG, PNG, WebP or GIF. Max 2MB.
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Form fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Your name" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bio">Bio</Label>
                <span className={`text-xs ${form.bio.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>
                  {form.bio.length}/500
                </span>
              </div>
              <Textarea
                id="bio" name="bio" value={form.bio} onChange={handleChange}
                placeholder="Tell us about yourself..."
                maxLength={500} rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Location
              </Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="City, Country" />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_url" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Website
                </Label>
                <Input id="website_url" name="website_url" value={form.website_url} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_url" className="flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" /> GitHub
                </Label>
                <Input id="github_url" name="github_url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </Label>
              <Input id="linkedin_url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* ── Subscription Status ────────────────────────── */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscription & Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {/* Current Plan */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Crown className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Free Plan</span>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0">Current</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Basic access to all features</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Crown className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>

          {/* Plan Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "AI Mentor Chats", value: "10 / day", available: true },
              { label: "Mock Interviews", value: "3 / day", available: true },
              { label: "Job Opportunities", value: "Full Access", available: true },
              { label: "Code Playground", value: "Limited", available: true },
              { label: "Priority Support", value: "Not included", available: false },
              { label: "Custom Roadmaps", value: "Not included", available: false },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-2.5 text-sm">
                {feature.available ? (
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={feature.available ? "" : "text-muted-foreground/60"}>
                  {feature.label}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{feature.value}</span>
              </div>
            ))}
          </div>

          {/* Billing info placeholder */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Payment gateway integration coming soon</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Appearance ────────────────────────────────── */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between dark and light theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Account Info ──────────────────────────────── */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Member Since</p>
              <p className="font-medium">{memberSince}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Role</p>
              <Badge variant="outline" className="text-xs">
                {user.is_superuser ? "Admin" : "Member"}
              </Badge>
            </div>
          </div>

          <Separator />

          <Button variant="outline" size="sm" onClick={() => window.location.href = "/forgot-password"}>
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* ── Danger Zone ───────────────────────────────── */}
      <Card className="glass border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
