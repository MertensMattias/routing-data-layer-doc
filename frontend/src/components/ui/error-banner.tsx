import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoRetrySeconds?: number;
}

/**
 * ErrorBanner - Display persistent error messages with retry functionality
 * Shows at the top of the page when backend errors occur
 */
export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  autoRetrySeconds
}: ErrorBannerProps) {
  const [countdown, setCountdown] = useState<number | null>(
    autoRetrySeconds ?? null
  );

  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          onRetry?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  return (
    <div className="flex items-center gap-3 border-b bg-destructive/10 px-6 py-3 text-sm">
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="flex-1 text-destructive font-medium">{message}</p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex items-center gap-2 border-destructive/30 text-destructive hover:bg-destructive/20"
        >
          <RefreshCw className="h-4 w-4" />
          {countdown ? `Retry in ${countdown}s` : 'Retry Now'}
        </Button>
      )}

      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-destructive hover:bg-destructive/20"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to manage error banner state
 */
export function useErrorBanner() {
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    showError,
    clearError,
  };
}
