// frontend/src/hooks/usePlaygroundSettings.ts
// Persistent playground settings hook — localStorage for instant read,
// debounced backend sync for cross-device persistence.

import { useState, useEffect, useCallback, useRef } from "react";
import { settingsApi, PlaygroundSettings } from "@/lib/api";

// ─── Defaults ──────────────────────────────────────────────────────────────
export const SETTINGS_DEFAULTS: PlaygroundSettings = {
  layout_mode: "stacked",
  editor_panel_size: 62,
  output_panel_size: 38,
  font_size: 14,
  font_family: "JetBrains Mono",
  tab_size: 4,
  show_minimap: false,
  show_line_numbers: true,
  word_wrap: "off",
  show_whitespace: "selection",
  last_language_id: 71,
};

const LS_KEY = "eduai-playground-settings";

function readLocal(): PlaygroundSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...SETTINGS_DEFAULTS };
}

function writeLocal(s: PlaygroundSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

// ─── Layout presets ────────────────────────────────────────────────────────
export interface LayoutPreset {
  id: string;
  label: string;
  icon: string;        // emoji for quick recognition
  description: string;
  layout_mode: PlaygroundSettings["layout_mode"];
  editor_panel_size: number;
  output_panel_size: number;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    icon: "⚖️",
    description: "Equal focus on code and output",
    layout_mode: "stacked",
    editor_panel_size: 55,
    output_panel_size: 45,
  },
  {
    id: "code-focus",
    label: "Code Focus",
    icon: "💻",
    description: "Maximum editor space",
    layout_mode: "stacked",
    editor_panel_size: 75,
    output_panel_size: 25,
  },
  {
    id: "output-focus",
    label: "Output Focus",
    icon: "📋",
    description: "Larger output area for debugging",
    layout_mode: "stacked",
    editor_panel_size: 35,
    output_panel_size: 65,
  },
  {
    id: "wide-split",
    label: "Wide Split",
    icon: "🖥️",
    description: "Side-by-side for wide monitors",
    layout_mode: "side-by-side",
    editor_panel_size: 55,
    output_panel_size: 45,
  },
  {
    id: "zen",
    label: "Zen Mode",
    icon: "🧘",
    description: "Full editor, output in drawer",
    layout_mode: "editor-only",
    editor_panel_size: 100,
    output_panel_size: 0,
  },
];

// ─── Font families available ───────────────────────────────────────────────
export const FONT_FAMILIES = [
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "Cascadia Code",
  "Consolas",
  "Space Mono",
] as const;

// ─── Hook ──────────────────────────────────────────────────────────────────
export function usePlaygroundSettings() {
  const [settings, setSettings] = useState<PlaygroundSettings>(readLocal);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: fetch from backend (source of truth), merge with local
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await settingsApi.getPlayground();
        if (!cancelled) {
          const merged = { ...SETTINGS_DEFAULTS, ...remote };
          setSettings(merged);
          writeLocal(merged);
        }
      } catch {
        // Backend unreachable — use local settings (already loaded)
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced backend sync (500ms after last change)
  const syncToBackend = useCallback((updated: Partial<PlaygroundSettings>) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        setSyncing(true);
        await settingsApi.updatePlayground(updated);
      } catch {
        // Silent fail — localStorage is the fallback
      } finally {
        setSyncing(false);
      }
    }, 500);
  }, []);

  // Update one or more settings
  const updateSettings = useCallback(
    (patch: Partial<PlaygroundSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        writeLocal(next);
        syncToBackend(patch);
        return next;
      });
    },
    [syncToBackend]
  );

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings({ ...SETTINGS_DEFAULTS });
    writeLocal({ ...SETTINGS_DEFAULTS });
    syncToBackend({ ...SETTINGS_DEFAULTS });
  }, [syncToBackend]);

  // Apply a layout preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = LAYOUT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      updateSettings({
        layout_mode: preset.layout_mode,
        editor_panel_size: preset.editor_panel_size,
        output_panel_size: preset.output_panel_size,
      });
    },
    [updateSettings]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  return {
    settings,
    loaded,
    syncing,
    updateSettings,
    resetSettings,
    applyPreset,
  };
}
