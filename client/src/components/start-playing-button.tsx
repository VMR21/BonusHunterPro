import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminRequest } from "@/hooks/use-admin";
import { Play, DollarSign, Calculator } from "lucide-react";
import type { Hunt, Bonus } from "@shared/schema";

interface StartPlayingButtonProps {
  hunt: Hunt;
  bonuses: Bonus[];
}

export function StartPlayingButton({ hunt, bonuses }: StartPlayingButtonProps) {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [winAmount, setWinAmount] = useState("");
  const { request } = useAdminRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Start playing mutation
  const startPlayingMutation = useMutation({
    mutationFn: async () => {
      return request(`/api/admin/hunts/${hunt.id}/start-playing`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${hunt.id}`] });
      toast({
        title: "Hunt Started",
        description: "You can now record payouts for bonuses",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start hunt",
        variant: "destructive",
      });
    },
  });

  // Payout mutation
  const payoutMutation = useMutation({
    mutationFn: async ({ bonusId, winAmount }: { bonusId: string; winAmount: number }) => {
      return request(`/api/admin/bonuses/${bonusId}/payout`, {
        method: 'POST',
        body: { winAmount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${hunt.id}/bonuses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${hunt.id}`] });
      setShowPayoutModal(false);
      setSelectedBonus(null);
      setWinAmount("");
      toast({
        title: "Payout Recorded",
        description: "Bonus payout and multiplier have been calculated",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payout",
        variant: "destructive",
      });
    },
  });

  const handleBonusClick = (bonus: Bonus) => {
    if (hunt.isPlaying && !bonus.isPlayed) {
      setSelectedBonus(bonus);
      setWinAmount("");
      setShowPayoutModal(true);
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBonus && winAmount) {
      const amount = parseFloat(winAmount);
      if (amount >= 0) {
        payoutMutation.mutate({
          bonusId: selectedBonus.id,
          winAmount: amount,
        });
      }
    }
  };

  const calculateMultiplier = () => {
    if (selectedBonus && winAmount) {
      const betAmount = Number(selectedBonus.betAmount);
      const amount = parseFloat(winAmount);
      return betAmount > 0 ? (amount / betAmount).toFixed(2) : "0.00";
    }
    return "0.00";
  };

  const nextUnplayedBonus = bonuses.find(b => !b.isPlayed);

  return (
    <>
      {!hunt.isPlaying ? (
        <Button
          onClick={() => startPlayingMutation.mutate()}
          disabled={startPlayingMutation.isPending || bonuses.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-start-playing"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Playing
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Play className="w-4 h-4" />
              <span className="font-semibold">Hunt is Active</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Click on bonuses below to record payouts and calculate multipliers
            </p>
          </div>

          {nextUnplayedBonus && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">Next Bonus</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {nextUnplayedBonus.slotName} - ${Number(nextUnplayedBonus.betAmount).toFixed(2)} bet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payout Modal */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Record Payout
            </DialogTitle>
            <DialogDescription>
              Enter the win amount for {selectedBonus?.slotName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayoutSubmit} className="space-y-4">
            {selectedBonus && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Slot:</span>
                  <span className="font-medium">{selectedBonus.slotName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Bet Amount:</span>
                  <span className="font-medium">${Number(selectedBonus.betAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="font-medium">{selectedBonus.provider}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="winAmount">Win Amount ($)</Label>
              <Input
                id="winAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={winAmount}
                onChange={(e) => setWinAmount(e.target.value)}
                disabled={payoutMutation.isPending}
                data-testid="input-win-amount"
              />
            </div>

            {winAmount && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Calculator className="w-4 h-4" />
                  <span className="font-medium">Calculated Multiplier: {calculateMultiplier()}x</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayoutModal(false)}
                disabled={payoutMutation.isPending}
                data-testid="button-cancel-payout"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!winAmount || payoutMutation.isPending}
                data-testid="button-submit-payout"
              >
                {payoutMutation.isPending ? "Recording..." : "Record Payout"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}