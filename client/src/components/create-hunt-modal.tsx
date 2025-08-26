import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateHunt } from "@/hooks/use-hunts";
import { useToast } from "@/hooks/use-toast";
import type { InsertHunt } from "@shared/schema";

interface CreateHuntModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHuntModal({ open, onOpenChange }: CreateHuntModalProps) {
  const [formData, setFormData] = useState<InsertHunt>({
    title: "",
    casino: "",
    currency: "USD",
    startBalance: "0",
    status: "collecting",
    notes: "",
    isPublic: false,
  });

  const createHunt = useCreateHunt();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createHunt.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Hunt created successfully!",
      });
      onOpenChange(false);
      setFormData({
        title: "",
        casino: "",
        currency: "USD",
        startBalance: "0",
        status: "collecting",
        notes: "",
        isPublic: false,
      });
    } catch (error) {
      console.error('Hunt creation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create hunt. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-purple border-purple-800/30 text-white">
        <DialogHeader>
          <DialogTitle>Create New Hunt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Hunt Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter hunt title"
              required
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-hunt-title"
            />
          </div>
          
          <div>
            <Label htmlFor="casino">Casino Name</Label>
            <Input
              id="casino"
              value={formData.casino}
              onChange={(e) => setFormData({ ...formData, casino: e.target.value })}
              placeholder="Enter casino name"
              required
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-casino-name"
            />
          </div>
          
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="USD" className="text-white hover:bg-gray-700">USD ($)</SelectItem>
                <SelectItem value="CAD" className="text-white hover:bg-gray-700">CAD (C$)</SelectItem>
                <SelectItem value="AUD" className="text-white hover:bg-gray-700">AUD (A$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="startBalance">Starting Balance</Label>
            <Input
              id="startBalance"
              type="number"
              step="0.01"
              value={formData.startBalance}
              onChange={(e) => setFormData({ ...formData, startBalance: e.target.value })}
              placeholder="0.00"
              required
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-start-balance"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this hunt..."
              className="h-20 resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-notes"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-hunt"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createHunt.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
              data-testid="button-create-hunt"
            >
              {createHunt.isPending ? "Creating..." : "Create Hunt"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
