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
  type Notice, type InsertNotice, notices
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
  getConversation(id: string): Promise<ChatConversation | undefined>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateConversationStatus(id: string, status: string): Promise<ChatConversation | undefined>;
  getMessagesByConversation(conversationId: string): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: string, senderType: string): Promise<void>;
  
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
  
  // Notices
  getAllNotices(): Promise<Notice[]>;
  getVisibleNotices(): Promise<Notice[]>;
  getNotice(id: string): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: string, notice: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: string): Promise<boolean>;
  incrementNoticeViewCount(id: string): Promise<void>;
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

  async markMessagesAsRead(conversationId: string, senderType: string): Promise<void> {
    const oppositeType = senderType === 'admin' ? 'user' : 'admin';
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(and(
        eq(chatMessages.conversationId, conversationId),
        eq(chatMessages.senderType, oppositeType)
      ));
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

  async updateNotice(id: string, updateData: Partial<InsertNotice>): Promise<Notice | undefined> {
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
}

export const storage = new DatabaseStorage();
