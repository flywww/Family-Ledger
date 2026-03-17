import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 20000,
  },
});
