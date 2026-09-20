import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.ts";
export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/integration/**/*.test.ts"],
      fileParallelism: false,
      testTimeout: 30000,
      hookTimeout: 30000,
    },
  }),
);
