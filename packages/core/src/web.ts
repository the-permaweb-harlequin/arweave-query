// Web/Browser specific exports
import * as duckdb from '@duckdb/duckdb-wasm';
import { LevelCache } from './cache/level.js';
import { ParquetProvider } from './providers/parquet.js';

export * from './index.js';

// Web specific implementations
export function createWebCache(name: string = 'arweave-query-cache') {
  // For web, we'll use a simple in-memory cache or IndexedDB wrapper
  // This would need to be implemented based on your browser storage needs
  throw new Error('Web cache implementation needed - consider using IndexedDB or similar');
}

export async function createWebParquetProvider(config: {
  parquetUrls?: string[];
  gateway?: string;
} = {}) {
  // Initialize DuckDB WASM
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  
  return new ParquetProvider({
    duckdbInstance: db,
    ...config,
  });
}
