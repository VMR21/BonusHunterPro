import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBonus } from "@/hooks/use-bonuses";
import { useToast } from "@/hooks/use-toast";
import { searchSlots, getSlotDetails } from "@/lib/slot-database";
import type { InsertBonus } from "@shared/schema";
import type { Slot } from "@shared/schema";

interface AddBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  huntId: string;
  nextOrder: number;
}

export function AddBonusModal({ open, onOpenChange, huntId, nextOrder }: AddBonusModalProps) {
  const [formData, setFormData] = useState<InsertBonus>({
    huntId,
    slotName: "",
    provider: "",
    imageUrl: "",
    betAmount: "0",
    order: nextOrder,
    status: "waiting",
  });
  
  const [slotSuggestions, setSlotSuggestions] = useState<Slot[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const createBonus = useCreateBonus();
  const { toast } = useToast();

  const handleSlotSearch = async (query: string) => {
    setFormData({ ...formData, slotName: query });
    
    if (query.length >= 2) {
      const suggestions = await searchSlots(query);
      setSlotSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSlotSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSlotSelect = async (slot: Slot) => {
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      slotName: slot.name,
      provider: slot.provider,
      imageUrl: slot.imageUrl || "",
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createBonus.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Bonus added successfully!",
      });
      onOpenChange(false);
      setFormData({
        huntId,
        slotName: "",
        provider: "",
        imageUrl: "",
        betAmount: "0",
        order: nextOrder + 1,
        status: "waiting",
      });
      setSelectedSlot(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bonus. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, huntId, order: nextOrder }));
  }, [huntId, nextOrder]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-purple border-purple-800/30 text-white">
        <DialogHeader>
          <DialogTitle>Add Bonus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Label htmlFor="slotName">Slot Game</Label>
            <Input
              id="slotName"
              value={formData.slotName}
              onChange={(e) => handleSlotSearch(e.target.value)}
              placeholder="Search slot games..."
              required
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-slot-search"
            />
            {showSuggestions && slotSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-dark border border-purple-800/30 rounded-lg max-h-40 overflow-y-auto">
                {slotSuggestions.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center space-x-3"
                    data-testid={`option-slot-${slot.name}`}
                  >
                    {slot.imageUrl && (
                      <img
                        src={slot.imageUrl}
                        alt={slot.name}
                        className="w-8 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="text-white text-sm">{slot.name}</div>
                      <div className="text-gray-400 text-xs">{slot.provider}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="provider">Provider</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Auto-filled from selection"
              className="bg-gray-700 text-gray-300"
              readOnly
              data-testid="input-provider"
            />
          </div>
          
          <div>
            <Label htmlFor="betAmount">Bet Amount</Label>
            <Input
              id="betAmount"
              type="number"
              step="0.01"
              value={formData.betAmount}
              onChange={(e) => setFormData({ ...formData, betAmount: e.target.value })}
              placeholder="0.00"
              required
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              data-testid="input-bet-amount"
            />
          </div>
          
          <div>
            <Label>Preview</Label>
            <div className="bg-dark border border-purple-800/30 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden">
                {selectedSlot?.imageUrl ? (
                  <img
                    src={selectedSlot.imageUrl}
                    alt={selectedSlot.name}
                    className="w-full h-full object-cover"
                    data-testid="img-slot-preview"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-gray-500 text-xs"
                    data-testid="text-no-preview"
                  >
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-400">
                {selectedSlot ? `${selectedSlot.name} - ${selectedSlot.provider}` : "Select a slot to see preview"}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-bonus"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBonus.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
              data-testid="button-add-bonus"
            >
              {createBonus.isPending ? "Adding..." : "Add Bonus"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
