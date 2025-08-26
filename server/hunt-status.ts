import { storage } from "./storage";

export async function updateHuntStatus(huntId: string) {
  const hunt = await storage.getHunt(huntId);
  if (!hunt) return null;

  const allBonuses = await storage.getBonusesByHuntId(huntId);
  const totalWon = allBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);
  const playedBonuses = allBonuses.filter(b => b.isPlayed);
  const isCompleted = playedBonuses.length === allBonuses.length && allBonuses.length > 0;
  
  return await storage.updateHunt(huntId, {
    totalWon: totalWon.toString(),
    status: isCompleted ? 'completed' : hunt.status
  });
}