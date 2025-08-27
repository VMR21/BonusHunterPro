import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Users, Crown, Clock, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "wouter";
import type { Raffle, RaffleEntry, RaffleWinner, AdminKey } from "@shared/schema";

export default function RaffleCommandPage() {
  const { id } = useParams<{ id: string }>();
  const [commandInput, setCommandInput] = useState("viewers");
  const [subX2Enabled, setSubX2Enabled] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Get current admin info
  const { data: adminInfo } = useQuery<{ isAdmin: boolean; adminDisplayName: string; kickUsername?: string }>({
    queryKey: ["/api/admin/check"],
    enabled: isAuthenticated,
  });

  // Get raffle data
  const { data: raffle, isLoading } = useQuery<Raffle>({
    queryKey: ["/api/raffles", id],
    enabled: !!id && isAuthenticated,
    refetchInterval: 3000,
  });

  // Get raffle entries
  const { data: entries = [] } = useQuery<RaffleEntry[]>({
    queryKey: ["/api/raffles", id, "entries"],
    enabled: !!id && isAuthenticated,
    refetchInterval: 2000,
  });

  // Get raffle winners
  const { data: winners = [] } = useQuery<RaffleWinner[]>({
    queryKey: ["/api/raffles", id, "winners"],
    enabled: !!id && isAuthenticated,
    refetchInterval: 2000,
  });

  // Set kick username from admin key connection
  useEffect(() => {
    if (adminInfo && raffle) {
      // The kick username should be connected to the admin key
      setCommandInput(adminInfo.kickUsername || raffle.keyword || "viewers");
    }
  }, [adminInfo, raffle]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/raffles/${id}`, { 
        status: "active",
        keyword: commandInput 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Raffle Started",
        description: "Accepting entries from chat now!",
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/raffles/${id}/entries`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", id, "entries"] });
      toast({
        title: "Entries Cleared",
        description: "All participants have been removed",
      });
    },
  });

  const drawWinnersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/raffles/${id}/draw-winners`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/raffles", id, "winners"] });
      toast({
        title: "Winners Drawn!",
        description: `${data.winners.length} winner(s) selected!`,
      });
    },
  });

  const copyParticipants = () => {
    const participantList = entries.map(entry => entry.username).join("\n");
    navigator.clipboard.writeText(participantList);
    toast({
      title: "Copied!",
      description: "Participant list copied to clipboard",
    });
  };

  const selectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading raffle...</div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Raffle not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Main raffle interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Command Input */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Command:
                    </label>
                    <Input
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="viewers"
                      data-testid="input-command"
                    />
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subx2"
                        checked={subX2Enabled}
                        onCheckedChange={(checked) => setSubX2Enabled(checked === true)}
                        data-testid="checkbox-sub-x2"
                      />
                      <label 
                        htmlFor="subx2" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Sub X2
                      </label>
                    </div>
                    
                    <Button
                      onClick={() => acceptMutation.mutate()}
                      disabled={acceptMutation.isPending || raffle.status === "active"}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-accept"
                    >
                      Aceptar
                    </Button>
                    
                    <Button
                      onClick={() => clearMutation.mutate()}
                      disabled={clearMutation.isPending}
                      className="bg-yellow-600 hover:bg-yellow-700"
                      data-testid="button-clear"
                    >
                      Limpiar
                    </Button>
                    
                    <Button
                      onClick={copyParticipants}
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-gray-700"
                      data-testid="button-copy-participants"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar participantes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Participantes ({entries.length}):
                  </h3>
                  <Badge 
                    className={`${
                      raffle.status === "active" 
                        ? "bg-green-500 text-white" 
                        : raffle.status === "paused"
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {raffle.status === "active" ? "LIVE" : raffle.status.toUpperCase()}
                  </Badge>
                </div>
                
                {entries.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No participants yet. Start the raffle to accept entries from chat.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedEntries.has(entry.id) 
                            ? "bg-blue-600" 
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                        onClick={() => selectEntry(entry.id)}
                        data-testid={`entry-${entry.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">
                            #{entry.entryNumber}
                          </span>
                          <span className="text-white font-medium">
                            {entry.displayName || entry.username}
                          </span>
                          {entry.isWinner && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Winners */}
          <div className="space-y-6">
            
            {/* Latest Winner */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Último ganador: 
                  <span className="text-yellow-400 ml-2">
                    {winners.length > 0 ? winners[winners.length - 1]?.displayName || winners[winners.length - 1]?.username : "None"}
                  </span>
                </h3>
              </CardContent>
            </Card>

            {/* Previous Winners */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Últimos ganadores:
                </h3>
                
                {winners.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">
                    No winners yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {winners
                      .sort((a, b) => b.position - a.position)
                      .map((winner, index) => (
                      <div
                        key={winner.id}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        data-testid={`winner-${winner.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-medium">
                            {winner.displayName || winner.username}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          #{winner.position}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {entries.length > 0 && (
                  <div className="mt-4">
                    <Button
                      onClick={() => drawWinnersMutation.mutate()}
                      disabled={drawWinnersMutation.isPending || entries.length === 0}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      data-testid="button-draw-winners"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Draw {raffle.winnerCount} Winner{raffle.winnerCount > 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Raffle Stats */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Entries:</span>
                    <span className="text-white font-medium">{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unique Users:</span>
                    <span className="text-white font-medium">
                      {new Set(entries.map(e => e.username)).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winners Drawn:</span>
                    <span className="text-white font-medium">{winners.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Channel:</span>
                    <span className="text-white font-medium">@{raffle.kickUsername}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}