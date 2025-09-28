// Node.js specific exports
import { Level } from 'level';
import Database from 'duckdb';
import { LevelCache } from './cache/level.js';
import { ParquetProvider } from './providers/parquet.js';

export * from './index.js';

// Node.js specific implementations
export function createNodeCache(location: string = './cache') {
  const db = new Level(location);
  return new LevelCache(db);
}

export function createNodeParquetProvider(config: {
  parquetUrls?: string[];
  gateway?: string;
} = {}) {
  const db = new Database(':memory:');
  return new ParquetProvider({
    duckdbInstance: db,
    ...config,
  });
}
