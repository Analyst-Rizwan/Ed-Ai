export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  role: 'user' | 'admin';
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
  totalSteps: number;
  completedSteps: number;
  estimatedTime: string;
  thumbnail?: string;
  tags: string[];
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  solved: boolean;
  acceptance: number;
  likes: number;
  starterCode?: string;
  testCases?: TestCase[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface Activity {
  id: string;
  type: 'problem_solved' | 'roadmap_completed' | 'streak_milestone' | 'level_up';
  title: string;
  description: string;
  timestamp: Date;
  xpGained?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  totalRoadmaps: number;
  subscriptions: {
    free: number;
    premium: number;
  };
}
