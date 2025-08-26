import { hunts, bonuses, slotDatabase, meta, adminSessions } from "@shared/schema";
import type { Hunt, InsertHunt, Bonus, InsertBonus, Slot, InsertSlot, Meta, AdminSession } from "@shared/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Hunts
  getHunts(): Promise<Hunt[]>;
  getHunt(id: string): Promise<Hunt | undefined>;
  getHuntByPublicToken(token: string): Promise<Hunt | undefined>;
  createHunt(hunt: InsertHunt): Promise<Hunt>;
  updateHunt(id: string, hunt: Partial<Hunt>): Promise<Hunt | undefined>;
  deleteHunt(id: string): Promise<boolean>;

  // Bonuses
  getBonusesByHuntId(huntId: string): Promise<Bonus[]>;
  getBonus(id: string): Promise<Bonus | undefined>;
  createBonus(bonus: InsertBonus): Promise<Bonus>;
  updateBonus(id: string, bonus: Partial<Bonus>): Promise<Bonus | undefined>;
  deleteBonus(id: string): Promise<boolean>;

  // Slots
  getSlots(): Promise<Slot[]>;
  searchSlots(query: string): Promise<Slot[]>;
  getSlot(id: string): Promise<Slot | undefined>;
  getSlotByName(name: string): Promise<Slot | undefined>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  bulkCreateSlots(slots: InsertSlot[]): Promise<void>;
  clearSlots(): Promise<void>;

  // Meta
  getMeta(key: string): Promise<string | undefined>;
  setMeta(key: string, value: string): Promise<void>;

  // Stats
  getStats(): Promise<{
    totalHunts: number;
    activeHunts: number;
    totalSpent: number;
    totalWon: number;
  }>;

  // Latest hunt
  getLatestHunt(): Promise<Hunt | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getHunts(): Promise<Hunt[]> {
    return await db.select().from(hunts).orderBy(desc(hunts.createdAt));
  }

  async getHunt(id: string): Promise<Hunt | undefined> {
    const result = await db.select().from(hunts).where(eq(hunts.id, id)).limit(1);
    return result[0];
  }

  async getHuntByPublicToken(token: string): Promise<Hunt | undefined> {
    const result = await db.select().from(hunts).where(eq(hunts.publicToken, token)).limit(1);
    return result[0];
  }

  async createHunt(hunt: InsertHunt): Promise<Hunt> {
    const result = await db.insert(hunts).values(hunt).returning();
    return result[0];
  }

  async updateHunt(id: string, hunt: Partial<Hunt>): Promise<Hunt | undefined> {
    const result = await db
      .update(hunts)
      .set({ ...hunt, updatedAt: new Date() })
      .where(eq(hunts.id, id))
      .returning();
    return result[0];
  }

  async deleteHunt(id: string): Promise<boolean> {
    const result = await db.delete(hunts).where(eq(hunts.id, id));
    return result.rowCount > 0;
  }

  async getBonusesByHuntId(huntId: string): Promise<Bonus[]> {
    return await db
      .select()
      .from(bonuses)
      .where(eq(bonuses.huntId, huntId))
      .orderBy(asc(bonuses.order));
  }

  async getBonus(id: string): Promise<Bonus | undefined> {
    const result = await db.select().from(bonuses).where(eq(bonuses.id, id)).limit(1);
    return result[0];
  }

  async createBonus(bonus: InsertBonus): Promise<Bonus> {
    const result = await db.insert(bonuses).values(bonus).returning();
    return result[0];
  }

  async updateBonus(id: string, bonus: Partial<Bonus>): Promise<Bonus | undefined> {
    const result = await db
      .update(bonuses)
      .set(bonus)
      .where(eq(bonuses.id, id))
      .returning();
    return result[0];
  }

  async deleteBonus(id: string): Promise<boolean> {
    const result = await db.delete(bonuses).where(eq(bonuses.id, id));
    return result.rowCount > 0;
  }

  async getSlots(): Promise<Slot[]> {
    return await db.select().from(slotDatabase).orderBy(asc(slotDatabase.name));
  }

  async searchSlots(query: string): Promise<Slot[]> {
    return await db
      .select()
      .from(slotDatabase)
      .where(sql`LOWER(${slotDatabase.name}) LIKE LOWER(${'%' + query + '%'})`)
      .orderBy(asc(slotDatabase.name))
      .limit(50);
  }

  async getSlot(id: string): Promise<Slot | undefined> {
    const result = await db.select().from(slotDatabase).where(eq(slotDatabase.id, id)).limit(1);
    return result[0];
  }

  async getSlotByName(name: string): Promise<Slot | undefined> {
    const result = await db.select().from(slotDatabase).where(eq(slotDatabase.name, name)).limit(1);
    return result[0];
  }

  async createSlot(slot: InsertSlot): Promise<Slot> {
    const result = await db.insert(slotDatabase).values(slot).returning();
    return result[0];
  }

  async bulkCreateSlots(slots: InsertSlot[]): Promise<void> {
    if (slots.length === 0) return;
    
    // Use batch insert for better performance
    const batchSize = 100;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      await db.insert(slotDatabase).values(batch);
    }
  }

  async getMeta(key: string): Promise<string | undefined> {
    const result = await db.select().from(meta).where(eq(meta.key, key)).limit(1);
    return result[0]?.value;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await db
      .insert(meta)
      .values({ key, value })
      .onConflictDoUpdate({
        target: meta.key,
        set: { value }
      });
  }

  async getStats(): Promise<{
    totalHunts: number;
    activeHunts: number;
    totalSpent: number;
    totalWon: number;
  }> {
    const [totalHuntsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hunts);

    const [activeHuntsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hunts)
      .where(eq(hunts.status, 'collecting'));

    const [spentResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${hunts.startBalance} AS NUMERIC) - COALESCE(CAST(${hunts.endBalance} AS NUMERIC), 0)), 0)` 
      })
      .from(hunts);

    const [wonResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${bonuses.winAmount} AS NUMERIC)), 0)` 
      })
      .from(bonuses)
      .where(sql`${bonuses.winAmount} IS NOT NULL`);

    return {
      totalHunts: totalHuntsResult.count,
      activeHunts: activeHuntsResult.count,
      totalSpent: Number(spentResult.total) || 0,
      totalWon: Number(wonResult.total) || 0,
    };
  }

  async getLatestHunt(): Promise<Hunt | undefined> {
    const result = await db
      .select()
      .from(hunts)
      .orderBy(desc(hunts.createdAt))
      .limit(1);
    return result[0];
  }

  async clearSlots(): Promise<void> {
    await db.delete(slotDatabase);
  }
}

export const storage = new DatabaseStorage();