import type { CacheProvider } from '../types/index.js';

export interface LevelCacheConfig {
  location?: string;
  ttl?: number;
}

export class LevelCache implements CacheProvider {
  private db: any;
  private defaultTtl: number;

  constructor(levelInstance: any, config: LevelCacheConfig = {}) {
    this.db = levelInstance;
    this.defaultTtl = config.ttl || 3600000; // 1 hour default
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.db.get(key);
      const parsed = JSON.parse(data);
      
      // Check if expired
      if (parsed.expires && Date.now() > parsed.expires) {
        await this.delete(key);
        return null;
      }
      
      return parsed.value;
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl : Date.now() + this.defaultTtl;
    const data = JSON.stringify({
      value,
      expires,
      created: Date.now(),
    });
    
    await this.db.put(key, data);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db.del(key);
    } catch (error: any) {
      if (error.code !== 'LEVEL_NOT_FOUND') {
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    await this.db.clear();
  }
}
