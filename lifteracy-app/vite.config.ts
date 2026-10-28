import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [react()],
  // The games in src/games are copied from this repo's Next.js site and
  // import each other as "@/components/…" and "@/lib/…", as they do there.
  resolve: { alias: { "@": fileURLToPath(new URL("./src/games", import.meta.url)) } },
  // Relative asset paths, so the build loads inside the Android WebView.
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
