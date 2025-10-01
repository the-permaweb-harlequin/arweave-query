import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    name: "integration-browser",
    include: ["tests/integration/browser/**/*.test.ts"],
    globals: true,
    testTimeout: 120000, // 2 minutes for container startup
    hookTimeout: 120000,
    setupFiles: ["./tests/integration/browser/setup.ts"],
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      screenshotFailures: false,
    },
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
        find: /^@the-permaweb-harlequin\/arweave-query\/core\/web$/,
        replacement: resolve(__dirname, "./dist/web.js"),
      },
      {
        find: /^@the-permaweb-harlequin\/arweave-query\/core\/node$/,
        replacement: resolve(__dirname, "./dist/node.js"),
      },
      {
        find: /^@the-permaweb-harlequin\/arweave-query\/core$/,
        replacement: resolve(__dirname, "./dist/index.js"),
      },
    ],
  },
});
