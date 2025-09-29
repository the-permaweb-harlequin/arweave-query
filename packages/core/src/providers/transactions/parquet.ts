import type { SQL } from "@atticusofsparta/waddler";
import type {
  QueryProvider,
  TransactionsQueryFilter,
  BlocksQueryFilter,
  QueryResult,
} from "../../types/index.js";
import type { Transaction, Block } from "../../generated/graphql.js";

export interface ParquetProviderConfig {
  sqlInstance: SQL;
  parquetUrls: {
    blocks: string;
    transactions: string;
    tags: string;
  };
  gateway?: string;
}

export class ParquetProvider implements QueryProvider {
  name = "parquet";
  private sql: SQL;
  protected readonly parquetUrls: ParquetProviderConfig["parquetUrls"];
  protected readonly gateway: string;

  constructor({
    sqlInstance,
    parquetUrls,
    gateway,
  }: ParquetProviderConfig) {
    this.parquetUrls = parquetUrls;
    this.gateway = gateway || "https://arweave.net";
    this.sql = sqlInstance;
  }

  async getTransaction(id: string): Promise<Transaction> {
    const results = await this.sql`
      SELECT 
        id,
        block {
          id,
          height,
          timestamp
        } as block,
        recipient,
        owner {
          address,
          key
        } as owner,
        fee {
          winston,
          ar
        } as fee,
        quantity {
          winston,
          ar
        } as quantity,
        data {
          size,
          type
        } as data,
        tags,
        signature,
        anchor
      FROM read_parquet(${this.parquetUrls.transactions})
      WHERE id = ${id}
      LIMIT 1
    `;

    if (results.length === 0) {
      throw new Error(`Transaction not found: ${id}`);
    }

    return results[0] as Transaction;
  }

  async getTransactions(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Transaction>> {
    const limit = filter.first || 100;
    const offset = filter.after ? parseInt(filter.after) : 0;

    // Build dynamic WHERE conditions using Waddler's template literal syntax
    let whereConditions = this.sql`1=1`; // Base condition

    if (filter.block?.min) {
      whereConditions = this
        .sql`${whereConditions} AND block.height >= ${filter.block.min}`;
    }
    if (filter.block?.max) {
      whereConditions = this
        .sql`${whereConditions} AND block.height <= ${filter.block.max}`;
    }
    if (filter.owners && filter.owners.length > 0) {
      whereConditions = this
        .sql`${whereConditions} AND owner.address = ANY(${filter.owners})`;
    }
    if (filter.recipients && filter.recipients.length > 0) {
      whereConditions = this
        .sql`${whereConditions} AND recipient = ANY(${filter.recipients})`;
    }

    const results = await this.sql`
      SELECT 
        id,
        block,
        recipient,
        owner,
        fee,
        quantity,
        data,
        tags,
        signature,
        anchor
      FROM read_parquet(${this.parquetUrls.transactions})
      WHERE ${whereConditions}
      ORDER BY block.height DESC, id
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const cursor =
      data.length > 0 ? (offset + data.length).toString() : undefined;

    return {
      data: data as Transaction[],
      hasNextPage,
      cursor,
      next: hasNextPage
        ? () => this.getTransactions({ ...filter, after: cursor })
        : undefined,
    };
  }

  async getBlock(id: string): Promise<Block> {
    const results = await this.sql`
      SELECT 
        id,
        timestamp,
        height,
        previous
      FROM read_parquet(${this.parquetUrls.blocks})
      WHERE id = ${id}
      LIMIT 1
    `;

    if (results.length === 0) {
      throw new Error(`Block not found: ${id}`);
    }

    return results[0] as Block;
  }

  async getBlocks(filter: BlocksQueryFilter): Promise<QueryResult<Block>> {
    const limit = filter.first || 100;
    const offset = filter.after ? parseInt(filter.after) : 0;

    // Build dynamic WHERE conditions using Waddler's template literal syntax
    let whereConditions = this.sql`1=1`; // Base condition

    if (filter.height?.min) {
      whereConditions = this
        .sql`${whereConditions} AND height >= ${filter.height.min}`;
    }
    if (filter.height?.max) {
      whereConditions = this
        .sql`${whereConditions} AND height <= ${filter.height.max}`;
    }

    const results = await this.sql`
      SELECT 
        id,
        timestamp,
        height,
        previous
      FROM read_parquet(${this.parquetUrls.blocks})
      WHERE ${whereConditions}
      ORDER BY height DESC
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const cursor =
      data.length > 0 ? (offset + data.length).toString() : undefined;

    return {
      data: data as Block[],
      hasNextPage,
      cursor,
      next: hasNextPage
        ? () => this.getBlocks({ ...filter, after: cursor })
        : undefined,
    };
  }
}
