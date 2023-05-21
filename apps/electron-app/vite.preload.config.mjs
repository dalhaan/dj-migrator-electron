import { resolve } from "path";

import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@dj-migrator/common": resolve(
        __dirname,
        "../../lib/common/src/index.ts"
      ),
      "@dj-migrator/node": resolve(__dirname, "../../lib/node/src/index.ts"),
    },
  },
});
