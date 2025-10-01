// Re-export core functionality (excluding base ParquetProvider to avoid Node.js DuckDB imports)
export { ArweaveQueryClient } from "../client.js";
export type * from "../types/index.js";
export { GraphQLProvider } from "../providers/transactions/graphql.js";
export * from "../utils/encoding.js";

// Web-specific exports
export * from "./cache/index.js";
export * from "./parquet.js";
