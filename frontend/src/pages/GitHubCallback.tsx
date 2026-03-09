import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

const GitHubCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            setStatus("error");
            toast.error("No authorization code provided by GitHub.");
            setTimeout(() => navigate("/portfolio"), 2000);
            return;
        }

        const connectGithub = async () => {
            try {
                const res = await api.github.connect(code);
                setStatus("success");
                toast.success(`Successfully connected to GitHub as ${res.github_username}!`);
                setTimeout(() => navigate("/portfolio"), 1500);
            } catch (err: any) {
                console.error("GitHub connection error:", err);
                setStatus("error");
                toast.error(err.message || "Failed to connect to GitHub");
                setTimeout(() => navigate("/portfolio"), 2000);
            }
        };

        connectGithub();
    }, [searchParams, navigate]);

    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "100vh", background: "var(--bg)", color: "var(--text)"
        }}>
            {status === "processing" && (
                <>
                    <div style={{ fontSize: 40, marginBottom: 20, animation: "spin 2s linear infinite" }}>⏳</div>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>Connecting to GitHub...</div>
                </>
            )}
            {status === "success" && (
                <>
                    <div style={{ fontSize: 40, marginBottom: 20 }}>✅</div>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>Connected successfully!</div>
                    <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Redirecting back to builder...</div>
                </>
            )}
            {status === "error" && (
                <>
                    <div style={{ fontSize: 40, marginBottom: 20 }}>❌</div>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>Connection failed</div>
                    <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>Redirecting back to builder...</div>
                </>
            )}
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GitHubCallback;
