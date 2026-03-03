// frontend/src/hooks/usePortfolioState.ts
import { useState, useCallback, useEffect } from "react";

// ============================================================
// TYPES
// ============================================================
export interface Project {
    id: number;
    name: string;
    desc: string;
    tech: string[];
    url: string;
    github: string;
    featured: boolean;
    emoji: string;
    impact: string;
}

export interface Experience {
    id: number;
    type: "work" | "education";
    role: string;
    org: string;
    period: string;
    desc: string;
    emoji: string;
}

export interface Sections {
    hero: boolean;
    projects: boolean;
    skills: boolean;
    experience: boolean;
    contact: boolean;
}

export interface ThemeConfig {
    bg: string;
    surface: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    font: string;
}

export interface PortfolioState {
    currentStep: number;
    theme: string;
    accent: string;
    font: string;
    layout: string;
    animation: string;
    avatar: string;
    sections: Sections;
    projects: Project[];
    skills: Record<string, string[]>;
    experience: Experience[];
    customCSS: string;
    // Identity fields
    name: string;
    title: string;
    bio: string;
    location: string;
    email: string;
    github: string;
    linkedin: string;
    website: string;
    tagline: string;
}

// ============================================================
// CONSTANTS
// ============================================================
export const THEMES: Record<string, ThemeConfig> = {
    dark: {
        bg: "#0d0d0d", surface: "#161616", card: "#1c1c1c",
        text: "#e8e8e8", muted: "#666", border: "rgba(255,255,255,0.08)",
        accent: "#7c5cfc", font: "DM Sans",
    },
    terminal: {
        bg: "#0a0f0a", surface: "#0d130d", card: "#111911",
        text: "#00ff41", muted: "#00aa2a", border: "rgba(0,255,65,0.15)",
        accent: "#00ff41", font: "Space Mono",
    },
    minimal: {
        bg: "#fafafa", surface: "#ffffff", card: "#f5f5f3",
        text: "#1a1a1a", muted: "#999", border: "rgba(0,0,0,0.08)",
        accent: "#2563eb", font: "DM Sans",
    },
    glass: {
        bg: "#0d0d1a", surface: "rgba(255,255,255,0.04)", card: "rgba(255,255,255,0.06)",
        text: "#e8e8ff", muted: "#667", border: "rgba(255,255,255,0.1)",
        accent: "#818cf8", font: "DM Sans",
    },
    retro: {
        bg: "#120800", surface: "#1a0c00", card: "#221000",
        text: "#ff9900", muted: "#aa5500", border: "rgba(255,153,0,0.15)",
        accent: "#ff6600", font: "Space Mono",
    },
    ocean: {
        bg: "#030d1a", surface: "#051525", card: "#07203a",
        text: "#c8e6ff", muted: "#4a7fa5", border: "rgba(91,141,240,0.15)",
        accent: "#38bdf8", font: "DM Sans",
    },
};

export const ACCENT_COLORS = [
    "#7c5cfc", "#e85d4a", "#f4924a", "#f5c842", "#4acf82",
    "#3ec6c6", "#5b8df0", "#b46ef5", "#ff4988", "#00d9ff",
];

export const FONTS = [
    { name: "DM Sans", sample: "Clean & Modern", css: "'DM Sans', sans-serif" },
    { name: "Space Mono", sample: "Technical Monospace", css: "'Space Mono', monospace" },
    { name: "Playfair Display", sample: "Elegant Serif", css: "'Playfair Display', serif" },
    { name: "Sora", sample: "Rounded & Friendly", css: "'Sora', sans-serif" },
];

export const ANIM_OPTIONS = ["None", "Fade", "Slide Up", "Float", "Typewriter"];

export const SKILL_GROUPS: Record<string, string[]> = {
    Languages: ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "Swift", "Kotlin", "Ruby", "PHP", "C#"],
    Frontend: ["React", "Next.js", "Vue", "Angular", "Svelte", "Tailwind", "CSS", "SASS", "HTML5", "Three.js", "Framer Motion"],
    Backend: ["Node.js", "Express", "Django", "FastAPI", "Spring Boot", "REST APIs", "GraphQL", "tRPC", "WebSockets"],
    Databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Supabase", "Firebase", "DynamoDB"],
    Tools: ["Git", "Docker", "Linux", "Figma", "VS Code", "Webpack", "Vite", "Jest", "Cypress", "Postman"],
    Cloud: ["AWS", "GCP", "Azure", "Vercel", "Netlify", "GitHub Actions", "Kubernetes", "Terraform", "CI/CD"],
};

export const AVATAR_EMOJIS = ["👨‍💻", "👩‍💻", "🧑‍💻", "🧑‍🎓", "👨‍🎓", "🦾", "🤖", "🧠", "⚡", "🔥"];

export const GITHUB_REPOS = [
    { name: "devtracker", lang: "JavaScript", stars: 14, desc: "Full-stack task management with real-time features" },
    { name: "algovisualiser", lang: "JavaScript", stars: 31, desc: "Interactive sorting algorithm visualisation" },
    { name: "ml-experiments", lang: "Python", stars: 7, desc: "Collection of ML experiments and notebooks" },
    { name: "portfolio-v1", lang: "HTML", stars: 3, desc: "My old portfolio site" },
    { name: "api-gateway", lang: "TypeScript", stars: 12, desc: "Simple API gateway with rate limiting" },
    { name: "weather-app", lang: "React", stars: 5, desc: "OpenWeather API integration with geolocation" },
];

const STORAGE_KEY = "eduai_portfolio_state";

// ============================================================
// DEFAULT STATE
// ============================================================
const defaultState: PortfolioState = {
    currentStep: 0,
    theme: "dark",
    accent: "#7c5cfc",
    font: "DM Sans",
    layout: "centered",
    animation: "Fade",
    avatar: "👨‍💻",
    sections: { hero: true, projects: true, skills: true, experience: true, contact: true },
    projects: [
        { id: 1, name: "DevTracker", desc: "A full-stack task management app with real-time collaboration built with React, Node.js and Socket.IO.", tech: ["React", "Node.js", "Socket.IO", "MongoDB"], url: "https://devtracker.vercel.app", github: "https://github.com/mohamad-dev/devtracker", featured: true, emoji: "📋", impact: "Used by 200+ developers" },
        { id: 2, name: "AlgoVisualiser", desc: "Interactive algorithm visualisation tool that animates sorting and pathfinding algorithms step by step.", tech: ["JavaScript", "Canvas API", "CSS"], url: "", github: "https://github.com/mohamad-dev/algovis", featured: true, emoji: "🔍", impact: "Built for CS students" },
        { id: 3, name: "WeatherNow", desc: "Clean weather app using OpenWeatherMap API with geolocation and 7-day forecasts.", tech: ["React", "API Integration", "CSS Modules"], url: "https://weathernow.netlify.app", github: "https://github.com/mohamad-dev/weather", featured: false, emoji: "🌤", impact: "" },
    ],
    skills: {
        Languages: ["JavaScript", "TypeScript", "Python", "Java", "C++"],
        Frontend: ["React", "Next.js", "Vue", "Tailwind", "CSS"],
        Backend: ["Node.js", "Express", "Django", "REST APIs", "GraphQL"],
        Databases: ["PostgreSQL", "MongoDB", "Redis"],
        Tools: ["Git", "Docker", "Linux", "VS Code", "Figma"],
        Cloud: [],
    },
    experience: [
        { id: 1, type: "education", role: "BSc Computer Science", org: "University of Manchester", period: "2022 – Present", desc: "First class predicted. Modules: Algorithms, Distributed Systems, ML, Web Technologies.", emoji: "🎓" },
        { id: 2, type: "work", role: "Junior Developer Intern", org: "Tech Startup London", period: "Summer 2024", desc: "Built React components for a fintech dashboard. Reduced bundle size by 30% through code splitting.", emoji: "💼" },
    ],
    customCSS: "",
    name: "",
    title: "",
    bio: "",
    location: "",
    email: "",
    github: "",
    linkedin: "",
    website: "",
    tagline: "",
};

// ============================================================
// HOOK
// ============================================================
export function usePortfolioState() {
    const [state, setState] = useState<PortfolioState>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return { ...defaultState, ...JSON.parse(saved) };
        } catch { /* ignore */ }
        return defaultState;
    });

    const [projectIdCounter, setProjectIdCounter] = useState(100);
    const [expIdCounter, setExpIdCounter] = useState(100);

    // Auto-save to localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 400);
        return () => clearTimeout(timer);
    }, [state]);

    // ── Step navigation ──
    const goStep = useCallback((n: number) => {
        setState(s => ({ ...s, currentStep: n }));
    }, []);

    const nextStep = useCallback(() => {
        setState(s => ({ ...s, currentStep: Math.min(s.currentStep + 1, 4) }));
    }, []);

    const prevStep = useCallback(() => {
        setState(s => ({ ...s, currentStep: Math.max(s.currentStep - 1, 0) }));
    }, []);

    // ── Identity fields ──
    const setField = useCallback((key: keyof PortfolioState, value: string) => {
        setState(s => ({ ...s, [key]: value }));
    }, []);

    // ── Avatar ──
    const setAvatar = useCallback((emoji: string) => {
        setState(s => ({ ...s, avatar: emoji }));
    }, []);

    // ── Theme ──
    const applyTheme = useCallback((key: string) => {
        const t = THEMES[key];
        if (!t) return;
        setState(s => ({ ...s, theme: key, accent: t.accent, font: t.font }));
    }, []);

    const setAccent = useCallback((color: string) => {
        setState(s => ({ ...s, accent: color }));
    }, []);

    const setFont = useCallback((font: string) => {
        setState(s => ({ ...s, font }));
    }, []);

    const setLayout = useCallback((layout: string) => {
        setState(s => ({ ...s, layout }));
    }, []);

    const setAnimation = useCallback((animation: string) => {
        setState(s => ({ ...s, animation }));
    }, []);

    const setCustomCSS = useCallback((customCSS: string) => {
        setState(s => ({ ...s, customCSS }));
    }, []);

    // ── Section toggles ──
    const toggleSection = useCallback((key: keyof Sections) => {
        setState(s => ({
            ...s,
            sections: { ...s.sections, [key]: !s.sections[key] },
        }));
    }, []);

    // ── Skills ──
    const toggleSkill = useCallback((group: string, skill: string) => {
        setState(s => {
            const groupSkills = [...(s.skills[group] || [])];
            const idx = groupSkills.indexOf(skill);
            if (idx > -1) groupSkills.splice(idx, 1);
            else groupSkills.push(skill);
            return { ...s, skills: { ...s.skills, [group]: groupSkills } };
        });
    }, []);

    const addCustomSkill = useCallback((skill: string) => {
        if (!skill.trim()) return;
        setState(s => {
            const tools = [...(s.skills.Tools || []), skill.trim()];
            return { ...s, skills: { ...s.skills, Tools: tools } };
        });
    }, []);

    // ── Projects ──
    const addProject = useCallback(() => {
        const id = projectIdCounter + 1;
        setProjectIdCounter(id);
        const p: Project = {
            id, name: "New Project",
            desc: "Describe what this project does and the problem it solves.",
            tech: [], url: "", github: "", featured: false, emoji: "💡", impact: "",
        };
        setState(s => ({ ...s, projects: [...s.projects, p] }));
    }, [projectIdCounter]);

    const deleteProject = useCallback((id: number) => {
        setState(s => ({ ...s, projects: s.projects.filter(p => p.id !== id) }));
    }, []);

    const updateProject = useCallback((id: number, key: keyof Project, value: any) => {
        setState(s => ({
            ...s,
            projects: s.projects.map(p => p.id === id ? { ...p, [key]: value } : p),
        }));
    }, []);

    const importProjects = useCallback((repos: typeof GITHUB_REPOS, username: string) => {
        let counter = projectIdCounter;
        const newProjects: Project[] = repos.map(r => {
            counter++;
            return {
                id: counter,
                name: r.name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                desc: r.desc, tech: [r.lang], url: "",
                github: `https://github.com/${username}/${r.name}`,
                featured: false, emoji: "💻", impact: "",
            };
        });
        setProjectIdCounter(counter);
        setState(s => ({ ...s, projects: [...s.projects, ...newProjects] }));
    }, [projectIdCounter]);

    // ── Experience ──
    const addExperience = useCallback(() => {
        const id = expIdCounter + 1;
        setExpIdCounter(id);
        const e: Experience = {
            id, type: "work", role: "New Role", org: "Company / University",
            period: "2024 – Present", desc: "Describe your responsibilities and achievements.", emoji: "💼",
        };
        setState(s => ({ ...s, experience: [...s.experience, e] }));
    }, [expIdCounter]);

    const deleteExperience = useCallback((id: number) => {
        setState(s => ({ ...s, experience: s.experience.filter(e => e.id !== id) }));
    }, []);

    const updateExperience = useCallback((id: number, key: keyof Experience, value: any) => {
        setState(s => ({
            ...s,
            experience: s.experience.map(e => e.id === id ? { ...e, [key]: value } : e),
        }));
    }, []);

    return {
        state,
        setState,
        goStep, nextStep, prevStep,
        setField, setAvatar,
        applyTheme, setAccent, setFont, setLayout, setAnimation, setCustomCSS,
        toggleSection, toggleSkill, addCustomSkill,
        addProject, deleteProject, updateProject, importProjects,
        addExperience, deleteExperience, updateExperience,
    };
}
