import { useState, useEffect } from "react";
import { Plus, Play, DollarSign, Settings, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateHuntModal } from "@/components/create-hunt-modal";
import { AddBonusModal } from "@/components/add-bonus-modal";
import { useHunts } from "@/hooks/use-hunts";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [createHuntModalOpen, setCreateHuntModalOpen] = useState(false);
  const [addBonusModalOpen, setAddBonusModalOpen] = useState(false);
  const [selectedHuntId, setSelectedHuntId] = useState("");
  const [spentAmount, setSpentAmount] = useState("");

  const { data: hunts } = useHunts();
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem('bh_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsAuthenticated(true);
    }
  }, []);

  const authenticateAPI = async () => {
    try {
      const response = await fetch('/api/admin/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      if (data.valid) {
        localStorage.setItem('bh_api_key', apiKey);
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "API key authenticated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid API key. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to authenticate API key.",
        variant: "destructive",
      });
    }
  };

  const updateSpentAmount = async () => {
    if (!selectedHuntId || !spentAmount) {
      toast({
        title: "Error",
        description: "Please select a hunt and enter an amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/hunts/${selectedHuntId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ endBalance: parseFloat(spentAmount) }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Spent amount updated successfully!",
        });
        setSpentAmount("");
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update spent amount.",
        variant: "destructive",
      });
    }
  };

  const startOpening = () => {
    if (!selectedHuntId) {
      toast({
        title: "Error",
        description: "Please select a hunt first.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Info",
      description: "Opening phase started! You can now set payouts for bonuses.",
    });
  };

  const selectedHunt = hunts?.find(h => h.id === selectedHuntId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-white mb-6">Admin Panel</h2>
      
      {!isAuthenticated ? (
        <Card className="bg-dark-purple/50 border-purple-800/30 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">API Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                type="password"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                data-testid="input-api-key"
              />
              <Button 
                onClick={authenticateAPI}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-authenticate"
              >
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Admin Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Button
              onClick={() => setCreateHuntModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white p-6 h-auto flex-col"
              data-testid="button-admin-create-hunt"
            >
              <Plus className="text-2xl mb-2" />
              <div className="font-semibold">Create Hunt</div>
            </Button>
            
            <Button
              onClick={() => setAddBonusModalOpen(true)}
              disabled={!selectedHuntId}
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex-col disabled:opacity-50"
              data-testid="button-admin-add-bonus"
            >
              <Gift className="text-2xl mb-2" />
              <div className="font-semibold">Add Bonus</div>
            </Button>
            
            <Button
              onClick={startOpening}
              disabled={!selectedHuntId}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 h-auto flex-col disabled:opacity-50"
              data-testid="button-start-opening"
            >
              <Play className="text-2xl mb-2" />
              <div className="font-semibold">Start Opening</div>
            </Button>
            
            <Button
              onClick={updateSpentAmount}
              disabled={!selectedHuntId || !spentAmount}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 h-auto flex-col disabled:opacity-50"
              data-testid="button-update-spent"
            >
              <DollarSign className="text-2xl mb-2" />
              <div className="font-semibold">Update Balance</div>
            </Button>
          </div>

          {/* Hunt Management */}
          <Card className="bg-dark-purple/50 border-purple-800/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Current Hunt Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="hunt-select" className="block text-gray-400 text-sm font-medium mb-2">
                    Select Hunt
                  </Label>
                  <Select value={selectedHuntId} onValueChange={setSelectedHuntId}>
                    <SelectTrigger data-testid="select-hunt">
                      <SelectValue placeholder="Choose a hunt..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hunts?.map((hunt) => (
                        <SelectItem key={hunt.id} value={hunt.id}>
                          {hunt.title} - {hunt.casino}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedHunt && (
                    <div className="mt-2 text-sm text-gray-400">
                      Status: <span className="text-white">{selectedHunt.status}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="spent-amount" className="block text-gray-400 text-sm font-medium mb-2">
                    Update End Balance
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="spent-amount"
                      type="number"
                      step="0.01"
                      placeholder="Final balance amount"
                      value={spentAmount}
                      onChange={(e) => setSpentAmount(e.target.value)}
                      className="flex-1"
                      data-testid="input-end-balance"
                    />
                    <Button 
                      onClick={updateSpentAmount}
                      disabled={!selectedHuntId || !spentAmount}
                      className="bg-primary hover:bg-primary/90"
                      data-testid="button-update-balance"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <CreateHuntModal
        open={createHuntModalOpen}
        onOpenChange={setCreateHuntModalOpen}
      />

      {selectedHuntId && (
        <AddBonusModal
          open={addBonusModalOpen}
          onOpenChange={setAddBonusModalOpen}
          huntId={selectedHuntId}
          nextOrder={1} // This should be calculated based on existing bonuses
        />
      )}
    </div>
  );
}
