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
      return await apiRequest("POST", `/api/hunts/${bonus.huntId}/bonuses`, bonus);
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
      const response = await apiRequest("PUT", `/api/bonuses/${id}`, data);
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
      await apiRequest("DELETE", `/api/bonuses/${id}`);
    },
    onSuccess: (_, { huntId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId, "bonuses"] });
    },
  });
}

export function useRecordPayout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bonusId, winAmount, huntId }: { bonusId: string; winAmount: number; huntId: string }) => {
      const response = await apiRequest("POST", `/api/bonuses/${bonusId}/payout`, { winAmount });
      return response.json();
    },
    onSuccess: (_, { huntId }) => {
      // Invalidate both bonuses and hunt data to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId, "bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunts", huntId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-hunts"] });
    },
  });
}
