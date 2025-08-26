import { Link } from "wouter";
import { Clock, DollarSign, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Hunt } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";

interface HuntCardProps {
  hunt: Hunt;
  bonusCount?: number;
}

export function HuntCard({ hunt, bonusCount = 0 }: HuntCardProps) {
  const statusColors = {
    collecting: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    opening: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    finished: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const timeAgo = new Date(hunt.createdAt * 1000).toLocaleDateString();

  return (
    <Card className="bg-dark-purple/50 border-purple-800/30 hover:bg-white/5 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{hunt.title}</h3>
            <p className="text-gray-400 text-sm">{hunt.casino}</p>
          </div>
          <Badge className={statusColors[hunt.status as keyof typeof statusColors]}>
            {hunt.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm">
            <Target className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-400">Bonuses:</span>
            <span className="text-white ml-1">{bonusCount}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-400">Created:</span>
            <span className="text-white ml-1">{timeAgo}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm">
            <DollarSign className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-gray-400">Start:</span>
            <span className="text-green-400 ml-1">
              {formatCurrency(hunt.startBalance, hunt.currency as any)}
            </span>
          </div>
          {hunt.endBalance && (
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-gray-400">End:</span>
              <span className="text-green-400 ml-1">
                {formatCurrency(hunt.endBalance, hunt.currency as any)}
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Link href={`/hunts/${hunt.id}`} className="flex-1">
            <button 
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-colors text-sm"
              data-testid={`button-view-hunt-${hunt.id}`}
            >
              View Details
            </button>
          </Link>
          {hunt.publicToken && (
            <Link href={`/public/${hunt.publicToken}`} className="flex-1">
              <button 
                className="w-full bg-secondary hover:bg-secondary/90 text-white py-2 rounded-lg transition-colors text-sm"
                data-testid={`button-public-view-${hunt.id}`}
              >
                Public View
              </button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
