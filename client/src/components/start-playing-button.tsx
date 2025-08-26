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
import { useRecordPayout } from "@/hooks/use-bonuses";

import { Play, DollarSign, Calculator, Edit } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

interface StartPlayingButtonProps {
  hunt: Hunt;
  bonuses: Bonus[];
}

export function StartPlayingButton({ hunt, bonuses }: StartPlayingButtonProps) {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showEditBetModal, setShowEditBetModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [winAmount, setWinAmount] = useState("");
  const [editBetAmount, setEditBetAmount] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const recordPayout = useRecordPayout();

  // Start playing mutation
  const startPlayingMutation = useMutation({
    mutationFn: async () => {
      const sessionToken = localStorage.getItem('adminSessionToken');
      const response = await fetch(`/api/hunts/${hunt.id}/start-playing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to start hunt' }));
        throw new Error(errorData.message || 'Failed to start hunt');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${hunt.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/hunts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-hunts'] });
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

  // Edit bet amount mutation
  const editBetMutation = useMutation({
    mutationFn: async ({ bonusId, betAmount }: { bonusId: string; betAmount: string }) => {
      const response = await fetch(`/api/bonuses/${bonusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betAmount }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update bet amount' }));
        throw new Error(errorData.message || 'Failed to update bet amount');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${hunt.id}/bonuses`] });
      setShowEditBetModal(false);
      setSelectedBonus(null);
      setEditBetAmount("");
      toast({
        title: "Bet Amount Updated",
        description: "Bonus bet amount has been updated",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bet amount",
        variant: "destructive",
      });
    },
  });

  // Use the custom payout hook for better tracking
  const handlePayoutSuccess = () => {
    setShowPayoutModal(false);
    setSelectedBonus(null);
    setWinAmount("");
    toast({
      title: "Payout Recorded",
      description: "Bonus payout and multiplier have been calculated",
      variant: "default",
    });
  };

  const handlePayoutError = (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to record payout",
      variant: "destructive",
    });
  };

  const handleBonusClick = (bonus: Bonus) => {
    if (hunt.isPlaying && !bonus.isPlayed) {
      setSelectedBonus(bonus);
      setWinAmount("");
      setShowPayoutModal(true);
    }
  };

  const handleEditBet = (bonus: Bonus) => {
    setSelectedBonus(bonus);
    setEditBetAmount(bonus.betAmount);
    setShowEditBetModal(true);
  };

  const handleEditBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBonus && editBetAmount) {
      editBetMutation.mutate({
        bonusId: selectedBonus.id,
        betAmount: editBetAmount,
      });
    }
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBonus && winAmount) {
      const amount = parseFloat(winAmount);
      if (amount >= 0) {
        recordPayout.mutate({
          bonusId: selectedBonus.id,
          winAmount: amount,
          huntId: hunt.id,
        }, {
          onSuccess: handlePayoutSuccess,
          onError: handlePayoutError,
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
        <div className="space-y-2">
          <Button
            onClick={() => startPlayingMutation.mutate()}
            disabled={startPlayingMutation.isPending || bonuses.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-start-playing"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Playing
          </Button>
          {bonuses.length > 0 && (
            <p className="text-sm text-gray-400">
              You can edit bet amounts before starting
            </p>
          )}
        </div>
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

          {/* Total Payout Display */}
          {bonuses.some(b => b.isPlayed) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Calculator className="w-4 h-4" />
                <span className="font-semibold">Total Payout</span>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(
                  bonuses
                    .filter(b => b.isPlayed && b.winAmount)
                    .reduce((total, b) => total + Number(b.winAmount), 0),
                  hunt.currency as Currency
                )}
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
                disabled={recordPayout.isPending}
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
                disabled={recordPayout.isPending}
                data-testid="button-cancel-payout"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!winAmount || recordPayout.isPending}
                data-testid="button-submit-payout"
              >
                {recordPayout.isPending ? "Recording..." : "Record Payout"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Bet Modal */}
      <Dialog open={showEditBetModal} onOpenChange={setShowEditBetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Bet Amount
            </DialogTitle>
            <DialogDescription>
              Update the bet amount for {selectedBonus?.slotName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBetSubmit} className="space-y-4">
            {selectedBonus && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Slot:</span>
                  <span className="font-medium">{selectedBonus.slotName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="font-medium">{selectedBonus.provider}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editBetAmount">Bet Amount ({hunt.currency})</Label>
              <Input
                id="editBetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editBetAmount}
                onChange={(e) => setEditBetAmount(e.target.value)}
                disabled={editBetMutation.isPending}
                data-testid="input-edit-bet-amount"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditBetModal(false)}
                disabled={editBetMutation.isPending}
                data-testid="button-cancel-edit-bet"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editBetAmount || editBetMutation.isPending}
                data-testid="button-update-bet"
              >
                {editBetMutation.isPending ? "Updating..." : "Update Bet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export components and functions for use in other components  
export { StartPlayingButton as default, type StartPlayingButtonProps };
export type { Hunt, Bonus } from "@shared/schema";