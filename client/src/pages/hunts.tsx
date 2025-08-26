import { useState } from "react";
import { Link } from "wouter";
import { Download, Plus, Trophy, Play, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HuntCard } from "@/components/hunt-card";
import { CreateHuntModal } from "@/components/create-hunt-modal";
import { useHunts, useStats } from "@/hooks/use-hunts";
import { useBonuses } from "@/hooks/use-bonuses";
import { formatCurrency } from "@/lib/currency";

export default function HuntsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: hunts, isLoading: huntsLoading } = useHunts();
  const { data: stats, isLoading: statsLoading } = useStats();

  if (huntsLoading || statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Your Bonus Hunts</h2>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="bg-green-600 hover:bg-green-700 border-green-600"
              data-testid="button-export-hunts"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-create-hunt"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Hunt
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Hunts</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-hunts">
                    {stats?.totalHunts || 0}
                  </p>
                </div>
                <div className="bg-primary/20 p-3 rounded-lg">
                  <Trophy className="text-primary text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Hunts</p>
                  <p className="text-2xl font-bold text-green-400" data-testid="text-active-hunts">
                    {stats?.activeHunts || 0}
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <Play className="text-green-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold text-yellow-400" data-testid="text-total-spent">
                    {formatCurrency(stats?.totalSpent || 0)}
                  </p>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-lg">
                  <DollarSign className="text-yellow-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Won</p>
                  <p className="text-2xl font-bold text-green-400" data-testid="text-total-won">
                    {formatCurrency(stats?.totalWon || 0)}
                  </p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <TrendingUp className="text-green-400 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hunts Grid */}
        {hunts && hunts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hunts.map((hunt) => (
              <HuntCard key={hunt.id} hunt={hunt} bonusCount={(hunt as any).bonusCount || 0} />
            ))}
          </div>
        ) : (
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No hunts yet</h3>
              <p className="text-gray-400 mb-6">Create your first bonus hunt to get started!</p>
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-first-hunt"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Hunt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateHuntModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
