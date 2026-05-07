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
  type SiteSetting, type InsertSiteSetting, siteSettings,
  type VisitorSession, type InsertVisitorSession, visitorSessions,
  type PageView, type InsertPageView, pageViews,
  type Inspection, type InsertInspection, inspections,
  type ShippingPhoto, type InsertShippingPhoto, shippingPhotos,
  type ContentSection, type InsertContentSection, contentSections,
  type Magazine, type InsertMagazine, magazines,
  type LabsBlock, type InsertLabsBlock, labsBlocks,
  type QuickMenuItem, type InsertQuickMenuItem, quickMenuItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
  // Products
  getAllProducts(): Promise<Product[]>;
  getProductsPaginated(limit: number, offset: number, categoryId?: string, subcategoryId?: string, search?: string, brandId?: string, gender?: string, month?: string, subname?: string, filterCategory?: string): Promise<{ products: Product[], total: number }>;
  getProductsFullPaginated(limit: number, offset: number, categoryId?: string): Promise<{ products: Product[], total: number }>;
  getProductsCount(categoryId?: string): Promise<number>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  deleteProductsByCategory(categoryId: string): Promise<number>;
  getExistingProductNamesBySubcategory(subcategoryId: string): Promise<Set<string>>;
  deleteProductsBySubcategoryIds(subcategoryIds: string[]): Promise<number>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Subcategories
  getAllSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategoryId(categoryId: string, gender?: string): Promise<Subcategory[]>;
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
  getMembersCount(): Promise<number>;
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
  getReviewsPaginated(limit: number, offset: number): Promise<{ reviews: Review[]; total: number }>;
  clearBluestoreReviewContent(): Promise<number>;
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
  
  // Quick Menu Items
  getAllQuickMenuItems(): Promise<QuickMenuItem[]>;
  getActiveQuickMenuItems(): Promise<QuickMenuItem[]>;
  getQuickMenuItem(id: string): Promise<QuickMenuItem | undefined>;
  createQuickMenuItem(item: InsertQuickMenuItem): Promise<QuickMenuItem>;
  updateQuickMenuItem(id: string, item: Partial<InsertQuickMenuItem>): Promise<QuickMenuItem | undefined>;
  deleteQuickMenuItem(id: string): Promise<boolean>;

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
  updateOrderByNumber(orderNumber: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order Items
  getOrderItemsByOrder(orderId: string): Promise<OrderItem[]>;
  getOrderItem(id: string): Promise<OrderItem | undefined>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  deleteOrderItem(id: string): Promise<boolean>;
  hasMemberOrderedProduct(memberId: string, productId: string): Promise<boolean>;
  
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
  batchUpdateCategoryPrices(categoryId: string, pattern: string, price: string): Promise<number>;
  fixHighCategoryPrices(categoryId: string): Promise<number>;
  setDefaultCategoryPrices(categoryId: string, defaultPrice: string): Promise<number>;
  
  // Category Discount
  getCategoryProductCount(categoryId: string): Promise<number>;
  applyCategoryDiscount(categoryId: string, discountPercent: number): Promise<number>;
  
  // Inspections
  getAllInspections(): Promise<Inspection[]>;
  getActiveInspections(category?: string): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: string, inspection: Partial<InsertInspection>): Promise<Inspection | undefined>;
  deleteInspection(id: string): Promise<boolean>;

  // Shipping Photos
  getAllShippingPhotos(): Promise<ShippingPhoto[]>;
  getActiveShippingPhotos(category?: string): Promise<ShippingPhoto[]>;
  getShippingPhoto(id: string): Promise<ShippingPhoto | undefined>;
  createShippingPhoto(photo: InsertShippingPhoto): Promise<ShippingPhoto>;
  updateShippingPhoto(id: string, photo: Partial<InsertShippingPhoto>): Promise<ShippingPhoto | undefined>;
  deleteShippingPhoto(id: string): Promise<boolean>;

  // Content Sections
  getContentSections(sectionType?: string): Promise<ContentSection[]>;
  getActiveContentSections(sectionType: string): Promise<ContentSection[]>;
  getContentSection(id: string): Promise<ContentSection | undefined>;
  createContentSection(data: InsertContentSection): Promise<ContentSection>;
  updateContentSection(id: string, data: Partial<InsertContentSection>): Promise<ContentSection | undefined>;
  deleteContentSection(id: string): Promise<boolean>;
  reorderContentSections(orders: { id: string; sortOrder: number }[]): Promise<void>;

  // Magazines
  getMagazines(category?: string): Promise<Magazine[]>;
  getActiveMagazines(category?: string): Promise<Magazine[]>;
  getMagazine(id: string): Promise<Magazine | undefined>;
  createMagazine(data: InsertMagazine): Promise<Magazine>;
  updateMagazine(id: string, data: Partial<InsertMagazine>): Promise<Magazine | undefined>;
  deleteMagazine(id: string): Promise<boolean>;

  // Labs Blocks
  getLabsBlocks(): Promise<LabsBlock[]>;
  getActiveLabsBlocks(): Promise<LabsBlock[]>;
  getLabsBlock(id: string): Promise<LabsBlock | undefined>;
  createLabsBlock(data: InsertLabsBlock): Promise<LabsBlock>;
  updateLabsBlock(id: string, data: Partial<InsertLabsBlock>): Promise<LabsBlock | undefined>;
  deleteLabsBlock(id: string): Promise<boolean>;

  getProductCountWithCategories(): Promise<{ total: number; byCategory: { categoryId: string; count: number }[] }>;

  // Visitor Tracking
  trackVisitor(session: InsertVisitorSession): Promise<VisitorSession>;
  updateVisitorActivity(sessionId: string, page?: string): Promise<void>;
  trackPageView(pageView: InsertPageView): Promise<PageView>;
  getActiveVisitors(minutesAgo?: number): Promise<number>;
  getTodayVisitors(): Promise<number>;
  getTodayPageViews(): Promise<number>;
  getVisitorStats(): Promise<{ realtime: number; today: number; pageViews: number; recentPages: { page: string; count: number }[] }>;
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

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }
  
  async getProductsPaginated(limit: number, offset: number, categoryId?: string, subcategoryId?: string, search?: string, brandId?: string, gender?: string, month?: string, subname?: string, filterCategory?: string): Promise<{ products: Product[], total: number }> {
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
      isSameDay: products.isSameDay,
      isActive: products.isActive,
      discountPercent: products.discountPercent,
      sourceIdx: products.sourceIdx,
      createdAt: products.createdAt,
    };
    
    const conditions: any[] = [];
    if (categoryId) {
      if (categoryId === 'new-arrivals') {
        conditions.push(eq(products.isNew, true));
      } else if (categoryId === 'best') {
        conditions.push(eq(products.isBest, true));
      } else if (categoryId === 'sale' || categoryId === 'discount') {
        conditions.push(sql`${products.discountPercent} > 0`);
      } else if (categoryId === 'sameday') {
        conditions.push(eq(products.isSameDay, true));
      } else if (categoryId === 'new') {
        conditions.push(eq(products.isNew, true));
      } else if (categoryId === 'men') {
        conditions.push(eq(products.categoryId, 'men'));
      } else if (categoryId === 'women') {
        conditions.push(eq(products.categoryId, 'women'));
      } else if (categoryId === 'golf') {
        conditions.push(eq(products.gender, '골프'));
      } else {
        conditions.push(eq(products.categoryId, categoryId));
      }
    }
    if (subcategoryId) conditions.push(sql`${products.subcategoryId} LIKE ${subcategoryId + '%'}`);
    if (search) conditions.push(sql`${products.name} ILIKE ${'%' + search + '%'}`);
    if (brandId) conditions.push(eq(products.brandId, brandId));
    
    if (gender) {
      // 시계 카테고리: bloostore 상품은 gender/subcategoryId 미설정(null) → 공용 취급
      const isWatches = categoryId === 'watches';
      if (gender === '남성') {
        conditions.push(sql`(
          (
            ${products.subcategoryId} LIKE 'b0%'
            OR ${products.subcategoryId} LIKE '701%'
            OR ${products.gender} = '남성' OR ${products.gender} = '공용'
            OR (${products.gender} IS NULL AND (
              ${products.name} ILIKE '%남성%' OR ${products.name} ILIKE '%[남성]%'
              OR (${products.name} ~* '\\mMens?\\M' AND ${products.name} !~* '\\mWomens?\\M')
              OR (${products.name} ~* '\\mMen''s\\M' AND ${products.name} !~* '\\mWomen''s\\M')
              OR ${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%[공용]%'
              OR ${products.name} ILIKE '%Unisex%'
              OR ${isWatches ? sql`(${products.subcategoryId} IS NULL)` : sql`FALSE`}
            ))
          )
          AND NOT (
            (
              ${products.name} ILIKE '%여성용%' OR ${products.name} ILIKE '%[여성]%'
              OR (${products.name} ~* '\\mWomens?\\M' AND ${products.name} !~* '\\mMens?\\M')
              OR (${products.name} ~* '\\mWomen''s\\M' AND ${products.name} !~* '\\mMen''s\\M')
              OR ${products.name} ILIKE '%ladies%'
            )
            AND NOT (${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%Unisex%')
          )
        )`);
      } else if (gender === '여성') {
        conditions.push(sql`(
          (
            ${products.subcategoryId} LIKE 'c0%' OR ${products.subcategoryId} LIKE 'f0%'
            OR ${products.subcategoryId} LIKE '702%' OR ${products.subcategoryId} LIKE 'g0%'
            OR ${products.gender} = '여성' OR ${products.gender} = '공용'
            OR (${products.gender} IS NULL AND (
              ${products.name} ILIKE '%여성%' OR ${products.name} ILIKE '%[여성]%'
              OR ${products.name} ~* '\\mWomens?\\M' OR ${products.name} ~* '\\mWomen''s\\M'
              OR ${products.name} ILIKE '%ladies%'
              OR ${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%[공용]%'
              OR ${products.name} ILIKE '%Unisex%'
              OR ${isWatches ? sql`(${products.subcategoryId} IS NULL)` : sql`FALSE`}
            ))
          )
          AND NOT (
            (
              ${products.name} ILIKE '%남성용%' OR ${products.name} ILIKE '%[남성]%'
              OR (${products.name} ~* '\\mMens?\\M' AND ${products.name} !~* '\\mWomens?\\M')
              OR (${products.name} ~* '\\mMen''s\\M' AND ${products.name} !~* '\\mWomen''s\\M')
            )
            AND NOT (${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%Unisex%')
          )
        )`);
      } else if (gender === '공용') {
        conditions.push(sql`(
          ${products.gender} = '공용'
          OR (${products.gender} IS NULL AND (
            ${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%[공용]%'
            OR ${products.name} ILIKE '%Unisex%'
          ))
        )`);
      }
    }
    
    // Month filter: YYYY-MM format — filters createdAt to that month
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      conditions.push(sql`${products.createdAt} >= ${start.toISOString()} AND ${products.createdAt} < ${end.toISOString()}`);
    }

    // Subname filter: find all subcategory slugs matching the given name.
    // Uses prefix match (text before first '/') to match both men's and women's variants.
    // e.g. "후드티/집업" also matches "후드티" (women's), "반팔티/폴로티" also matches "반팔티/폴로"
    // "정장구두" matches both b0b030 (남성) and g030 (여성) since both are named "정장구두" in DB.
    if (subname) {
      // Strip leading "#" if present (some subcategory names may have "#" prefix)
      const cleanSubname = subname.startsWith('#') ? subname.slice(1) : subname;
      const parts = cleanSubname.split('/').map(p => p.trim()).filter(Boolean);
      const basePart = parts[0];
      // Build OR conditions: exact match (with and without #), prefix-based, and each part
      const partConditions = parts.map(p => sql`${subcategories.name} ILIKE ${p}`);
      const slugRows = await db.select({ slug: subcategories.slug })
        .from(subcategories)
        .where(sql`
          ${subcategories.name} = ${cleanSubname}
          OR ${subcategories.name} = ${'#' + cleanSubname}
          OR ${subcategories.name} ILIKE ${basePart + '/%'}
          OR ${subcategories.name} ILIKE ${'#' + basePart + '/%'}
          OR ${subcategories.name} ILIKE ${basePart}
          OR (${sql.join(partConditions, sql` OR `)})
        `);
      const slugs = slugRows.map(r => r.slug);
      if (slugs.length > 0) {
        // Use LIKE prefix matching (consistent with subcategoryId param) so products
        // whose subcategoryId starts with a slug are also matched
        const subnameConditions = slugs.map(slug => sql`${products.subcategoryId} LIKE ${slug + '%'}`);
        conditions.push(sql`(${sql.join(subnameConditions, sql` OR `)})`);
      } else {
        conditions.push(sql`1=0`); // no matching subcategory
      }
    }

    // filterCategory: secondary category filter for special pages (sameday/discount/best)
    if (filterCategory) {
      conditions.push(eq(products.categoryId, filterCategory));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [countResult, productList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(whereClause),
      db.select(leanSelect).from(products).where(whereClause).orderBy(desc(products.createdAt)).limit(limit).offset(offset)
    ]);
    return { products: productList as Product[], total: countResult[0]?.count || 0 };
  }
  
  async getProductsFullPaginated(limit: number, offset: number, categoryId?: string): Promise<{ products: Product[], total: number }> {
    const conditions: any[] = [];
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult, productList] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(whereClause),
      db.select().from(products).where(whereClause).orderBy(desc(products.createdAt)).limit(limit).offset(offset)
    ]);
    return { products: productList, total: countResult[0]?.count || 0 };
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

  private detectGenderFromName(name: string): string | null {
    if (!name) return null;
    const lower = name.toLowerCase();
    const hasUnisex = lower.includes('남녀공용') || lower.includes('남녀') || lower.includes('유니섹스') || lower.includes('unisex') || /\[공용\]/.test(name) || lower.includes('공용');
    if (hasUnisex) return '공용';
    const hasWomen = lower.includes('여성') || lower.includes('여자') || /\bwomens?\b/.test(lower) || /\bwomen'?s?\b/.test(lower) || lower.includes('ladies') || /\[여성\]/.test(name);
    const nameWithoutWomen = lower.replace(/women'?s?/g, '').replace(/womens?/g, '');
    const hasMen = lower.includes('남성') || lower.includes('남자') || /\bmens?\b/.test(nameWithoutWomen) || /\bmen'?s?\b/.test(nameWithoutWomen) || /\[남성\]/.test(name);
    if (hasWomen && !hasMen) return '여성';
    if (hasMen && !hasWomen) return '남성';
    if (hasWomen && hasMen) return '공용';
    return null;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    if (!insertProduct.gender && insertProduct.name) {
      const detected = this.detectGenderFromName(insertProduct.name);
      if (detected) insertProduct.gender = detected;
    }
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    if (updateData.name && !updateData.gender) {
      const detected = this.detectGenderFromName(updateData.name);
      if (detected) updateData.gender = detected;
    }
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

  async deleteProductsBySubcategoryIds(subcategoryIds: string[]): Promise<number> {
    if (!subcategoryIds.length) return 0;
    const result = await db.delete(products).where(inArray(products.subcategoryId, subcategoryIds)).returning();
    return result.length;
  }

  async getExistingProductNamesBySubcategory(subcategoryId: string): Promise<Set<string>> {
    const rows = await db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.subcategoryId, subcategoryId));
    return new Set(rows.map(r => r.name));
  }

  async getProductCountWithCategories(): Promise<{ total: number; byCategory: { categoryId: string; count: number }[] }> {
    const [totalResult, categoryResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(products),
      db.select({ categoryId: products.categoryId, count: sql<number>`count(*)::int` }).from(products).groupBy(products.categoryId)
    ]);
    return {
      total: totalResult[0]?.count || 0,
      byCategory: categoryResult.filter(r => r.categoryId != null).map(r => ({ categoryId: r.categoryId!, count: r.count }))
    };
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

  async getSubcategoriesByCategoryId(categoryId: string, gender?: string): Promise<Subcategory[]> {
    const conditions: any[] = [eq(subcategories.categoryId, categoryId)];
    if (gender === '남성') {
      conditions.push(sql`(${subcategories.slug} LIKE 'b0%' OR ${subcategories.slug} LIKE '701%')`);
    } else if (gender === '여성') {
      conditions.push(sql`(${subcategories.slug} LIKE 'c0%' OR ${subcategories.slug} LIKE 'f0%' OR ${subcategories.slug} LIKE '702%' OR ${subcategories.slug} LIKE 'g0%')`);
    } else if (gender === '골프') {
      conditions.push(sql`${subcategories.slug} LIKE '7%'`);
    }

    // 실제 제품이 존재하는 소분류만 반환 (products.subcategoryId LIKE slug% 로 prefix 매칭)
    // 카테고리별 특성에 맞게 필터링:
    //   - golf: gender='골프' 로 구분 (categoryId가 다를 수 있음)
    //   - jewelry: subcategoryId prefix로만 구분 (f0%, b080% 등)
    //   - 기타: categoryId 직접 매칭
    let categoryCondition: ReturnType<typeof sql>;
    if (categoryId === 'golf') {
      categoryCondition = sql`p.gender = '골프'`;
    } else if (categoryId === 'jewelry') {
      categoryCondition = sql`TRUE`; // subcategoryId prefix가 쥬얼리 전용
    } else {
      categoryCondition = sql`p.category_id = ${categoryId}`;
    }

    conditions.push(sql`EXISTS (
      SELECT 1 FROM products p
      WHERE p.subcategory_id LIKE (${subcategories.slug} || '%')
      AND ${categoryCondition}
      AND p.is_active = TRUE
      LIMIT 1
    )`);

    return db.select().from(subcategories)
      .where(and(...conditions))
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
    const conditions: any[] = [];
    if (categoryId) {
      if (categoryId === 'new-arrivals') {
        conditions.push(eq(products.isNew, true));
      } else if (categoryId === 'best') {
        conditions.push(eq(products.isBest, true));
      } else if (categoryId === 'sale') {
        conditions.push(sql`${products.discountPercent} > 0`);
      } else if (categoryId === 'men') {
        conditions.push(sql`(
          ${products.gender} = '남성' OR ${products.gender} = '공용'
          OR (${products.gender} IS NULL AND (
            ${products.name} ILIKE '%남성%' OR ${products.name} ILIKE '%[남성]%'
            OR ${products.name} ILIKE '%Mens%' OR ${products.name} ILIKE '%Men''s%'
            OR ${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%Unisex%'
          ))
        )`);
      } else if (categoryId === 'women') {
        conditions.push(sql`(
          ${products.gender} = '여성' OR ${products.gender} = '공용'
          OR (${products.gender} IS NULL AND (
            ${products.name} ILIKE '%여성%' OR ${products.name} ILIKE '%[여성]%'
            OR ${products.name} ILIKE '%Womens%' OR ${products.name} ILIKE '%Women''s%'
            OR ${products.name} ILIKE '%공용%' OR ${products.name} ILIKE '%Unisex%'
          ))
        )`);
      } else if (categoryId === 'golf') {
        conditions.push(eq(products.gender, '골프'));
      } else {
        conditions.push(eq(products.categoryId, categoryId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const productCounts = await db.select({
      brandId: products.brandId,
      count: sql<number>`count(*)::int`
    })
      .from(products)
      .where(whereClause)
      .groupBy(products.brandId);

    const countMap = new Map<string, number>();
    for (const row of productCounts) {
      if (row.brandId) {
        countMap.set(row.brandId, row.count);
      }
    }
    
    const allBrands = await db.select().from(brands).orderBy(brands.sortOrder);
    
    const results: { brand: Brand; productCount: number }[] = [];
    for (const brand of allBrands) {
      const productCount = countMap.get(brand.id) || 0;
      if (categoryId && productCount === 0) continue;
      results.push({ brand, productCount });
    }
    
    return results;
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

  async getMembersCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(members);
    return Number(result?.count || 0);
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

  async getReviewsPaginated(limit: number, offset: number): Promise<{ reviews: Review[]; total: number }> {
    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const total = Number(countResult?.count) || 0;
    
    const reviewList = await db.select().from(reviews)
      .orderBy(desc(reviews.displayDate))
      .limit(limit)
      .offset(offset);
    
    return { reviews: reviewList, total };
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

  async clearBluestoreReviewContent(): Promise<number> {
    const result = await db.execute(
      sql`UPDATE reviews SET content = '' WHERE content LIKE '%블루스토어 구매 후기입니다%'`
    );
    return result.rowCount ?? 0;
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

  async updateOrderByNumber(orderNumber: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(orders.orderNumber, orderNumber))
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

  async hasMemberOrderedProduct(memberId: string, productId: string): Promise<boolean> {
    const memberOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.memberId, memberId));
    if (memberOrders.length === 0) return false;
    
    const orderIds = memberOrders.map(o => o.id);
    const items = await db.select({ id: orderItems.id })
      .from(orderItems)
      .where(
        and(
          inArray(orderItems.orderId, orderIds),
          eq(orderItems.productId, productId)
        )
      );
    return items.length > 0;
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
      SET 
        original_price = CASE 
          WHEN original_price IS NULL OR original_price = 0 THEN price 
          ELSE original_price 
        END,
        price = ROUND(price * (1 - ${discountPercent}::numeric / 100)),
        discount_percent = ${discountPercent}
      WHERE category_id = ${categoryId}
        AND price > 0
    `);
    return Number(result.rowCount) || 0;
  }

  // Visitor Tracking
  async trackVisitor(session: InsertVisitorSession): Promise<VisitorSession> {
    const existing = await db.select().from(visitorSessions).where(eq(visitorSessions.sessionId, session.sessionId));
    if (existing.length > 0) {
      await db.update(visitorSessions)
        .set({ lastActiveAt: new Date(), page: session.page })
        .where(eq(visitorSessions.sessionId, session.sessionId));
      return existing[0];
    }
    const [visitor] = await db.insert(visitorSessions).values(session).returning();
    return visitor;
  }

  async updateVisitorActivity(sessionId: string, page?: string): Promise<void> {
    const updateData: any = { lastActiveAt: new Date() };
    if (page) updateData.page = page;
    await db.update(visitorSessions)
      .set(updateData)
      .where(eq(visitorSessions.sessionId, sessionId));
  }

  async trackPageView(pageView: InsertPageView): Promise<PageView> {
    const [view] = await db.insert(pageViews).values(pageView).returning();
    return view;
  }

  async getActiveVisitors(minutesAgo: number = 5): Promise<number> {
    const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
    const [result] = await db.select({ count: sql<number>`count(DISTINCT session_id)::int` })
      .from(visitorSessions)
      .where(sql`last_active_at > ${cutoff}`);
    return result?.count || 0;
  }

  async getTodayVisitors(): Promise<number> {
    // Use PostgreSQL timezone function for consistent Korean timezone (UTC+9)
    const [result] = await db.select({ count: sql<number>`count(DISTINCT session_id)::int` })
      .from(visitorSessions)
      .where(sql`(created_at AT TIME ZONE 'Asia/Seoul')::date = (NOW() AT TIME ZONE 'Asia/Seoul')::date`);
    return result?.count || 0;
  }

  async getTodayPageViews(): Promise<number> {
    // Use PostgreSQL timezone function for consistent Korean timezone (UTC+9)
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(pageViews)
      .where(sql`(created_at AT TIME ZONE 'Asia/Seoul')::date = (NOW() AT TIME ZONE 'Asia/Seoul')::date`);
    return result?.count || 0;
  }

  async getVisitorStats(): Promise<{ realtime: number; today: number; pageViews: number; recentPages: { page: string; count: number }[] }> {
    const realtime = await this.getActiveVisitors(5);
    const today = await this.getTodayVisitors();
    const pageViewCount = await this.getTodayPageViews();
    
    // Use PostgreSQL timezone function for consistent Korean timezone (UTC+9)
    const recentPagesResult = await db.select({
      page: pageViews.page,
      count: sql<number>`count(*)::int`
    })
      .from(pageViews)
      .where(sql`(created_at AT TIME ZONE 'Asia/Seoul')::date = (NOW() AT TIME ZONE 'Asia/Seoul')::date`)
      .groupBy(pageViews.page)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
    
    return {
      realtime,
      today,
      pageViews: pageViewCount,
      recentPages: recentPagesResult
    };
  }
  // Inspections
  async getAllInspections(): Promise<Inspection[]> {
    return db.select().from(inspections).orderBy(desc(inspections.createdAt));
  }

  async getActiveInspections(category?: string): Promise<Inspection[]> {
    const conditions: any[] = [eq(inspections.isActive, true)];
    if (category && category !== "all") {
      conditions.push(eq(inspections.category, category));
    }
    return db.select().from(inspections)
      .where(and(...conditions))
      .orderBy(inspections.sortOrder, desc(inspections.createdAt));
  }

  async getInspection(id: string): Promise<Inspection | undefined> {
    const [item] = await db.select().from(inspections).where(eq(inspections.id, id));
    return item;
  }

  async createInspection(data: InsertInspection): Promise<Inspection> {
    const [item] = await db.insert(inspections).values(data).returning();
    return item;
  }

  async updateInspection(id: string, data: Partial<InsertInspection>): Promise<Inspection | undefined> {
    const [item] = await db.update(inspections).set(data).where(eq(inspections.id, id)).returning();
    return item;
  }

  async deleteInspection(id: string): Promise<boolean> {
    const result = await db.delete(inspections).where(eq(inspections.id, id)).returning();
    return result.length > 0;
  }

  // Shipping Photos
  async getAllShippingPhotos(): Promise<ShippingPhoto[]> {
    return db.select().from(shippingPhotos).orderBy(desc(shippingPhotos.createdAt));
  }

  async getActiveShippingPhotos(category?: string): Promise<ShippingPhoto[]> {
    const conditions: any[] = [eq(shippingPhotos.isActive, true)];
    if (category && category !== "all") {
      conditions.push(eq(shippingPhotos.category, category));
    }
    return db.select().from(shippingPhotos)
      .where(and(...conditions))
      .orderBy(desc(shippingPhotos.createdAt));
  }

  async getShippingPhoto(id: string): Promise<ShippingPhoto | undefined> {
    const [item] = await db.select().from(shippingPhotos).where(eq(shippingPhotos.id, id));
    return item;
  }

  async createShippingPhoto(data: InsertShippingPhoto): Promise<ShippingPhoto> {
    const [item] = await db.insert(shippingPhotos).values(data).returning();
    return item;
  }

  async updateShippingPhoto(id: string, data: Partial<InsertShippingPhoto>): Promise<ShippingPhoto | undefined> {
    const [item] = await db.update(shippingPhotos).set(data).where(eq(shippingPhotos.id, id)).returning();
    return item;
  }

  async deleteShippingPhoto(id: string): Promise<boolean> {
    const result = await db.delete(shippingPhotos).where(eq(shippingPhotos.id, id)).returning();
    return result.length > 0;
  }

  async getContentSections(sectionType?: string): Promise<ContentSection[]> {
    if (sectionType) {
      return db.select().from(contentSections)
        .where(eq(contentSections.sectionType, sectionType))
        .orderBy(contentSections.sortOrder, desc(contentSections.createdAt));
    }
    return db.select().from(contentSections)
      .orderBy(contentSections.sortOrder, desc(contentSections.createdAt));
  }

  async getActiveContentSections(sectionType: string): Promise<ContentSection[]> {
    return db.select().from(contentSections)
      .where(and(
        eq(contentSections.sectionType, sectionType),
        eq(contentSections.isActive, true)
      ))
      .orderBy(contentSections.sortOrder, desc(contentSections.createdAt));
  }

  async getContentSection(id: string): Promise<ContentSection | undefined> {
    const [item] = await db.select().from(contentSections).where(eq(contentSections.id, id));
    return item;
  }

  async createContentSection(data: InsertContentSection): Promise<ContentSection> {
    const [item] = await db.insert(contentSections).values(data).returning();
    return item;
  }

  async updateContentSection(id: string, data: Partial<InsertContentSection>): Promise<ContentSection | undefined> {
    const [item] = await db.update(contentSections).set(data).where(eq(contentSections.id, id)).returning();
    return item;
  }

  async deleteContentSection(id: string): Promise<boolean> {
    const result = await db.delete(contentSections).where(eq(contentSections.id, id)).returning();
    return result.length > 0;
  }

  async reorderContentSections(orders: { id: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        db.update(contentSections).set({ sortOrder }).where(eq(contentSections.id, id))
      )
    );
  }

  async getMagazines(category?: string): Promise<Magazine[]> {
    if (category) {
      return db.select().from(magazines)
        .where(eq(magazines.category, category))
        .orderBy(magazines.sortOrder, desc(magazines.createdAt));
    }
    return db.select().from(magazines)
      .orderBy(magazines.sortOrder, desc(magazines.createdAt));
  }

  async getActiveMagazines(category?: string): Promise<Magazine[]> {
    if (category) {
      return db.select().from(magazines)
        .where(and(eq(magazines.category, category), eq(magazines.isActive, true)))
        .orderBy(magazines.sortOrder, desc(magazines.createdAt));
    }
    return db.select().from(magazines)
      .where(eq(magazines.isActive, true))
      .orderBy(magazines.sortOrder, desc(magazines.createdAt));
  }

  async getMagazine(id: string): Promise<Magazine | undefined> {
    const [item] = await db.select().from(magazines).where(eq(magazines.id, id));
    return item;
  }

  async createMagazine(data: InsertMagazine): Promise<Magazine> {
    const [item] = await db.insert(magazines).values(data).returning();
    return item;
  }

  async updateMagazine(id: string, data: Partial<InsertMagazine>): Promise<Magazine | undefined> {
    const [item] = await db.update(magazines).set(data).where(eq(magazines.id, id)).returning();
    return item;
  }

  async deleteMagazine(id: string): Promise<boolean> {
    const result = await db.delete(magazines).where(eq(magazines.id, id)).returning();
    return result.length > 0;
  }

  async getLabsBlocks(): Promise<LabsBlock[]> {
    return db.select().from(labsBlocks).orderBy(labsBlocks.sortOrder);
  }

  async getActiveLabsBlocks(): Promise<LabsBlock[]> {
    return db.select().from(labsBlocks).where(eq(labsBlocks.isActive, true)).orderBy(labsBlocks.sortOrder);
  }

  async getLabsBlock(id: string): Promise<LabsBlock | undefined> {
    const [item] = await db.select().from(labsBlocks).where(eq(labsBlocks.id, id));
    return item;
  }

  async createLabsBlock(data: InsertLabsBlock): Promise<LabsBlock> {
    const [item] = await db.insert(labsBlocks).values(data).returning();
    return item;
  }

  async updateLabsBlock(id: string, data: Partial<InsertLabsBlock>): Promise<LabsBlock | undefined> {
    const [item] = await db.update(labsBlocks).set(data).where(eq(labsBlocks.id, id)).returning();
    return item;
  }

  async deleteLabsBlock(id: string): Promise<boolean> {
    const result = await db.delete(labsBlocks).where(eq(labsBlocks.id, id)).returning();
    return result.length > 0;
  }

  async getAllQuickMenuItems(): Promise<QuickMenuItem[]> {
    return db.select().from(quickMenuItems).orderBy(quickMenuItems.sortOrder);
  }

  async getActiveQuickMenuItems(): Promise<QuickMenuItem[]> {
    return db.select().from(quickMenuItems).where(eq(quickMenuItems.isActive, true)).orderBy(quickMenuItems.sortOrder);
  }

  async getQuickMenuItem(id: string): Promise<QuickMenuItem | undefined> {
    const [item] = await db.select().from(quickMenuItems).where(eq(quickMenuItems.id, id));
    return item;
  }

  async createQuickMenuItem(item: InsertQuickMenuItem): Promise<QuickMenuItem> {
    const [created] = await db.insert(quickMenuItems).values(item).returning();
    return created;
  }

  async updateQuickMenuItem(id: string, item: Partial<InsertQuickMenuItem>): Promise<QuickMenuItem | undefined> {
    const [updated] = await db.update(quickMenuItems).set(item).where(eq(quickMenuItems.id, id)).returning();
    return updated;
  }

  async deleteQuickMenuItem(id: string): Promise<boolean> {
    const result = await db.delete(quickMenuItems).where(eq(quickMenuItems.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
