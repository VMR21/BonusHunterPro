import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function LiveOBSOverlayPage() {
  const { id } = useParams<{ id: string }>();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id === 'latest') {
          // Fetch latest hunt
          const response = await fetch('/api/latest-hunt');
          if (response.ok) {
            const data = await response.json();
            setHunt(data.hunt);
            setBonuses(data.bonuses);
          }
        } else {
          // Fetch specific hunt
          const [huntResponse, bonusesResponse] = await Promise.all([
            fetch(`/api/hunts/${id}`),
            fetch(`/api/hunts/${id}/bonuses`)
          ]);
          
          if (huntResponse.ok && bonusesResponse.ok) {
            const huntData = await huntResponse.json();
            const bonusesData = await bonusesResponse.json();
            setHunt(huntData);
            setBonuses(bonusesData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch hunt data:', error);
      }
    };

    fetchData();

    // Auto-refresh every 3 seconds for live updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (!hunt) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-pulse">Loading hunt data...</div>
        </div>
      </div>
    );
  }

  const openedBonuses = bonuses.filter(b => b.status === 'opened');
  const totalBonuses = bonuses.length;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses.reduce((sum, b) => sum + b.betAmount, 0);
  const totalWin = openedBonuses.reduce((sum, b) => sum + (b.winAmount || 0), 0);
  const roi = totalCost > 0 ? ((totalWin - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-transparent text-white p-6">
      {/* Overlay Stats Panel */}
      <div className="fixed top-6 right-6 bg-black/80 backdrop-blur-sm rounded-lg p-6 border border-purple-500/30 min-w-[350px]">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-1">{hunt.title}</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className="px-2 py-1 bg-purple-600 rounded text-white text-xs uppercase font-medium">
              {hunt.status}
            </span>
            <span className="text-green-400">● Live</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-300">Progress</span>
            <span className="text-white">{openedBonuses.length}/{totalBonuses}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-800/50 rounded">
            <div className="text-lg font-bold text-white">
              {formatCurrency(totalCost, hunt.currency as Currency)}
            </div>
            <div className="text-xs text-gray-400 uppercase">Total Cost</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded">
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(totalWin, hunt.currency as Currency)}
            </div>
            <div className="text-xs text-gray-400 uppercase">Total Win</div>
          </div>
        </div>

        {/* ROI */}
        <div className="text-center p-3 bg-gray-800/50 rounded mb-4">
          <div className={`text-xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 uppercase">ROI</div>
        </div>

        {/* Current Slot (if opening) */}
        {hunt.status === 'opening' && bonuses.length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <div className="text-sm text-gray-400 mb-2">Now Opening:</div>
            {(() => {
              const currentBonus = bonuses.find(b => b.status === 'waiting') || bonuses[bonuses.length - 1];
              return currentBonus ? (
                <div className="flex items-center space-x-3 p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
                  <div className="w-10 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                    {currentBonus.imageUrl ? (
                      <img
                        src={currentBonus.imageUrl}
                        alt={currentBonus.slotName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">
                      {currentBonus.slotName}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {currentBonus.provider} • {formatCurrency(currentBonus.betAmount, hunt.currency as Currency)}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Compact bonus list overlay (bottom-left) */}
      {bonuses.length > 0 && (
        <div className="fixed bottom-6 left-6 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30 max-w-md max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-3">Bonus Queue ({bonuses.length})</h3>
          <div className="space-y-2">
            {bonuses.slice(0, 12).map((bonus) => (
              <div 
                key={bonus.id} 
                className={`flex items-center space-x-3 p-2 rounded ${
                  bonus.status === 'opened' 
                    ? 'bg-green-600/20 border border-green-500/30' 
                    : bonus.status === 'waiting'
                    ? 'bg-purple-600/20 border border-purple-500/30'
                    : 'bg-gray-800/50'
                }`}
              >
                <div className="w-6 h-8 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  {bonus.imageUrl ? (
                    <img
                      src={bonus.imageUrl}
                      alt={bonus.slotName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-600"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">
                    #{bonus.order} {bonus.slotName}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {formatCurrency(bonus.betAmount, hunt.currency as Currency)}
                    {bonus.winAmount && (
                      <span className="text-green-400 ml-2">
                        → {formatCurrency(bonus.winAmount, hunt.currency as Currency)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {bonus.status === 'opened' ? (
                    <span className="text-green-400 text-xs">✓</span>
                  ) : bonus.status === 'waiting' ? (
                    <span className="text-yellow-400 text-xs">⏳</span>
                  ) : null}
                </div>
              </div>
            ))}
            {bonuses.length > 12 && (
              <div className="text-center text-gray-400 text-xs py-2">
                ... and {bonuses.length - 12} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}