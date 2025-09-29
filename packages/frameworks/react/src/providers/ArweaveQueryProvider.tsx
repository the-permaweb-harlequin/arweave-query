import React, { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArweaveQueryClient,
  type ArweaveQueryClientConfig,
} from '@arweave-query/core';

interface ArweaveQueryContextValue {
  client: ArweaveQueryClient;
  queryClient: QueryClient;
}

const ArweaveQueryContext = createContext<ArweaveQueryContextValue | null>(
  null
);

export interface ArweaveQueryProviderProps {
  children: ReactNode;
  config: ArweaveQueryClientConfig;
  queryClient?: QueryClient;
}

export function ArweaveQueryProvider({
  children,
  config,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }),
}: ArweaveQueryProviderProps) {
  const client = React.useMemo(() => new ArweaveQueryClient(config), [config]);

  const value = React.useMemo(
    () => ({
      client,
      queryClient,
    }),
    [client, queryClient]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ArweaveQueryContext.Provider value={value}>
        {children}
      </ArweaveQueryContext.Provider>
    </QueryClientProvider>
  );
}

export function useArweaveQueryContext(): ArweaveQueryContextValue {
  const context = useContext(ArweaveQueryContext);
  if (!context) {
    throw new Error(
      'useArweaveQueryContext must be used within an ArweaveQueryProvider'
    );
  }
  return context;
}
