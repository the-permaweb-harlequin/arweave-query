import { waddler } from "@atticusofsparta/waddler/duckdb-neo";
import {
  ParquetProvider,
  type ParquetProviderConfig,
} from "../providers/transactions/parquet.js";

export interface NodeParquetProviderConfig {
  parquetUrls: ParquetProviderConfig["parquetUrls"];
  gateway?: string;
  duckdbConfig?: {
    readOnly?: boolean;
    memory?: string;
  };
}

/**
 * Creates a ParquetProvider configured for Node.js environment
 * Uses duckdb-neo (native DuckDB) via Waddler
 */
export function createNodeParquetProvider(
  config: NodeParquetProviderConfig,
): ParquetProvider {
  const waddlerInstance = waddler({
    url: config.duckdbConfig?.memory || ":memory:",
    accessMode:
      (config.duckdbConfig?.readOnly ?? true) ? "read_only" : "read_write",
  });

  return new ParquetProvider({
    sqlInstance: waddlerInstance,
    parquetUrls: config.parquetUrls,
    gateway: config.gateway,
  });
}

/**
 * Re-export ParquetProvider for direct usage
 */
export { ParquetProvider } from "../providers/transactions/parquet.js";
export type { ParquetProviderConfig } from "../providers/transactions/parquet.js";
