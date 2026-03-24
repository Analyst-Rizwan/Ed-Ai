// vite.config.ts
import { defineConfig } from "file:///D:/Ed-!/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Ed-!/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\Ed-!\\frontend";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        // FastAPI backend
        changeOrigin: true
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cached aggressively
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI framework
          "vendor-ui": ["@tanstack/react-query", "lucide-react"],
          // Markdown + KaTeX — heavy, only used by AI Tutor
          "vendor-markdown": [
            "react-markdown",
            "remark-gfm",
            "remark-math",
            "rehype-katex"
          ]
        }
      }
    },
    // Enable source maps only in dev
    sourcemap: mode === "development",
    // Increase chunk size warning limit (KaTeX fonts are large but fine)
    chunkSizeWarningLimit: 600
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxFZC0hXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxFZC0hXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9FZC0hL2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Ly8gZnJvbnRlbmQvdml0ZS5jb25maWcudHNcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODAsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vMTI3LjAuMC4xOjgwMDBcIiwgLy8gRmFzdEFQSSBiYWNrZW5kXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gU3BsaXQgdmVuZG9yIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gUmVhY3QgY29yZSBcdTIwMTQgcmFyZWx5IGNoYW5nZXMsIGNhY2hlZCBhZ2dyZXNzaXZlbHlcbiAgICAgICAgICBcInZlbmRvci1yZWFjdFwiOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gICAgICAgICAgLy8gVUkgZnJhbWV3b3JrXG4gICAgICAgICAgXCJ2ZW5kb3ItdWlcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsIFwibHVjaWRlLXJlYWN0XCJdLFxuICAgICAgICAgIC8vIE1hcmtkb3duICsgS2FUZVggXHUyMDE0IGhlYXZ5LCBvbmx5IHVzZWQgYnkgQUkgVHV0b3JcbiAgICAgICAgICBcInZlbmRvci1tYXJrZG93blwiOiBbXG4gICAgICAgICAgICBcInJlYWN0LW1hcmtkb3duXCIsXG4gICAgICAgICAgICBcInJlbWFyay1nZm1cIixcbiAgICAgICAgICAgIFwicmVtYXJrLW1hdGhcIixcbiAgICAgICAgICAgIFwicmVoeXBlLWthdGV4XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBFbmFibGUgc291cmNlIG1hcHMgb25seSBpbiBkZXZcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIixcbiAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgKEthVGVYIGZvbnRzIGFyZSBsYXJnZSBidXQgZmluZSlcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQTtBQUFBLElBRUwsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUV6RCxhQUFhLENBQUMseUJBQXlCLGNBQWM7QUFBQTtBQUFBLFVBRXJELG1CQUFtQjtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXLFNBQVM7QUFBQTtBQUFBLElBRXBCLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
