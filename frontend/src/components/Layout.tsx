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
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && <Sidebar onOpenAITutor={() => setAiTutorOpen(true)} />}
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {isMobile && <BottomNav onOpenAITutor={() => setAiTutorOpen(true)} />}
      
      <AITutorDrawer open={aiTutorOpen} onOpenChange={setAiTutorOpen} />
      <NotificationCenter />
    </div>
  );
};

export default Layout;
