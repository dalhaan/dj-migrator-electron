import { resolve } from "path";

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer"),
      "@org-name/common": resolve(__dirname, "../../lib/common/index.ts"),
    },
  },
});
