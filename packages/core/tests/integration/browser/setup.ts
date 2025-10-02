import { beforeAll } from "vitest";

// Setup before all tests - read container info from environment variables
beforeAll(async () => {
  console.log("Loading AR-IO node container info for browser tests...");

  // Read container info from environment variables (set by global setup)
  const apiUrl = process.env.ARIO_API_URL;
  const graphqlUrl = process.env.ARIO_GRAPHQL_URL;
  const datasetsUrl = process.env.ARIO_DATASETS_URL;
  const port = parseInt(process.env.ARIO_PORT || "4000", 10);

  if (!apiUrl) {
    throw new Error(
      "ARIO_API_URL not found. Make sure globalSetup is configured in vitest.config.",
    );
  }

  console.log(`✅ Using AR-IO node at ${apiUrl}`);

  // Make available to tests
  (globalThis as any).__ARIO_NODE__ = {
    apiUrl,
    graphqlUrl,
    datasetsUrl,
    port,
  };

  console.log("Browser integration test environment ready");
});
