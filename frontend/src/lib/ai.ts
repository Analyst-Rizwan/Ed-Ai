const API_BASE_URL =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  "http://127.0.0.1:8000";

/**
 * Send a chat message to the backend AI endpoint.
 * Always returns a string (fallback friendly messages on error).
 */
export async function sendMessageToAI(
  message: string,
  opts?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  try {
    const body: Record<string, unknown> = { message };
    if (opts?.temperature !== undefined) body.temperature = opts.temperature;
    if (opts?.max_tokens !== undefined) body.max_tokens = opts.max_tokens;

    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("AI Server Error:", res.status, txt);
      return "⚠️ AI server returned an error.";
    }

    const data = await res.json().catch(() => null);
    if (!data || typeof data.reply !== "string") {
      return "⚠️ AI returned an invalid response.";
    }

    return data.reply.trim() || "⚠️ AI gave an empty response.";
  } catch (err) {
    console.error("AI Network Error:", err);
    return "⚠️ Could not connect to AI server.";
  }
}

export const askAI = sendMessageToAI;
export default sendMessageToAI;
