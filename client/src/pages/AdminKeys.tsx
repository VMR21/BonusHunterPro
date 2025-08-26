import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Edit, Save, X, Key, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { AdminKey } from "@shared/schema";

interface EditingKey {
  id: string;
  displayName: string;
  keyName: string;
  expiresAt: string;
  isActive: boolean;
}

export default function AdminKeys() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState<EditingKey | null>(null);
  const [newKey, setNewKey] = useState({
    keyValue: "",
    displayName: "",
    keyName: "",
    expiresAt: "",
  });
  
  const { toast } = useToast();
  const { adminKey } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is GambiZard admin
  const isGambiZardAdmin = adminKey === "GZ-239-2932-92302";

  const { data: adminKeys = [], isLoading, refetch } = useQuery<AdminKey[]>({
    queryKey: ["/api/admin/keys"],
    enabled: isGambiZardAdmin,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const createKeyMutation = useMutation({
    mutationFn: async (keyData: typeof newKey) => {
      const response = await apiRequest("POST", "/api/admin/keys", keyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      refetch(); // Immediate refresh for real-time updates
      setShowCreateModal(false);
      setNewKey({ keyValue: "", displayName: "", keyName: "", expiresAt: "" });
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

  const updateKeyMutation = useMutation({
    mutationFn: async ({ id, ...data }: EditingKey) => {
      const response = await apiRequest("PUT", `/api/admin/keys/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      refetch(); // Immediate refresh for real-time updates
      setEditingKey(null);
      toast({
        title: "Success",
        description: "Admin key updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/keys/${keyId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/keys"] });
      refetch(); // Immediate refresh for real-time updates
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
    
    if (!newKey.keyValue.trim() || !newKey.displayName.trim() || !newKey.keyName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createKeyMutation.mutate(newKey);
  };

  const handleUpdateKey = () => {
    if (!editingKey) return;
    updateKeyMutation.mutate(editingKey);
  };

  const startEditing = (key: AdminKey) => {
    setEditingKey({
      id: key.id,
      displayName: key.displayName,
      keyName: key.keyName,
      expiresAt: key.expiresAt ? new Date(key.expiresAt).toISOString().split('T')[0] : "",
      isActive: key.isActive,
    });
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "Never";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };

  if (!isGambiZardAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Admin key management is restricted to GambiZard admin only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Key Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage admin keys and their permissions • Updates every 5 seconds
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-keys"
            >
              {isLoading ? "Refreshing..." : "Refresh Now"}
            </Button>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-key">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Key
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin Key</DialogTitle>
                <DialogDescription>
                  Create a new admin key with optional expiration date. Keys provide access to the admin panel.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name *</Label>
                  <Input
                    id="keyName"
                    value={newKey.keyName}
                    onChange={(e) => setNewKey({ ...newKey, keyName: e.target.value })}
                    placeholder="e.g., admin1, streamer1"
                    data-testid="input-key-name"
                  />
                </div>
                <div>
                  <Label htmlFor="keyValue">Key Value *</Label>
                  <Input
                    id="keyValue"
                    value={newKey.keyValue}
                    onChange={(e) => setNewKey({ ...newKey, keyValue: e.target.value })}
                    placeholder="e.g., AB-123-456-789"
                    data-testid="input-key-value"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={newKey.displayName}
                    onChange={(e) => setNewKey({ ...newKey, displayName: e.target.value })}
                    placeholder="e.g., Main Admin, Streamer Account"
                    data-testid="input-display-name"
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newKey.expiresAt}
                    onChange={(e) => setNewKey({ ...newKey, expiresAt: e.target.value })}
                    data-testid="input-expires-at"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createKeyMutation.isPending}
                    data-testid="button-save-key"
                  >
                    {createKeyMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading admin keys...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {adminKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-6">
                  {editingKey?.id === key.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`edit-keyName-${key.id}`}>Key Name</Label>
                          <Input
                            id={`edit-keyName-${key.id}`}
                            value={editingKey.keyName}
                            onChange={(e) => setEditingKey({ ...editingKey, keyName: e.target.value })}
                            data-testid={`input-edit-key-name-${key.id}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-displayName-${key.id}`}>Display Name</Label>
                          <Input
                            id={`edit-displayName-${key.id}`}
                            value={editingKey.displayName}
                            onChange={(e) => setEditingKey({ ...editingKey, displayName: e.target.value })}
                            data-testid={`input-edit-display-name-${key.id}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`edit-expiresAt-${key.id}`}>Expiration Date</Label>
                          <Input
                            id={`edit-expiresAt-${key.id}`}
                            type="date"
                            value={editingKey.expiresAt}
                            onChange={(e) => setEditingKey({ ...editingKey, expiresAt: e.target.value })}
                            data-testid={`input-edit-expires-at-${key.id}`}
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <Switch
                            id={`edit-isActive-${key.id}`}
                            checked={editingKey.isActive}
                            onCheckedChange={(checked) => setEditingKey({ ...editingKey, isActive: checked })}
                            data-testid={`switch-edit-is-active-${key.id}`}
                          />
                          <Label htmlFor={`edit-isActive-${key.id}`}>Active</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateKey}
                          disabled={updateKeyMutation.isPending}
                          data-testid={`button-save-edit-${key.id}`}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateKeyMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingKey(null)}
                          data-testid={`button-cancel-edit-${key.id}`}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="text-sm text-muted-foreground">Display Name</p>
                          <p className="font-medium" data-testid={`text-display-name-${key.id}`}>
                            {key.displayName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Key Name</p>
                          <p className="font-medium" data-testid={`text-key-name-${key.id}`}>
                            {key.keyName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Key Value</p>
                          <p className="font-mono text-sm" data-testid={`text-key-value-${key.id}`}>
                            {key.keyValue}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${key.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm" data-testid={`text-status-${key.id}`}>
                              {key.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expires</p>
                          <p className="text-sm" data-testid={`text-expires-${key.id}`}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(key.expiresAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(key)}
                          data-testid={`button-edit-${key.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          disabled={deleteKeyMutation.isPending}
                          data-testid={`button-delete-${key.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {adminKeys.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Key className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Admin Keys</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first admin key to get started.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}