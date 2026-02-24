import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Log to an error reporting service in production
        console.error("ErrorBoundary caught:", error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        padding: "2rem",
                        fontFamily: "Inter, system-ui, sans-serif",
                        background: "hsl(224 71% 4%)",
                        color: "hsl(213 31% 91%)",
                    }}
                >
                    <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                        Something went wrong
                    </h1>
                    <p
                        style={{
                            color: "hsl(215 20% 65%)",
                            maxWidth: "480px",
                            textAlign: "center",
                            marginBottom: "1.5rem",
                        }}
                    >
                        The application encountered an unexpected error. Please try
                        refreshing the page.
                    </p>
                    <pre
                        style={{
                            padding: "1rem",
                            borderRadius: "0.5rem",
                            background: "hsl(224 71% 8%)",
                            maxWidth: "600px",
                            overflow: "auto",
                            fontSize: "0.85rem",
                            marginBottom: "1.5rem",
                            color: "hsl(0 84% 60%)",
                        }}
                    >
                        {this.state.error?.message}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: "0.75rem 2rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            background: "hsl(262 83% 58%)",
                            color: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "1rem",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
