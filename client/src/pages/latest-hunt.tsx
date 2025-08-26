import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Copy, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import type { Hunt, Bonus } from "@shared/schema";
import type { Currency } from "@/lib/currency";

export default function LatestHuntPage() {
  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [publicLinks, setPublicLinks] = useState<{
    huntId: string;
    publicLink: string;
    obsOverlayLink: string;
    title: string;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLatestHunt = async () => {
      try {
        // Fetch latest hunt data
        const huntResponse = await fetch('/api/latest-hunt');
        if (huntResponse.ok) {
          const huntData = await huntResponse.json();
          setHunt(huntData.hunt);
          setBonuses(huntData.bonuses);
        }

        // Fetch public links
        const linksResponse = await fetch('/api/latest-hunt/public-link');
        if (linksResponse.ok) {
          const linksData = await linksResponse.json();
          setPublicLinks(linksData);
        }
      } catch (error) {
        console.error('Failed to fetch latest hunt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestHunt();

    // Auto-refresh every 5 seconds for live updates
    const interval = setInterval(fetchLatestHunt, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  if (!hunt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-dark-purple/50 border-purple-800/30">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No active hunt</h3>
            <p className="text-gray-400 mb-6">Create a hunt to start tracking bonuses.</p>
            <Link href="/admin">
              <Button className="bg-primary hover:bg-primary/90">
                Go to Admin Panel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    collecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    opening: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    finished: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const openedBonuses = bonuses?.filter(b => b.isPlayed) || [];
  const totalBonuses = bonuses?.length || 0;
  const progress = totalBonuses > 0 ? (openedBonuses.length / totalBonuses) * 100 : 0;
  
  const totalCost = bonuses?.reduce((sum, b) => sum + Number(b.betAmount), 0) || 0;
  const totalWin = openedBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">{hunt.title}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <Badge className={statusColors[hunt.status as keyof typeof statusColors]}>
                  {hunt.status?.toUpperCase()}
                </Badge>
                <span className="text-gray-400">•</span>
                <span className="text-green-400">Live Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Links Section */}
        {publicLinks && (
          <Card className="bg-dark-purple/50 border-purple-800/30 mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">📡 Live Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white font-medium">OBS Overlay</p>
                    <p className="text-gray-400 text-sm">For streaming</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publicLinks.obsOverlayLink)}
                    data-testid="button-copy-obs-link"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(publicLinks.obsOverlayLink, '_blank')}
                    data-testid="button-open-obs-link"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                  {formatCurrency(Number(hunt.startBalance), hunt.currency as Currency)}
                </span>
              </div>
              {hunt.endBalance && (
                <div className="flex justify-between">
                  <span className="text-gray-400">End Balance:</span>
                  <span className="text-green-400">
                    {formatCurrency(Number(hunt.endBalance), hunt.currency as Currency)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Live Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bonuses:</span>
                <span className="text-white">{totalBonuses}</span>
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
          {/* Bonuses Table */}
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Bonus Slots ({bonuses?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {bonuses && bonuses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-800/30">
                      <TableHead className="text-gray-400">#</TableHead>
                      <TableHead className="text-gray-400">Slot</TableHead>
                      <TableHead className="text-gray-400">Provider</TableHead>
                      <TableHead className="text-gray-400">Bet</TableHead>
                      <TableHead className="text-gray-400">Win</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses?.map((bonus) => (
                      <TableRow key={bonus.id} className="border-purple-800/30 hover:bg-purple-900/20">
                        <TableCell className="text-white">{bonus.order}</TableCell>
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              {bonus.imageUrl ? (
                                <img
                                  src={bonus.imageUrl}
                                  alt={bonus.slotName}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-slot-${bonus.id}`}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center text-gray-500 text-xs ${bonus.imageUrl ? 'hidden' : ''}`}>
                                No image
                              </div>
                            </div>
                            <span>{bonus.slotName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">{bonus.provider}</TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(Number(bonus.betAmount), hunt.currency as Currency)}
                        </TableCell>
                        <TableCell className="text-green-400">
                          {bonus.winAmount !== null && bonus.winAmount !== undefined 
                            ? formatCurrency(Number(bonus.winAmount), hunt.currency as Currency) 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={bonus.status === 'opened' ? 'default' : 'secondary'}>
                            {bonus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-white mb-2">No bonuses yet</h3>
                  <p className="text-gray-400">Add bonuses to start tracking the hunt.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}