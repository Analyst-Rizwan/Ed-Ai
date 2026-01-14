// Use relative URL to leverage Vite's proxy (see vite.config.ts)
// This avoids double /api/api issues when VITE_API_URL includes /api
const API_BASE_URL = "/api";

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

    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
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
