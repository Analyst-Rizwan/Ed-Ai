// frontend/src/lib/roadmaps.ts

export interface RoadmapResource {
  title: string;
  url: string;
  provider?: string;
  type?: string;
}

export interface RoadmapDayItem {
  description: string;
  xp: number;
  completed: boolean;
  resource?: RoadmapResource;
}

export interface RoadmapDay {
  day_number: number;
  title: string;
  time_estimate_hours?: number | null;
  xp_reward: number;
  completed: boolean;
  learn_items?: RoadmapDayItem[];
  practice_items?: RoadmapDayItem[];
  project_items?: RoadmapDayItem[];
  reflection_items?: RoadmapDayItem[];
}

export interface RoadmapWeek {
  week_number: number;
  theme: string;
  outcome: string;
  summary?: string;
  week_xp: number;
  quiz_questions?: string[];
  weekly_resources?: RoadmapResource[];
  days?: RoadmapDay[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  order: number;
  goal: string;
  start_week?: number;
  end_week?: number;
  milestone_summary?: string;
  phase_xp: number;
  weeks?: RoadmapWeek[];
}

export interface Roadmap {
  id: string;
  title: string;
  skill?: string;
  level: string;
  description?: string;
  duration_weeks: number;
  hours_per_week: number;
  target_outcome?: string;
  prerequisites?: string;
  total_xp: number;
  phases?: RoadmapPhase[];
}

export interface GeneratedRoadmapResult {
  roadmap: Roadmap;
  markdown: string;
}

export interface SavedRoadmap {
  id: string;
  title: string;
  topic: string;
  level: string;
  durationWeeks: number;
  hoursPerWeek: number;
  createdAt: string;
  markdown: string;
  roadmapJson: Roadmap;
  earnedXp: number;
  progress: number;
}

const STORAGE_KEY = "edai_saved_roadmaps_v3";

// IMPORTANT: always hit same-origin /api
// - In dev, Vite proxies /api -> http://127.0.0.1:8000
// - In prod, browser hits /api/... (relative URL)
const API_BASE = "/api";

// --------------------------------------------------
// Local storage helpers
// --------------------------------------------------

export function loadSavedRoadmaps(): SavedRoadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveRoadmapToStorage(roadmap: SavedRoadmap) {
  if (typeof window === "undefined") return;
  const existing = loadSavedRoadmaps();
  const updated = [roadmap, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateRoadmapProgress(roadmapId: string, updatedRoadmap: Roadmap) {
  if (typeof window === "undefined") return;
  const existing = loadSavedRoadmaps();
  const index = existing.findIndex((r) => r.id === roadmapId);
  if (index === -1) return;

  const earnedXp = calculateEarnedXp(updatedRoadmap);
  const progress = calculateProgress(updatedRoadmap);

  existing[index].roadmapJson = updatedRoadmap;
  existing[index].earnedXp = earnedXp;
  existing[index].progress = progress;
  existing[index].markdown = buildMarkdownFromRoadmap(
    updatedRoadmap,
    existing[index].topic,
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

// --------------------------------------------------
// XP / progress calculations
// --------------------------------------------------

function calculateEarnedXp(roadmap: Roadmap): number {
  let earned = 0;
  for (const phase of roadmap.phases || []) {
    for (const week of phase.weeks || []) {
      for (const day of week.days || []) {
        if (day.completed) {
          earned += day.xp_reward || 0;
        } else {
          const allItems = [
            ...(day.learn_items || []),
            ...(day.practice_items || []),
            ...(day.project_items || []),
            ...(day.reflection_items || []),
          ];
          for (const item of allItems) {
            if (item.completed) {
              earned += item.xp || 0;
            }
          }
        }
      }
    }
  }
  return earned;
}

function calculateProgress(roadmap: Roadmap): number {
  let totalDays = 0;
  let completedDays = 0;

  for (const phase of roadmap.phases || []) {
    for (const week of phase.weeks || []) {
      for (const day of week.days || []) {
        totalDays++;
        if (day.completed) {
          completedDays++;
        }
      }
    }
  }

  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
}

function calculatePhaseProgress(phase: RoadmapPhase): number {
  let totalDays = 0;
  let completedDays = 0;

  for (const week of phase.weeks || []) {
    for (const day of week.days || []) {
      totalDays++;
      if (day.completed) {
        completedDays++;
      }
    }
  }

  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
}

function calculateWeekProgress(week: RoadmapWeek): number {
  const days = week.days || [];
  if (days.length === 0) return 0;

  const completed = days.filter((d) => d.completed).length;
  return Math.round((completed / days.length) * 100);
}

// --------------------------------------------------
// Markdown building
// --------------------------------------------------

function sectionHeading(level: number, text: string): string {
  return `${"#".repeat(level)} ${text}`.trim();
}

function formatResources(resources?: RoadmapResource[]): string {
  if (!resources || resources.length === 0) return "";
  const lines: string[] = [];
  lines.push(sectionHeading(5, "📚 Resources"));
  for (const r of resources) {
    const labelParts = [r.title];
    if (r.provider) labelParts.push(`(${r.provider})`);
    if (r.type) labelParts.push(`[${r.type}]`);
    const label = labelParts.join(" ");
    if (r.url) {
      lines.push(`- [${label}](${r.url})`);
    } else {
      lines.push(`- ${label}`);
    }
  }
  return lines.join("\n");
}

function formatDay(
  weekNumber: number,
  day: RoadmapDay,
  headingLevel = 4,
): string {
  const lines: string[] = [];
  const dayTitle =
    day.title || `Day ${day.day_number || ""}`.trim() || `Day ${day.day_number}`;

  const checkBox = day.completed ? "☑" : "☐";
  const xpBadge = day.xp_reward > 0 ? ` | 🏆 ${day.xp_reward} XP` : "";

  lines.push(
    sectionHeading(
      headingLevel,
      `${checkBox} Week ${weekNumber} – Day ${day.day_number}: ${dayTitle}${xpBadge}`,
    ),
  );

  if (day.time_estimate_hours) {
    lines.push(`⏱️ _~${day.time_estimate_hours.toFixed(1)} hours total_`);
  }

  const sections: {
    label: string;
    key: keyof RoadmapDay;
    emoji: string;
  }[] = [
      { label: "Learn", key: "learn_items", emoji: "📖" },
      { label: "Practice", key: "practice_items", emoji: "💪" },
      { label: "Mini Project / Challenge", key: "project_items", emoji: "🚀" },
      { label: "Reflection", key: "reflection_items", emoji: "💭" },
    ];

  for (const { label, key, emoji } of sections) {
    const items = (day[key] as RoadmapDayItem[] | undefined) ?? [];
    if (!items.length) continue;
    lines.push("");
    lines.push(sectionHeading(headingLevel + 1, `${emoji} ${label}`));
    for (const item of items) {
      const checkbox = item.completed ? "[x]" : "[ ]";
      const xpTag = item.xp > 0 ? ` _(+${item.xp} XP)_` : "";
      const base = item.description || "";
      if (item.resource && item.resource.url) {
        const resLabelParts = [item.resource.title || "Resource"];
        if (item.resource.provider) {
          resLabelParts.push(`(${item.resource.provider})`);
        }
        const resLabel = resLabelParts.join(" ");
        lines.push(
          `- ${checkbox} ${base}${xpTag} — [${resLabel}](${item.resource.url})`,
        );
      } else {
        lines.push(`- ${checkbox} ${base}${xpTag}`);
      }
    }
  }

  return lines.join("\n");
}

function inferPhaseWeekRange(phase: RoadmapPhase): { start: number; end: number } {
  const weeks = phase.weeks ?? [];
  if (!weeks.length) {
    return { start: phase.start_week ?? 1, end: phase.end_week ?? 1 };
  }
  const nums = weeks
    .map((w) => w.week_number)
    .filter((n) => typeof n === "number");
  if (!nums.length) return { start: 1, end: 1 };
  return {
    start: Math.min(...nums),
    end: Math.max(...nums),
  };
}

export function buildMarkdownFromRoadmap(roadmap: Roadmap, topic: string): string {
  const lines: string[] = [];

  const earnedXp = calculateEarnedXp(roadmap);
  const progress = calculateProgress(roadmap);

  // Title
  lines.push(sectionHeading(1, roadmap.title || `${topic} Roadmap`));
  lines.push("");
  lines.push(
    `> **Progress:** ${progress}% | **XP Earned:** ${earnedXp} / ${roadmap.total_xp || 0} 🏆`,
  );
  lines.push("");

  // Progress bar visualization
  const totalBars = 20;
  const filledBars = Math.round((progress / 100) * totalBars);
  const progressBar = "█".repeat(filledBars) + "░".repeat(totalBars - filledBars);
  lines.push(`\`${progressBar}\` ${progress}%`);
  lines.push("");

  // Overview
  lines.push(sectionHeading(2, "📋 Overview"));
  lines.push(`- **Topic:** ${topic}`);
  lines.push(`- **Level:** ${roadmap.level || "unspecified"}`);
  lines.push(`- **Duration:** ${roadmap.duration_weeks} weeks`);
  lines.push(`- **Weekly Commitment:** ${roadmap.hours_per_week} hours/week`);
  lines.push(`- **Total XP Available:** ${roadmap.total_xp || 0} 🏆`);
  if (roadmap.target_outcome) {
    lines.push(`- **Target Outcome:** ${roadmap.target_outcome}`);
  }
  if (roadmap.prerequisites) {
    lines.push(`- **Prerequisites:** ${roadmap.prerequisites}`);
  }
  if (roadmap.description) {
    lines.push("");
    lines.push(roadmap.description);
  }
  lines.push("\n---\n");

  const phases = [...(roadmap.phases ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  for (const phase of phases) {
    const { start, end } = inferPhaseWeekRange(phase);
    const phaseProgress = calculatePhaseProgress(phase);
    const phaseLabel =
      start === end
        ? `Phase ${phase.order}: ${phase.name} (Week ${start})`
        : `Phase ${phase.order}: ${phase.name} (Weeks ${start}–${end})`;

    lines.push(
      sectionHeading(2, `${phaseLabel} | ${phaseProgress}% ⭐`),
    );
    lines.push(`**🎯 Phase Goal:** ${phase.goal}`);
    lines.push(`**🏆 Phase XP:** ${phase.phase_xp || 0}`);
    if (phase.milestone_summary) {
      lines.push(`**🎖️ Milestone:** ${phase.milestone_summary}`);
    }
    lines.push("");

    const weeks = [...(phase.weeks ?? [])].sort(
      (a, b) => a.week_number - b.week_number,
    );

    for (const week of weeks) {
      const weekProgress = calculateWeekProgress(week);
      const weekCheckbox = weekProgress === 100 ? "☑" : "☐";

      lines.push(
        sectionHeading(
          3,
          `${weekCheckbox} Week ${week.week_number} – ${week.theme} | ${weekProgress}%`,
        ),
      );
      lines.push(`**Weekly Outcome:** ${week.outcome}`);
      lines.push(`**Week XP:** ${week.week_xp || 0} 🏆`);
      if (week.summary) {
        lines.push("");
        lines.push(week.summary);
      }

      const days = [...(week.days ?? [])].sort(
        (a, b) => a.day_number - b.day_number,
      );
      for (const day of days) {
        lines.push("");
        lines.push(formatDay(week.week_number, day, 4));
      }

      if (week.quiz_questions && week.quiz_questions.length) {
        lines.push("");
        lines.push(sectionHeading(4, "📝 Week Quiz"));
        week.quiz_questions.forEach((q, idx) => {
          lines.push(`${idx + 1}. ${q}`);
        });
      }

      if (week.weekly_resources && week.weekly_resources.length) {
        lines.push("");
        lines.push(formatResources(week.weekly_resources));
      }

      lines.push("\n---\n");
    }
  }

  return lines.join("\n");
}

// --------------------------------------------------
// Backend call
// --------------------------------------------------

/**
 * Call backend /api/roadmaps/generate and convert the JSON roadmap
 * to a premium Notion-style markdown export with XP tracking.
 */
export async function generateRoadmapWithAi(opts: {
  topic: string;
  level: string;
  durationWeeks: number;
  hoursPerWeek: number;
  background?: string;
  goal?: string;
}): Promise<GeneratedRoadmapResult> {
  const url = `${API_BASE}/roadmaps/generate`;
  console.log("Calling roadmap API:", url, "dev:", import.meta.env.DEV);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: opts.topic,
        level: opts.level,
        duration_weeks: opts.durationWeeks,
        hours_per_week: opts.hoursPerWeek,
        learner_background: opts.background,
        target_goal: opts.goal,
      }),
    });
  } catch (err) {
    console.error("Network error calling /api/roadmaps/generate:", err);
    throw new Error("Network error while calling roadmap API");
  }

  const rawText = await res.text();
  console.log(
    "Roadmap API status:",
    res.status,
    res.statusText,
    "| body (first 500):",
    rawText.slice(0, 500),
  );

  if (!res.ok) {
    throw new Error(
      `Failed to generate roadmap (${res.status}): ${rawText || res.statusText
      }`,
    );
  }

  let json: { roadmap: Roadmap };
  try {
    json = JSON.parse(rawText) as { roadmap: Roadmap };
  } catch (e) {
    console.error("Failed to parse roadmap API JSON:", e);
    throw new Error("Invalid JSON returned from roadmap API");
  }

  const roadmap = json.roadmap;
  const markdown = buildMarkdownFromRoadmap(roadmap, opts.topic);

  return { roadmap, markdown };
}
