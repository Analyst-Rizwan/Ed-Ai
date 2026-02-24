import { useState } from "react";
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

    const fields = [
        { id: "username", label: "Username", type: "text", placeholder: "johndoe", required: true },
        { id: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true },
        { id: "full_name", label: "Full Name", type: "text", placeholder: "John Doe", required: false },
        { id: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
    ];

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
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8e8" }}>Create an account</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Join EduAI and start learning</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {fields.map((f) => (
                        <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>{f.label}</label>
                            <input
                                id={f.id}
                                type={f.type}
                                placeholder={f.placeholder}
                                value={(formData as any)[f.id]}
                                onChange={handleChange}
                                required={f.required}
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                            />
                        </div>
                    ))}

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
                        {loading ? "Creating account…" : "Register"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#7c5cfc", textDecoration: "none", fontWeight: 500 }}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
