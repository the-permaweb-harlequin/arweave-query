import type {
  ArweaveQueryClientConfig,
  TransactionsQueryFilter,
  QueryResult,
  QueryProvider,
  DataQueryConfig,
  DataProvider,
} from "./types/index.js";
import { Block, Transaction } from "./generated/graphql.js";
import { GraphQLProvider } from "./node.js";
import { WayfinderProvider } from "./providers/data/wayfinder.js";

export class ArweaveQueryClient implements QueryProvider, DataProvider {
  private transactionProvider: QueryProvider;
  private dataProvider: DataProvider;
  name = "arweave-query-client";

  constructor({
    transactionProvider = new GraphQLProvider("https://arweave.net/graphql"),
    dataProvider = new WayfinderProvider(),
  }: ArweaveQueryClientConfig) {
    this.transactionProvider = transactionProvider;
    this.dataProvider = dataProvider;
  }
  async getTransaction(id: string): Promise<Transaction> {
    return this.transactionProvider.getTransaction(id);
  }

  async getTransactions(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Transaction>> {
    return this.transactionProvider.getTransactions(filter);
  }

  async getBlock(id: string): Promise<Block | null> {
    return this.transactionProvider.getBlock(id);
  }

  async getBlocks(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Block>> {
    return this.transactionProvider.getBlocks(filter);
  }

  async getData<T>(
    params: DataQueryConfig,
  ): Promise<{ data: T; contentType: string | undefined }> {
    return this.dataProvider.getData(params);
  }

  async getDataStream<T>(
    params: DataQueryConfig,
  ): Promise<{ data: ReadableStream<T>; contentType: string | undefined }> {
    return this.dataProvider.getDataStream(params);
  }
}
