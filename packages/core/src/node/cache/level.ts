import { Level } from "level";
import { LevelCache, type LevelCacheConfig } from "../../cache/level.js";

export interface NodeLevelCacheConfig extends LevelCacheConfig {
  location: string;
}

export class NodeLevelCache extends LevelCache {
  constructor(config: NodeLevelCacheConfig) {
    const db = new Level<string, string>(config.location, {
      valueEncoding: "utf8",
      keyEncoding: "utf8",
    });
    super(db, config);
  }
}
