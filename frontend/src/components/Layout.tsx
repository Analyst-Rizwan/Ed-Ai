import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import AITutorDrawer from "./AITutorDrawer";

import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

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
        {/* Page transition wrapper — key changes on route, triggering CSS animation */}
        <div key={location.pathname} className="page-fade">
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Outlet />
          </div>
        </div>
        {isMobile && <div style={{ minHeight: "calc(var(--bottom-nav-h, 80px) + 8px)", flexShrink: 0 }} />}
      </main>

      {isMobile && <BottomNav onOpenAITutor={() => setAiTutorOpen(true)} />}

      <AITutorDrawer open={aiTutorOpen} onOpenChange={setAiTutorOpen} />


      <style>{`
        main::-webkit-scrollbar { width: 5px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
        @keyframes page-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-fade { animation: page-fade-in 0.28s ease both; }
      `}</style>
    </div>
  );
};

export default Layout;
