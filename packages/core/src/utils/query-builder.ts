import type { SQL } from "@atticusofsparta/waddler";
import type {
  TransactionsQueryFilter,
  BlocksQueryFilter,
} from "../types/index.js";
import { base64urlToBytes, bytesToBuffer, base64urlToBase64 } from "./encoding.js";
import { 
  ParquetTransactionsColumns, 
  ParquetBlocksColumns 
} from "../generated/parquet-types.js";

/**
 * Query builder utilities for constructing SQL queries with Waddler
 */

export interface QueryBuilderConfig {
  sql: SQL;
}

export class QueryBuilder {
  private sql: SQL;

  constructor({ sql }: QueryBuilderConfig) {
    this.sql = sql;
  }

  /**
   * Build WHERE conditions for transaction queries
   */
  buildTransactionWhereConditions(filter: TransactionsQueryFilter) {
    const conditions = [];

    if (filter.block?.min) {
      conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.height)} >= ${filter.block.min}`);
    }

    if (filter.block?.max) {
      conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.height)} <= ${filter.block.max}`);
    }

    if (filter.owners && filter.owners.length > 0) {
      // Use base64 string comparison instead of binary comparison
      // This works better with HTTP-served parquet files where binary parameter binding has issues
      const ownerBase64Strings = filter.owners.map(addr => {
        if (typeof addr === 'string') {
          // Convert base64url to standard base64 for DuckDB's base64() function
          return base64urlToBase64(addr);
        }
        // If it's already a blob/bytes, keep it as-is for binary comparison
        // This case is mainly for unit tests that pass raw DuckDB blobs
        return addr;
      });
      
      if (ownerBase64Strings.length === 1) {
        // Use base64() SQL function to convert blob to base64 string for comparison
        const base64Str = ownerBase64Strings[0];
        if (typeof base64Str === 'string') {
          conditions.push(this.sql`base64(${this.sql.raw(ParquetTransactionsColumns.owner_address)}) = ${base64Str}`);
        } else {
          // Fallback to binary comparison for non-string (unit test case)
          conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.owner_address)} = ${base64Str}`);
        }
      } else {
        // For multiple owners, use IN with base64 comparison
        const stringFilters = ownerBase64Strings.filter(s => typeof s === 'string') as string[];
        const blobFilters = ownerBase64Strings.filter(s => typeof s !== 'string');
        
        if (stringFilters.length > 0) {
          conditions.push(this.sql`base64(${this.sql.raw(ParquetTransactionsColumns.owner_address)}) IN (${stringFilters})`);
        }
        if (blobFilters.length > 0) {
          conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.owner_address)} IN (${blobFilters})`);
        }
      }
    }

    if (filter.recipients && filter.recipients.length > 0) {
      // Use base64 string comparison instead of binary comparison
      const recipientBase64Strings = filter.recipients.map(addr => {
        if (typeof addr === 'string') {
          return base64urlToBase64(addr);
        }
        // If it's already a blob/bytes, keep it as-is for binary comparison
        return addr;
      });
      
      if (recipientBase64Strings.length === 1) {
        const base64Str = recipientBase64Strings[0];
        if (typeof base64Str === 'string') {
          conditions.push(this.sql`base64(${this.sql.raw(ParquetTransactionsColumns.target)}) = ${base64Str}`);
        } else {
          conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.target)} = ${base64Str}`);
        }
      } else {
        const stringFilters = recipientBase64Strings.filter(s => typeof s === 'string') as string[];
        const blobFilters = recipientBase64Strings.filter(s => typeof s !== 'string');
        
        if (stringFilters.length > 0) {
          conditions.push(this.sql`base64(${this.sql.raw(ParquetTransactionsColumns.target)}) IN (${stringFilters})`);
        }
        if (blobFilters.length > 0) {
          conditions.push(this.sql`${this.sql.raw(ParquetTransactionsColumns.target)} IN (${blobFilters})`);
        }
      }
    }

    if (filter.tags && filter.tags.length > 0) {
      // Tag filtering requires JOIN with tags table - this will be handled at the query level
      // We'll return a special marker that indicates tag filtering is needed
      conditions.push(this.sql`1=1 /* TAG_FILTER_REQUIRED */`);
    }

    // If no conditions, return a condition that matches all rows
    if (conditions.length === 0) {
      return this.sql`1=1`;
    }

    // Join all conditions with AND
    return conditions.reduce((combined, condition, index) => {
      if (index === 0) {
        return condition;
      }
      return this.sql`${combined} AND ${condition}`;
    });
  }

  /**
   * Build WHERE conditions for block queries
   */
  buildBlockWhereConditions(filter: BlocksQueryFilter) {
    const conditions = [];

    if (filter.height?.min) {
      conditions.push(this.sql`${this.sql.raw(ParquetBlocksColumns.height)} >= ${filter.height.min}`);
    }

    if (filter.height?.max) {
      conditions.push(this.sql`${this.sql.raw(ParquetBlocksColumns.height)} <= ${filter.height.max}`);
    }

    if (filter.ids && filter.ids.length > 0) {
      // Handle both base64url strings and DuckDB blob values
      const idBytes = filter.ids.map(id => {
        if (typeof id === 'string') {
          return base64urlToBytes(id);
        }
        return id; // Already a blob/bytes value
      });
      
      if (idBytes.length === 1) {
        conditions.push(this.sql`${this.sql.raw(ParquetBlocksColumns.hash)} = ${idBytes[0]}`);
      } else {
        conditions.push(this.sql`${this.sql.raw(ParquetBlocksColumns.hash)} IN (${idBytes})`);
      }
    }

    // If no conditions, return a condition that matches all rows
    if (conditions.length === 0) {
      return this.sql`1=1`;
    }

    // Join all conditions with AND
    return conditions.reduce((combined, condition, index) => {
      if (index === 0) {
        return condition;
      }
      return this.sql`${combined} AND ${condition}`;
    });
  }

  /**
   * Build ORDER BY clause for transactions
   */
  buildTransactionOrderBy(filter: TransactionsQueryFilter, tablePrefix?: string) {
    // Default to descending by block height, then by id for consistency
    const sortOrder = filter.sort === 'HEIGHT_ASC' ? 'ASC' : 'DESC';
    const heightCol = tablePrefix ? `${tablePrefix}.${ParquetTransactionsColumns.height}` : ParquetTransactionsColumns.height;
    const idCol = tablePrefix ? `${tablePrefix}.${ParquetTransactionsColumns.id}` : ParquetTransactionsColumns.id;
    return this.sql`ORDER BY ${this.sql.raw(heightCol)} ${this.sql.raw(sortOrder)}, ${this.sql.raw(idCol)}`;
  }

  /**
   * Build ORDER BY clause for blocks
   */
  buildBlockOrderBy() {
    return this.sql`ORDER BY ${this.sql.raw(ParquetBlocksColumns.height)} DESC`;
  }

  /**
   * Get pagination parameters
   */
  getPaginationParams(filter: { first?: number; after?: string }) {
    const limit = filter.first || 100;
    const offset = filter.after ? parseInt(filter.after) : 0;
    return { limit, offset };
  }

  /**
   * Process paginated results
   */
  processPaginatedResults<T>(
    results: T[],
    limit: number,
    offset: number,
    nextPageCallback: (cursor: string) => Promise<any>
  ) {
    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const cursor = data.length > 0 ? (offset + data.length).toString() : undefined;

    return {
      data,
      hasNextPage,
      cursor,
      next: hasNextPage && cursor ? () => nextPageCallback(cursor) : undefined,
    };
  }
}

/**
 * Field selection utilities for consistent SELECT clauses
 */
export class FieldSelector {
  /**
   * Get standard transaction fields from parquet schema
   */
  static getTransactionFields() {
    return Object.values(ParquetTransactionsColumns)
      .map(col => col === 'offset' ? '"offset"' : col)
      .join(',\n      ');
  }

  static getTransactionFieldsWithPrefix(prefix: string): string {
    return Object.values(ParquetTransactionsColumns)
      .map(col => {
        const quotedCol = col === 'offset' ? '"offset"' : col;
        return `${prefix}.${quotedCol}`;
      })
      .join(',\n      ');
  }

  /**
   * Get minimal transaction fields (for performance)
   */
  static getMinimalTransactionFields() {
    const minimalFields = [
      ParquetTransactionsColumns.id,
      ParquetTransactionsColumns.height,
      ParquetTransactionsColumns.owner_address,
      ParquetTransactionsColumns.target,
      ParquetTransactionsColumns.data_size
    ];
    return minimalFields.join(',\n      ');
  }

  /**
   * Get standard block fields from parquet schema
   */
  static getBlockFields() {
    return Object.values(ParquetBlocksColumns).join(',\n      ');
  }

  /**
   * Get custom transaction fields
   */
  static getCustomTransactionFields(fields: string[]) {
    const allowedFields = Object.values(ParquetTransactionsColumns);
    
    const validFields = fields.filter(field => 
      allowedFields.includes(field as any)
    );
    
    return validFields.join(',\n      ');
  }
}

/**
 * Query validation utilities
 */
export class QueryValidator {
  /**
   * Validate transaction filter
   */
  static validateTransactionFilter(filter: TransactionsQueryFilter): void {
    if (filter.first !== undefined && (filter.first < 1 || filter.first > 1000)) {
      throw new Error('first parameter must be between 1 and 1000');
    }

    if (filter.after && isNaN(parseInt(filter.after))) {
      throw new Error('after parameter must be a valid number');
    }

    if (filter.owners && filter.owners.some(owner => !owner || (typeof owner === 'string' && owner.length !== 43))) {
      throw new Error('owner addresses must be valid 43-character strings');
    }

    if (filter.recipients && filter.recipients.some(recipient => 
      recipient && typeof recipient === 'string' && recipient.length !== 43)) {
      throw new Error('recipient addresses must be valid 43-character strings');
    }
  }

  /**
   * Validate block filter
   */
  static validateBlockFilter(filter: BlocksQueryFilter): void {
    if (filter.first !== undefined && (filter.first < 1 || filter.first > 1000)) {
      throw new Error('first parameter must be between 1 and 1000');
    }

    if (filter.after && isNaN(parseInt(filter.after))) {
      throw new Error('after parameter must be a valid number');
    }

    if (filter.height?.min && filter.height?.max && 
        filter.height.min > filter.height.max) {
      throw new Error('height.min cannot be greater than height.max');
    }

    if (filter.ids && filter.ids.some(id => !id || (typeof id === 'string' && id.length !== 64))) {
      throw new Error('block IDs must be valid 64-character strings');
    }
  }
}
