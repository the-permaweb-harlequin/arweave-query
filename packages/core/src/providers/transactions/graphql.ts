import { GraphQLClient } from "graphql-request";
import type {
  QueryProvider,
  TransactionsQueryFilter,
  QueryResult,
  BlocksQueryFilter,
} from "../../types/index.js";
import { getSdk, Transaction, Block } from "../../generated/graphql.js";

export class GraphQLProvider implements QueryProvider {
  name = "graphql";
  private client: GraphQLClient;
  private sdk: ReturnType<typeof getSdk>;

  constructor(endpoint: string = "https://arweave.net/graphql") {
    this.client = new GraphQLClient(endpoint);
    this.sdk = getSdk(this.client);
  }

  async getTransaction(id: string): Promise<Transaction> {
    const result = await this.sdk.transaction({ id });
    if (!result.transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }
    return result.transaction;
  }

  async getTransactions(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Transaction>> {
    const res = await this.sdk.transactions(filter);
    const data = res.transactions.edges.map((edge) => edge.node);
    const hasNextPage = res.transactions.pageInfo.hasNextPage;
    const cursor =
      res.transactions.edges[res.transactions.edges.length - 1].cursor;
    const next = hasNextPage
      ? async () =>
          this.getTransactions({
            ...filter,
            after: cursor,
          })
      : undefined;
    return {
      data,
      hasNextPage,
      cursor,
      next,
    };
  }

  async getBlock(id: string): Promise<Block> {
    const result = await this.sdk.block({ id });
    if (!result.block) {
      throw new Error(`Block not found: ${id}`);
    }
    return result.block;
  }

  async getBlocks(filter: BlocksQueryFilter): Promise<QueryResult<Block>> {
    const res = await this.sdk.blocks(filter);
    const data = res.blocks.edges.map((edge) => edge.node);
    const hasNextPage = res.blocks.pageInfo.hasNextPage;
    const cursor = res.blocks.edges[res.blocks.edges.length - 1].cursor;
    const next = hasNextPage
      ? async () => this.getBlocks({ ...filter, after: cursor })
      : undefined;
    return {
      data,
      hasNextPage,
      cursor,
      next,
    };
  }
}
