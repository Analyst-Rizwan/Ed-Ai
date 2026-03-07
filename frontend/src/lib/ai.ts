import { getAccessToken } from "./api";

// Use VITE_API_URL in production, fallback to /api for local dev with Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Send a chat message to the backend AI endpoint.
 * Supports conversation_id for persistent chat history.
 * Always returns { reply: string, conversation_id: number | null }.
 */
export async function sendMessageToAI(
  message: string,
  opts?: { temperature?: number; max_tokens?: number; conversation_id?: number | null }
): Promise<{ reply: string; conversation_id: number | null }> {
  try {
    const body: Record<string, unknown> = { message };
    if (opts?.temperature !== undefined) body.temperature = opts.temperature;
    if (opts?.max_tokens !== undefined) body.max_tokens = opts.max_tokens;
    if (opts?.conversation_id != null) body.conversation_id = opts.conversation_id;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("AI Server Error:", res.status, txt);
      return { reply: "⚠️ AI server returned an error.", conversation_id: null };
    }

    const data = await res.json().catch(() => null);
    if (!data || typeof data.reply !== "string") {
      return { reply: "⚠️ AI returned an invalid response.", conversation_id: null };
    }

    return {
      reply: data.reply.trim() || "⚠️ AI gave an empty response.",
      conversation_id: data.conversation_id ?? null,
    };
  } catch (err) {
    console.error("AI Network Error:", err);
    return { reply: "⚠️ Could not connect to AI server.", conversation_id: null };
  }
}

/**
 * Legacy wrapper — returns just the reply string for backward compat.
 */
export async function askAI(
  message: string,
  opts?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  const result = await sendMessageToAI(message, opts);
  return result.reply;
}

export default sendMessageToAI;
