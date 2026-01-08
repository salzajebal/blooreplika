import { 
  type User, type InsertUser, users,
  type Product, type InsertProduct, products,
  type Category, type InsertCategory, categories,
  type Subcategory, type InsertSubcategory, subcategories,
  type Brand, type InsertBrand, brands,
  type Member, type InsertMember, members,
  type MemberSession, type InsertMemberSession, memberSessions,
  type ChatConversation, type InsertChatConversation, chatConversations,
  type ChatMessage, type InsertChatMessage, chatMessages,
  type Faq, type InsertFaq, faqs,
  type Review, type InsertReview, reviews,
  type ReviewImage, type InsertReviewImage, reviewImages,
  type ProductImage, type InsertProductImage, productImages,
  type Notice, type InsertNotice, notices,
  type Banner, type InsertBanner, banners,
  type Popup, type InsertPopup, popups,
  type BlogPost, type InsertBlogPost, blogPosts,
  type Order, type InsertOrder, orders,
  type OrderItem, type InsertOrderItem, orderItems,
  type CouponPayment, type InsertCouponPayment, couponPayments,
  type CartItem, type InsertCartItem, cartItems,
  type WishlistItem, type InsertWishlistItem, wishlistItems,
  type Coupon, type InsertCoupon, coupons,
  type PointTransaction, type InsertPointTransaction, pointTransactions,
  type SiteSetting, type InsertSiteSetting, siteSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getAllProducts(): Promise<Product[]>;
  getProductsPaginated(limit: number, offset: number, categoryId?: string, subcategoryId?: string, search?: string): Promise<{ products: Product[], total: number }>;
  getProductsCount(categoryId?: string): Promise<number>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  deleteProductsByCategory(categoryId: string): Promise<number>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Subcategories
  getAllSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]>;
  getSubcategory(id: string): Promise<Subcategory | undefined>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined>;
  deleteSubcategory(id: string): Promise<boolean>;
  
  // Brands
  getAllBrands(): Promise<Brand[]>;
  getBrandsWithProductCount(categoryId?: string): Promise<{ brand: Brand; productCount: number }[]>;
  getBrand(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: string): Promise<boolean>;
  
  // Members
  getAllMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  getMemberByUsername(username: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  updateMemberLastLogin(id: string): Promise<void>;
  
  // Member Sessions
  getMemberSession(token: string): Promise<MemberSession | undefined>;
  createMemberSession(session: InsertMemberSession): Promise<MemberSession>;
  deleteMemberSession(token: string): Promise<boolean>;
  deleteMemberSessionsByMemberId(memberId: string): Promise<void>;
  
  // Chat
  getAllConversations(): Promise<ChatConversation[]>;
  getAllChatConversations(): Promise<ChatConversation[]>;
  getConversation(id: string): Promise<ChatConversation | undefined>;
  getConversationByMemberId(memberId: string): Promise<ChatConversation | undefined>;
  getOrCreateConversationForMember(memberId: string, memberName: string): Promise<ChatConversation>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateConversationStatus(id: string, status: string): Promise<ChatConversation | undefined>;
  updateChatConversation(id: string, data: Partial<InsertChatConversation> & { updatedAt?: Date }): Promise<ChatConversation | undefined>;
  getMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;
  getChatMessages(conversationId: string): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: string, senderType: string): Promise<void>;
  getUnreadCount(conversationId: string, senderType: string): Promise<number>;
  
  // FAQ
  getAllFaqs(): Promise<Faq[]>;
  getFaqsByCategory(category: string): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;
  
  // Reviews
  getAllReviews(): Promise<Review[]>;
  getVisibleReviews(): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;
  
  // Review Images
  getReviewImage(id: string): Promise<ReviewImage | undefined>;
  createReviewImage(image: InsertReviewImage): Promise<ReviewImage>;
  deleteReviewImage(id: string): Promise<boolean>;
  
  // Product Images
  getProductImage(id: string): Promise<ProductImage | undefined>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  deleteProductImage(id: string): Promise<boolean>;
  
  // Notices
  getAllNotices(): Promise<Notice[]>;
  getVisibleNotices(): Promise<Notice[]>;
  getNotice(id: string): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  createNoticeWithViewCount(notice: InsertNotice & { viewCount?: number }): Promise<Notice>;
  updateNotice(id: string, notice: Partial<InsertNotice> & { viewCount?: number }): Promise<Notice | undefined>;
  deleteNotice(id: string): Promise<boolean>;
  incrementNoticeViewCount(id: string): Promise<void>;
  
  // Banners
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  getBanner(id: string): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: Partial<InsertBanner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<boolean>;
  
  // Popups
  getAllPopups(): Promise<Popup[]>;
  getActivePopups(): Promise<Popup[]>;
  getPopup(id: string): Promise<Popup | undefined>;
  createPopup(popup: InsertPopup): Promise<Popup>;
  updatePopup(id: string, popup: Partial<InsertPopup>): Promise<Popup | undefined>;
  deletePopup(id: string): Promise<boolean>;
  
  // Blog Posts
  getAllBlogPosts(): Promise<BlogPost[]>;
  getVisibleBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, blogPost: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  
  // Orders
  getAllOrders(): Promise<Order[]>;
  getOrdersByMember(memberId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order Items
  getOrderItemsByOrder(orderId: string): Promise<OrderItem[]>;
  getOrderItem(id: string): Promise<OrderItem | undefined>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  deleteOrderItem(id: string): Promise<boolean>;
  
  // Coupon Payments
  getAllCouponPayments(): Promise<CouponPayment[]>;
  getCouponPaymentsByOrder(orderId: string): Promise<CouponPayment[]>;
  getCouponPayment(id: string): Promise<CouponPayment | undefined>;
  createCouponPayment(payment: InsertCouponPayment): Promise<CouponPayment>;
  updateCouponPayment(id: string, payment: Partial<InsertCouponPayment>): Promise<CouponPayment | undefined>;
  
  // Cart Items
  getCartItemsByMember(memberId: string): Promise<CartItem[]>;
  getCartItem(id: string): Promise<CartItem | undefined>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, cartItem: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  deleteCartItem(id: string): Promise<boolean>;
  clearCartByMember(memberId: string): Promise<void>;
  
  // Wishlist Items
  getWishlistItemsByMember(memberId: string): Promise<WishlistItem[]>;
  getWishlistItem(id: string): Promise<WishlistItem | undefined>;
  createWishlistItem(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  deleteWishlistItem(id: string): Promise<boolean>;
  deleteWishlistItemByMemberAndProduct(memberId: string, productId: string): Promise<boolean>;
  
  // Coupons
  getAllCoupons(): Promise<Coupon[]>;
  getActiveCoupons(): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<boolean>;
  
  // Point Transactions
  getPointTransactionsByMember(memberId: string): Promise<PointTransaction[]>;
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  
  // Member Point & Freeze Management
  updateMemberPoints(id: string, amount: number): Promise<Member | undefined>;
  freezeMember(id: string, reason: string): Promise<Member | undefined>;
  unfreezeMember(id: string): Promise<Member | undefined>;
  
  // Site Settings
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  setSiteSetting(key: string, value: string, description?: string): Promise<SiteSetting>;
  
  // Batch Price Updates
  batchUpdateAccessoryPrices(pattern: string, price: string): Promise<number>;
  fixHighAccessoryPrices(): Promise<number>;
  setDefaultAccessoryPrices(defaultPrice: string): Promise<number>;
  batchUpdateCategoryPrices(categoryId: string, pattern: string, price: string): Promise<number>;
  fixHighCategoryPrices(categoryId: string): Promise<number>;
  setDefaultCategoryPrices(categoryId: string, defaultPrice: string): Promise<number>;
  
  // Domestic Price Adjustment
  getDomesticProductCount(): Promise<number>;
  adjustDomesticPrices(delta: number): Promise<number>;
  
  // Genuine Product Discount
  getGenuineProductCount(): Promise<number>;
  applyGenuineDiscount(discountPercent: number): Promise<number>;
  
  // Category Discount
  getCategoryProductCount(categoryId: string): Promise<number>;
  applyCategoryDiscount(categoryId: string, discountPercent: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }
  
  async getProductsPaginated(limit: number, offset: number, categoryId?: string, subcategoryId?: string, search?: string): Promise<{ products: Product[], total: number }> {
    // Lean select for listings - only essential fields for performance
    const leanSelect = {
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      subcategoryId: products.subcategoryId,
      brandId: products.brandId,
      price: products.price,
      originalPrice: products.originalPrice,
      imageUrl: products.imageUrl,
      isBest: products.isBest,
      isNew: products.isNew,
      isSoldOut: products.isSoldOut,
      isActive: products.isActive,
      discountPercent: products.discountPercent,
      createdAt: products.createdAt,
    };
    
    // Build where conditions dynamically
    const conditions: any[] = [];
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (subcategoryId) conditions.push(eq(products.subcategoryId, subcategoryId));
    if (search) conditions.push(sql`${products.name} ILIKE ${'%' + search + '%'}`);
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Execute count and data queries in parallel for performance
    const [countResult, productList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(whereClause),
      db.select(leanSelect).from(products).where(whereClause).orderBy(desc(products.createdAt)).limit(limit).offset(offset)
    ]);
    return { products: productList as Product[], total: countResult[0]?.count || 0 };
  }
  
  async getProductsCount(categoryId?: string): Promise<number> {
    const whereClause = categoryId ? eq(products.categoryId, categoryId) : undefined;
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause);
    return Number(result?.count || 0);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async deleteProductsByCategory(categoryId: string): Promise<number> {
    const result = await db.delete(products).where(eq(products.categoryId, categoryId)).returning();
    return result.length;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Subcategories
  async getAllSubcategories(): Promise<Subcategory[]> {
    return db.select().from(subcategories).orderBy(subcategories.sortOrder);
  }

  async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
    return db.select().from(subcategories)
      .where(eq(subcategories.categoryId, categoryId))
      .orderBy(subcategories.sortOrder);
  }

  async getSubcategory(id: string): Promise<Subcategory | undefined> {
    const [subcategory] = await db.select().from(subcategories).where(eq(subcategories.id, id));
    return subcategory;
  }

  async createSubcategory(insertSubcategory: InsertSubcategory): Promise<Subcategory> {
    const [subcategory] = await db.insert(subcategories).values(insertSubcategory).returning();
    return subcategory;
  }

  async updateSubcategory(id: string, updateData: Partial<InsertSubcategory>): Promise<Subcategory | undefined> {
    const [subcategory] = await db.update(subcategories)
      .set(updateData)
      .where(eq(subcategories.id, id))
      .returning();
    return subcategory;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id)).returning();
    return result.length > 0;
  }

  // Brands
  async getAllBrands(): Promise<Brand[]> {
    return db.select().from(brands).orderBy(brands.sortOrder);
  }

  async getBrandsWithProductCount(categoryId?: string): Promise<{ brand: Brand; productCount: number }[]> {
    const allBrands = await db.select().from(brands).orderBy(brands.sortOrder);
    
    const results: { brand: Brand; productCount: number }[] = [];
    
    for (const brand of allBrands) {
      let countResult;
      if (categoryId) {
        countResult = await db.select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(sql`${products.brandId} = ${brand.id} AND ${products.categoryId} = ${categoryId}`);
      } else {
        countResult = await db.select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.brandId, brand.id));
      }
      
      const productCount = countResult[0]?.count || 0;
      if (productCount > 0) {
        results.push({ brand, productCount });
      }
    }
    
    return results.sort((a, b) => b.productCount - a.productCount);
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const [brand] = await db.insert(brands).values(insertBrand).returning();
    return brand;
  }

  async updateBrand(id: string, updateData: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [brand] = await db.update(brands)
      .set(updateData)
      .where(eq(brands.id, id))
      .returning();
    return brand;
  }

  async deleteBrand(id: string): Promise<boolean> {
    const result = await db.delete(brands).where(eq(brands.id, id)).returning();
    return result.length > 0;
  }

  // Members
  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member;
  }

  async getMemberByUsername(username: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.username, username));
    return member;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }

  async updateMember(id: string, updateData: Partial<InsertMember>): Promise<Member | undefined> {
    const [member] = await db.update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id)).returning();
    return result.length > 0;
  }

  async updateMemberLastLogin(id: string): Promise<void> {
    await db.update(members)
      .set({ lastLoginAt: new Date() })
      .where(eq(members.id, id));
  }

  // Member Sessions
  async getMemberSession(token: string): Promise<MemberSession | undefined> {
    const results = await db.select().from(memberSessions).where(eq(memberSessions.token, token));
    return results[0];
  }

  async createMemberSession(session: InsertMemberSession): Promise<MemberSession> {
    const results = await db.insert(memberSessions).values(session).returning();
    return results[0];
  }

  async deleteMemberSession(token: string): Promise<boolean> {
    const result = await db.delete(memberSessions).where(eq(memberSessions.token, token)).returning();
    return result.length > 0;
  }

  async deleteMemberSessionsByMemberId(memberId: string): Promise<void> {
    await db.delete(memberSessions).where(eq(memberSessions.memberId, memberId));
  }

  // Chat Conversations
  async getAllConversations(): Promise<ChatConversation[]> {
    return db.select().from(chatConversations).orderBy(desc(chatConversations.updatedAt));
  }

  async getConversation(id: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return conversation;
  }

  async getConversationByMemberId(memberId: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations)
      .where(eq(chatConversations.memberId, memberId))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(1);
    return conversation;
  }

  async getOrCreateConversationForMember(memberId: string, memberName: string): Promise<ChatConversation> {
    const existing = await this.getConversationByMemberId(memberId);
    if (existing) {
      return existing;
    }
    return this.createConversation({
      memberId,
      subject: `${memberName}님의 1:1 상담`,
      status: 'open',
    });
  }

  async createConversation(insertConversation: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db.insert(chatConversations).values(insertConversation).returning();
    return conversation;
  }

  async updateConversationStatus(id: string, status: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.update(chatConversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return conversation;
  }

  async updateChatConversation(id: string, data: Partial<InsertChatConversation> & { updatedAt?: Date }): Promise<ChatConversation | undefined> {
    const [conversation] = await db.update(chatConversations)
      .set(data)
      .where(eq(chatConversations.id, id))
      .returning();
    return conversation;
  }

  async getAllChatConversations(): Promise<ChatConversation[]> {
    return this.getAllConversations();
  }

  // Chat Messages
  async getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
    return db.select().from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    await db.update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, insertMessage.conversationId));
    return message;
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.getMessagesByConversation(conversationId);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    return this.createMessage(message);
  }

  async markMessagesAsRead(conversationId: string, senderType: string): Promise<void> {
    const oppositeType = senderType === 'admin' ? 'user' : 'admin';
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.senderType, oppositeType)
      ));
  }

  async getUnreadCount(conversationId: string, senderType: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.senderType, senderType),
        eq(chatMessages.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  // FAQ
  async getAllFaqs(): Promise<Faq[]> {
    return db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(faqs.sortOrder);
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    return db.select().from(faqs)
      .where(and(eq(faqs.category, category), eq(faqs.isActive, true)))
      .orderBy(faqs.sortOrder);
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const [faq] = await db.insert(faqs).values(insertFaq).returning();
    return faq;
  }

  async updateFaq(id: string, updateData: Partial<InsertFaq>): Promise<Faq | undefined> {
    const [faq] = await db.update(faqs)
      .set(updateData)
      .where(eq(faqs.id, id))
      .returning();
    return faq;
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(faqs).where(eq(faqs.id, id)).returning();
    return result.length > 0;
  }

  // Reviews
  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.displayDate));
  }

  async getVisibleReviews(): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.isVisible, true))
      .orderBy(desc(reviews.displayDate));
  }

  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async updateReview(id: string, updateData: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db.update(reviews)
      .set(updateData)
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async deleteReview(id: string): Promise<boolean> {
    const result = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    return result.length > 0;
  }

  // Review Images
  async getReviewImage(id: string): Promise<ReviewImage | undefined> {
    const [image] = await db.select().from(reviewImages).where(eq(reviewImages.id, id));
    return image;
  }

  async createReviewImage(insertImage: InsertReviewImage): Promise<ReviewImage> {
    const [image] = await db.insert(reviewImages).values(insertImage).returning();
    return image;
  }

  async deleteReviewImage(id: string): Promise<boolean> {
    const result = await db.delete(reviewImages).where(eq(reviewImages.id, id)).returning();
    return result.length > 0;
  }

  // Product Images
  async getProductImage(id: string): Promise<ProductImage | undefined> {
    const [image] = await db.select().from(productImages).where(eq(productImages.id, id));
    return image;
  }

  async createProductImage(insertImage: InsertProductImage): Promise<ProductImage> {
    const [image] = await db.insert(productImages).values(insertImage).returning();
    return image;
  }

  async deleteProductImage(id: string): Promise<boolean> {
    const result = await db.delete(productImages).where(eq(productImages.id, id)).returning();
    return result.length > 0;
  }

  // Notices
  async getAllNotices(): Promise<Notice[]> {
    return db.select().from(notices).orderBy(desc(notices.isPinned), desc(notices.displayDate));
  }

  async getVisibleNotices(): Promise<Notice[]> {
    return db.select().from(notices)
      .where(eq(notices.isVisible, true))
      .orderBy(desc(notices.isPinned), desc(notices.displayDate));
  }

  async getNotice(id: string): Promise<Notice | undefined> {
    const [notice] = await db.select().from(notices).where(eq(notices.id, id));
    return notice;
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db.insert(notices).values(insertNotice).returning();
    return notice;
  }

  async createNoticeWithViewCount(insertNotice: InsertNotice & { viewCount?: number }): Promise<Notice> {
    const [notice] = await db.insert(notices).values(insertNotice).returning();
    return notice;
  }

  async updateNotice(id: string, updateData: Partial<InsertNotice> & { viewCount?: number }): Promise<Notice | undefined> {
    const [notice] = await db.update(notices)
      .set(updateData)
      .where(eq(notices.id, id))
      .returning();
    return notice;
  }

  async deleteNotice(id: string): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id)).returning();
    return result.length > 0;
  }

  async incrementNoticeViewCount(id: string): Promise<void> {
    const notice = await this.getNotice(id);
    if (notice) {
      await db.update(notices)
        .set({ viewCount: (notice.viewCount || 0) + 1 })
        .where(eq(notices.id, id));
    }
  }

  // Banners
  async getAllBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(banners.sortOrder);
  }

  async getActiveBanners(): Promise<Banner[]> {
    return db.select().from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(banners.sortOrder);
  }

  async getBanner(id: string): Promise<Banner | undefined> {
    const [banner] = await db.select().from(banners).where(eq(banners.id, id));
    return banner;
  }

  async createBanner(insertBanner: InsertBanner): Promise<Banner> {
    const [banner] = await db.insert(banners).values(insertBanner).returning();
    return banner;
  }

  async updateBanner(id: string, updateData: Partial<InsertBanner>): Promise<Banner | undefined> {
    const [banner] = await db.update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id)).returning();
    return result.length > 0;
  }

  // Popups
  async getAllPopups(): Promise<Popup[]> {
    return db.select().from(popups).orderBy(desc(popups.createdAt));
  }

  async getActivePopups(): Promise<Popup[]> {
    return db.select().from(popups)
      .where(eq(popups.isActive, true))
      .orderBy(desc(popups.createdAt));
  }

  async getPopup(id: string): Promise<Popup | undefined> {
    const [popup] = await db.select().from(popups).where(eq(popups.id, id));
    return popup;
  }

  async createPopup(insertPopup: InsertPopup): Promise<Popup> {
    const [popup] = await db.insert(popups).values(insertPopup).returning();
    return popup;
  }

  async updatePopup(id: string, updateData: Partial<InsertPopup>): Promise<Popup | undefined> {
    const [popup] = await db.update(popups)
      .set(updateData)
      .where(eq(popups.id, id))
      .returning();
    return popup;
  }

  async deletePopup(id: string): Promise<boolean> {
    const result = await db.delete(popups).where(eq(popups.id, id)).returning();
    return result.length > 0;
  }

  // Blog Posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getVisibleBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(eq(blogPosts.isVisible, true))
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [blogPost] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return blogPost;
  }

  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db.insert(blogPosts).values(insertBlogPost).returning();
    return blogPost;
  }

  async updateBlogPost(id: string, updateData: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [blogPost] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return blogPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    return result.length > 0;
  }

  // Orders
  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByMember(memberId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.memberId, memberId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // Order Items
  async getOrderItemsByOrder(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItem(id: string): Promise<OrderItem | undefined> {
    const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return orderItem;
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id)).returning();
    return result.length > 0;
  }

  // Coupon Payments
  async getAllCouponPayments(): Promise<CouponPayment[]> {
    return db.select().from(couponPayments).orderBy(desc(couponPayments.createdAt));
  }

  async getCouponPaymentsByOrder(orderId: string): Promise<CouponPayment[]> {
    return db.select().from(couponPayments).where(eq(couponPayments.orderId, orderId));
  }

  async getCouponPayment(id: string): Promise<CouponPayment | undefined> {
    const [payment] = await db.select().from(couponPayments).where(eq(couponPayments.id, id));
    return payment;
  }

  async createCouponPayment(insertPayment: InsertCouponPayment): Promise<CouponPayment> {
    const [payment] = await db.insert(couponPayments).values(insertPayment).returning();
    return payment;
  }

  async updateCouponPayment(id: string, updateData: Partial<InsertCouponPayment>): Promise<CouponPayment | undefined> {
    const [payment] = await db.update(couponPayments)
      .set(updateData)
      .where(eq(couponPayments.id, id))
      .returning();
    return payment;
  }

  // Cart Items
  async getCartItemsByMember(memberId: string): Promise<CartItem[]> {
    return db.select().from(cartItems)
      .where(eq(cartItems.memberId, memberId))
      .orderBy(desc(cartItems.createdAt));
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const [cartItem] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return cartItem;
  }

  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db.insert(cartItems).values(insertCartItem).returning();
    return cartItem;
  }

  async updateCartItem(id: string, updateData: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const [cartItem] = await db.update(cartItems)
      .set(updateData)
      .where(eq(cartItems.id, id))
      .returning();
    return cartItem;
  }

  async deleteCartItem(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id)).returning();
    return result.length > 0;
  }

  async clearCartByMember(memberId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.memberId, memberId));
  }

  // Wishlist Items
  async getWishlistItemsByMember(memberId: string): Promise<WishlistItem[]> {
    return db.select().from(wishlistItems)
      .where(eq(wishlistItems.memberId, memberId))
      .orderBy(desc(wishlistItems.createdAt));
  }

  async getWishlistItem(id: string): Promise<WishlistItem | undefined> {
    const [wishlistItem] = await db.select().from(wishlistItems).where(eq(wishlistItems.id, id));
    return wishlistItem;
  }

  async createWishlistItem(insertWishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const [wishlistItem] = await db.insert(wishlistItems).values(insertWishlistItem).returning();
    return wishlistItem;
  }

  async deleteWishlistItem(id: string): Promise<boolean> {
    const result = await db.delete(wishlistItems).where(eq(wishlistItems.id, id)).returning();
    return result.length > 0;
  }

  async deleteWishlistItemByMemberAndProduct(memberId: string, productId: string): Promise<boolean> {
    const result = await db.delete(wishlistItems)
      .where(and(
        eq(wishlistItems.memberId, memberId),
        eq(wishlistItems.productId, productId)
      ))
      .returning();
    return result.length > 0;
  }

  // Coupons
  async getAllCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getActiveCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons)
      .where(eq(coupons.isActive, true))
      .orderBy(desc(coupons.createdAt));
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code));
    return coupon;
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values(insertCoupon).returning();
    return coupon;
  }

  async updateCoupon(id: string, updateData: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [coupon] = await db.update(coupons)
      .set(updateData)
      .where(eq(coupons.id, id))
      .returning();
    return coupon;
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id)).returning();
    return result.length > 0;
  }

  // Point Transactions
  async getPointTransactionsByMember(memberId: string): Promise<PointTransaction[]> {
    return db.select().from(pointTransactions)
      .where(eq(pointTransactions.memberId, memberId))
      .orderBy(desc(pointTransactions.createdAt));
  }

  async createPointTransaction(insertTransaction: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db.insert(pointTransactions).values(insertTransaction).returning();
    return transaction;
  }

  // Member Point & Freeze Management
  async updateMemberPoints(id: string, amount: number): Promise<Member | undefined> {
    const member = await this.getMember(id);
    if (!member) return undefined;

    const newBalance = (member.pointBalance || 0) + amount;
    
    const [updated] = await db.update(members)
      .set({ pointBalance: newBalance })
      .where(eq(members.id, id))
      .returning();

    await db.insert(pointTransactions).values({
      memberId: id,
      type: "manual_adjustment",
      amount: amount,
      balanceAfter: newBalance,
      description: amount >= 0 ? `관리자 포인트 지급: ${amount.toLocaleString()}원` : `관리자 포인트 차감: ${Math.abs(amount).toLocaleString()}원`,
    });

    return updated;
  }

  async freezeMember(id: string, reason: string): Promise<Member | undefined> {
    const [member] = await db.update(members)
      .set({ 
        isFrozen: true, 
        frozenAt: new Date(),
        frozenReason: reason 
      })
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  async unfreezeMember(id: string): Promise<Member | undefined> {
    const [member] = await db.update(members)
      .set({ 
        isFrozen: false, 
        frozenAt: null,
        frozenReason: null 
      })
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  // Site Settings
  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async setSiteSetting(key: string, value: string, description?: string): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(key);
    
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    } else {
      const [setting] = await db.insert(siteSettings)
        .values({ key, value, description })
        .returning();
      return setting;
    }
  }

  // Batch Price Updates - using direct SQL for speed
  async batchUpdateAccessoryPrices(pattern: string, price: string): Promise<number> {
    const result = await db.execute(sql`
      UPDATE products 
      SET price = ${price}
      WHERE category_id = 'accessories' 
      AND name LIKE ${pattern}
    `);
    return Number(result.rowCount) || 0;
  }

  async fixHighAccessoryPrices(): Promise<number> {
    // Fix prices over 5 million by dividing by 100
    const result1 = await db.execute(sql`
      UPDATE products 
      SET price = (CAST(price AS INTEGER) / 100)::TEXT
      WHERE category_id = 'accessories' 
      AND CAST(price AS INTEGER) > 5000000
    `);
    
    // Fix prices over 1.5 million by dividing by 10
    const result2 = await db.execute(sql`
      UPDATE products 
      SET price = (CAST(price AS INTEGER) / 10)::TEXT
      WHERE category_id = 'accessories' 
      AND CAST(price AS INTEGER) > 1500000
    `);
    
    return (Number(result1.rowCount) || 0) + (Number(result2.rowCount) || 0);
  }

  async setDefaultAccessoryPrices(defaultPrice: string): Promise<number> {
    // Set default price for any accessories that still have unreasonable prices
    // (either 0, empty, or prices outside a reasonable range like 50K-500K)
    const result = await db.execute(sql`
      UPDATE products 
      SET price = ${defaultPrice}
      WHERE category_id = 'accessories' 
      AND (
        price IS NULL 
        OR price = '' 
        OR price = '0'
        OR CAST(NULLIF(price, '') AS INTEGER) < 50000
        OR CAST(NULLIF(price, '') AS INTEGER) > 500000
      )
    `);
    return Number(result.rowCount) || 0;
  }

  async batchUpdateCategoryPrices(categoryId: string, pattern: string, price: string): Promise<number> {
    const result = await db.execute(sql`
      UPDATE products 
      SET price = ${price}
      WHERE category_id = ${categoryId}
      AND name LIKE ${pattern}
    `);
    return Number(result.rowCount) || 0;
  }

  async fixHighCategoryPrices(categoryId: string): Promise<number> {
    // Fix prices over 5 million by dividing by 100
    const result1 = await db.execute(sql`
      UPDATE products 
      SET price = (CAST(price AS INTEGER) / 100)::TEXT
      WHERE category_id = ${categoryId}
      AND CAST(price AS INTEGER) > 5000000
    `);
    
    // Fix prices over 1.5 million by dividing by 10
    const result2 = await db.execute(sql`
      UPDATE products 
      SET price = (CAST(price AS INTEGER) / 10)::TEXT
      WHERE category_id = ${categoryId}
      AND CAST(price AS INTEGER) > 1500000
    `);
    
    return (Number(result1.rowCount) || 0) + (Number(result2.rowCount) || 0);
  }

  async setDefaultCategoryPrices(categoryId: string, defaultPrice: string): Promise<number> {
    const result = await db.execute(sql`
      UPDATE products 
      SET price = ${defaultPrice}
      WHERE category_id = ${categoryId}
      AND (
        price IS NULL 
        OR price = '' 
        OR price = '0'
        OR CAST(NULLIF(price, '') AS INTEGER) < 50000
        OR CAST(NULLIF(price, '') AS INTEGER) > 700000
      )
    `);
    return Number(result.rowCount) || 0;
  }

  // Domestic Price Adjustment
  async getDomesticProductCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, 'domestic'));
    return result?.count || 0;
  }

  async adjustDomesticPrices(delta: number): Promise<number> {
    const result = await db.execute(sql`
      UPDATE products 
      SET price = (CAST(NULLIF(price, '') AS INTEGER) + ${delta})::TEXT
      WHERE category_id = 'domestic'
      AND price IS NOT NULL 
      AND price != ''
    `);
    return Number(result.rowCount) || 0;
  }

  // Genuine Product Discount
  async getGenuineProductCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, 'genuine'));
    return result?.count || 0;
  }

  async applyGenuineDiscount(discountPercent: number): Promise<number> {
    const multiplier = (100 - discountPercent) / 100;
    const result = await db.execute(sql`
      UPDATE products 
      SET price = ROUND(CAST(NULLIF(price, '') AS NUMERIC) * ${multiplier})::TEXT
      WHERE category_id = 'genuine'
      AND price IS NOT NULL 
      AND price != ''
    `);
    return Number(result.rowCount) || 0;
  }

  // Category Discount
  async getCategoryProductCount(categoryId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    return result?.count || 0;
  }

  async applyCategoryDiscount(categoryId: string, discountPercent: number): Promise<number> {
    const result = await db.execute(sql`
      UPDATE products 
      SET discount_percent = ${discountPercent}
      WHERE category_id = ${categoryId}
    `);
    return Number(result.rowCount) || 0;
  }
}

export const storage = new DatabaseStorage();
