/**
 * Example usage of ParquetProvider with Waddler
 * This example shows how to use the same code on both Node.js and Web platforms
 */

// For Node.js
import { createNodeParquetProvider } from "../node/parquet.js";

// For Web/Browser
import { createWebParquetProvider } from "../web/parquet.js";

// Or use directly (auto-detects platform)
import { ParquetProvider } from "../providers/transactions/parquet.js";

async function nodeExample() {
  console.log("🚀 Node.js Example with DuckDB-Neo");

  const provider = createNodeParquetProvider({
    parquetUrls: {
      blocks: "https://example.com/arweave/blocks.parquet",
      transactions: "https://example.com/arweave/transactions.parquet",
      tags: "https://example.com/arweave/tags.parquet",
    },
    duckdbConfig: {
      readOnly: true,
      memory: ":memory:",
    },
  });

  // Query transactions
  const transactions = await provider.getTransactions({
    first: 10,
    owners: ["some-owner-address"],
    block: { min: 1000000 },
  });

  console.log(`Found ${transactions.data.length} transactions`);
  console.log("Has next page:", transactions.hasNextPage);

  // Query a specific transaction
  const tx = await provider.getTransaction("some-tx-id");
  console.log("Transaction:", tx.id);

  // Note: Provider cleanup is automatic (no close() method needed)
}

async function webExample() {
  console.log("🌐 Web Example with DuckDB-WASM");

  const provider = createWebParquetProvider({
    parquetUrls: {
      blocks: "https://example.com/arweave/blocks.parquet",
      transactions: "https://example.com/arweave/transactions.parquet",
      tags: "https://example.com/arweave/tags.parquet",
    },
    duckdbConfig: {
      readOnly: true,
    },
  });

  // Same API as Node.js!
  const blocks = await provider.getBlocks({
    first: 5,
    height: { min: 1000000, max: 1100000 },
  });

  console.log(`Found ${blocks.data.length} blocks`);

  // Note: Provider cleanup is automatic (no close() method needed)
}

async function universalExample() {
  console.log("🌍 Universal Example");

  // Use environment-specific provider creators
  // For Node.js, use createNodeParquetProvider
  // For Web, use createWebParquetProvider
  const provider =
    typeof window === "undefined"
      ? createNodeParquetProvider({
          parquetUrls: {
            blocks: "https://example.com/arweave/blocks.parquet",
            transactions: "https://example.com/arweave/transactions.parquet",
            tags: "https://example.com/arweave/tags.parquet",
          },
          duckdbConfig: {
            memory: ":memory:",
            readOnly: false,
          },
        })
      : createWebParquetProvider({
          parquetUrls: {
            blocks: "https://example.com/arweave/blocks.parquet",
            transactions: "https://example.com/arweave/transactions.parquet",
            tags: "https://example.com/arweave/tags.parquet",
          },
          duckdbConfig: {},
        });

  // Complex query with multiple filters
  const results = await provider.getTransactions({
    first: 20,
    owners: ["owner1", "owner2"],
    recipients: ["recipient1"],
    block: { min: 900000 },
    after: "10", // Pagination cursor
  });

  console.log("Results:", results.data.length);

  // Pagination
  if (results.hasNextPage && results.next) {
    const nextPage = await results.next();
    console.log("Next page:", nextPage.data.length);
  }

  // Note: Provider cleanup is automatic (no close() method needed)
}

// Usage examples
if (typeof window === "undefined") {
  // Node.js environment
  nodeExample().catch(console.error);
} else {
  // Browser environment
  webExample().catch(console.error);
}

// Universal example works everywhere
universalExample().catch(console.error);
