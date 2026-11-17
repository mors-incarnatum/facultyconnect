import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  if (mode === "static") {
    return {
      base: "./",
      plugins: [react(), viteSingleFile()],
      // Keep generated cache outside the dependency directory, which may be read-only.
      cacheDir: ".vite",
      build: {
        outDir: "dist-static",
      },
    };
  }

  return {
    plugins: [react()],
    // Keep generated cache outside the dependency directory, which may be read-only.
    cacheDir: ".vite",
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": "http://localhost:5000",
      },
    },
  };
});
