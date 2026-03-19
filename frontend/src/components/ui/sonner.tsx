import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = !document.documentElement.classList.contains("light");

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      position="top-right"
      richColors
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          color: "var(--text)",
          borderRadius: "14px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        },
        classNames: {
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
