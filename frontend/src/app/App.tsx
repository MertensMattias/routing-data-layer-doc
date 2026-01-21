import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/common';
import { CompanyProjectContextProvider } from '@/contexts/CompanyProjectContext';
import { ErrorProvider } from '@/contexts/ErrorContext';
import { routes } from './routes';

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 for better balance)
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2, // Reduced from 3 to fail faster (better UX)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s instead of 30s
      refetchOnWindowFocus: false, // Disabled for better performance (can be enabled per-query if needed)
      refetchOnReconnect: true, // Keep reconnect refetch for network recovery
      refetchOnMount: true, // Keep mount refetch for fresh data
    },
  },
});

// Create router with providers as root element
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <ErrorProvider>
          <CompanyProjectContextProvider>
            <Outlet />
            <Toaster />
          </CompanyProjectContextProvider>
        </ErrorProvider>
      </AuthProvider>
    ),
    children: routes,
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
