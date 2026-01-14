// frontend/src/lib/api.ts
// Use relative URL to leverage Vite's proxy (see vite.config.ts)
const API_URL = "/api";

// ============================================================
// AUTH TOKEN
// ============================================================
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// ============================================================
// FETCH WRAPPER
// ============================================================
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    const error = await response
      .json()
      .catch(() => ({ detail: "An error occurred" }));

    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

// ============================================================
// PROBLEM TYPES & API
// ============================================================
export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  acceptance: number;
  likes: number;
  tags: string[];
  starter_code?: string;
  test_cases: any[];
  hints: string[];
  solved: boolean;
  leetcode_slug?: string;
}

export interface ProblemDetail extends Problem {
  solution?: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProblemStats {
  total_problems: number;
  total_solved: number;
  easy_solved: number;
  easy_total: number;
  medium_solved: number;
  medium_total: number;
  hard_solved: number;
  hard_total: number;
}

export const problemsApi = {
  getProblems: async (params: {
    page?: number;
    page_size?: number;
    skip?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    category?: string;
    status?: string;
  }): Promise<ProblemListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    return fetchWithAuth(`/problems?${queryParams.toString()}`);
  },

  getProblem: async (id: number): Promise<ProblemDetail> => {
    return fetchWithAuth(`/problems/${id}`);
  },

  getCategories: async (): Promise<string[]> => {
    return fetchWithAuth("/problems/categories");
  },

  getStats: async (): Promise<ProblemStats> => {
    return fetchWithAuth("/problems/stats");
  },

  getRandomProblem: async (params?: {
    difficulty?: string;
    category?: string;
    unsolved_only?: boolean;
  }): Promise<{ id: number; title: string; difficulty: string; category: string; solved: boolean }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return fetchWithAuth(`/problems/random?${queryParams.toString()}`);
  },

  markAsSolved: async (problemId: number): Promise<void> => {
    return fetchWithAuth(`/progress/${problemId}`, {
      method: "PUT",
      body: JSON.stringify({ solved: true, attempted: true }),
    });
  },
};

// ============================================================
// PROGRESS TYPES & API
// ============================================================
export interface Progress {
  id: number;
  user_id: number;
  problem_id: number;
  solved: boolean;
  attempted: boolean;
  last_attempt: string;
  solution_code?: string;
  notes?: string;
  time_spent: number;
}

export interface ProgressUpdate {
  solved?: boolean;
  attempted?: boolean;
  solution_code?: string;
  notes?: string;
  time_spent?: number;
}

export const progressApi = {
  getProgress: async (problemId: number): Promise<Progress> => {
    return fetchWithAuth(`/progress/${problemId}`);
  },

  updateProgress: async (
    problemId: number,
    data: ProgressUpdate
  ): Promise<Progress> => {
    return fetchWithAuth(`/progress/${problemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getUserProgress: async (): Promise<Progress[]> => {
    return fetchWithAuth("/progress");
  },
};

// ============================================================
// AUTH TYPES & API
// ============================================================
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export const authApi = {
  getCurrentUser: async (): Promise<User> => {
    return fetchWithAuth("/auth/me");
  },
};

// ============================================================
// ROADMAP TYPES & API
// ============================================================
export const roadmapsApi = {
  getRoadmaps: async () => {
    return fetchWithAuth("/roadmaps");
  },

  getRoadmap: async (id: number) => {
    return fetchWithAuth(`/roadmaps/${id}`);
  },
};

// ============================================================
// LEETCODE TYPES & API
// ============================================================
export interface LeetCodeSyncResponse {
  status: string;
  message: string;
  problems_synced: number;
  synced_at: string;
  total_leetcode_solved?: number;
  matched_problems?: number;
  unmatched_problems?: number;
}

export const leetcodeApi = {
  sync: async (username: string): Promise<LeetCodeSyncResponse> => {
    return fetchWithAuth("/leetcode/sync", {
      method: "POST",
      body: JSON.stringify({ leetcode_username: username }),
    });
  },
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  problems: problemsApi,
  progress: progressApi,
  auth: authApi,
  roadmaps: roadmapsApi,
  leetcode: leetcodeApi,
};