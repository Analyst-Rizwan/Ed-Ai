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
  Search,
  Filter,
  MapPin,
  Clock,
  ChevronRight,
  Wand2,
  Loader2,
  FileDown,
} from "lucide-react";

import { roadmaps as mockRoadmaps } from "@/lib/placeholder";
import {
  generateRoadmapMarkdown,
  loadSavedRoadmaps,
  saveRoadmapToStorage,
  type SavedRoadmap,
} from "@/lib/roadmaps";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Roadmaps = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  // Dialog for viewing a roadmap's markdown
  const [activeAiRoadmap, setActiveAiRoadmap] = useState<SavedRoadmap | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setSavedRoadmaps(loadSavedRoadmaps());
  }, []);

  // Generate category list dynamically from mock data
  const categories = Array.from(
    new Set(mockRoadmaps.map((r) => r.category ?? "General")),
  );

  // Apply filters for the mock/static roadmap cards
  const filteredMockRoadmaps = mockRoadmaps.filter((roadmap) => {
    const title = roadmap.title.toLowerCase();
    const description = (roadmap.description ?? "").toLowerCase();

    const matchesSearch =
      title.includes(searchQuery.toLowerCase()) ||
      description.includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === "all" || roadmap.difficulty === difficultyFilter;

    const matchesCategory =
      categoryFilter === "all" || roadmap.category === categoryFilter;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

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
    const v = lvl.toLowerCase();
    if (v === "beginner") return "easy";
    if (v === "intermediate") return "medium";
    if (v === "advanced") return "hard";
    return "medium";
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

    if (lower.includes("web")) tags.push("web");
    if (lower.includes("frontend")) tags.push("frontend");
    if (lower.includes("backend")) tags.push("backend");
    if (lower.includes("react")) tags.push("react");
    if (lower.includes("javascript") || lower.includes("js"))
      tags.push("javascript");
    if (lower.includes("nimcet")) tags.push("nimcet");
    if (lower.includes("mca")) tags.push("mca");
    if (lower.includes("dsa")) tags.push("dsa");

    if (tags.length === 0) {
      // fallback: split first 2 topic words as tags
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
      const markdown = await generateRoadmapMarkdown({
        topic: topic.trim(),
        level,
        durationWeeks,
        hoursPerWeek,
        background: background.trim() || undefined,
        goal: goal.trim() || undefined,
      });

      const roadmapTitle = `${topic.trim()} – ${durationWeeks} week roadmap (${level})`;
      const saved: SavedRoadmap = {
        id: `${Date.now()}`,
        title: roadmapTitle,
        topic: topic.trim(),
        level,
        durationWeeks,
        hoursPerWeek,
        createdAt: new Date().toISOString(),
        markdown,
      };

      saveRoadmapToStorage(saved);
      setSavedRoadmaps((prev) => [saved, ...prev]);
    } catch (err) {
      console.error("Roadmap generation failed:", err);
      setGenerationError("Failed to generate roadmap. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = (rm: SavedRoadmap) => {
    const blob = new Blob([rm.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rm.title.replace(/\s+/g, "-").toLowerCase() || "roadmap"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openRoadmapDialog = (rm: SavedRoadmap) => {
    setActiveAiRoadmap(rm);
    setIsDialogOpen(true);
  };

  const closeRoadmapDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setActiveAiRoadmap(null);
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
            Structured paths to guide your learning journey.
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
              Generate a detailed, day-by-day plan in Notion-style Markdown. The
              roadmap will appear below as a card with “Continue Learning”.
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
                placeholder="e.g. Web Development for MCA, NIMCET DSA, System Design..."
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
                max={52}
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
                placeholder="e.g. MCA student, basic C, no JS, weak in math..."
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target goal (optional)</label>
              <Textarea
                placeholder="e.g. Internship-ready in 4 months, clear NIMCET, build 2 projects..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
              />
            </div>
          </div>

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
              The AI will create a full week-by-week, day-by-day schedule in
              Notion-friendly markdown and save it as a roadmap card below.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters for template roadmaps */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roadmaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Difficulty */}
            <Select
              value={difficultyFilter}
              onValueChange={(val) => setDifficultyFilter(val)}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Difficulty" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Category */}
            <Select
              value={categoryFilter}
              onValueChange={(val) => setCategoryFilter(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredMockRoadmaps.length} of {mockRoadmaps.length} template
          roadmaps
        </p>
      </div>

      {/* Roadmap Grid: AI roadmaps first, then static templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AI-generated roadmap cards */}
        {savedRoadmaps.map((rm) => {
          const difficulty = mapLevelToDifficulty(rm.level);
          const estimatedTime = formatEstimatedTime(rm.durationWeeks);
          const totalSteps = rm.durationWeeks * 5; // rough: 5 days/week
          const completedSteps = 0;
          const progress = 0;
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
                  <span>{totalSteps} steps (approx.)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-primary">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedSteps} of {totalSteps} completed
                  </p>
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

        {/* Static/template roadmap cards */}
        {filteredMockRoadmaps.map((roadmap) => (
          <Card
            key={roadmap.id}
            className="glass border-border/50 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <Badge
                  variant="outline"
                  className={getDifficultyColor(roadmap.difficulty)}
                >
                  {roadmap.difficulty}
                </Badge>
              </div>

              <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                {roadmap.title}
              </CardTitle>

              <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                {roadmap.description ?? ""}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{roadmap.estimatedTime ?? "N/A"}</span>
                <span>•</span>
                <span>{roadmap.totalSteps} steps</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-primary">
                    {roadmap.progress}%
                  </span>
                </div>
                <Progress value={roadmap.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {roadmap.completedSteps} of {roadmap.totalSteps} completed
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(roadmap.tags ?? []).slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {(roadmap.tags?.length ?? 0) > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{roadmap.tags.length - 3}
                  </Badge>
                )}
              </div>

              <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {roadmap.progress > 0 ? "Continue Learning" : "Start Roadmap"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for when there are no template roadmaps */}
      {filteredMockRoadmaps.length === 0 && (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No roadmaps found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog to show the Notion-style markdown for an AI roadmap */}
      <Dialog open={isDialogOpen} onOpenChange={closeRoadmapDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          {activeAiRoadmap && (
            <>
              <DialogHeader>
                <DialogTitle>{activeAiRoadmap.title}</DialogTitle>
                <DialogDescription className="text-xs">
                  {activeAiRoadmap.topic} • {activeAiRoadmap.durationWeeks} weeks •{" "}
                  {activeAiRoadmap.hoursPerWeek}h/week •{" "}
                  {activeAiRoadmap.level}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 border rounded-md bg-muted/40 p-3 max-h-[60vh] overflow-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {activeAiRoadmap.markdown}
                </pre>
              </div>
              <div className="mt-3 flex justify-end">
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roadmaps;
