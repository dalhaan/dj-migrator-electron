import { resolve } from "path";

import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@ffmpeg/ffmpeg"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/main"),
      "~/common": resolve(__dirname, "src/common"),
      "@dj-migrator/common": resolve(
        __dirname,
        "../../lib/common/src/index.ts"
      ),
      "@dj-migrator/node": resolve(__dirname, "../../lib/node/src/index.ts"),
    },
  },
});
