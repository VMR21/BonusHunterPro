import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, User } from "lucide-react";
import { Link } from "wouter";
import type { HuntWithAdmin } from "@shared/schema";

// Simple currency formatter
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default function LiveHunts() {
  const { data: liveHunts = [], isLoading } = useQuery<HuntWithAdmin[]>({
    queryKey: ["/api/live-hunts"],
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });

  const { data: allHunts = [] } = useQuery<HuntWithAdmin[]>({
    queryKey: ["/api/hunts-with-users"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Live Bonus Hunts</h1>
          <p>Loading live hunts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Live Bonus Hunts</h1>
        <p className="text-white/80 mb-8">
          Watch bonus hunts in real-time from players around the world
        </p>
      </div>

      {/* Live Hunts Section */}
      {liveHunts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-semibold text-white">Live Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveHunts.map((hunt) => (
              <LiveHuntCard key={hunt.id} hunt={hunt} />
            ))}
          </div>
        </div>
      )}

      {/* All Hunts Section */}
      {allHunts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">All Recent Hunts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allHunts.map((hunt) => (
              <HuntCard key={hunt.id} hunt={hunt} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveHunts.length === 0 && allHunts.length === 0 && (
        <div className="text-center py-20">
          <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">No hunts yet</h2>
          <p className="text-gray-400">Be the first to start a bonus hunt!</p>
        </div>
      )}
    </div>
  );
}

function LiveHuntCard({ hunt }: { hunt: HuntWithAdmin }) {
  return (
    <Card className="relative overflow-hidden border-red-500/50 bg-red-950/20">
      <div className="absolute top-2 right-2">
        <Badge variant="destructive" className="animate-pulse">
          LIVE
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="text-lg pr-12">{hunt.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {hunt.adminDisplayName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Casino</span>
          <span className="font-medium">{hunt.casino}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Budget</span>
          <span className="font-medium">
            {formatCurrency(Number(hunt.startBalance), hunt.currency)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Status</span>
          <Badge variant={hunt.status === "collecting" ? "secondary" : "default"}>
            {hunt.status}
          </Badge>
        </div>
        <Link href={`/hunts/${hunt.id}`}>
          <Button className="w-full" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Watch Live
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function HuntCard({ hunt }: { hunt: HuntWithAdmin }) {
  return (
    <Card className="hover:bg-white/5 transition-colors">
      <CardHeader>
        <CardTitle className="text-lg">{hunt.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {hunt.adminDisplayName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Casino</span>
          <span className="font-medium">{hunt.casino}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Budget</span>
          <span className="font-medium">
            {formatCurrency(Number(hunt.startBalance), hunt.currency)}
          </span>
        </div>
        {hunt.endBalance && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Result</span>
            <span className={`font-medium ${Number(hunt.endBalance) > Number(hunt.startBalance) ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(Number(hunt.endBalance), hunt.currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/70">Status</span>
          <Badge variant={hunt.status === "collecting" ? "secondary" : "default"}>
            {hunt.status}
          </Badge>
        </div>
        <Link href={`/hunts/${hunt.id}`}>
          <Button variant="outline" className="w-full" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Hunt
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}