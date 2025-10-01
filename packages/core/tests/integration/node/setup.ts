import { beforeAll, afterAll } from "vitest";
import {
  startArIONode,
  stopArIONode,
  verifyArIONode,
  type ArIONodeContainer,
} from "../testcontainers-helper";

// Global container instance
let arIONode: ArIONodeContainer | undefined;

// Setup before all tests
beforeAll(async () => {
  console.log("Setting up integration test environment...");

  // Start AR-IO node container
  arIONode = await startArIONode();

  // Verify it's working
  await verifyArIONode(arIONode);

  // Make container info available globally for tests
  (global as any).__ARIO_NODE__ = arIONode;

  console.log("Integration test environment ready");
}, 240_000); // 4 minute timeout for container startup

// Cleanup after all tests
afterAll(async () => {
  if (arIONode) {
    await stopArIONode(arIONode);
    (global as any).__ARIO_NODE__ = undefined;
  }
}, 30_000);
