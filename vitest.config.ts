import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` is exported only under Node's `react-server`
      // condition. Vitest's Node env doesn't satisfy it; stub the import
      // to a no-op so server-tagged modules are testable.
      "server-only": fileURLToPath(
        new URL("./lib/test-utils/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["lib/**/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
