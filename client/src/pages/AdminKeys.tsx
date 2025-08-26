import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Key, Trash2, Users } from "lucide-react";
import type { AdminKey } from "@shared/schema";

export default function AdminKeys() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ keyValue: "", displayName: "" });
  const { toast } = useToast();

  const { data: adminKeys = [], isLoading } = useQuery<AdminKey[]>({
    queryKey: ["/api/admin/keys"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (keyData: { keyValue: string; displayName: string }) => {
      const response = await apiRequest("POST", "/api/admin/keys", keyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      setShowCreateModal(false);
      setNewKey({ keyValue: "", displayName: "" });
      toast({
        title: "Success",
        description: "Admin key created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest("DELETE", `/api/admin/keys/${keyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      toast({
        title: "Success",
        description: "Admin key deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin key",
        variant: "destructive",
      });
    },
  });

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKey.keyValue.trim() || !newKey.displayName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createKeyMutation.mutate(newKey);
  };

  const handleDeleteKey = (keyId: string, displayName: string) => {
    if (confirm(`Are you sure you want to delete the admin key for "${displayName}"?`)) {
      deleteKeyMutation.mutate(keyId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <Key className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Loading Admin Keys...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Admin Key Management
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Manage admin keys for the multi-admin bonus hunting platform
          </p>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-lg"
                data-testid="button-create-key"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Admin Key
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-key-modal">
              <DialogHeader>
                <DialogTitle>Create New Admin Key</DialogTitle>
                <DialogDescription>
                  Add a new admin key that can be used to login and manage hunts
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="e.g., Main Admin, Streamer Account"
                    value={newKey.displayName}
                    onChange={(e) => setNewKey(prev => ({ ...prev, displayName: e.target.value }))}
                    data-testid="input-display-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keyValue">Admin Key</Label>
                  <Input
                    id="keyValue"
                    placeholder="e.g., admin123, streamer789"
                    value={newKey.keyValue}
                    onChange={(e) => setNewKey(prev => ({ ...prev, keyValue: e.target.value }))}
                    data-testid="input-key-value"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createKeyMutation.isPending}
                    data-testid="button-create"
                  >
                    {createKeyMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminKeys.map((key) => (
            <Card key={key.id} className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Key className="w-5 h-5 text-primary" />
                  {key.displayName}
                </CardTitle>
                <CardDescription>
                  Admin Key: <span className="font-mono text-primary">{key.keyValue}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id, key.displayName)}
                    disabled={deleteKeyMutation.isPending}
                    className="w-full"
                    data-testid={`button-delete-${key.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {adminKeys.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No admin keys yet</h2>
            <p className="text-gray-400 mb-6">Create your first admin key to get started!</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white"
              data-testid="button-create-first-key"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Admin Key
            </Button>
          </div>
        )}

        <div className="mt-12 bg-gray-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use Admin Keys</h3>
          <div className="space-y-2 text-gray-300">
            <p>• Each admin key provides separate login access to the platform</p>
            <p>• Admin keys have isolated bonus hunts and OBS overlays</p>
            <p>• All bonus hunts from all admins appear in the unified Live Hunts view</p>
            <p>• Share admin keys with trusted users who need platform access</p>
            <p>• Delete keys immediately if they become compromised</p>
          </div>
        </div>
      </div>
    </div>
  );
}