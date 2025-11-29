import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  Code,
  ThumbsUp,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { mockProblems, type Problem } from "@/lib/placeholder";

const Practice = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Extract unique categories
  const categories: string[] = Array.from(
    new Set(mockProblems.map((p: Problem) => p.category))
  );

  // Filtering logic
  const filteredProblems = mockProblems.filter((problem: Problem) => {
    const matchesSearch =
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === "all" || problem.difficulty === difficultyFilter;

    const matchesCategory =
      categoryFilter === "all" || problem.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "solved" && problem.solved) ||
      (statusFilter === "unsolved" && !problem.solved);

    return matchesSearch && matchesDifficulty && matchesCategory && matchesStatus;
  });

  // Difficulty color mapping
  const getDifficultyColor = (difficulty: Problem["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-primary/10 text-primary border-primary/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Practice Problems
          </h1>
          <p className="text-muted-foreground mt-1">
            Sharpen your skills with curated coding challenges.
          </p>
        </div>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Random Problem
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {mockProblems.filter((p) => p.solved).length}
            </div>
            <p className="text-xs text-muted-foreground">Solved</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {mockProblems.filter((p) => p.solved && p.difficulty === "easy").length}
            </div>
            <p className="text-xs text-muted-foreground">Easy</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {mockProblems.filter(
                (p) => p.solved && p.difficulty === "medium"
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Medium</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {mockProblems.filter(
                (p) => p.solved && p.difficulty === "hard"
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Hard</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="solved">Solved</SelectItem>
                <SelectItem value="unsolved">Unsolved</SelectItem>
              </SelectContent>
            </Select>

            {/* Difficulty */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
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
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PROBLEMS LIST */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>{filteredProblems.length} Problems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredProblems.map((problem: Problem) => (
              <div
                key={problem.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {problem.solved ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {problem.title}
                      </h3>

                      <Badge
                        variant="outline"
                        className={getDifficultyColor(problem.difficulty)}
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {problem.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{problem.likes.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span>{problem.acceptance}% Acceptance</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {problem.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={problem.solved ? "outline" : "default"}
                    className="flex-shrink-0"
                  >
                    {problem.solved ? "Review" : "Solve"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EMPTY STATE */}
      {filteredProblems.length === 0 && (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No problems found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Practice;
