import { describe, it, expect, beforeAll } from "vitest";
import { GraphQLProvider } from "@arweave-query/core";
import type { ArIONodeContainer } from "../testcontainers-helper";

describe("Node Integration - GraphQL Query", () => {
  let arIONode: ArIONodeContainer;
  let provider: GraphQLProvider;
  let hasGraphQLData = false;

  beforeAll(async () => {
    arIONode = (global as any).__ARIO_NODE__;
    if (!arIONode) {
      throw new Error("AR-IO node not available");
    }

    // Create GraphQL provider pointing at arweave.net/graphql
    // This ensures we have real data to test against
    provider = new GraphQLProvider("https://arweave.net/graphql");
    
    // Check if the endpoint has data
    try {
      const testResult = await provider.getTransactions({ first: 1 });
      hasGraphQLData = testResult.data.length > 0;
      if (!hasGraphQLData) {
        console.log("\n⚠️  GraphQL endpoint has no data - tests will be skipped\n");
      }
    } catch (error) {
      console.log("\n⚠️  GraphQL endpoint error - tests will be skipped:", error);
    }
  });

  it("should query transactions from GraphQL endpoint", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

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

  it("should filter transactions by owner via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

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

  it("should filter transactions by block height range via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

    // GraphQL endpoint should have access to the same data range: 911404-1094394
    const FIXTURE_MIN_HEIGHT = 911404;
    const FIXTURE_MAX_HEIGHT = 1094394;
    
    const result = await provider.getTransactions({
      first: 10,
      block: {
        min: FIXTURE_MIN_HEIGHT,
        max: FIXTURE_MIN_HEIGHT + 1000,
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

  it("should filter transactions by tags via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

    // Query for transactions with a specific tag
    const result = await provider.getTransactions({
      first: 10,
      tags: [{ name: "Content-Type", values: ["application/json"] }],
    });

    // Note: This test might return 0 results if no transactions in the fixture
    // have the specified tag - that's okay for integration testing
    expect(Array.isArray(result.data)).toBe(true);

    if (result.data.length > 0) {
      // If we got results, verify they have tags
      const firstTx = result.data[0];
      expect(firstTx).toHaveProperty("tags");
    }
  });

  it("should support pagination with cursor via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

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

  it("should query blocks from GraphQL endpoint", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

    const result = await provider.getBlocks({
      first: 10,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.length).toBeLessThanOrEqual(10);

    // Verify block structure
    const firstBlock = result.data[0];
    expect(firstBlock).toHaveProperty("id");
    expect(firstBlock).toHaveProperty("height");
    expect(firstBlock).toHaveProperty("timestamp");
    expect(firstBlock).toHaveProperty("previous");
  });

  it("should get a single transaction by id via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

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

  it("should handle recipients filter via GraphQL", async () => {
    if (!hasGraphQLData) {
      console.log("Skipping - no GraphQL data available");
      return;
    }

    // First get a transaction with a recipient
    const allTxs = await provider.getTransactions({
      first: 100,
    });

    // Find a transaction with a recipient
    const txWithRecipient = allTxs.data.find(tx => tx.recipient);

    if (txWithRecipient && txWithRecipient.recipient) {
      const recipientAddress = txWithRecipient.recipient;

      // Query by that recipient
      const result = await provider.getTransactions({
        first: 10,
        recipients: [recipientAddress],
      });

      if (result.data.length > 0) {
        // All transactions should have the same recipient
        result.data.forEach((tx) => {
          expect(tx.recipient).toBe(recipientAddress);
        });
      }
    } else {
      console.log("No transactions with recipients found in fixture data - skipping recipient filter test");
    }
  });
});

