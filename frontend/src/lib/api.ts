// frontend/src/lib/api.ts
// Use VITE_API_URL in production, fallback to /api for local dev with Vite proxy
const API_URL = import.meta.env.VITE_API_URL || "/api";

// ============================================================
// TOKEN MANAGEMENT (IN-MEMORY)
// ============================================================
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// ============================================================
// FETCH WRAPPER
// ============================================================
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (accessToken) {
    (headers as any)["Authorization"] = `Bearer ${accessToken}`;
  }

  // Define the fetch call
  const doFetch = async () => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: "include",
    });
    return response;
  }

  let response = await doFetch();

  // Handle 401 (Unauthorized) -> Try Refresh
  if (response.status === 401) {
    // Prevent infinite loop if refresh endpoint itself allows 401
    if (!url.includes("/auth/refresh")) {
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setAccessToken(data.access_token);
          // Update header with new token
          (headers as any)["Authorization"] = `Bearer ${data.access_token}`;
          // Retry original request
          response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers,
            credentials: "include",
          });
        } else {
          // Refresh failed - forbid access
          setAccessToken(null);
        }
      } catch (e) {
        setAccessToken(null);
      }
    }
  }

  if (!response.ok) {
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
  bio?: string;
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  location?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  xp?: number;
  level?: number;
  streak?: number;
  role?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    // Using fetch directly to allow x-www-form-urlencoded (fetchWithAuth sets json content type)
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      body: params,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    return data;
  },

  register: async (userData: any): Promise<User> => {
    // userData should match UserCreate schema
    return fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
  },

  logout: async (): Promise<void> => {
    await fetchWithAuth("/auth/logout", { method: "POST" });
    setAccessToken(null);
  },

  getCurrentUser: async (): Promise<User> => {
    return fetchWithAuth("/auth/me");
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    return fetchWithAuth("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
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
// DASHBOARD TYPES & API
// ============================================================
export interface DashboardActivity {
  id: number;
  type: "problem_solved" | "streak_milestone" | "roadmap_completed" | "level_up";
  title: string;
  timestamp: string | null;
}

export interface DashboardSummary {
  xp: number;
  level: number;
  streak: number;
  problems_solved: number;
  completed_roadmaps: number;
  recent_activity: DashboardActivity[];
}

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    return fetchWithAuth("/dashboard/summary");
  },
};

// ============================================================
// OPPORTUNITIES TYPES & API
// ============================================================
export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  type: "job" | "internship" | "apprenticeship";
  field: string;
  remote: boolean;
  region: string;
  posted: string;
  platform: string;
  platform_url: string;
  tags: string[];
  description: string;
  emoji: string;
  color: string;
}

export interface OpportunitiesResponse {
  jobs: JobListing[];
  total: number;
  platforms: number;
  page: number;
  limit: number;
  cached_at: string | null;
}

export const opportunitiesApi = {
  getJobs: async (params: {
    q?: string;
    type?: string;
    field?: string;
    remote?: boolean;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<OpportunitiesResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "" && value !== "all") {
        queryParams.append(key, String(value));
      }
    });
    return fetchWithAuth(`/opportunities/jobs?${queryParams.toString()}`);
  },

  refresh: async (q?: string): Promise<OpportunitiesResponse> => {
    const queryParams = new URLSearchParams();
    if (q) queryParams.set("q", q);
    return fetchWithAuth(`/opportunities/refresh?${queryParams.toString()}`);
  },
};

// ============================================================
// PROFILE TYPES & API
// ============================================================
export interface ProfileStats {
  total_problems: number;
  solved: number;
  completion_percentage: number;
}

export const profileApi = {
  /** Upload avatar image (multipart/form-data) */
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}/profile/avatar`, {
      method: "POST",
      headers, // No Content-Type — browser sets multipart boundary
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }

    return response.json();
  },

  /** Remove avatar */
  deleteAvatar: async (): Promise<User> => {
    return fetchWithAuth("/profile/avatar", { method: "DELETE" });
  },

  /** Get profile stats (problems solved, etc.) */
  getStats: async (): Promise<ProfileStats> => {
    return fetchWithAuth("/profile/stats");
  },
};


// ============================================================
// GITHUB TYPES & API
// ============================================================
export interface GitHubStatus {
  connected: boolean;
  github_username: string | null;
}

export const githubApi = {
  getAuthUrl: async (): Promise<{ url: string }> => {
    return fetchWithAuth("/github/auth-url");
  },

  connect: async (code: string): Promise<{ status: string; github_username: string }> => {
    return fetchWithAuth("/github/connect", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  getStatus: async (): Promise<GitHubStatus> => {
    return fetchWithAuth("/github/status");
  },

  deployPortfolio: async (data: {
    html_content: string;
    repo_name: string;
    workflow_yaml: string;
  }): Promise<{ status: string; url: string; message: string }> => {
    return fetchWithAuth("/github/deploy-portfolio", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// INTERVIEW TYPES & API
// ============================================================
export interface MockInterviewMessage {
  role: "user" | "ai";
  text: string;
}

export interface MockInterviewResponse {
  type: "message" | "feedback";
  text?: string;
  clarity?: number;
  relevance?: number;
  structure?: number;
  closing?: string;
}

export const interviewApi = {
  /** First call to kick off an interview — AI asks the opening question */
  startMock: async (question: string, category: string): Promise<MockInterviewResponse> => {
    return fetchWithAuth("/interview/mock", {
      method: "POST",
      body: JSON.stringify({
        question,
        question_category: category,
        history: [],
        user_answer: "",
      }),
    });
  },

  /** Send candidate's answer; receive AI follow-up or final feedback */
  sendMockAnswer: async (
    question: string,
    category: string,
    history: { role: string; text: string }[],
    user_answer: string
  ): Promise<MockInterviewResponse> => {
    return fetchWithAuth("/interview/mock", {
      method: "POST",
      body: JSON.stringify({ question, question_category: category, history, user_answer }),
    });
  },

  /** Polish a STAR story with AI */
  polishStar: async (story: {
    title: string; situation: string; task: string; action: string; result: string;
  }): Promise<{ polished: string }> => {
    return fetchWithAuth("/interview/polish", {
      method: "POST",
      body: JSON.stringify(story),
    });
  },

  /** Salary negotiation turn */
  negotiate: async (payload: {
    role_title: string;
    experience_level: string;
    their_offer?: string;
    target_salary?: string;
    history: { role: string; text: string }[];
    user_response: string;
  }): Promise<{ text: string; role: string }> => {
    return fetchWithAuth("/interview/salary", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

// ============================================================
// CODE EXECUTION TYPES & API (Judge0 proxy)
// ============================================================
export interface ExecuteRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
}

export interface ExecuteResponse {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  token: string | null;
}

export const codeApi = {
  execute: async (data: ExecuteRequest): Promise<ExecuteResponse> => {
    return fetchWithAuth("/code/execute", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getLanguages: async (): Promise<{ id: number; name: string }[]> => {
    return fetchWithAuth("/code/languages");
  },
};

// ============================================================
// PLAYGROUND SETTINGS TYPES & API
// ============================================================
export interface PlaygroundSettings {
  layout_mode: "stacked" | "side-by-side" | "editor-only";
  editor_panel_size: number;
  output_panel_size: number;
  font_size: number;
  font_family: string;
  tab_size: number;
  show_minimap: boolean;
  show_line_numbers: boolean;
  word_wrap: "off" | "on";
  show_whitespace: "none" | "selection" | "all";
  last_language_id: number;
}

export const settingsApi = {
  getPlayground: async (): Promise<PlaygroundSettings> => {
    return fetchWithAuth("/settings/playground");
  },

  updatePlayground: async (data: Partial<PlaygroundSettings>): Promise<PlaygroundSettings> => {
    return fetchWithAuth("/settings/playground", {
      method: "PUT",
      body: JSON.stringify(data),
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
  dashboard: dashboardApi,
  opportunities: opportunitiesApi,
  profile: profileApi,
  github: githubApi,
  interview: interviewApi,
  code: codeApi,
  settings: settingsApi,
};