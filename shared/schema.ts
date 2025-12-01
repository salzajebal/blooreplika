import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Members table (site users/customers)
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  weight: text("weight").notNull(),
  purity: text("purity").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  isBest: boolean("is_best").default(false),
  isNew: boolean("is_new").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  count: integer("count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories);

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Gold prices cache table
export const goldPrices = pgTable("gold_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metalType: text("metal_type").notNull(), // gold, silver, platinum
  buyPrice: text("buy_price").notNull(),
  sellPrice: text("sell_price").notNull(),
  trend: text("trend").notNull(), // up, down, steady
  change: text("change").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoldPriceSchema = createInsertSchema(goldPrices).omit({
  id: true,
  updatedAt: true,
});

export type InsertGoldPrice = z.infer<typeof insertGoldPriceSchema>;
export type GoldPrice = typeof goldPrices.$inferSelect;
