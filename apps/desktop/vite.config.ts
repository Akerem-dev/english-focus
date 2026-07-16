import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function splitVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/react-router/") ||
    id.includes("/react-router-dom/") ||
    id.includes("/scheduler/")
  ) {
    return "vendor-react";
  }

  if (id.includes("/zod/")) {
    return "vendor-validation";
  }

  if (id.includes("/@tauri-apps/")) {
    return "vendor-tauri";
  }

  return undefined;
}

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 420,
    cssCodeSplit: true,
    reportCompressedSize: true,
    sourcemap: false,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: splitVendorChunk
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"]
    }
  }
});
