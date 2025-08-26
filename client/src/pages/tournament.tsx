import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Crown, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Player {
  name: string;
  multiplier: number | null;
}

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner: string | null;
  completed: boolean;
}

interface TournamentBracket {
  [round: string]: Match[];
}

type TournamentSize = 4 | 8 | 16 | 32;

export default function TournamentPage() {
  const [tournamentSize, setTournamentSize] = useState<TournamentSize>(8);
  const [bracket, setBracket] = useState<TournamentBracket>({});
  const [champion, setChampion] = useState<string>("");
  const { isAuthenticated } = useAuth();

  // Initialize bracket when tournament size changes
  useEffect(() => {
    initializeBracket();
  }, [tournamentSize]);

  const initializeBracket = () => {
    const newBracket: TournamentBracket = {};
    const rounds = Math.log2(tournamentSize);
    
    // Round 1 - Initial matches
    const round1Matches: Match[] = [];
    for (let i = 0; i < tournamentSize / 2; i++) {
      round1Matches.push({
        id: `R1-${i}`,
        player1: { name: "", multiplier: null },
        player2: { name: "", multiplier: null },
        winner: null,
        completed: false
      });
    }
    newBracket["Round 1"] = round1Matches;

    // Subsequent rounds
    let prevRoundSize = tournamentSize / 2;
    for (let round = 2; round <= rounds; round++) {
      const roundMatches: Match[] = [];
      const roundSize = prevRoundSize / 2;
      
      for (let i = 0; i < roundSize; i++) {
        roundMatches.push({
          id: `R${round}-${i}`,
          player1: { name: "", multiplier: null },
          player2: { name: "", multiplier: null },
          winner: null,
          completed: false
        });
      }
      
      if (round === rounds) {
        newBracket["Final"] = roundMatches;
      } else {
        newBracket[`Round ${round}`] = roundMatches;
      }
      
      prevRoundSize = roundSize;
    }

    setBracket(newBracket);
    setChampion("");
  };

  const updatePlayer = (roundName: string, matchIndex: number, playerKey: 'player1' | 'player2', field: 'name' | 'multiplier', value: string) => {
    if (!isAuthenticated) return;

    setBracket(prev => {
      const newBracket = { ...prev };
      const round = [...newBracket[roundName]];
      const match = { ...round[matchIndex] };
      
      if (field === 'name') {
        match[playerKey] = { ...match[playerKey], name: value };
      } else {
        match[playerKey] = { ...match[playerKey], multiplier: value ? parseFloat(value) : null };
      }
      
      round[matchIndex] = match;
      newBracket[roundName] = round;
      return newBracket;
    });
  };

  const decideWinner = (roundName: string, matchIndex: number) => {
    if (!isAuthenticated) return;

    const match = bracket[roundName][matchIndex];
    const { player1, player2 } = match;

    if (!player1.name || !player2.name || player1.multiplier === null || player2.multiplier === null) {
      alert("Please enter both player names and multipliers.");
      return;
    }

    const winner = player1.multiplier >= player2.multiplier ? player1.name : player2.name;
    
    // Update current match
    setBracket(prev => {
      const newBracket = { ...prev };
      const round = [...newBracket[roundName]];
      round[matchIndex] = { ...round[matchIndex], winner, completed: true };
      newBracket[roundName] = round;
      return newBracket;
    });

    // Advance winner to next round
    advanceWinner(roundName, matchIndex, winner);
  };

  const advanceWinner = (currentRound: string, matchIndex: number, winner: string) => {
    const rounds = Object.keys(bracket);
    const currentRoundIndex = rounds.indexOf(currentRound);
    
    if (currentRoundIndex < rounds.length - 1) {
      const nextRound = rounds[currentRoundIndex + 1];
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const playerSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';

      setBracket(prev => {
        const newBracket = { ...prev };
        const round = [...newBracket[nextRound]];
        round[nextMatchIndex] = {
          ...round[nextMatchIndex],
          [playerSlot]: { name: winner, multiplier: null }
        };
        newBracket[nextRound] = round;
        return newBracket;
      });
    } else {
      // This is the final - set champion
      setChampion(winner);
    }
  };

  const resetTournament = () => {
    if (!isAuthenticated) return;
    if (confirm("Reset all tournament data?")) {
      initializeBracket();
    }
  };

  const canDecideWinner = (match: Match) => {
    return match.player1.name && 
           match.player2.name && 
           match.player1.multiplier !== null && 
           match.player2.multiplier !== null &&
           !match.completed;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text mb-4">
          Slot Tournament
        </h1>
        
        {/* Tournament Size Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {[4, 8, 16, 32].map(size => (
            <Button
              key={size}
              onClick={() => setTournamentSize(size as TournamentSize)}
              variant={tournamentSize === size ? "default" : "outline"}
              className={`${
                tournamentSize === size
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              {size} Players
            </Button>
          ))}
        </div>

        {/* Admin Panel */}
        {isAuthenticated && (
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="outline" className="border-cyan-500 text-cyan-400">
              <Crown className="w-4 h-4 mr-2" />
              Admin Mode Active
            </Badge>
            <Button onClick={resetTournament} variant="destructive" size="sm">
              Reset Tournament
            </Button>
          </div>
        )}
        
        {!isAuthenticated && (
          <Card className="bg-gray-900 border-gray-700 max-w-md mx-auto mb-6">
            <CardContent className="p-4 text-center text-gray-400">
              Please log in with your admin key to manage tournaments
            </CardContent>
          </Card>
        )}
      </div>

      {/* Champion Display */}
      {champion && (
        <Card className="bg-gradient-to-r from-yellow-900 to-orange-900 border-yellow-600 mb-8">
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Tournament Champion</h2>
            <p className="text-2xl font-semibold text-yellow-200">{champion}</p>
          </CardContent>
        </Card>
      )}

      {/* Tournament Bracket */}
      <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${Object.keys(bracket).length}, 1fr)` }}>
        {Object.entries(bracket).map(([roundName, matches]) => (
          <div key={roundName} className="space-y-6">
            <h3 className="text-xl font-bold text-center text-gray-300 mb-4">
              {roundName}
            </h3>
            
            <div className="space-y-8">
              {matches.map((match, matchIndex) => (
                <Card 
                  key={match.id} 
                  className={`bg-gray-900 border-gray-700 transition-all duration-300 ${
                    match.completed ? 'border-green-600 bg-green-900/20' : 'hover:border-purple-600'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Player 1 */}
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={match.player1.name}
                        onChange={(e) => updatePlayer(roundName, matchIndex, 'player1', 'name', e.target.value)}
                        placeholder={roundName === "Round 1" ? `Player ${matchIndex * 2 + 1}` : "Winner advances"}
                        disabled={!isAuthenticated || match.completed}
                        className="bg-gray-800 border-gray-600 text-white flex-1"
                      />
                      <Input
                        type="number"
                        value={match.player1.multiplier || ""}
                        onChange={(e) => updatePlayer(roundName, matchIndex, 'player1', 'multiplier', e.target.value)}
                        placeholder="x"
                        disabled={!isAuthenticated || match.completed}
                        className="bg-gray-800 border-gray-600 text-white w-20"
                        step="0.01"
                      />
                    </div>

                    {/* VS */}
                    <div className="text-center text-gray-500 text-sm mb-2">VS</div>

                    {/* Player 2 */}
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        value={match.player2.name}
                        onChange={(e) => updatePlayer(roundName, matchIndex, 'player2', 'name', e.target.value)}
                        placeholder={roundName === "Round 1" ? `Player ${matchIndex * 2 + 2}` : "Winner advances"}
                        disabled={!isAuthenticated || match.completed}
                        className="bg-gray-800 border-gray-600 text-white flex-1"
                      />
                      <Input
                        type="number"
                        value={match.player2.multiplier || ""}
                        onChange={(e) => updatePlayer(roundName, matchIndex, 'player2', 'multiplier', e.target.value)}
                        placeholder="x"
                        disabled={!isAuthenticated || match.completed}
                        className="bg-gray-800 border-gray-600 text-white w-20"
                        step="0.01"
                      />
                    </div>

                    {/* Decide Winner Button */}
                    {isAuthenticated && canDecideWinner(match) && (
                      <Button
                        onClick={() => decideWinner(roundName, matchIndex)}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Decide Winner
                      </Button>
                    )}

                    {/* Winner Display */}
                    {match.winner && (
                      <div className="text-center mt-2">
                        <Badge className="bg-green-600 text-white">
                          <Trophy className="w-3 h-3 mr-1" />
                          Winner: {match.winner}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-gray-900 border-gray-700 mt-8">
        <CardHeader>
          <CardTitle className="text-gray-300">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-400 space-y-2">
          <p>1. Select tournament size (4, 8, 16, or 32 players)</p>
          <p>2. Log in with your admin key to enable editing</p>
          <p>3. Fill in player names and multipliers for Round 1 matches</p>
          <p>4. Click "Decide Winner" to advance the player with higher multiplier</p>
          <p>5. Winners automatically advance to the next round</p>
          <p>6. Continue until a champion is crowned!</p>
        </CardContent>
      </Card>
    </div>
  );
}