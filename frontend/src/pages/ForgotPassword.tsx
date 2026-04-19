import { useState } from "react";

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    background: "var(--surface2, #252525)",
    border: "1px solid var(--border2, rgba(255,255,255,0.11))",
    color: "var(--text, #e8e8e8)",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
};

const otpInputStyle: React.CSSProperties = {
    width: 48, height: 56,
    textAlign: "center",
    fontSize: 22, fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    borderRadius: 12,
    background: "var(--surface2, #252525)",
    border: "1px solid var(--border2, rgba(255,255,255,0.11))",
    color: "var(--text, #e8e8e8)",
    outline: "none",
    transition: "border-color 0.2s",
};

const ForgotPassword = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ── Step 1: Send OTP ──
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
            toast.success("Reset code sent! Check your email.");
            setStep(2);
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            toast.error("Please enter the full 6-digit code");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Invalid code");
            toast.success("Code verified!");
            setStep(3);
        } catch (err: any) {
            toast.error(err.message || "Invalid or expired code");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: Reset Password ──
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        setLoading(true);
        try {
            const code = otp.join("");
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to reset password");
            toast.success("Password reset! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // ── OTP digit input handler ──
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (value && !/^\d$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Auto-focus next
        if (value && index < 5) {
            const next = document.getElementById(`otp-${index + 1}`);
            next?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prev = document.getElementById(`otp-${index - 1}`);
            prev?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(""));
            const last = document.getElementById("otp-5");
            last?.focus();
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error("Failed to resend");
            toast.success("New code sent!");
            setOtp(["", "", "", "", "", ""]);
        } catch {
            toast.error("Failed to resend code");
        } finally {
            setLoading(false);
        }
    };

    // ── Step indicators ──
    const steps = ["Email", "Verify", "Reset"];

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
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#f5c842", marginBottom: 8 }}>
                        ⚡ EduAI
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#e8e8e8" }}>Reset Password</div>
                </div>

                {/* Step indicator */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                    {steps.map((s, i) => (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700,
                                background: step > i + 1 ? "#4acf82" : step === i + 1 ? "#7c5cfc" : "#252525",
                                color: step >= i + 1 ? "#fff" : "#888",
                                transition: "all 0.3s",
                                fontFamily: "'Space Mono', monospace",
                            }}>
                                {step > i + 1 ? "✓" : i + 1}
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 500,
                                color: step === i + 1 ? "#e8e8e8" : "#666",
                            }}>{s}</span>
                            {i < 2 && <div style={{ width: 24, height: 1, background: step > i + 1 ? "#4acf82" : "#333" }} />}
                        </div>
                    ))}
                </div>

                {/* ── STEP 1: EMAIL ── */}
                {step === 1 && (
                    <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
                            Enter your email and we'll send you a 6-digit reset code.
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)"; }}
                            />
                        </div>
                        <button type="submit" disabled={loading} style={{
                            padding: "12px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                            background: loading ? "#555" : "#7c5cfc", color: "#fff",
                            boxShadow: loading ? "none" : "0 0 16px rgba(124,92,252,0.3)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                        }}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                )}

                {/* ── STEP 2: VERIFY OTP ── */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                        <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
                            Enter the 6-digit code sent to <strong style={{ color: "#e8e8e8" }}>{email}</strong>
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`otp-${i}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                    style={{
                                        ...otpInputStyle,
                                        borderColor: digit ? "#7c5cfc" : "rgba(255,255,255,0.11)",
                                    }}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                        <button type="submit" disabled={loading} style={{
                            width: "100%", padding: "12px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                            background: loading ? "#555" : "#7c5cfc", color: "#fff",
                            boxShadow: loading ? "none" : "0 0 16px rgba(124,92,252,0.3)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
                        }}>
                            {loading ? "Verifying..." : "Verify Code"}
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            style={{
                                background: "none", border: "none", color: "#7c5cfc",
                                fontSize: 13, cursor: "pointer", fontWeight: 500,
                            }}
                        >
                            Didn't receive it? Resend code
                        </button>
                    </form>
                )}

                {/* ── STEP 3: NEW PASSWORD ── */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ fontSize: 13, color: "#888", textAlign: "center" }}>
                            Choose a new password for your account.
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>New Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ ...inputStyle, paddingRight: 42 }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)"; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    style={{
                                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "#888", padding: 4, display: "flex", alignItems: "center",
                                        opacity: 0.6, transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                                >
                                    {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "#e8e8e8" }}>Confirm Password</label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ ...inputStyle, paddingRight: 42 }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cfc"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)"; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    style={{
                                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "#888", padding: 4, display: "flex", alignItems: "center",
                                        opacity: 0.6, transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} style={{
                            padding: "12px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                            background: loading ? "#555" : "#4acf82", color: "#fff",
                            boxShadow: loading ? "none" : "0 0 16px rgba(74,207,130,0.3)",
                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                            transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                        }}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                {/* Back to login */}
                <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
                    <Link to="/login" style={{ color: "#7c5cfc", textDecoration: "none", fontWeight: 500 }}>
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
