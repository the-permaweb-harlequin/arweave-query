import { useInfiniteQuery, type UseInfiniteQueryOptions, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { useArweaveQueryContext } from '../providers/ArweaveQueryProvider.js';
import type { QueryFilter, QueryResult, QueryOptions } from '@arweave-query/core';

export interface UseArweaveInfiniteQueryOptions extends QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
}

export function useArweaveInfiniteQuery(
  filter: QueryFilter,
  options: UseArweaveInfiniteQueryOptions = {}
): UseInfiniteQueryResult<QueryResult, Error> {
  const { client } = useArweaveQueryContext();

  const queryKey = ['arweave-infinite-query', filter, options.provider];

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const queryFilter = {
        ...filter,
        after: pageParam as string | undefined,
      };
      return client.query(queryFilter, options);
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.cursor : undefined;
    },
    initialPageParam: undefined,
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    staleTime: options.cacheTtl,
  } as UseInfiniteQueryOptions<QueryResult, Error>);
}
