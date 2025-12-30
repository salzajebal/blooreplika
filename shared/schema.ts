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
  addressDetail: text("address_detail"),
  zipcode: text("zipcode"),
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

// Member sessions table (persistent login sessions)
export const memberSessions = pgTable("member_sessions", {
  token: varchar("token").primaryKey(),
  memberId: varchar("member_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const insertMemberSessionSchema = createInsertSchema(memberSessions);

export type InsertMemberSession = z.infer<typeof insertMemberSessionSchema>;
export type MemberSession = typeof memberSessions.$inferSelect;

// Categories table (main categories: 아우터, 패딩, 상의, 하의, 신발, 악세사리, 지갑, 가방, 시계, 정품)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertCategorySchema = createInsertSchema(categories);

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Subcategories table (gender-based or type-based: 여성용, 남성용, etc.)
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
});

export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type Subcategory = typeof subcategories.$inferSelect;

// Brands table (luxury brands: 구찌, 루이비통, 샤넬, 에르메스, etc.)
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
});

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

// Products table (luxury products)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku"),
  categoryId: varchar("category_id"),
  subcategoryId: varchar("subcategory_id"),
  brandId: varchar("brand_id"),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  description: text("description"),
  detailContent: text("detail_content"),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array().default([]),
  detailImageUrls: text("detail_image_urls").array().default([]),
  options: text("options"),
  stock: integer("stock").default(0),
  isBest: boolean("is_best").default(false),
  isNew: boolean("is_new").default(false),
  isSoldOut: boolean("is_sold_out").default(false),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  reviewCount: integer("review_count").default(0),
  avgRating: decimal("avg_rating", { precision: 2, scale: 1 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  reviewCount: true,
  avgRating: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Product Images table
export const productImages = pgTable("product_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull(),
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

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  memberId: varchar("member_id"),
  memberName: text("member_name").notNull(),
  memberEmail: text("member_email").notNull(),
  memberPhone: text("member_phone").notNull(),
  shippingName: text("shipping_name").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingAddressDetail: text("shipping_address_detail"),
  shippingZipcode: text("shipping_zipcode"),
  shippingMemo: text("shipping_memo"),
  totalAmount: integer("total_amount").notNull(),
  discountAmount: integer("discount_amount").default(0),
  shippingFee: integer("shipping_fee").default(0),
  paymentMethod: text("payment_method"),
  status: text("status").default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  trackingNumber: text("tracking_number"),
  shippingCompany: text("shipping_company"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  productOption: text("product_option"),
  price: integer("price").notNull(),
  quantity: integer("quantity").default(1),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Coupon Payments table (stores coupon payment details for orders)
export const couponPayments = pgTable("coupon_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  orderNumber: text("order_number").notNull(),
  couponNumber: text("coupon_number").notNull(),
  couponExpiry: text("coupon_expiry"),
  couponBirthDate: text("coupon_birth_date"),
  couponPassword: text("coupon_password"),
  memberName: text("member_name"),
  memberPhone: text("member_phone"),
  amount: integer("amount"),
  status: text("status").default("pending"),
  checkedAt: timestamp("checked_at"),
  checkedBy: text("checked_by"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponPaymentSchema = createInsertSchema(couponPayments).omit({
  id: true,
  createdAt: true,
  checkedAt: true,
});

export type InsertCouponPayment = z.infer<typeof insertCouponPaymentSchema>;
export type CouponPayment = typeof couponPayments.$inferSelect;

// Cart table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  productId: varchar("product_id").notNull(),
  productOption: text("product_option"),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Wishlist table
export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  productId: varchar("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
});

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id"),
  authorName: text("author_name").notNull(),
  productId: varchar("product_id"),
  productName: text("product_name"),
  orderId: varchar("order_id"),
  rating: integer("rating").default(5),
  title: text("title"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array().default([]),
  isBest: boolean("is_best").default(false),
  isVisible: boolean("is_visible").default(true),
  pointAwarded: integer("point_awarded").default(0),
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

// Review Images table
export const reviewImages = pgTable("review_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull(),
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

// Notices table
export const notices = pgTable("notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  imageUrl: text("image_url"),
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

// Banners table (homepage sliders and banners)
export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  position: text("position").default("main"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

// Popups table
export const popups = pgTable("popups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPopupSchema = createInsertSchema(popups).omit({
  id: true,
  createdAt: true,
});

export type InsertPopup = z.infer<typeof insertPopupSchema>;
export type Popup = typeof popups.$inferSelect;

// Blog posts table (청담동초이스, 블로그)
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("blog"),
  imageUrl: text("image_url"),
  isVisible: boolean("is_visible").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// FAQ table
export const faqs = pgTable("faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

// Point transactions table
export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  relatedId: varchar("related_id"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;

// Coupons table
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  minOrderAmount: integer("min_order_amount").default(0),
  maxDiscountAmount: integer("max_discount_amount"),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id"),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  subject: text("subject").notNull(),
  status: text("status").default("open"),
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
  senderType: text("sender_type").notNull(),
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

// Site settings table
export const siteSettings = pgTable("site_settings", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings);

export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
