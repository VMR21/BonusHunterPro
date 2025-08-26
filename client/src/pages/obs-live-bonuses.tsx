import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface LiveBonus {
  id: string;
  slotName: string;
  slotImageUrl: string;
  betAmount: string;
  winAmount?: number;
  multiplier?: number;
  isPlayed: boolean;
  huntTitle: string;
  adminDisplayName: string;
  currency: string;
  order: number;
}

export default function OBSLiveBonusesPage() {
  const { data: liveBonuses = [] } = useQuery<LiveBonus[]>({ 
    queryKey: ["/api/live-bonuses"],
    refetchInterval: 2000,
  });

  // Filter only unplayed bonuses and sort by order
  const activeBonuses = liveBonuses
    .filter(bonus => !bonus.isPlayed)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Live Bonus Queue</h2>
          <p className="text-gray-300">Next bonuses to be opened</p>
        </div>

        {activeBonuses.length === 0 ? (
          <Card className="bg-gray-900/80 border-gray-700">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No Active Bonuses</h3>
              <p className="text-gray-400">All bonuses have been played or no hunts are active.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeBonuses.slice(0, 12).map((bonus, index) => (
              <Card key={bonus.id} className={`bg-gray-900/90 border-gray-700 ${index === 0 ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardContent className="p-4">
                  {index === 0 && (
                    <Badge className="mb-2 bg-yellow-500 text-black font-bold">
                      NEXT UP
                    </Badge>
                  )}
                  
                  <div className="mb-3">
                    <img 
                      src={bonus.slotImageUrl} 
                      alt={bonus.slotName}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/150/150';
                      }}
                    />
                  </div>
                  
                  <h3 className="text-white font-semibold text-sm mb-2 truncate">
                    {bonus.slotName}
                  </h3>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hunt:</span>
                      <span className="text-white truncate ml-2">{bonus.huntTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hunter:</span>
                      <span className="text-yellow-400 font-medium">{bonus.adminDisplayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bet:</span>
                      <span className="text-white font-bold">
                        {formatCurrency(parseFloat(bonus.betAmount), bonus.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Position:</span>
                      <span className="text-white">#{bonus.order}</span>
                    </div>
                  </div>
                  
                  {bonus.isPlayed && bonus.winAmount !== undefined && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Won:</span>
                        <span className={`font-bold ${bonus.winAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(bonus.winAmount, bonus.currency)}
                        </span>
                      </div>
                      {bonus.multiplier && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Multiplier:</span>
                          <span className="text-white font-bold">{bonus.multiplier.toFixed(2)}x</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {activeBonuses.length > 12 && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              +{activeBonuses.length - 12} more bonuses in queue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}