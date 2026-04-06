import { useState, useRef, useCallback } from "react";
import { Camera, Trash2, Loader2, Upload } from "lucide-react";
import { profileApi, User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  user: User;
  onUpdate: (user: User) => void;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { container: "h-16 w-16", icon: "h-4 w-4", ring: "ring-2" },
  md: { container: "h-24 w-24", icon: "h-5 w-5", ring: "ring-4" },
  lg: { container: "h-32 w-32", icon: "h-6 w-6", ring: "ring-4" },
};

export function AvatarUpload({ user, onUpdate, size = "md" }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const s = SIZES[size];

  const initials = (user.full_name || user.username || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      onUpdate(updated);
      toast({ title: "Avatar updated", description: "Your profile picture has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [onUpdate, toast]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploading(true);
    try {
      const updated = await profileApi.deleteAvatar();
      onUpdate(updated);
      toast({ title: "Avatar removed" });
    } catch (err: any) {
      toast({ title: "Failed to remove avatar", description: err?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`
          ${s.container} ${s.ring} ring-primary/20 rounded-full overflow-hidden
          relative cursor-pointer transition-all duration-200
          focus:outline-none focus:ring-primary/40
          ${dragOver ? "ring-primary scale-105" : "hover:ring-primary/30"}
        `}
        disabled={uploading}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || user.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-primary font-bold" style={{ fontSize: size === "lg" ? "2rem" : size === "md" ? "1.5rem" : "1rem" }}>
              {initials}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={`
          absolute inset-0 bg-black/50 flex items-center justify-center
          transition-opacity duration-200 rounded-full
          ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}>
          {uploading ? (
            <Loader2 className={`${s.icon} text-white animate-spin`} />
          ) : (
            <Camera className={`${s.icon} text-white`} />
          )}
        </div>
      </button>

      {/* Remove button */}
      {user.avatar_url && !uploading && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-destructive text-destructive-foreground
                     flex items-center justify-center shadow-md
                     opacity-0 group-hover:opacity-100 transition-all duration-200
                     hover:scale-110 focus:outline-none focus:opacity-100"
          title="Remove avatar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
