import { describe, it, expect, beforeAll } from "vitest";
import { ArweaveQueryClient, GraphQLProvider } from "@arweave-query/core";
import { createNodeParquetProvider } from "@arweave-query/core/node";
import type { ArIONodeContainer } from "../testcontainers-helper";
import type { Transaction } from "@arweave-query/core";

describe("Node Integration - Client Cross-Provider Validation", () => {
  let arIONode: ArIONodeContainer;
  let parquetProvider: ReturnType<typeof createNodeParquetProvider>;
  let graphqlProvider: GraphQLProvider;
  let parquetClient: ArweaveQueryClient;
  let graphqlClient: ArweaveQueryClient;

  beforeAll(async () => {
    arIONode = (global as any).__ARIO_NODE__;
    if (!arIONode) {
      throw new Error("AR-IO node not available");
    }

    // Create Parquet provider with HTTP-served parquet files
    const datasetsBaseUrl = `${arIONode.apiUrl}/local/datasets`;
    parquetProvider = createNodeParquetProvider({
      parquetUrls: {
        blocks: `${datasetsBaseUrl}/blocks.parquet`,
        transactions: `${datasetsBaseUrl}/transactions.parquet`,
        tags: `${datasetsBaseUrl}/tags.parquet`,
      },
      duckdbConfig: {
        memory: ":memory:",
        readOnly: false,
      },
    });

    // Create GraphQL provider pointing at arweave.net
    graphqlProvider = new GraphQLProvider("https://arweave.net/graphql");

    // Create clients with different providers
    parquetClient = new ArweaveQueryClient({
      transactionProvider: parquetProvider,
    });

    graphqlClient = new ArweaveQueryClient({
      transactionProvider: graphqlProvider,
    });
  });

  it("should validate parquet data against GraphQL endpoint", async () => {
    console.log("\n🔍 Starting cross-provider validation...\n");

    // Step 1: Query 100 transactions from Parquet
    console.log("Step 1: Querying 100 transactions from Parquet provider...");
    const parquetResult = await parquetProvider.getTransactions({
      first: 100,
    });

    expect(parquetResult.data.length).toBeGreaterThan(0);
    console.log(`✓ Found ${parquetResult.data.length} transactions in Parquet\n`);

    // Step 2: Take transaction IDs and query GraphQL
    const transactionIds = parquetResult.data.map((tx) => tx.id);
    console.log(`Step 2: Querying ${transactionIds.length} transactions from GraphQL provider...`);

    // Query transactions from GraphQL one by one (GraphQL doesn't support bulk ID queries easily)
    const graphqlResults: Transaction[] = [];
    const notFoundIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const txId of transactionIds) {
      try {
        const tx = await graphqlProvider.getTransaction(txId);
        graphqlResults.push(tx);
      } catch (error: any) {
        if (error.message?.includes("not found")) {
          notFoundIds.push(txId);
        } else {
          errors.push({ id: txId, error: error.message });
        }
      }
    }

    console.log(`✓ Found ${graphqlResults.length} transactions in GraphQL`);
    console.log(`⚠ ${notFoundIds.length} transactions not found in GraphQL`);
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} errors querying GraphQL\n`);
    } else {
      console.log("");
    }

    // Step 3: Compare results for transactions found in both
    console.log("Step 3: Comparing results...\n");

    const comparisons = {
      total: graphqlResults.length,
      ownerMatches: 0,
      recipientMatches: 0,
      blockHeightMatches: 0,
      tagCountMatches: 0,
      fullMatches: 0,
      recipientStats: {
        parquetHas: 0,
        graphqlHas: 0,
        bothHave: 0,
        neitherHas: 0,
      },
    };

    for (const gqlTx of graphqlResults) {
      const parquetTx = parquetResult.data.find((tx) => tx.id === gqlTx.id);
      if (!parquetTx) continue;

      let isFullMatch = true;

      // Compare owner.address
      if (parquetTx.owner.address === gqlTx.owner.address) {
        comparisons.ownerMatches++;
      } else {
        isFullMatch = false;
        console.log(`  ❌ Owner mismatch for ${gqlTx.id.substring(0, 10)}...`);
        console.log(`     Parquet: ${parquetTx.owner.address}`);
        console.log(`     GraphQL: ${gqlTx.owner.address}`);
      }

      // Compare recipient and track statistics
      const parquetHasRecipient = !!parquetTx.recipient;
      const gqlHasRecipient = !!gqlTx.recipient;
      
      if (parquetHasRecipient && gqlHasRecipient) {
        comparisons.recipientStats.bothHave++;
      } else if (parquetHasRecipient) {
        comparisons.recipientStats.parquetHas++;
      } else if (gqlHasRecipient) {
        comparisons.recipientStats.graphqlHas++;
      } else {
        comparisons.recipientStats.neitherHas++;
      }
      
      // Recipients match if:
      // 1. Both have the same value (including both being null/undefined)
      // 2. Both are falsy (null, undefined, or empty string)
      const recipientsMatch = parquetTx.recipient === gqlTx.recipient || 
                              (!parquetTx.recipient && !gqlTx.recipient);
      
      if (recipientsMatch) {
        comparisons.recipientMatches++;
      } else {
        isFullMatch = false;
        // Log actual mismatches (where one has a value and the other doesn't, or different values)
        console.log(`  ⚠ Recipient mismatch for ${gqlTx.id.substring(0, 10)}...`);
        console.log(`     Parquet: ${parquetTx.recipient || "null/undefined"}`);
        console.log(`     GraphQL: ${gqlTx.recipient || "null/undefined"}`);
      }

      // Compare block height
      if (parquetTx.block?.height === gqlTx.block?.height) {
        comparisons.blockHeightMatches++;
      } else {
        isFullMatch = false;
        console.log(`  ⚠ Block height mismatch for ${gqlTx.id.substring(0, 10)}...`);
        console.log(`     Parquet: ${parquetTx.block?.height || "null"}`);
        console.log(`     GraphQL: ${gqlTx.block?.height || "null"}`);
      }

      // Compare tag count (not exact tags, as order might differ)
      const parquetTagCount = parquetTx.tags?.length || 0;
      const gqlTagCount = gqlTx.tags?.length || 0;
      if (parquetTagCount === gqlTagCount) {
        comparisons.tagCountMatches++;
      } else {
        isFullMatch = false;
        console.log(`  ⚠ Tag count mismatch for ${gqlTx.id.substring(0, 10)}...`);
        console.log(`     Parquet: ${parquetTagCount} tags`);
        console.log(`     GraphQL: ${gqlTagCount} tags`);
      }

      if (isFullMatch) {
        comparisons.fullMatches++;
      }
    }

    // Print summary
    console.log("\n📊 Validation Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total comparisons:     ${comparisons.total}`);
    console.log(`Owner matches:         ${comparisons.ownerMatches} (${((comparisons.ownerMatches / comparisons.total) * 100).toFixed(1)}%)`);
    console.log(`Recipient matches:     ${comparisons.recipientMatches} (${((comparisons.recipientMatches / comparisons.total) * 100).toFixed(1)}%) *`);
    console.log(`Block height matches:  ${comparisons.blockHeightMatches} (${((comparisons.blockHeightMatches / comparisons.total) * 100).toFixed(1)}%)`);
    console.log(`Tag count matches:     ${comparisons.tagCountMatches} (${((comparisons.tagCountMatches / comparisons.total) * 100).toFixed(1)}%)`);
    console.log(`Full matches:          ${comparisons.fullMatches} (${((comparisons.fullMatches / comparisons.total) * 100).toFixed(1)}%)`);
    console.log("");
    console.log("📦 Recipient Details:");
    console.log(`  Both have recipient:    ${comparisons.recipientStats.bothHave} (values match)`);
    console.log(`  Neither has recipient:  ${comparisons.recipientStats.neitherHas} (both null/undefined = match)`);
    console.log(`  Only Parquet has:       ${comparisons.recipientStats.parquetHas} (mismatch)`);
    console.log(`  Only GraphQL has:       ${comparisons.recipientStats.graphqlHas} (mismatch)`);
    console.log("");
    console.log("* Recipient match = same value OR both null/undefined");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Assertions - we expect high match rates
    expect(comparisons.total).toBeGreaterThan(0);
    
    // Core fields should have very high match rates (95%+)
    const ownerMatchRate = comparisons.ownerMatches / comparisons.total;
    expect(ownerMatchRate).toBeGreaterThanOrEqual(0.95);

    const recipientMatchRate = comparisons.recipientMatches / comparisons.total;
    expect(recipientMatchRate).toBeGreaterThanOrEqual(0.95);

    const blockMatchRate = comparisons.blockHeightMatches / comparisons.total;
    expect(blockMatchRate).toBeGreaterThanOrEqual(0.95);
  });

  it("should query same transaction from both clients", async () => {
    console.log("\n🔄 Testing client with different providers...\n");

    // Query the same transaction from both providers
    const parquetResult = await parquetClient.getTransactions({ first: 1 });
    expect(parquetResult.data.length).toBeGreaterThan(0);
    
    const txId = parquetResult.data[0].id;
    console.log(`Testing with transaction: ${txId}\n`);

    // Get from parquet via client
    console.log("Querying via Parquet client...");
    const parquetTx = await parquetClient.getTransaction(txId);
    console.log(`✓ Retrieved from Parquet: ${parquetTx.id}`);
    console.log(`  Owner: ${parquetTx.owner.address}`);
    console.log(`  Block: ${parquetTx.block?.height || "null"}`);

    // Try to get from GraphQL via client
    console.log("\nQuerying via GraphQL client...");
    
    try {
      const graphqlTx = await graphqlClient.getTransaction(txId);
      console.log(`✓ Retrieved from GraphQL: ${graphqlTx.id}`);
      console.log(`  Owner: ${graphqlTx.owner.address}`);
      console.log(`  Block: ${graphqlTx.block?.height || "null"}`);

      // If we got it from both, compare
      expect(parquetTx.id).toBe(graphqlTx.id);
      expect(parquetTx.owner.address).toBe(graphqlTx.owner.address);
      console.log("\n✓ Both clients returned consistent data\n");
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        console.log(`⚠ Transaction not found in GraphQL (this is expected for older/fixture data)\n`);
      } else {
        throw error;
      }
    }
  });

  it("should handle provider fallback scenarios", async () => {
    console.log("\n🔀 Testing provider fallback scenarios...\n");

    // Get some transactions from parquet
    const parquetResult = await parquetClient.getTransactions({ first: 5 });
    expect(parquetResult.data.length).toBeGreaterThan(0);

    console.log(`Testing fallback with ${parquetResult.data.length} transactions...\n`);

    for (const tx of parquetResult.data) {
      // Try GraphQL client first
      try {
        await graphqlClient.getTransaction(tx.id);
        console.log(`✓ ${tx.id.substring(0, 10)}... found in GraphQL`);
      } catch (error: any) {
        if (error.message?.includes("not found")) {
          console.log(`⚠ ${tx.id.substring(0, 10)}... not in GraphQL, falling back to Parquet`);
          
          // Fallback to Parquet client
          const parquetTx = await parquetClient.getTransaction(tx.id);
          expect(parquetTx.id).toBe(tx.id);
          console.log(`  ✓ Successfully retrieved from Parquet client`);
        } else {
          throw error;
        }
      }
    }

    console.log("\n✓ Fallback mechanism validated\n");
  });
});

