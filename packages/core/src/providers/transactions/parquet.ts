import type { SQL } from "@atticusofsparta/waddler";
import type {
  QueryProvider,
  TransactionsQueryFilter,
  BlocksQueryFilter,
  QueryResult,
} from "../../types/index.js";
import type { Transaction, Block } from "../../generated/graphql.js";
import {
  QueryBuilder,
  FieldSelector,
  QueryValidator,
} from "../../utils/query-builder.js";
import {
  base64urlToBytes,
  bytesToBase64url,
  base64urlToBase64,
} from "../../utils/encoding.js";
import type {
  ParquetTransactionsRow,
  ParquetBlocksRow,
  ParquetTagsRow,
} from "../../generated/parquet-types.js";
import type { Tag } from "../../generated/graphql.js";

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
  private queryBuilder: QueryBuilder;
  protected readonly parquetUrls: ParquetProviderConfig["parquetUrls"];
  protected readonly gateway: string;

  constructor({ sqlInstance, parquetUrls, gateway }: ParquetProviderConfig) {
    this.parquetUrls = parquetUrls;
    this.gateway = gateway || "https://arweave.net";
    this.sql = sqlInstance;
    this.queryBuilder = new QueryBuilder({ sql: sqlInstance });
  }

  async transformParquetTransaction(
    row: ParquetTransactionsRow,
  ): Promise<Transaction> {
    const id = bytesToBase64url(row.id);
    const ownerAddress = bytesToBase64url(row.owner_address);

    // The owner field is null in the parquet data, so we use owner_address for both
    // In a real implementation, we'd need to fetch the public key separately
    const publicKey = ownerAddress; // Use address as key since we don't have the actual public key
    const target = row.target ? bytesToBase64url(row.target) : undefined;
    // TODO: resolve signature using the root_offset and the signature_offset
    const signature = "";

    // Handle anchor field - check if it has actual data (not just empty buffer)
    const anchorBytes = (row.anchor as any)?.bytes || row.anchor;
    const anchor =
      anchorBytes && anchorBytes.length > 0
        ? bytesToBase64url(row.anchor)
        : undefined;

    const transaction = {
      id,
      anchor,
      signature,
      recipient: target,
      owner: {
        address: ownerAddress,
        key: publicKey, // In Arweave, the address is derived from the key
      },
      block: null, // must hydrate block data with row.height
      fee: {
        winston: String(row.reward || 0),
        ar: String(Number(row.reward || 0) / 1e12), // Convert winston to AR
      },
      quantity: {
        winston: String(row.quantity || 0),
        ar: String(Number(row.quantity || 0) / 1e12), // Convert winston to AR
      },
      data: {
        size: String(row.data_size || 0),
        type: row.content_type || undefined,
      },
      tags: await this.getTags({ id }), // Fetch tags from tags table
    } as Transaction;

    // hydrate block data
    if (row.height) {
      const blockRow = await this.sql`
        SELECT ${this.sql.raw(FieldSelector.getBlockFields())}
        FROM read_parquet(${this.parquetUrls.blocks})
        WHERE height = ${row.height}
        LIMIT 1
    `;

      transaction.block = this.transformParquetBlock(
        blockRow[0] as ParquetBlocksRow,
      );
    }
    return transaction;
  }

  transformParquetBlock(row: ParquetBlocksRow): Block {
    const hash = bytesToBase64url(row.hash);
    const previousBlock = bytesToBase64url(row.previous_block);

    return {
      id: hash,
      height: Number(row.height),
      timestamp: Number(row.block_timestamp || 0),
      previous: previousBlock,
    } as Block;
  }

  /**
   * Get tags for a transaction by ID
   */
  async getTags({ id }: { id: string }): Promise<Tag[]> {
    // Convert base64url to standard base64 for DuckDB comparison
    // DuckDB's base64() function returns standard base64 (with +, /, =)
    // but our IDs are base64url format (with -, _, no padding)
    const standardBase64 = id
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(id.length + ((4 - (id.length % 4)) % 4), "=");

    const results = await this.sql`
      SELECT tag_name, tag_value
      FROM read_parquet(${this.parquetUrls.tags})
      WHERE base64(id) = ${standardBase64}
      ORDER BY tag_index ASC
    `;

    const decoder = new TextDecoder("utf-8");
    const tags = results.map((row: any) => {
      // Handle both DuckDB blob and Uint8Array for tag data
      const nameBytes = row.tag_name?.bytes || row.tag_name;
      const valueBytes = row.tag_value?.bytes || row.tag_value;

      return {
        name: decoder.decode(nameBytes),
        value: decoder.decode(valueBytes),
      };
    }) as Tag[];

    return tags;
  }

  async getTransaction(id: string): Promise<Transaction> {
    // Use base64 string comparison instead of binary comparison
    // This works better with HTTP-served parquet files
    const idBase64 = base64urlToBase64(id);
    const results = await this.sql`
      SELECT ${this.sql.raw(FieldSelector.getTransactionFields())}
      FROM read_parquet(${this.parquetUrls.transactions})
      WHERE base64(id) = ${idBase64}
      LIMIT 1
    `;

    if (results.length === 0) {
      throw new Error(`Transaction not found: ${id}`);
    }

    const transaction = await this.transformParquetTransaction(
      results[0] as ParquetTransactionsRow,
    );

    return transaction;
  }

  async getTransactions(
    filter: TransactionsQueryFilter,
  ): Promise<QueryResult<Transaction>> {
    // Validate filter
    QueryValidator.validateTransactionFilter(filter);

    const { limit, offset } = this.queryBuilder.getPaginationParams(filter);
    const whereConditions =
      this.queryBuilder.buildTransactionWhereConditions(filter);
    const orderBy = this.queryBuilder.buildTransactionOrderBy(filter);

    let results;

    // Check if tag filtering is required
    if (filter.tags && filter.tags.length > 0) {
      // Use JOIN query for tag filtering
      results = await this.getTransactionsWithTagFilter(
        filter,
        limit,
        offset,
        orderBy,
      );
    } else {
      // Use simple query without JOIN
      results = await this.sql`
        SELECT ${this.sql.raw(FieldSelector.getTransactionFields())}
        FROM read_parquet(${this.parquetUrls.transactions})
        WHERE ${whereConditions}
        ${orderBy}
        LIMIT ${limit + 1}
        OFFSET ${offset}
      `;
    }

    // Transform parquet rows to GraphQL Transaction objects
    const transformedResults = await Promise.all(
      results.map((row) =>
        this.transformParquetTransaction(row as ParquetTransactionsRow),
      ),
    );

    return this.queryBuilder.processPaginatedResults(
      transformedResults,
      limit,
      offset,
      (cursor) => this.getTransactions({ ...filter, after: cursor }),
    );
  }

  private async getTransactionsWithTagFilter(
    filter: TransactionsQueryFilter,
    limit: number,
    offset: number,
    orderBy: any,
  ) {
    const { tags, ...otherFilters } = filter;
    const whereConditions =
      this.queryBuilder.buildTransactionWhereConditions(otherFilters);
    const orderByWithPrefix = this.queryBuilder.buildTransactionOrderBy(
      filter,
      "tx",
    );

    // Build tag filter conditions
    const tagConditions = tags!.map((tagFilter) => {
      if (tagFilter.values.length === 1) {
        return this
          .sql`(t.tag_name = ${tagFilter.name} AND t.tag_value = ${tagFilter.values[0]})`;
      } else {
        return this
          .sql`(t.tag_name = ${tagFilter.name} AND t.tag_value IN (${tagFilter.values}))`;
      }
    });

    const tagWhere = tagConditions.reduce((combined, condition) =>
      combined ? this.sql`${combined} AND ${condition}` : condition,
    );

    // Combine WHERE conditions properly
    const combinedWhere = this.sql`${whereConditions} AND ${tagWhere}`;

    return await this.sql`
      SELECT DISTINCT ${this.sql.raw(FieldSelector.getTransactionFieldsWithPrefix("tx"))}
      FROM read_parquet(${this.parquetUrls.transactions}) tx
      INNER JOIN read_parquet(${this.parquetUrls.tags}) t ON tx.id = t.id
      WHERE ${combinedWhere}
      ${orderByWithPrefix}
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;
  }

  async getBlock(id: string): Promise<Block | null> {
    const idBytes = base64urlToBytes(id);
    const results = await this.sql`
      SELECT ${this.sql.raw(FieldSelector.getBlockFields())}
      FROM read_parquet(${this.parquetUrls.blocks})
      WHERE hash = ${idBytes}
      LIMIT 1
    `;

    if (results.length === 0) {
      return null;
    }

    return this.transformParquetBlock(results[0] as ParquetBlocksRow);
  }

  async getBlocks(filter: BlocksQueryFilter): Promise<QueryResult<Block>> {
    // Validate filter
    QueryValidator.validateBlockFilter(filter);

    const { limit, offset } = this.queryBuilder.getPaginationParams(filter);
    const whereConditions = this.queryBuilder.buildBlockWhereConditions(filter);
    const orderBy = this.queryBuilder.buildBlockOrderBy();

    const results = await this.sql`
      SELECT ${this.sql.raw(FieldSelector.getBlockFields())}
      FROM read_parquet(${this.parquetUrls.blocks})
      WHERE ${whereConditions}
      ${orderBy}
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `;

    // Transform parquet rows to GraphQL Block objects
    const transformedResults = await Promise.all(
      results.map((row) => this.transformParquetBlock(row as ParquetBlocksRow)),
    );

    return this.queryBuilder.processPaginatedResults(
      transformedResults,
      limit,
      offset,
      (cursor) => this.getBlocks({ ...filter, after: cursor }),
    );
  }
}
