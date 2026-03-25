import React, { createContext, useContext, useEffect, useState } from "react";
import { User, authApi, setAccessToken } from "@/lib/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
        }
    };

    const initAuth = async () => {
        setIsLoading(true);
        try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
        } catch {
            // Not logged in — this is expected for guests
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initAuth();
    }, []);

    const login = async (token: string) => {
        setAccessToken(token);
        await refreshUser();
    };

    const logout = async () => {
        // 1. Call backend logout FIRST (while we still have a valid access token)
        //    This ensures the refresh_token cookie is properly deleted server-side
        try {
            await authApi.logout();
        } catch {
            /* ignore errors — will still clear client-side state */
        }
        // 2. Clear client-side state
        setAccessToken(null);
        setUser(null);
        // 3. Hard redirect to root so the app reinitializes cleanly
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
