import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Trophy, User, Clock, DollarSign, Eye, X, ArrowLeft, Play, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Currency } from "@/lib/currency";

interface LiveHunt {
  id: string;
  title: string;
  casino: string;
  currency: string;
  startBalance: string;
  endBalance?: string;
  status: string;
  adminDisplayName: string;
  isPlaying?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LiveHuntsPage() {
  const [selectedHunt, setSelectedHunt] = useState<LiveHunt | null>(null);
  const [showHuntModal, setShowHuntModal] = useState(false);
  
  const { data: liveHunts = [], isLoading } = useQuery<LiveHunt[]>({ 
    queryKey: ["/api/live-hunts"],
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
  });
  
  const { data: huntDetails, isLoading: huntDetailsLoading } = useQuery({
    queryKey: [`/api/hunts/${selectedHunt?.id}`],
    enabled: !!selectedHunt,
  });

  const { data: huntBonuses = [] } = useQuery<any[]>({
    queryKey: [`/api/hunts/${selectedHunt?.id}/bonuses`],
    enabled: !!selectedHunt,
  });
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const getStatusDisplay = (hunt: LiveHunt) => {
    if (hunt.isPlaying) {
      return { label: "PLAYING", color: "bg-green-600", textColor: "text-white" };
    }
    switch (hunt.status) {
      case "collecting":
        return { label: "COLLECTING", color: "bg-blue-600", textColor: "text-white" };
      case "completed":
        return { label: "COMPLETED", color: "bg-gray-600", textColor: "text-white" };
      default:
        return { label: hunt.status?.toUpperCase() || "UNKNOWN", color: "bg-gray-600", textColor: "text-white" };
    }
  };

  const handleViewHunt = (hunt: LiveHunt) => {
    setSelectedHunt(hunt);
    setShowHuntModal(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Live Hunts</h2>
            <p className="text-gray-300 text-lg">
              See what everyone is hunting right now
            </p>
          </div>

        </div>
      </div>

      {liveHunts.length === 0 ? (
        <Card className="bg-dark-purple/50 border-purple-800/30">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Live Hunts</h3>
            <p className="text-gray-400">No active hunts at the moment. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveHunts.map((hunt) => (
            <Card key={hunt.id} className="bg-dark-purple/50 border-purple-800/30 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg font-semibold truncate">
                    {hunt.title}
                  </CardTitle>
                  <Badge 
                    className={`text-xs ${getStatusDisplay(hunt).color} ${getStatusDisplay(hunt).textColor}`}
                  >
                    {getStatusDisplay(hunt).label}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-primary">{hunt.adminDisplayName}</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Casino</span>
                    <span className="text-white font-medium">{hunt.casino}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Start Balance</span>
                    <span className="text-white font-medium">
                      {formatCurrency(parseFloat(hunt.startBalance), hunt.currency as Currency)}
                    </span>
                  </div>
                  
                  {hunt.endBalance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">End Balance</span>
                      <span className="text-white font-medium">
                        {formatCurrency(parseFloat(hunt.endBalance), hunt.currency as Currency)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Updated</span>
                    </div>
                    <span className="text-gray-300 text-xs">
                      {new Date(hunt.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {hunt.isPlaying && (
                    <div className="flex items-center justify-center mt-3">
                      <Badge className="bg-red-600 text-white border-red-600 animate-pulse">
                        🔴 LIVE
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={() => handleViewHunt(hunt)}
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Hunt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hunt Details Modal */}
      <Dialog open={showHuntModal} onOpenChange={setShowHuntModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              {selectedHunt?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Complete hunt details for {selectedHunt?.adminDisplayName}'s hunt
            </DialogDescription>
          </DialogHeader>

          {huntDetailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">Loading hunt details...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hunt Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-400">Start Balance</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {selectedHunt && formatCurrency(parseFloat(selectedHunt.startBalance), selectedHunt.currency as Currency)}
                    </p>
                  </CardContent>
                </Card>

                {selectedHunt?.endBalance && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-400">End Balance</span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(parseFloat(selectedHunt.endBalance), selectedHunt.currency as Currency)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-400">Admin</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {selectedHunt?.adminDisplayName}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Hunt Status */}
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Status:</span>
                {selectedHunt && (
                  <Badge className={`${getStatusDisplay(selectedHunt).color} ${getStatusDisplay(selectedHunt).textColor}`}>
                    {getStatusDisplay(selectedHunt).label}
                  </Badge>
                )}
                {selectedHunt?.isPlaying && (
                  <Badge className="bg-red-600 text-white border-red-600 animate-pulse">
                    🔴 LIVE
                  </Badge>
                )}
              </div>

              {/* Bonuses Table */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Bonuses ({(huntBonuses as any[]).length})
                </h3>
                
                {(huntBonuses as any[]).length === 0 ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-400">No bonuses added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Slot</TableHead>
                          <TableHead className="text-gray-300">Provider</TableHead>
                          <TableHead className="text-gray-300">Bet</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Payout</TableHead>
                          <TableHead className="text-gray-300">Multiplier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(huntBonuses as any[]).map((bonus: any) => (
                          <TableRow key={bonus.id} className="border-gray-700">
                            <TableCell className="text-white font-medium">
                              <div className="flex items-center gap-3">
                                {bonus.imageUrl && (
                                  <img 
                                    src={bonus.imageUrl} 
                                    alt={bonus.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span>{bonus.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300">{bonus.provider}</TableCell>
                            <TableCell className="text-white">
                              {selectedHunt && formatCurrency(parseFloat(bonus.betAmount), selectedHunt.currency as Currency)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={bonus.isPlayed ? "default" : "secondary"}
                                className={bonus.isPlayed ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
                              >
                                {bonus.isPlayed ? "PLAYED" : "WAITING"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">
                              {bonus.winAmount 
                                ? selectedHunt && formatCurrency(bonus.winAmount, selectedHunt.currency as Currency)
                                : "-"
                              }
                            </TableCell>
                            <TableCell className="text-white">
                              {bonus.multiplier && !isNaN(parseFloat(bonus.multiplier)) ? `${parseFloat(bonus.multiplier).toFixed(2)}x` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Progress */}
              {(huntBonuses as any[]).length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Progress</span>
                    <span className="text-gray-300 text-sm">
                      {(huntBonuses as any[]).filter((b: any) => b.isPlayed).length}/{(huntBonuses as any[]).length} bonuses played
                    </span>
                  </div>
                  <Progress 
                    value={((huntBonuses as any[]).filter((b: any) => b.isPlayed).length / (huntBonuses as any[]).length) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => setLocation(`/hunt/${selectedHunt?.id}`)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Hunt Page
                </Button>
                <Button
                  onClick={() => setShowHuntModal(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}