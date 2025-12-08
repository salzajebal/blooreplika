import { 
  type User, type InsertUser, users,
  type Product, type InsertProduct, products,
  type Category, type InsertCategory, categories,
  type GoldPrice, type InsertGoldPrice, goldPrices,
  type Member, type InsertMember, members,
  type ChatConversation, type InsertChatConversation, chatConversations,
  type ChatMessage, type InsertChatMessage, chatMessages,
  type Faq, type InsertFaq, faqs,
  type Review, type InsertReview, reviews,
  type ReviewImage, type InsertReviewImage, reviewImages,
  type ProductImage, type InsertProductImage, productImages,
  type Notice, type InsertNotice, notices,
  type DepositRequest, type InsertDepositRequest, depositRequests,
  type WithdrawalRequest, type InsertWithdrawalRequest, withdrawalRequests,
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
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  
  // Gold Prices
  getGoldPrices(): Promise<GoldPrice[]>;
  updateGoldPrice(metalType: string, data: Omit<InsertGoldPrice, 'metalType'>): Promise<GoldPrice>;
  
  // Members
  getAllMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  updateMemberLastLogin(id: string): Promise<void>;
  
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
  updateNotice(id: string, notice: Partial<InsertNotice> & { viewCount?: number }): Promise<Notice | undefined>;
  deleteNotice(id: string): Promise<boolean>;
  incrementNoticeViewCount(id: string): Promise<void>;
  
  // Deposit Requests
  getAllDepositRequests(): Promise<DepositRequest[]>;
  getPendingDepositRequests(): Promise<DepositRequest[]>;
  getDepositRequestsByMember(memberId: string): Promise<DepositRequest[]>;
  getDepositRequest(id: string): Promise<DepositRequest | undefined>;
  createDepositRequest(request: InsertDepositRequest): Promise<DepositRequest>;
  approveDepositRequest(id: string, adminNote?: string): Promise<DepositRequest | undefined>;
  rejectDepositRequest(id: string, adminNote?: string): Promise<DepositRequest | undefined>;
  
  // Withdrawal Requests
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getWithdrawalRequestsByMember(memberId: string): Promise<WithdrawalRequest[]>;
  getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  approveWithdrawalRequest(id: string, adminNote?: string): Promise<WithdrawalRequest | undefined>;
  rejectWithdrawalRequest(id: string, adminNote?: string): Promise<WithdrawalRequest | undefined>;
  
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

  async getProductsByCategory(category: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.category, category)).orderBy(desc(products.createdAt));
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

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
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

  // Gold Prices
  async getGoldPrices(): Promise<GoldPrice[]> {
    return db.select().from(goldPrices);
  }

  async updateGoldPrice(metalType: string, data: Omit<InsertGoldPrice, 'metalType'>): Promise<GoldPrice> {
    const [existing] = await db.select().from(goldPrices).where(eq(goldPrices.metalType, metalType));
    
    if (existing) {
      const [updated] = await db.update(goldPrices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(goldPrices.metalType, metalType))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(goldPrices)
        .values({ metalType, ...data })
        .returning();
      return created;
    }
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
    return db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(faqs.order);
  }

  async getFaqsByCategory(category: string): Promise<Faq[]> {
    return db.select().from(faqs)
      .where(and(eq(faqs.category, category), eq(faqs.isActive, true)))
      .orderBy(faqs.order);
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

  // Deposit Requests
  async getAllDepositRequests(): Promise<DepositRequest[]> {
    return db.select().from(depositRequests).orderBy(desc(depositRequests.requestedAt));
  }

  async getPendingDepositRequests(): Promise<DepositRequest[]> {
    return db.select().from(depositRequests)
      .where(eq(depositRequests.status, "pending"))
      .orderBy(desc(depositRequests.requestedAt));
  }

  async getDepositRequestsByMember(memberId: string): Promise<DepositRequest[]> {
    return db.select().from(depositRequests)
      .where(eq(depositRequests.memberId, memberId))
      .orderBy(desc(depositRequests.requestedAt));
  }

  async getDepositRequest(id: string): Promise<DepositRequest | undefined> {
    const [request] = await db.select().from(depositRequests).where(eq(depositRequests.id, id));
    return request;
  }

  async createDepositRequest(insertRequest: InsertDepositRequest): Promise<DepositRequest> {
    const [request] = await db.insert(depositRequests).values(insertRequest).returning();
    return request;
  }

  async approveDepositRequest(id: string, adminNote?: string): Promise<DepositRequest | undefined> {
    const request = await this.getDepositRequest(id);
    if (!request || request.status !== "pending") return undefined;

    const member = await this.getMember(request.memberId);
    if (!member) return undefined;

    const newBalance = (member.pointBalance || 0) + request.amount;

    await db.update(members)
      .set({ pointBalance: newBalance })
      .where(eq(members.id, request.memberId));

    await db.insert(pointTransactions).values({
      memberId: request.memberId,
      type: "deposit_approved",
      amount: request.amount,
      balanceAfter: newBalance,
      description: `입금 승인: ${request.amount.toLocaleString()}원`,
      relatedId: id,
    });

    const [updated] = await db.update(depositRequests)
      .set({ 
        status: "approved", 
        adminNote,
        processedAt: new Date() 
      })
      .where(eq(depositRequests.id, id))
      .returning();
    
    return updated;
  }

  async rejectDepositRequest(id: string, adminNote?: string): Promise<DepositRequest | undefined> {
    const request = await this.getDepositRequest(id);
    if (!request || request.status !== "pending") return undefined;

    const [updated] = await db.update(depositRequests)
      .set({ 
        status: "rejected", 
        adminNote,
        processedAt: new Date() 
      })
      .where(eq(depositRequests.id, id))
      .returning();
    
    return updated;
  }

  // Withdrawal Requests
  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, "pending"))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getWithdrawalRequestsByMember(memberId: string): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.memberId, memberId))
      .orderBy(desc(withdrawalRequests.requestedAt));
  }

  async getWithdrawalRequest(id: string): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id));
    return request;
  }

  async createWithdrawalRequest(insertRequest: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [request] = await db.insert(withdrawalRequests).values(insertRequest).returning();
    return request;
  }

  async approveWithdrawalRequest(id: string, adminNote?: string): Promise<WithdrawalRequest | undefined> {
    const request = await this.getWithdrawalRequest(id);
    if (!request || request.status !== "pending") return undefined;

    const member = await this.getMember(request.memberId);
    if (!member) return undefined;

    const currentBalance = member.pointBalance || 0;
    if (currentBalance < request.amount) return undefined;

    const updatedMember = await this.updateMemberPoints(request.memberId, -request.amount);
    if (!updatedMember) return undefined;

    const newBalance = updatedMember.pointBalance || 0;

    await this.createPointTransaction({
      memberId: request.memberId,
      type: "withdrawal_approved",
      amount: -request.amount,
      balanceAfter: newBalance,
      description: `출금 승인: ${request.amount.toLocaleString()}원`,
      relatedId: id,
      createdBy: "admin"
    });

    const [updated] = await db.update(withdrawalRequests)
      .set({ 
        status: "approved", 
        adminNote,
        processedAt: new Date() 
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    return updated;
  }

  async rejectWithdrawalRequest(id: string, adminNote?: string): Promise<WithdrawalRequest | undefined> {
    const request = await this.getWithdrawalRequest(id);
    if (!request || request.status !== "pending") return undefined;

    const [updated] = await db.update(withdrawalRequests)
      .set({ 
        status: "rejected", 
        adminNote,
        processedAt: new Date() 
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    
    return updated;
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
}

export const storage = new DatabaseStorage();
