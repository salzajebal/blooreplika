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
  address: text("address"),
  bank: text("bank"),
  accountNumber: text("account_number"),
  isActive: boolean("is_active").default(true),
  isAdmin: boolean("is_admin").default(false),
  isFrozen: boolean("is_frozen").default(false),
  pointBalance: integer("point_balance").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  frozenAt: timestamp("frozen_at"),
  frozenReason: text("frozen_reason"),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  frozenAt: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Deposit requests table (point charging requests)
export const depositRequests = pgTable("deposit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: text("member_name").notNull(),
  memberEmail: text("member_email").notNull(),
  amount: integer("amount").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number"),
  depositorName: text("depositor_name").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  adminNote: text("admin_note"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by"),
});

export const insertDepositRequestSchema = createInsertSchema(depositRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  processedBy: true,
});

export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type DepositRequest = typeof depositRequests.$inferSelect;

// Withdrawal requests table (point withdrawal requests)
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  memberName: text("member_name").notNull(),
  memberEmail: text("member_email").notNull(),
  amount: integer("amount").notNull(),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountHolder: text("account_holder"),
  status: text("status").default("pending"), // pending, approved, rejected
  adminNote: text("admin_note"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by"),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  processedBy: true,
});

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// Point transactions table (audit log for point changes)
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  type: text("type").notNull(), // deposit_approved, manual_adjustment, purchase
  amount: integer("amount").notNull(), // positive or negative
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  relatedId: varchar("related_id"), // deposit request id, order id, etc.
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"), // admin id if applicable
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  weight: text("weight").notNull(),
  purity: text("purity").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array().default([]),
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

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id"),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  subject: text("subject").notNull(),
  status: text("status").default("open"), // open, closed, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderType: text("sender_type").notNull(), // user, admin
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// FAQ table
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// Reviews table (customer reviews - admin can manipulate all fields)
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorName: text("author_name").notNull(),
  productId: varchar("product_id"),
  productName: text("product_name"),
  rating: integer("rating").default(5),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  displayDate: timestamp("display_date").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  displayDate: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Review Images table (stores images in database for persistence)
export const reviewImages = pgTable("review_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull(), // Base64 encoded image data
  mimeType: text("mime_type").notNull(),
  originalName: text("original_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewImageSchema = createInsertSchema(reviewImages).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewImage = z.infer<typeof insertReviewImageSchema>;
export type ReviewImage = typeof reviewImages.$inferSelect;

// Product Images table (stores product images in database for persistence)
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull(), // Base64 encoded image data
  mimeType: text("mime_type").notNull(),
  originalName: text("original_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

// Notices table (announcements)
export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  isPinned: boolean("is_pinned").default(false),
  isVisible: boolean("is_visible").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  displayDate: timestamp("display_date").defaultNow(),
});

export const insertNoticeSchema = createInsertSchema(notices, {
  displayDate: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
}).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export const updateNoticeSchema = createInsertSchema(notices, {
  displayDate: z.union([z.string(), z.date()]).optional().transform(val => val ? new Date(val) : undefined),
  viewCount: z.number().optional(),
}).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type UpdateNotice = z.infer<typeof updateNoticeSchema>;
export type Notice = typeof notices.$inferSelect;

// Site settings table (key-value store for site configuration)
export const siteSettings = pgTable("site_settings", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings);

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
