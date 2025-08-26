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
  
  const totalWin = openedBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);
  const totalCost = bonuses?.reduce((sum, b) => sum + Number(b.betAmount), 0) || 0;
  const nextBonus = hunt.isPlaying ? bonuses?.find(b => !b.isPlayed) : null;

  // Find best win and best multiplier
  const bestWin = openedBonuses.reduce((best, current) => {
    const currentWin = Number(current.winAmount || 0);
    const bestWin = Number(best?.winAmount || 0);
    return currentWin > bestWin ? current : best;
  }, openedBonuses[0] || null);

  const bestMulti = openedBonuses.reduce((best, current) => {
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
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Total Win</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {formatCurrency(bestWinAmount, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Best Win</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {bestMultiplier.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-400">Best Multi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">
                {formatCurrency(totalCost, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Total Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
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

        {/* Scrolling Bonuses - Horizontal with 4 slots visible */}
        {bonuses && bonuses.length > 0 && (
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Slots in Hunt</h2>
            <div className="relative overflow-hidden">
              <div 
                className="flex gap-6 transition-transform duration-1000 ease-in-out"
                style={{
                  transform: `translateX(-${Math.max(0, (openedBonuses.length - 2) * 25)}%)`,
                  width: `${bonuses.length * 25}%`
                }}
              >
                {bonuses.map((bonus, index) => (
                  <div 
                    key={bonus.id}
                    className={`flex-shrink-0 w-64 h-32 rounded-lg border-2 transition-all ${
                      bonus.isPlayed 
                        ? 'bg-green-900/30 border-green-500' 
                        : bonus === nextBonus 
                          ? 'bg-yellow-900/30 border-yellow-500 animate-pulse' 
                          : 'bg-gray-900/30 border-gray-700'
                    }`}
                  >
                    <div className="p-4 h-full flex flex-col">
                      {/* Slot Number */}
                      <div className={`text-center text-lg font-bold mb-2 ${
                        bonus.isPlayed ? 'text-green-400' : 
                        bonus === nextBonus ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{bonus.order}
                      </div>
                      
                      {/* Slot Image and Info */}
                      <div className="flex gap-3 flex-1">
                        <div className="w-16 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {bonus.imageUrl ? (
                            <img
                              src={bonus.imageUrl}
                              alt={bonus.slotName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate">{bonus.slotName}</div>
                          <div className="text-gray-400 text-xs truncate">{bonus.provider}</div>
                          <div className="text-green-400 text-sm mt-1">
                            {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                          </div>
                          {bonus.isPlayed && (
                            <div className="text-white font-bold text-sm">
                              {formatCurrency(Number(bonus.winAmount || 0), hunt.currency as Currency)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="text-center mt-2">
                        {bonus.isPlayed ? (
                          <span className="text-green-400 text-xs font-medium">PLAYED</span>
                        ) : bonus === nextBonus ? (
                          <span className="text-yellow-400 text-xs font-medium">NEXT</span>
                        ) : (
                          <span className="text-gray-500 text-xs">WAITING</span>
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