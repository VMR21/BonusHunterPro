import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, User, Clock, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

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
  const { data: liveHunts = [], isLoading } = useQuery<LiveHunt[]>({ 
    queryKey: ["/api/live-hunts"],
    refetchInterval: 3000, // Refresh every 3 seconds for live updates
  });

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
        <h2 className="text-3xl font-bold text-white mb-2">Live Hunts</h2>
        <p className="text-gray-300 text-lg">
          See what everyone is hunting right now
        </p>
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
                    variant={hunt.status === "opening" ? "default" : hunt.status === "finished" ? "secondary" : "outline"}
                    className={`text-xs ${
                      hunt.status === "opening" 
                        ? "bg-green-600 text-white border-green-600" 
                        : hunt.status === "finished"
                        ? "bg-gray-600 text-white border-gray-600"
                        : "bg-yellow-600 text-white border-yellow-600"
                    }`}
                  >
                    {hunt.status === "opening" ? "Opening" : hunt.status === "finished" ? "Finished" : "Collecting"}
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
                      {formatCurrency(parseFloat(hunt.startBalance), hunt.currency)}
                    </span>
                  </div>
                  
                  {hunt.endBalance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">End Balance</span>
                      <span className="text-white font-medium">
                        {formatCurrency(parseFloat(hunt.endBalance), hunt.currency)}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}