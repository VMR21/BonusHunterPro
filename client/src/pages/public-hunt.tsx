import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ProviderChart } from "@/components/provider-chart";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function PublicHuntPage() {
  const { token } = useParams<{ token: string }>();
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchPublicHunt = async () => {
      try {
        const response = await fetch(`/api/public/hunts/${token}`);
        if (response.ok) {
          const data = await response.json();
          setHunt(data.hunt);
          setBonuses(data.bonuses);
        }
      } catch (error) {
        console.error('Failed to fetch public hunt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicHunt();

    // Auto-refresh every 10 seconds for live updates
    const interval = setInterval(fetchPublicHunt, 10000);
    return () => clearInterval(interval);
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-gray-700 rounded"></div>
                <div className="h-48 bg-gray-700 rounded"></div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-gray-700 rounded"></div>
                <div className="h-96 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hunt) {
    return (
      <div className="min-h-screen bg-dark text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Hunt not found</h3>
              <p className="text-gray-400">This hunt is either private or doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusColors = {
    collecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    opening: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    finished: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const openedBonuses = bonuses.filter(b => b.status === 'opened');
  const totalBonuses = bonuses.length;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses.reduce((sum, b) => sum + b.betAmount, 0);
  const totalWin = openedBonuses.reduce((sum, b) => sum + (b.winAmount || 0), 0);
  const avgBet = totalBonuses > 0 ? totalCost / totalBonuses : 0;
  const roi = totalCost > 0 ? ((totalWin - totalCost) / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-dark text-gray-100">
      {/* Header */}
      <header className="bg-dark-purple/80 backdrop-blur-sm border-b border-purple-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                🎰 Public Bonus Hunt
              </h1>
            </div>
            <div className="text-sm text-gray-400">
              Live Hunt View
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">{hunt.title}</h2>
              <p className="text-gray-400">{hunt.casino}</p>
            </div>
            <Badge className={statusColors[hunt.status as keyof typeof statusColors]}>
              {hunt.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hunt Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-dark-purple/50 border-purple-800/30 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Hunt Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Casino:</span>
                  <span className="text-white">{hunt.casino}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Currency:</span>
                  <span className="text-white">{hunt.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Balance:</span>
                  <span className="text-green-400">
                    {formatCurrency(hunt.startBalance, hunt.currency as Currency)}
                  </span>
                </div>
                {hunt.endBalance && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">End Balance:</span>
                    <span className="text-green-400">
                      {formatCurrency(hunt.endBalance, hunt.currency as Currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(hunt.createdAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-purple/50 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Bonus Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Bonuses:</span>
                  <span className="text-white">{totalBonuses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Bet:</span>
                  <span className="text-white">
                    {formatCurrency(avgBet, hunt.currency as Currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Cost:</span>
                  <span className="text-white">
                    {formatCurrency(totalCost, hunt.currency as Currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Win:</span>
                  <span className="text-green-400">
                    {formatCurrency(totalWin, hunt.currency as Currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ROI:</span>
                  <span className={roi >= 0 ? "text-green-400" : "text-red-400"}>
                    {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                  </span>
                </div>
                
                <div className="pt-3 border-t border-purple-800/30">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{openedBonuses.length}/{totalBonuses}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Provider Distribution Chart */}
            <Card className="bg-dark-purple/50 border-purple-800/30 mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Provider Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ProviderChart bonuses={bonuses} />
              </CardContent>
            </Card>

            {/* Bonuses Table */}
            <Card className="bg-dark-purple/50 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Bonus Slots</CardTitle>
              </CardHeader>
              <CardContent>
                {bonuses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-400">#</TableHead>
                        <TableHead className="text-gray-400">Slot</TableHead>
                        <TableHead className="text-gray-400">Provider</TableHead>
                        <TableHead className="text-gray-400">Bet</TableHead>
                        <TableHead className="text-gray-400">Multiplier</TableHead>
                        <TableHead className="text-gray-400">Win</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonuses.map((bonus) => (
                        <TableRow 
                          key={bonus.id} 
                          className={`hover:bg-white/5 ${bonus.status === 'opened' ? '' : 'bg-primary/10'}`}
                        >
                          <TableCell className="text-gray-300">{bonus.order}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {bonus.imageUrl && (
                                <img
                                  src={bonus.imageUrl}
                                  alt={bonus.slotName}
                                  className="w-8 h-10 rounded mr-3"
                                />
                              )}
                              <span className="text-white text-sm">{bonus.slotName}</span>
                              {bonus.status === 'waiting' && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  WAITING
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{bonus.provider}</TableCell>
                          <TableCell className="text-white">
                            {formatCurrency(bonus.betAmount, hunt.currency as Currency)}
                          </TableCell>
                          <TableCell className="text-yellow-400">
                            {bonus.multiplier ? `${bonus.multiplier}x` : '-'}
                          </TableCell>
                          <TableCell className="text-green-400">
                            {bonus.winAmount ? formatCurrency(bonus.winAmount, hunt.currency as Currency) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-white mb-2">No bonuses yet</h3>
                    <p className="text-gray-400">The hunt hasn't started collecting bonuses.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
