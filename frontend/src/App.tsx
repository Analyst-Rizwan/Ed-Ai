import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Roadmaps from "./pages/Roadmaps";
import Practice from "./pages/Practice";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import InterviewPrep from "./pages/InterviewPrep";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import GitHubCallback from "./pages/GitHubCallback";
import { ProtectedRoute } from "./routes/ProtectedRoute";

// Lazy-loaded pages (heavy dependencies, not needed on initial load)
const Admin = lazy(() => import("./pages/Admin"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const PortfolioBuilder = lazy(() => import("./pages/PortfolioBuilder"));
const DSAVisualizer = lazy(() => import("./pages/DSAVisualizer"));
import LandingPage from "./pages/LandingPage";
import { Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const PublicHome = () => {
  const { user, isLoading } = useAuth();
  // Show the landing page immediately while auth initializes (avoids blank flash on logout)
  if (isLoading) return <LandingPage />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
};


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min: don't refetch on every navigation
      gcTime: 10 * 60 * 1000,     // 10 min: keep unused data in cache
      retry: 1,                    // fail fast instead of 3 retries
      refetchOnWindowFocus: false, // don't refetch just because user switched tabs
    },
  },
});

const App = () => {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/github/callback" element={<GitHubCallback />} />

                <Route path="/" element={<PublicHome />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="roadmaps" element={<Roadmaps />} />
                    <Route path="practice" element={<Practice />} />
                    <Route path="dsa" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><DSAVisualizer /></Suspense>} />
                    <Route path="opportunities" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Opportunities /></Suspense>} />
                    <Route path="portfolio" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><PortfolioBuilder /></Suspense>} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="interview-prep" element={<InterviewPrep />} />
                    <Route path="admin" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Admin /></Suspense>} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
