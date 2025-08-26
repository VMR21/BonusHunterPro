import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

export default function LiveOBSOverlay() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/obs-overlay/latest');
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
  const openedBonuses = bonuses?.filter(b => b.isPlayed) || [];
  const totalBonuses = bonuses?.length || 0;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalWin = openedBonuses.reduce((sum: number, b: any) => sum + (Number(b.winAmount) || 0), 0);
  const nextBonus = hunt.isPlaying ? bonuses?.find((b: any) => !b.isPlayed) : null;

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
      <div className="max-w-6xl mx-auto">
        {/* Hunt Header */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-500/30">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-purple-300">{hunt.title}</h1>
            <Badge className="bg-purple-600 text-white px-3 py-1">
              {hunt.status}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Total Win</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {formatCurrency(bestWinAmount, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Best Win</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {bestMultiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">Best Multi</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {openedBonuses.length}/{totalBonuses}
              </div>
              <div className="text-sm text-gray-400">Bonuses Played</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Next Bonus Highlight */}
        {nextBonus && (
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 mb-6 border border-yellow-500/50 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="text-yellow-400 font-bold text-lg">NEXT:</div>
              <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                {nextBonus.imageUrl ? (
                  <img
                    src={nextBonus.imageUrl}
                    alt={nextBonus.slotName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div>
                <div className="text-white font-semibold">{nextBonus.slotName}</div>
                <div className="text-gray-400">{nextBonus.provider}</div>
                <div className="text-green-400">{formatCurrency(Number(nextBonus.betAmount), hunt.currency as Currency)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Vertical Scrolling Bonuses - 4 slots visible, full width horizontal */}
        {bonuses && bonuses.length > 0 && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Slots in Hunt</h2>
            
            {/* Column Headers */}
            <div className="grid grid-cols-6 gap-4 mb-4 px-4 py-2 bg-gray-800/50 rounded-lg">
              <div className="text-center text-gray-300 text-sm font-medium">#</div>
              <div className="text-left text-gray-300 text-sm font-medium">Slot</div>
              <div className="text-center text-gray-300 text-sm font-medium">Bet Size</div>
              <div className="text-center text-gray-300 text-sm font-medium">Multiplier</div>
              <div className="text-center text-gray-300 text-sm font-medium">Payout</div>
              <div className="text-center text-gray-300 text-sm font-medium">Status</div>
            </div>

            <div className="relative overflow-hidden h-96">
              <div 
                className={`space-y-6 ${bonuses.length > 1 ? 'animate-scroll' : ''}`}
              >
                {/* Duplicate bonuses for seamless scrolling */}
                {[...bonuses, ...bonuses].map((bonus: any, index: number) => (
                  <div 
                    key={`${bonus.id}-${index}`}
                    className={`w-full rounded-lg border-2 transition-all ${
                      bonus.isPlayed 
                        ? 'bg-green-900/30 border-green-500' 
                        : bonus === nextBonus 
                          ? 'bg-yellow-900/30 border-yellow-500 animate-pulse' 
                          : 'bg-gray-900/30 border-gray-700'
                    }`}
                  >
                    <div className="grid grid-cols-6 gap-4 items-center p-6 h-24">
                      {/* Slot Number */}
                      <div className={`text-center text-2xl font-bold ${
                        bonus.isPlayed ? 'text-green-400' : 
                        bonus === nextBonus ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{bonus.order}
                      </div>
                      
                      {/* Slot Info with Image */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {bonus.imageUrl ? (
                            <img
                              src={bonus.imageUrl}
                              alt={bonus.slotName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium text-lg truncate">{bonus.slotName}</div>
                          <div className="text-gray-400 text-sm truncate">{bonus.provider}</div>
                        </div>
                      </div>
                      
                      {/* Bet Size */}
                      <div className="text-center text-green-400 text-xl font-mono">
                        {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                      </div>
                      
                      {/* Multiplier */}
                      <div className="text-center text-yellow-400 text-xl font-bold">
                        {bonus.isPlayed ? `${Number(bonus.multiplier || 0).toFixed(2)}x` : '-'}
                      </div>
                      
                      {/* Payout */}
                      <div className="text-center text-white text-xl font-bold">
                        {bonus.isPlayed ? formatCurrency(Number(bonus.winAmount || 0), hunt.currency as Currency) : '-'}
                      </div>
                      
                      {/* Status */}
                      <div className="text-center">
                        {bonus.isPlayed ? (
                          <span className="text-green-400 text-lg font-medium">PLAYED</span>
                        ) : bonus === nextBonus ? (
                          <span className="text-yellow-400 text-lg font-medium animate-pulse">NEXT</span>
                        ) : (
                          <span className="text-gray-500 text-lg">WAITING</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        

      </div>


    </div>
  );
}