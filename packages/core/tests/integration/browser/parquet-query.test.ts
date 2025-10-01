import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createWebParquetProvider } from "@arweave-query/core/web";
import type { ArIONodeContainer } from "../testcontainers-helper";

describe("Browser Integration - Parquet Query", () => {
  let arIONode: ArIONodeContainer;
  let provider: ReturnType<typeof createWebParquetProvider>;

  beforeAll(async () => {
    arIONode = (globalThis as any).__ARIO_NODE__;
    if (!arIONode) {
      throw new Error("AR-IO node not available");
    }

    // Use AR-IO node's datasets endpoint
    const datasetsBaseUrl = `${arIONode.apiUrl}/local/datasets`;

    // Create provider using the built package
    provider = createWebParquetProvider({
      parquetUrls: {
        blocks: `${datasetsBaseUrl}/blocks.parquet`,
        transactions: `${datasetsBaseUrl}/transactions.parquet`,
        tags: `${datasetsBaseUrl}/tags.parquet`,
      },
      duckdbConfig: {
        // Web configuration for DuckDB WASM
      },
    });
  });

  afterAll(async () => {
    // Provider cleanup happens automatically
  });

  it("should query transactions from parquet datasets in browser", async () => {
    const result = await provider.getTransactions({
      first: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThanOrEqual(10);

    // Verify transaction structure
    const firstTx = result.data[0];
    expect(firstTx).toHaveProperty("id");
    expect(firstTx).toHaveProperty("owner");
    expect(firstTx.owner).toHaveProperty("address");
  });

  it("should filter transactions by owner in browser", async () => {
    // First get a transaction to use its owner
    const allTxs = await provider.getTransactions({
      first: 1,
    });

    expect(allTxs.data.length).toBeGreaterThan(0);
    const ownerAddress = allTxs.data[0].owner.address;

    // Now query by that owner
    const result = await provider.getTransactions({
      first: 10,
      owners: [ownerAddress],
    });

    expect(result.data.length).toBeGreaterThan(0);
    // All transactions should have the same owner
    result.data.forEach((tx) => {
      expect(tx.owner.address).toBe(ownerAddress);
    });
  });

  it("should filter transactions by block height range in browser", async () => {
    // Parquet fixture data range: 911404-1094394
    const FIXTURE_MIN_HEIGHT = 911404;
    const FIXTURE_MAX_HEIGHT = 1094394;

    // Query a subset within the fixture range
    const result = await provider.getTransactions({
      first: 10,
      block: {
        min: FIXTURE_MIN_HEIGHT,
        max: FIXTURE_MIN_HEIGHT + 1000, // Query first 1000 blocks
      },
    });

    expect(result.data.length).toBeGreaterThan(0);
    // All transactions should be within the block height range
    result.data.forEach((tx) => {
      if (tx.block) {
        expect(tx.block.height).toBeGreaterThanOrEqual(FIXTURE_MIN_HEIGHT);
        expect(tx.block.height).toBeLessThanOrEqual(FIXTURE_MIN_HEIGHT + 1000);
      }
    });
  });

  it("should support pagination with cursor in browser", async () => {
    const firstPage = await provider.getTransactions({
      first: 5,
    });

    expect(firstPage.data.length).toBeGreaterThan(0);

    if (firstPage.hasNextPage && firstPage.next) {
      const secondPage = await firstPage.next();

      // Second page should have different transactions
      expect(secondPage.data.length).toBeGreaterThan(0);
      expect(secondPage.data[0].id).not.toBe(firstPage.data[0].id);
    }
  });

  it("should query blocks from parquet datasets in browser", async () => {
    const result = await provider.getBlocks({
      first: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThanOrEqual(10);

    // Verify block structure
    const firstBlock = result.data[0];
    expect(firstBlock).toHaveProperty("id"); // Block ID
    expect(firstBlock).toHaveProperty("height");
    expect(firstBlock).toHaveProperty("timestamp");
    expect(firstBlock).toHaveProperty("previous"); // Previous block hash
  });

  it("should work with DuckDB WASM in browser environment", async () => {
    // This test verifies that DuckDB WASM is properly initialized
    // and can execute queries in the browser
    const result = await provider.getTransactions({
      first: 1,
    });

    expect(result).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
  });

  it("should get a single transaction by id in browser", async () => {
    // First get a transaction to use its id
    const allTxs = await provider.getTransactions({
      first: 1,
    });

    expect(allTxs.data.length).toBeGreaterThan(0);
    const txId = allTxs.data[0].id;

    // Now get that specific transaction
    const tx = await provider.getTransaction(txId);

    expect(tx).toBeDefined();
    expect(tx.id).toBe(txId);
  });
});
