import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminDisplayName?: string;
  adminKey?: string;
  sessionToken?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication status on mount and when token changes
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('adminSessionToken');
    
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: data.isAdmin,
          isLoading: false,
          adminDisplayName: data.adminDisplayName,
          adminKey: data.adminKey,
          sessionToken: token,
        });
      } else {
        // Invalid token, remove it
        localStorage.removeItem('adminSessionToken');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (adminKey: string): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiRequest('POST', '/api/admin/login', { adminKey });

      const data = await response.json();
      if (data.sessionToken) {
        localStorage.setItem('adminSessionToken', data.sessionToken);
        await checkAuthStatus(); // Refresh auth state
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('adminSessionToken');
    
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    localStorage.removeItem('adminSessionToken');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };
}