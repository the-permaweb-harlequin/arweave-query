import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { useArweaveQueryContext } from '../providers/ArweaveQueryProvider.js';
import type { QueryFilter, QueryResult, QueryOptions } from '@arweave-query/core';

export interface UseArweaveQueryOptions extends QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export function useArweaveQuery(
  filter: QueryFilter,
  options: UseArweaveQueryOptions = {}
): UseQueryResult<QueryResult, Error> {
  const { client } = useArweaveQueryContext();

  const queryKey = ['arweave-query', filter, options.provider];

  return useQuery({
    queryKey,
    queryFn: () => client.query(filter, options),
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    staleTime: options.cacheTtl,
  } as UseQueryOptions<QueryResult, Error>);
}

export function useArweaveTransaction(
  id: string,
  options: UseArweaveQueryOptions = {}
): UseQueryResult<import('@arweave-query/core').ArweaveTransaction | null, Error> {
  const { client } = useArweaveQueryContext();

  const queryKey = ['arweave-transaction', id, options.provider];

  return useQuery({
    queryKey,
    queryFn: () => client.getTransaction(id, options),
    enabled: options.enabled && !!id,
    refetchInterval: options.refetchInterval,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    staleTime: options.cacheTtl,
  });
}
