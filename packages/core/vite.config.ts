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
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        // GraphQL - keep as peer dependencies
        "graphql",
        "graphql-request",
        "graphql-tag",

        // DuckDB - native bindings must stay external
        "duckdb",
        "@duckdb/duckdb-wasm",
        "@duckdb/node-api",
        /^@duckdb\/.*/,

        // Waddler - utility wrapper, external with subpath exports
        "@atticusofsparta/waddler",
        /^@atticusofsparta\/waddler\/.*/,

        // Wayfinder - data provider, external
        "@ar.io/wayfinder-core",

        // Storage - has native bindings
        "level",
        "level-web",
        "memory-level",

        // Node built-ins
        /^node:.*/,
        "crypto",
        "stream",
        "os",
        "path",
        "fs",
        "util",
      ],
      output: [
        {
          // ESM output
          format: "es",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].js",
        },
        {
          // CJS output
          format: "cjs",
          preserveModules: true,
          preserveModulesRoot: "src",
          entryFileNames: "[name].cjs",
        },
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
