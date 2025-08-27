import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shuffle, CheckCircle2, Circle } from "lucide-react";

interface Slot {
  id: string;
  name: string;
  provider: string;
  imageUrl: string;
}

export default function SlotPickerPage() {
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [currentSlot, setCurrentSlot] = useState<Slot | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ["/api/slots"],
  });

  // Get unique providers
  const providers = Array.from(new Set(slots.map(slot => slot.provider))).sort();

  // Filter slots by selected providers
  const filteredSlots = slots.filter(slot => 
    selectedProviders.size === 0 || selectedProviders.has(slot.provider)
  );

// Initialize with all providers selected (run only once)
const [bootstrapped, setBootstrapped] = useState(false);

useEffect(() => {
  if (!bootstrapped && providers.length > 0) {
    setSelectedProviders(new Set(providers));
    setBootstrapped(true);
  }
}, [providers, bootstrapped]);


  const toggleProvider = (provider: string) => {
    const newSelected = new Set(selectedProviders);
    if (newSelected.has(provider)) {
      newSelected.delete(provider);
    } else {
      newSelected.add(provider);
    }
    setSelectedProviders(newSelected);
  };

  const selectAllProviders = () => {
    setSelectedProviders(new Set(providers));
  };

  const deselectAllProviders = () => {
    setSelectedProviders(new Set());
  };

  const pickRandomSlot = () => {
    if (filteredSlots.length === 0) {
      return;
    }

    const randomSlot = filteredSlots[Math.floor(Math.random() * filteredSlots.length)];
    
    if (isFlipped) {
      // Flip to front first, then show new slot
      setIsFlipped(false);
      setTimeout(() => {
        setImageLoading(true);
        preloadImage(randomSlot);
      }, 350);
    } else {
      // Direct pick
      setImageLoading(true);
      preloadImage(randomSlot);
    }
  };

  const preloadImage = (slot: Slot) => {
    const img = new Image();
    img.onload = () => {
      setCurrentSlot(slot);
      setImageLoading(false);
      setIsFlipped(true);
    };
    img.onerror = () => {
      setCurrentSlot({ ...slot, imageUrl: '' });
      setImageLoading(false);
      setIsFlipped(true);
    };
    img.src = slot.imageUrl;
  };

  // Handle spacebar for picking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        pickRandomSlot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSlots, isFlipped]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Providers Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Shuffle className="w-6 h-6 text-purple-500" />
                Slot Picker
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={selectAllProviders}
                  variant="outline"
                  size="sm"
                  className="border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
                >
                  Select All
                </Button>
                <Button 
                  onClick={deselectAllProviders}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Deselect All
                </Button>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {selectedProviders.size} provider{selectedProviders.size !== 1 ? 's' : ''} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {providers.map(provider => (
                  <Button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    variant={selectedProviders.has(provider) ? "default" : "outline"}
                    size="sm"
                    className={`${
                      selectedProviders.has(provider)
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    } flex items-center gap-2`}
                  >
                    {selectedProviders.has(provider) ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    {provider}
                  </Button>
                ))}
              </div>
              
              <div className="text-sm text-gray-400 pt-4 border-t border-gray-700">
                {filteredSlots.length} of {slots.length} slots match your filter
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slot Display Panel */}
        <div className="space-y-4">
          {/* Card Display */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex justify-center">
                <div 
                  className={`w-80 h-96 perspective-1000 ${isFlipped ? 'flipped' : ''}`}
                  style={{ perspective: '1200px' }}
                >
                  <div 
                    className="relative w-full h-full transition-transform duration-700 preserve-3d"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front Face */}
                    <div 
                      className="absolute inset-0 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-center text-gray-400">
                        <Shuffle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">Pick a Slot!</p>
                        <p className="text-sm">Press spacebar or click the button</p>
                      </div>
                    </div>

                    {/* Back Face */}
                    <div 
                      className="absolute inset-0 bg-gray-800 rounded-lg border border-gray-600 p-4 flex items-center justify-center"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      {currentSlot && (
                        <div className="text-center">
                          {currentSlot.imageUrl && !imageLoading ? (
                            <img 
                              src={currentSlot.imageUrl}
                              alt={currentSlot.name}
                              className="w-full h-72 object-contain rounded-lg shadow-lg mb-4"
                            />
                          ) : (
                            <div className="w-full h-72 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                              {imageLoading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                              ) : (
                                <div className="text-gray-500">No Image</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Slot Info and Pick Button */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {currentSlot?.name || '—'}
                  </h3>
                  <p className="text-gray-400">
                    {currentSlot?.provider || '—'}
                  </p>
                </div>
                <Button 
                  onClick={pickRandomSlot}
                  disabled={filteredSlots.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Pick A Slot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="text-center text-sm text-gray-400">
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  Press Spacebar to pick
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
