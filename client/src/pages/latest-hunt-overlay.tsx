import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { Currency } from "@/lib/currency";

export default function LatestHuntOverlay() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get auth token from localStorage
        const token = localStorage.getItem('adminSessionToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/obs-overlay/latest', {
          method: 'GET',
          headers,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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

  // Prepare slots data for scrolling display (4 vertical slots)
  const slotsPerRow = 4;
  const slotRows = [];
  for (let i = 0; i < bonuses?.length; i += slotsPerRow) {
    slotRows.push(bonuses.slice(i, i + slotsPerRow));
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Hunt Header Stats */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-purple-400">{hunt.title}</h1>
            <Badge 
              className={`text-lg px-4 py-2 ${
                hunt.status === 'collecting' ? 'bg-blue-500' :
                hunt.status === 'playing' ? 'bg-green-500' : 
                'bg-gray-500'
              }`}
            >
              {hunt.status?.toUpperCase()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-300">Total Win</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {bestWinAmount > 0 ? formatCurrency(bestWinAmount, hunt.currency as Currency) : '--'}
              </div>
              <div className="text-sm text-gray-300">Best Win</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {bestMultiplier > 0 ? `${bestMultiplier.toFixed(2)}x` : '--'}
              </div>
              <div className="text-sm text-gray-300">Best Multi</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {openedBonuses.length}/{totalBonuses}
              </div>
              <div className="text-sm text-gray-300">Bonuses Played</div>
            </div>
          </div>
        </div>

        {/* Next Bonus Highlight */}
        {nextBonus && (
          <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/50">
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-yellow-400">NEXT:</div>
              <img 
                src={nextBonus.imageUrl} 
                alt={nextBonus.slotName}
                className="w-16 h-20 object-cover rounded-lg"
              />
              <div>
                <div className="text-lg font-bold text-white">{nextBonus.slotName}</div>
                <div className="text-sm text-gray-300">{nextBonus.provider}</div>
                <div className="text-lg text-green-400">
                  {formatCurrency(Number(nextBonus.betAmount), hunt.currency as Currency)}
                </div>
              </div>
              <div className="ml-auto">
                <div className="text-3xl font-bold text-yellow-400 animate-pulse">►</div>
              </div>
            </div>
          </div>
        )}

        {/* Scrolling Slots Grid (4 columns) */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-4">Bonus Hunt Slots</h2>
          <div className="h-96 overflow-hidden relative">
            <div 
              className={`grid grid-cols-4 gap-4 ${slotRows.length > 6 ? 'animate-scroll' : ''}`}
              style={{
                animation: slotRows.length > 6 ? 'scroll 30s linear infinite' : 'none'
              }}
            >
              {bonuses?.map((bonus: any, index: number) => (
                <div
                  key={bonus.id}
                  className={`
                    relative bg-gray-800/50 rounded-lg p-3 border transition-all duration-300 mb-4
                    ${bonus.isPlayed 
                      ? 'border-green-500/50 bg-green-900/20' 
                      : bonus === nextBonus
                      ? 'border-yellow-500 bg-yellow-900/20 animate-pulse'
                      : 'border-gray-600/30'
                    }
                  `}
                >
                  <img 
                    src={bonus.imageUrl} 
                    alt={bonus.slotName}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <div className="text-sm font-bold text-white truncate">{bonus.slotName}</div>
                  <div className="text-xs text-gray-300 truncate">{bonus.provider}</div>
                  <div className="text-sm text-green-400 font-bold">
                    {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                  </div>
                  
                  {bonus.isPlayed && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                        {bonus.winAmount > 0 
                          ? `${Number(bonus.multiplier || 0).toFixed(2)}x`
                          : '0x'
                        }
                      </div>
                    </div>
                  )}
                  
                  {bonus === nextBonus && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold animate-pulse">
                        NEXT
                      </div>
                    </div>
                  )}
                  
                  {!bonus.isPlayed && bonus !== nextBonus && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded">
                        WAITING
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}