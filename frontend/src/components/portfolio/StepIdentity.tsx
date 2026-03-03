// frontend/src/components/portfolio/StepIdentity.tsx
import { useRef } from "react";
import type { PortfolioState } from "@/hooks/usePortfolioState";
import { AVATAR_EMOJIS } from "@/hooks/usePortfolioState";
import { sendMessageToAI } from "@/lib/ai";

interface Props {
    state: PortfolioState;
    setField: (key: keyof PortfolioState, value: string) => void;
    setAvatar: (emoji: string) => void;
}

const fieldInputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "var(--text)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: "none",
    transition: "border-color .15s",
};

const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "var(--muted)",
    fontWeight: 500,
    marginBottom: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};

const aiBtnStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--accent)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 6,
    background: "rgba(124,92,252,0.12)",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background .15s",
};

const StepIdentity = ({ state, setField, setAvatar }: Props) => {
    const bioRef = useRef<HTMLTextAreaElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const taglineRef = useRef<HTMLInputElement>(null);

    const flashField = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.borderColor = "var(--accent)";
        el.style.boxShadow = "0 0 0 3px rgba(124,92,252,0.25)";
        setTimeout(() => { el.style.borderColor = ""; el.style.boxShadow = ""; }, 1500);
    };

    const aiSuggestBio = async () => {
        try {
            const prompt = `Write a 2-3 sentence professional bio for a developer portfolio. Name: ${state.name || "a developer"}. Title: ${state.title || "Software Developer"}. Keep it concise and impressive. Return ONLY the bio text, no quotes.`;
            const result = await sendMessageToAI(prompt, { temperature: 0.8, max_tokens: 200 });
            if (result && !result.startsWith("⚠️")) {
                setField("bio", result);
                flashField(bioRef.current);
            }
        } catch {
            // Fallback
            const bios = [
                "Passionate developer building at the intersection of great engineering and great UX. Currently studying Computer Science and shipping side projects that solve real problems.",
                "Final-year CS student shipping side projects that solve real problems. I care deeply about code quality, performance, and the humans who use what I build.",
                "Engineer by training, builder by nature. I spend my weekends turning ideas into deployed products — and my weekdays studying the theory behind them.",
            ];
            setField("bio", bios[Math.floor(Math.random() * bios.length)]);
            flashField(bioRef.current);
        }
    };

    const aiSuggestTitle = async () => {
        try {
            const prompt = `Suggest a short professional title for a developer portfolio (max 6 words). Name: ${state.name || "Developer"}. Return ONLY the title, no quotes.`;
            const result = await sendMessageToAI(prompt, { temperature: 0.9, max_tokens: 30 });
            if (result && !result.startsWith("⚠️")) {
                setField("title", result);
                flashField(titleRef.current);
            }
        } catch {
            const titles = ["Full Stack Developer & CS Student", "Software Engineering Student | React · Node.js · Python", "CS Student & Open Source Contributor"];
            setField("title", titles[Math.floor(Math.random() * titles.length)]);
            flashField(titleRef.current);
        }
    };

    const aiSuggestTagline = async () => {
        try {
            const prompt = `Suggest a short portfolio tagline/CTA (max 10 words). E.g. "Open to internships · Building in public". Return ONLY the tagline, no quotes.`;
            const result = await sendMessageToAI(prompt, { temperature: 0.9, max_tokens: 30 });
            if (result && !result.startsWith("⚠️")) {
                setField("tagline", result);
                flashField(taglineRef.current);
            }
        } catch {
            const taglines = [
                "Open to internships · Building in public · Available from June 2025",
                "CS student · Full stack developer · Available for summer internships",
                "Shipping side projects · Open to work",
            ];
            setField("tagline", taglines[Math.floor(Math.random() * taglines.length)]);
            flashField(taglineRef.current);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Your Identity</div>
                <div style={{ fontSize: 12, color: "var(--muted2)" }}>This is your first impression. Make every word count.</div>
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>Full Name</div>
                <input
                    style={fieldInputStyle}
                    value={state.name}
                    onChange={e => setField("name", e.target.value)}
                    placeholder="Mohamed Rizwan Ansaari"
                />
            </div>

            {/* Professional Title */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>
                    Professional Title
                    <button style={aiBtnStyle} onClick={aiSuggestTitle}>✦ Suggest</button>
                </div>
                <input
                    ref={titleRef}
                    style={fieldInputStyle}
                    value={state.title}
                    onChange={e => setField("title", e.target.value)}
                    placeholder="Full Stack Developer & CS Student"
                />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>
                    Elevator Pitch (Bio)
                    <button style={aiBtnStyle} onClick={aiSuggestBio}>✦ AI Write</button>
                </div>
                <textarea
                    ref={bioRef}
                    style={{ ...fieldInputStyle, resize: "none", lineHeight: 1.6, minHeight: 80 }}
                    value={state.bio}
                    onChange={e => setField("bio", e.target.value)}
                    placeholder="Write a 2–3 sentence bio..."
                    rows={4}
                />
            </div>

            {/* Location & Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                    <div style={fieldLabelStyle}>Location</div>
                    <input
                        style={fieldInputStyle}
                        value={state.location}
                        onChange={e => setField("location", e.target.value)}
                        placeholder="London, UK"
                    />
                </div>
                <div>
                    <div style={fieldLabelStyle}>Email</div>
                    <input
                        style={fieldInputStyle}
                        value={state.email}
                        onChange={e => setField("email", e.target.value)}
                        placeholder="you@email.com"
                    />
                </div>
            </div>

            {/* GitHub */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>GitHub Username</div>
                <input
                    style={fieldInputStyle}
                    value={state.github}
                    onChange={e => setField("github", e.target.value)}
                    placeholder="your-username"
                />
            </div>

            {/* LinkedIn & Website */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div>
                    <div style={fieldLabelStyle}>LinkedIn URL</div>
                    <input
                        style={fieldInputStyle}
                        value={state.linkedin}
                        onChange={e => setField("linkedin", e.target.value)}
                        placeholder="linkedin.com/in/..."
                    />
                </div>
                <div>
                    <div style={fieldLabelStyle}>Personal URL</div>
                    <input
                        style={fieldInputStyle}
                        value={state.website}
                        onChange={e => setField("website", e.target.value)}
                        placeholder="yoursite.dev"
                    />
                </div>
            </div>

            {/* Tagline */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>
                    Tagline / CTA
                    <button style={aiBtnStyle} onClick={aiSuggestTagline}>✦ Suggest</button>
                </div>
                <input
                    ref={taglineRef}
                    style={fieldInputStyle}
                    value={state.tagline}
                    onChange={e => setField("tagline", e.target.value)}
                    placeholder="Available for internships · Open to opportunities"
                />
            </div>

            {/* Avatar Emoji Picker */}
            <div style={{ marginBottom: 16 }}>
                <div style={fieldLabelStyle}>Avatar Emoji</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {AVATAR_EMOJIS.map(emoji => (
                        <div
                            key={emoji}
                            onClick={() => setAvatar(emoji)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: "var(--surface2)",
                                border: `2px solid ${state.avatar === emoji ? "var(--accent)" : "rgba(255,255,255,0.12)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                cursor: "pointer",
                                transition: "all .15s",
                            }}
                        >
                            {emoji}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StepIdentity;
