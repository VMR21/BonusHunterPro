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

  const openedBonuses = bonuses.filter(b => b.status === 'opened');
  const totalBonuses = bonuses.length;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses.reduce((sum, b) => sum + b.betAmount, 0);
  const totalWin = openedBonuses.reduce((sum, b) => sum + (b.winAmount || 0), 0);
  const avgMultiplier = openedBonuses.length > 0 
    ? openedBonuses.reduce((sum, b) => sum + (b.multiplier || 0), 0) / openedBonuses.length 
    : 0;
  const bex = totalCost > 0 ? totalCost / (totalBonuses > 0 ? totalBonuses : 1) : 0;
  const target = totalCost * 1.6; // Assuming 1.6x as break-even target

  const bestWin = openedBonuses.reduce((best, current) => {
    const currentWin = current.winAmount || 0;
    const bestWin = best?.winAmount || 0;
    return currentWin > bestWin ? current : best;
  }, openedBonuses[0] || null);

  const bestMulti = openedBonuses.reduce((best, current) => {
    const currentMulti = current.multiplier || 0;
    const bestMulti = best?.multiplier || 0;
    return currentMulti > bestMulti ? current : best;
  }, openedBonuses[0] || null);

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
              <div className="text-yellow-400 text-sm font-medium mb-1">AVG X</div>
              <div className="text-white text-xl font-bold">{avgMultiplier.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4 text-center">
              <div className="text-purple-400 text-sm font-medium mb-1">TOTAL WIN</div>
              <div className="text-white text-xl font-bold">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonuses.slice(0, 8).map((bonus) => (
                  <TableRow 
                    key={bonus.id}
                    className={`hover:bg-white/5 transition-colors ${
                      bonus.status === 'waiting' ? 'bg-primary/20' : ''
                    }`}
                  >
                    <TableCell className="text-gray-300 text-sm">{bonus.order}</TableCell>
                    <TableCell className="text-white text-sm font-medium">
                      {bonus.slotName}
                    </TableCell>
                    <TableCell className="text-white text-sm">
                      {formatCurrency(bonus.betAmount, hunt.currency as Currency)}
                    </TableCell>
                    <TableCell className="text-yellow-400 text-sm">
                      {bonus.multiplier ? `${bonus.multiplier}x` : '-'}
                    </TableCell>
                    <TableCell className="text-green-400 text-sm">
                      {bonus.winAmount ? formatCurrency(bonus.winAmount, hunt.currency as Currency) : '-'}
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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Total Win</div>
              <div className="text-green-400 font-bold">
                {formatCurrency(totalWin, hunt.currency as Currency)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Total Cost</div>
              <div className="text-white font-bold">
                {formatCurrency(totalCost, hunt.currency as Currency)}
              </div>
            </div>
          </div>
          
          {bestWin && (
            <div className="text-center border-t border-purple-800/30 pt-4">
              <div className="text-gray-400 text-sm">Best Win</div>
              <div className="text-yellow-400 font-bold">
                {formatCurrency(bestWin.winAmount || 0, hunt.currency as Currency)}
              </div>
              <div className="text-gray-400 text-xs">{bestWin.slotName}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
