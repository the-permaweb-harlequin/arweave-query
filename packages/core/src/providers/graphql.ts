import { GraphQLClient } from 'graphql-request';
import type {
  QueryProvider,
  QueryFilter,
  QueryResult,
  ArweaveTransaction,
} from '../types/index.js';

const TRANSACTIONS_QUERY = `
  query GetTransactions(
    $owners: [String!]
    $recipients: [String!]
    $tags: [TagFilter!]
    $block: BlockFilter
    $first: Int
    $after: String
  ) {
    transactions(
      owners: $owners
      recipients: $recipients
      tags: $tags
      block: $block
      first: $first
      after: $after
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          owner {
            address
          }
          recipient
          tags {
            name
            value
          }
          block {
            id
            height
            timestamp
          }
          fee {
            winston
          }
          quantity {
            winston
          }
          data {
            size
            type
          }
        }
      }
    }
  }
`;

const TRANSACTION_QUERY = `
  query GetTransaction($id: ID!) {
    transaction(id: $id) {
      id
      owner {
        address
      }
      recipient
      tags {
        name
        value
      }
      block {
        id
        height
        timestamp
      }
      fee {
        winston
      }
      quantity {
        winston
      }
      data {
        size
        type
      }
    }
  }
`;

export class GraphQLProvider implements QueryProvider {
  name = 'graphql';
  private client: GraphQLClient;

  constructor(endpoint: string = 'https://arweave.net/graphql') {
    this.client = new GraphQLClient(endpoint);
  }

  async query(filter: QueryFilter): Promise<QueryResult> {
    const variables = {
      owners: filter.owners,
      recipients: filter.recipients,
      tags: filter.tags?.map(tag => ({
        name: tag.name,
        values: tag.values,
      })),
      block: filter.block ? {
        min: filter.block.min,
        max: filter.block.max,
      } : undefined,
      first: filter.first || 10,
      after: filter.after,
    };

    const response = await this.client.request(TRANSACTIONS_QUERY, variables);
    
    return {
      data: response.transactions.edges.map((edge: any) => 
        this.transformTransaction(edge.node)
      ),
      hasNextPage: response.transactions.pageInfo.hasNextPage,
      cursor: response.transactions.pageInfo.endCursor,
    };
  }

  async getTransaction(id: string): Promise<ArweaveTransaction | null> {
    const response = await this.client.request(TRANSACTION_QUERY, { id });
    
    if (!response.transaction) {
      return null;
    }

    return this.transformTransaction(response.transaction);
  }

  private transformTransaction(node: any): ArweaveTransaction {
    return {
      id: node.id,
      owner: node.owner.address,
      target: node.recipient,
      quantity: node.quantity?.winston || '0',
      reward: node.fee?.winston || '0',
      last_tx: '', // Not available in GraphQL
      tags: node.tags || [],
      data_size: node.data?.size?.toString() || '0',
      data_root: '', // Not available in GraphQL
      signature: '', // Not available in GraphQL
      block: node.block ? {
        id: node.block.id,
        height: node.block.height,
        timestamp: node.block.timestamp,
      } : undefined,
    };
  }
}
