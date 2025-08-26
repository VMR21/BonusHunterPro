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
  
  // Calculate progress percentage
  const progressPercentage = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;

  return (
    <div className="min-h-screen w-full bg-transparent text-white overflow-hidden flex flex-col">
      <div className="w-full h-full p-4 flex flex-col">
        {/* Hunt Header Stats */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 mb-4 border border-purple-500/50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-purple-300">{hunt.title}</h1>
            <Badge className="bg-purple-600 text-white px-3 py-1">
              {hunt.status?.toUpperCase()}
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
                {bestWinAmount > 0 ? formatCurrency(bestWinAmount, hunt.currency as Currency) : formatCurrency(0, hunt.currency as Currency)}
              </div>
              <div className="text-sm text-gray-400">Best Win</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {bestMultiplier > 0 ? `${bestMultiplier.toFixed(2)}x` : "0.00x"}
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
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Next Bonus Highlight */}
        {nextBonus && (
          <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 mb-4 border border-yellow-500/50 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="text-yellow-400 font-bold text-lg">NEXT:</div>
              <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={nextBonus.imageUrl} 
                  alt={nextBonus.slotName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-white font-semibold">{nextBonus.slotName}</div>
                <div className="text-gray-400">{nextBonus.provider}</div>
                <div className="text-green-400">
                  {formatCurrency(Number(nextBonus.betAmount), hunt.currency as Currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slots in Hunt Table */}
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50 flex-1">
          <h2 className="text-xl font-bold text-purple-300 mb-4">Slots in Hunt</h2>
          
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 mb-4 px-4 py-2 bg-gray-800/50 rounded-lg">
            <div className="text-center text-gray-300 text-sm font-medium">#</div>
            <div className="text-left text-gray-300 text-sm font-medium">Slot</div>
            <div className="text-center text-gray-300 text-sm font-medium">Bet Size</div>
            <div className="text-center text-gray-300 text-sm font-medium">Multiplier</div>
            <div className="text-center text-gray-300 text-sm font-medium">Payout</div>
            <div className="text-center text-gray-300 text-sm font-medium">Status</div>
          </div>

          {/* Scrolling Slots */}
          <div className="relative overflow-hidden flex-1" style={{ height: 'calc(100vh - 400px)' }}>
            <div className="space-y-6 animate-scroll">
              {bonuses?.map((bonus: any, index: number) => {
                const isNext = hunt.isPlaying && !bonus.isPlayed && 
                              bonuses.findIndex((b: any) => !b.isPlayed) === index;
                
                return (
                  <div 
                    key={`slot-${bonus.id}-${index}`}
                    className={`
                      w-full rounded-lg transition-all
                      ${isNext ? 'animate-pulse' : ''}
                    `}
                  >
                    <div className="grid grid-cols-6 gap-4 items-center p-6 h-24">
                      <div className={`text-center text-2xl font-bold ${
                        isNext ? 'text-yellow-400' : bonus.isPlayed ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        #{bonus.order}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={bonus.imageUrl} 
                            alt={bonus.slotName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium text-lg truncate">{bonus.slotName}</div>
                          <div className="text-gray-400 text-sm truncate">{bonus.provider}</div>
                        </div>
                      </div>
                      
                      <div className="text-center text-green-400 text-xl font-mono">
                        {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                      </div>
                      
                      <div className="text-center text-yellow-400 text-xl font-bold">
                        {bonus.isPlayed && bonus.multiplier ? 
                          `${Number(bonus.multiplier).toFixed(2)}x` : 
                          '-'
                        }
                      </div>
                      
                      <div className="text-center text-white text-xl font-bold">
                        {bonus.isPlayed && bonus.winAmount ? 
                          formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) : 
                          '-'
                        }
                      </div>
                      
                      <div className="text-center">
                        {isNext ? (
                          <span className="text-yellow-400 text-lg font-medium animate-pulse">NEXT</span>
                        ) : bonus.isPlayed ? (
                          <span className="text-green-400 text-lg font-medium">PLAYED</span>
                        ) : (
                          <span className="text-gray-500 text-lg">WAITING</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Duplicate entries for seamless scrolling */}
              {bonuses?.map((bonus: any, index: number) => {
                const isNext = hunt.isPlaying && !bonus.isPlayed && 
                              bonuses.findIndex((b: any) => !b.isPlayed) === index;
                
                return (
                  <div 
                    key={`slot-duplicate-${bonus.id}-${index}`}
                    className={`
                      w-full rounded-lg transition-all
                      ${isNext ? 'animate-pulse' : ''}
                    `}
                  >
                    <div className="grid grid-cols-6 gap-4 items-center p-6 h-24">
                      <div className={`text-center text-2xl font-bold ${
                        isNext ? 'text-yellow-400' : bonus.isPlayed ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        #{bonus.order}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={bonus.imageUrl} 
                            alt={bonus.slotName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium text-lg truncate">{bonus.slotName}</div>
                          <div className="text-gray-400 text-sm truncate">{bonus.provider}</div>
                        </div>
                      </div>
                      
                      <div className="text-center text-green-400 text-xl font-mono">
                        {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                      </div>
                      
                      <div className="text-center text-yellow-400 text-xl font-bold">
                        {bonus.isPlayed && bonus.multiplier ? 
                          `${Number(bonus.multiplier).toFixed(2)}x` : 
                          '-'
                        }
                      </div>
                      
                      <div className="text-center text-white text-xl font-bold">
                        {bonus.isPlayed && bonus.winAmount ? 
                          formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) : 
                          '-'
                        }
                      </div>
                      
                      <div className="text-center">
                        {isNext ? (
                          <span className="text-yellow-400 text-lg font-medium animate-pulse">NEXT</span>
                        ) : bonus.isPlayed ? (
                          <span className="text-green-400 text-lg font-medium">PLAYED</span>
                        ) : (
                          <span className="text-gray-500 text-lg">WAITING</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
}