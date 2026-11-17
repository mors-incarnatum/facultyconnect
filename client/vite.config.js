import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(function ({ mode }) {
    const env = loadEnv(mode, process.cwd(), "");
    const clientPort = Number(env.VITE_CLIENT_PORT) || 3000;
    const apiPrefix = env.VITE_API_PREFIX || "/api";
    const apiTarget = env.VITE_API_TARGET || "http://localhost:5000";

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
            port: clientPort,
            strictPort: true,
            proxy: {
                [apiPrefix]: apiTarget,
            },
        },
    };
});
