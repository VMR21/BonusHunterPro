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
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error('No session token');
      }
      const response = await apiRequest('GET', '/api/admin/check');
      return response.json();
    },
  });

  const isAdmin = adminCheck?.isAdmin || false;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (adminKey: string) => {
      const response = await apiRequest("POST", "/api/admin/login", { adminKey });
      return response.json();
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

      return apiRequest(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    },
    sessionToken,
  };
}