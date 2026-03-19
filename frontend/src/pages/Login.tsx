import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    background: "var(--surface2)",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
};

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

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "100vh", background: "#141414", padding: 16,
        }}>
            <div style={{
                width: "100%", maxWidth: 400,
                background: "#1e1e1e",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: 32,
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#f5c842", marginBottom: 8 }}>
                        ⚡ EduAI
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8e8" }}>Welcome back</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Sign in to continue learning</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                        />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: 12, color: "#7c5cfc", textDecoration: "none", fontWeight: 500 }}>
                                Forgot password?
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
                            onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: "12px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                            background: loading ? "#555" : "#7c5cfc", color: "#fff",
                            boxShadow: loading ? "none" : "0 0 16px rgba(124,92,252,0.3)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                            marginTop: 4,
                        }}
                    >
                        {loading ? "Logging in…" : "Login"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
                    Don't have an account?{" "}
                    <Link to="/register" style={{ color: "#7c5cfc", textDecoration: "none", fontWeight: 500 }}>
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
