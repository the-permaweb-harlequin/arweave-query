import type {
  ArweaveQueryClientConfig,
  QueryFilter,
  QueryResult,
  ArweaveTransaction,
  QueryOptions,
  QueryProvider,
  CacheProvider,
} from './types/index.js';

export class ArweaveQueryClient {
  private providers: Map<string, QueryProvider> = new Map();
  private cache?: CacheProvider;
  private defaultProvider?: string;

  constructor(config: ArweaveQueryClientConfig) {
    config.providers.forEach((provider) => {
      this.providers.set(provider.name, provider);
    });
    
    this.cache = config.cache;
    this.defaultProvider = config.defaultProvider || config.providers[0]?.name;
  }

  async query(
    filter: QueryFilter,
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName!);
    
    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    const cacheKey = options.cache !== false ? this.getCacheKey(filter, providerName!) : null;
    
    // Try cache first
    if (cacheKey && this.cache) {
      const cached = await this.cache.get<QueryResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Query provider
    const result = await provider.query(filter);

    // Cache result
    if (cacheKey && this.cache && options.cache !== false) {
      await this.cache.set(cacheKey, result, options.cacheTtl);
    }

    return result;
  }

  async getTransaction(
    id: string,
    options: QueryOptions = {}
  ): Promise<ArweaveTransaction | null> {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName!);
    
    if (!provider) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    const cacheKey = options.cache !== false ? `tx:${id}:${providerName}` : null;
    
    // Try cache first
    if (cacheKey && this.cache) {
      const cached = await this.cache.get<ArweaveTransaction>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Query provider
    const result = await provider.getTransaction(id);

    // Cache result
    if (cacheKey && this.cache && result && options.cache !== false) {
      await this.cache.set(cacheKey, result, options.cacheTtl);
    }

    return result;
  }

  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  private getCacheKey(filter: QueryFilter, provider: string): string {
    return `query:${provider}:${JSON.stringify(filter)}`;
  }
}
