import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

export default function LatestHuntOverlay() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/obs-overlay/latest');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching OBS data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data?.hunt) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-2xl">No active hunt</div>
      </div>
    );
  }

  const { hunt, bonuses } = data;
  const openedBonuses = bonuses?.filter((b: any) => b.isPlayed) || [];
  const totalBonuses = bonuses?.length || 0;
  const nextBonus = hunt.isPlaying ? bonuses?.find((b: any) => !b.isPlayed) : null;
  
  const totalWin = openedBonuses.reduce((sum: number, b: any) => sum + (Number(b.winAmount) || 0), 0);
  
  // Find best win and best multiplier
  const bestWin = openedBonuses.reduce((best: any, current: any) => {
    const currentWin = Number(current.winAmount || 0);
    const bestWin = Number(best?.winAmount || 0);
    return currentWin > bestWin ? current : best;
  }, openedBonuses[0] || null);

  const bestMulti = openedBonuses.reduce((best: any, current: any) => {
    const currentMulti = Number(current.multiplier || 0);
    const bestMulti = Number(best?.multiplier || 0);
    return currentMulti > bestMulti ? current : best;
  }, openedBonuses[0] || null);

  const bestWinAmount = bestWin ? Number(bestWin.winAmount || 0) : 0;
  const bestMultiplier = bestMulti ? Number(bestMulti.multiplier || 0) : 0;

  return (
    <div className="min-h-screen bg-transparent text-white p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hunt Header Stats */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-purple-300">{hunt.title}</h1>
            <Badge className="bg-purple-600 text-white px-3 py-1">
              {hunt.isPlaying ? "PLAYING" : "COLLECTING"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Total Win</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {bestWinAmount > 0 ? formatCurrency(bestWinAmount, hunt.currency as Currency) : "$0.00"}
              </div>
              <div className="text-sm text-gray-400">Best Win</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {bestMultiplier > 0 ? `${bestMultiplier.toFixed(1)}x` : "0.0x"}
              </div>
              <div className="text-sm text-gray-400">Best Multi</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {openedBonuses.length}/{totalBonuses}
              </div>
              <div className="text-sm text-gray-400">Bonuses Played</div>
            </div>
          </div>
        </div>

        {/* Next Bonus */}
        {nextBonus && (
          <div className="bg-gradient-to-r from-yellow-900/80 to-yellow-800/80 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-yellow-200">NEXT:</div>
              <img 
                src={nextBonus.imageUrl} 
                alt={nextBonus.slotName}
                className="w-12 h-16 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/150/150';
                }}
              />
              <div className="flex-1">
                <div className="text-lg font-bold text-yellow-100">{nextBonus.slotName}</div>
                <div className="text-sm text-yellow-200">{nextBonus.provider}</div>
                <div className="text-sm text-yellow-200">{formatCurrency(parseFloat(nextBonus.betAmount), hunt.currency as Currency)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Slots in Hunt Table */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-purple-500/30">
          <div className="p-4 border-b border-purple-500/30">
            <h3 className="text-lg font-bold text-purple-300">Slots in Hunt</h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-400 mb-4">
              <div>#</div>
              <div>Slot</div>
              <div>Bet Size</div>
              <div>Multiplier</div>
              <div>Payout</div>
              <div>Status</div>
            </div>

            <div className="space-y-2">
              {bonuses?.map((bonus: any, index: number) => {
                const isNext = hunt.isPlaying && !bonus.isPlayed && 
                              bonuses.findIndex((b: any) => !b.isPlayed) === index;
                
                return (
                  <div 
                    key={bonus.id} 
                    className={`grid grid-cols-7 gap-4 items-center p-3 rounded ${
                      isNext 
                        ? 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-500/30' 
                        : bonus.isPlayed 
                        ? 'bg-gray-900/50' 
                        : 'bg-gray-800/30'
                    }`}
                  >
                    <div className={`text-lg font-bold ${
                      isNext ? 'text-yellow-300' : 'text-gray-300'
                    }`}>
                      #{bonus.order}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <img 
                        src={bonus.imageUrl} 
                        alt={bonus.slotName}
                        className="w-10 h-13 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/150/150';
                        }}
                      />
                      <div>
                        <div className={`font-medium ${
                          isNext ? 'text-yellow-100' : 'text-white'
                        }`}>
                          {bonus.slotName}
                        </div>
                        <div className={`text-xs ${
                          isNext ? 'text-yellow-200' : 'text-gray-400'
                        }`}>
                          {bonus.provider}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`${
                      isNext ? 'text-yellow-100' : 'text-gray-300'
                    }`}>
                      {formatCurrency(parseFloat(bonus.betAmount), hunt.currency as Currency)}
                    </div>
                    
                    <div className={`${
                      isNext ? 'text-yellow-100' : 'text-gray-300'
                    }`}>
                      {bonus.isPlayed && bonus.multiplier ? 
                        `${Number(bonus.multiplier).toFixed(1)}x` : 
                        '-'
                      }
                    </div>
                    
                    <div className={`${
                      isNext ? 'text-yellow-100' : 'text-gray-300'
                    }`}>
                      {bonus.isPlayed && bonus.winAmount ? 
                        formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) : 
                        '-'
                      }
                    </div>
                    
                    <div>
                      {isNext ? (
                        <span className="text-yellow-300 font-bold">NEXT</span>
                      ) : bonus.isPlayed ? (
                        <span className="text-gray-400">WAITING</span>
                      ) : (
                        <span className="text-gray-400">WAITING</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}