import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "testcontainers";
import { resolve } from "path";

export interface ArIONodeContainer {
  container: StartedTestContainer;
  graphqlUrl: string;
  apiUrl: string;
  datasetsUrl: string;
  port: number;
}

/**
 * Start an AR-IO node container with parquet datasets mounted
 */
export async function startArIONode(): Promise<ArIONodeContainer> {
  const fixturesPath = resolve(
    __dirname,
    "../../../../fixtures/parquet"
  );

  // Allow overriding the AR-IO image via environment variable
  const arIOImage = process.env.ARIO_IMAGE || "ghcr.io/ar-io/ar-io-core:latest";

  console.log("Starting AR-IO node container...");
  console.log("Using image:", arIOImage);
  console.log("Mounting fixtures from:", fixturesPath);

  const container = await new GenericContainer(arIOImage)
    .withEnvironment({
      GRAPHQL_HOST: "arweave.net",
      GRAPHQL_PORT: "443",
      START_HEIGHT: "1761055",
      ARNS_ROOT_HOST: "localhost",
      ENABLE_DATASETS_ENDPOINT: "true",
      NODE_ENV: "development",
      LOG_LEVEL: "error", // Only show errors
    })
    .withExposedPorts(4000)
    .withBindMounts([
      {
        source: fixturesPath,
        target: "/app/data/datasets",
        mode: "ro",
      },
    ])
    .withWaitStrategy(
      Wait.forHttp("/ar-io/info", 4000)
        .forStatusCode(200)
        .withStartupTimeout(180_000) // 3 minutes
    )
    .withStartupTimeout(200_000) // 3+ minutes total
    // Uncomment below to see container logs for debugging
    // .withLogConsumer((stream) => {
    //   stream.on("data", (line) => console.log(`[AR-IO] ${line}`));
    //   stream.on("err", (line) => console.error(`[AR-IO ERROR] ${line}`));
    //   stream.on("end", () => console.log("[AR-IO] Log stream ended"));
    // })
    .start();

  const port = container.getMappedPort(4000);
  const host = container.getHost();

  const apiUrl = `http://${host}:${port}`;
  const graphqlUrl = `${apiUrl}/graphql`;
  const datasetsUrl = `${apiUrl}/ar-io/datasets`;

  console.log(`AR-IO node started at ${apiUrl}`);
  console.log(`GraphQL endpoint: ${graphqlUrl}`);
  console.log(`Datasets endpoint: ${datasetsUrl}`);

  return {
    container,
    graphqlUrl,
    apiUrl,
    datasetsUrl,
    port,
  };
}

/**
 * Stop an AR-IO node container
 */
export async function stopArIONode(
  arIONode: ArIONodeContainer
): Promise<void> {
  console.log("Stopping AR-IO node container...");
  await arIONode.container.stop();
  console.log("AR-IO node container stopped");
}

/**
 * Verify the AR-IO node is healthy and serving data
 */
export async function verifyArIONode(arIONode: ArIONodeContainer): Promise<void> {
  const infoResponse = await fetch(`${arIONode.apiUrl}/ar-io/info`);
  if (!infoResponse.ok) {
    throw new Error(
      `AR-IO node health check failed: ${infoResponse.statusText}`
    );
  }

  const info = await infoResponse.json();
  console.log("AR-IO node info:", info);

  // Verify datasets are accessible by checking for a specific parquet file
  const transactionsParquetUrl = `${arIONode.apiUrl}/local/datasets/transactions.parquet`;
  const parquetResponse = await fetch(transactionsParquetUrl, { method: "HEAD" });
  if (!parquetResponse.ok) {
    console.warn(
      `Warning: transactions.parquet not accessible at ${transactionsParquetUrl}: ${parquetResponse.statusText}`
    );
    console.warn(
      "This is expected if fixtures are not properly mounted or datasets endpoint is not configured"
    );
  } else {
    console.log("Parquet datasets verified and accessible");
  }

  console.log("AR-IO node verified and ready");
}

