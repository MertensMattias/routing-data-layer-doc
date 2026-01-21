import { useAuth } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading, login, error } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">IVR Routing Manager</h1>
            <p className="mb-6 text-slate-600">Please sign in to continue</p>
            
            {import.meta.env.VITE_AUTH_MODE === 'dev' && (
              <div className="mb-4 rounded-md bg-indigo-50 p-3 border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <strong>Development Mode</strong><br />
                  Using mock authentication from backend
                </p>
              </div>
            )}
            
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <button
              onClick={login}
              className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="mt-6 text-center text-xs text-slate-500">
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
