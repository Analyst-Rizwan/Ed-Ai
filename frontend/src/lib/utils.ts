// ---------------------------------------------------------
// utils.ts
// Global utilities used across the entire frontend
// ---------------------------------------------------------

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a Date or ISO string to a relative time format.
 * Examples:
 *  - "just now"
 *  - "5m ago"
 *  - "3h ago"
 *  - "2d ago"
 */
export function relativeTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "unknown";

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Generate a clean random ID for mock/demo use.
 */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Backend API URL (VERY IMPORTANT!)
 * If VITE_API_URL isn't provided, it falls back to local FastAPI.
 *
 * Example:
 *   import { API_BASE_URL } from "@/lib/utils";
 *   fetch(`${API_BASE_URL}/ai/chat`)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
