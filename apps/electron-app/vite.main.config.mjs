import { resolve } from "path";

import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/main"),
      "@dj-migrator/node": resolve(__dirname, "../../lib/node/src/index.ts"),
    },
  },
});
