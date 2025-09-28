export interface ArweaveTransaction {
  id: string;
  owner: string;
  target?: string;
  quantity: string;
  reward: string;
  last_tx: string;
  tags: Array<{ name: string; value: string }>;
  data_size: string;
  data_root: string;
  signature: string;
  block?: {
    id: string;
    height: number;
    timestamp: number;
  };
}

export interface QueryFilter {
  owners?: string[];
  recipients?: string[];
  tags?: Array<{ name: string; values: string[] }>;
  block?: {
    min?: number;
    max?: number;
  };
  first?: number;
  after?: string;
}

export interface QueryResult<T = ArweaveTransaction> {
  data: T[];
  hasNextPage: boolean;
  cursor?: string;
  totalCount?: number;
}

export interface QueryProvider {
  name: string;
  query(filter: QueryFilter): Promise<QueryResult>;
  getTransaction(id: string): Promise<ArweaveTransaction | null>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ArweaveQueryClientConfig {
  providers: QueryProvider[];
  cache?: CacheProvider;
  defaultProvider?: string;
}

export interface QueryOptions {
  provider?: string;
  cache?: boolean;
  cacheTtl?: number;
}
