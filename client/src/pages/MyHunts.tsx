import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreateHuntModal } from "@/components/create-hunt-modal";
import { HuntCard } from "@/components/hunt-card";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trophy } from "lucide-react";
import type { Hunt } from "@shared/schema";

export default function MyHunts() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { isAuthenticated, adminDisplayName } = useAuth();
  
  const { data: hunts, isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/my-hunts"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">My Hunts</h1>
            <p className="text-gray-300 text-lg">
              Please login to view your personal bonus hunts
            </p>
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
            My Bonus Hunts
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            Welcome back, <span className="text-primary font-semibold">{adminDisplayName}</span>! 
            Manage your personal bonus hunts and track your progress.
          </p>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-lg"
            data-testid="button-new-hunt"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Hunt
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 rounded-lg h-48" />
              </div>
            ))}
          </div>
        ) : hunts?.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No hunts yet</h2>
            <p className="text-gray-400 mb-6">Create your first bonus hunt to get started!</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white"
              data-testid="button-create-first-hunt"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Hunt
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hunts?.map((hunt: Hunt) => (
              <HuntCard key={hunt.id} hunt={hunt} />
            ))}
          </div>
        )}

        <CreateHuntModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      </div>
    </div>
  );
}