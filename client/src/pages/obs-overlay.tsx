import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function OBSOverlayPage() {
  const [location] = useLocation();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get hunt ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const huntId = urlParams.get('id');
  const isV2 = location.includes('v2');

  useEffect(() => {
    const fetchHuntData = async () => {
      try {
        let huntResponse, bonusesResponse;
        
        if (location.includes('/obs-overlay/latest')) {
          // For latest hunt overlay, use the new API endpoint
          const response = await fetch('/obs-overlay/latest');
          if (response.ok) {
            const data = await response.json();
            setHunt(data.hunt);
            setBonuses(data.bonuses);
          }
        } else if (huntId) {
          // For specific hunt ID
          [huntResponse, bonusesResponse] = await Promise.all([
            fetch(`/api/hunts/${huntId}`),
            fetch(`/api/hunts/${huntId}/bonuses`),
          ]);

          if (huntResponse.ok && bonusesResponse.ok) {
            setHunt(await huntResponse.json());
            setBonuses(await bonusesResponse.json());
          }
        } else {
          // Fallback to latest hunt
          const response = await fetch('/obs-overlay/latest');
          if (response.ok) {
            const data = await response.json();
            setHunt(data.hunt);
            setBonuses(data.bonuses);
          }
        }
      } catch (error) {
        console.error('Failed to fetch hunt data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHuntData();

    // Auto-refresh every 5 seconds for live updates
    const interval = setInterval(fetchHuntData, 5000);
    return () => clearInterval(interval);
  }, [huntId, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-pulse text-white">Loading overlay...</div>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Hunt Not Found</h2>
          <p className="text-gray-400">Please check the hunt ID in the URL</p>
        </div>
      </div>
    );
  }

  const openedBonuses = bonuses.filter(b => b.isPlayed);
  const totalBonuses = bonuses.length;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses.reduce((sum, b) => sum + Number(b.betAmount), 0);
  const totalWin = openedBonuses.reduce((sum, b) => sum + Number(b.winAmount || 0), 0);
  const avgMultiplier = openedBonuses.length > 0 
    ? openedBonuses.reduce((sum, b) => sum + Number(b.multiplier || 0), 0) / openedBonuses.length 
    : 0;
  const bex = totalCost > 0 ? totalCost / (totalBonuses > 0 ? totalBonuses : 1) : 0;
  const target = totalCost * 1.6; // Assuming 1.6x as break-even target

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

  if (isV2) {
    return (
      <div className="min-h-screen bg-transparent p-8">
        <div className="bg-dark-purple/90 border border-purple-800/50 rounded-xl p-8 max-w-4xl mx-auto backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              BONUSHUNT INFO
            </h3>
            <div className="flex items-center space-x-4">
              <div className="bg-dark-purple rounded-lg px-4 py-2">
                <span className="text-gray-400 text-sm">Progress:</span>
                <span className="text-white ml-2">{openedBonuses.length}/{totalBonuses}</span>
              </div>
              <div className="w-32 bg-dark-purple rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white font-semibold">{progress.toFixed(0)}%</span>
            </div>
          </div>

          {/* Stats Tiles */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-blue-400 text-sm font-medium mb-1">B.E.X</div>
              <div className="text-white text-xl font-bold">{bex.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-green-400 text-sm font-medium mb-1">TARGET</div>
              <div className="text-white text-xl font-bold">
                {formatCurrency(target, hunt.currency as Currency)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-yellow-400 text-sm font-medium mb-1">BEST WIN</div>
              <div className="text-white text-xl font-bold">
                {formatCurrency(bestWinAmount, hunt.currency as Currency)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4 text-center">
              <div className="text-purple-400 text-sm font-medium mb-1">BEST MULTI</div>
              <div className="text-white text-xl font-bold">{bestMultiplier.toFixed(2)}x</div>
            </div>
          </div>

          {/* Best Win & Multi Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 text-sm font-medium mb-1">BEST WIN</div>
              <div className="flex items-center justify-between">
                <span className="text-white text-lg font-bold">
                  {bestWin ? formatCurrency(bestWin.winAmount || 0, hunt.currency as Currency) : '-'}
                </span>
                <span className="text-gray-400 text-sm">
                  {bestWin ? bestWin.slotName : 'None'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-400 text-sm font-medium mb-1">BEST MULTI</div>
              <div className="flex items-center justify-between">
                <span className="text-white text-lg font-bold">
                  {bestMulti ? `${bestMulti.multiplier}x` : '-'}
                </span>
                <span className="text-gray-400 text-sm">
                  {bestMulti ? bestMulti.slotName : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Slots Table */}
          <div className="bg-dark-purple/50 border border-purple-800/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400 text-xs uppercase">#</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase">SLOT</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase">BET</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase">MULTI</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase">WIN</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonuses.map((bonus) => (
                  <TableRow 
                    key={bonus.id}
                    className={`hover:bg-white/5 transition-colors ${
                      bonus.isPlayed ? 'bg-green-500/20' : 'bg-gray-500/20'
                    }`}
                  >
                    <TableCell className="text-gray-300 text-sm py-4">{bonus.order}</TableCell>
                    <TableCell className="text-white text-sm font-medium py-4">
                      <div className="flex items-center space-x-3">
                        {bonus.imageUrl && (
                          <img 
                            src={bonus.imageUrl} 
                            alt={bonus.slotName}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span className="font-semibold">{bonus.slotName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white text-sm py-4 font-semibold">
                      {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                    </TableCell>
                    <TableCell className="text-yellow-400 text-sm py-4 font-semibold">
                      {bonus.multiplier ? `${Number(bonus.multiplier).toFixed(2)}x` : '-'}
                    </TableCell>
                    <TableCell className="text-green-400 text-sm py-4 font-semibold">
                      {bonus.winAmount ? formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) : '-'}
                    </TableCell>
                    <TableCell className="text-sm py-4">
                      <span className={`px-3 py-2 rounded-md text-xs font-medium ${
                        bonus.isPlayed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {bonus.isPlayed ? 'Played' : 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // Simple overlay version
  return (
    <div className="min-h-screen bg-transparent p-4">
      <Card className="bg-dark-purple/90 border-purple-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-center">{hunt.title}</CardTitle>
          <div className="text-center">
            <Progress value={progress} className="w-full h-2 mb-2" />
            <span className="text-gray-400 text-sm">{openedBonuses.length}/{totalBonuses} bonuses opened</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-gray-400 text-sm">Total Win</div>
            <div className="text-green-400 font-bold">
              {formatCurrency(totalWin, hunt.currency as Currency)}
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-3 mb-4">
            <div className="text-gray-300 text-lg font-semibold text-center">Slots in Hunt</div>
            
            {/* Column Headers */}
            <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-gray-800/50 rounded text-xs font-medium text-gray-400">
              <div>Slot Name</div>
              <div className="text-center">Bet Size</div>
              <div className="text-center">Payout</div>
              <div className="text-center">Status</div>
            </div>
            
            {/* Scrollable Slots */}
            <div className="max-h-60 overflow-y-auto scrolling-slots space-y-2">
              {bonuses.map((bonus, index) => (
                <div 
                  key={bonus.id} 
                  className={`grid grid-cols-4 gap-2 items-center p-3 rounded-lg border transition-all duration-300 ${
                    bonus.isPlayed 
                      ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                      : 'bg-gray-500/20 border-gray-500/30 text-gray-300'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-3">
                    {bonus.imageUrl && (
                      <img 
                        src={bonus.imageUrl} 
                        alt={bonus.slotName}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium truncate">{bonus.slotName}</span>
                  </div>
                  
                  <div className="text-center text-sm font-semibold">
                    {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                  </div>
                  
                  <div className="text-center text-sm font-semibold">
                    {bonus.isPlayed && bonus.winAmount 
                      ? formatCurrency(Number(bonus.winAmount), hunt.currency as Currency)
                      : '-'
                    }
                  </div>
                  
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bonus.isPlayed 
                        ? 'bg-green-500/30 text-green-300' 
                        : 'bg-gray-500/30 text-gray-400'
                    }`}>
                      {bonus.isPlayed ? 'Played' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {bestWin && (
            <div className="text-center border-t border-purple-800/30 pt-4">
              <div className="text-gray-400 text-sm">Best Win</div>
              <div className="text-yellow-400 font-bold">
                {formatCurrency(Number(bestWin.winAmount || 0), hunt.currency as Currency)}
              </div>
              <div className="text-gray-400 text-xs">{bestWin.slotName}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
