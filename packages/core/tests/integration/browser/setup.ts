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
  console.log("Setting up browser integration test environment...");
  
  // Start AR-IO node container
  arIONode = await startArIONode();
  
  // Verify it's working
  await verifyArIONode(arIONode);
  
  // Make container info available globally for tests
  (globalThis as any).__ARIO_NODE__ = arIONode;
  
  console.log("Browser integration test environment ready");
}, 120_000); // 2 minute timeout

// Cleanup after all tests
afterAll(async () => {
  if (arIONode) {
    await stopArIONode(arIONode);
    (globalThis as any).__ARIO_NODE__ = undefined;
  }
}, 30_000);

