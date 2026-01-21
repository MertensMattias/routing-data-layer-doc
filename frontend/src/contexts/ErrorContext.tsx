import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  showError: (message: string, autoRetry?: boolean) => void;
  clearError: () => void;
  retry: (() => void) | null;
  setRetryCallback: (callback: (() => void) | null) => void;
  autoRetry: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * ErrorProvider - Global error state management
 * Provides error display and retry functionality across the app
 */
export function ErrorProvider({ children }: ErrorProviderProps) {
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);

  const showError = useCallback((message: string, shouldAutoRetry = false) => {
    setError(message);
    setAutoRetry(shouldAutoRetry);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetry(null);
    setAutoRetry(false);
  }, []);

  const setRetryCallback = useCallback((callback: (() => void) | null) => {
    setRetry(() => callback);
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        error,
        showError,
        clearError,
        retry,
        setRetryCallback,
        autoRetry,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
}

/**
 * useError - Hook to access global error state
 */
export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
