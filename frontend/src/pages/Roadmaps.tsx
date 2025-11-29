import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Search, Filter, MapPin, Clock, ChevronRight } from "lucide-react";
import { roadmaps as mockRoadmaps } from "@/lib/placeholder";

const Roadmaps = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Generate category list dynamically
  const categories = Array.from(new Set(mockRoadmaps.map((r) => r.category ?? "General")));

  // Apply filters
  const filteredRoadmaps = mockRoadmaps.filter((roadmap) => {
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

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold">Learning Roadmaps</h1>
        <p className="text-muted-foreground mt-1">
          Structured paths to guide your learning journey.
        </p>
      </div>

      {/* Filters */}
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
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
          Showing {filteredRoadmaps.length} of {mockRoadmaps.length} roadmaps
        </p>
      </div>

      {/* Roadmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoadmaps.map((roadmap) => (
          <Card
            key={roadmap.id}
            className="glass border-border/50 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <Badge variant="outline" className={getDifficultyColor(roadmap.difficulty)}>
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
                  <span className="font-medium text-primary">{roadmap.progress}%</span>
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

      {/* Empty State */}
      {filteredRoadmaps.length === 0 && (
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
    </div>
  );
};

export default Roadmaps;
