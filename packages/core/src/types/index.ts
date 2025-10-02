import {
  BlockFilter,
  TagFilter,
  SortOrder,
  Transaction,
  Block,
} from "../generated/graphql";

export interface TransactionsQueryFilter {
  owners?: string[];
  recipients?: string[];
  tags?: TagFilter[];
  block?: BlockFilter;
  first?: number;
  after?: string;
  sort?: SortOrder;
}

export interface BlocksQueryFilter {
  ids?: string[];
  height?: BlockFilter;
  first?: number;
  after?: string;
}

export interface QueryResult<T = Transaction> {
  data: T[];
  hasNextPage: boolean;
  cursor?: string;
  next?: () => Promise<QueryResult<T>>;
}

export function isDataQueryById(
  query: DataQueryConfig,
): query is DataQueryById {
  return "id" in query;
}

export type DataQueryById = {
  id: string;
};

export function isDataQueryByOffset(
  query: DataQueryConfig,
): query is DataQueryByOffset {
  return (
    "rootParentId" in query &&
    "rootParentOffset" in query &&
    "dataOffset" in query &&
    "dataLength" in query
  );
}

export type DataQueryByOffset = {
  rootParentId: string; // L1 tx id
  rootParentOffset: number;
  dataOffset: number;
  dataLength: number;
};

export type DataQueryConfig = DataQueryById | DataQueryByOffset;

export interface QueryProvider {
  name: string;
  // tx headers
  getTransaction(id: string): Promise<Transaction>;
  getTransactions(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Transaction>>;
  getBlock(id: string): Promise<Block | null>;
  getBlocks(filter: TransactionsQueryFilter): Promise<QueryResult<Block>>;
}

export interface DataProvider {
  getData<T>(
    params: DataQueryConfig,
  ): Promise<{ data: T; contentType: string | undefined }>;
  getDataStream<T>(
    params: DataQueryConfig,
  ): Promise<{ data: ReadableStream<T>; contentType: string | undefined }>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ArweaveQueryClientConfig {
  transactionProvider?: QueryProvider;
  dataProvider?: DataProvider;
  cache?: CacheProvider;
}

export interface QueryOptions {
  provider?: string;
  cache?: boolean;
  cacheTtl?: number;
}
