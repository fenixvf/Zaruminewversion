import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isReplit = !!process.env.REPL_ID;
const isBuild = process.argv.includes("build");

const rawPort = process.env.PORT;
if (!rawPort && isReplit && !isBuild) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort || "3000");
if ((Number.isNaN(port) || port <= 0) && !isBuild) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || "/";

const plugins: any[] = [react(), tailwindcss()];

if (isReplit && !isBuild) {
  const [{ default: runtimeErrorOverlay }, cartographerMod, devBannerMod] = await Promise.all([
    import("@replit/vite-plugin-runtime-error-modal"),
    import("@replit/vite-plugin-cartographer"),
    import("@replit/vite-plugin-dev-banner"),
  ]);
  plugins.push(
    runtimeErrorOverlay(),
    cartographerMod.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
    devBannerMod.devBanner(),
  );
}

export default defineConfig({
  base: basePath,
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
