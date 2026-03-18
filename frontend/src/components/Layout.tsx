import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import AITutorDrawer from "./AITutorDrawer";
import NotificationCenter from "./NotificationCenter";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)", transition: "background 0.25s ease" }}>
      {!isMobile && <Sidebar onOpenAITutor={() => setAiTutorOpen(true)} />}

      <main style={{
        flex: 1,
        overflowY: "auto",
        padding: isMobile ? "16px" : "32px 36px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
        background: "var(--bg)",
        transition: "background 0.25s ease",
      }}>
        <Outlet />
        {/* Spacer so content is never hidden behind the fixed bottom nav */}
        {isMobile && <div style={{ minHeight: "calc(var(--bottom-nav-h, 80px) + 8px)", flexShrink: 0 }} />}
      </main>

      {isMobile && <BottomNav onOpenAITutor={() => setAiTutorOpen(true)} />}

      <AITutorDrawer open={aiTutorOpen} onOpenChange={setAiTutorOpen} />
      <NotificationCenter />

      <style>{`
        main::-webkit-scrollbar { width: 5px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: #252525; border-radius: 99px; }
      `}</style>
    </div>
  );
};

export default Layout;
