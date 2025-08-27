import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Settings, Monitor, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function OBSOverlaysPage() {
  const [currentHunt, setCurrentHunt] = useState<Hunt | null>(null);
  const [currentBonuses, setCurrentBonuses] = useState<Bonus[]>([]);

  // Get the latest hunt for preview
  const { data: huntsData = [] } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
    refetchInterval: 5000,
  });

  const { data: bonusesData = [] } = useQuery<Bonus[]>({
    queryKey: ["/api/hunts", currentHunt?.id, "bonuses"],
    enabled: !!currentHunt?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (huntsData.length > 0) {
      // Get the most recent hunt
      const latestHunt = huntsData
        .filter(h => h.status === "playing" || h.status === "collecting")
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })[0] || huntsData[0];
      setCurrentHunt(latestHunt);
    }
  }, [huntsData]);

  useEffect(() => {
    if (bonusesData) {
      setCurrentBonuses(bonusesData);
    }
  }, [bonusesData]);

  const getNextBonus = () => {
    return currentBonuses.find(b => !b.isPlayed);
  };

  const getHuntStats = () => {
    if (!currentHunt || !currentBonuses.length) return null;
    
    const playedBonuses = currentBonuses.filter(b => b.isPlayed);
    const totalWin = playedBonuses.reduce((sum, b) => sum + (parseFloat(b.winAmount || "0")), 0);
    const bestWin = Math.max(...playedBonuses.map(b => parseFloat(b.winAmount || "0")), 0);
    const bestMulti = Math.max(...playedBonuses.map(b => parseFloat(b.multiplier || "0")), 0);
    
    return {
      totalWin,
      bestWin,
      bestMulti,
      bonusesPlayed: playedBonuses.length,
      totalBonuses: currentBonuses.length
    };
  };

  const stats = getHuntStats();
  const nextBonus = getNextBonus();

  // OBS overlay URLs - no authentication required
  const overlayUrls = {
    latest: `${window.location.origin}/latest-hunt-overlay`,
    current: currentHunt ? `${window.location.origin}/obs-overlay?id=${currentHunt.id}` : null,
    liveBonuses: `${window.location.origin}/live-bonus-hunt`,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-6 h-6" />
          <span className="text-lg font-semibold">OBS Overlays</span>
          <Badge variant="secondary" className="ml-2">
            Live Preview
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-180px)]">
        {/* Preview Section */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentHunt ? (
                <div className="bg-gray-700 rounded-lg p-4 aspect-video flex flex-col justify-center items-center">
                  {nextBonus && (
                    <div className="text-center">
                      <img 
                        src={nextBonus.imageUrl || "/placeholder-slot.png"} 
                        alt={nextBonus.slotName}
                        className="w-16 h-16 rounded-lg mx-auto mb-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-slot.png";
                        }}
                      />
                      <div className="text-sm font-medium">{nextBonus.slotName}</div>
                      <div className="text-xs text-gray-300">{nextBonus.provider}</div>
                      <div className="text-xs text-blue-400 mt-1">NEXT</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 aspect-video flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Play className="w-8 h-8 mx-auto mb-2" />
                    <div>No active hunt</div>
                  </div>
                </div>
              )}
              
              {/* Preview Links */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <a href="/latest-hunt-overlay" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview Latest Hunt
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sections */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slot Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Slot Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {nextBonus ? (
                <>
                  <div>
                    <div className="text-gray-400">Next Slot</div>
                    <div className="font-medium">{nextBonus.slotName}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Provider</div>
                    <div className="font-medium">{nextBonus.provider}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Bet Amount</div>
                    <div className="font-medium">
                      {formatCurrency(parseFloat(nextBonus.betAmount), (currentHunt?.currency as Currency) || "USD")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Status</div>
                    <Badge variant="secondary" className="text-xs">
                      Next
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">No upcoming slot</div>
              )}
            </CardContent>
          </Card>

          {/* Hunting Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Hunting Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {stats ? (
                <>
                  <div>
                    <div className="text-gray-400">Total Win</div>
                    <div className="font-medium text-green-400">
                      {formatCurrency(stats.totalWin, (currentHunt?.currency as Currency) || "USD")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Best Win</div>
                    <div className="font-medium">
                      {formatCurrency(stats.bestWin, (currentHunt?.currency as Currency) || "USD")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Best Multi</div>
                    <div className="font-medium">{stats.bestMulti}x</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Progress</div>
                    <div className="font-medium">
                      {stats.bonusesPlayed}/{stats.totalBonuses}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">No hunt data</div>
              )}
            </CardContent>
          </Card>

          {/* Slot List */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Slot List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm max-h-48 overflow-y-auto">
              {currentBonuses.length > 0 ? (
                currentBonuses.map((bonus, index) => (
                  <div key={bonus.id} className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 w-6">
                      {index + 1}
                    </div>
                    <img 
                      src={bonus.imageUrl || "/placeholder-slot.png"} 
                      alt={bonus.slotName}
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-slot.png";
                      }}
                    />
                    <div className="flex-1 truncate">
                      {bonus.slotName}
                    </div>
                    <Badge 
                      variant={bonus.isPlayed ? "secondary" : nextBonus?.id === bonus.id ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {bonus.isPlayed ? "PLAYED" : nextBonus?.id === bonus.id ? "NEXT" : "WAITING"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No bonuses</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Bar - Full Width */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">OBS Sources</span>
            </div>
            <div className="text-sm text-gray-400">
              Copy these URLs directly into OBS Browser Source
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              asChild
              data-testid="button-latest-overlay"
            >
              <a href={overlayUrls.latest} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Latest Hunt Overlay
              </a>
            </Button>
            
            {overlayUrls.current && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
                data-testid="button-current-overlay"
              >
                <a href={overlayUrls.current} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Current Hunt
                </a>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              asChild
              data-testid="button-live-bonuses"
            >
              <a href={overlayUrls.liveBonuses} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Live Bonuses
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}