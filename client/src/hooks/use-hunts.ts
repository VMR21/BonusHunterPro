import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Hunt, InsertHunt } from "@shared/schema";

export function useHunts() {
  return useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
  });
}

export function useHunt(id: string) {
  return useQuery<Hunt>({
    queryKey: ["/api/hunts", id],
    enabled: !!id,
  });
}

export function useCreateHunt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (hunt: InsertHunt) => {
      const response = await apiRequest("POST", "/api/hunts", hunt);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
    },
  });
}

export function useUpdateHunt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Hunt>) => {
      const response = await apiRequest("PUT", `/api/hunts/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", id] });
    },
  });
}

export function useDeleteHunt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hunts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
  });
}
