import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: "manifest.json",
      watchFilePaths: ["src/**/*"],
      additionalInputs: [],
      browser: "chrome",
      disableAutoLaunch: true,
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "assets",
});
