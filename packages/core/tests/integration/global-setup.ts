/**
 * Global setup for integration tests
 * Starts the AR-IO node container once for both Node.js and browser tests
 */
import {
  startArIONode,
  verifyArIONode,
  type ArIONodeContainer,
} from "./testcontainers-helper";
import { writeFileSync } from "fs";
import { resolve } from "path";

let arIONode: ArIONodeContainer;

export async function setup() {
  console.log("\n🚀 Starting AR-IO node container (global setup)...\n");

  arIONode = await startArIONode();
  await verifyArIONode(arIONode);

  // Write container info to a file so browser tests can access it
  const containerInfo = {
    apiUrl: arIONode.apiUrl,
    graphqlUrl: arIONode.graphqlUrl,
    datasetsUrl: arIONode.datasetsUrl,
    port: arIONode.port,
  };

  const infoPath = resolve(__dirname, "container-info.json");
  writeFileSync(infoPath, JSON.stringify(containerInfo, null, 2));

  console.log(`\n✅ AR-IO node ready at ${arIONode.apiUrl}`);
  console.log(`📝 Container info written to: ${infoPath}\n`);

  // Store in global for Node.js tests
  (global as any).__ARIO_NODE__ = arIONode;

  // Set environment variables for browser tests (which can't read files)
  process.env.ARIO_API_URL = arIONode.apiUrl;
  process.env.ARIO_GRAPHQL_URL = arIONode.graphqlUrl;
  process.env.ARIO_DATASETS_URL = arIONode.datasetsUrl;
  process.env.ARIO_PORT = arIONode.port.toString();

  console.log(`📦 Environment variables set for browser tests\n`);
}

export async function teardown() {
  console.log("\n🛑 Stopping AR-IO node container (global teardown)...\n");

  if (arIONode) {
    const { stopArIONode } = await import("./testcontainers-helper");
    await stopArIONode(arIONode);
  }

  console.log("✅ Container stopped\n");
}
