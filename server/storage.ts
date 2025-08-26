import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { hunts, bonuses, slotDatabase, meta } from "@shared/schema";
import type { Hunt, InsertHunt, Bonus, InsertBonus, Slot, InsertSlot, Meta } from "@shared/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const sqlite = new Database("data/hunts.db");
sqlite.exec("PRAGMA foreign_keys = ON");

const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS hunts (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    title TEXT NOT NULL,
    casino TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    start_balance REAL NOT NULL,
    end_balance REAL,
    status TEXT NOT NULL DEFAULT 'collecting',
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    is_public INTEGER NOT NULL DEFAULT 0,
    public_token TEXT
  );

  CREATE TABLE IF NOT EXISTS bonuses (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    hunt_id TEXT NOT NULL REFERENCES hunts(id) ON DELETE CASCADE,
    slot_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    image_url TEXT,
    bet_amount REAL NOT NULL,
    multiplier REAL,
    win_amount REAL,
    "order" INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS slot_database (
    id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    image_url TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_bonuses_hunt_id ON bonuses(hunt_id);
  CREATE INDEX IF NOT EXISTS idx_bonuses_order ON bonuses("order");
  CREATE INDEX IF NOT EXISTS idx_slot_database_name ON slot_database(name);
`);

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

  // Slot Database
  searchSlots(query: string): Promise<Slot[]>;
  getSlot(name: string): Promise<Slot | undefined>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  initializeSlotDatabase(csvData: string): Promise<void>;

  // Meta
  getMeta(key: string): Promise<string | undefined>;
  setMeta(key: string, value: string): Promise<void>;
}

export class SQLiteStorage implements IStorage {
  // Hunts
  async getHunts(): Promise<Hunt[]> {
    return db.select().from(hunts).orderBy(desc(hunts.createdAt));
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
    const id = randomUUID();
    const publicToken = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    const newHunt = {
      id,
      ...hunt,
      publicToken,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(hunts).values(newHunt);
    return newHunt as Hunt;
  }

  async updateHunt(id: string, hunt: Partial<Hunt>): Promise<Hunt | undefined> {
    const now = Math.floor(Date.now() / 1000);
    await db.update(hunts)
      .set({ ...hunt, updatedAt: now })
      .where(eq(hunts.id, id));
    
    return this.getHunt(id);
  }

  async deleteHunt(id: string): Promise<boolean> {
    const result = await db.delete(hunts).where(eq(hunts.id, id));
    return result.changes > 0;
  }

  // Bonuses
  async getBonusesByHuntId(huntId: string): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.huntId, huntId)).orderBy(asc(bonuses.order));
  }

  async getBonus(id: string): Promise<Bonus | undefined> {
    const result = await db.select().from(bonuses).where(eq(bonuses.id, id)).limit(1);
    return result[0];
  }

  async createBonus(bonus: InsertBonus): Promise<Bonus> {
    const id = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    const newBonus = {
      id,
      ...bonus,
      createdAt: now,
    };

    await db.insert(bonuses).values(newBonus);
    return newBonus as Bonus;
  }

  async updateBonus(id: string, bonus: Partial<Bonus>): Promise<Bonus | undefined> {
    await db.update(bonuses)
      .set(bonus)
      .where(eq(bonuses.id, id));
    
    return this.getBonus(id);
  }

  async deleteBonus(id: string): Promise<boolean> {
    const result = await db.delete(bonuses).where(eq(bonuses.id, id));
    return result.changes > 0;
  }

  // Slot Database
  async searchSlots(query: string): Promise<Slot[]> {
    const result = await db.select()
      .from(slotDatabase)
      .where(sql`name LIKE '%' || ${query} || '%'`)
      .limit(20);
    return result;
  }

  async getSlot(name: string): Promise<Slot | undefined> {
    const result = await db.select().from(slotDatabase).where(eq(slotDatabase.name, name)).limit(1);
    return result[0];
  }

  async createSlot(slot: InsertSlot): Promise<Slot> {
    const id = randomUUID();
    const newSlot = { id, ...slot };
    await db.insert(slotDatabase).values(newSlot);
    return newSlot as Slot;
  }

  async initializeSlotDatabase(csvData: string): Promise<void> {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length >= 3) {
        const slot = {
          name: row[0]?.trim(),
          provider: row[1]?.trim(),
          imageUrl: row[2]?.trim(),
          category: row[3]?.trim() || null,
        };
        
        if (slot.name && slot.provider) {
          try {
            await this.createSlot(slot);
          } catch (error) {
            // Skip duplicates or other errors
            console.log(`Skipped slot: ${slot.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }
  }

  // Meta
  async getMeta(key: string): Promise<string | undefined> {
    const result = await db.select().from(meta).where(eq(meta.key, key)).limit(1);
    return result[0]?.value ?? undefined;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await db.insert(meta)
      .values({ key, value })
      .onConflictDoUpdate({
        target: meta.key,
        set: { value },
      });
  }
}

export const storage = new SQLiteStorage();

// Initialize slot database if empty
(async () => {
  try {
    const count = await db.select().from(slotDatabase).limit(1);
    if (count.length === 0) {
      const csvPath = path.join(process.cwd(), 'public', 'slots.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        await storage.initializeSlotDatabase(csvData);
        console.log('Slot database initialized from CSV');
      }
    }
  } catch (error) {
    console.log('Slot database initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
})();
