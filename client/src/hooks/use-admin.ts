import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Admin authentication hook
export function useAdmin() {
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem('adminSessionToken')
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Check admin session
  const { data: adminCheck, isLoading } = useQuery({
    queryKey: ['/api/admin/check'],
    enabled: !!sessionToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error('No session token');
      }
      try {
        const response = await fetch('/api/admin/check', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
        if (!response.ok) {
          throw new Error('Session check failed');
        }
        return response.json();
      } catch (error) {
        console.error('Admin check error:', error);
        throw error;
      }
    },
  });

  const isAdmin = adminCheck?.isAdmin || false;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (adminKey: string) => {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({ adminKey }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Login failed');
        }
        return response.json();
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const token = data.sessionToken;
      setSessionToken(token);
      localStorage.setItem('adminSessionToken', token);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
      toast({
        title: "Login Successful",
        description: "You are now logged in as admin",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin key",
        variant: "destructive",
      });
    },
  });

  // Logout function
  const logout = () => {
    setSessionToken(null);
    localStorage.removeItem('adminSessionToken');
    queryClient.clear();
    toast({
      title: "Logged Out",
      description: "You have been logged out",
      variant: "default",
    });
  };

  // Auto-logout on session expiry
  useEffect(() => {
    if (sessionToken && adminCheck && !adminCheck.isAdmin) {
      logout();
    }
  }, [sessionToken, adminCheck]);

  return {
    isAdmin,
    isLoading,
    sessionToken,
    login: loginMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
  };
}

// Hook for making authenticated admin requests
export function useAdminRequest() {
  const { sessionToken } = useAdmin();

  return {
    request: async (url: string, options: any = {}) => {
      if (!sessionToken) {
        throw new Error('Not authenticated as admin');
      }

      return apiRequest(options.method || "GET", url, options.body);
    },
    sessionToken,
  };
}