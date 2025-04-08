import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sport league schema
export const leagues = pgTable("leagues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  lastUpdated: timestamp("last_updated"),
});

export const insertLeagueSchema = createInsertSchema(leagues).pick({
  name: true,
  sport: true,
  category: true,
  imageUrl: true,
  lastUpdated: true,
});

// Canales de TV schema
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region"), // Region geográfica (e.g. UK, USA, Spain, etc.)
  category: text("category").default("Sports"), // Categoría del canal
  imageUrl: text("image_url"),
  lastUpdated: timestamp("last_updated"),
});

export const insertChannelSchema = createInsertSchema(channels).pick({
  name: true,
  region: true,
  category: true,
  imageUrl: true,
  lastUpdated: true,
});

// Scheduled update schema
export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertUpdateSchema = createInsertSchema(updates).pick({
  lastUpdated: true,
});

// Types
export type InsertLeague = z.infer<typeof insertLeagueSchema>;
export type League = typeof leagues.$inferSelect;

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;

export type InsertUpdate = z.infer<typeof insertUpdateSchema>;
export type Update = typeof updates.$inferSelect;

// Sport categories enum
export const SportCategories = {
  FOOTBALL: "Fútbol (Fútbol Asociación)",
  BASKETBALL: "Baloncesto",
  AMERICAN_FOOTBALL: "American Football",
  BASEBALL: "Beisbol",
  HOCKEY: "Hockey sobre Hielo",
  RUGBY: "Rugby",
  CRICKET: "Cricket",
  TENNIS: "Tenis",
  VOLLEYBALL: "Voleibol",
  HANDBALL: "Balonmano",
  MOTORSPORTS: "Motorsports",
  GOLF: "Golf",
  ATHLETICS: "Atletismo",
  ESPORTS: "Esports",
  WINTER_SPORTS: "Deportes de Invierno",
  AQUATICS: "Natación y Deportes Acuáticos",
  CYCLING: "Ciclismo",
  BOXING: "Boxeo y Artes Marciales",
  REGIONAL: "Deportes Regionales y Alternativos",
  OTHER: "Otros Deportes Relevantes",
} as const;

export type SportCategory = typeof SportCategories[keyof typeof SportCategories];
