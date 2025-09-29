import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
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
        "graphql",
        "graphql-request",
        "duckdb",
        "@duckdb/duckdb-wasm",
        "level",
        "level-web",
      ],
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
