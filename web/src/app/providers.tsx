import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { NotificationProvider } from '@/features/notifications/NotificationProvider';
import { NotificationToasts } from '@/features/notifications/NotificationToasts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          {children}
          <NotificationToasts />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
