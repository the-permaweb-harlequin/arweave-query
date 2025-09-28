import type {
  QueryProvider,
  QueryFilter,
  QueryResult,
  ArweaveTransaction,
} from '../types/index.js';

export interface ParquetProviderConfig {
  duckdbInstance?: any; // DuckDB instance (node or wasm)
  parquetUrls?: string[];
  gateway?: string;
}

export class ParquetProvider implements QueryProvider {
  name = 'parquet';
  private db: any;
  private parquetUrls: string[];
  private gateway: string;

  constructor(config: ParquetProviderConfig = {}) {
    this.db = config.duckdbInstance;
    this.parquetUrls = config.parquetUrls || [];
    this.gateway = config.gateway || 'https://arweave.net';
  }

  async query(filter: QueryFilter): Promise<QueryResult> {
    if (!this.db) {
      throw new Error('DuckDB instance not provided');
    }

    // Build SQL query based on filter
    let sql = 'SELECT * FROM read_parquet($1)';
    const params = [this.getParquetUrl()];
    const conditions: string[] = [];

    if (filter.owners?.length) {
      conditions.push(\`owner IN (\${filter.owners.map(() => '?').join(', ')})\`);
      params.push(...filter.owners);
    }

    if (filter.recipients?.length) {
      conditions.push(\`target IN (\${filter.recipients.map(() => '?').join(', ')})\`);
      params.push(...filter.recipients);
    }

    if (filter.block?.min !== undefined) {
      conditions.push('block_height >= ?');
      params.push(filter.block.min);
    }

    if (filter.block?.max !== undefined) {
      conditions.push('block_height <= ?');
      params.push(filter.block.max);
    }

    if (conditions.length > 0) {
      sql += \` WHERE \${conditions.join(' AND ')}\`;
    }

    if (filter.first) {
      sql += \` LIMIT \${filter.first}\`;
    }

    try {
      const result = await this.db.all(sql, params);
      
      return {
        data: result.map((row: any) => this.transformRow(row)),
        hasNextPage: result.length === (filter.first || 10),
      };
    } catch (error) {
      throw new Error(\`Parquet query failed: \${error}\`);
    }
  }

  async getTransaction(id: string): Promise<ArweaveTransaction | null> {
    if (!this.db) {
      throw new Error('DuckDB instance not provided');
    }

    const sql = 'SELECT * FROM read_parquet($1) WHERE id = $2 LIMIT 1';
    const params = [this.getParquetUrl(), id];

    try {
      const result = await this.db.get(sql, params);
      return result ? this.transformRow(result) : null;
    } catch (error) {
      throw new Error(\`Transaction lookup failed: \${error}\`);
    }
  }

  private getParquetUrl(): string {
    // Return the first available parquet URL or construct one
    return this.parquetUrls[0] || \`\${this.gateway}/raw/transactions.parquet\`;
  }

  private transformRow(row: any): ArweaveTransaction {
    return {
      id: row.id,
      owner: row.owner,
      target: row.target,
      quantity: row.quantity?.toString() || '0',
      reward: row.reward?.toString() || '0',
      last_tx: row.last_tx || '',
      tags: this.parseTags(row.tags),
      data_size: row.data_size?.toString() || '0',
      data_root: row.data_root || '',
      signature: row.signature || '',
      block: row.block_height ? {
        id: row.block_id || '',
        height: row.block_height,
        timestamp: row.block_timestamp || 0,
      } : undefined,
    };
  }

  private parseTags(tagsData: any): Array<{ name: string; value: string }> {
    if (!tagsData) return [];
    
    try {
      // Handle different tag formats that might come from parquet
      if (typeof tagsData === 'string') {
        return JSON.parse(tagsData);
      }
      if (Array.isArray(tagsData)) {
        return tagsData;
      }
      return [];
    } catch {
      return [];
    }
  }
}
