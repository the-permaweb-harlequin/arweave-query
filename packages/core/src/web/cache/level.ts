import { Level } from "level";
import { MemoryLevel } from "memory-level";
import { LevelCache, type LevelCacheConfig } from "../../cache/level.js";

export interface WebLevelCacheConfig extends LevelCacheConfig {
  // Web implementation uses IndexedDB or memory fallback
  useMemory?: boolean;
  dbName?: string;
}

export class WebLevelCache extends LevelCache {
  constructor(config: WebLevelCacheConfig = {}) {
    let db: Level<string, string> | MemoryLevel<string, string>;

    if (config.useMemory || typeof indexedDB === "undefined") {
      // Fallback to memory-level for environments without IndexedDB
      db = new MemoryLevel<string, string>({
        valueEncoding: "utf8",
        keyEncoding: "utf8",
      });
    } else {
      // Use Level with browser-level for IndexedDB support
      db = new Level<string, string>(config.dbName || "arweave-query-cache", {
        valueEncoding: "utf8",
        keyEncoding: "utf8",
      });
    }

    super(db, config);
  }
}
