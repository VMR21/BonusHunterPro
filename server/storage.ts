import { hunts, bonuses, slotDatabase, meta, adminSessions, users } from "@shared/schema";
import type { Hunt, InsertHunt, Bonus, InsertBonus, Slot, InsertSlot, Meta, AdminSession, User, InsertUser, HuntWithUser } from "@shared/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // Hunts
  getHunts(): Promise<Hunt[]>;
  getHuntsWithUsers(): Promise<HuntWithUser[]>;
  getLiveHunts(): Promise<HuntWithUser[]>;
  getUserHunts(userId: string): Promise<Hunt[]>;
  getHunt(id: string): Promise<Hunt | undefined>;
  getHuntByPublicToken(token: string): Promise<Hunt | undefined>;
  createHunt(hunt: InsertHunt, userId: string): Promise<Hunt>;
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
  // User methods
  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, userUpdate: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...userUpdate, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Hunt methods
  async getHunts(): Promise<Hunt[]> {
    return await db.select().from(hunts).orderBy(desc(hunts.createdAt));
  }

  async getHuntsWithUsers(): Promise<HuntWithUser[]> {
    const result = await db
      .select()
      .from(hunts)
      .leftJoin(users, eq(hunts.userId, users.id))
      .orderBy(desc(hunts.createdAt));
    
    return result.map(r => ({
      ...r.hunts,
      user: r.users || { id: '', email: 'unknown@user.com', name: 'Unknown User', profileImage: null, googleId: null, createdAt: new Date(), updatedAt: new Date() }
    }));
  }

  async getLiveHunts(): Promise<HuntWithUser[]> {
    const result = await db
      .select()
      .from(hunts)
      .leftJoin(users, eq(hunts.userId, users.id))
      .where(eq(hunts.isLive, true))
      .orderBy(desc(hunts.updatedAt));
    
    return result.map(r => ({
      ...r.hunts,
      user: r.users || { id: '', email: 'unknown@user.com', name: 'Unknown User', profileImage: null, googleId: null, createdAt: new Date(), updatedAt: new Date() }
    }));
  }

  async getUserHunts(userId: string): Promise<Hunt[]> {
    return await db
      .select()
      .from(hunts)
      .where(eq(hunts.userId, userId))
      .orderBy(desc(hunts.createdAt));
  }

  async getHunt(id: string): Promise<Hunt | undefined> {
    const result = await db.select().from(hunts).where(eq(hunts.id, id)).limit(1);
    return result[0];
  }

  async getHuntByPublicToken(token: string): Promise<Hunt | undefined> {
    const result = await db.select().from(hunts).where(eq(hunts.publicToken, token)).limit(1);
    return result[0];
  }

  async createHunt(hunt: InsertHunt, userId: string): Promise<Hunt> {
    const result = await db.insert(hunts).values({ ...hunt, userId }).returning();
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
      .where(sql`${hunts.status} != 'completed'`);

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