import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2, Edit } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hunt } from "@shared/schema";

// Currency formatter
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default function MyHunts() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hunts = [], isLoading } = useQuery<(Hunt & { bonusCount?: number })[]>({
    queryKey: ["/api/my-hunts"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (huntId: string) => fetch(`/api/hunts/${huntId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-hunts"] });
      toast({
        title: "Hunt deleted",
        description: "Your hunt has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete hunt. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">My Hunts</h1>
          <p className="text-white/60 mb-8">Please sign in to view your hunts</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8 text-white">My Hunts</h1>
          <p>Loading your hunts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Hunts</h1>
          <p className="text-white/80">Manage your bonus hunt collection</p>
        </div>
        <Link href="/create-hunt">
          <Button data-testid="button-create-hunt">
            <Plus className="w-4 h-4 mr-2" />
            Create New Hunt
          </Button>
        </Link>
      </div>

      {hunts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-white mb-2">No hunts yet</h3>
          <p className="text-white/60 mb-4">Create your first bonus hunt to get started!</p>
          <Link href="/create-hunt">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Hunt
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hunts.map((hunt: Hunt & { bonusCount?: number }) => (
            <Card key={hunt.id} className="hover:bg-white/5 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{hunt.title}</CardTitle>
                    <CardDescription>{hunt.casino}</CardDescription>
                  </div>
                  <Badge variant={hunt.status === "collecting" ? "secondary" : "default"}>
                    {hunt.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/70 block">Budget</span>
                    <span className="font-medium">
                      {formatCurrency(Number(hunt.startBalance), hunt.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70 block">Bonuses</span>
                    <span className="font-medium">{hunt.bonusCount || 0}</span>
                  </div>
                  {hunt.endBalance && (
                    <>
                      <div>
                        <span className="text-white/70 block">Final</span>
                        <span className={`font-medium ${Number(hunt.endBalance) > Number(hunt.startBalance) ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Number(hunt.endBalance), hunt.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/70 block">P/L</span>
                        <span className={`font-medium ${Number(hunt.endBalance) > Number(hunt.startBalance) ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(Number(hunt.endBalance) - Number(hunt.startBalance), hunt.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/hunts/${hunt.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/edit-hunt/${hunt.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(hunt.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}