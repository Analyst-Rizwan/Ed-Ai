import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from "sonner";

const NotificationCenter = () => {
  const [hasNotifications, setHasNotifications] = useState(true);

  const showNotification = () => {
    toast.success("7-Day Streak Milestone!", {
      description: "Keep up the amazing work! You've earned 100 XP.",
      duration: 5000,
    });
    setHasNotifications(false);
  };

  return (
    <div className="fixed top-4 right-4 z-40">
      <Button
        size="icon"
        variant="outline"
        className="relative glass"
        onClick={showNotification}
      >
        <Bell className="h-5 w-5" />
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
        )}
      </Button>
    </div>
  );
};

export default NotificationCenter;
