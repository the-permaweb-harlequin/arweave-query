import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetcher } from './fetcher';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Amount = {
  __typename?: 'Amount';
  ar: Scalars['String']['output'];
  winston: Scalars['String']['output'];
};

export type Block = {
  __typename?: 'Block';
  height: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  previous: Scalars['ID']['output'];
  timestamp: Scalars['Int']['output'];
};

export type BlockConnection = {
  __typename?: 'BlockConnection';
  edges: Array<BlockEdge>;
  pageInfo: PageInfo;
};

export type BlockEdge = {
  __typename?: 'BlockEdge';
  cursor: Scalars['String']['output'];
  node: Block;
};

export type BlockFilter = {
  max?: InputMaybe<Scalars['Int']['input']>;
  min?: InputMaybe<Scalars['Int']['input']>;
};

export type Bundle = {
  __typename?: 'Bundle';
  id: Scalars['ID']['output'];
};

export type MetaData = {
  __typename?: 'MetaData';
  size: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type Owner = {
  __typename?: 'Owner';
  address: Scalars['String']['output'];
  key: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean']['output'];
};

export type Parent = {
  __typename?: 'Parent';
  id: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  block?: Maybe<Block>;
  blocks: BlockConnection;
  transaction?: Maybe<Transaction>;
  transactions: TransactionConnection;
};


export type QueryBlockArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryBlocksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  height?: InputMaybe<BlockFilter>;
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
  sort?: InputMaybe<SortOrder>;
};


export type QueryTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  block?: InputMaybe<BlockFilter>;
  bundledIn?: InputMaybe<Array<Scalars['ID']['input']>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  ids?: InputMaybe<Array<Scalars['ID']['input']>>;
  owners?: InputMaybe<Array<Scalars['String']['input']>>;
  recipients?: InputMaybe<Array<Scalars['String']['input']>>;
  sort?: InputMaybe<SortOrder>;
  tags?: InputMaybe<Array<TagFilter>>;
};

export enum SortOrder {
  HeightAsc = 'HEIGHT_ASC',
  HeightDesc = 'HEIGHT_DESC'
}

export type Tag = {
  __typename?: 'Tag';
  name: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type TagFilter = {
  name: Scalars['String']['input'];
  op?: InputMaybe<TagOperator>;
  values: Array<Scalars['String']['input']>;
};

export enum TagOperator {
  Eq = 'EQ',
  Neq = 'NEQ'
}

export type Transaction = {
  __typename?: 'Transaction';
  anchor: Scalars['String']['output'];
  block?: Maybe<Block>;
  bundledIn?: Maybe<Bundle>;
  data: MetaData;
  fee: Amount;
  id: Scalars['ID']['output'];
  owner: Owner;
  /** @deprecated Use `bundledIn` */
  parent?: Maybe<Parent>;
  quantity: Amount;
  recipient: Scalars['String']['output'];
  signature: Scalars['String']['output'];
  tags: Array<Tag>;
};

export type TransactionConnection = {
  __typename?: 'TransactionConnection';
  edges: Array<TransactionEdge>;
  pageInfo: PageInfo;
};

export type TransactionEdge = {
  __typename?: 'TransactionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type BlocksQueryVariables = Exact<{
  ids?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  height?: InputMaybe<BlockFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<SortOrder>;
}>;


export type BlocksQuery = { __typename?: 'Query', blocks: { __typename?: 'BlockConnection', pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean }, edges: Array<{ __typename?: 'BlockEdge', cursor: string, node: { __typename?: 'Block', id: string, timestamp: number, height: number, previous: string } }> } };

export type BlockQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type BlockQuery = { __typename?: 'Query', block?: { __typename?: 'Block', id: string, timestamp: number, height: number, previous: string } | null };

export type TransactionsQueryVariables = Exact<{
  owners?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  recipients?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  tags?: InputMaybe<Array<TagFilter> | TagFilter>;
  block?: InputMaybe<BlockFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type TransactionsQuery = { __typename?: 'Query', transactions: { __typename?: 'TransactionConnection', pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean }, edges: Array<{ __typename?: 'TransactionEdge', cursor: string, node: { __typename?: 'Transaction', id: string, anchor: string, signature: string, recipient: string, owner: { __typename?: 'Owner', address: string, key: string }, tags: Array<{ __typename?: 'Tag', name: string, value: string }>, block?: { __typename?: 'Block', id: string, height: number, timestamp: number, previous: string } | null, fee: { __typename?: 'Amount', winston: string, ar: string }, quantity: { __typename?: 'Amount', winston: string, ar: string }, data: { __typename?: 'MetaData', size: string, type?: string | null } } }> } };

export type TransactionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TransactionQuery = { __typename?: 'Query', transaction?: { __typename?: 'Transaction', id: string, anchor: string, signature: string, recipient: string, owner: { __typename?: 'Owner', address: string, key: string }, tags: Array<{ __typename?: 'Tag', name: string, value: string }>, block?: { __typename?: 'Block', id: string, height: number, timestamp: number, previous: string } | null, fee: { __typename?: 'Amount', winston: string, ar: string }, quantity: { __typename?: 'Amount', winston: string, ar: string }, data: { __typename?: 'MetaData', size: string, type?: string | null } } | null };



export const BlocksDocument = `
    query blocks($ids: [ID!], $height: BlockFilter, $first: Int, $after: String, $sort: SortOrder) {
  blocks(ids: $ids, height: $height, first: $first, after: $after, sort: $sort) {
    pageInfo {
      hasNextPage
    }
    edges {
      cursor
      node {
        id
        timestamp
        height
        previous
      }
    }
  }
}
    `;

export const useBlocksQuery = <
      TData = BlocksQuery,
      TError = unknown
    >(
      variables?: BlocksQueryVariables,
      options?: Omit<UseQueryOptions<BlocksQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<BlocksQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<BlocksQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['blocks'] : ['blocks', variables],
    queryFn: fetcher<BlocksQuery, BlocksQueryVariables>(BlocksDocument, variables),
    ...options
  }
    )};

export const BlockDocument = `
    query block($id: String!) {
  block(id: $id) {
    id
    timestamp
    height
    previous
  }
}
    `;

export const useBlockQuery = <
      TData = BlockQuery,
      TError = unknown
    >(
      variables: BlockQueryVariables,
      options?: Omit<UseQueryOptions<BlockQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<BlockQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<BlockQuery, TError, TData>(
      {
    queryKey: ['block', variables],
    queryFn: fetcher<BlockQuery, BlockQueryVariables>(BlockDocument, variables),
    ...options
  }
    )};

export const TransactionsDocument = `
    query transactions($owners: [String!], $recipients: [String!], $tags: [TagFilter!], $block: BlockFilter, $first: Int, $after: String) {
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
    }
    edges {
      cursor
      node {
        id
        anchor
        signature
        owner {
          address
          key
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
          previous
        }
        fee {
          winston
          ar
        }
        quantity {
          winston
          ar
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

export const useTransactionsQuery = <
      TData = TransactionsQuery,
      TError = unknown
    >(
      variables?: TransactionsQueryVariables,
      options?: Omit<UseQueryOptions<TransactionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<TransactionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<TransactionsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['transactions'] : ['transactions', variables],
    queryFn: fetcher<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, variables),
    ...options
  }
    )};

export const TransactionDocument = `
    query transaction($id: ID!) {
  transaction(id: $id) {
    id
    anchor
    signature
    owner {
      address
      key
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
      previous
    }
    fee {
      winston
      ar
    }
    quantity {
      winston
      ar
    }
    data {
      size
      type
    }
  }
}
    `;

export const useTransactionQuery = <
      TData = TransactionQuery,
      TError = unknown
    >(
      variables: TransactionQueryVariables,
      options?: Omit<UseQueryOptions<TransactionQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<TransactionQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<TransactionQuery, TError, TData>(
      {
    queryKey: ['transaction', variables],
    queryFn: fetcher<TransactionQuery, TransactionQueryVariables>(TransactionDocument, variables),
    ...options
  }
    )};
