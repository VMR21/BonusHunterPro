import {
  hunts,
  bonuses,
  slotDatabase,
  meta,
  adminKeys,
  adminSessions,
  type Hunt,
  type InsertHunt,
  type Bonus,
  type InsertBonus,
  type Slot,
  type InsertSlot,
  type Meta,
  type AdminKey,
  type InsertAdminKey,
  type HuntWithBonusCount,
  type HuntWithAdmin,
  type AdminSession,
} from "@shared/schema";
import { eq, desc, asc, sql, ilike } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Admin Keys
  getAdminKeyByValue(keyValue: string): Promise<AdminKey | undefined>;
  getAdminKeyById(id: string): Promise<AdminKey | undefined>;
  createAdminKey(adminKey: InsertAdminKey): Promise<AdminKey>;
  updateAdminKey(id: string, adminKey: Partial<AdminKey>): Promise<AdminKey | undefined>;
  getAllAdminKeys(): Promise<AdminKey[]>;
  deleteAdminKey(id: string): Promise<boolean>;

  // Admin Sessions
  createAdminSession(adminKeyId: string, sessionToken: string, expiresAt: Date): Promise<AdminSession>;
  getAdminSession(sessionToken: string): Promise<AdminSession | undefined>;
  deleteAdminSession(sessionToken: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<void>;

  // Hunts
  getHunts(): Promise<Hunt[]>;
  getHuntsWithAdmin(): Promise<HuntWithAdmin[]>;
  getLiveHunts(): Promise<HuntWithAdmin[]>;
  getAdminHunts(adminKey: string): Promise<Hunt[]>;
  getHunt(id: string): Promise<Hunt | undefined>;
  getHuntByPublicToken(token: string): Promise<Hunt | undefined>;
  createHunt(hunt: InsertHunt, adminKey: string): Promise<Hunt>;
  updateHunt(id: string, hunt: Partial<Hunt>): Promise<Hunt | undefined>;
  deleteHunt(id: string): Promise<boolean>;

  // Bonuses
  getBonusesByHuntId(huntId: string): Promise<Bonus[]>;
  getAllLiveBonuses(): Promise<(Bonus & { huntTitle: string; adminDisplayName: string })[]>;
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
  getAdminStats(adminKey: string): Promise<{
    totalHunts: number;
    activeHunts: number;
    totalSpent: number;
    totalWon: number;
  }>;

  // Latest hunt
  getLatestHunt(): Promise<Hunt | undefined>;
  getLatestAdminHunt(adminKey: string): Promise<Hunt | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Admin Key methods
  async getAdminKeyByValue(keyValue: string): Promise<AdminKey | undefined> {
    const result = await db.select().from(adminKeys).where(eq(adminKeys.keyValue, keyValue)).limit(1);
    return result[0];
  }

  async getAdminKeyById(id: string): Promise<AdminKey | undefined> {
    const result = await db.select().from(adminKeys).where(eq(adminKeys.id, id)).limit(1);
    return result[0];
  }

  async createAdminKey(adminKey: InsertAdminKey): Promise<AdminKey> {
    const result = await db.insert(adminKeys).values(adminKey).returning();
    return result[0];
  }

  async getAllAdminKeys(): Promise<AdminKey[]> {
    return await db.select().from(adminKeys).orderBy(asc(adminKeys.displayName));
  }

  async updateAdminKey(id: string, adminKey: Partial<AdminKey>): Promise<AdminKey | undefined> {
    const result = await db
      .update(adminKeys)
      .set({ ...adminKey, updatedAt: new Date() })
      .where(eq(adminKeys.id, id))
      .returning();
    return result[0];
  }

  async deleteAdminKey(id: string): Promise<boolean> {
    const result = await db.delete(adminKeys).where(eq(adminKeys.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Admin Session methods
  async createAdminSession(adminKeyId: string, sessionToken: string, expiresAt: Date): Promise<AdminSession> {
    const result = await db.insert(adminSessions).values({
      adminKeyId,
      sessionToken,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getAdminSession(sessionToken: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, sessionToken)).limit(1);
    return result[0];
  }

  async deleteAdminSession(sessionToken: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.sessionToken, sessionToken));
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(adminSessions).where(sql`${adminSessions.expiresAt} < NOW()`);
  }

  // Hunt methods
  async getHunts(): Promise<Hunt[]> {
    return await db.select().from(hunts).orderBy(desc(hunts.createdAt));
  }

  async getHuntsWithAdmin(): Promise<HuntWithAdmin[]> {
    const result = await db
      .select({
        hunt: hunts,
        adminDisplayName: adminKeys.displayName,
      })
      .from(hunts)
      .leftJoin(adminKeys, eq(hunts.adminKey, adminKeys.keyValue))
      .orderBy(desc(hunts.createdAt));
    
    return result.map(r => ({
      ...r.hunt,
      adminDisplayName: r.adminDisplayName || 'Unknown Admin'
    }));
  }

  async getLiveHunts(): Promise<HuntWithAdmin[]> {
    const result = await db
      .select({
        hunt: hunts,
        adminDisplayName: adminKeys.displayName,
      })
      .from(hunts)
      .leftJoin(adminKeys, eq(hunts.adminKey, adminKeys.keyValue))
      .where(eq(hunts.isPublic, true))
      .orderBy(desc(hunts.updatedAt));
    
    return result.map(r => ({
      ...r.hunt,
      adminDisplayName: r.adminDisplayName || 'Unknown Admin'
    }));
  }

  async getAdminHunts(adminKey: string): Promise<Hunt[]> {
    return await db
      .select()
      .from(hunts)
      .where(eq(hunts.adminKey, adminKey))
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

  async createHunt(hunt: InsertHunt, adminKey: string): Promise<Hunt> {
    const publicToken = Math.random().toString(36).substring(2, 15);
    const result = await db.insert(hunts).values({
      ...hunt,
      adminKey,
      publicToken,
    }).returning();
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
    return (result.rowCount ?? 0) > 0;
  }

  // Bonus methods
  async getBonusesByHuntId(huntId: string): Promise<Bonus[]> {
    return await db
      .select()
      .from(bonuses)
      .where(eq(bonuses.huntId, huntId))
      .orderBy(asc(bonuses.order));
  }

  async getAllLiveBonuses(): Promise<(Bonus & { huntTitle: string; adminDisplayName: string })[]> {
    const result = await db
      .select({
        bonus: bonuses,
        huntTitle: hunts.title,
        adminDisplayName: adminKeys.displayName,
      })
      .from(bonuses)
      .innerJoin(hunts, eq(bonuses.huntId, hunts.id))
      .leftJoin(adminKeys, eq(hunts.adminKey, adminKeys.keyValue))
      .where(eq(hunts.isPublic, true))
      .orderBy(desc(hunts.updatedAt), asc(bonuses.order));

    return result.map(r => ({
      ...r.bonus,
      huntTitle: r.huntTitle,
      adminDisplayName: r.adminDisplayName || 'Unknown Admin'
    }));
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
    return (result.rowCount ?? 0) > 0;
  }

  // Slot methods
  async getSlots(): Promise<Slot[]> {
    return await db.select().from(slotDatabase).orderBy(asc(slotDatabase.name));
  }

  async searchSlots(query: string): Promise<Slot[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(slotDatabase)
      .where(
        ilike(slotDatabase.name, searchTerm)
      )
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
    await db.insert(slotDatabase).values(slots);
  }

  async clearSlots(): Promise<void> {
    await db.delete(slotDatabase);
  }

  // Meta methods
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
        set: { value },
      });
  }

  // Stats methods
  async getStats(): Promise<{
    totalHunts: number;
    activeHunts: number;
    totalSpent: number;
    totalWon: number;
  }> {
    const [huntsResult] = await db
      .select({
        totalHunts: sql<number>`count(*)::int`,
        activeHunts: sql<number>`count(case when status != 'finished' then 1 end)::int`,
      })
      .from(hunts);

    const [spentResult] = await db
      .select({
        totalSpent: sql<number>`coalesce(sum(${bonuses.betAmount}), 0)::numeric`,
      })
      .from(bonuses);

    const [wonResult] = await db
      .select({
        totalWon: sql<number>`coalesce(sum(${bonuses.winAmount}), 0)::numeric`,
      })
      .from(bonuses)
      .where(sql`${bonuses.winAmount} IS NOT NULL`);

    return {
      totalHunts: huntsResult.totalHunts,
      activeHunts: huntsResult.activeHunts,
      totalSpent: Number(spentResult.totalSpent),
      totalWon: Number(wonResult.totalWon),
    };
  }

  async getAdminStats(adminKey: string): Promise<{
    totalHunts: number;
    activeHunts: number;
    totalSpent: number;
    totalWon: number;
  }> {
    const [huntsResult] = await db
      .select({
        totalHunts: sql<number>`count(*)::int`,
        activeHunts: sql<number>`count(case when status != 'finished' then 1 end)::int`,
      })
      .from(hunts)
      .where(eq(hunts.adminKey, adminKey));

    const [spentResult] = await db
      .select({
        totalSpent: sql<number>`coalesce(sum(${bonuses.betAmount}), 0)::numeric`,
      })
      .from(bonuses)
      .innerJoin(hunts, eq(bonuses.huntId, hunts.id))
      .where(eq(hunts.adminKey, adminKey));

    const [wonResult] = await db
      .select({
        totalWon: sql<number>`coalesce(sum(${bonuses.winAmount}), 0)::numeric`,
      })
      .from(bonuses)
      .innerJoin(hunts, eq(bonuses.huntId, hunts.id))
      .where(sql`${hunts.adminKey} = ${adminKey} AND ${bonuses.winAmount} IS NOT NULL`);

    return {
      totalHunts: huntsResult.totalHunts,
      activeHunts: huntsResult.activeHunts,
      totalSpent: Number(spentResult.totalSpent),
      totalWon: Number(wonResult.totalWon),
    };
  }

  // Latest hunt methods
  async getLatestHunt(): Promise<Hunt | undefined> {
    const result = await db
      .select()
      .from(hunts)
      .orderBy(desc(hunts.createdAt))
      .limit(1);
    return result[0];
  }

  async getLatestAdminHunt(adminKey: string): Promise<Hunt | undefined> {
    const result = await db
      .select()
      .from(hunts)
      .where(eq(hunts.adminKey, adminKey))
      .orderBy(desc(hunts.createdAt))
      .limit(1);
    return result[0];
  }
}

export const storage = new DatabaseStorage();