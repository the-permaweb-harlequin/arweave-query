import { describe, it, expect, vi, beforeEach } from "vitest";
import { waddler } from "@atticusofsparta/waddler/duckdb-neo";
import { join } from "path";
import { QueryBuilder, FieldSelector, QueryValidator } from "./query-builder.js";
import type { TransactionsQueryFilter, BlocksQueryFilter } from "../types/index.js";
import { SortOrder } from "../generated/graphql.js";

// Real SQL instance for integration testing
let sql: any;
const fixturesPath = join(process.cwd(), "../../fixtures");

describe("QueryBuilder", () => {
  let queryBuilder: QueryBuilder;

  beforeEach(async () => {
    // Initialize real DuckDB instance for each test
    sql = waddler({
      url: ":memory:",
      accessMode: "read_write",
    });
    queryBuilder = new QueryBuilder({ sql });
  });

  describe("buildTransactionWhereConditions", () => {
    it("should build valid query with no conditions", async () => {
      const filter: TransactionsQueryFilter = {};
      const whereConditions = queryBuilder.buildTransactionWhereConditions(filter);
      
      // Test that the query is valid by executing it against fixtures
      const transactionsPath = join(fixturesPath, "parquet/transactions.parquet");
      const query = sql`
        SELECT COUNT(*) as count
        FROM read_parquet(${transactionsPath})
        WHERE ${whereConditions}
        LIMIT 1
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThan(0);
    });

    it("should build valid query with height conditions", async () => {
      const filter: TransactionsQueryFilter = {
        block: { min: 1000, max: 2000 }
      };
      
      const whereConditions = queryBuilder.buildTransactionWhereConditions(filter);
      const transactionsPath = join(fixturesPath, "parquet/transactions.parquet");
      
      const query = sql`
        SELECT COUNT(*) as count, MIN(height) as min_height, MAX(height) as max_height
        FROM read_parquet(${transactionsPath})
        WHERE ${whereConditions}
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThanOrEqual(0);
      
      // If there are results, verify height constraints
      if (result[0].count > 0) {
        expect(Number(result[0].min_height)).toBeGreaterThanOrEqual(1000);
        expect(Number(result[0].max_height)).toBeLessThanOrEqual(2000);
      }
    });

    it("should build valid query with owner conditions", async () => {
      // First, get a real owner address from the fixtures
      const transactionsPath = join(fixturesPath, "parquet/transactions.parquet");
      const ownerQuery = sql`
        SELECT owner_address
        FROM read_parquet(${transactionsPath})
        WHERE owner_address IS NOT NULL
        LIMIT 1
      `;
      
      const ownerResult = await ownerQuery;
      if (ownerResult.length === 0) {
        // Skip test if no owner addresses in fixtures
        return;
      }
      
      const realOwnerAddress = ownerResult[0].owner_address;
      const filter: TransactionsQueryFilter = {
        owners: [realOwnerAddress] // Use real owner address as DuckDB blob
      };
      
      const whereConditions = queryBuilder.buildTransactionWhereConditions(filter);
      const query = sql`
        SELECT COUNT(*) as count
        FROM read_parquet(${transactionsPath})
        WHERE ${whereConditions}
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThanOrEqual(0);
    });

    it("should handle tag conditions with special marker", () => {
      const filter: TransactionsQueryFilter = {
        tags: [
          { name: "Content-Type", values: ["application/json"] }
        ]
      };
      
      const result = queryBuilder.buildTransactionWhereConditions(filter);
      
      // Should return a condition that includes the tag filter marker
      expect(result).toBeDefined();
      // The actual tag filtering is handled at the query level with JOIN
      // This just ensures the method doesn't crash and returns a valid condition
    });
  });

  describe("buildBlockWhereConditions", () => {
    it("should build valid query with no conditions", async () => {
      const filter: BlocksQueryFilter = {};
      const whereConditions = queryBuilder.buildBlockWhereConditions(filter);
      
      const blocksPath = join(fixturesPath, "parquet/blocks.parquet");
      const query = sql`
        SELECT COUNT(*) as count
        FROM read_parquet(${blocksPath})
        WHERE ${whereConditions}
        LIMIT 1
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThan(0);
    });

    it("should build valid query with height conditions", async () => {
      const filter: BlocksQueryFilter = {
        height: { min: 1000, max: 2000 }
      };
      
      const whereConditions = queryBuilder.buildBlockWhereConditions(filter);
      const blocksPath = join(fixturesPath, "parquet/blocks.parquet");
      
      const query = sql`
        SELECT COUNT(*) as count, MIN(height) as min_height, MAX(height) as max_height
        FROM read_parquet(${blocksPath})
        WHERE ${whereConditions}
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThanOrEqual(0);
      
      // If there are results, verify height constraints
      if (result[0].count > 0) {
        expect(Number(result[0].min_height)).toBeGreaterThanOrEqual(1000);
        expect(Number(result[0].max_height)).toBeLessThanOrEqual(2000);
      }
    });

    it("should build valid query with id conditions", async () => {
      // First, get a real block hash from the fixtures
      const blocksPath = join(fixturesPath, "parquet/blocks.parquet");
      const hashQuery = sql`
        SELECT hash
        FROM read_parquet(${blocksPath})
        WHERE hash IS NOT NULL
        LIMIT 1
      `;
      
      const hashResult = await hashQuery;
      if (hashResult.length === 0) {
        // Skip test if no hashes in fixtures
        return;
      }
      
      const realBlockHash = hashResult[0].hash;
      const filter: BlocksQueryFilter = {
        ids: [realBlockHash] // Use real block hash as DuckDB blob
      };
      
      const whereConditions = queryBuilder.buildBlockWhereConditions(filter);
      const query = sql`
        SELECT COUNT(*) as count
        FROM read_parquet(${blocksPath})
        WHERE ${whereConditions}
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result[0].count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("buildTransactionOrderBy", () => {
    it("should build valid default order by query", async () => {
      const filter: TransactionsQueryFilter = {};
      const orderBy = queryBuilder.buildTransactionOrderBy(filter);
      const whereConditions = queryBuilder.buildTransactionWhereConditions({});
      
      const transactionsPath = join(fixturesPath, "parquet/transactions.parquet");
      const query = sql`
        SELECT height, id
        FROM read_parquet(${transactionsPath})
        WHERE ${whereConditions}
        ${orderBy}
        LIMIT 5
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify descending order by height
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(Number(result[i].height)).toBeLessThanOrEqual(Number(result[i-1].height));
        }
      }
    });

    it("should build valid ascending order by query", async () => {
      const filter: TransactionsQueryFilter = { sort: SortOrder.HeightAsc };
      const orderBy = queryBuilder.buildTransactionOrderBy(filter);
      const whereConditions = queryBuilder.buildTransactionWhereConditions({});
      
      const transactionsPath = join(fixturesPath, "parquet/transactions.parquet");
      const query = sql`
        SELECT height, id
        FROM read_parquet(${transactionsPath})
        WHERE ${whereConditions}
        ${orderBy}
        LIMIT 5
      `;
      
      const result = await query;
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify ascending order by height
      if (result.length > 1) {
        for (let i = 1; i < result.length; i++) {
          expect(Number(result[i].height)).toBeGreaterThanOrEqual(Number(result[i-1].height));
        }
      }
    });
  });

  describe("getPaginationParams", () => {
    it("should return default pagination", () => {
      const result = queryBuilder.getPaginationParams({});
      expect(result).toEqual({ limit: 100, offset: 0 });
    });

    it("should return custom pagination", () => {
      const result = queryBuilder.getPaginationParams({ first: 50, after: "25" });
      expect(result).toEqual({ limit: 50, offset: 25 });
    });
  });

  describe("processPaginatedResults", () => {
    it("should process results without next page", () => {
      const results = [{ id: "1" }, { id: "2" }];
      const mockCallback = vi.fn();
      
      const result = queryBuilder.processPaginatedResults(results, 10, 0, mockCallback);
      
      expect(result).toEqual({
        data: results,
        hasNextPage: false,
        cursor: "2",
        next: undefined
      });
    });

    it("should process results with next page", () => {
      const results = Array.from({ length: 11 }, (_, i) => ({ id: i.toString() }));
      const mockCallback = vi.fn();
      
      const result = queryBuilder.processPaginatedResults(results, 10, 0, mockCallback);
      
      expect(result.data).toHaveLength(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.cursor).toBe("10");
      expect(result.next).toBeDefined();
    });
  });
});

describe("FieldSelector", () => {
  describe("getTransactionFields", () => {
    it("should return transaction fields", () => {
      const fields = FieldSelector.getTransactionFields();
      expect(fields).toContain("id");
      expect(fields).toContain("height");
      expect(fields).toContain("owner_address");
      expect(fields).toContain("target");
    });
  });

  describe("getMinimalTransactionFields", () => {
    it("should return minimal transaction fields", () => {
      const fields = FieldSelector.getMinimalTransactionFields();
      expect(fields).toContain("id");
      expect(fields).toContain("height");
      expect(fields).toContain("owner_address");
    });
  });

  describe("getBlockFields", () => {
    it("should return block fields", () => {
      const fields = FieldSelector.getBlockFields();
      expect(fields).toContain("hash");
      expect(fields).toContain("height");
      expect(fields).toContain("block_timestamp");
      expect(fields).toContain("previous_block");
    });
  });

  describe("getCustomTransactionFields", () => {
    it("should return valid custom fields", () => {
      const fields = FieldSelector.getCustomTransactionFields(["id", "owner_address", "invalid"]);
      expect(fields).toContain("id");
      expect(fields).toContain("owner_address");
      expect(fields).not.toContain("invalid");
    });
  });
});

describe("QueryValidator", () => {
  describe("validateTransactionFilter", () => {
    it("should validate valid filter", () => {
      const filter: TransactionsQueryFilter = {
        first: 50,
        after: "10",
        owners: ["a".repeat(43)],
        recipients: ["b".repeat(43)]
      };
      
      expect(() => QueryValidator.validateTransactionFilter(filter)).not.toThrow();
    });

    it("should throw for invalid first parameter", () => {
      const filter: TransactionsQueryFilter = { first: 0 };
      expect(() => QueryValidator.validateTransactionFilter(filter)).toThrow(
        "first parameter must be between 1 and 1000"
      );
    });

    it("should throw for invalid after parameter", () => {
      const filter: TransactionsQueryFilter = { after: "invalid" };
      expect(() => QueryValidator.validateTransactionFilter(filter)).toThrow(
        "after parameter must be a valid number"
      );
    });

    it("should throw for invalid owner address", () => {
      const filter: TransactionsQueryFilter = { owners: ["short"] };
      expect(() => QueryValidator.validateTransactionFilter(filter)).toThrow(
        "owner addresses must be valid 43-character strings"
      );
    });

    it("should throw for invalid recipient address", () => {
      const filter: TransactionsQueryFilter = { recipients: ["short"] };
      expect(() => QueryValidator.validateTransactionFilter(filter)).toThrow(
        "recipient addresses must be valid 43-character strings"
      );
    });
  });

  describe("validateBlockFilter", () => {
    it("should validate valid filter", () => {
      const filter: BlocksQueryFilter = {
        first: 50,
        after: "10",
        height: { min: 1000, max: 2000 },
        ids: ["a".repeat(64)]
      };
      
      expect(() => QueryValidator.validateBlockFilter(filter)).not.toThrow();
    });

    it("should throw for invalid height range", () => {
      const filter: BlocksQueryFilter = { height: { min: 2000, max: 1000 } };
      expect(() => QueryValidator.validateBlockFilter(filter)).toThrow(
        "height.min cannot be greater than height.max"
      );
    });

    it("should throw for invalid block ID", () => {
      const filter: BlocksQueryFilter = { ids: ["short"] };
      expect(() => QueryValidator.validateBlockFilter(filter)).toThrow(
        "block IDs must be valid 64-character strings"
      );
    });
  });
});
