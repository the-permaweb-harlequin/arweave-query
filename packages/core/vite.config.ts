import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/examples/**",
        "**/tests/**",
      ],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        node: resolve(__dirname, "src/node.ts"),
        web: resolve(__dirname, "src/web.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        // GraphQL
        "graphql",
        "graphql-request",
        "graphql-tag",

        // DuckDB - exclude all DuckDB packages and bindings
        "duckdb",
        "@duckdb/duckdb-wasm",
        "@duckdb/node-api",
        /^@duckdb\/.*/,

        // Waddler
        "@atticusofsparta/waddler",

        // Storage
        "level",
        "level-web",
        "memory-level",

        // Wayfinder
        "@ar.io/wayfinder-core",

        // Node built-ins
        /^node:.*/,
        "crypto",
        "stream",
        "os",
        "path",
        "fs",
        "util",
      ],
    },
  },
  test: {
    environment: "node",
    globals: true,
    // Exclude integration tests from default test command
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/integration/**", // Only run unit tests by default
    ],
  },
});
