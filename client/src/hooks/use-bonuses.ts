import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Bonus, InsertBonus } from "@shared/schema";

export function useBonuses(huntId: string) {
  return useQuery<Bonus[]>({
    queryKey: ["/api/hunts", huntId, "bonuses"],
    enabled: !!huntId,
  });
}

export function useCreateBonus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bonus: InsertBonus) => {
      const response = await apiRequest("POST", "/api/admin/bonuses", bonus);
      return response.json();
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId, "bonuses"] });
    },
  });
}

export function useUpdateBonus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, huntId, ...data }: { id: string; huntId: string } & Partial<Bonus>) => {
      const response = await apiRequest("PUT", `/api/admin/bonuses/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId, "bonuses"] });
    },
  });
}

export function useDeleteBonus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, huntId }: { id: string; huntId: string }) => {
      await apiRequest("DELETE", `/api/admin/bonuses/${id}`);
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId, "bonuses"] });
    },
  });
}
