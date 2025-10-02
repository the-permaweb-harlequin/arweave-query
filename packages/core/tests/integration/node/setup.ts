import { beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Setup before all tests - container is already running from global setup
beforeAll(async () => {
  console.log("Setting up Node.js integration test environment...");

  // Read container info from global setup
  const infoPath = resolve(__dirname, "../container-info.json");
  const containerInfo = JSON.parse(readFileSync(infoPath, "utf-8"));

  console.log(`✅ Using AR-IO node at ${containerInfo.apiUrl}`);

  // Make available to tests
  (global as any).__ARIO_NODE__ = {
    apiUrl: containerInfo.apiUrl,
    graphqlUrl: containerInfo.graphqlUrl,
    datasetsUrl: containerInfo.datasetsUrl,
    port: containerInfo.port,
  };

  console.log("Node.js integration test environment ready");
});
