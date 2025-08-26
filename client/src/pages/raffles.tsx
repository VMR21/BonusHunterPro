import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Users, Crown, Play, Pause, Square, Plus, Edit, Trash2, Trophy, MessageCircle, ExternalLink, Clock, Eye, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Raffle, RaffleWithStats, RaffleEntry, InsertRaffle } from "@shared/schema";

export default function RafflesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [newRaffle, setNewRaffle] = useState<Partial<InsertRaffle>>({
    title: "",
    description: "",
    keyword: "!raffle",
    kickUsername: "",
    winnerCount: 1,
    subscribers: false,
    followers: false,
    duplicateEntries: false,
    minWatchTime: 0,
  });

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: raffles = [], isLoading } = useQuery<RaffleWithStats[]>({
    queryKey: ["/api/raffles"],
    enabled: isAuthenticated,
    refetchInterval: 3000, // Update every 3 seconds for live data
  });

  const { data: raffleEntries = [] } = useQuery<RaffleEntry[]>({
    queryKey: ["/api/raffles", selectedRaffle?.id, "entries"],
    enabled: !!selectedRaffle,
    refetchInterval: 2000, // Update entries every 2 seconds
  });

  const createRaffleMutation = useMutation({
    mutationFn: async (raffleData: Partial<InsertRaffle>) => {
      const response = await apiRequest("POST", "/api/raffles", raffleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      setShowCreateModal(false);
      setNewRaffle({
        title: "",
        description: "",
        keyword: "!raffle",
        kickUsername: "",
        winnerCount: 1,
        subscribers: false,
        followers: false,
        duplicateEntries: false,
        minWatchTime: 0,
      });
      toast({
        title: "Success",
        description: "Raffle created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create raffle",
        variant: "destructive",
      });
    },
  });

  const updateRaffleMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/raffles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Success",
        description: "Raffle updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update raffle",
        variant: "destructive",
      });
    },
  });

  const drawWinnersMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await apiRequest("POST", `/api/raffles/${raffleId}/draw-winners`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Winners Drawn!",
        description: `${data.winners.length} winner(s) selected successfully!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to draw winners",
        variant: "destructive",
      });
    },
  });

  const deleteRaffleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/raffles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Success",
        description: "Raffle deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete raffle",
        variant: "destructive",
      });
    },
  });

  const startRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await apiRequest("POST", `/api/raffles/${raffleId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Success",
        description: "Raffle started!",
      });
    },
  });

  const pauseRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await apiRequest("POST", `/api/raffles/${raffleId}/pause`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Success",
        description: "Raffle paused!",
      });
    },
  });

  const endRaffleMutation = useMutation({
    mutationFn: async (raffleId: string) => {
      const response = await apiRequest("POST", `/api/raffles/${raffleId}/end`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raffles"] });
      toast({
        title: "Success",
        description: "Raffle ended!",
      });
    },
  });

  const handleCreateRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRaffle.title || !newRaffle.keyword || !newRaffle.kickUsername) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createRaffleMutation.mutate(newRaffle);
  };

  const getStatusColor = (status: string, chatConnected: boolean) => {
    if (status === "active" && chatConnected) return "bg-green-500";
    if (status === "active") return "bg-yellow-500";
    if (status === "paused") return "bg-blue-500";
    if (status === "ended") return "bg-gray-500";
    return "bg-red-500";
  };

  const getStatusText = (status: string, chatConnected: boolean) => {
    if (status === "active" && chatConnected) return "LIVE";
    if (status === "active") return "WAITING FOR CHAT";
    if (status === "paused") return "PAUSED";
    if (status === "ended") return "ENDED";
    return "INACTIVE";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please log in with your admin key to manage raffles.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="w-8 h-8" />
              Raffles & Giveaways
            </h1>
            <p className="text-muted-foreground mt-2">
              Create and manage Kick.com chat raffles with real-time monitoring
            </p>
          </div>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-raffle">
                <Plus className="w-4 h-4 mr-2" />
                Create Raffle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Raffle</DialogTitle>
                <DialogDescription>
                  Set up a new raffle that will monitor your Kick.com chat for entries
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateRaffle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Raffle Title *</Label>
                    <Input
                      id="title"
                      value={newRaffle.title}
                      onChange={(e) => setNewRaffle({ ...newRaffle, title: e.target.value })}
                      placeholder="Holiday Giveaway"
                      data-testid="input-raffle-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="kickUsername">Kick Username *</Label>
                    <Input
                      id="kickUsername"
                      value={newRaffle.kickUsername}
                      onChange={(e) => setNewRaffle({ ...newRaffle, kickUsername: e.target.value })}
                      placeholder="your_kick_username"
                      data-testid="input-kick-username"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRaffle.description || ""}
                    onChange={(e) => setNewRaffle({ ...newRaffle, description: e.target.value })}
                    placeholder="Win amazing prizes in our holiday giveaway!"
                    data-testid="input-raffle-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="keyword">Chat Keyword *</Label>
                    <Input
                      id="keyword"
                      value={newRaffle.keyword}
                      onChange={(e) => setNewRaffle({ ...newRaffle, keyword: e.target.value })}
                      placeholder="!raffle"
                      data-testid="input-keyword"
                    />
                  </div>
                  <div>
                    <Label htmlFor="winnerCount">Number of Winners</Label>
                    <Input
                      id="winnerCount"
                      type="number"
                      min="1"
                      value={newRaffle.winnerCount || 1}
                      onChange={(e) => setNewRaffle({ ...newRaffle, winnerCount: parseInt(e.target.value) || 1 })}
                      data-testid="input-winner-count"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subscribers">Subscribers Only</Label>
                    <Switch
                      id="subscribers"
                      checked={newRaffle.subscribers || false}
                      onCheckedChange={(checked) => setNewRaffle({ ...newRaffle, subscribers: checked })}
                      data-testid="switch-subscribers-only"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="followers">Followers Only</Label>
                    <Switch
                      id="followers"
                      checked={newRaffle.followers || false}
                      onCheckedChange={(checked) => setNewRaffle({ ...newRaffle, followers: checked })}
                      data-testid="switch-followers-only"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="duplicateEntries">Allow Multiple Entries</Label>
                    <Switch
                      id="duplicateEntries"
                      checked={newRaffle.duplicateEntries || false}
                      onCheckedChange={(checked) => setNewRaffle({ ...newRaffle, duplicateEntries: checked })}
                      data-testid="switch-duplicate-entries"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createRaffleMutation.isPending}
                    data-testid="button-submit-raffle"
                  >
                    {createRaffleMutation.isPending ? "Creating..." : "Create Raffle"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    data-testid="button-cancel-raffle"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Raffles</TabsTrigger>
            <TabsTrigger value="ended">Completed</TabsTrigger>
            <TabsTrigger value="entries" disabled={!selectedRaffle}>
              Entries {selectedRaffle ? `(${raffleEntries.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="text-center p-8">Loading raffles...</div>
            ) : raffles.filter(r => r.status !== "ended").length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Active Raffles</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first raffle to start collecting entries from Kick.com chat
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {raffles.filter(r => r.status !== "ended").map((raffle) => (
                  <Card key={raffle.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {raffle.title}
                            <Badge className={`${getStatusColor(raffle.status, raffle.chatConnected ?? false)} text-white`}>
                              {getStatusText(raffle.status, raffle.chatConnected ?? false)}
                            </Badge>
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">{raffle.description}</p>
                        </div>
                        <div className="flex gap-2">
                          {/* Raffle Controls */}
                          {raffle.status === "draft" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => startRaffleMutation.mutate(raffle.id)}
                              disabled={startRaffleMutation.isPending}
                              data-testid={`button-start-${raffle.id}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                          )}
                          
                          {raffle.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => pauseRaffleMutation.mutate(raffle.id)}
                              disabled={pauseRaffleMutation.isPending}
                              data-testid={`button-pause-${raffle.id}`}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          
                          {raffle.status === "paused" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => startRaffleMutation.mutate(raffle.id)}
                              disabled={startRaffleMutation.isPending}
                              data-testid={`button-resume-${raffle.id}`}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          
                          {raffle.status !== "ended" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => endRaffleMutation.mutate(raffle.id)}
                              disabled={endRaffleMutation.isPending}
                              data-testid={`button-end-${raffle.id}`}
                            >
                              <Square className="w-4 h-4 mr-1" />
                              End
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRaffle(raffle)}
                            data-testid={`button-view-entries-${raffle.id}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            {raffle.entryCount} Entries
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-obs-overlay-${raffle.id}`}
                          >
                            <a
                              href={`/raffle-overlay/${raffle.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              OBS Overlay
                            </a>
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            data-testid={`button-kick-chat-${raffle.id}`}
                          >
                            <a
                              href={`https://kick.com/${raffle.kickUsername}/chatroom`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Kick Chat
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Keyword</p>
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{raffle.keyword}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Channel</p>
                          <p className="font-medium">@{raffle.kickUsername}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Winners</p>
                          <p className="font-medium">{raffle.winnerCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Restrictions</p>
                          <div className="flex gap-1">
                            {raffle.subscribers && <Badge variant="secondary" className="text-xs">SUB</Badge>}
                            {raffle.followers && <Badge variant="secondary" className="text-xs">FOL</Badge>}
                            {!raffle.subscribers && !raffle.followers && <span className="text-sm text-muted-foreground">None</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {raffle.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateRaffleMutation.mutate({ id: raffle.id, status: "paused" })}
                            data-testid={`button-pause-${raffle.id}`}
                          >
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateRaffleMutation.mutate({ id: raffle.id, status: "active" })}
                            data-testid={`button-resume-${raffle.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => drawWinnersMutation.mutate(raffle.id)}
                          disabled={raffle.entryCount === 0 || drawWinnersMutation.isPending}
                          data-testid={`button-draw-winners-${raffle.id}`}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          Draw Winners
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRaffleMutation.mutate({ id: raffle.id, status: "ended" })}
                          data-testid={`button-end-${raffle.id}`}
                        >
                          <Square className="w-4 h-4 mr-1" />
                          End Raffle
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRaffleMutation.mutate(raffle.id)}
                          data-testid={`button-delete-${raffle.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended" className="space-y-4">
            {raffles.filter(r => r.status === "ended").length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Completed Raffles</h3>
                  <p className="text-muted-foreground">
                    Completed raffles will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {raffles.filter(r => r.status === "ended").map((raffle) => (
                  <Card key={raffle.id} className="border-l-4 border-l-gray-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {raffle.title}
                            <Badge variant="secondary">ENDED</Badge>
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">{raffle.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRaffle(raffle)}
                          data-testid={`button-view-results-${raffle.id}`}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          View Results
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Entries</p>
                          <p className="font-medium">{raffle.entryCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Winners Drawn</p>
                          <p className="font-medium">{raffle.winnerCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ended</p>
                          <p className="font-medium">
                            {raffle.endedAt ? new Date(raffle.endedAt).toLocaleDateString() : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="entries" className="space-y-4">
            {selectedRaffle ? (
              <div>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>{selectedRaffle.title} - Entries</CardTitle>
                    <p className="text-muted-foreground">
                      Real-time entries for keyword: <code className="bg-muted px-1 rounded">{selectedRaffle.keyword}</code>
                    </p>
                  </CardHeader>
                </Card>
                
                {raffleEntries.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Entries Yet</h3>
                      <p className="text-muted-foreground">
                        Entries will appear here when users type "{selectedRaffle.keyword}" in chat
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2">
                    {raffleEntries.map((entry, index) => (
                      <Card key={entry.id} className={`${entry.isWinner ? 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">#{entry.entryNumber}</span>
                              <span className="font-medium">{entry.displayName || entry.username}</span>
                              {entry.isWinner && <Crown className="w-4 h-4 text-yellow-500" />}
                              <div className="flex gap-1">
                                {entry.isSubscriber && <Badge variant="secondary" className="text-xs">SUB</Badge>}
                                {entry.isFollower && <Badge variant="secondary" className="text-xs">FOL</Badge>}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString() : ""}
                            </span>
                          </div>
                          {entry.message && (
                            <p className="text-sm text-muted-foreground mt-2 italic">"{entry.message}"</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Select a Raffle</h3>
                  <p className="text-muted-foreground">
                    Click "View Entries" on any raffle to see the participant list
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}