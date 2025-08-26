import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const hunts = sqliteTable("hunts", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  title: text("title").notNull(),
  casino: text("casino").notNull(),
  currency: text("currency").notNull().default("USD"),
  startBalance: real("start_balance").notNull(),
  endBalance: real("end_balance"),
  status: text("status").notNull().default("collecting"), // collecting, opening, finished
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  isPublic: integer("is_public").notNull().default(0),
  publicToken: text("public_token"),
});

export const bonuses = sqliteTable("bonuses", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  huntId: text("hunt_id").notNull().references(() => hunts.id, { onDelete: "cascade" }),
  slotName: text("slot_name").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url"),
  betAmount: real("bet_amount").notNull(),
  multiplier: real("multiplier"),
  winAmount: real("win_amount"),
  order: integer("order").notNull(),
  status: text("status").notNull().default("waiting"), // waiting, opened
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const slotDatabase = sqliteTable("slot_database", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url"),
  category: text("category"),
});

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value"),
});

export const insertHuntSchema = createInsertSchema(hunts).omit({
  id: true,
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

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Hunt = typeof hunts.$inferSelect;
export type InsertBonus = z.infer<typeof insertBonusSchema>;
export type Bonus = typeof bonuses.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Slot = typeof slotDatabase.$inferSelect;
export type Meta = typeof meta.$inferSelect;
