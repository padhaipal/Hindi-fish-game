import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build loads inside the Android WebView.
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
