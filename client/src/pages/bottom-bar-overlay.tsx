import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function BottomBarOverlay() {
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHuntData = async () => {
      try {
        const response = await fetch('/api/obs-overlay/latest');
        if (response.ok) {
          const data = await response.json();
          setHunt(data.hunt);
          setBonuses(data.bonuses || []);
        }
      } catch (error) {
        console.error('Failed to fetch hunt data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHuntData();
    const interval = setInterval(fetchHuntData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !hunt) {
    return <div className="w-full h-screen bg-gray-900"></div>;
  }

  const playedBonuses = bonuses.filter(b => b.isPlayed);
  const currentSlot = bonuses.find(b => !b.isPlayed);
  
  // Calculate stats
  const totalWin = playedBonuses.reduce((sum, b) => sum + parseFloat(b.winAmount || "0"), 0);
  const bestWin = Math.max(...playedBonuses.map(b => parseFloat(b.winAmount || "0")), 0);
  const bestSlot = playedBonuses.find(b => parseFloat(b.winAmount || "0") === bestWin);
  const avgBet = bonuses.length > 0 ? bonuses.reduce((sum, b) => sum + parseFloat(b.betAmount), 0) / bonuses.length : 0;
  const avgCost = avgBet * bonuses.length;
  const breakEvenX = avgCost > 0 ? avgCost / avgBet : 0;

  return (
    <div className="w-full h-screen bg-gray-900 text-white font-mono overflow-hidden relative">
      {/* Bottom Bar - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gray-800/95 backdrop-blur-sm border-t border-gray-600">
        <div className="flex items-center justify-between h-full px-6">
          
          {/* Slot Info Section */}
          <div className="flex items-center gap-4">
            <div className="bg-gray-700 rounded-lg p-3 min-w-[280px]">
              <div className="text-sm font-bold text-blue-400 mb-1">Slot Info</div>
              {currentSlot ? (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <img 
                      src={currentSlot.imageUrl || "/placeholder-slot.png"} 
                      alt={currentSlot.slotName}
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-slot.png";
                      }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Name: {currentSlot.slotName}
                      </div>
                      <div className="text-xs text-gray-300">
                        Provider: {currentSlot.provider}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 grid grid-cols-2 gap-2">
                    <div>Max X: {currentSlot.multiplier || "5000"}</div>
                    <div>Volatility: High</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-400">Hunt Complete</div>
              )}
            </div>
          </div>

          {/* Hunting Data Section */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Start</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(avgCost, (hunt.currency as Currency) || "USD")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Avg Bet</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(avgBet, (hunt.currency as Currency) || "USD")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Avg Cost</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(avgCost, (hunt.currency as Currency) || "USD")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Best Win</div>
              <div className="text-sm font-bold text-green-400">
                {bestSlot ? bestSlot.slotName : "Book of Dead"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">B/E X</div>
              <div className="text-sm font-bold text-white">
                {breakEvenX.toFixed(2)}X
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Break E</div>
              <div className="text-sm font-bold text-white">
                {formatCurrency(avgCost * 1.597, (hunt.currency as Currency) || "USD")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Total Win</div>
              <div className="text-sm font-bold text-green-400">
                {formatCurrency(totalWin, (hunt.currency as Currency) || "USD")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Bonuses</div>
              <div className="text-sm font-bold text-white">
                {playedBonuses.length}/{bonuses.length}
              </div>
            </div>
          </div>

          {/* Slot List Section */}
          <div className="bg-gray-700 rounded-lg p-3 min-w-[300px]">
            <div className="text-sm font-bold text-blue-400 mb-2">Slot List</div>
            <div className="max-h-16 overflow-y-auto space-y-1">
              {bonuses.slice(0, 11).map((bonus, index) => {
                const isNext = currentSlot?.id === bonus.id;
                const isPlayed = bonus.isPlayed;
                
                return (
                  <div key={bonus.id} className="flex items-center gap-2 text-xs">
                    <div className="text-gray-400 w-6 text-right">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 truncate text-white">
                      {bonus.slotName}
                    </div>
                    <div className={`w-12 text-right font-semibold ${
                      isPlayed ? 'text-gray-500' : 
                      isNext ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {isPlayed ? '✓' : isNext ? 'NEXT' : 'WAIT'}
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