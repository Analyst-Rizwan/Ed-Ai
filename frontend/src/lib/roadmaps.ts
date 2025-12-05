// frontend/src/lib/roadmaps.ts
import { askAI } from "./ai";

export interface SavedRoadmap {
  id: string;
  title: string;
  topic: string;
  level: string;
  durationWeeks: number;
  hoursPerWeek: number;
  createdAt: string;
  markdown: string;
}

const STORAGE_KEY = "edai_saved_roadmaps_v1";

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

/**
 * Calls the existing /api/ai/chat endpoint (via askAI) and asks it
 * to return a *Notion-style markdown* roadmap with day-by-day tasks.
 */
export async function generateRoadmapMarkdown(opts: {
  topic: string;
  level: string;
  durationWeeks: number;
  hoursPerWeek: number;
  background?: string;
  goal?: string;
}): Promise<string> {
  const { topic, level, durationWeeks, hoursPerWeek, background, goal } = opts;

  const prompt = `
You are an expert curriculum designer and study planner.

Create a COMPLETE learning ROADMAP as *Notion-friendly Markdown* for this learner:

- Topic/Skill: ${topic}
- Level: ${level}
- Total duration: ${durationWeeks} weeks
- Time per week: ${hoursPerWeek} hours
- Learner background: ${background || "not specified"}
- Target goal: ${goal || "not specified"}

Constraints:
- Make it **day-by-day** (Week X, Day Y) with clear tasks.
- Assume 5–6 study days per week, adjust automatically.
- For each **week**, include:
  - A short "Weekly Theme" / focus
  - Weekly outcome
- For each **day**, include:
  - A short title
  - Estimated total time (e.g., "1.5h")
  - 3–6 checklist items using "- [ ]"
  - Mix of *Learn / Practice / Project / Review*
  - Optional mini-challenge or reflection

Format rules (VERY IMPORTANT):
- RESPOND ONLY WITH MARKDOWN. No prose outside the roadmap.
- Use this structure:

# {Roadmap Title}

## Overview
- Level: ...
- Duration: ... weeks
- Hours per week: ...
- Target outcome: ...
- Prerequisites: ...

---

# Phase 1 – {Name} (Weeks 1–X)
## Week 1 – {Theme}
### Day 1 – {Short title}
- [ ] Task 1
- [ ] Task 2
...

### Day 2 – ...
...

## Week 2 – ...

---

Continue phases/weeks until all ${durationWeeks} weeks are covered.
Make it realistic for ${hoursPerWeek} hours/week.
`.trim();

  // askAI already uses the backend env + /api/ai/chat
  const markdown = await askAI(prompt, {
    temperature: 0.35,
    max_tokens: 2800,
  });

  return markdown;
}
