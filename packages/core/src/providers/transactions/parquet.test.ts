import { describe, it, expect, vi, beforeEach } from "vitest";
import { ParquetProvider } from "./parquet.js";

// Mock Waddler
const mockSql = vi.fn();
const mockEnd = vi.fn();

vi.mock("@atticusofsparta/waddler", () => ({
  waddler: vi.fn(() => {
    const sql = mockSql;
    sql.end = mockEnd;
    return sql;
  }),
}));

describe("ParquetProvider", () => {
  let provider: ParquetProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    provider = new ParquetProvider({
      parquetUrls: {
        blocks: "https://example.com/blocks.parquet",
        transactions: "https://example.com/transactions.parquet",
        tags: "https://example.com/tags.parquet",
      },
      duckdbConfig: {
        readOnly: true,
        platform: "auto",
      },
    });
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(provider.name).toBe("parquet");
    });
  });

  describe("getTransaction", () => {
    it("should query for a single transaction", async () => {
      const mockTransaction = {
        id: "test-tx-id",
        block: { id: "block-id", height: 1000, timestamp: 1234567890 },
        owner: { address: "owner-address" },
      };

      mockSql.mockResolvedValueOnce([mockTransaction]);

      const result = await provider.getTransaction("test-tx-id");

      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining("SELECT")]),
        "test-tx-id",
      );
      expect(result).toEqual(mockTransaction);
    });

    it("should throw error when transaction not found", async () => {
      mockSql.mockResolvedValueOnce([]);

      await expect(provider.getTransaction("non-existent")).rejects.toThrow(
        "Transaction not found: non-existent",
      );
    });
  });

  describe("getTransactions", () => {
    it("should query transactions with filters", async () => {
      const mockTransactions = [
        { id: "tx1", block: { height: 1000 } },
        { id: "tx2", block: { height: 1001 } },
      ];

      mockSql.mockResolvedValueOnce(mockTransactions);

      const result = await provider.getTransactions({
        first: 10,
        block: { min: 1000 },
        owners: ["owner1"],
      });

      expect(mockSql).toHaveBeenCalled();
      expect(result.data).toEqual(mockTransactions);
      expect(result.hasNextPage).toBe(false);
    });

    it("should handle pagination", async () => {
      const mockTransactions = new Array(11).fill(null).map((_, i) => ({
        id: `tx${i}`,
        block: { height: 1000 + i },
      }));

      mockSql.mockResolvedValueOnce(mockTransactions);

      const result = await provider.getTransactions({ first: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.hasNextPage).toBe(true);
      expect(result.next).toBeDefined();
    });
  });

  describe("getBlocks", () => {
    it("should query blocks with height filter", async () => {
      const mockBlocks = [
        { id: "block1", height: 1000 },
        { id: "block2", height: 1001 },
      ];

      mockSql.mockResolvedValueOnce(mockBlocks);

      const result = await provider.getBlocks({
        first: 10,
        height: { min: 1000, max: 2000 },
      });

      expect(mockSql).toHaveBeenCalled();
      expect(result.data).toEqual(mockBlocks);
    });
  });

  describe("close", () => {
    it("should close the database connection", async () => {
      await provider.close();
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});
