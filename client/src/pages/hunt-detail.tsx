import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Plus, Play, DollarSign, Settings, Edit, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AddBonusModal } from "@/components/add-bonus-modal";
import { ProviderChart } from "@/components/provider-chart";
import { StartPlayingButton } from "@/components/start-playing-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHunt } from "@/hooks/use-hunts";
import { useBonuses } from "@/hooks/use-bonuses";

import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Currency } from "@/lib/currency";
import type { Bonus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function HuntDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [addBonusModalOpen, setAddBonusModalOpen] = useState(false);
  const [showEditBetModal, setShowEditBetModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [editBetAmount, setEditBetAmount] = useState("");
  const [winAmount, setWinAmount] = useState("");
  
  const { data: hunt, isLoading: huntLoading } = useHunt(id!);
  const { data: bonuses, isLoading: bonusesLoading } = useBonuses(id!);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit bet amount mutation
  const editBetMutation = useMutation({
    mutationFn: async ({ bonusId, betAmount }: { bonusId: string; betAmount: string }) => {
      const response = await apiRequest("PUT", `/api/bonuses/${bonusId}`, { betAmount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${id}/bonuses`] });
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

  // Payout mutation  
  const payoutMutation = useMutation({
    mutationFn: async ({ bonusId, winAmount }: { bonusId: string; winAmount: number }) => {
      const response = await apiRequest("POST", `/api/bonuses/${bonusId}/payout`, { winAmount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${id}/bonuses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/hunts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-hunts"] });
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
    if (hunt?.isPlaying && !bonus.isPlayed) {
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

  const handleEditBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBonus && editBetAmount) {
      editBetMutation.mutate({
        bonusId: selectedBonus.id,
        betAmount: editBetAmount,
      });
    }
  };

  if (huntLoading || bonusesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-gray-700 rounded"></div>
              <div className="h-48 bg-gray-700 rounded"></div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-dark-purple/50 border-purple-800/30">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Hunt not found</h3>
            <p className="text-gray-400 mb-6">The hunt you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hunts
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    collecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    opening: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    finished: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const openedBonuses = bonuses?.filter(b => b.isPlayed) || [];
  const totalBonuses = bonuses?.length || 0;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses?.reduce((sum, b) => sum + Number(b.betAmount), 0) || 0;
  const totalWin = openedBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);
  const avgBet = totalBonuses > 0 ? totalCost / totalBonuses : 0;
  const reqX = totalCost > 0 ? (totalCost * 100) / totalCost : 0;
  const startBalance = Number(hunt.startBalance);
  const roi = startBalance > 0 ? (totalWin / startBalance) * 100 : 0;

  const bestWin = openedBonuses.reduce((best, current) => {
    const currentWin = current.winAmount || 0;
    const bestWin = best.winAmount || 0;
    return currentWin > bestWin ? current : best;
  }, openedBonuses[0] || null);

  const bestMulti = openedBonuses.reduce((best, current) => {
    const currentMulti = current.multiplier || 0;
    const bestMulti = best.multiplier || 0;
    return currentMulti > bestMulti ? current : best;
  }, openedBonuses[0] || null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 mb-4"
            data-testid="button-back-to-hunts"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hunts
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">{hunt.title}</h2>
            <p className="text-gray-400">{hunt.casino}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={statusColors[hunt.status as keyof typeof statusColors]}>
              {hunt.status}
            </Badge>
            <StartPlayingButton hunt={hunt} bonuses={bonuses || []} />
            <Button 
              onClick={() => setAddBonusModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-bonus"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bonus
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hunt Info Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-dark-purple/50 border-purple-800/30 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Hunt Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Casino:</span>
                <span className="text-white">{hunt.casino}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Currency:</span>
                <span className="text-white">{hunt.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Start Balance:</span>
                <span className="text-green-400">
                  {formatCurrency(Number(hunt.startBalance), hunt.currency as Currency)}
                </span>
              </div>
              {hunt.endBalance && (
                <div className="flex justify-between">
                  <span className="text-gray-400">End Balance:</span>
                  <span className="text-green-400">
                    {formatCurrency(Number(hunt.endBalance), hunt.currency as Currency)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-purple-800/30">

              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Bonus Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bonuses:</span>
                <span className="text-white">{totalBonuses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg. Bet:</span>
                <span className="text-white">
                  {formatCurrency(avgBet, hunt.currency as Currency)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Total Win:</span>
                <span className="text-green-400">
                  {formatCurrency(totalWin, hunt.currency as Currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ROI:</span>
                <span className={roi >= 0 ? "text-green-400" : "text-red-400"}>
                  {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                </span>
              </div>
              
              <div className="pt-3 border-t border-purple-800/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">{openedBonuses.length}/{totalBonuses}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Provider Distribution Chart */}
          <Card className="bg-dark-purple/50 border-purple-800/30 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Provider Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderChart bonuses={bonuses || []} />
            </CardContent>
          </Card>

          {/* Bonuses Table */}
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Bonus Slots</CardTitle>
            </CardHeader>
            <CardContent>
              {bonuses && bonuses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-400">#</TableHead>
                      <TableHead className="text-gray-400">Slot</TableHead>
                      <TableHead className="text-gray-400">Provider</TableHead>
                      <TableHead className="text-gray-400">Bet</TableHead>
                      <TableHead className="text-gray-400">Multiplier</TableHead>
                      <TableHead className="text-gray-400">Win</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses.map((bonus, index) => (
                      <TableRow 
                        key={bonus.id} 
                        className={`hover:bg-white/5 ${bonus.isPlayed ? 'bg-green-900/20' : hunt.isPlaying && !bonus.isPlayed ? 'bg-blue-900/20 cursor-pointer' : 'bg-gray-900/20'}`}
                        onClick={() => handleBonusClick(bonus)}
                      >
                        <TableCell className="text-gray-300">{bonus.order}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-12 bg-gray-700 rounded overflow-hidden mr-3 flex-shrink-0">
                              {bonus.imageUrl ? (
                                <img
                                  src={bonus.imageUrl}
                                  alt={bonus.slotName}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-slot-${bonus.id}`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-gray-500 text-xs ${bonus.imageUrl ? 'hidden' : ''}`}>
                                No image
                              </div>
                            </div>
                            <span className="text-white text-sm">{bonus.slotName}</span>
                            {!bonus.isPlayed && hunt.isPlaying && (
                              <Badge variant="outline" className="ml-2 text-xs text-blue-400 border-blue-400">
                                CLICK TO RECORD PAYOUT
                              </Badge>
                            )}
                            {bonus.isPlayed && (
                              <Badge variant="outline" className="ml-2 text-xs text-green-400 border-green-400">
                                PLAYED
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{bonus.provider}</TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                        </TableCell>
                        <TableCell className="text-yellow-400">
                          {bonus.multiplier ? `${Number(bonus.multiplier).toFixed(2)}x` : '-'}
                        </TableCell>
                        <TableCell className="text-green-400">
                          {bonus.winAmount ? formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) : '-'}
                        </TableCell>
                        <TableCell>
                          {!hunt.isPlaying && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBonus(bonus);
                                setEditBetAmount(bonus.betAmount);
                                setShowEditBetModal(true);
                              }}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                              data-testid={`button-edit-bet-${bonus.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No bonuses yet</h3>
                  <p className="text-gray-400 mb-6">Add your first bonus to start tracking!</p>
                  <Button 
                    onClick={() => setAddBonusModalOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-add-first-bonus"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Bonus
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddBonusModal
        open={addBonusModalOpen}
        onOpenChange={setAddBonusModalOpen}
        huntId={hunt.id}
        nextOrder={(bonuses?.length || 0) + 1}
      />

      {/* Edit Bet Modal */}
      {selectedBonus && (
        <Dialog open={showEditBetModal} onOpenChange={setShowEditBetModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Bet Amount
              </DialogTitle>
              <DialogDescription>
                Update the bet amount for {selectedBonus.slotName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditBetSubmit} className="space-y-4">
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

              <div className="space-y-2">
                <label htmlFor="editBetAmount" className="text-white">Bet Amount ({hunt.currency})</label>
                <input
                  id="editBetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editBetAmount}
                  onChange={(e) => setEditBetAmount(e.target.value)}
                  disabled={editBetMutation.isPending}
                  data-testid="input-edit-bet-amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
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
    </div>
  );
}
