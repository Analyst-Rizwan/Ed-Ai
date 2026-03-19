import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    background: "var(--surface2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

const Spinner = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{ animation: "edu-spin 0.8s linear infinite", flexShrink: 0 }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

const Register = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", full_name: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.register(formData);
            toast.success("Account created! Please login.");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)";
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = "var(--border2)";
        e.currentTarget.style.boxShadow = "none";
    };

    const fields = [
        { id: "username", label: "Username", type: "text", placeholder: "johndoe", required: true },
        { id: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true },
        { id: "full_name", label: "Full Name", type: "text", placeholder: "John Doe", required: false },
        { id: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
    ];

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% -10%, rgba(124,92,252,0.13) 0%, transparent 55%), var(--bg)",
            padding: 16,
        }}>
            <div style={{
                width: "100%", maxWidth: 420,
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 22, padding: "36px 36px 32px",
                boxShadow: "0 8px 48px rgba(0,0,0,0.28), 0 0 0 1px var(--border)",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                    <div style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700,
                        color: "var(--yellow)", marginBottom: 12,
                    }}>
                        ⚡ EduAI
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Create an account</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>Join EduAI and start learning</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {fields.map((f) => (
                        <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            <label htmlFor={f.id} style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{f.label}</label>
                            <input
                                id={f.id}
                                type={f.type}
                                placeholder={f.placeholder}
                                value={(formData as any)[f.id]}
                                onChange={handleChange}
                                required={f.required}
                                style={inputStyle}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "13px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                            background: loading ? "var(--surface2)" : "var(--accent)", color: "#fff",
                            boxShadow: loading ? "none" : "0 4px 20px var(--accent-glow)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.22s", fontFamily: "'DM Sans', sans-serif",
                            marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            opacity: loading ? 0.75 : 1,
                        }}
                    >
                        {loading ? <><Spinner /> Creating account…</> : "Create Account →"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 26, fontSize: 13, color: "var(--muted)" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                        Login
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes edu-spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Register;
