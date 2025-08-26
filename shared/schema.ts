import { sql } from "drizzle-orm";
import { pgTable, text, integer, decimal, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const hunts = pgTable("hunts", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminKey: text("admin_key").notNull(), // Each hunt belongs to an admin key
  title: text("title").notNull(),
  casino: text("casino").notNull(),
  currency: text("currency").notNull().default("USD"),
  startBalance: decimal("start_balance", { precision: 10, scale: 2 }).notNull(),
  endBalance: decimal("end_balance", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("collecting"), // collecting, opening, finished
  notes: text("notes"),
  isPublic: boolean("is_public").notNull().default(true), // Public by default for live hunts
  publicToken: text("public_token"),
  isLive: boolean("is_live").notNull().default(false), // Live streaming feature
  isPlaying: boolean("is_playing").default(false),
  currentSlotIndex: integer("current_slot_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bonuses = pgTable("bonuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  huntId: uuid("hunt_id").notNull().references(() => hunts.id, { onDelete: "cascade" }),
  slotName: text("slot_name").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url"),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }),
  winAmount: decimal("win_amount", { precision: 10, scale: 2 }),
  order: integer("order").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, opened
  isPlayed: boolean("is_played").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const slotDatabase = pgTable("slot_database", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
});

export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: text("value"),
});

// Admin authentication tables
export const adminKeys = pgTable("admin_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyName: text("key_name").notNull().unique(), // e.g., "admin1", "admin2", "streamer1"
  keyValue: text("key_value").notNull().unique(), // The actual admin key
  displayName: text("display_name").notNull(), // e.g., "Main Admin", "Streamer Account"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminKeyId: uuid("admin_key_id").notNull().references(() => adminKeys.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHuntSchema = createInsertSchema(hunts).omit({
  id: true,
  adminKey: true,
  createdAt: true,
  updatedAt: true,
  publicToken: true,
});

export const insertBonusSchema = createInsertSchema(bonuses).omit({
  id: true,
  createdAt: true,
});

export const insertSlotSchema = createInsertSchema(slotDatabase).omit({
  id: true,
});

export const insertAdminKeySchema = createInsertSchema(adminKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const payoutSchema = z.object({
  winAmount: z.number().min(0),
});

export const adminLoginSchema = z.object({
  adminKey: z.string().min(1),
});

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Hunt = typeof hunts.$inferSelect;
export type HuntWithBonusCount = Hunt & { bonusCount: number };
export type HuntWithAdmin = Hunt & { adminDisplayName: string };
export type InsertBonus = z.infer<typeof insertBonusSchema>;
export type Bonus = typeof bonuses.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Slot = typeof slotDatabase.$inferSelect;
export type InsertAdminKey = z.infer<typeof insertAdminKeySchema>;
export type AdminKey = typeof adminKeys.$inferSelect;
export type Meta = typeof meta.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
export type PayoutInput = z.infer<typeof payoutSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
