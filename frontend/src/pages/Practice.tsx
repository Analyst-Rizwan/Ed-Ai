import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ThumbsUp,
  CheckCircle2,
  Circle,
  Loader2,
  Link,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { problemsApi, leetcodeApi } from "@/lib/api";
import type { Problem, ProblemStats } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PROBLEMS_PER_PAGE = 10;
const AUTO_SYNC_INTERVAL = 60000; // 60 seconds

const Practice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ============================================================
  // STATE
  // ============================================================
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProblems, setLoadingProblems] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // LeetCode sync
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [syncingLeetCode, setSyncingLeetCode] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    loadInitialData();

    // Load saved username from localStorage
    const savedUsername = localStorage.getItem("leetcode_username");
    if (savedUsername) {
      setLeetcodeUsername(savedUsername);
      setAutoSyncEnabled(true);
    }
  }, []);

  // Load problems when filters change (with debounce for search)
  useEffect(() => {
    if (loading) return;

    const timeoutId = setTimeout(() => {
      loadProblems(1);
    }, searchQuery ? 300 : 0); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [difficultyFilter, categoryFilter, statusFilter, searchQuery, loading]);

  // Auto-sync effect
  useEffect(() => {
    if (!autoSyncEnabled || !leetcodeUsername) return;

    const syncInterval = setInterval(() => {
      handleBackgroundSync();
    }, AUTO_SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [autoSyncEnabled, leetcodeUsername]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsData, categoriesData] = await Promise.all([
        problemsApi.getStats(),
        problemsApi.getCategories(),
      ]);
      setStats(statsData);
      setCategories(categoriesData);

      // Load first page of problems
      await loadProblems(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProblems = async (page: number) => {
    try {
      setLoadingProblems(true);

      // Build query params - don't send 'all' values
      const params: any = {
        page,
        page_size: PROBLEMS_PER_PAGE,
      };

      // Only add filters if they have actual values (not "all")
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (difficultyFilter && difficultyFilter !== "all") {
        params.difficulty = difficultyFilter;
      }

      if (categoryFilter && categoryFilter !== "all") {
        params.category = categoryFilter;
      }

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      console.log("Loading problems with params:", params);

      const data = await problemsApi.getProblems(params);

      console.log("Received data:", data);

      setProblems(data.problems);
      setTotalProblems(data.total);
      setTotalPages(Math.ceil(data.total / PROBLEMS_PER_PAGE));
      setCurrentPage(page);
    } catch (error) {
      console.error("Load problems error:", error);
      toast({
        title: "Error",
        description: "Failed to load problems.",
        variant: "destructive",
      });
    } finally {
      setLoadingProblems(false);
    }
  };

  // ============================================================
  // LEETCODE SYNC
  // ============================================================
  const handleLeetCodeSync = async () => {
    if (!leetcodeUsername.trim()) {
      toast({
        title: "Missing username",
        description: "Please enter your LeetCode username.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncingLeetCode(true);
      const result = await leetcodeApi.sync(leetcodeUsername.trim());

      // Save username to localStorage
      localStorage.setItem("leetcode_username", leetcodeUsername.trim());
      setAutoSyncEnabled(true);
      setLastSyncTime(new Date());

      const message = result.unmatched_problems > 0
        ? `Synced ${result.problems_synced} problems. ${result.unmatched_problems} problems not in our database.`
        : `Successfully synced ${result.problems_synced} problems!`;

      toast({
        title: "LeetCode synced",
        description: message,
      });

      // Reload data after sync
      await loadInitialData();
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error?.message || "Failed to sync LeetCode.",
        variant: "destructive",
      });
    } finally {
      setSyncingLeetCode(false);
    }
  };

  const handleBackgroundSync = async () => {
    if (!leetcodeUsername) return;

    try {
      await leetcodeApi.sync(leetcodeUsername);
      setLastSyncTime(new Date());

      // Silently reload data without toast
      const statsData = await problemsApi.getStats();
      setStats(statsData);
      await loadProblems(currentPage);
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  };

  const handleManualSync = async () => {
    if (!leetcodeUsername) {
      toast({
        title: "No username",
        description: "Please sync your LeetCode account first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncingLeetCode(true);
      await leetcodeApi.sync(leetcodeUsername);
      setLastSyncTime(new Date());

      toast({
        title: "Synced",
        description: "Your progress has been updated.",
      });

      await loadInitialData();
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync with LeetCode.",
        variant: "destructive",
      });
    } finally {
      setSyncingLeetCode(false);
    }
  };

  const handleDisconnectLeetCode = () => {
    localStorage.removeItem("leetcode_username");
    setLeetcodeUsername("");
    setAutoSyncEnabled(false);
    setLastSyncTime(null);

    toast({
      title: "Disconnected",
      description: "LeetCode account disconnected.",
    });
  };

  // ============================================================
  // SOLVE ON LEETCODE
  // ============================================================
  const handleSolveOnLeetCode = (problem: Problem, e: React.MouseEvent) => {
    e.stopPropagation();

    const leetcodeSlug = problem.leetcode_slug ||
      problem.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const leetcodeUrl = `https://leetcode.com/problems/${leetcodeSlug}/`;
    window.open(leetcodeUrl, '_blank');

    if (autoSyncEnabled) {
      toast({
        title: "Good luck!",
        description: "Your progress will sync automatically when you solve this problem.",
      });

      setTimeout(() => {
        handleBackgroundSync();
      }, 10000);
    } else {
      toast({
        title: "Solve on LeetCode",
        description: "Connect your LeetCode account to automatically track your progress.",
      });
    }
  };

  // ============================================================
  // PAGINATION
  // ============================================================
  const handlePageChange = (newPage: number) => {
    loadProblems(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">

      {/* ====================================================== */}
      {/* LEETCODE SYNC CARD */}
      {/* ====================================================== */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            LeetCode Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!autoSyncEnabled ? (
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Enter LeetCode username"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLeetCodeSync()}
              />
              <Button
                onClick={handleLeetCodeSync}
                disabled={syncingLeetCode}
                className="whitespace-nowrap"
              >
                {syncingLeetCode && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Connect Account
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                  <span className="font-medium">@{leetcodeUsername}</span>
                </div>
                {lastSyncTime && (
                  <span className="text-sm text-muted-foreground">
                    Last synced {formatTimeSince(lastSyncTime)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={syncingLeetCode}
                >
                  {syncingLeetCode ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectLeetCode}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {autoSyncEnabled ? (
              <>
                ✨ Auto-sync enabled: Your full LeetCode history syncs every minute.
                Click "Solve" to open problems on LeetCode.
              </>
            ) : (
              "Connect your LeetCode account to automatically track all solved problems and sync your complete history."
            )}
          </p>
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* STATS OVERVIEW */}
      {/* ====================================================== */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_solved}/{stats.total_problems}</div>
              <p className="text-sm text-muted-foreground">Total Solved</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{stats.easy_solved}/{stats.easy_total}</div>
              <p className="text-sm text-muted-foreground">Easy</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{stats.medium_solved}/{stats.medium_total}</div>
              <p className="text-sm text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{stats.hard_solved}/{stats.hard_total}</div>
              <p className="text-sm text-muted-foreground">Hard</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold">
          Practice Problems
        </h1>
        <p className="text-muted-foreground mt-1">
          Sharpen your skills with curated coding challenges.
        </p>
      </div>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}
      <Card className="glass border-border/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

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
          </div>

          {(searchQuery || difficultyFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all") && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: {searchQuery}</Badge>
              )}
              {difficultyFilter !== "all" && (
                <Badge variant="secondary">Difficulty: {difficultyFilter}</Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="secondary">Category: {categoryFilter}</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">Status: {statusFilter}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDifficultyFilter("all");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* PROBLEMS LIST */}
      {/* ====================================================== */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle>
            {totalProblems} Problems
            {totalPages > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {loadingProblems ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : problems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No problems found. Try adjusting your filters.
            </div>
          ) : (
            problems.map((problem) => (
              <div
                key={problem.id}
                className="p-4 hover:bg-muted/50 cursor-pointer flex gap-4"
                onClick={() => navigate(`/problem/${problem.id}`)}
              >
                {problem.solved ? (
                  <CheckCircle2 className="text-success mt-1 flex-shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground mt-1 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-medium">{problem.title}</h3>
                    <Badge
                      variant="outline"
                      className={`${getDifficultyColor(problem.difficulty)} flex-shrink-0`}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {problem.likes}
                    </span>
                    <span>{problem.acceptance}% Acceptance</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant={problem.solved ? "outline" : "default"}
                    onClick={(e) => handleSolveOnLeetCode(problem, e)}
                    className="gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {problem.solved ? "View" : "Solve"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ====================================================== */}
      {/* PAGINATION */}
      {/* ====================================================== */}
      {totalPages > 1 && (
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * PROBLEMS_PER_PAGE) + 1} to{" "}
                {Math.min(currentPage * PROBLEMS_PER_PAGE, totalProblems)} of{" "}
                {totalProblems} problems
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loadingProblems}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      const showEllipsisBefore =
                        index > 0 && page - array[index - 1] > 1;

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="min-w-[2.5rem]"
                            disabled={loadingProblems}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loadingProblems}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Practice;