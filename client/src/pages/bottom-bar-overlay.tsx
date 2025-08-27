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
    return <div className="w-full h-24 bg-transparent"></div>;
  }

  const playedBonuses = bonuses.filter(b => b.isPlayed);
  const currentSlot = bonuses.find(b => !b.isPlayed);
  
  // Calculate stats
  const totalWin = playedBonuses.reduce((sum, b) => sum + parseFloat(b.winAmount || "0"), 0);
  const bestWin = Math.max(...playedBonuses.map(b => parseFloat(b.winAmount || "0")), 0);
  const bestSlot = playedBonuses.find(b => parseFloat(b.winAmount || "0") === bestWin);
  const avgBet = bonuses.length > 0 ? bonuses.reduce((sum, b) => sum + parseFloat(b.betAmount), 0) / bonuses.length : 0;
  const avgCost = avgBet * bonuses.length;
  const balanceX = totalWin > 0 ? totalWin / avgCost : 0;
  const breakEvenX = avgCost > 0 ? avgCost / avgBet : 0;

  return (
    <div className="fixed bottom-0 left-0 w-full h-24 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 text-white font-mono">
      <div className="flex items-center justify-between h-full px-6">
        {/* Slot Info Section */}
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 rounded-lg p-3 min-w-[200px]">
            <div className="text-sm font-bold text-blue-400 mb-1">Slot Info</div>
            {currentSlot ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <img 
                    src={currentSlot.imageUrl || "/placeholder-slot.png"} 
                    alt={currentSlot.slotName}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-slot.png";
                    }}
                  />
                  <div>
                    <div className="text-sm font-semibold">{currentSlot.slotName}</div>
                    <div className="text-xs text-gray-400">{currentSlot.provider}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-300">
                  Max X: {currentSlot.multiplier || "Unknown"} | 
                  Volatility: High
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-400">Hunt Complete</div>
            )}
          </div>
        </div>

        {/* Hunting Data Section */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-sm text-gray-400">Start</div>
            <div className="text-lg font-bold">
              {formatCurrency(avgCost, (hunt.currency as Currency) || "USD")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Avg Bet</div>
            <div className="text-lg font-bold">
              {formatCurrency(avgBet, (hunt.currency as Currency) || "USD")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Avg Cost</div>
            <div className="text-lg font-bold">
              {formatCurrency(avgCost, (hunt.currency as Currency) || "USD")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Best Win</div>
            <div className="text-lg font-bold text-green-400">
              {bestSlot ? bestSlot.slotName : "None"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">B/E X</div>
            <div className="text-lg font-bold">
              {breakEvenX.toFixed(2)}X
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Break E</div>
            <div className="text-lg font-bold">
              {formatCurrency(avgCost, (hunt.currency as Currency) || "USD")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Total Win</div>
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(totalWin, (hunt.currency as Currency) || "USD")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">Bonuses</div>
            <div className="text-lg font-bold">
              {playedBonuses.length}/{bonuses.length}
            </div>
          </div>
        </div>

        {/* Slot List Section */}
        <div className="bg-gray-800 rounded-lg p-3 max-w-[300px]">
          <div className="text-sm font-bold text-blue-400 mb-2">Slot List</div>
          <div className="max-h-16 overflow-y-auto space-y-1">
            {bonuses.slice(0, 11).map((bonus, index) => (
              <div key={bonus.id} className="flex items-center gap-2 text-xs">
                <div className="text-gray-400 w-4">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 truncate">
                  {bonus.slotName}
                </div>
                <div className={`w-12 text-right ${
                  bonus.isPlayed ? 'text-gray-500' : 
                  !bonuses.find(b => !b.isPlayed) || bonuses.find(b => !b.isPlayed)?.id === bonus.id ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {bonus.isPlayed ? '✓' : 
                   !bonuses.find(b => !b.isPlayed) || bonuses.find(b => !b.isPlayed)?.id === bonus.id ? 'NEXT' : 'WAIT'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}