import { getAccessToken } from "./api";

// Use VITE_API_URL in production, fallback to /api for local dev with Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Send a chat message to the backend AI endpoint (non-streaming).
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
 * Stream a chat response from the AI (SSE).
 * Tokens appear as they're generated — like ChatGPT.
 *
 * @param message - User's message
 * @param onToken - Called with each text chunk as it arrives
 * @param onDone  - Called with the full assembled text and conversation_id
 * @param opts    - Optional conversation_id to continue a conversation
 */
export async function streamMessageFromAI(
  message: string,
  onToken: (text: string) => void,
  onDone: (fullText: string, conversationId: number | null) => void,
  opts?: { conversation_id?: number | null }
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body: Record<string, unknown> = { message };
  if (opts?.conversation_id != null) body.conversation_id = opts.conversation_id;

  try {
    const res = await fetch(`${API_BASE_URL}/ai/chat/stream`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      console.error("Streaming error:", res.status);
      onDone("⚠️ AI server returned an error.", null);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let conversationId: number | null = opts?.conversation_id ?? null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events (lines starting with "data: ")
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const evt = JSON.parse(jsonStr);

          if (evt.type === "conv") {
            conversationId = evt.conversation_id;
          } else if (evt.type === "delta") {
            onToken(evt.text || "");
          } else if (evt.type === "done") {
            onDone(evt.full_text || "", conversationId);
            return;
          } else if (evt.type === "error") {
            onDone("⚠️ " + (evt.message || "AI streaming error."), conversationId);
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // If we reach here without a "done" event, call onDone anyway
    onDone("", conversationId);
  } catch (err) {
    console.error("AI Stream Error:", err);
    onDone("⚠️ Could not connect to AI server.", null);
  }
}

/**
 * Stream a chat response from the School AI (SSE), tailored for Class 9-10.
 */
export async function streamMessageFromSchoolAI(
  message: string,
  onToken: (text: string) => void,
  onDone: (fullText: string, conversationId: number | null) => void,
  opts?: { conversation_id?: number | null }
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body: Record<string, unknown> = { message };
  if (opts?.conversation_id != null) body.conversation_id = opts.conversation_id;

  try {
    const res = await fetch(`${API_BASE_URL}/school/chat/stream`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      console.error("Streaming error:", res.status);
      onDone("⚠️ AI server returned an error.", null);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let conversationId: number | null = opts?.conversation_id ?? null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; 

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const evt = JSON.parse(jsonStr);

          if (evt.type === "conv") {
            conversationId = evt.conversation_id;
          } else if (evt.type === "delta") {
            onToken(evt.text || "");
          } else if (evt.type === "done") {
            onDone(evt.full_text || "", conversationId);
            return;
          } else if (evt.type === "error") {
            onDone("⚠️ " + (evt.message || "AI streaming error."), conversationId);
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    onDone("", conversationId);
  } catch (err) {
    console.error("AI Stream Error:", err);
    onDone("⚠️ Could not connect to AI server.", null);
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
