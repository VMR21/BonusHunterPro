import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const method = options?.method || "GET";
  const headers: Record<string, string> = {
    ...options?.headers,
    ...(options?.body ? { "Content-Type": "application/json" } : {}),
  };
  
  // Add Bearer token for authenticated requests
  const sessionToken = localStorage.getItem('adminSessionToken');
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const headers: Record<string, string> = {};
    
    // Add Bearer token for authenticated requests
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for immediate updates
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
