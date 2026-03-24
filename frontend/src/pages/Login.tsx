import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await authApi.login(email, password);
            await login(data.access_token);
            toast.success("Logged in successfully");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
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

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% -10%, rgba(124,92,252,0.13) 0%, transparent 55%), var(--bg)",
            padding: 16,
        }}>
            <div className="auth-card" style={{
                width: "100%", maxWidth: 420,
                background: "var(--surface)",
                border: "1px solid var(--border2)",
                borderRadius: 22, padding: "36px 36px 32px",
                boxShadow: "0 8px 48px rgba(0,0,0,0.28), 0 0 0 1px var(--border)",
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700,
                        color: "var(--yellow)", marginBottom: 12,
                        display: "inline-flex", alignItems: "center", gap: 8,
                    }}>
                        ⚡ EduAI
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>Welcome back</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>Sign in to continue learning</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                                Reset password?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>

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
                        {loading ? <><Spinner /> Logging in…</> : "Login →"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 26, fontSize: 13, color: "var(--muted)" }}>
                    Don't have an account?{" "}
                    <Link to="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                        Register
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes edu-spin { to { transform: rotate(360deg); } }
                .auth-card { transition: box-shadow 0.3s; }
            `}</style>
        </div>
    );
};

export default Login;
