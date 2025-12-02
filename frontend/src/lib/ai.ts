// frontend/src/lib/ai.ts
const API_BASE_URL =
  (import.meta.env.VITE_API_URL && (import.meta.env.VITE_API_URL as string).trim()) ||
  "http://127.0.0.1:8000/api";

/**
 * Send a chat message to the backend AI endpoint.
 * Always returns a string (fallback friendly messages on error).
 */
export async function sendMessageToAI(
  message: string,
  opts?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  try {
    // Use 'prompt' for /test endpoint instead of 'message' for /chat
    const body: Record<string, unknown> = { prompt: message };
    if (opts?.temperature !== undefined) body.temperature = opts.temperature;
    if (opts?.max_tokens !== undefined) body.max_tokens = opts.max_tokens;

    console.log("Sending to AI:", body); // Debug log

    // Using /test endpoint which doesn't require authentication
    const res = await fetch(`${API_BASE_URL}/ai/test`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(body),
    });

    console.log("Response status:", res.status); // Debug log

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("AI Server Error:", res.status, txt);
      return `⚠️ AI server returned an error (${res.status}).`;
    }

    const data = await res.json().catch(() => null);
    console.log("AI Response data:", data); // Debug log
    
    // Backend returns 'response'
    if (!data || typeof data.response !== "string") {
      console.error("Unexpected AI response format:", data);
      return "⚠️ AI returned an invalid response.";
    }
    
    return data.response.trim() || "⚠️ AI gave an empty response.";
  } catch (err) {
    console.error("AI Network Error:", err);
    return "⚠️ Could not connect to AI server.";
  }
}

// convenience named export used by components
export const askAI = sendMessageToAI;

export default sendMessageToAI;