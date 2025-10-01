import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    name: "integration-browser",
    include: ["tests/integration/browser/**/*.test.ts"],
    globals: true,
    testTimeout: 120000, // 2 minutes for queries
    hookTimeout: 120000,
    globalSetup: ["./tests/integration/global-setup.ts"],
    setupFiles: ["./tests/integration/browser/setup.ts"],
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      screenshotFailures: false,
    },
    // Expose environment variables to browser tests
    env: {
      ARIO_API_URL: process.env.ARIO_API_URL || "",
      ARIO_GRAPHQL_URL: process.env.ARIO_GRAPHQL_URL || "",
      ARIO_DATASETS_URL: process.env.ARIO_DATASETS_URL || "",
      ARIO_PORT: process.env.ARIO_PORT || "",
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
        find: /^@arweave-query\/core\/web$/,
        replacement: resolve(__dirname, "./dist/web.js"),
      },
      {
        find: /^@arweave-query\/core\/node$/,
        replacement: resolve(__dirname, "./dist/node.js"),
      },
      {
        find: /^@arweave-query\/core$/,
        replacement: resolve(__dirname, "./dist/index.js"),
      },
    ],
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js DuckDB packages from browser bundling
      "duckdb",
      "@duckdb/node-api",
      "@duckdb/node-bindings",
      "@duckdb/node-bindings-darwin-x64",
      "@duckdb/node-bindings-darwin-arm64",
      "@duckdb/node-bindings-linux-x64",
      "@duckdb/node-bindings-linux-arm64",
      "@duckdb/node-bindings-win32-x64",
      "@atticusofsparta/waddler/duckdb-neo", // Exclude Node.js waddler variant
    ],
  },
  build: {
    rollupOptions: {
      external: [
        // Mark Node.js DuckDB as external - should never be bundled for browser
        "duckdb",
        "@duckdb/node-api",
        /^@duckdb\/node-bindings/,
        "@atticusofsparta/waddler/duckdb-neo", // Exclude Node.js waddler variant
      ],
    },
  },
  // Browser-specific server configuration
  server: {
    fs: {
      // Don't serve Node.js-specific modules
      deny: [
        "**/node_modules/duckdb/**",
        "**/node_modules/@duckdb/node-api/**",
        "**/node_modules/@duckdb/node-bindings*/**",
      ],
    },
  },
});
