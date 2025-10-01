/**
 * Global type definitions for integration tests
 */

import type { ArIONodeContainer } from "./testcontainers-helper";

declare global {
  // Node.js environment
  namespace NodeJS {
    interface Global {
      __ARIO_NODE__?: ArIONodeContainer;
    }
  }

  // Browser environment
  interface Window {
    __ARIO_NODE__?: ArIONodeContainer;
  }

  // Both environments
  var __ARIO_NODE__: ArIONodeContainer | undefined;
}

export {};

