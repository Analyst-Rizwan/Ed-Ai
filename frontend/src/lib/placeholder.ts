// -----------------------------------------
// DATA MODELS
// -----------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  role: "member" | "admin";
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  type:
    | "problem_solved"
    | "streak_milestone"
    | "roadmap_completed"
    | "level_up";
  timestamp: Date;
  xpGained?: number;
}

export interface Roadmap {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  progress: number; // 0–100
  completedSteps: number;
  totalSteps: number;

  // Required by Roadmaps.tsx:
  category: string;
  description: string;
  estimatedTime: string;
  tags: string[];
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  solved: boolean;
  likes: number;
  acceptance: number; // %
  tags: string[];
}

// -----------------------------------------
// CURRENT USER
// -----------------------------------------

export const currentUser: User = {
  id: 1,
  name: "Rizwan",
  email: "rizwan@example.com",
  avatar: "https://i.pravatar.cc/150",
  level: 7,
  xp: 2450,
  streak: 9,
  role: "admin",
};

// -----------------------------------------
// RECENT ACTIVITY FEED
// -----------------------------------------

export const activities: Activity[] = [
  {
    id: 1,
    title: "Solved Two Sum",
    description: "Completed a medium difficulty challenge",
    type: "problem_solved",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    xpGained: 20,
  },
  {
    id: 2,
    title: "7-Day Streak Achieved",
    description: "You reached a milestone streak",
    type: "streak_milestone",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Completed Python Roadmap",
    description: "Finished all roadmap steps",
    type: "roadmap_completed",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    xpGained: 120,
  },
];

// -----------------------------------------
// ROADMAPS (used by Dashboard + Roadmaps.tsx)
// -----------------------------------------

export const roadmaps: Roadmap[] = [
  {
    id: 1,
    title: "Frontend Developer",
    difficulty: "medium",
    progress: 40,
    completedSteps: 12,
    totalSteps: 30,
    category: "Web Development",
    description: "Learn HTML, CSS, JavaScript, React, and frontend tooling.",
    estimatedTime: "3–4 months",
    tags: ["html", "css", "javascript", "react"],
  },
  {
    id: 2,
    title: "Backend Developer",
    difficulty: "hard",
    progress: 10,
    completedSteps: 3,
    totalSteps: 25,
    category: "Web Development",
    description:
      "Master server-side programming, databases, authentication, and APIs.",
    estimatedTime: "4–6 months",
    tags: ["nodejs", "database", "api", "auth"],
  },
  {
    id: 3,
    title: "DSA Mastery",
    difficulty: "medium",
    progress: 65,
    completedSteps: 22,
    totalSteps: 34,
    category: "Computer Science",
    description:
      "Learn data structures and algorithms required for coding interviews.",
    estimatedTime: "2–3 months",
    tags: ["arrays", "trees", "graphs", "dp"],
  },
  {
    id: 4,
    title: "Python Basics",
    difficulty: "easy",
    progress: 100,
    completedSteps: 20,
    totalSteps: 20,
    category: "Programming",
    description:
      "Start your Python journey with fundamentals and simple projects.",
    estimatedTime: "1 month",
    tags: ["python", "syntax", "basics"],
  },
];

// -----------------------------------------
// PRACTICE PROBLEMS
// -----------------------------------------

export const mockProblems: Problem[] = [
  {
    id: 1,
    title: "Two Sum",
    description: "Find two numbers that add up to target.",
    difficulty: "easy",
    category: "Arrays",
    solved: true,
    likes: 1283,
    acceptance: 47,
    tags: ["array", "hashmap"],
  },
  {
    id: 2,
    title: "Valid Parentheses",
    description: "Check if parentheses string is valid.",
    difficulty: "easy",
    category: "Stack",
    solved: false,
    likes: 932,
    acceptance: 55,
    tags: ["stack", "string"],
  },
  {
    id: 3,
    title: "Merge Intervals",
    description: "Combine overlapping intervals.",
    difficulty: "medium",
    category: "Intervals",
    solved: false,
    likes: 762,
    acceptance: 44,
    tags: ["sorting", "intervals"],
  },
  {
    id: 4,
    title: "Binary Search on Rotated Array",
    description: "Search target in rotated sorted array.",
    difficulty: "medium",
    category: "Binary Search",
    solved: true,
    likes: 540,
    acceptance: 39,
    tags: ["array", "binary-search"],
  },
  {
    id: 5,
    title: "Graph Islands",
    description: "Count connected components in a grid.",
    difficulty: "hard",
    category: "Graphs",
    solved: false,
    likes: 320,
    acceptance: 21,
    tags: ["dfs", "bfs", "grid"],
  },
];
