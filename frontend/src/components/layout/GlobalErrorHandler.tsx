import { useEffect } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { ErrorBanner } from '@/components/ui/error-banner';

/**
 * GlobalErrorHandler - Display global error banner at the top of the app
 * Integrates with ErrorContext to show backend errors with retry functionality
 */
export function GlobalErrorHandler() {
  const { error, clearError, retry, autoRetry } = useError();

  // Listen for backend connection errors
  useEffect(() => {
    const handleBackendError = () => {
      // This will be triggered by failed requests after all retries are exhausted
    };

    window.addEventListener('backend:error', handleBackendError);
    return () => window.removeEventListener('backend:error', handleBackendError);
  }, []);

  if (!error) {
    return null;
  }

  return (
    <ErrorBanner
      message={error}
      onRetry={retry || undefined}
      onDismiss={clearError}
      autoRetrySeconds={autoRetry ? 10 : undefined}
    />
  );
}
