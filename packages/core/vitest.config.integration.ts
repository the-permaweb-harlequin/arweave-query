import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    name: "integration-node",
    environment: "node",
    include: ["tests/integration/node/**/*.test.ts"],
    globals: true,
    testTimeout: 180000, // 3 minutes for queries
    hookTimeout: 240000, // 4 minutes for container startup
    setupFiles: ["./tests/integration/node/setup.ts"],
    // Run integration tests serially to avoid port conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@the-permaweb-harlequin\/arweave-query\/core\/node$/,
        replacement: resolve(__dirname, "./dist/node.js"),
      },
      {
        find: /^@the-permaweb-harlequin\/arweave-query\/core\/web$/,
        replacement: resolve(__dirname, "./dist/web.js"),
      },
      {
        find: /^@the-permaweb-harlequin\/arweave-query\/core$/,
        replacement: resolve(__dirname, "./dist/index.js"),
      },
    ],
  },
});
