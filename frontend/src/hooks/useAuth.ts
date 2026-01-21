/**
 * Authentication hook for accessing user context and JWT token
 * Integrates with Azure AD / Okta OIDC
 */

import { useState, useEffect } from 'react';
import { AppRole } from '@shared/types/roles';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  username: string;
  roles: AppRole[];
  groups: string[];
  tenantId?: string;
}

export interface AuthState {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

/**
 * Lazily initialize auth state from localStorage
 * This runs only once on initial render (synchronous)
 */
function getInitialAuthState(): AuthState {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  try {
    const user = decodeToken(token);
    return {
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Invalid token',
    };
  }
}

/**
 * Hook to access authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  // Lazy initialization: getInitialAuthState runs once on mount
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);

  useEffect(() => {
    // Listen for unauthorized events from API client
    const handleUnauthorized = () => {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please login again.',
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async () => {
    const authMode = import.meta.env.VITE_AUTH_MODE;
    const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID;
    const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;

    if (authMode === 'production' && clientId && tenantId) {
      // Production: Azure AD login
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
      window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;
    } else {
      // Dev mode: fetch mock token from backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
        const response = await fetch(`${apiUrl}/dev-auth/token/global-admin`);

        if (response.ok) {
          const data = await response.json();
          const token = data.token;

          // Save token and update auth state
          localStorage.setItem('auth_token', token);
          const user = decodeToken(token);

          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          console.error('Failed to get dev token:', response.statusText);
          setAuthState((prev) => ({
            ...prev,
            error: 'Failed to authenticate. Make sure backend is running.',
          }));
        }
      } catch (error) {
        console.error('Dev auth error:', error);
        setAuthState((prev) => ({
          ...prev,
          error: 'Failed to authenticate. Make sure backend is running on port 3001.',
        }));
      }
    }
  };

  const logout = () => {
    // Clear token from storage
    localStorage.removeItem('auth_token');

    const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID;
    if (tenantId) {
      // Azure AD logout
      window.location.href = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    } else {
      // Local logout
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      window.location.href = '/';
    }
  };

  const refreshToken = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('auth_token', token);
        const user = decodeToken(token);
        setAuthState((prev) => ({
          ...prev,
          user,
          token,
          isAuthenticated: true,
        }));
      } else {
        // Token refresh failed, logout
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshToken,
  };
}

// Helper functions

function decodeToken(token: string): AuthenticatedUser {
  try {
    // JWT tokens are base64url encoded, split into 3 parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Extract user information and map groups to roles
    const groups: string[] = payload.groups || [];
    const roles: AppRole[] = mapGroupsToRoles(groups);

    return {
      userId: payload.sub || payload.oid,
      email: payload.email || payload.preferred_username,
      name: payload.name || payload.email || 'Unknown User',
      username: payload.preferred_username || payload.email || payload.sub,
      roles,
      groups,
      tenantId: payload.tid,
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    throw new Error('Invalid token');
  }
}

function mapGroupsToRoles(groups: string[]): AppRole[] {
  const roles: AppRole[] = [];

  // Map Okta groups to AppRole enum values (preserving domain context)
  const roleMapping: Record<string, AppRole> = {
    // Global roles
    'global-admin': AppRole.GLOBAL_ADMIN,
    'global-dev': AppRole.GLOBAL_DEV,

    // Routing Table roles
    'routing-table-viewer': AppRole.RT_VIEWER,
    'routing-table-editor': AppRole.RT_EDITOR,
    'routing-table-ops': AppRole.RT_OPS,
    'routing-table-admin': AppRole.RT_ADMIN,

    // Message Store roles
    'message-store-viewer': AppRole.MSG_VIEWER,
    'message-store-editor': AppRole.MSG_EDITOR,
    'message-store-ops': AppRole.MSG_OPS,
    'message-store-admin': AppRole.MSG_ADMIN,

    // Segment Store roles
    'segment-store-viewer': AppRole.SEG_VIEWER,
    'segment-store-editor': AppRole.SEG_EDITOR,
    'segment-store-ops': AppRole.SEG_OPS,
    'segment-store-admin': AppRole.SEG_ADMIN,
  };

  // Map each group to its corresponding role
  for (const group of groups) {
    const role = roleMapping[group];
    if (role && !roles.includes(role)) {
      roles.push(role);
    }
  }

  return roles;
}
