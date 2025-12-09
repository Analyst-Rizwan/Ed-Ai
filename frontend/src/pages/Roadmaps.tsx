import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MapPin,
  Clock,
  ChevronRight,
  Wand2,
  Loader2,
  FileDown,
  Trophy,
  Target,
} from "lucide-react";

import {
  generateRoadmapWithAi,
  loadSavedRoadmaps,
  saveRoadmapToStorage,
  updateRoadmapProgress,
  type SavedRoadmap,
  type Roadmap,
  type RoadmapDay,
  type RoadmapDayItem,
} from "@/lib/roadmaps";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Roadmaps = () => {
  // AI roadmap builder state
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<string>("beginner");
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  const [background, setBackground] = useState("");
  const [goal, setGoal] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Saved AI roadmaps (from localStorage for now)
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);

  // Dialog for viewing/tracking a roadmap
  const [activeAiRoadmap, setActiveAiRoadmap] = useState<SavedRoadmap | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("progress");

  useEffect(() => {
    setSavedRoadmaps(loadSavedRoadmaps());
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
      case "beginner":
        return "bg-success/10 text-success border-success/20";
      case "medium":
      case "intermediate":
        return "bg-primary/10 text-primary border-primary/20";
      case "hard":
      case "advanced":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  const mapLevelToDifficulty = (lvl: string): string => {
    const v = (lvl || "").toLowerCase();
    if (v === "beginner") return "beginner";
    if (v === "intermediate") return "intermediate";
    if (v === "advanced") return "advanced";
    return "intermediate";
  };

  const formatEstimatedTime = (weeks: number): string => {
    if (weeks <= 4) return "1 month";
    if (weeks <= 8) return "2 months";
    if (weeks <= 12) return "3 months";
    if (weeks <= 16) return "3–4 months";
    const months = Math.round(weeks / 4);
    return `${months} months`;
  };

  const inferTagsFromTopic = (topic: string): string[] => {
    const lower = topic.toLowerCase();
    const tags: string[] = [];

    if (lower.includes("ai")) tags.push("ai");
    if (lower.includes("machine")) tags.push("machine-learning");
    if (lower.includes("ml")) tags.push("ml");
    if (lower.includes("data")) tags.push("data");
    if (lower.includes("python")) tags.push("python");
    if (lower.includes("deep")) tags.push("deep-learning");
    if (lower.includes("nlp")) tags.push("nlp");

    if (tags.length === 0) {
      const pieces = topic.split(/\s+/).filter(Boolean);
      tags.push(...pieces.slice(0, 2).map((p) => p.toLowerCase()));
    }

    return tags.slice(0, 4);
  };

  const handleGenerateRoadmap = async () => {
    setGenerationError(null);

    if (!topic.trim()) {
      setGenerationError("Please enter a topic/skill for the roadmap.");
      return;
    }

    try {
      setIsGenerating(true);
      const { roadmap, markdown } = await generateRoadmapWithAi({
        topic: topic.trim(),
        level,
        durationWeeks,
        hoursPerWeek,
        background: background.trim() || undefined,
        goal: goal.trim() || undefined,
      });

      const roadmapTitle =
        roadmap.title || `${topic.trim()} – ${durationWeeks} week roadmap`;
      const saved: SavedRoadmap = {
        id: roadmap.id || `${Date.now()}`,
        title: roadmapTitle,
        topic: topic.trim(),
        level,
        durationWeeks,
        hoursPerWeek,
        createdAt: new Date().toISOString(),
        markdown,
        roadmapJson: roadmap,
        earnedXp: 0,
        progress: 0,
      };

      saveRoadmapToStorage(saved);
      setSavedRoadmaps((prev) => [saved, ...prev]);
    } catch (err: any) {
      console.error("Roadmap generation failed:", err);
      setGenerationError(
        err?.message || "Failed to generate roadmap. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = (rm: SavedRoadmap) => {
    const blob = new Blob([rm.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rm.title.replace(/\s+/g, "-").toLowerCase() || "roadmap"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openRoadmapDialog = (rm: SavedRoadmap) => {
    setActiveAiRoadmap(rm);
    setActiveTab("progress");
    setIsDialogOpen(true);
  };

  const closeRoadmapDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setActiveAiRoadmap(null);
    }
  };

  const toggleDayCompletion = (
    phaseId: string,
    weekNumber: number,
    dayNumber: number,
  ) => {
    if (!activeAiRoadmap) return;

    const updatedRoadmap: Roadmap = JSON.parse(
      JSON.stringify(activeAiRoadmap.roadmapJson),
    );
    const phase = updatedRoadmap.phases?.find((p) => p.id === phaseId);
    if (!phase) return;

    const week = phase.weeks?.find((w) => w.week_number === weekNumber);
    if (!week) return;

    const day = week.days?.find((d) => d.day_number === dayNumber);
    if (!day) return;

    day.completed = !day.completed;

    if (day.completed) {
      [
        ...(day.learn_items || []),
        ...(day.practice_items || []),
        ...(day.project_items || []),
        ...(day.reflection_items || []),
      ].forEach((item) => {
        item.completed = true;
      });
    }

    updateRoadmapProgress(activeAiRoadmap.id, updatedRoadmap);

    const updated = loadSavedRoadmaps();
    setSavedRoadmaps(updated);
    const updatedActive = updated.find((r) => r.id === activeAiRoadmap.id);
    if (updatedActive) {
      setActiveAiRoadmap(updatedActive);
    }
  };

  const toggleItemCompletion = (
    phaseId: string,
    weekNumber: number,
    dayNumber: number,
    itemType:
      | "learn_items"
      | "practice_items"
      | "project_items"
      | "reflection_items",
    itemIndex: number,
  ) => {
    if (!activeAiRoadmap) return;

    const updatedRoadmap: Roadmap = JSON.parse(
      JSON.stringify(activeAiRoadmap.roadmapJson),
    );
    const phase = updatedRoadmap.phases?.find((p) => p.id === phaseId);
    if (!phase) return;

    const week = phase.weeks?.find((w) => w.week_number === weekNumber);
    if (!week) return;

    const day = week.days?.find((d) => d.day_number === dayNumber);
    if (!day) return;

    const items = day[itemType] as RoadmapDayItem[] | undefined;
    if (!items || !items[itemIndex]) return;

    items[itemIndex].completed = !items[itemIndex].completed;

    const allItems = [
      ...(day.learn_items || []),
      ...(day.practice_items || []),
      ...(day.project_items || []),
      ...(day.reflection_items || []),
    ];
    day.completed = allItems.length > 0 && allItems.every((item) => item.completed);

    updateRoadmapProgress(activeAiRoadmap.id, updatedRoadmap);

    const updated = loadSavedRoadmaps();
    setSavedRoadmaps(updated);
    const updatedActive = updated.find((r) => r.id === activeAiRoadmap.id);
    if (updatedActive) {
      setActiveAiRoadmap(updatedActive);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Learning Roadmaps
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate premium AI/ML bootcamp-style roadmaps with XP tracking and
            follow them day by day.
          </p>
        </div>
      </div>

      {/* AI Roadmap Builder */}
      <Card className="glass border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Create AI-powered roadmap
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Generates a bootcamp-style roadmap for AI/ML with daily tasks, XP
              rewards, quizzes, and free resources.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Topic / Skill <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Machine Learning with Python, Deep Learning for NLP..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (weeks)</label>
              <Input
                type="number"
                min={1}
                max={24}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hours per week</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your background (optional)
              </label>
              <Textarea
                placeholder="e.g. MCA student, basic Python and stats, no prior ML..."
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target goal (optional)</label>
              <Textarea
                placeholder="e.g. Crack ML interviews, build 3 ML projects, understand deep learning..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground border rounded-md border-border/60 bg-muted/40 px-3 py-2">
            ⚠️ <span className="font-semibold">Disclaimer:</span> These
            roadmaps are generated by AI and may contain intensive schedules or
            assumptions. Review carefully and adjust based on your energy,
            health, and available time. You are responsible for pacing yourself
            safely.
          </p>

          {generationError && (
            <p className="text-sm text-destructive">{generationError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="inline-flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating roadmap...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate roadmap with AI
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              The AI will create a week-by-week, day-by-day schedule with XP
              tracking.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SAVED AI ROADMAPS GRID */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Your roadmaps</h2>
          <p className="text-xs text-muted-foreground">
            Track your progress and earn XP as you complete tasks!
          </p>
        </div>

        {savedRoadmaps.length === 0 && (
          <Card className="border-dashed border-border/60 bg-muted/30">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No roadmaps yet. Use the{" "}
              <span className="font-medium">"Create AI-powered roadmap"</span>{" "}
              section above to generate your first plan.
            </CardContent>
          </Card>
        )}

        {savedRoadmaps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRoadmaps.map((rm) => {
              const difficulty = mapLevelToDifficulty(rm.level);
              const estimatedTime = formatEstimatedTime(rm.durationWeeks);
              const totalDays = (rm.roadmapJson.phases || []).reduce(
                (acc, phase) =>
                  acc +
                  (phase.weeks || []).reduce(
                    (wacc, week) => wacc + (week.days || []).length,
                    0,
                  ),
                0,
              );
              const tags = inferTagsFromTopic(rm.topic);

              return (
                <Card
                  key={`ai-${rm.id}`}
                  className="glass border-border/50 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className={getDifficultyColor(difficulty)}
                        >
                          {difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          AI
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {rm.title}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      AI-generated roadmap for {rm.topic}.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{estimatedTime}</span>
                      <span>•</span>
                      <span>{totalDays} days</span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">XP</span>
                          <span className="font-bold text-primary">
                            {rm.earnedXp} / {rm.roadmapJson.total_xp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-primary">
                          {rm.progress}%
                        </span>
                      </div>
                      <Progress value={rm.progress} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={() => openRoadmapDialog(rm)}
                      >
                        Continue Learning
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleDownloadMarkdown(rm)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for roadmap progress tracking + markdown */}
      <Dialog open={isDialogOpen} onOpenChange={closeRoadmapDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {activeAiRoadmap && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {activeAiRoadmap.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 flex-wrap">
                  <span>{activeAiRoadmap.topic}</span>
                  <span>•</span>
                  <span>{activeAiRoadmap.durationWeeks} weeks</span>
                  <span>•</span>
                  <span>{activeAiRoadmap.hoursPerWeek}h/week</span>
                  <span>•</span>
                  <span className="font-medium text-primary">
                    {activeAiRoadmap.earnedXp} /{" "}
                    {activeAiRoadmap.roadmapJson.total_xp} XP
                  </span>
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="progress">
                    <Trophy className="h-4 w-4 mr-2" />
                    Track Progress
                  </TabsTrigger>
                  <TabsTrigger value="markdown">
                    <FileDown className="h-4 w-4 mr-2" />
                    Markdown
                  </TabsTrigger>
                </TabsList>

                {/* Progress Tab */}
                <TabsContent
                  value="progress"
                  className="flex-1 overflow-auto mt-4 space-y-4"
                >
                  <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                          <span className="font-bold text-lg">
                            Total Progress
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                          {activeAiRoadmap.progress}%
                        </span>
                      </div>
                      <Progress
                        value={activeAiRoadmap.progress}
                        className="h-3 mb-2"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          XP Earned: {activeAiRoadmap.earnedXp} /{" "}
                          {activeAiRoadmap.roadmapJson.total_xp}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {(activeAiRoadmap.roadmapJson.phases || [])
                    .sort((a, b) => a.order - b.order)
                    .map((phase) => (
                      <Card key={phase.id} className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {phase.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {phase.goal}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              <Trophy className="h-3 w-3 mr-1" />
                              {phase.phase_xp} XP
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {(phase.weeks || [])
                            .sort((a, b) => a.week_number - b.week_number)
                            .map((week) => (
                              <div
                                key={week.week_number}
                                className="space-y-3 border rounded-lg p-4 bg-muted/30"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">
                                      Week {week.week_number}: {week.theme}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {week.outcome}
                                    </p>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {week.week_xp} XP
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  {(week.days || [])
                                    .sort(
                                      (a, b) => a.day_number - b.day_number,
                                    )
                                    .map((day: RoadmapDay) => (
                                      <div
                                        key={day.day_number}
                                        className={`border rounded-md p-3 space-y-2 transition-all ${
                                          day.completed
                                            ? "bg-success/10 border-success/30"
                                            : "bg-background"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              checked={day.completed}
                                              onCheckedChange={() =>
                                                toggleDayCompletion(
                                                  phase.id,
                                                  week.week_number,
                                                  day.day_number,
                                                )
                                              }
                                            />
                                            <span className="font-medium">
                                              Day {day.day_number}: {day.title}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              <Trophy className="h-3 w-3 mr-1" />
                                              {day.xp_reward} XP
                                            </Badge>
                                            {day.time_estimate_hours && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                ~{day.time_estimate_hours}h
                                              </Badge>
                                            )}
                                          </div>
                                        </div>

                                        {!day.completed && (
                                          <div className="ml-6 space-y-2 text-sm">
                                            {[
                                              {
                                                key: "learn_items",
                                                label: "📖 Learn",
                                              },
                                              {
                                                key: "practice_items",
                                                label: "💪 Practice",
                                              },
                                              {
                                                key: "project_items",
                                                label: "🚀 Project",
                                              },
                                              {
                                                key: "reflection_items",
                                                label: "💭 Reflect",
                                              },
                                            ].map(({ key, label }) => {
                                              const items =
                                                (day[
                                                  key as keyof RoadmapDay
                                                ] as RoadmapDayItem[] | undefined) ||
                                                [];
                                              if (items.length === 0)
                                                return null;

                                              return (
                                                <div
                                                  key={key}
                                                  className="space-y-1"
                                                >
                                                  <p className="text-xs font-medium text-muted-foreground">
                                                    {label}
                                                  </p>
                                                  {items.map((item, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="flex items-start gap-2"
                                                    >
                                                      <Checkbox
                                                        checked={
                                                          item.completed
                                                        }
                                                        onCheckedChange={() =>
                                                          toggleItemCompletion(
                                                            phase.id,
                                                            week.week_number,
                                                            day.day_number,
                                                            key as any,
                                                            idx,
                                                          )
                                                        }
                                                        className="mt-0.5"
                                                      />
                                                      <div className="flex-1">
                                                        <span
                                                          className={
                                                            item.completed
                                                              ? "line-through text-muted-foreground"
                                                              : ""
                                                          }
                                                        >
                                                          {item.description}
                                                        </span>
                                                        {item.xp > 0 && (
                                                          <span className="text-xs text-primary ml-1">
                                                            (+{item.xp} XP)
                                                          </span>
                                                        )}
                                                        {item.resource?.url && (
                                                          <a
                                                            href={
                                                              item.resource.url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 hover:underline ml-2"
                                                          >
                                                            [
                                                            {item.resource
                                                              .title ||
                                                              "Resource"}
                                                            ]
                                                          </a>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    ))}
                </TabsContent>

                {/* Markdown Tab */}
                <TabsContent
                  value="markdown"
                  className="flex-1 overflow-hidden mt-4 flex flex-col"
                >
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleDownloadMarkdown(activeAiRoadmap)}
                    >
                      <FileDown className="h-4 w-4" />
                      Download .md
                    </Button>
                  </div>
                  <div className="border rounded-md bg-muted/40 p-3 flex-1 overflow-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeAiRoadmap.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roadmaps;
