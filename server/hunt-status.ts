import { storage } from "./storage";

export async function updateHuntStatus(huntId: string) {
  const hunt = await storage.getHunt(huntId);
  if (!hunt) return null;

  const allBonuses = await storage.getBonusesByHuntId(huntId);
  const totalWon = allBonuses.reduce((sum, b) => sum + (Number(b.winAmount) || 0), 0);
  const playedBonuses = allBonuses.filter(b => b.isPlayed);
  const isCompleted = playedBonuses.length === allBonuses.length && allBonuses.length > 0;
  
  // Determine new status based on progress
  let newStatus = hunt.status;
  if (isCompleted) {
    newStatus = 'completed';
  } else if (playedBonuses.length > 0 && hunt.status === 'collecting') {
    newStatus = 'playing';
  }
  
  return await storage.updateHunt(huntId, {
    totalWon: totalWon.toString(),
    status: newStatus
  });
}