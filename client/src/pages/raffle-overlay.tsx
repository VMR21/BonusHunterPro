import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Gift, Users, Clock, Crown, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Raffle, RaffleEntry } from "@shared/schema";

export default function RaffleOverlay() {
  const { id } = useParams<{ id: string }>();
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { data: raffle } = useQuery<Raffle>({
    queryKey: ["/api/raffles", id],
    enabled: !!id,
    refetchInterval: 1000,
  });

  const { data: entries = [] } = useQuery<RaffleEntry[]>({
    queryKey: ["/api/raffles", id, "entries"],
    enabled: !!id,
    refetchInterval: 1000,
  });

  const recentEntries = entries.slice(-10).reverse();
  const winners = entries.filter(entry => entry.isWinner);

  useEffect(() => {
    if (!raffle?.endTime) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(raffle.endTime!);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("ENDED");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [raffle?.endTime]);

  if (!raffle) {
    return (
      <div className="min-h-screen bg-black/90 flex items-center justify-center">
        <div className="text-white text-2xl">Loading raffle...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <Card className="bg-black/80 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{raffle.title}</h1>
                  <p className="text-gray-300 mt-1">{raffle.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-2">{entries.length}</div>
                <div className="text-gray-400 text-sm">ENTRIES</div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 mt-4">
              <Badge 
                className={`${
                  raffle.status === "active" ? "bg-green-500" : 
                  raffle.status === "paused" ? "bg-yellow-500" : "bg-gray-500"
                } text-white px-4 py-2 text-lg font-semibold`}
              >
                {raffle.status === "active" ? "🟢 LIVE" : 
                 raffle.status === "paused" ? "⏸️ PAUSED" : "⏹️ ENDED"}
              </Badge>
              
              <div className="flex items-center gap-2 text-white">
                <span className="text-gray-400">Keyword:</span>
                <span className="font-mono bg-purple-600/30 px-3 py-1 rounded text-lg">
                  {raffle.keyword}
                </span>
              </div>
              
              {raffle.endTime && (
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-mono font-bold">
                    {timeLeft}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Entries */}
        <div className="col-span-2">
          <Card className="bg-black/80 border-blue-500/30 backdrop-blur-sm h-96">
            <CardContent className="p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Recent Entries</h2>
              </div>
              
              <div className="space-y-2 h-80 overflow-hidden">
                {recentEntries.length === 0 ? (
                  <div className="text-center text-gray-400 mt-12">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Waiting for entries...</p>
                    <p className="text-sm mt-2">Type <span className="font-mono bg-purple-600/30 px-2 py-1 rounded">{raffle.keyword}</span> in chat to enter!</p>
                  </div>
                ) : (
                  recentEntries.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-3 animate-in slide-in-from-top duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-blue-300 font-mono text-sm">#{entry.entryNumber}</span>
                          <span className="text-white font-semibold">
                            {entry.displayName || entry.username}
                          </span>
                          <div className="flex gap-1">
                            {entry.isSubscriber && (
                              <Badge className="bg-purple-600 text-white text-xs px-1 py-0">SUB</Badge>
                            )}
                            {entry.isFollower && (
                              <Badge className="bg-blue-600 text-white text-xs px-1 py-0">FOL</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      {entry.message && (
                        <p className="text-gray-300 text-sm mt-1 italic">"{entry.message}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Winners & Stats */}
        <div className="space-y-6">
          {/* Winners */}
          <Card className="bg-black/80 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Winners</h2>
              </div>
              
              {winners.length === 0 ? (
                <div className="text-center text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No winners yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {winners.map((winner, index) => (
                    <div 
                      key={winner.id}
                      className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500/50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-bold">
                          {winner.displayName || winner.username}
                        </span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Winner #{index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-black/80 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Entries:</span>
                  <span className="text-white font-bold">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Unique Users:</span>
                  <span className="text-white font-bold">
                    {new Set(entries.map(e => e.username)).size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Winners Drawn:</span>
                  <span className="text-white font-bold">{winners.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Winners:</span>
                  <span className="text-white font-bold">{raffle.winnerCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}