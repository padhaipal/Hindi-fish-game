import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.lifteracy.teacher",
  appName: "LIFTeracy",
  webDir: "dist",
  plugins: {
    // Send fetch through Android's native HTTP, so the STT APIs aren't
    // blocked by CORS.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
