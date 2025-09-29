import { waddler } from "@atticusofsparta/waddler/duckdb-wasm";
import {
  ParquetProvider,
  type ParquetProviderConfig,
} from "../providers/transactions/parquet.js";

export interface WebParquetProviderConfig {
  parquetUrls: ParquetProviderConfig["parquetUrls"];
  gateway?: string;
  duckdbConfig?: {
    readOnly?: boolean;
    wasmUrl?: string;
    workerUrl?: string;
  };
}

/**
 * Creates a ParquetProvider configured for Web/Browser environment
 * Uses duckdb-wasm via Waddler
 */
export function createWebParquetProvider(
  config: WebParquetProviderConfig,
): ParquetProvider {
  const waddlerInstance = waddler({
    wasmUrl: config.duckdbConfig?.wasmUrl || "/duckdb.wasm",
    workerUrl: config.duckdbConfig?.workerUrl || "/worker.js",
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
