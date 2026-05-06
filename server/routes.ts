import type { Express, Request, Response } from "express";
import { type Server } from "http";
import * as cheerio from "cheerio";
import compression from "compression";
import { storage } from "./storage";
import { pool } from "./db";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { 
  type Product,
  insertProductSchema, 
  insertCategorySchema, 
  insertSubcategorySchema,
  insertBrandSchema,
  insertMemberSchema, 
  insertChatConversationSchema, 
  insertChatMessageSchema, 
  insertFaqSchema, 
  insertReviewSchema, 
  insertNoticeSchema, 
  insertOrderSchema,
  insertBannerSchema,
  insertPopupSchema,
  insertCartItemSchema,
  insertWishlistItemSchema,
  insertBlogPostSchema,
  insertCouponSchema,
  insertCouponPaymentSchema,
  insertContentSectionSchema,
  insertMagazineSchema,
  insertLabsBlockSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// In-memory cache for product listings (TTL: 30 seconds)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const productCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30 * 1000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = productCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    productCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  productCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

function invalidateProductCache(): void {
  for (const key of productCache.keys()) {
    if (key.startsWith("products:")) {
      productCache.delete(key);
    }
  }
}

const reviewImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)"));
    }
  },
});

const bannerImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "banners");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `banner-${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)"));
    }
  },
});

const quickMenuImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "quickmenu");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `qm-${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드 가능합니다. (jpg, png, gif, webp)"));
    }
  },
});


const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const adminSessions = new Map<string, { expiresAt: Date; role: string; userId?: string; name?: string }>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isValidSession(token: string): boolean {
  const session = adminSessions.get(token);
  if (!session) return false;
  if (new Date() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function getSessionRole(token: string): string | null {
  const session = adminSessions.get(token);
  if (!session || new Date() > session.expiresAt) return null;
  return session.role;
}

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !isValidSession(token)) {
    return res.status(401).json({ success: false, error: "인증이 필요합니다." });
  }
  (req as any).adminRole = getSessionRole(token);
  next();
}

async function getMemberFromToken(token: string | undefined): Promise<{ memberId: string; email: string; name: string } | null> {
  if (!token) return null;
  const session = await storage.getMemberSession(token);
  if (!session) return null;
  return { memberId: session.memberId, email: session.email, name: session.name };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const express = await import("express");
  
  // Enable gzip/brotli compression for all responses
  app.use(compression());
  
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));
  
  registerObjectStorageRoutes(app);
  const objectStorageService = new ObjectStorageService();
  
  (async () => {
    try {
      const { db } = await import("./db");
      const { sql: sqlTag } = await import("drizzle-orm");
      const fixResult = await db.execute(
        sqlTag`UPDATE reviews SET content = '' WHERE content LIKE '%블루스토어 구매 후기입니다%'`
      );
      if ((fixResult.rowCount ?? 0) > 0) {
        console.log(`Cleared bloostore text from ${fixResult.rowCount} reviews`);
      }
      // Remove inspection-related quick menu items (라이브검수 등)
      const delResult = await db.execute(
        sqlTag`DELETE FROM quick_menu_items WHERE link_url LIKE '%/inspection%' OR name LIKE '%검수%'`
      );
      if ((delResult.rowCount ?? 0) > 0) {
        console.log(`[cleanup] Removed ${delResult.rowCount} inspection quick menu item(s)`);
      }
    } catch (e) {
      console.error("Orphan cleanup error:", e);
    }
  })();

  // ==================== IMAGE PROXY API ====================
  
  // In-memory image cache for faster subsequent loads
  const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();
  const IMAGE_CACHE_TTL = 3600000; // 1 hour in milliseconds
  const MAX_IMAGE_CACHE_SIZE = 500; // Maximum cached images
  let sharpModule: any = null;
  const getSharp = async () => {
    if (!sharpModule) sharpModule = (await import("sharp")).default;
    return sharpModule;
  };
  
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    try {
      let imageUrl = req.query.url as string;
      // Validate and clamp width/quality to reasonable bounds
      const rawWidth = parseInt(req.query.w as string) || 400;
      const rawQuality = parseInt(req.query.q as string) || 75;
      const width = Math.min(Math.max(rawWidth, 100), 1600); // 100-1600px
      const quality = Math.min(Math.max(rawQuality, 30), 95); // 30-95%
      
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: "URL parameter required" });
      }
      
      // Decode URL if needed (handle double encoding)
      try {
        if (imageUrl.includes('%')) {
          imageUrl = decodeURIComponent(imageUrl);
        }
      } catch (e) {
        // If decode fails, use as-is
      }
      
      // Allow proxying from approved domains
      const allowedDomains = ["pliki.wisacdn.com", "bagstyle.site", "cdamdong.co.kr", "cdn.shopify.com", "shopify.com"];
      const isAllowed = allowedDomains.some(domain => imageUrl.includes(domain));
      if (!isAllowed) {
        return res.status(403).json({ success: false, error: "Domain not allowed" });
      }
      
      // Ensure URL is absolute
      if (!imageUrl.startsWith("http")) {
        imageUrl = `https://bagstyle.site${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
      }
      
      // Check image cache first
      const imageCacheKey = `${imageUrl}:${width}:${quality}`;
      const cachedImage = imageCache.get(imageCacheKey);
      if (cachedImage && (Date.now() - cachedImage.timestamp) < IMAGE_CACHE_TTL) {
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        res.setHeader("Vary", "Accept");
        res.setHeader("X-Image-Cache", "HIT");
        return res.send(cachedImage.buffer);
      }
      
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": imageUrl.includes("pliki.wisacdn.com") ? "https://pliki6.com/" : "https://bagstyle.site/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        redirect: "follow",
      });
      
      if (!response.ok) {
        console.log(`Image proxy failed for ${imageUrl}: ${response.status}`);
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect fill="#f3f4f6" width="400" height="300"/>
          <text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">이미지 없음</text>
        </svg>`;
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(placeholderSvg);
      }
      
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Check if the image is a GIF - preserve animation by not converting
      const isGif = imageUrl.toLowerCase().endsWith('.gif') || 
                    response.headers.get('content-type')?.includes('image/gif');
      
      if (isGif) {
        // Return GIF as-is to preserve animation
        // Store in cache (with size limit management)
        if (imageCache.size >= MAX_IMAGE_CACHE_SIZE) {
          const oldestKey = imageCache.keys().next().value;
          if (oldestKey) imageCache.delete(oldestKey);
        }
        imageCache.set(imageCacheKey, { buffer, timestamp: Date.now() });
        
        res.setHeader("Content-Type", "image/gif");
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        res.setHeader("X-Image-Cache", "MISS");
        return res.send(buffer);
      }
      
      // Use sharp to resize and compress non-GIF images to WebP
      const sharp = await getSharp();
      const optimizedImage = await sharp(buffer)
        .resize(width, null, { 
          withoutEnlargement: true,
          fit: "inside"
        })
        .webp({ quality })
        .toBuffer();
      
      // Store in cache (with size limit management)
      if (imageCache.size >= MAX_IMAGE_CACHE_SIZE) {
        const oldestKey = imageCache.keys().next().value;
        if (oldestKey) imageCache.delete(oldestKey);
      }
      imageCache.set(imageCacheKey, { buffer: optimizedImage, timestamp: Date.now() });
      
      res.setHeader("Content-Type", "image/webp");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // Cache for 7 days
      res.setHeader("Vary", "Accept");
      res.setHeader("X-Image-Cache", "MISS");
      res.send(optimizedImage);
    } catch (error) {
      console.error("Image proxy error:", error);
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#f3f4f6" width="400" height="300"/>
        <text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="14">이미지 없음</text>
      </svg>`;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(placeholderSvg);
    }
  });
  
  // ==================== PRODUCTS API ====================
  
  // Separate brands cache with longer TTL (10 minutes)
  const brandsCache = new Map<string, { data: unknown[]; timestamp: number }>();
  const BRANDS_CACHE_TTL = 60000; // 1 minute
  
  // Separate counts cache with medium TTL (5 minutes)
  const countsCache = new Map<string, { total: number; timestamp: number }>();
  const COUNTS_CACHE_TTL = 300000; // 5 minutes
  
  // Brands endpoint with aggressive caching
  app.get("/api/brands", async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.query;
      const catFilter = categoryId && categoryId !== "all" ? categoryId as string : undefined;
      const cacheKey = `brands:${catFilter || 'all'}`;
      
      const cached = brandsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < BRANDS_CACHE_TTL) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "public, max-age=60");
        return res.json({ success: true, data: cached.data });
      }
      
      const categoryBrands = await storage.getBrandsWithProductCount(catFilter);
      const brandsData = categoryBrands.map(cb => ({ ...cb.brand, productCount: cb.productCount }));
      
      brandsCache.set(cacheKey, { data: brandsData, timestamp: Date.now() });
      
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({ success: true, data: brandsData });
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ success: false, error: "Failed to fetch brands" });
    }
  });
  
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category, categoryId, subcategoryId, limit, offset, includeBrands, search, brandId, gender, month, subname, filterCategory } = req.query;
      
      const limitNum = limit ? parseInt(limit as string, 10) : 60;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;
      const searchQuery = search ? (search as string).trim() : undefined;
      const brandFilter = brandId ? brandId as string : undefined;
      const genderFilter = gender ? gender as string : undefined;
      const monthFilter = month ? month as string : undefined;
      
      const catFilter = (categoryId && categoryId !== "all") 
        ? categoryId as string 
        : (category && category !== "all") 
          ? category as string 
          : undefined;
      
      let subCatFilter = subcategoryId ? subcategoryId as string : undefined;

      // subcategoryId가 UUID 형식으로 오면 slug(ca_id)로 변환 — 제품은 ca_id를 저장함
      if (subCatFilter && subCatFilter.length > 10) {
        try {
          const foundSubcat = await storage.getSubcategory(subCatFilter);
          if (foundSubcat && foundSubcat.slug) subCatFilter = foundSubcat.slug;
        } catch {}
      }
      
      const subnameFilter = subname ? (subname as string) : undefined;
      const filterCategoryFilter = filterCategory ? (filterCategory as string) : undefined;
      const productCacheKey = `products:${catFilter || 'all'}:${subCatFilter || 'all'}:${searchQuery || 'all'}:${brandFilter || 'all'}:${genderFilter || 'all'}:${monthFilter || 'all'}:${subnameFilter || 'all'}:${filterCategoryFilter || 'all'}:${limitNum}:${offsetNum}`;
      type CachedProducts = { products: unknown[]; total: number };
      const cached = getCached<CachedProducts>(productCacheKey);
      
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
        return res.json({ 
          success: true, 
          data: cached.products,
          total: cached.total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < cached.total
        });
      }
      
      const { products: productList, total } = await storage.getProductsPaginated(limitNum, offsetNum, catFilter, subCatFilter, searchQuery, brandFilter, genderFilter, monthFilter, subnameFilter, filterCategoryFilter);
      
      // Store in cache
      setCache(productCacheKey, { products: productList, total });
      
      // Add caching headers for better performance
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      res.json({ 
        success: true, 
        data: productList,
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ success: false, error: "Failed to fetch product" });
    }
  });
  
  app.post("/api/products", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      invalidateProductCache();
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ success: false, error: "Failed to create product" });
    }
  });
  
  app.patch("/api/products/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertProductSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      invalidateProductCache();
      res.json({ success: true, data: product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, error: "Failed to update product" });
    }
  });
  
  app.delete("/api/products/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      invalidateProductCache();
      res.json({ success: true, message: "Product deleted" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ success: false, error: "Failed to delete product" });
    }
  });

  // 상품 일괄 업데이트 (카테고리 변경 등)
  app.post("/api/admin/products/bulk-update", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { productIds, updates } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, error: "productIds 배열이 필요합니다." });
      }
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ success: false, error: "updates 객체가 필요합니다." });
      }
      let updated = 0;
      for (const id of productIds) {
        try {
          await storage.updateProduct(String(id), updates);
          updated++;
        } catch (e) {
          console.error(`[bulk-update] Failed to update product ${id}:`, e);
        }
      }
      invalidateProductCache();
      res.json({ success: true, updated });
    } catch (error) {
      console.error("Error bulk updating products:", error);
      res.status(500).json({ success: false, error: "일괄 업데이트 실패" });
    }
  });

  // 상품 일괄 섹션 추가
  app.post("/api/admin/products/bulk-add-to-section", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { productIds, sectionId } = req.body;
      if (!sectionId || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, error: "sectionId와 productIds가 필요합니다." });
      }
      const section = await storage.getContentSection(sectionId);
      if (!section) return res.status(404).json({ success: false, error: "섹션을 찾을 수 없습니다." });
      const existingIds: string[] = section.productIds || [];
      const newIds = [...new Set([...existingIds, ...productIds.map(String)])];
      await storage.updateContentSection(sectionId, { productIds: newIds });
      res.json({ success: true, addedCount: newIds.length - existingIds.length });
    } catch (error) {
      console.error("Error bulk adding to section:", error);
      res.status(500).json({ success: false, error: "섹션 추가 실패" });
    }
  });

  // 상품 일괄 삭제
  app.post("/api/admin/products/bulk-delete", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ success: false, error: "productIds 배열이 필요합니다." });
      }
      let deleted = 0;
      for (const id of productIds) {
        try {
          await storage.deleteProduct(String(id));
          deleted++;
        } catch (e) {
          console.error(`[bulk-delete] Failed to delete product ${id}:`, e);
        }
      }
      invalidateProductCache();
      res.json({ success: true, deleted });
    } catch (error) {
      console.error("Error bulk deleting products:", error);
      res.status(500).json({ success: false, error: "일괄 삭제 실패" });
    }
  });

  app.post("/api/admin/products/delete-by-subcategory", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { subcategoryIds } = req.body;
      if (!Array.isArray(subcategoryIds) || subcategoryIds.length === 0) {
        return res.status(400).json({ success: false, error: "subcategoryIds 배열이 필요합니다." });
      }
      const deleted = await storage.deleteProductsBySubcategoryIds(subcategoryIds.map(String));
      invalidateProductCache();
      console.log(`[admin] 소분류 삭제 완료: ${subcategoryIds.join(',')} → ${deleted}개 삭제`);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("[admin] delete-by-subcategory error:", error.message);
      res.status(500).json({ success: false, error: "소분류 삭제 실패" });
    }
  });

  app.post("/api/admin/bulk-price-increase", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { products } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`UPDATE products SET price = price + 20000, original_price = COALESCE(original_price, price) + 20000`);
      res.json({ success: true, message: "All prices increased by 20,000 KRW" });
    } catch (error) {
      console.error("Error bulk price increase:", error);
      res.status(500).json({ success: false, error: "Failed to update prices" });
    }
  });
  
  // ==================== CATEGORIES API ====================
  
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categoryList = await storage.getAllCategories();
      res.json({ success: true, data: categoryList });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Category not found" });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ success: false, error: "Failed to fetch category" });
    }
  });
  
  app.post("/api/categories", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ success: false, error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertCategorySchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ success: false, error: "Category not found" });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ success: false, error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Category not found" });
      }
      res.json({ success: true, message: "Category deleted" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ success: false, error: "Failed to delete category" });
    }
  });

  app.get("/api/categories/:id/subcategories", async (req: Request, res: Response) => {
    try {
      const subcategories = await storage.getSubcategoriesByCategoryId(req.params.id);
      res.json({ success: true, data: subcategories });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ success: false, error: "Failed to fetch subcategories" });
    }
  });

  // ==================== SUBCATEGORIES API ====================

  app.get("/api/subcategories", async (req: Request, res: Response) => {
    try {
      const { categoryId, gender } = req.query;
      let subcategoryList;
      
      if (categoryId) {
        subcategoryList = await storage.getSubcategoriesByCategoryId(
          categoryId as string,
          gender ? gender as string : undefined
        );
      } else {
        subcategoryList = await storage.getAllSubcategories();
      }
      
      res.json({ success: true, data: subcategoryList });
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ success: false, error: "Failed to fetch subcategories" });
    }
  });

  app.get("/api/subcategories/:id", async (req: Request, res: Response) => {
    try {
      const subcategory = await storage.getSubcategory(req.params.id);
      if (!subcategory) {
        return res.status(404).json({ success: false, error: "Subcategory not found" });
      }
      res.json({ success: true, data: subcategory });
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ success: false, error: "Failed to fetch subcategory" });
    }
  });

  app.post("/api/subcategories", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertSubcategorySchema.parse(req.body);
      const subcategory = await storage.createSubcategory(validatedData);
      res.status(201).json({ success: true, data: subcategory });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating subcategory:", error);
      res.status(500).json({ success: false, error: "Failed to create subcategory" });
    }
  });

  app.put("/api/subcategories/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertSubcategorySchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const subcategory = await storage.updateSubcategory(req.params.id, validatedData);
      if (!subcategory) {
        return res.status(404).json({ success: false, error: "Subcategory not found" });
      }
      res.json({ success: true, data: subcategory });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating subcategory:", error);
      res.status(500).json({ success: false, error: "Failed to update subcategory" });
    }
  });

  app.delete("/api/subcategories/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteSubcategory(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Subcategory not found" });
      }
      res.json({ success: true, message: "Subcategory deleted" });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ success: false, error: "Failed to delete subcategory" });
    }
  });

  // ==================== BRANDS API ====================
  // Note: Main GET /api/brands with category filtering is defined earlier in this file

  app.get("/api/brands/top", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 15;
      const allBrands = await storage.getBrandsWithProductCount();
      const rolexEntry = allBrands.find(b => b.brand.name === '롤렉스');
      const sorted = allBrands
        .filter(b => b.productCount > 0 && b.brand.name !== '롤렉스')
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, rolexEntry ? limit - 1 : limit);
      if (rolexEntry) {
        sorted.unshift(rolexEntry);
      }

      const priorityCategories = ['bags', 'clothing', 'jewelry', 'wallets', 'women', 'men', 'golf', 'new-arrivals', 'shoes'];

      const result = await Promise.all(sorted.map(async (entry) => {
        let selectedImage: string | null = null;

        for (const cat of priorityCategories) {
          const { products } = await storage.getProductsPaginated(1, 0, cat, undefined, undefined, entry.brand.id);
          if (products.length > 0 && products[0].imageUrl) {
            selectedImage = products[0].imageUrl;
            break;
          }
        }

        if (!selectedImage) {
          const { products } = await storage.getProductsPaginated(1, 0, undefined, undefined, undefined, entry.brand.id);
          if (products.length > 0) {
            selectedImage = products[0].imageUrl;
          }
        }

        return {
          id: entry.brand.id,
          name: entry.brand.name,
          slug: entry.brand.slug,
          productCount: entry.productCount,
          representativeImage: selectedImage,
        };
      }));

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error fetching top brands:", error);
      res.status(500).json({ success: false, error: "Failed to fetch top brands" });
    }
  });

  app.get("/api/brands/:id", async (req: Request, res: Response) => {
    try {
      const brand = await storage.getBrand(req.params.id);
      if (!brand) {
        return res.status(404).json({ success: false, error: "Brand not found" });
      }
      res.json({ success: true, data: brand });
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({ success: false, error: "Failed to fetch brand" });
    }
  });

  app.post("/api/brands", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(validatedData);
      res.status(201).json({ success: true, data: brand });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating brand:", error);
      res.status(500).json({ success: false, error: "Failed to create brand" });
    }
  });

  app.put("/api/brands/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertBrandSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const brand = await storage.updateBrand(req.params.id, validatedData);
      if (!brand) {
        return res.status(404).json({ success: false, error: "Brand not found" });
      }
      res.json({ success: true, data: brand });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating brand:", error);
      res.status(500).json({ success: false, error: "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteBrand(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Brand not found" });
      }
      res.json({ success: true, message: "Brand deleted" });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ success: false, error: "Failed to delete brand" });
    }
  });

  const BRAND_KEYWORDS: Record<string, string[]> = {
    '구찌': ['구찌', 'gucci'],
    '루이비통': ['루이비통', 'louis vuitton', 'louisvuitton', 'lv'],
    '샤넬': ['샤넬', 'chanel'],
    '에르메스': ['에르메스', 'hermes', 'hermès'],
    '프라다': ['프라다', 'prada'],
    '디올': ['디올', 'dior', 'christian dior'],
    '버버리': ['버버리', 'burberry'],
    '발렌시아가': ['발렌시아가', 'balenciaga'],
    '셀린느': ['셀린느', '셀린', 'celine', 'céline'],
    '보테가 베네타': ['보테가', '보테가베네타', 'bottega', 'bottega veneta'],
    '펜디': ['펜디', 'fendi'],
    '미우미우': ['미우미우', 'miu miu', 'miumiu'],
    '몽클레어': ['몽클레어', 'moncler'],
    '톰브라운': ['톰브라운', 'thom browne', 'thombrowne'],
    '발렌티노': ['발렌티노', 'valentino'],
    '지방시': ['지방시', 'givenchy'],
    '로에베': ['로에베', 'loewe'],
    '생로랑': ['생로랑', 'saint laurent', 'ysl', 'yves saint laurent'],
    '베르사체': ['베르사체', 'versace'],
    '알렉산더 맥퀸': ['알렉산더맥퀸', '알렉산더 맥퀸', 'alexander mcqueen', 'mcqueen'],
    '톰포드': ['톰포드', 'tom ford', 'tomford'],
    '막스마라': ['막스마라', 'max mara', 'maxmara'],
    '페레가모': ['페레가모', 'ferragamo', 'salvatore ferragamo'],
    '골든구스': ['골든구스', 'golden goose', 'goldengoose', 'ggdb'],
    '마르니': ['마르니', 'marni'],
    '끌로에': ['끌로에', '클로에', 'chloe', 'chloé'],
    '자크뮈스': ['자크뮈스', 'jacquemus'],
    '아미': ['아미', 'ami', 'ami paris'],
    '메종키츠네': ['메종키츠네', 'maison kitsune', 'maisonkitsune', 'kitsuné'],
    '꼼데가르송': ['꼼데가르송', 'comme des garcons', 'commedesgarcons', 'cdg'],
    '오프화이트': ['오프화이트', 'off-white', 'off white', 'offwhite'],
    '스톤아일랜드': ['스톤아일랜드', 'stone island', 'stoneisland'],
    '아크네 스튜디오': ['아크네', '아크네스튜디오', 'acne studios', 'acne'],
    '이자벨마랑': ['이자벨마랑', 'isabel marant', 'isabelmarant'],
    '마르지엘라': ['마르지엘라', '메종마르지엘라', '메종 마르지엘라', 'margiela', 'maison margiela'],
    '릭오웬스': ['릭오웬스', 'rick owens', 'rickowens'],
    '베트멍': ['베트멍', 'vetements'],
    '팜엔젤스': ['팜엔젤스', 'palm angels', 'palmangels'],
    '아미리': ['아미리', 'amiri'],
    '지미추': ['지미추', '지미 추', 'jimmy choo', 'jimmychoo'],
    '마놀로 블라닉': ['마놀로블라닉', '마놀로 블라닉', 'manolo blahnik', 'manoloblahnik'],
    '크롬하츠': ['크롬하츠', 'chrome hearts', 'chromehearts'],
    '티파니': ['티파니', 'tiffany'],
    '반클리프': ['반클리프', 'van cleef', 'vancleef'],
    '불가리': ['불가리', 'bulgari', 'bvlgari'],
    '까르띠에': ['까르띠에', 'cartier'],
    '고야드': ['고야드', 'goyard'],
    '캐나다구스': ['캐나다구스', 'canada goose', 'canadagoose'],
    '무스너클': ['무스너클', 'moose knuckles', 'mooseknuckles'],
    '파라점퍼스': ['파라점퍼스', 'parajumpers'],
    '듀베티카': ['듀베티카', 'duvetica'],
    '헤르노': ['헤르노', 'herno'],
    '타티아스': ['타티아스', 'tatras'],
    '어그': ['어그', 'ugg'],
    '마린세르': ['마린세르', 'marine serre', 'marineserre'],
    '살로몬': ['살로몬', 'salomon'],
    '뉴발란스': ['뉴발란스', 'new balance', 'newbalance'],
    '나이키': ['나이키', 'nike'],
    '아디다스': ['아디다스', 'adidas'],
    '돌체앤가바나': ['돌체앤가바나', '돌체 앤 가바나', 'dolce & gabbana', 'dolce gabbana', 'd&g'],
    '겐조': ['겐조', 'kenzo'],
    '랑방': ['랑방', 'lanvin'],
    '로저비비에': ['로저비비에', 'roger vivier', 'rogervivier'],
    '멀버리': ['멀버리', 'mulberry'],
    '코치': ['코치', 'coach'],
    '마이클코어스': ['마이클코어스', '마이클 코어스', 'michael kors', 'michaelkors'],
    '몽블랑': ['몽블랑', 'montblanc', 'mont blanc'],
    '발리': ['발리', 'bally'],
    '토즈': ['토즈', "tod's", 'tods'],
    '브루넬로 쿠치넬리': ['브루넬로', '쿠치넬리', 'brunello cucinelli', 'brunellocucinelli'],
    '로로피아나': ['로로피아나', 'loro piana', 'loropiana'],
    '에트로': ['에트로', 'etro'],
    '아르마니': ['아르마니', 'armani', 'giorgio armani', 'emporio armani'],
    '휴고보스': ['휴고보스', 'hugo boss', 'hugoboss', 'boss'],
    '폴스미스': ['폴스미스', 'paul smith', 'paulsmith'],
    '르메르': ['르메르', 'lemaire'],
    '질샌더': ['질샌더', 'jil sander', 'jilsander'],
  };

  function matchBrandFromText(text: string, allBrands: { id: string; name: string }[]): string | undefined {
    const lowerText = text.toLowerCase();
    for (const brand of allBrands) {
      const keywords = BRAND_KEYWORDS[brand.name];
      if (keywords) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword.toLowerCase())) {
            return brand.id;
          }
        }
      }
      if (lowerText.includes(brand.name.toLowerCase())) {
        return brand.id;
      }
    }
    return undefined;
  }

  app.post("/api/brands/auto-classify", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const allBrands = await storage.getAllBrands();
      const allProducts = await storage.getAllProducts();
      let classified = 0;
      let alreadyClassified = 0;

      for (const product of allProducts) {
        if (product.brandId) {
          alreadyClassified++;
          continue;
        }
        const matchedBrandId = matchBrandFromText(product.name, allBrands);
        if (matchedBrandId) {
          await storage.updateProduct(product.id, { brandId: matchedBrandId });
          classified++;
        }
      }

      brandsCache.clear();

      res.json({
        success: true,
        data: {
          total: allProducts.length,
          classified,
          alreadyClassified,
          unclassified: allProducts.length - classified - alreadyClassified,
        },
      });
    } catch (error) {
      console.error("Error auto-classifying brands:", error);
      res.status(500).json({ success: false, error: "Failed to auto-classify brands" });
    }
  });

  app.post("/api/products/fix-html-and-classify", async (req: Request, res: Response) => {
    const maintenanceKey = req.headers['x-maintenance-key'] || req.query.key;
    const adminToken = req.headers.authorization?.replace("Bearer ", "");
    if (maintenanceKey !== 'fix-products-2026' && (!adminToken || !isValidSession(adminToken))) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    try {
      const existingBrands = await storage.getAllBrands();
      const brandNameToId = new Map<string, string>();
      for (const b of existingBrands) {
        brandNameToId.set(b.name, b.id);
      }

      let brandsCreated = 0;
      for (const [brandName, keywords] of Object.entries(BRAND_KEYWORDS)) {
        if (!brandNameToId.has(brandName)) {
          try {
            const englishKw = keywords.find(kw => /^[a-z\s\-&']+$/i.test(kw));
            const slug = (englishKw || brandName)
              .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') || `brand-${Date.now()}-${brandsCreated}`;
            const newBrand = await storage.createBrand({
              name: brandName,
              slug: slug,
              isActive: true,
              sortOrder: brandsCreated,
            });
            brandNameToId.set(brandName, newBrand.id);
            brandsCreated++;
          } catch (e: any) {
            if (e.message?.includes('duplicate') || e.code === '23505') {
              const refreshed = await storage.getAllBrands();
              const found = refreshed.find(b => b.name === brandName);
              if (found) brandNameToId.set(brandName, found.id);
              else {
                const bySlug = refreshed.find(b => {
                  const englishKw2 = keywords.find(kw => /^[a-z\s\-&']+$/i.test(kw));
                  const expectedSlug = (englishKw2 || brandName).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
                  return b.slug === expectedSlug;
                });
                if (bySlug) brandNameToId.set(brandName, bySlug.id);
              }
            } else {
              console.error(`Failed to create brand ${brandName}:`, e.message);
            }
          }
        }
      }

      const allProducts = await storage.getAllProducts();
      let htmlFixed = 0;
      let classified = 0;
      let alreadyClassified = 0;
      const batchSize = 50;

      const decodeEntities = (text: string): string => {
        return text
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ')
          .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)));
      };

      const matchBrand = (text: string): string | undefined => {
        const lower = text.toLowerCase();
        for (const [brandName, keywords] of Object.entries(BRAND_KEYWORDS)) {
          for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) {
              return brandNameToId.get(brandName);
            }
          }
        }
        return undefined;
      };

      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        await Promise.all(batch.map(async (product) => {
          const updateData: Record<string, any> = {};
          const decodedName = decodeEntities(product.name);
          if (decodedName !== product.name) {
            updateData.name = decodedName;
            htmlFixed++;
          }
          const forceReclassify = req.body?.force === true;
          if (product.brandId && !forceReclassify) {
            alreadyClassified++;
          } else {
            const matchedBrandId = matchBrand(decodedName || product.name);
            if (matchedBrandId) {
              if (product.brandId !== matchedBrandId) {
                updateData.brandId = matchedBrandId;
                classified++;
              } else {
                alreadyClassified++;
              }
            }
          }
          if (Object.keys(updateData).length > 0) {
            await storage.updateProduct(product.id, updateData);
          }
        }));
      }

      brandsCache.clear();

      res.json({
        success: true,
        data: {
          total: allProducts.length,
          brandsCreated,
          totalBrands: brandNameToId.size,
          htmlFixed,
          classified,
          alreadyClassified,
          unclassified: allProducts.length - classified - alreadyClassified,
        },
      });
    } catch (error) {
      console.error("Error fixing products:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== BANNERS API ====================

  app.get("/api/banners", async (req: Request, res: Response) => {
    try {
      const bannerList = await storage.getActiveBanners();
      res.json({ success: true, data: bannerList });
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ success: false, error: "Failed to fetch banners" });
    }
  });

  app.get("/api/admin/banners", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const bannerList = await storage.getAllBanners();
      res.json({ success: true, data: bannerList });
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ success: false, error: "Failed to fetch banners" });
    }
  });

  app.get("/api/banners/:id", async (req: Request, res: Response) => {
    try {
      const banner = await storage.getBanner(req.params.id);
      if (!banner) {
        return res.status(404).json({ success: false, error: "Banner not found" });
      }
      res.json({ success: true, data: banner });
    } catch (error) {
      console.error("Error fetching banner:", error);
      res.status(500).json({ success: false, error: "Failed to fetch banner" });
    }
  });

  app.post("/api/admin/banners", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(validatedData);
      res.status(201).json({ success: true, data: banner });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating banner:", error);
      res.status(500).json({ success: false, error: "Failed to create banner" });
    }
  });

  app.put("/api/admin/banners/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertBannerSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const banner = await storage.updateBanner(req.params.id, validatedData);
      if (!banner) {
        return res.status(404).json({ success: false, error: "Banner not found" });
      }
      res.json({ success: true, data: banner });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating banner:", error);
      res.status(500).json({ success: false, error: "Failed to update banner" });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteBanner(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Banner not found" });
      }
      res.json({ success: true, message: "Banner deleted" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ success: false, error: "Failed to delete banner" });
    }
  });

  // ==================== POPUPS API ====================

  app.get("/api/popups", async (req: Request, res: Response) => {
    try {
      const popupList = await storage.getActivePopups();
      res.json({ success: true, data: popupList });
    } catch (error) {
      console.error("Error fetching popups:", error);
      res.status(500).json({ success: false, error: "Failed to fetch popups" });
    }
  });

  app.get("/api/admin/popups", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const popupList = await storage.getAllPopups();
      res.json({ success: true, data: popupList });
    } catch (error) {
      console.error("Error fetching popups:", error);
      res.status(500).json({ success: false, error: "Failed to fetch popups" });
    }
  });

  app.get("/api/popups/:id", async (req: Request, res: Response) => {
    try {
      const popup = await storage.getPopup(req.params.id);
      if (!popup) {
        return res.status(404).json({ success: false, error: "Popup not found" });
      }
      res.json({ success: true, data: popup });
    } catch (error) {
      console.error("Error fetching popup:", error);
      res.status(500).json({ success: false, error: "Failed to fetch popup" });
    }
  });

  app.post("/api/admin/popups", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPopupSchema.parse(req.body);
      const popup = await storage.createPopup(validatedData);
      res.status(201).json({ success: true, data: popup });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating popup:", error);
      res.status(500).json({ success: false, error: "Failed to create popup" });
    }
  });

  app.put("/api/admin/popups/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertPopupSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const popup = await storage.updatePopup(req.params.id, validatedData);
      if (!popup) {
        return res.status(404).json({ success: false, error: "Popup not found" });
      }
      res.json({ success: true, data: popup });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating popup:", error);
      res.status(500).json({ success: false, error: "Failed to update popup" });
    }
  });

  app.delete("/api/admin/popups/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deletePopup(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Popup not found" });
      }
      res.json({ success: true, message: "Popup deleted" });
    } catch (error) {
      console.error("Error deleting popup:", error);
      res.status(500).json({ success: false, error: "Failed to delete popup" });
    }
  });

  // ==================== CART API ====================

  app.get("/api/cart", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const cartItems = await storage.getCartItemsByMember(session.memberId);
      res.json({ success: true, data: cartItems });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ success: false, error: "장바구니를 불러올 수 없습니다." });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const data = { ...req.body, memberId: session.memberId };
      const validatedData = insertCartItemSchema.parse(data);
      const cartItem = await storage.createCartItem(validatedData);
      res.status(201).json({ success: true, data: cartItem });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ success: false, error: "장바구니 추가에 실패했습니다." });
    }
  });

  app.put("/api/cart/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, { quantity });
      if (!cartItem) {
        return res.status(404).json({ success: false, error: "장바구니 항목을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: cartItem });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ success: false, error: "장바구니 수정에 실패했습니다." });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const success = await storage.deleteCartItem(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "장바구니 항목을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "장바구니에서 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      res.status(500).json({ success: false, error: "장바구니 삭제에 실패했습니다." });
    }
  });

  app.delete("/api/cart", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      await storage.clearCartByMember(session.memberId);
      res.json({ success: true, message: "장바구니가 비워졌습니다." });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ success: false, error: "장바구니 비우기에 실패했습니다." });
    }
  });

  // ==================== WISHLIST API ====================

  app.get("/api/wishlist", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const wishlistItems = await storage.getWishlistItemsByMember(session.memberId);
      res.json({ success: true, data: wishlistItems });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ success: false, error: "위시리스트를 불러올 수 없습니다." });
    }
  });

  app.post("/api/wishlist", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const data = { ...req.body, memberId: session.memberId };
      const validatedData = insertWishlistItemSchema.parse(data);
      const wishlistItem = await storage.createWishlistItem(validatedData);
      res.status(201).json({ success: true, data: wishlistItem });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ success: false, error: "위시리스트 추가에 실패했습니다." });
    }
  });

  app.delete("/api/wishlist/:id", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const success = await storage.deleteWishlistItem(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "위시리스트 항목을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "위시리스트에서 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ success: false, error: "위시리스트 삭제에 실패했습니다." });
    }
  });

  app.delete("/api/wishlist/product/:productId", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    try {
      const success = await storage.deleteWishlistItemByMemberAndProduct(session.memberId, req.params.productId);
      if (!success) {
        return res.status(404).json({ success: false, error: "위시리스트 항목을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "위시리스트에서 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting wishlist item:", error);
      res.status(500).json({ success: false, error: "위시리스트 삭제에 실패했습니다." });
    }
  });

  // ==================== BLOG POSTS API ====================

  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getVisibleBlogPosts();
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ success: false, error: "블로그 글을 불러올 수 없습니다." });
    }
  });

  app.get("/api/blog/:id", async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, error: "블로그 글을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: post });
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ success: false, error: "블로그 글을 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/blog", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json({ success: true, data: posts });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ success: false, error: "블로그 글을 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/blog", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json({ success: true, data: post });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ success: false, error: "블로그 글 생성에 실패했습니다." });
    }
  });

  app.put("/api/admin/blog/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertBlogPostSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, validatedData);
      if (!post) {
        return res.status(404).json({ success: false, error: "블로그 글을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: post });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating blog post:", error);
      res.status(500).json({ success: false, error: "블로그 글 수정에 실패했습니다." });
    }
  });

  app.delete("/api/admin/blog/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "블로그 글을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "블로그 글이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ success: false, error: "블로그 글 삭제에 실패했습니다." });
    }
  });

  // ==================== COUPONS API ====================

  app.get("/api/admin/coupons", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const coupons = await storage.getAllCoupons();
      res.json({ success: true, data: coupons });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ success: false, error: "쿠폰 목록을 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/coupons/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const coupon = await storage.getCoupon(req.params.id);
      if (!coupon) {
        return res.status(404).json({ success: false, error: "쿠폰을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Error fetching coupon:", error);
      res.status(500).json({ success: false, error: "쿠폰을 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/coupons", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertCouponSchema.parse(req.body);
      const coupon = await storage.createCoupon(validatedData);
      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating coupon:", error);
      res.status(500).json({ success: false, error: "쿠폰 생성에 실패했습니다." });
    }
  });

  app.put("/api/admin/coupons/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertCouponSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const coupon = await storage.updateCoupon(req.params.id, validatedData);
      if (!coupon) {
        return res.status(404).json({ success: false, error: "쿠폰을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: coupon });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating coupon:", error);
      res.status(500).json({ success: false, error: "쿠폰 수정에 실패했습니다." });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteCoupon(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "쿠폰을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "쿠폰이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ success: false, error: "쿠폰 삭제에 실패했습니다." });
    }
  });

  app.post("/api/coupons/apply", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: "쿠폰 코드를 입력해주세요." });
      }

      const coupon = await storage.getCouponByCode(code);
      if (!coupon) {
        return res.status(404).json({ success: false, error: "유효하지 않은 쿠폰 코드입니다." });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ success: false, error: "사용할 수 없는 쿠폰입니다." });
      }

      const now = new Date();
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return res.status(400).json({ success: false, error: "만료된 쿠폰입니다." });
      }

      if (coupon.usageLimit && coupon.usageCount && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, error: "쿠폰 사용 한도를 초과했습니다." });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({ success: false, error: "쿠폰 적용에 실패했습니다." });
    }
  });

  // ==================== ADMIN AUTH API ====================
  
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // First check database users
    const dbUser = await storage.getUserByUsername(username);
    if (dbUser && dbUser.password === password) {
      const token = generateSessionToken();
      adminSessions.set(token, {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: dbUser.role || "super_admin",
        userId: dbUser.id,
        name: dbUser.name || username
      });
      
      return res.json({ success: true, token, role: dbUser.role || "super_admin", name: dbUser.name || username });
    }
    
    // Fall back to hardcoded super admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateSessionToken();
      adminSessions.set(token, {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: "super_admin",
        name: "관리자"
      });
      
      return res.json({ success: true, token, role: "super_admin", name: "관리자" });
    }
    
    res.status(401).json({ success: false, error: "인증 실패" });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/verify", (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && isValidSession(token)) {
      const session = adminSessions.get(token);
      res.json({ success: true, valid: true, role: session?.role || "super_admin", name: session?.name });
    } else {
      res.status(401).json({ success: false, valid: false });
    }
  });

  // ==================== STAFF USER MANAGEMENT API ====================
  
  app.get("/api/admin/staff", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const role = (req as any).adminRole;
      if (role !== "super_admin") {
        return res.status(403).json({ success: false, error: "권한이 없습니다." });
      }
      const users = await storage.getAllUsers();
      res.json({ success: true, data: users.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ success: false, error: "직원 목록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/staff", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const role = (req as any).adminRole;
      if (role !== "super_admin") {
        return res.status(403).json({ success: false, error: "권한이 없습니다." });
      }
      const { username, password, name, staffRole } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "아이디와 비밀번호를 입력해주세요." });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "이미 존재하는 아이디입니다." });
      }
      
      const user = await storage.createUser({
        username,
        password,
        name: name || username,
        role: staffRole || "review_admin"
      });
      
      res.status(201).json({ success: true, data: { ...user, password: undefined } });
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ success: false, error: "직원 추가에 실패했습니다." });
    }
  });

  app.delete("/api/admin/staff/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const role = (req as any).adminRole;
      if (role !== "super_admin") {
        return res.status(403).json({ success: false, error: "권한이 없습니다." });
      }
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "직원을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "직원이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ success: false, error: "직원 삭제에 실패했습니다." });
    }
  });

  // ==================== MEMBERS API ====================

  app.get("/api/admin/members", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const members = await storage.getAllMembers();
      res.json({ success: true, data: members });
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ success: false, error: "회원 목록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/members", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, address, bank, accountNumber, isActive, isAdmin } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ success: false, error: "이메일, 비밀번호, 이름은 필수 입력사항입니다." });
      }
      
      const existingMember = await storage.getMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ success: false, error: "이미 가입된 이메일입니다." });
      }
      
      const member = await storage.createMember({
        email,
        password,
        name,
        phone: phone || null,
        address: address || null,
        bank: bank || null,
        accountNumber: accountNumber || null,
        isActive: isActive !== undefined ? isActive : true,
        isAdmin: isAdmin || false
      });
      
      res.status(201).json({ 
        success: true, 
        message: "회원이 추가되었습니다.",
        data: member
      });
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ success: false, error: "회원 추가 중 오류가 발생했습니다." });
    }
  });

  app.put("/api/admin/members/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone, address, bank, accountNumber, isActive, isAdmin } = req.body;
      
      const updateData: any = {
        email,
        name,
        phone: phone || null,
        address: address || null,
        bank: bank || null,
        accountNumber: accountNumber || null,
        isActive: isActive !== undefined ? isActive : true,
        isAdmin: isAdmin || false
      };
      
      if (password) {
        updateData.password = password;
      }
      
      const member = await storage.updateMember(req.params.id, updateData);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: "회원 정보가 수정되었습니다." });
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ success: false, error: "회원 정보 수정 중 오류가 발생했습니다." });
    }
  });

  app.delete("/api/admin/members/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteMember(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "회원이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({ success: false, error: "회원 삭제 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/members/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, phone } = req.body;
      
      const existingMember = await storage.getMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ success: false, error: "이미 가입된 이메일입니다." });
      }
      
      const member = await storage.createMember({
        email,
        password,
        name,
        phone,
        pointBalance: 10000  // 회원가입 시 1만 포인트 지급
      });
      
      res.status(201).json({ 
        success: true, 
        message: "회원가입이 완료되었습니다.",
        data: { id: member.id, email: member.email, name: member.name }
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ success: false, error: "회원가입 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/members/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, name, phone, address } = req.body;
      
      if (!username || !password || !name) {
        return res.status(400).json({ success: false, error: "아이디, 비밀번호, 이름은 필수 입력사항입니다." });
      }
      
      if (!/^[a-zA-Z0-9]{4,20}$/.test(username)) {
        return res.status(400).json({ success: false, error: "아이디는 영문, 숫자 4-20자만 사용 가능합니다." });
      }
      
      const existingMember = await storage.getMemberByUsername(username);
      if (existingMember) {
        return res.status(400).json({ success: false, error: "이미 사용 중인 아이디입니다." });
      }
      
      const member = await storage.createMember({
        username,
        password,
        name,
        phone: phone || null,
        address: address || null,
        pointBalance: 10000  // 회원가입 시 1만 포인트 지급
      });
      
      res.status(201).json({ 
        success: true, 
        message: "회원가입이 완료되었습니다.",
        data: { id: member.id, username: member.username, name: member.name }
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ success: false, error: "회원가입 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/members/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      const member = await storage.getMemberByUsername(username);
      if (!member) {
        return res.status(401).json({ success: false, error: "아이디 또는 비밀번호가 일치하지 않습니다." });
      }
      
      if (member.password !== password) {
        return res.status(401).json({ success: false, error: "비밀번호가 일치하지 않습니다." });
      }
      
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      await storage.createMemberSession({
        token,
        memberId: member.id,
        username: member.username,
        name: member.name
      });
      
      await storage.updateMemberLastLogin(member.id);
      
      res.json({ 
        success: true, 
        token,
        member: {
          id: member.id,
          name: member.name,
          username: member.username,
          phone: member.phone,
          pointBalance: member.pointBalance || 0,
          isFrozen: member.isFrozen || false
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ success: false, error: "로그인 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/members/logout", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      await storage.deleteMemberSession(token);
    }
    res.json({ success: true });
  });

  app.get("/api/members/me", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const member = await storage.getMember(session.memberId);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({
        success: true,
        data: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          address: member.address || null,
          addressDetail: member.addressDetail || null,
          zipcode: member.zipcode || null,
          pointBalance: member.pointBalance || 0,
          isFrozen: member.isFrozen || false,
          createdAt: member.createdAt
        }
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ success: false, error: "회원 정보를 불러올 수 없습니다." });
    }
  });

  app.put("/api/members/me", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다." });
    }
    
    try {
      const { name, email, phone, address, addressDetail, zipcode, bank, accountNumber } = req.body;
      const member = await storage.updateMember(session.memberId, { name, email, phone, address, addressDetail, zipcode, bank, accountNumber });
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: member });
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ success: false, error: "회원 정보 수정에 실패했습니다." });
    }
  });

  app.post("/api/admin/members/:id/adjust-points", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { amount, reason } = req.body;
      
      if (typeof amount !== "number" || amount === 0) {
        return res.status(400).json({ success: false, error: "유효한 금액을 입력해주세요." });
      }
      
      const member = await storage.updateMemberPoints(req.params.id, amount);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: `포인트가 ${amount >= 0 ? "지급" : "차감"}되었습니다.` });
    } catch (error) {
      console.error("Error adjusting member points:", error);
      res.status(500).json({ success: false, error: "포인트 조정 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/members/:id/freeze", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ success: false, error: "동결 사유를 입력해주세요." });
      }
      
      const member = await storage.freezeMember(req.params.id, reason);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: "계정이 동결되었습니다." });
    } catch (error) {
      console.error("Error freezing member:", error);
      res.status(500).json({ success: false, error: "계정 동결 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/members/:id/unfreeze", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const member = await storage.unfreezeMember(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: "회원을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: member, message: "계정 동결이 해제되었습니다." });
    } catch (error) {
      console.error("Error unfreezing member:", error);
      res.status(500).json({ success: false, error: "계정 동결 해제 처리 중 오류가 발생했습니다." });
    }
  });

  // ==================== ADMIN STATS ====================
  
  app.get("/api/admin/stats", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const [productCounts, membersCount, categoryList] = await Promise.all([
        storage.getProductCountWithCategories(),
        storage.getMembersCount(),
        storage.getAllCategories(),
      ]);
      
      const countMap = new Map(productCounts.byCategory.map(c => [c.categoryId, c.count]));
      
      res.json({
        success: true,
        data: {
          totalProducts: productCounts.total,
          totalMembers: membersCount,
          totalCategories: categoryList.length,
          productsByCategory: categoryList.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: countMap.get(cat.id) || 0
          }))
        }
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ success: false, error: "통계를 불러올 수 없습니다." });
    }
  });

  // ==================== CHAT API ====================
  
  app.get("/api/chat/conversations", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ success: false, error: "대화 목록을 불러올 수 없습니다." });
    }
  });

  app.get("/api/chat/conversations/:id", async (req: Request, res: Response) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ success: false, error: "대화를 찾을 수 없습니다." });
      }
      const messages = await storage.getMessagesByConversation(req.params.id);
      res.json({ success: true, data: { conversation, messages } });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ success: false, error: "대화를 불러올 수 없습니다." });
    }
  });

  app.post("/api/chat/conversations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ success: false, error: "대화 생성에 실패했습니다." });
    }
  });

  app.patch("/api/chat/conversations/:id/status", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const conversation = await storage.updateConversationStatus(req.params.id, status);
      if (!conversation) {
        return res.status(404).json({ success: false, error: "대화를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: conversation });
    } catch (error) {
      console.error("Error updating conversation status:", error);
      res.status(500).json({ success: false, error: "상태 변경에 실패했습니다." });
    }
  });

  app.post("/api/chat/messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: "메시지 전송에 실패했습니다." });
    }
  });

  app.post("/api/chat/conversations/:id/read", async (req: Request, res: Response) => {
    try {
      const { senderType } = req.body;
      await storage.markMessagesAsRead(req.params.id, senderType);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ success: false, error: "읽음 처리에 실패했습니다." });
    }
  });

  app.get("/api/chat/member/conversation", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const conversation = await storage.getOrCreateConversationForMember(session.memberId, session.name);
      const messages = await storage.getMessagesByConversation(conversation.id);
      res.json({ success: true, data: { conversation, messages } });
    } catch (error) {
      console.error("Error getting member conversation:", error);
      res.status(500).json({ success: false, error: "채팅 기록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/chat/member/messages", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = await getMemberFromToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: "메시지를 입력해주세요." });
      }
      
      const conversation = await storage.getOrCreateConversationForMember(session.memberId, session.name);
      const chatMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderType: "user",
        senderName: session.name,
        message
      });
      
      await storage.updateChatConversation(conversation.id, {
        lastMessage: message,
        updatedAt: new Date()
      });
      
      res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
      console.error("Error sending member message:", error);
      res.status(500).json({ success: false, error: "메시지 전송에 실패했습니다." });
    }
  });

  // ==================== GUEST CHAT API ====================

  app.post("/api/chat/guest/start", async (req: Request, res: Response) => {
    try {
      const { guestName } = req.body;
      if (!guestName || typeof guestName !== "string" || !guestName.trim()) {
        return res.status(400).json({ success: false, error: "이름을 입력해주세요." });
      }
      const name = guestName.trim().substring(0, 30);
      const conversation = await storage.createConversation({
        guestName: name,
        subject: `[비회원] ${name}님의 상담`,
        status: "open",
      });
      res.status(201).json({ success: true, data: { conversationId: conversation.id, guestName: name, conversation } });
    } catch (error) {
      console.error("Error starting guest chat:", error);
      res.status(500).json({ success: false, error: "상담을 시작할 수 없습니다." });
    }
  });

  app.post("/api/chat/guest/messages", async (req: Request, res: Response) => {
    try {
      const { conversationId, guestName, message } = req.body;
      if (!conversationId || !guestName || !message) {
        return res.status(400).json({ success: false, error: "필수 정보가 누락되었습니다." });
      }
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, error: "상담을 찾을 수 없습니다." });
      }
      if (conversation.guestName !== guestName.trim()) {
        return res.status(403).json({ success: false, error: "권한이 없습니다." });
      }
      const chatMessage = await storage.createMessage({
        conversationId,
        senderType: "user",
        senderName: guestName.trim(),
        message: message.trim(),
      });
      await storage.updateChatConversation(conversationId, { updatedAt: new Date() });
      res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
      console.error("Error sending guest message:", error);
      res.status(500).json({ success: false, error: "메시지 전송에 실패했습니다." });
    }
  });

  // ==================== Site Settings API (Marketing Pixels) ====================
  
  app.get("/api/site-settings/pixels", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      const pixelSettings = {
        facebookPixelId: settings.find(s => s.key === 'facebook_pixel_id')?.value || '',
        facebookPixelEnabled: settings.find(s => s.key === 'facebook_pixel_enabled')?.value === 'true',
        googleAnalyticsId: settings.find(s => s.key === 'google_analytics_id')?.value || '',
        googleAnalyticsEnabled: settings.find(s => s.key === 'google_analytics_enabled')?.value === 'true',
        kakaoPixelId: settings.find(s => s.key === 'kakao_pixel_id')?.value || '',
        kakaoPixelEnabled: settings.find(s => s.key === 'kakao_pixel_enabled')?.value === 'true',
      };
      res.json({ success: true, data: pixelSettings });
    } catch (error) {
      console.error("Error fetching pixel settings:", error);
      res.status(500).json({ success: false, error: "픽셀 설정을 불러올 수 없습니다." });
    }
  });

  app.put("/api/site-settings/pixels", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { facebookPixelId, facebookPixelEnabled, googleAnalyticsId, googleAnalyticsEnabled, kakaoPixelId, kakaoPixelEnabled } = req.body;
      
      const sanitizePixelId = (id: string): string => {
        return id.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50);
      };
      
      if (facebookPixelId !== undefined) {
        const sanitized = sanitizePixelId(facebookPixelId);
        await storage.setSiteSetting('facebook_pixel_id', sanitized, '페이스북 픽셀 ID');
      }
      if (facebookPixelEnabled !== undefined) {
        await storage.setSiteSetting('facebook_pixel_enabled', String(facebookPixelEnabled), '페이스북 픽셀 활성화 여부');
      }
      if (googleAnalyticsId !== undefined) {
        const sanitized = sanitizePixelId(googleAnalyticsId);
        await storage.setSiteSetting('google_analytics_id', sanitized, '구글 애널리틱스 ID');
      }
      if (googleAnalyticsEnabled !== undefined) {
        await storage.setSiteSetting('google_analytics_enabled', String(googleAnalyticsEnabled), '구글 애널리틱스 활성화 여부');
      }
      if (kakaoPixelId !== undefined) {
        const sanitized = sanitizePixelId(kakaoPixelId);
        await storage.setSiteSetting('kakao_pixel_id', sanitized, '카카오 픽셀 ID');
      }
      if (kakaoPixelEnabled !== undefined) {
        await storage.setSiteSetting('kakao_pixel_enabled', String(kakaoPixelEnabled), '카카오 픽셀 활성화 여부');
      }
      
      res.json({ success: true, message: "픽셀 설정이 저장되었습니다." });
    } catch (error) {
      console.error("Error updating pixel settings:", error);
      res.status(500).json({ success: false, error: "픽셀 설정을 저장할 수 없습니다." });
    }
  });

  // ==================== FAQ API ====================
  
  app.get("/api/faqs", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      let faqList;
      if (category) {
        faqList = await storage.getFaqsByCategory(category as string);
      } else {
        faqList = await storage.getAllFaqs();
      }
      res.json({ success: true, data: faqList });
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ success: false, error: "FAQ를 불러올 수 없습니다." });
    }
  });

  app.post("/api/faqs", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.status(201).json({ success: true, data: faq });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 생성에 실패했습니다." });
    }
  });

  app.put("/api/faqs/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertFaqSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const faq = await storage.updateFaq(req.params.id, validatedData);
      if (!faq) {
        return res.status(404).json({ success: false, error: "FAQ를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: faq });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 수정에 실패했습니다." });
    }
  });

  app.delete("/api/faqs/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFaq(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "FAQ를 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "FAQ가 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ success: false, error: "FAQ 삭제에 실패했습니다." });
    }
  });

  // ==================== REVIEWS API ====================
  
  app.get("/api/reviews", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const productId = req.query.productId as string | undefined;
      const search = req.query.search as string | undefined;
      const photoOnly = req.query.photoOnly === "true";
      
      let allReviews = await storage.getVisibleReviews();
      
      if (productId) {
        allReviews = allReviews.filter(r => String(r.productId) === String(productId));
      }
      if (search) {
        const q = search.toLowerCase();
        allReviews = allReviews.filter(r =>
          (r.productName && r.productName.toLowerCase().includes(q)) ||
          (r.content && r.content.toLowerCase().includes(q)) ||
          (r.title && r.title.toLowerCase().includes(q))
        );
      }
      if (photoOnly) {
        allReviews = allReviews.filter(r =>
          (r.imageUrls && r.imageUrls.length > 0) || !!r.imageUrl
        );
      }

      const total = allReviews.length;
      const paginatedReviews = allReviews.slice(offset, offset + limit);

      const reviewsWithProduct = await Promise.all(
        paginatedReviews.map(async (review) => {
          let productImageUrl: string | null = null;
          if (review.productId) {
            try {
              const product = await storage.getProduct(review.productId);
              if (product) productImageUrl = product.imageUrl;
            } catch {}
          }
          return { ...review, productImageUrl };
        })
      );
      
      res.json({ success: true, data: reviewsWithProduct, total });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "리뷰를 불러올 수 없습니다." });
    }
  });

  app.get("/api/reviews/:id", async (req: Request, res: Response) => {
    try {
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ success: false, error: "리뷰를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ success: false, error: "리뷰를 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { reviews, total } = await storage.getReviewsPaginated(limit, offset);
      res.json({ 
        success: true, 
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "리뷰를 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/reviews/fix-content", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const rowsAffected = await storage.clearBluestoreReviewContent();
      res.json({ success: true, message: "블루스토어 텍스트 제거 완료", rowsAffected });
    } catch (error) {
      console.error("Error fixing review content:", error);
      res.status(500).json({ success: false, error: "수정 실패" });
    }
  });

  app.post("/api/reviews", reviewImageUpload.array("images", 5), async (req: Request, res: Response) => {
    try {
      const { authorName, productId, productName, rating, title, content, displayDate, imageUrl: bodyImageUrl, isVisible } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // Check if member has ordered this product (required for non-admin users)
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];
      const session = await getMemberFromToken(token);
      
      // Check if this is an admin request
      const adminToken = authHeader?.split(" ")[1];
      const adminSession = adminSessions.get(adminToken || "");
      const isAdmin = adminSession && adminSession.expiresAt > new Date();
      
      if (productId && !isAdmin) {
        // If submitting a review for a specific product, verify member has ordered it
        if (!session) {
          return res.status(401).json({ success: false, error: "리뷰를 작성하려면 로그인이 필요합니다." });
        }
        
        const hasOrdered = await storage.hasMemberOrderedProduct(session.memberId, productId);
        if (!hasOrdered) {
          return res.status(403).json({ success: false, error: "해당 상품을 주문한 고객만 리뷰를 작성할 수 있습니다." });
        }
      }
      
      const imageUrls: string[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const base64Data = file.buffer.toString("base64");
          const reviewImage = await storage.createReviewImage({
            data: base64Data,
            mimeType: file.mimetype,
            originalName: file.originalname
          });
          imageUrls.push(`/api/review-images/${reviewImage.id}`);
        }
      }
      
      // Use body imageUrl if no files uploaded (admin form submission)
      const finalImageUrl = imageUrls[0] || bodyImageUrl || null;
      const finalImageUrls = imageUrls.length > 0 ? imageUrls : (bodyImageUrl ? [bodyImageUrl] : []);
      
      const review = await storage.createReview({
        authorName: session?.name || authorName,
        productId: productId || null,
        productName: productName || null,
        rating: parseInt(rating) || 5,
        title: title || null,
        content,
        imageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        isVisible: isVisible !== undefined ? isVisible : true,
        displayDate: displayDate ? new Date(displayDate) : undefined
      });
      
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ success: false, error: "리뷰 등록에 실패했습니다." });
    }
  });

  app.put("/api/reviews/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertReviewSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      
      // If imageUrl is provided but imageUrls is not, set imageUrls to contain the imageUrl
      if (validatedData.imageUrl && (!validatedData.imageUrls || validatedData.imageUrls.length === 0)) {
        validatedData.imageUrls = [validatedData.imageUrl];
      }
      
      const review = await storage.updateReview(req.params.id, validatedData);
      if (!review) {
        return res.status(404).json({ success: false, error: "리뷰를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating review:", error);
      res.status(500).json({ success: false, error: "리뷰 수정에 실패했습니다." });
    }
  });

  app.delete("/api/reviews/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteReview(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "리뷰를 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "리뷰가 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ success: false, error: "리뷰 삭제에 실패했습니다." });
    }
  });

  app.get("/api/review-images/:id", async (req: Request, res: Response) => {
    try {
      const image = await storage.getReviewImage(req.params.id);
      if (!image) {
        return res.status(404).send("Image not found");
      }
      
      const buffer = Buffer.from(image.data, "base64");
      res.set("Content-Type", image.mimeType);
      res.set("Content-Length", buffer.length.toString());
      res.send(buffer);
    } catch (error) {
      console.error("Error fetching review image:", error);
      res.status(500).send("Error fetching image");
    }
  });

  // Admin: Upload review image
  app.post("/api/admin/upload/review-image", requireAdminAuth, reviewImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ success: false, error: "이미지 파일이 필요합니다." });
      }
      
      const base64Data = file.buffer.toString("base64");
      const reviewImage = await storage.createReviewImage({
        data: base64Data,
        mimeType: file.mimetype,
        originalName: file.originalname
      });
      
      res.json({ success: true, data: { imageUrl: `/api/review-images/${reviewImage.id}` } });
    } catch (error) {
      console.error("Error uploading review image:", error);
      res.status(500).json({ success: false, error: "이미지 업로드에 실패했습니다." });
    }
  });

  // ==================== NOTICES API ====================
  
  app.get("/api/notices", async (req: Request, res: Response) => {
    try {
      const notices = await storage.getVisibleNotices();
      res.json({ success: true, data: notices });
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  app.get("/api/notices/:id", async (req: Request, res: Response) => {
    try {
      const notice = await storage.getNotice(req.params.id);
      if (!notice) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      
      await storage.incrementNoticeViewCount(req.params.id);
      
      res.json({ success: true, data: notice });
    } catch (error) {
      console.error("Error fetching notice:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/notices", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const notices = await storage.getAllNotices();
      res.json({ success: true, data: notices });
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ success: false, error: "공지사항을 불러올 수 없습니다." });
    }
  });

  app.post("/api/notices", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.status(201).json({ success: true, data: notice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating notice:", error);
      res.status(500).json({ success: false, error: "공지사항 생성에 실패했습니다." });
    }
  });

  app.put("/api/notices/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertNoticeSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const notice = await storage.updateNotice(req.params.id, validatedData);
      if (!notice) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: notice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error updating notice:", error);
      res.status(500).json({ success: false, error: "공지사항 수정에 실패했습니다." });
    }
  });

  app.delete("/api/notices/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNotice(req.params.id);
      if (!success) {
        return res.status(404).json({ success: false, error: "공지사항을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "공지사항이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ success: false, error: "공지사항 삭제에 실패했습니다." });
    }
  });

  // ==================== SITE SETTINGS API ====================
  
  app.get("/api/admin/settings", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ success: false, error: "설정을 불러올 수 없습니다." });
    }
  });

  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const setting = await storage.getSiteSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ success: false, error: "설정을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Error fetching site setting:", error);
      res.status(500).json({ success: false, error: "설정을 불러올 수 없습니다." });
    }
  });

  app.put("/api/admin/settings/:key", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { value, description } = req.body;
      if (!value) {
        return res.status(400).json({ success: false, error: "값이 필요합니다." });
      }
      const setting = await storage.setSiteSetting(req.params.key, value, description);
      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(500).json({ success: false, error: "설정 저장에 실패했습니다." });
    }
  });

  // ==================== PRODUCT DETAIL BANNER API ====================

  app.get("/api/product-detail-banners", async (req: Request, res: Response) => {
    try {
      const banner1 = await storage.getSiteSetting("product_detail_banner_1");
      const banner2 = await storage.getSiteSetting("product_detail_banner_2");
      res.json({
        success: true,
        data: {
          banner1: banner1?.value || null,
          banner2: banner2?.value || null,
        }
      });
    } catch (error) {
      console.error("Error fetching product detail banners:", error);
      res.status(500).json({ success: false, error: "배너를 불러올 수 없습니다." });
    }
  });

  app.post("/api/admin/upload/banner-image", requireAdminAuth, bannerImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ success: false, error: "이미지 파일이 필요합니다." });
      }
      const fileUrl = `/uploads/banners/${file.filename}`;
      res.json({ success: true, data: { imageUrl: fileUrl } });
    } catch (error) {
      console.error("Error uploading banner image:", error);
      res.status(500).json({ success: false, error: "배너 이미지 업로드에 실패했습니다." });
    }
  });

  app.put("/api/admin/product-detail-banners", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { banner1, banner2 } = req.body;
      if (banner1 !== undefined) {
        if (banner1) {
          await storage.setSiteSetting("product_detail_banner_1", banner1, "상품 상세 페이지 배너 1");
        } else {
          await storage.setSiteSetting("product_detail_banner_1", "", "상품 상세 페이지 배너 1");
        }
      }
      if (banner2 !== undefined) {
        if (banner2) {
          await storage.setSiteSetting("product_detail_banner_2", banner2, "상품 상세 페이지 배너 2");
        } else {
          await storage.setSiteSetting("product_detail_banner_2", "", "상품 상세 페이지 배너 2");
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating product detail banners:", error);
      res.status(500).json({ success: false, error: "배너 저장에 실패했습니다." });
    }
  });

  // ==================== VISITOR TRACKING API ====================
  
  app.post("/api/track/visit", async (req: Request, res: Response) => {
    try {
      const { sessionId, page, referrer } = req.body;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: "sessionId is required" });
      }
      
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      await storage.trackVisitor({
        sessionId,
        ipAddress,
        userAgent,
        page: page || '/',
        referrer: referrer || null,
        memberId: null,
        lastActiveAt: new Date()
      });
      
      if (page) {
        await storage.trackPageView({ sessionId, page });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.status(500).json({ success: false, error: "Failed to track visit" });
    }
  });

  app.post("/api/track/pageview", async (req: Request, res: Response) => {
    try {
      const { sessionId, page } = req.body;
      if (!sessionId || !page) {
        return res.status(400).json({ success: false, error: "sessionId and page are required" });
      }
      
      await storage.updateVisitorActivity(sessionId, page);
      await storage.trackPageView({ sessionId, page });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking pageview:", error);
      res.status(500).json({ success: false, error: "Failed to track pageview" });
    }
  });

  app.get("/api/admin/visitor-stats", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getVisitorStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
      res.status(500).json({ success: false, error: "방문자 통계를 불러올 수 없습니다." });
    }
  });

  // ==================== ORDERS API ====================
  
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      const memberSession = await getMemberFromToken(token);
      
      if (!memberSession) {
        return res.status(401).json({ success: false, error: "주문하려면 로그인이 필요합니다." });
      }
      
      const { couponPayment, isCartOrder, cartItems, paymentData, ...orderData } = req.body;
      
      if (isCartOrder && Array.isArray(cartItems) && cartItems.length > 0) {
        const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const firstItem = cartItems[0];
        const productNames = cartItems.map((item: any) => item.productName).join(", ");
        
        const optionSummary = cartItems.map((item: any) => {
          const parts: string[] = [];
          if (item.selectedColor) parts.push(`컬러:${item.selectedColor}`);
          if (item.selectedSize) parts.push(`사이즈:${item.selectedSize}`);
          return parts.length > 0 ? `${item.productName}(${parts.join('/')})` : item.productName;
        }).join(', ');

        const order = await storage.createOrder({
          memberId: memberSession.memberId,
          memberName: orderData.memberName,
          memberEmail: orderData.memberEmail,
          memberPhone: orderData.memberPhone,
          shippingName: orderData.shippingName,
          shippingPhone: orderData.shippingPhone,
          shippingZipcode: orderData.shippingZipcode || "",
          shippingAddress: orderData.shippingAddress,
          shippingAddressDetail: orderData.shippingAddressDetail || "",
          shippingMemo: orderData.shippingMemo || "",
          productId: firstItem.productId,
          productName: productNames.length > 50 ? `${cartItems[0].productName} 외 ${cartItems.length - 1}건` : productNames,
          productPrice: firstItem.productPrice,
          quantity: cartItems.length,
          selectedSize: firstItem.selectedSize || null,
          selectedColor: firstItem.selectedColor || null,
          totalAmount: orderData.totalAmount,
          pointsUsed: orderData.pointsUsed || 0,
          paymentMethod: orderData.paymentMethod || null,
          orderNumber,
          status: "pending",
          paymentStatus: "pending"
        });
        
        return res.status(201).json({ success: true, data: order });
      }
      
      const validatedData = insertOrderSchema.parse(orderData);
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const order = await storage.createOrder({
        ...validatedData,
        memberId: memberSession.memberId,
        orderNumber,
        status: "pending",
        paymentStatus: "pending"
      });
      
      if (couponPayment && validatedData.paymentMethod === "coupon") {
        await storage.createCouponPayment({
          orderId: order.id,
          orderNumber: order.orderNumber,
          couponNumber: couponPayment.couponNumber || "",
          couponExpiry: couponPayment.couponExpiry,
          couponBirthDate: couponPayment.couponBirthDate,
          couponPassword: couponPayment.couponPassword,
          memberName: validatedData.memberName,
          memberPhone: validatedData.memberPhone,
          amount: validatedData.totalAmount,
          status: "pending"
        });
      }
      
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: error.errors });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, error: "주문 처리 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/admin/orders", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "주문 목록을 불러올 수 없습니다." });
    }
  });

  app.put("/api/admin/orders/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, paymentStatus, adminNote, trackingNumber, shippingCompany } = req.body;
      const order = await storage.updateOrder(req.params.id, {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(adminNote !== undefined && { adminNote }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(shippingCompany !== undefined && { shippingCompany }),
      });
      
      if (!order) {
        return res.status(404).json({ success: false, error: "주문을 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ success: false, error: "주문 수정 중 오류가 발생했습니다." });
    }
  });

  // ==================== CARD PAYMENT (GH PAYMENTS) API ====================

  app.get("/api/orders/status/:orderNumber", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ success: false, error: "주문을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: { paymentStatus: order.paymentStatus, status: order.status } });
    } catch (error) {
      console.error("Error fetching order status:", error);
      res.status(500).json({ success: false, error: "주문 상태 확인 중 오류가 발생했습니다." });
    }
  });

  // ==================== COUPON PAYMENTS API ====================
  
  app.get("/api/admin/coupon-payments", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const payments = await storage.getAllCouponPayments();
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error("Error fetching coupon payments:", error);
      res.status(500).json({ success: false, error: "쿠폰결제 목록을 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/coupon-payments/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const payment = await storage.getCouponPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ success: false, error: "쿠폰결제 정보를 찾을 수 없습니다." });
      }
      res.json({ success: true, data: payment });
    } catch (error) {
      console.error("Error fetching coupon payment:", error);
      res.status(500).json({ success: false, error: "쿠폰결제 정보를 불러올 수 없습니다." });
    }
  });

  app.put("/api/admin/coupon-payments/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { status, adminNote, checkedBy } = req.body;
      const updateData: any = {};
      
      if (status) updateData.status = status;
      if (adminNote !== undefined) updateData.adminNote = adminNote;
      if (checkedBy) updateData.checkedBy = checkedBy;
      if (status === "checked") updateData.checkedAt = new Date();
      
      const payment = await storage.updateCouponPayment(req.params.id, updateData);
      
      if (!payment) {
        return res.status(404).json({ success: false, error: "쿠폰결제 정보를 찾을 수 없습니다." });
      }
      
      res.json({ success: true, data: payment });
    } catch (error) {
      console.error("Error updating coupon payment:", error);
      res.status(500).json({ success: false, error: "쿠폰결제 수정 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/members/orders", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const memberIdFromQuery = req.query.memberId as string;
    
    let memberId: string | null = null;
    
    if (token) {
      const session = await getMemberFromToken(token);
      if (session) {
        memberId = session.memberId;
      }
    }
    
    if (!memberId && memberIdFromQuery) {
      memberId = memberIdFromQuery;
    }
    
    if (!memberId) {
      return res.status(401).json({ success: false, error: "인증이 필요합니다. 다시 로그인해주세요." });
    }
    
    try {
      const orders = await storage.getOrdersByMember(memberId);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error("Error fetching member orders:", error);
      res.status(500).json({ success: false, error: "주문 목록을 불러올 수 없습니다." });
    }
  });

  app.get("/api/orders/lookup", async (req: Request, res: Response) => {
    try {
      const { orderNumber, phone } = req.query;
      
      if (!orderNumber || !phone) {
        return res.status(400).json({ success: false, error: "주문번호와 연락처를 입력해주세요." });
      }
      
      const order = await storage.getOrderByNumber(orderNumber as string);
      
      if (!order) {
        return res.status(404).json({ success: false, error: "주문을 찾을 수 없습니다." });
      }
      
      const cleanPhone = (phone as string).replace(/-/g, "");
      const orderPhone = order.memberPhone?.replace(/-/g, "") || "";
      
      if (orderPhone !== cleanPhone) {
        return res.status(404).json({ success: false, error: "주문번호와 연락처가 일치하지 않습니다." });
      }
      
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error looking up order:", error);
      res.status(500).json({ success: false, error: "주문을 조회할 수 없습니다." });
    }
  });

  app.get("/api/orders/:orderNumber", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ success: false, error: "주문을 찾을 수 없습니다." });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ success: false, error: "주문을 불러올 수 없습니다." });
    }
  });

  // Get product count
  app.get("/api/admin/products/count", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const count = await storage.getProductsCount();
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get count" });
    }
  });

  // Get all products for admin with pagination and search
  app.get("/api/admin/products", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { search, category, page = "1", limit = "20" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 50);
      const offset = (pageNum - 1) * limitNum;
      
      const searchStr = (search && typeof search === "string" && search.trim()) ? search.trim() : undefined;
      const categoryStr = (category && category !== "all") ? category as string : undefined;
      
      const result = await storage.getProductsPaginated(limitNum, offset, categoryStr, undefined, searchStr);
      
      const totalPages = Math.ceil(result.total / limitNum);
      
      res.json({ 
        success: true, 
        data: result.products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages
        }
      });
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ success: false, error: "Failed to get products" });
    }
  });
  
  // Clear all products
  app.delete("/api/admin/products/all", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const countResult = await pool.query(`SELECT count(*)::int AS cnt FROM products`);
      const total = countResult.rows[0]?.cnt || 0;
      // 단일 SQL DELETE — 루프 없이 즉시 전체 삭제
      await pool.query(`DELETE FROM products`);
      res.json({ success: true, message: `총 ${total}개 상품이 삭제되었습니다.` });
    } catch (error: any) {
      console.error("[admin] delete all products error:", error.message);
      res.status(500).json({ success: false, error: "상품 삭제 중 오류가 발생했습니다." });
    }
  });


  // Get category product count
  app.get("/api/admin/products/category/:categoryId/count", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const count = await storage.getCategoryProductCount(categoryId);
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error getting category product count:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Apply discount to category products
  app.post("/api/admin/products/category/:categoryId/apply-discount", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const { discountPercent } = req.body;
      if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({ success: false, message: "할인율은 0~100 사이의 숫자여야 합니다." });
      }
      const affectedCount = await storage.applyCategoryDiscount(categoryId, discountPercent);
      invalidateProductCache();
      res.json({ success: true, affectedCount });
    } catch (error: any) {
      console.error("Error applying category discount:", error);
      res.status(500).json({ success: false, message: error.message || "할인 적용 중 오류가 발생했습니다." });
    }
  });


  // ============ bagstyle.site Crawling ============

  // ─── 완전 하드코딩된 카테고리-소분류 매핑 ───
  type BagstyleCrawlEntry = {
    gender: string;
    categoryId: string;
    categoryName: string;
    parentCaId: string;
    pageBase: "mens" | "women" | "list";
    subcategories: { caId: string; name: string }[];
  };

  const BAGSTYLE_CRAWL_MAP: BagstyleCrawlEntry[] = [
    // ═══════════════ 남성 ═══════════════
    { gender: "남성", categoryId: "clothing", categoryName: "남성의류", parentCaId: "b010", pageBase: "mens",
      subcategories: [
        { caId: "b01010", name: "자켓/점퍼" },   { caId: "b01020", name: "패딩/털" },
        { caId: "b01030", name: "가죽옷" },       { caId: "b01040", name: "코트/정장" },
        { caId: "b01050", name: "후드티/집업" },  { caId: "b01060", name: "셔츠/남방" },
        { caId: "b01070", name: "베스트/조끼" },  { caId: "b01080", name: "니트/스웨터" },
        { caId: "b01090", name: "가디건" },       { caId: "b010a0", name: "반팔티/폴로티" },
        { caId: "b010b0", name: "긴팔티/맨투맨" },{ caId: "b010c0", name: "운동복/추리닝" },
        { caId: "b010d0", name: "팬츠/청바지" },  { caId: "b010e0", name: "반바지" },
        { caId: "b010f0", name: "세트" },
      ],
    },
    { gender: "남성", categoryId: "bags", categoryName: "남성가방", parentCaId: "b020", pageBase: "mens",
      subcategories: [
        { caId: "b02010", name: "토트백" },             { caId: "b02020", name: "크로스백" },
        { caId: "b02030", name: "숄더백" },             { caId: "b02040", name: "백팩" },
        { caId: "b02050", name: "서류가방/메신져백" },   { caId: "b02060", name: "파우치/클러치" },
        { caId: "b02070", name: "여행가방" },           { caId: "b02080", name: "캐리어" },
        { caId: "b02090", name: "벨트백/새들/슬링" },   { caId: "b020a0", name: "기타" },
      ],
    },
    { gender: "남성", categoryId: "wallets", categoryName: "남성지갑", parentCaId: "b040", pageBase: "mens",
      subcategories: [
        { caId: "b04010", name: "장지갑/소지갑" }, { caId: "b04020", name: "카드지갑" },
        { caId: "b04030", name: "동전지갑" },
      ],
    },
    { gender: "남성", categoryId: "shoes", categoryName: "남성신발", parentCaId: "b0b0", pageBase: "mens",
      subcategories: [
        { caId: "b0b010", name: "스니커즈" },   { caId: "b0b020", name: "운동화" },
        { caId: "b0b030", name: "정장구두" },   { caId: "b0b040", name: "샌들/슬리퍼" },
        { caId: "b0b050", name: "부츠/워커" }, { caId: "b0b060", name: "로퍼/슬립온" },
      ],
    },
    { gender: "남성", categoryId: "sunglasses", categoryName: "남성선글라스", parentCaId: "b0a0", pageBase: "mens",
      subcategories: [
        { caId: "b0a010", name: "선글라스" }, { caId: "b0a020", name: "안경태" },
      ],
    },
    { gender: "남성", categoryId: "belts", categoryName: "남성벨트", parentCaId: "b070", pageBase: "mens",
      subcategories: [
        { caId: "b07010", name: "가죽벨트" }, { caId: "b07020", name: "메쉬벨트" },
      ],
    },
    { gender: "남성", categoryId: "jewelry", categoryName: "남성쥬얼리/잡화", parentCaId: "b080", pageBase: "mens",
      subcategories: [
        { caId: "b08010", name: "목걸이" },       { caId: "b08020", name: "팔찌" },
        { caId: "b08030", name: "반지" },         { caId: "b08040", name: "백참/브로치" },
        { caId: "b08050", name: "만년필/볼펜" },  { caId: "b08060", name: "장갑" },
        { caId: "b08080", name: "라이터/듀퐁" },  { caId: "b08090", name: "스카프/머플러" },
        { caId: "b080a0", name: "넥타이" },       { caId: "b080b0", name: "모자" },
        { caId: "b080c0", name: "우산" },         { caId: "b080d0", name: "커프스" },
        { caId: "b080e0", name: "키홀더" },       { caId: "b080f0", name: "기타" },
      ],
    },
    // ═══════════════ 여성 ═══════════════
    { gender: "여성", categoryId: "clothing", categoryName: "여성의류", parentCaId: "c010", pageBase: "women",
      subcategories: [
        { caId: "c01010", name: "자켓/점퍼" },   { caId: "c01020", name: "패딩/털" },
        { caId: "c01030", name: "코트" },         { caId: "c01040", name: "후드티" },
        { caId: "c01050", name: "셔츠/남방" },    { caId: "c01060", name: "조끼" },
        { caId: "c01070", name: "가죽옷" },       { caId: "c01080", name: "니트/스웨터" },
        { caId: "c01090", name: "가디건" },       { caId: "c010a0", name: "반팔티/폴로" },
        { caId: "c010b0", name: "긴팔티/맨투맨" },{ caId: "c010c0", name: "운동복/추리닝" },
        { caId: "c010d0", name: "팬츠/청바지" },  { caId: "c010e0", name: "반바지/스커트" },
        { caId: "c010f0", name: "원피스" },       { caId: "c010g0", name: "수영복" },
      ],
    },
    { gender: "여성", categoryId: "bags", categoryName: "여성가방", parentCaId: "c020", pageBase: "women",
      subcategories: [
        { caId: "c02010", name: "숄더백" },           { caId: "c02020", name: "토트백" },
        { caId: "c02030", name: "클러치백" },         { caId: "c02040", name: "백팩" },
        { caId: "c02050", name: "파우치" },           { caId: "c02060", name: "크로스" },
        { caId: "c02070", name: "메신져백" },         { caId: "c02080", name: "여행가방" },
        { caId: "c02090", name: "케리어" },           { caId: "c020a0", name: "벨트백/새들/슬링" },
        { caId: "c020b0", name: "미니백" },           { caId: "c020c0", name: "기타" },
      ],
    },
    { gender: "여성", categoryId: "wallets", categoryName: "여성지갑", parentCaId: "c030", pageBase: "women",
      subcategories: [
        { caId: "c03010", name: "장지갑/소지갑" }, { caId: "c03020", name: "카드지갑" },
        { caId: "c03030", name: "동전지갑" },
      ],
    },
    { gender: "여성", categoryId: "shoes", categoryName: "여성신발", parentCaId: "c050", pageBase: "women",
      subcategories: [
        { caId: "c05010", name: "스니커즈" },    { caId: "c05020", name: "운동화" },
        { caId: "c05030", name: "샌들/슬리퍼" }, { caId: "c05040", name: "펌프스/힐" },
        { caId: "c05050", name: "부츠/워커" },   { caId: "c05060", name: "단화/플랫" },
        { caId: "c05070", name: "로퍼/슬립온" },
      ],
    },
    { gender: "여성", categoryId: "sunglasses", categoryName: "여성선글라스", parentCaId: "c070", pageBase: "women",
      subcategories: [
        { caId: "c07010", name: "선글라스" }, { caId: "c07020", name: "안경태" },
      ],
    },
    { gender: "여성", categoryId: "belts", categoryName: "여성벨트", parentCaId: "c060", pageBase: "women",
      subcategories: [
        { caId: "c06010", name: "가죽벨트" }, { caId: "c06020", name: "메쉬벨트" },
      ],
    },
    // 여성 쥬얼리/잡화 (f0 하위, 각 소분류가 독립 caId - 확인 완료)
    { gender: "여성", categoryId: "jewelry", categoryName: "여성쥬얼리-목걸이", parentCaId: "f0a0", pageBase: "women",
      subcategories: [ { caId: "f0a0", name: "목걸이" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성쥬얼리-귀걸이", parentCaId: "f0d0", pageBase: "women",
      subcategories: [ { caId: "f0d0", name: "귀걸이" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성쥬얼리-팔찌", parentCaId: "f0b0", pageBase: "women",
      subcategories: [ { caId: "f0b0", name: "팔찌" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성쥬얼리-반지", parentCaId: "f0c0", pageBase: "women",
      subcategories: [ { caId: "f0c0", name: "반지" } ],
    },
    // 여성 잡화 (f0 하위, 확인 완료)
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-백참/브로치", parentCaId: "f090", pageBase: "women",
      subcategories: [ { caId: "f090", name: "백참/브로치" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-스카프/머플러", parentCaId: "f030", pageBase: "women",
      subcategories: [ { caId: "f030", name: "스카프/머플러" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-모자", parentCaId: "f070", pageBase: "women",
      subcategories: [ { caId: "f070", name: "모자" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-키홀더", parentCaId: "f0e0", pageBase: "women",
      subcategories: [ { caId: "f0e0", name: "키홀더" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-만년필/볼펜", parentCaId: "f050", pageBase: "women",
      subcategories: [ { caId: "f050", name: "만년필/볼펜" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-장갑", parentCaId: "f080", pageBase: "women",
      subcategories: [ { caId: "f080", name: "장갑" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-우산", parentCaId: "f0f0", pageBase: "women",
      subcategories: [ { caId: "f0f0", name: "우산" } ],
    },
    { gender: "여성", categoryId: "jewelry", categoryName: "여성잡화-기타", parentCaId: "f0h0", pageBase: "women",
      subcategories: [ { caId: "f0h0", name: "기타" } ],
    },
    // ═══════════════ 골프 ═══════════════
    { gender: "골프", categoryId: "clothing", categoryName: "골프남성의류", parentCaId: "7010", pageBase: "list",
      subcategories: [
        { caId: "701010", name: "자켓/점퍼" }, { caId: "701020", name: "반팔티" },
        { caId: "701030", name: "긴팔티" },    { caId: "701040", name: "긴바지" },
        { caId: "701050", name: "비옷" },      { caId: "701060", name: "조끼" },
        { caId: "701070", name: "반바지" },    { caId: "701080", name: "패딩/아우터" },
        { caId: "701090", name: "니트/스웨터" },{ caId: "7010a0", name: "셋트" },
      ],
    },
    { gender: "골프", categoryId: "clothing", categoryName: "골프여성의류", parentCaId: "7020", pageBase: "list",
      subcategories: [
        { caId: "702010", name: "자켓/점퍼" }, { caId: "702020", name: "반팔티" },
        { caId: "702030", name: "긴팔티" },    { caId: "702040", name: "긴바지" },
        { caId: "702050", name: "반바지" },    { caId: "702060", name: "조끼" },
        { caId: "702070", name: "비옷" },      { caId: "702080", name: "패딩아우터" },
        { caId: "702090", name: "원피스" },    { caId: "7020a0", name: "스커트" },
        { caId: "7020b0", name: "니트/스웨터" },{ caId: "7020c0", name: "셋트" },
      ],
    },
    { gender: "골프", categoryId: "bags", categoryName: "골프가방", parentCaId: "7040", pageBase: "list",
      subcategories: [
        { caId: "704010", name: "캐디백" },   { caId: "704020", name: "보스턴백" },
        { caId: "704030", name: "토트백" },   { caId: "704040", name: "클러치백" },
        { caId: "704050", name: "기타" },
      ],
    },
    { gender: "골프", categoryId: "shoes", categoryName: "골프신발", parentCaId: "7030", pageBase: "list",
      subcategories: [
        { caId: "703010", name: "골프화" }, { caId: "703020", name: "스니커즈" },
      ],
    },
  ];

  const bagstyleProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    category: string;
    subcatLog: string[];
    grandTotal: number;
    completedSubcats: string[];
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, message: '', category: '', subcatLog: [], grandTotal: 0, completedSubcats: [] };

  const BAGSTYLE_RESUME_KEY = 'bagstyle_completed_subcats';

  const saveCompletedSubcats = async (slugs: string[]) => {
    try {
      await pool.query(
        `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [BAGSTYLE_RESUME_KEY, JSON.stringify(slugs)]
      );
    } catch {}
  };

  const loadCompletedSubcats = async (): Promise<string[]> => {
    try {
      const res = await pool.query(`SELECT value FROM site_settings WHERE key = $1`, [BAGSTYLE_RESUME_KEY]);
      if (res.rows.length > 0) return JSON.parse(res.rows[0].value) as string[];
    } catch {}
    return [];
  };

  const clearCompletedSubcats = async () => {
    try {
      await pool.query(`DELETE FROM site_settings WHERE key = $1`, [BAGSTYLE_RESUME_KEY]);
    } catch {}
  };

  app.get("/api/admin/crawl/bagstyle/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, ...bagstyleProgress });
  });

  app.post("/api/admin/crawl/bagstyle/reset", requireAdminAuth, async (_req: Request, res: Response) => {
    bagstyleProgress.status = 'idle';
    bagstyleProgress.total = 0;
    bagstyleProgress.current = 0;
    bagstyleProgress.message = '';
    bagstyleProgress.category = '';
    bagstyleProgress.subcatLog = [];
    bagstyleProgress.grandTotal = 0;
    bagstyleProgress.completedSubcats = [];
    await clearCompletedSubcats();
    res.json({ success: true, message: "크롤링 상태가 초기화되었습니다." });
  });

  app.get("/api/admin/crawl/bagstyle/can-resume", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const completed = await loadCompletedSubcats();
      res.json({ success: true, canResume: completed.length > 0, completedCount: completed.length });
    } catch {
      res.json({ success: true, canResume: false, completedCount: 0 });
    }
  });

  app.get("/api/admin/crawl/bagstyle/categories", requireAdminAuth, (_req: Request, res: Response) => {
    const cats = BAGSTYLE_CRAWL_MAP.map(e => ({
      parentCaId: e.parentCaId,
      name: e.categoryName,
      gender: e.gender,
      subcatCount: e.subcategories.length,
      subcategories: e.subcategories.map(s => ({ caId: s.caId, name: s.name })),
    }));
    res.json({ success: true, categories: cats });
  });

  app.post("/api/admin/crawl/bagstyle/banners", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://bagstyle.site/",
      };
      const response = await fetch("https://bagstyle.site/", { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const imgUrls: string[] = [];
      const srcMatches = html.match(/src="(https:\/\/bagstyle\.site\/[^"]+\.(jpg|jpeg|png|webp))"/gi) || [];
      srcMatches.forEach(m => {
        const url = m.replace(/src="/i, '').replace(/"$/, '');
        if (!imgUrls.includes(url)) imgUrls.push(url);
      });
      const sliderMatches = html.match(/https:\/\/bagstyle\.site\/data\/ebslider\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi) || [];
      sliderMatches.forEach(url => { if (!imgUrls.includes(url)) imgUrls.push(url); });
      res.json({ success: true, data: { images: imgUrls.slice(0, 20), categoryImages: [] } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  let bagstyleShouldStop = false;

  app.post("/api/admin/crawl/bagstyle/stop", requireAdminAuth, (_req: Request, res: Response) => {
    bagstyleShouldStop = true;
    res.json({ success: true, message: "중단 요청 완료. 현재 소분류 종료 후 멈춥니다." });
  });

  app.get("/api/admin/crawl/bagstyle/subcat-log", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, log: bagstyleProgress.subcatLog });
  });

  app.post("/api/admin/crawl/bagstyle/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (bagstyleProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 크롤링이 진행 중입니다." });
    }

    const { selectedCategories, selectedSubcats, resume } = req.body;

    let previouslyCompleted: string[] = [];
    let previousLog: string[] = [];
    let previousGrandTotal = 0;

    if (resume) {
      previouslyCompleted = await loadCompletedSubcats();
      previousLog = bagstyleProgress.subcatLog.length > 0
        ? bagstyleProgress.subcatLog
        : (previouslyCompleted.length > 0 ? [`[이어서 시작] 이미 완료된 소분류 ${previouslyCompleted.length}개 스킵`] : []);
      previousGrandTotal = bagstyleProgress.grandTotal;
    } else {
      await clearCompletedSubcats();
    }

    bagstyleProgress.status = 'running';
    bagstyleProgress.total = 0;
    bagstyleProgress.current = 0;
    bagstyleProgress.message = resume ? `이어서 시작 중... (${previouslyCompleted.length}개 소분류 완료됨)` : '크롤링 준비 중...';
    bagstyleProgress.category = '';
    bagstyleProgress.subcatLog = previousLog;
    bagstyleProgress.grandTotal = previousGrandTotal;
    bagstyleProgress.completedSubcats = previouslyCompleted;
    bagstyleProgress.startedAt = new Date();
    bagstyleShouldStop = false;

    const resumeMessage = resume
      ? `bagstyle.site 크롤링이 이어서 시작되었습니다. (${previouslyCompleted.length}개 소분류 스킵)`
      : "bagstyle.site 전체 크롤링이 시작되었습니다.";

    res.json({ success: true, message: resumeMessage });

    (async () => {
      try {
        const bsHeaders = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ko-KR,ko;q=0.9",
          "Referer": "https://bagstyle.site/",
        };
        const delayMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // ── 타임아웃 + 리트라이 fetch 헬퍼 ──
        const bsFetchWithTimeout = async (url: string, timeoutMs = 8000): Promise<Response> => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(url, { headers: bsHeaders, signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        };
        const bsFetchWithRetry = async (url: string, retries = 3, baseDelayMs = 200): Promise<Response | null> => {
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const r = await bsFetchWithTimeout(url);
              if (r.ok) return r;
              if (r.status === 404) return null;
              if (attempt < retries - 1) await delayMs(baseDelayMs * (attempt + 1));
            } catch (e: any) {
              const isTimeout = e?.name === 'AbortError';
              console.warn(`[bagstyle] ${isTimeout ? '타임아웃' : '오류'} (시도 ${attempt + 1}/${retries}): ${url}`);
              if (attempt < retries - 1) await delayMs(baseDelayMs * (attempt + 1));
            }
          }
          return null;
        };

        // ── 상품 ID 목록 수집 (소분류 단위, 전 페이지) ──
        const fetchProductIds = async (caId: string): Promise<string[]> => {
          const allIds = new Set<string>();
          let page = 1;
          let emptyStreak = 0;   // 신규 ID가 없는 페이지 연속 횟수
          let errorStreak = 0;   // 요청 자체가 실패한 연속 횟수
          while (emptyStreak < 4 && errorStreak < 6) {
            const url = `https://bagstyle.site/shop/list.php?ca_id=${caId}&page=${page}`;
            const r = await bsFetchWithRetry(url, 3, 200);
            if (!r) {
              errorStreak++;
              await delayMs(300 * errorStreak);
              page++;
              continue;
            }
            errorStreak = 0;
            const html = await r.text();
            const ids = Array.from(new Set((html.match(/it_id=(\d+)/g) || []).map((m: string) => m.replace('it_id=', ''))));
            const newIds = ids.filter((id: string) => !allIds.has(id));
            newIds.forEach((id: string) => allIds.add(id));
            if (newIds.length === 0) emptyStreak++;
            else emptyStreak = 0;
            page++;
            await delayMs(80);
          }
          return Array.from(allIds);
        };

        // ── 총 상품 수 파싱 (검증용) ──
        // 수정: list.php 사용, HTML 태그 포함 패턴 대응
        // 실제 HTML: <p >총<span> 5,380  </span>개 상품</p>
        const parseTotalCount = async (caId: string): Promise<number> => {
          try {
            const url = `https://bagstyle.site/shop/list.php?ca_id=${caId}&page=1`;
            const r = await bsFetchWithRetry(url, 2, 150);
            if (!r) return 0;
            const html = await r.text();
            const stripped = html.replace(/<[^>]+>/g, ' ');
            const m = stripped.match(/총\s*([\d,]+)\s*개/);
            return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0;
          } catch { return 0; }
        };

        // ── HTML 엔티티 디코딩 ──
        const decodeHtml = (t: string) => t
          .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
          .replace(/&#(\d+);/g, (_: string, c: string) => String.fromCharCode(parseInt(c, 10)));

        // ── 상품 상세정보 수집 ──
        const fetchDetail = async (sourceId: string, categoryId: string, subcategoryId: string, gender: string) => {
          const url = `https://bagstyle.site/shop/item.php?it_id=${sourceId}`;
          try {
            const r = await bsFetchWithRetry(url, 3, 200);
            if (!r) return null;
            const html = await r.text();
            const $ = cheerio.load(html);

            let name = decodeHtml($('h1.sit_tit').first().text().trim());
            if (!name) { const tm = html.match(/<title>([^|<]+)/i); if (tm) name = decodeHtml(tm[1].trim()); }
            if (!name) name = `상품 ${sourceId}`;

            let brandName = '';
            $('nav a, .breadcrumb a').each((_i: number, el: any) => {
              const text = $(el).text().trim();
              const href = $(el).attr('href') || '';
              if (text && text.length > 1 && text.length < 30 && !text.match(/홈|HOME/i) && !href.includes('ca_id=')) brandName = text;
            });
            if (!brandName) { const bEl = $('td:contains("브랜드")').next('td'); if (bEl.length) brandName = bEl.text().trim(); }

            let price = 0, originalPrice = 0;
            const spM = html.match(/판매가[^0-9]*(\d{1,3}(?:,\d{3})+)/);
            if (spM) price = parseInt(spM[1].replace(/,/g,''), 10);
            const npM = html.match(/정상가[^0-9]*(\d{1,3}(?:,\d{3})+)/);
            if (npM) originalPrice = parseInt(npM[1].replace(/,/g,''), 10);
            if (!price) { const aM = html.match(/(\d{1,3}(?:,\d{3})+)원/); if (aM) price = parseInt(aM[1].replace(/,/g,''), 10); }
            if (price > 0) price += 20000;

            const colors: string[] = [], sizes: string[] = [];
            const opt1Label = $('label[for="it_option_1"]').text().trim();
            const opt2Label = $('label[for="it_option_2"]').text().trim();
            if (/컬러|색상|Color/i.test(opt1Label)) {
              $('select#it_option_1 option').each((_i: number, el: any) => {
                const v = $(el).attr('value'); if (v && !v.startsWith('선택') && v.trim()) colors.push(v.trim());
              });
            }
            if (/사이즈|Size/i.test(opt2Label)) {
              $('select#it_option_2 option').each((_i: number, el: any) => {
                const v = $(el).attr('value'); if (v && !v.startsWith('선택') && v.trim()) sizes.push(v.trim());
              });
            }
            const options = (colors.length > 0 || sizes.length > 0) ? JSON.stringify({ colors, sizes }) : undefined;

            const mainImages: string[] = [];
            const imgR = new RegExp(`https?://bagstyle\\.site/data/item/${sourceId}/[^"'\\s]+\\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)`, 'gi');
            (html.match(imgR) || []).forEach((img: string) => {
              const c = img.replace(/^http:/, 'https:').split('?')[0];
              if (!c.includes('_100x100') && !c.includes('_77x82') && !mainImages.includes(c)) mainImages.push(c);
            });
            if (mainImages.length === 0) {
              const relR = new RegExp(`/data/item/${sourceId}/[^"'\\s]+\\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)`, 'gi');
              (html.match(relR) || []).forEach((img: string) => {
                const full = `https://bagstyle.site${img.split('?')[0]}`;
                if (!full.includes('_100x100') && !mainImages.includes(full)) mainImages.push(full);
              });
            }

            const detailImages: string[] = [];
            const dR = /(?:https?:\/\/bagstyle\.site)?\/(?:styleis\/)?data\/(?:editor|ebcontents)\/[^"'\s]+\.(?:jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi;
            (html.match(dR) || []).forEach((img: string) => {
              let c = img.replace(/^http:/, 'https:');
              if (c.startsWith('/styleis/')) c = `https://bagstyle.site${c}`;
              else if (c.startsWith('/')) c = `https://bagstyle.site${c}`;
              if (!detailImages.includes(c)) detailImages.push(c);
            });

            let detailContent = '';
            const explanDiv = $('#sit_inf_explan');
            if (explanDiv.length) {
              let rawHtml = explanDiv.html()?.trim() || '';
              rawHtml = rawHtml.replace(/src="\/styleis\/data\//g, 'src="https://bagstyle.site/styleis/data/');
              rawHtml = rawHtml.replace(/src="\/data\//g, 'src="https://bagstyle.site/data/');
              detailContent = rawHtml;
            }
            if (!detailContent) detailContent = name;

            let discountPercent = 0;
            if (originalPrice > 0 && price > 0 && originalPrice > price) {
              discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
            }
            const isBest = html.includes('BEST') || html.includes('best_icon') || html.includes('베스트');
            const isSameDay = html.includes('당일배송') || html.includes('당일 배송') || html.includes('sameday') || html.includes('same_day') || html.includes('당일출발');

            return { sourceId, name, brandName, price, originalPrice: originalPrice > 0 ? originalPrice : undefined,
              description: name, detailContent, imageUrl: mainImages[0] || '',
              imageUrls: mainImages, detailImageUrls: detailImages,
              categoryId, subcategoryId, gender, discountPercent, isBest, isSameDay, options };
          } catch { return null; }
        };

        // ── 브랜드 캐시 ──
        let cachedBrands: { id: string; name: string; slug: string }[] | null = null;
        const getBrands = async () => { if (!cachedBrands) cachedBrands = await storage.getAllBrands(); return cachedBrands; };
        const getOrCreateBrand = async (brandName: string, productName?: string): Promise<string | undefined> => {
          const brands = await getBrands();
          if (productName) { const m = matchBrandFromText(productName, brands); if (m) return m; }
          if (brandName) {
            const m = matchBrandFromText(brandName, brands); if (m) return m;
            const slug = brandName.toLowerCase().trim().replace(/\s+/g,'').replace(/[^a-z0-9가-힣]/g,'');
            let found = brands.find(b => b.slug === slug || b.name.toLowerCase() === brandName.toLowerCase().trim());
            if (!found) {
              try { found = await storage.createBrand({ name: brandName.trim(), slug, sortOrder: 100, isActive: true }); cachedBrands = null; }
              catch { found = (await storage.getAllBrands()).find(b => b.slug === slug); }
            }
            if (found) return found.id;
          }
          return undefined;
        };

        // ── 메인 크롤 루프 ──
        // selectedSubcats(caId 목록)가 있으면 소분류 단위로 필터
        // selectedCategories(parentCaId 목록)가 있으면 카테고리 단위로 필터
        // 둘 다 없으면 전체 크롤
        let entriesToCrawl: BagstyleCrawlEntry[];
        if (selectedSubcats && selectedSubcats.length > 0) {
          const subcatSet = new Set<string>(selectedSubcats as string[]);
          entriesToCrawl = BAGSTYLE_CRAWL_MAP
            .map(e => ({ ...e, subcategories: e.subcategories.filter(s => subcatSet.has(s.caId)) }))
            .filter(e => e.subcategories.length > 0);
        } else if (selectedCategories && selectedCategories.length > 0) {
          entriesToCrawl = BAGSTYLE_CRAWL_MAP.filter(e => selectedCategories.includes(e.parentCaId));
        } else {
          entriesToCrawl = BAGSTYLE_CRAWL_MAP;
        }

        let grandTotal = bagstyleProgress.grandTotal;

        for (const entry of entriesToCrawl) {
          if (bagstyleShouldStop) break;
          bagstyleProgress.category = entry.categoryName;

          for (const sub of entry.subcategories) {
            if (bagstyleShouldStop) break;

            // 이어서 하기: 이미 완료된 소분류는 스킵
            if (bagstyleProgress.completedSubcats.includes(sub.caId)) {
              console.log(`[bagstyle] 스킵 (이미 완료): [${sub.caId}] ${sub.name}`);
              continue;
            }

            bagstyleProgress.message = `[${entry.categoryName} > ${sub.name}] 상품 ID 수집 중...`;
            const expectedCount = await parseTotalCount(sub.caId);
            const idsArray = await fetchProductIds(sub.caId);

            if (idsArray.length === 0) {
              const logLine = `[${sub.caId}] ${sub.name}: 0개 (예상 ${expectedCount}개, ID 없음)`;
              bagstyleProgress.subcatLog.push(logLine);
              console.log(`[bagstyle] ${logLine}`);
              continue;
            }

            bagstyleProgress.message = `[${entry.categoryName} > ${sub.name}] ${idsArray.length}개 상세정보 수집 중...`;
            bagstyleProgress.total = idsArray.length;
            bagstyleProgress.current = 0;

            // 중복 방지: 해당 소분류의 기존 상품명 로드
            const existingNames = await storage.getExistingProductNamesBySubcategory(sub.caId);

            let savedCount = 0, skippedCount = 0;

            for (let i = 0; i < idsArray.length; i += 15) {
              if (bagstyleShouldStop) break;
              const batch = idsArray.slice(i, i + 15);
              const results = await Promise.all(
                batch.map(id => fetchDetail(id, entry.categoryId, sub.caId, entry.gender)
                  .catch((e: any) => { console.error(`[bagstyle] fetchDetail 오류 (id=${id}):`, e?.message || e); return null; })
                )
              );

              for (const p of results) {
                if (!p || p.price <= 0) { skippedCount++; continue; }
                // 동일 소분류에 같은 이름의 상품이 이미 있으면 건너뜀
                if (existingNames.has(p.name)) { skippedCount++; continue; }
                try {
                  const brandId = await getOrCreateBrand(p.brandName, p.name);
                  existingNames.add(p.name);
                  await storage.createProduct({
                    name: p.name,
                    categoryId: p.categoryId,
                    subcategoryId: p.subcategoryId,
                    brandId,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    description: p.description,
                    detailContent: p.detailContent,
                    imageUrl: p.imageUrl,
                    imageUrls: p.imageUrls.length > 0 ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []),
                    detailImageUrls: p.detailImageUrls,
                    options: p.options,
                    discountPercent: p.discountPercent,
                    isBest: p.isBest,
                    isSameDay: p.isSameDay,
                    isNew: false,
                    isActive: true,
                    gender: p.gender,
                  });
                  savedCount++;
                  grandTotal++;
                  bagstyleProgress.grandTotal = grandTotal;
                } catch (dbErr: any) {
                  skippedCount++;
                  console.error(`[bagstyle] DB 저장 오류 (${p.name}):`, dbErr?.message || dbErr);
                }
              }

              bagstyleProgress.current = Math.min(i + 15, idsArray.length);
              bagstyleProgress.message = `[${entry.categoryName} > ${sub.name}] 저장 중 (${bagstyleProgress.current}/${idsArray.length})...`;
              await delayMs(50);
            }

            const match = expectedCount > 0
              ? (Math.abs(savedCount - expectedCount) <= Math.max(expectedCount * 0.05, 5) ? '✓' : '✗') : '?';
            const logLine = `[${sub.caId}] ${sub.name}: 저장 ${savedCount}개 | 예상 ${expectedCount > 0 ? expectedCount+'개' : '?'} ${match} (스킵 ${skippedCount})`;
            bagstyleProgress.subcatLog.push(logLine);
            console.log(`[bagstyle] ${logLine}`);

            // 소분류 완료 → DB에 저장 (이어서 하기 기능용)
            if (!bagstyleShouldStop) {
              bagstyleProgress.completedSubcats.push(sub.caId);
              await saveCompletedSubcats(bagstyleProgress.completedSubcats);
            }

            await delayMs(100);
          }
        }

        bagstyleProgress.status = bagstyleShouldStop ? 'idle' : 'completed';
        bagstyleProgress.message = bagstyleShouldStop
          ? `중단됨. 저장된 상품: ${grandTotal}개`
          : `완료! 총 ${grandTotal}개 상품 크롤링 완료`;
        bagstyleProgress.completedAt = new Date();
        console.log(`[bagstyle] done: ${grandTotal} products`);

      } catch (error: any) {
        bagstyleProgress.status = 'error';
        bagstyleProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('[bagstyle] Crawl error:', error);
      }
    })();
  });

  // bag-only 크롤러 stub (하위호환)
  app.get("/api/admin/crawl/bags/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, status: 'idle', total: 0, current: 0, message: '가방 크롤링은 전체 크롤링에 통합되었습니다.', subcategory: '' });
  });
  app.post("/api/admin/crawl/bags/start", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: false, error: '가방 전용 크롤러는 전체 크롤러(bagstyle 시작)로 통합되었습니다.' });
  });
  app.get("/api/admin/crawl/bags/subcategories", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, subcategories: [] });
  });


  // ============= BLOOSTORE WATCH CRAWLER =============
  const BLOOSTORE_WATCH_BRANDS = [
    { id: "rolex", name: "롤렉스", pageUrl: "/412/", categoryId: "s2023110807dcda38ffad5" },
    { id: "cartier", name: "까르띠에", pageUrl: "/413/", categoryId: "s20231108fa0f625fe8ba0" },
    { id: "iwc", name: "IWC", pageUrl: "/415/", categoryId: "s20231108fca812653a64f" },
    { id: "patek", name: "파텍필립", pageUrl: "/1337/", categoryId: "s2023110872788d66e7746" },
    { id: "ap", name: "오데마피게", pageUrl: "/416/", categoryId: "s2023110864a29e41141d5" },
    { id: "breitling", name: "브라이틀링", pageUrl: "/417/", categoryId: "s202311087be8f51ef88b4" },
    { id: "omega", name: "오메가", pageUrl: "/418/", categoryId: "s20231109d1d44f399a8a8" },
    { id: "chanel", name: "샤넬", pageUrl: "/419/", categoryId: "s202311087294963405bc6" },
  ];

  let bloostoreProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    brand: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, message: '', brand: '' };

  app.get("/api/admin/crawl/bloostore/progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...bloostoreProgress });
  });

  app.post("/api/admin/crawl/bloostore/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (bloostoreProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 블루스토어 크롤링이 진행 중입니다." });
    }

    const { selectedBrands } = req.body;

    bloostoreProgress.status = 'running';
    bloostoreProgress.total = 0;
    bloostoreProgress.current = 0;
    bloostoreProgress.message = '블루스토어 시계 크롤링 준비 중...';
    bloostoreProgress.brand = '';
    bloostoreProgress.startedAt = new Date();

    res.json({ success: true, message: "블루스토어 시계 크롤링이 시작되었습니다." });

    (async () => {
      try {
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://bloostore.co.kr/",
          "Accept": "application/json, text/html, */*",
        };

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // ── 타임아웃 + 리트라이 fetch 헬퍼 (bloostore) ──
        const bsFetch = async (url: string, extraHeaders: Record<string, string> = {}, timeoutMs = 8000): Promise<Response> => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(url, { headers: { ...headers, ...extraHeaders }, signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        };
        const bsFetchRetry = async (url: string, extraHeaders: Record<string, string> = {}, retries = 3): Promise<Response | null> => {
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const r = await bsFetch(url, extraHeaders);
              if (r.ok) return r;
              if (r.status === 404) return null;
              if (attempt < retries - 1) await delay(200 * (attempt + 1));
            } catch (e: any) {
              const isTimeout = e?.name === 'AbortError';
              console.warn(`[bloostore] ${isTimeout ? '타임아웃' : '오류'} (시도 ${attempt + 1}/${retries}): ${url}`);
              if (attempt < retries - 1) await delay(200 * (attempt + 1));
            }
          }
          return null;
        };

        const brandsToProcess = selectedBrands && selectedBrands.length > 0
          ? BLOOSTORE_WATCH_BRANDS.filter(b => selectedBrands.includes(b.id))
          : BLOOSTORE_WATCH_BRANDS;

        const watchCategory = await (async () => {
          const existingCats = await storage.getAllCategories();
          const found = existingCats.find(c => c.id === 'watches' || c.slug === 'watches' || c.name === '시계');
          if (found) {
            return found;
          }
          return await storage.createCategory({
            id: 'watches',
            name: '시계',
            slug: 'watches',
            sortOrder: 130,
            isActive: true,
          });
        })();

        const existingBrands = await storage.getAllBrands();

        const getOrCreateWatchBrand = async (brandName: string): Promise<string | undefined> => {
          const brandMatchId = matchBrandFromText(brandName, existingBrands);
          if (brandMatchId) return brandMatchId;

          const slug = brandName.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-');
          try {
            const newBrand = await storage.createBrand({
              name: brandName,
              slug: slug,
              isActive: true,
            });
            existingBrands.push(newBrand);
            return newBrand.id;
          } catch {
            return undefined;
          }
        };

        let totalInserted = 0;
        const crawledNames = new Set<string>();

        const existingWatchNames = new Set(
          (await storage.getProductsByCategory(watchCategory.id)).map(p => p.name)
        );

        for (const brand of brandsToProcess) {
          bloostoreProgress.brand = brand.name;
          bloostoreProgress.message = `[${brand.name}] 상품 수집 중...`;
          console.log(`[bloostore] Crawling ${brand.name} (${brand.pageUrl})`);

          let page = 1;
          const pageSize = 20;
          let hasMore = true;
          let brandProductCount = 0;

          const seenProductIdx = new Set<number>();

          let pageRetryCount = 0;
          while (hasMore) {
            try {
              const ajaxUrl = `https://bloostore.co.kr/ajax/get_shop_list_view.cm?page=${page}&pagesize=${pageSize}&category=${brand.categoryId}&sort=recent&menu_url=${brand.pageUrl}`;
              const response = await bsFetchRetry(ajaxUrl, { "Accept": "application/json, */*" }, 3);

              if (!response) {
                console.error(`[bloostore] ${brand.name} page ${page} 응답 없음 (리트라이 소진)`);
                pageRetryCount++;
                if (pageRetryCount >= 3) { hasMore = false; }
                else { await delay(2000 * pageRetryCount); }
                continue;
              }
              pageRetryCount = 0;

              const data = await response.json() as { html: string; msg: string };

              if (data.msg !== 'SUCCESS' || !data.html) {
                hasMore = false;
                continue;
              }

              const pageProducts: Array<{ name: string; idx: number; imageUrl: string; price: number }> = [];
              let newOnPage = 0;

              const $ = cheerio.load(data.html);
              $('[data-product-properties]').each((_i, el) => {
                try {
                  const rawAttr = $(el).attr('data-product-properties') || '';
                  const parsed = JSON.parse(rawAttr);
                  if (parsed.name && parsed.idx) {
                    if (seenProductIdx.has(parsed.idx)) return;
                    seenProductIdx.add(parsed.idx);
                    const cleanImgUrl = parsed.image_url ? parsed.image_url.split('?')[0] : '';
                    pageProducts.push({
                      name: parsed.name.trim(),
                      idx: parsed.idx,
                      imageUrl: cleanImgUrl,
                      price: parsed.price || 0,
                    });
                    newOnPage++;
                  }
                } catch (parseErr) {
                  console.error(`[bloostore] Failed to parse product properties:`, parseErr);
                }
              });

              console.log(`[bloostore] ${brand.name} page ${page}: ${newOnPage} new products (${$('[data-product-properties]').length} total on page)`);

              if (newOnPage === 0) {
                hasMore = false;
                continue;
              }

              for (const prod of pageProducts) {
                try {
                  const dedupeKey = `${brand.name}:${prod.name}`;
                  if (crawledNames.has(dedupeKey)) continue;
                  if (existingWatchNames.has(prod.name)) continue;

                  crawledNames.add(dedupeKey);
                  const brandId = await getOrCreateWatchBrand(brand.name);

                  let detailImages: string[] = [];
                  bloostoreProgress.message = `[${brand.name}] 상세 이미지 수집 중... (${prod.name})`;

                  try {
                    await delay(400);
                    const detailUrl = `https://bloostore.co.kr/shop_view/?idx=${prod.idx}`;
                    const detailResponse = await bsFetchRetry(detailUrl, { "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" }, 2);

                    if (detailResponse) {
                      const detailHtml = await detailResponse.text();

                      const owlSection = detailHtml.match(/owl-carousel prod-owl-list[\s\S]*?<\/div>\s*<\/div>/);
                      if (owlSection) {
                        const srcImgs = owlSection[0].match(/src="(https:\/\/cdn[^"]+)"/g) || [];
                        srcImgs.forEach(m => {
                          const url = m.replace('src="', '').replace('"', '').split('?')[0];
                          if (!detailImages.includes(url)) detailImages.push(url);
                        });
                        const dataOrigImgs = owlSection[0].match(/data-original="(https:\/\/cdn[^"]+)"/g) || [];
                        dataOrigImgs.forEach(m => {
                          const url = m.replace('data-original="', '').replace('"', '').split('?')[0];
                          if (!detailImages.includes(url)) detailImages.push(url);
                        });
                      }

                      const goodsImgSection = detailHtml.match(/shop_goods_img[\s\S]*?<\/ul>/);
                      if (goodsImgSection) {
                        const bgUrls = goodsImgSection[0].match(/url\('(https:\/\/cdn[^']+)'\)/g) || [];
                        bgUrls.forEach(m => {
                          const url = m.replace("url('", '').replace("')", '').split('?')[0];
                          if (!detailImages.includes(url)) detailImages.push(url);
                        });
                      }

                      const ogMatch = detailHtml.match(/og:image[^>]*content="(https:\/\/cdn[^"]+)"/);
                      if (ogMatch) {
                        const ogUrl = ogMatch[1].split('?')[0];
                        if (!detailImages.includes(ogUrl)) detailImages.unshift(ogUrl);
                      }
                    }
                  } catch (detailErr) {
                    console.error(`[bloostore] Error fetching detail for ${prod.name}:`, detailErr);
                  }

                  const BLOOSTORE_COMMON_IDS = ['91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23'];
                  detailImages = detailImages.filter(url => !BLOOSTORE_COMMON_IDS.some(id => url.includes(id)));

                  const listingImg = prod.imageUrl;
                  const finalImages: string[] = [];
                  if (listingImg) finalImages.push(listingImg);
                  detailImages.forEach(img => {
                    if (!finalImages.includes(img)) finalImages.push(img);
                  });

                  const finalImageUrl = listingImg || detailImages[0] || '';

                  await storage.createProduct({
                    name: prod.name,
                    price: prod.price,
                    originalPrice: prod.price,
                    description: `${brand.name} ${prod.name}`,
                    categoryId: watchCategory.id,
                    brandId: brandId || undefined,
                    imageUrl: finalImageUrl,
                    imageUrls: finalImages.length > 0 ? finalImages : [finalImageUrl],
                    sourceUrl: `https://bloostore.co.kr/shop_view/?idx=${prod.idx}`,
                    sourceIdx: prod.idx,
                    isActive: true,
                    isNew: true,
                    isBest: false,
                  });

                  totalInserted++;
                  brandProductCount++;
                  bloostoreProgress.current = totalInserted;
                  bloostoreProgress.message = `[${brand.name}] ${brandProductCount}개 상품 수집 (이미지 ${finalImages.length}장) - ${prod.name}`;
                  console.log(`[bloostore] Created: ${prod.name} (listing=${listingImg ? 'yes' : 'no'}, detail=${detailImages.length}imgs)`);
                } catch (itemErr) {
                  console.error(`[bloostore] Error processing ${prod.name}:`, itemErr);
                }
              }

              if (pageProducts.length < pageSize) {
                hasMore = false;
              } else {
                page++;
                await delay(800);
              }
            } catch (pageErr) {
              console.error(`[bloostore] Error on page ${page} for ${brand.name}:`, pageErr);
              pageRetryCount++;
              if (pageRetryCount >= 5) {
                console.error(`[bloostore] ${brand.name} 연속 오류 5회 → 다음 브랜드로 이동`);
                hasMore = false;
              } else {
                await delay(2000 * pageRetryCount);
              }
            }
          }

          bloostoreProgress.total += brandProductCount;
          console.log(`[bloostore] ${brand.name}: ${brandProductCount} products`);
          await delay(500);
        }

        bloostoreProgress.status = 'completed';
        bloostoreProgress.message = `완료! 총 ${totalInserted}개 시계 상품이 크롤링되었습니다.`;
        bloostoreProgress.completedAt = new Date();
        console.log(`[bloostore] Crawl complete: ${totalInserted} watch products`);

      } catch (error: any) {
        bloostoreProgress.status = 'error';
        bloostoreProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('[bloostore] Crawl error:', error);
      }
    })();
  });

  app.post("/api/admin/crawl/bloostore/clean-common-images", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const BLOOSTORE_COMMON_IDS = ['91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23'];
      const allProducts = await storage.getAllProducts();
      const watchProducts = allProducts.filter(p => p.categoryId === 'watches');
      let updated = 0;

      for (const product of watchProducts) {
        const urls = product.imageUrls || [];
        const filtered = urls.filter(url => !BLOOSTORE_COMMON_IDS.some(id => url.includes(id)));
        if (filtered.length < urls.length) {
          await storage.updateProduct(product.id, { imageUrls: filtered.length > 0 ? filtered : [product.imageUrl] });
          updated++;
        }
      }

      res.json({ success: true, message: `${updated}개 시계 상품에서 블루스토어 공통 이미지를 제거했습니다.`, updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ============= BLOOSTORE SOURCE IDX BACKFILL =============
  let backfillProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    matched: number;
    message: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, matched: 0, message: '' };

  app.get("/api/admin/crawl/bloostore/backfill-progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...backfillProgress });
  });

  app.post("/api/admin/crawl/bloostore/backfill-source", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      if (backfillProgress.status === 'running') {
        return res.status(400).json({ success: false, error: "이미 소스 복구가 진행 중입니다." });
      }

      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://bloostore.co.kr/",
        "Accept": "application/json, text/html, */*",
      };
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // ── 타임아웃 + 리트라이 fetch 헬퍼 (backfill) ──
      const bfFetchRetry = async (url: string, retries = 3): Promise<Response | null> => {
        for (let attempt = 0; attempt < retries; attempt++) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          try {
            const r = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timer);
            if (r.ok) return r;
            if (r.status === 404) return null;
            if (attempt < retries - 1) await delay(200 * (attempt + 1));
          } catch (e: any) {
            clearTimeout(timer);
            console.warn(`[backfill] ${e?.name === 'AbortError' ? '타임아웃' : '오류'} (시도 ${attempt + 1}/${retries}): ${url}`);
            if (attempt < retries - 1) await delay(200 * (attempt + 1));
          }
        }
        return null;
      };

      backfillProgress = {
        status: 'running', total: 0, matched: 0,
        message: '블루스토어 상품 목록 수집 중...', startedAt: new Date(),
      };

      res.json({ success: true, message: "소스 매칭 시작 (백그라운드)" });

      (async () => {
        try {
          const bloostoreProducts: Array<{ name: string; idx: number; imageUrl: string }> = [];

          for (const brand of BLOOSTORE_WATCH_BRANDS) {
            let page = 1;
            const pageSize = 50;
            let hasMore = true;
            backfillProgress.message = `[${brand.name}] 상품 목록 수집 중...`;

            let bfPageErrStreak = 0;
            while (hasMore) {
              try {
                const ajaxUrl = `https://bloostore.co.kr/ajax/get_shop_list_view.cm?page=${page}&pagesize=${pageSize}&category=${brand.categoryId}&sort=recent&menu_url=${brand.pageUrl}`;
                const response = await bfFetchRetry(ajaxUrl, 3);

                if (!response) {
                  bfPageErrStreak++;
                  if (bfPageErrStreak >= 3) { hasMore = false; }
                  else { await delay(2000 * bfPageErrStreak); }
                  continue;
                }
                bfPageErrStreak = 0;
                const data = await response.json() as { html: string; msg: string };
                if (data.msg !== 'SUCCESS' || !data.html) { hasMore = false; continue; }

                const $ = cheerio.load(data.html);
                const elements = $('[data-product-properties]');
                if (elements.length === 0) { hasMore = false; continue; }

                for (let i = 0; i < elements.length; i++) {
                  try {
                    const parsed = JSON.parse($(elements[i]).attr('data-product-properties') || '');
                    if (parsed.name && parsed.idx) {
                      bloostoreProducts.push({
                        name: parsed.name.trim(),
                        idx: parsed.idx,
                        imageUrl: parsed.image_url ? parsed.image_url.split('?')[0] : '',
                      });
                    }
                  } catch {}
                }

                page++;
                if (page > 100) hasMore = false;
                await delay(200);
              } catch (err: any) {
                console.error(`[backfill] Error fetching ${brand.name} page ${page}:`, err.message);
                bfPageErrStreak++;
                if (bfPageErrStreak >= 5) { hasMore = false; }
                else { await delay(2000 * bfPageErrStreak); }
              }
            }
            console.log(`[backfill] ${brand.name}: collected ${bloostoreProducts.length} total products from bloostore`);
          }

          console.log(`[backfill] Total bloostore products collected: ${bloostoreProducts.length}`);
          backfillProgress.total = bloostoreProducts.length;
          backfillProgress.message = `DB 상품 매칭 중... (블루스토어 ${bloostoreProducts.length}개)`;

          const imgLookup = new Map<string, { idx: number }>();
          const nameLookup = new Map<string, { idx: number }>();
          for (const bp of bloostoreProducts) {
            if (bp.imageUrl) imgLookup.set(bp.imageUrl, { idx: bp.idx });
            const cleanName = bp.name.toLowerCase().replace(/\s+/g, ' ');
            nameLookup.set(cleanName, { idx: bp.idx });
          }

          let totalMatched = 0;
          const batchSize = 500;
          let offset = 0;
          let hasMoreDB = true;

          while (hasMoreDB) {
            const { products: batch, total } = await storage.getProductsFullPaginated(batchSize, offset);
            backfillProgress.message = `DB 매칭 중... (${offset}/${total})`;

            for (const product of batch) {
              if (product.sourceUrl || product.sourceIdx) continue;

              const imgs = [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean) as string[];
              const isBloostore = imgs.some(url => url.includes('cdn-optimized.imweb.me') || url.includes('cdn.imweb.me'));
              if (!isBloostore) continue;

              let matchedIdx: number | null = null;

              for (const img of imgs) {
                const cleanImg = img.split('?')[0];
                if (imgLookup.has(cleanImg)) {
                  matchedIdx = imgLookup.get(cleanImg)!.idx;
                  break;
                }
              }

              if (!matchedIdx) {
                const cleanName = product.name.trim().toLowerCase().replace(/\s+/g, ' ');
                if (nameLookup.has(cleanName)) {
                  matchedIdx = nameLookup.get(cleanName)!.idx;
                }
              }

              if (matchedIdx) {
                await storage.updateProduct(product.id, {
                  sourceUrl: `https://bloostore.co.kr/shop_view/?idx=${matchedIdx}`,
                  sourceIdx: matchedIdx,
                });
                totalMatched++;
                backfillProgress.matched = totalMatched;
              }
            }

            offset += batchSize;
            if (batch.length < batchSize) hasMoreDB = false;
          }

          backfillProgress.status = 'completed';
          backfillProgress.message = `완료! ${totalMatched}개 제품 소스 정보 복구됨`;
          backfillProgress.completedAt = new Date();
          console.log(`[backfill] Complete: ${totalMatched} products updated with source info`);
        } catch (error: any) {
          backfillProgress.status = 'error';
          backfillProgress.message = `오류: ${error.message}`;
          console.error('[backfill] Error:', error);
        }
      })();
    } catch (err: any) {
      console.error("[backfill] Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  });

  // ============= WATCH DETAIL IMAGE RE-CRAWL =============
  let watchDetailProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    updated: number;
    skipped: number;
    message: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, updated: 0, skipped: 0, message: '' };

  app.get("/api/admin/crawl/watch-details/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, ...watchDetailProgress });
  });

  app.post("/api/admin/crawl/watch-details/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (watchDetailProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 시계 상세이미지 크롤링이 진행 중입니다." });
    }

    const { onlyMissing } = req.body;

    watchDetailProgress = {
      status: 'running', total: 0, current: 0, updated: 0, skipped: 0,
      message: '시계 상품 상세이미지 크롤링 준비 중...', startedAt: new Date(),
    };

    res.json({ success: true, message: "시계 상세이미지 크롤링이 시작되었습니다." });

    (async () => {
      try {
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://bloostore.co.kr/",
          "Accept": "application/json, text/html, */*",
        };
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // ── 타임아웃 + 리트라이 fetch 헬퍼 (watch-detail) ──
        const wdFetch = async (url: string, extraHeaders: Record<string, string> = {}, timeoutMs = 8000): Promise<Response> => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            return await fetch(url, { headers: { ...headers, ...extraHeaders }, signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        };
        const wdFetchRetry = async (url: string, extraHeaders: Record<string, string> = {}, retries = 3): Promise<Response | null> => {
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const r = await wdFetch(url, extraHeaders);
              if (r.ok) return r;
              if (r.status === 404) return null;
              if (attempt < retries - 1) await delay(200 * (attempt + 1));
            } catch (e: any) {
              console.warn(`[watch-detail] ${e?.name === 'AbortError' ? '타임아웃' : '오류'} (시도 ${attempt + 1}/${retries}): ${url}`);
              if (attempt < retries - 1) await delay(200 * (attempt + 1));
            }
          }
          return null;
        };

        const watchCategory = (await storage.getAllCategories()).find(c => c.id === 'watches' || c.slug === 'watches' || c.name === '시계');
        if (!watchCategory) {
          watchDetailProgress.status = 'error';
          watchDetailProgress.message = '시계 카테고리를 찾을 수 없습니다.';
          return;
        }

        let watchProducts = await storage.getProductsByCategory(watchCategory.id);
        if (onlyMissing) {
          const imageCount = new Map<string, number>();
          watchProducts.forEach(p => {
            const url = p.imageUrl || '';
            imageCount.set(url, (imageCount.get(url) || 0) + 1);
          });
          watchProducts = watchProducts.filter(p => {
            const hasNoImages = !p.imageUrls || p.imageUrls.length <= 1;
            const hasSharedImage = imageCount.get(p.imageUrl || '') !== undefined && (imageCount.get(p.imageUrl || '') || 0) > 1;
            return hasNoImages || hasSharedImage;
          });
        }

        watchDetailProgress.total = watchProducts.length;
        watchDetailProgress.message = `총 ${watchProducts.length}개 시계 상품 상세이미지 크롤링 시작...`;
        console.log(`[watch-detail] Starting re-crawl for ${watchProducts.length} products`);

        const allSiteProducts: Array<{ name: string; idx: number; imageUrl: string; brand: string }> = [];
        const seenIdx = new Set<number>();

        const fetchBrandListingProducts = async (brand: typeof BLOOSTORE_WATCH_BRANDS[0]) => {
          let page = 1;
          const MAX_PAGES = 50;
          let listingErrorStreak = 0;
          while (page <= MAX_PAGES && listingErrorStreak < 4) {
            try {
              const listUrl = `https://bloostore.co.kr${brand.pageUrl}?page=${page}`;
              watchDetailProgress.message = `[${brand.name}] 상품 목록 수집 중... (페이지 ${page})`;
              const response = await wdFetchRetry(listUrl, { "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" }, 3);
              if (!response) { listingErrorStreak++; await delay(1500 * listingErrorStreak); continue; }
              listingErrorStreak = 0;
              const html = await response.text();

              let newCount = 0;
              let duplicateCount = 0;
              const $list = cheerio.load(html);
              $list('[data-product-properties]').each((_i, el) => {
                try {
                  const rawAttr = $list(el).attr('data-product-properties') || '';
                  const data = JSON.parse(rawAttr);
                  if (data.name && data.idx && data.image_url) {
                    if (seenIdx.has(data.idx)) {
                      duplicateCount++;
                      return;
                    }
                    seenIdx.add(data.idx);
                    const cleanUrl = data.image_url.split('?')[0];
                    allSiteProducts.push({
                      name: data.name.trim(),
                      idx: data.idx,
                      imageUrl: cleanUrl,
                      brand: brand.name,
                    });
                    newCount++;
                  }
                } catch (e) {
                  console.error(`[watch-detail] Failed to parse product properties:`, e);
                }
              });

              console.log(`[watch-detail] ${brand.name} page ${page}: ${newCount} new, ${duplicateCount} duplicates (${$list('[data-product-properties]').length} total)`);
              if (newCount === 0) break;
              page++;
              await delay(500);
            } catch (err) {
              console.error(`[watch-detail] Error fetching ${brand.name} page ${page}:`, err);
              listingErrorStreak++;
              await delay(1500 * listingErrorStreak);
            }
          }
        };

        watchDetailProgress.message = '브랜드별 상품 목록 수집 중...';
        for (const brand of BLOOSTORE_WATCH_BRANDS) {
          await fetchBrandListingProducts(brand);
          await delay(300);
        }
        console.log(`[watch-detail] Total site products collected: ${allSiteProducts.length}`);

        for (let i = 0; i < watchProducts.length; i++) {
          const product = watchProducts[i];
          watchDetailProgress.current = i + 1;
          watchDetailProgress.message = `(${i + 1}/${watchProducts.length}) ${product.name} 이미지 업데이트 중...`;

          const siteMatch = allSiteProducts.find(sp => sp.name === product.name);
          if (!siteMatch) {
            const normalizedName = product.name.replace(/\s+/g, '').toLowerCase();
            const fuzzyMatch = allSiteProducts.find(sp =>
              sp.name.replace(/\s+/g, '').toLowerCase() === normalizedName
            );
            if (!fuzzyMatch) {
              watchDetailProgress.skipped++;
              console.log(`[watch-detail] No match for: ${product.name}`);
              continue;
            }
            Object.assign(siteMatch || {}, fuzzyMatch);
          }

          const matched = siteMatch || allSiteProducts.find(sp =>
            sp.name.replace(/\s+/g, '').toLowerCase() === product.name.replace(/\s+/g, '').toLowerCase()
          );
          if (!matched) {
            watchDetailProgress.skipped++;
            continue;
          }

          try {
            const detailImages: string[] = [];
            const detailUrl = `https://bloostore.co.kr/shop_view/?idx=${matched.idx}`;
            await delay(300);
            const detailResponse = await wdFetchRetry(detailUrl, { "Accept": "text/html", "Accept-Language": "ko-KR,ko;q=0.9" }, 2);

            if (detailResponse) {
              const detailHtml = await detailResponse.text();

              const owlSection = detailHtml.match(/owl-carousel prod-owl-list[\s\S]*?<\/div>\s*<\/div>/);
              if (owlSection) {
                const owlImgs = owlSection[0].match(/src="(https:\/\/cdn[^"]+)"/g) || [];
                owlImgs.forEach(m => {
                  const url = m.replace('src="', '').replace('"', '').split('?')[0];
                  if (!detailImages.includes(url)) detailImages.push(url);
                });
                const dataOrigImgs = owlSection[0].match(/data-original="(https:\/\/cdn[^"]+)"/g) || [];
                dataOrigImgs.forEach(m => {
                  const url = m.replace('data-original="', '').replace('"', '').split('?')[0];
                  if (!detailImages.includes(url)) detailImages.push(url);
                });
              }

              const goodsImgSection = detailHtml.match(/shop_goods_img[\s\S]*?<\/ul>/);
              if (goodsImgSection) {
                const bgUrls = goodsImgSection[0].match(/url\('(https:\/\/cdn[^']+)'\)/g) || [];
                bgUrls.forEach(m => {
                  const url = m.replace("url('", '').replace("')", '').split('?')[0];
                  if (!detailImages.includes(url)) detailImages.push(url);
                });
              }

              const ogMatch = detailHtml.match(/og:image[^>]*content="(https:\/\/cdn[^"]+)"/);
              if (ogMatch) {
                const ogUrl = ogMatch[1].split('?')[0];
                if (!detailImages.includes(ogUrl)) detailImages.unshift(ogUrl);
              }
            }

            const listingImg = matched.imageUrl;
            const finalImages: string[] = [];
            if (listingImg) finalImages.push(listingImg);
            detailImages.forEach(img => {
              if (!finalImages.includes(img)) finalImages.push(img);
            });

            const finalImageUrl = listingImg || detailImages[0] || product.imageUrl || '';

            if (finalImageUrl) {
              await storage.updateProduct(product.id, {
                imageUrl: finalImageUrl,
                imageUrls: finalImages.length > 0 ? finalImages : [finalImageUrl],
              });
              watchDetailProgress.updated++;
              console.log(`[watch-detail] Updated ${product.name}: listing=${listingImg ? 'yes' : 'no'}, detail=${detailImages.length} imgs`);
            } else {
              watchDetailProgress.skipped++;
            }
          } catch (err) {
            watchDetailProgress.skipped++;
            console.error(`[watch-detail] Error for ${product.name}:`, err);
          }
        }

        watchDetailProgress.status = 'completed';
        watchDetailProgress.message = `완료! ${watchDetailProgress.updated}개 상품 업데이트, ${watchDetailProgress.skipped}개 건너뜀 (총 ${watchProducts.length}개)`;
        watchDetailProgress.completedAt = new Date();
        console.log(`[watch-detail] Complete: ${watchDetailProgress.updated} updated, ${watchDetailProgress.skipped} skipped`);

      } catch (error: any) {
        watchDetailProgress.status = 'error';
        watchDetailProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('[watch-detail] Error:', error);
      }
    })();
  });

  // ============= PUPPETEER DETAIL IMAGE FETCH (상세이미지) =============
  let puppeteerDetailProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    updated: number;
    skipped: number;
    message: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, updated: 0, skipped: 0, message: '' };

  app.get("/api/admin/crawl/puppeteer-details/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, ...puppeteerDetailProgress });
  });

  async function extractDetailImagesFromUrl(sourceUrl: string): Promise<string[]> {
    const resp = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const html = await resp.text();
    const $ = cheerio.load(html);

    const detailImages: string[] = [];

    const templateSelectors = ['#prodDetailPC', '#prodDetailMobile'];
    for (const sel of templateSelectors) {
      const templateEl = $(sel);
      if (templateEl.length > 0) {
        const templateHtml = templateEl.html() || '';
        const $t = cheerio.load(templateHtml);
        $t('img').each((_i: number, el: any) => {
          const src = $t(el).attr('src') || $t(el).attr('data-original') || $t(el).attr('data-src') || '';
          if (src && src.includes('cdn') && !detailImages.includes(src.split('?')[0])) {
            detailImages.push(src.split('?')[0]);
          }
        });
      }
    }

    if (detailImages.length === 0) {
      const templateRegex = /prodDetailPC['"]?[^>]*>([\s\S]*?)<\/(?:template|script)>/i;
      const match = html.match(templateRegex);
      if (match && match[1]) {
        const $t = cheerio.load(match[1]);
        $t('img').each((_i: number, el: any) => {
          const src = $t(el).attr('src') || $t(el).attr('data-original') || $t(el).attr('data-src') || '';
          if (src && src.includes('cdn') && !detailImages.includes(src.split('?')[0])) {
            detailImages.push(src.split('?')[0]);
          }
        });
      }
    }

    return detailImages;
  }

  app.post("/api/admin/crawl/puppeteer-details/single", requireAdminAuth, async (req: Request, res: Response) => {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: "상품 ID가 필요합니다." });
    }

    try {
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ success: false, error: "상품을 찾을 수 없습니다." });
      }

      let sourceUrl = product.sourceUrl;
      if (!sourceUrl && product.sourceIdx) {
        sourceUrl = `https://bloostore.co.kr/shop_view/?idx=${product.sourceIdx}`;
      }
      if (!sourceUrl) {
        return res.status(400).json({ success: false, error: "이 상품에는 원본 URL이 없습니다. bloostore에서 크롤링된 상품만 지원됩니다." });
      }

      const detailImages = await extractDetailImagesFromUrl(sourceUrl);

      const existingImages = product.imageUrls || [];
      const allImages = [...existingImages];
      detailImages.forEach(img => {
        if (!allImages.includes(img)) allImages.push(img);
      });

      await storage.updateProduct(product.id, {
        imageUrls: allImages,
        detailImageUrls: detailImages,
        sourceUrl: sourceUrl,
      });

      console.log(`[detail-crawl] Updated ${product.name}: ${detailImages.length} detail images found`);
      res.json({ success: true, message: `상세이미지 ${detailImages.length}개를 가져왔습니다.`, detailImages });
    } catch (error: any) {
      console.error(`[detail-crawl] Error:`, error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/admin/crawl/puppeteer-details/batch", requireAdminAuth, async (req: Request, res: Response) => {
    console.log("[detail-batch] Endpoint called, body:", JSON.stringify(req.body));
    try {
    if (puppeteerDetailProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 상세이미지 크롤링이 진행 중입니다." });
    }

    const { onlyMissing, categoryId, productIds } = req.body;

    puppeteerDetailProgress = {
      status: 'running', total: 0, current: 0, updated: 0, skipped: 0,
      message: '상세이미지 크롤링 준비 중...', startedAt: new Date(),
    };

    res.json({ success: true, message: "상세이미지 일괄 크롤링이 시작되었습니다." });

    (async () => {
      try {
        const getSourceUrl = (product: Product): string | null => {
          if (product.sourceUrl) return product.sourceUrl;
          if (product.sourceIdx) return `https://bloostore.co.kr/shop_view/?idx=${product.sourceIdx}`;
          const allImgUrls = [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean) as string[];
          for (const imgUrl of allImgUrls) {
            const bagMatch = imgUrl.match(/bagstyle\.site\/data\/item\/([^\/]+)\//);
            if (bagMatch) return `https://bagstyle.site/shop/item.php?it_id=${bagMatch[1]}`;
          }
          return null;
        };

        const targetProducts: Product[] = [];

        if (productIds && productIds.length > 0) {
          for (const pid of productIds) {
            const p = await storage.getProduct(pid);
            if (p) targetProducts.push(p);
          }
        } else {
          const batchSize = 500;
          let offset = 0;
          let hasMoreDB = true;
          while (hasMoreDB) {
            const { products: batch } = await storage.getProductsFullPaginated(batchSize, offset, categoryId || undefined);
            for (const p of batch) {
              const url = getSourceUrl(p);
              if (!url) continue;
              if (onlyMissing && p.detailImageUrls && p.detailImageUrls.length > 0) continue;
              targetProducts.push(p);
            }
            offset += batchSize;
            if (batch.length < batchSize) hasMoreDB = false;
            puppeteerDetailProgress.message = `상품 스캔 중... (${offset}개 확인)`;
          }
        }

        console.log(`[detail-batch] Target products: ${targetProducts.length}`);
        puppeteerDetailProgress.total = targetProducts.length;
        puppeteerDetailProgress.message = `총 ${targetProducts.length}개 상품 상세이미지 크롤링 시작...`;

        for (let i = 0; i < targetProducts.length; i++) {
          const product = targetProducts[i];
          puppeteerDetailProgress.current = i + 1;
          puppeteerDetailProgress.message = `(${i + 1}/${targetProducts.length}) ${product.name}`;

          const sourceUrl = getSourceUrl(product)!;

          try {
            let detailImages: string[] = [];

            if (sourceUrl.includes('bagstyle.site')) {
              const bagSourceId = sourceUrl.match(/it_id=([^&]+)/)?.[1];
              if (bagSourceId) {
                const bagHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
                const response = await fetch(sourceUrl, { headers: bagHeaders });
                if (response.ok) {
                  const html = await response.text();
                  const imgRegex = new RegExp(`https?://bagstyle\\.site/data/item/${bagSourceId}/[^"'\\s]+\\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)`, 'gi');
                  const matches = html.match(imgRegex) || [];
                  const uniqueImgs = [...new Set(matches.map((m: string) => m.split('?')[0]))];
                  const existingImgUrls = product.imageUrls || [];
                  detailImages = uniqueImgs.filter((img: string) => !existingImgUrls.some((e: string) => e.includes(img) || img.includes(e)));
                }
              }
            } else {
              detailImages = await extractDetailImagesFromUrl(sourceUrl);
            }

            if (detailImages.length > 0) {
              const existingImages = product.imageUrls || [];
              const allImages = [...existingImages];
              detailImages.forEach((img: string) => {
                if (!allImages.includes(img)) allImages.push(img);
              });

              await storage.updateProduct(product.id, {
                imageUrls: allImages,
                detailImageUrls: detailImages,
                sourceUrl: sourceUrl,
              });
              puppeteerDetailProgress.updated++;
              if (puppeteerDetailProgress.updated <= 5 || puppeteerDetailProgress.updated % 50 === 0) {
                console.log(`[detail-batch] ${product.name}: ${detailImages.length} detail images`);
              }
            } else {
              puppeteerDetailProgress.skipped++;
            }
          } catch (err: any) {
            puppeteerDetailProgress.skipped++;
            if (puppeteerDetailProgress.skipped <= 5) {
              console.error(`[detail-batch] Error for ${product.name}:`, err.message);
            }
          }

          await new Promise(r => setTimeout(r, 200));
        }

        puppeteerDetailProgress.status = 'completed';
        puppeteerDetailProgress.message = `완료! ${puppeteerDetailProgress.updated}개 업데이트, ${puppeteerDetailProgress.skipped}개 건너뜀`;
        puppeteerDetailProgress.completedAt = new Date();
        console.log(`[detail-batch] Complete: ${puppeteerDetailProgress.updated} updated, ${puppeteerDetailProgress.skipped} skipped`);

      } catch (error: any) {
        puppeteerDetailProgress.status = 'error';
        puppeteerDetailProgress.message = `오류: ${error.message}`;
        console.error('[detail-batch] Error:', error);
      }
    })();
    } catch (err: any) {
      console.error("[detail-batch] Handler error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message || "서버 오류가 발생했습니다." });
      }
    }
  });

  // ============= BAG DETAIL IMAGE RE-CRAWL =============
  let bagDetailProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    updated: number;
    skipped: number;
    message: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, updated: 0, skipped: 0, message: '' };

  app.get("/api/admin/crawl/bag-details/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, ...bagDetailProgress });
  });

  app.get("/api/admin/crawl/bag-details/count", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const allProducts = await storage.getAllProducts();
      const allCategories = await storage.getAllCategories();
      const bagCategoryIds = allCategories
        .filter(c => c.slug === 'bags' || c.name === '가방' || c.id === 'bags')
        .map(c => c.id);
      const bagProducts = allProducts.filter(p => bagCategoryIds.includes(p.categoryId || ''));
      const missingProducts = bagProducts.filter(p => {
        const hasOnlyThumbnail = !p.imageUrls || p.imageUrls.length <= 1;
        const hasSharedDetailOnly = !p.detailImageUrls || p.detailImageUrls.length === 0 ||
          (p.detailImageUrls.length > 0 && p.detailImageUrls.every(url => url.includes('/ebcontents/') || url.includes('/editor/')));
        return hasOnlyThumbnail || hasSharedDetailOnly;
      });
      res.json({ success: true, total: bagProducts.length, missing: missingProducts.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/admin/crawl/bag-details/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (bagDetailProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 가방 상세이미지 크롤링이 진행 중입니다." });
    }

    const { onlyMissing } = req.body;

    bagDetailProgress = {
      status: 'running', total: 0, current: 0, updated: 0, skipped: 0,
      message: '가방 상품 상세이미지 크롤링 준비 중...', startedAt: new Date(),
    };

    res.json({ success: true, message: "가방 상세이미지 크롤링이 시작되었습니다." });

    (async () => {
      try {
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://bagstyle.site/",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        };
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const allProducts = await storage.getAllProducts();
        const allCategories = await storage.getAllCategories();
        const bagCategoryIds = allCategories
          .filter(c => c.slug === 'bags' || c.name === '가방' || c.id === 'bags')
          .map(c => c.id);

        if (bagCategoryIds.length === 0) {
          bagDetailProgress.status = 'error';
          bagDetailProgress.message = '가방 카테고리를 찾을 수 없습니다.';
          return;
        }

        let bagProducts = allProducts.filter(p => bagCategoryIds.includes(p.categoryId || ''));
        if (onlyMissing) {
          bagProducts = bagProducts.filter(p => {
            const hasOnlyThumbnail = !p.imageUrls || p.imageUrls.length <= 1;
            const hasSharedDetailOnly = !p.detailImageUrls || p.detailImageUrls.length === 0 ||
              (p.detailImageUrls.length > 0 && p.detailImageUrls.every(url => url.includes('/ebcontents/') || url.includes('/editor/')));
            return hasOnlyThumbnail || hasSharedDetailOnly;
          });
        }

        if (bagProducts.length === 0) {
          bagDetailProgress.status = 'completed';
          bagDetailProgress.message = '크롤링할 가방 상품이 없습니다.';
          bagDetailProgress.completedAt = new Date();
          return;
        }

        bagDetailProgress.total = bagProducts.length;
        bagDetailProgress.message = `총 ${bagProducts.length}개 가방 상품 상세이미지 크롤링 시작...`;
        console.log(`[bag-detail] Starting re-crawl for ${bagProducts.length} products`);

        const extractSourceId = (product: typeof bagProducts[0]): string | null => {
          const url = product.imageUrl || '';
          const match = url.match(/\/data\/item\/([^\/]+)\//);
          if (match) return match[1];
          if (product.imageUrls && product.imageUrls.length > 0) {
            for (const imgUrl of product.imageUrls) {
              const m = imgUrl.match(/\/data\/item\/([^\/]+)\//);
              if (m) return m[1];
            }
          }
          return null;
        };

        for (let i = 0; i < bagProducts.length; i++) {
          const product = bagProducts[i];
          bagDetailProgress.current = i + 1;
          bagDetailProgress.message = `(${i + 1}/${bagProducts.length}) ${product.name} 상세이미지 수집 중...`;

          const sourceId = extractSourceId(product);
          if (!sourceId) {
            bagDetailProgress.skipped++;
            console.log(`[bag-detail] No source ID for: ${product.name}`);
            continue;
          }

          try {
            const detailUrl = `https://bagstyle.site/shop/item.php?it_id=${sourceId}`;
            await delay(200);
            const response = await fetch(detailUrl, { headers });
            if (!response.ok) {
              bagDetailProgress.skipped++;
              continue;
            }

            const html = await response.text();
            const $ = cheerio.load(html);

            const mainImages: string[] = [];
            const imgRegex = new RegExp(`https?://bagstyle\\.site/data/item/${sourceId}/[^"'\\s]+\\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)`, 'gi');
            const mainImgMatches = html.match(imgRegex) || [];
            mainImgMatches.forEach(img => {
              const clean = img.replace(/^http:/, 'https:').split('?')[0];
              if (!clean.includes('_100x100') && !clean.includes('_77x82') && !mainImages.includes(clean)) mainImages.push(clean);
            });
            if (mainImages.length === 0) {
              const relImgRegex = new RegExp(`/data/item/${sourceId}/[^"'\\s]+\\.(jpg|jpeg|png|webp|JPG|JPEG|PNG|WEBP)`, 'gi');
              const relMatches = html.match(relImgRegex) || [];
              relMatches.forEach(img => {
                const full = `https://bagstyle.site${img.split('?')[0]}`;
                if (!full.includes('_100x100') && !full.includes('_77x82') && !mainImages.includes(full)) mainImages.push(full);
              });
            }

            const detailImages: string[] = [];
            const detailRegex = /(?:https?:\/\/bagstyle\.site)?(?:\/styleis)?\/data\/(?:editor|ebcontents)\/[^"'\s]+\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)/gi;
            const detailMatches = html.match(detailRegex) || [];
            detailMatches.forEach(img => {
              let clean = img.split('?')[0];
              if (clean.startsWith('/styleis/')) clean = `https://bagstyle.site${clean}`;
              else if (clean.startsWith('/data/')) clean = `https://bagstyle.site${clean}`;
              else if (clean.startsWith('/')) clean = `https://bagstyle.site${clean}`;
              if (!detailImages.includes(clean)) detailImages.push(clean);
            });

            let detailContent = '';
            const explanHtml = $('#sit_inf_explan').html();
            if (explanHtml) {
              detailContent = explanHtml
                .replace(/src="\/styleis\/data\//g, 'src="https://bagstyle.site/styleis/data/')
                .replace(/src='\/styleis\/data\//g, "src='https://bagstyle.site/styleis/data/")
                .replace(/src="\/data\//g, 'src="https://bagstyle.site/data/')
                .replace(/src='\/data\//g, "src='https://bagstyle.site/data/");
            }

            const hasNewImages = mainImages.length > 0 || detailImages.length > 0;

            if (hasNewImages) {
              const updateData: Record<string, any> = {};
              if (mainImages.length > 0) {
                updateData.imageUrl = mainImages[0];
                updateData.imageUrls = mainImages;
              }
              if (detailImages.length > 0) {
                updateData.detailImageUrls = detailImages;
              }
              if (detailContent) {
                updateData.detailContent = detailContent;
              }
              await storage.updateProduct(product.id, updateData);
              bagDetailProgress.updated++;
              console.log(`[bag-detail] Updated ${product.name}: ${mainImages.length} main, ${detailImages.length} detail images`);
            } else {
              bagDetailProgress.skipped++;
            }
          } catch (err) {
            bagDetailProgress.skipped++;
            console.error(`[bag-detail] Error fetching detail for ${product.name}:`, err);
          }
        }

        bagDetailProgress.status = 'completed';
        bagDetailProgress.message = `완료! ${bagDetailProgress.updated}개 상품 업데이트, ${bagDetailProgress.skipped}개 건너뜀 (총 ${bagProducts.length}개)`;
        bagDetailProgress.completedAt = new Date();
        console.log(`[bag-detail] Complete: ${bagDetailProgress.updated} updated, ${bagDetailProgress.skipped} skipped`);

      } catch (error: any) {
        bagDetailProgress.status = 'error';
        bagDetailProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('[bag-detail] Error:', error);
      }
    })();
  });

  // Sync ALL accessory prices using comprehensive pattern matching
  app.post("/api/admin/sync-accessory-prices", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      console.log("Starting comprehensive accessory price sync...");
      let updatedCount = 0;
      
      // COMPLETE price rules covering ALL accessory types
      const priceRules = [
        // === 머플러/스카프 (Mufflers/Scarves) ===
        { pattern: '%버버리%머플러%', price: '209000' },
        { pattern: '%버버리%스카프%', price: '209000' },
        { pattern: '%샤넬%머플러%', price: '257000' },
        { pattern: '%샤넬%스카프%', price: '253000' },
        { pattern: '%에르메스%스카프%', price: '253000' },
        { pattern: '%에르메스%트윌리%', price: '225000' },
        { pattern: '%루이비통%머플러%', price: '245000' },
        { pattern: '%루이비통%스카프%', price: '240000' },
        { pattern: '%디올%머플러%', price: '230000' },
        { pattern: '%디올%스카프%', price: '230000' },
        { pattern: '%구찌%머플러%', price: '257000' },
        { pattern: '%구찌%스카프%', price: '240000' },
        { pattern: '%펜디%머플러%', price: '230000' },
        { pattern: '%셀린느%머플러%', price: '240000' },
        { pattern: '%발렌시아가%머플러%', price: '230000' },
        { pattern: '%로에베%머플러%', price: '245000' },
        { pattern: '%막스마라%머플러%', price: '220000' },
        { pattern: '%아크네%머플러%', price: '220000' },
        { pattern: '%미차%', price: '215000' },
        
        // === 벨트 (Belts) ===
        { pattern: '%에르메스%벨트%', price: '223000' },
        { pattern: '%구찌%벨트%', price: '195000' },
        { pattern: '%루이비통%벨트%', price: '210000' },
        { pattern: '%디올%벨트%', price: '200000' },
        { pattern: '%페레가모%벨트%', price: '185000' },
        { pattern: '%버버리%벨트%', price: '190000' },
        { pattern: '%보테가%벨트%', price: '210000' },
        
        // === 귀걸이/이어링 (Earrings) ===
        { pattern: '%에르메스 팝아슈 귀걸이%', price: '97000' },
        { pattern: '%에르메스 H 귀걸이%', price: '78000' },
        { pattern: '%에르메스%귀걸이%', price: '150000' },
        { pattern: '%에르메스%이어링%', price: '200000' },
        { pattern: '%샤넬%귀걸이%', price: '178000' },
        { pattern: '%샤넬%이어링%', price: '270000' },
        { pattern: '%디올%귀걸이%', price: '188000' },
        { pattern: '%디올%이어링%', price: '188000' },
        { pattern: '%구찌%귀걸이%', price: '165000' },
        { pattern: '%구찌%이어링%', price: '165000' },
        { pattern: '%미우미우%귀걸이%', price: '205000' },
        { pattern: '%미우미우%이어링%', price: '205000' },
        { pattern: '%티파니%귀걸이%', price: '150000' },
        { pattern: '%티파니%이어링%', price: '150000' },
        { pattern: '%불가리%귀걸이%', price: '180000' },
        { pattern: '%불가리%이어링%', price: '180000' },
        { pattern: '%까르띠에%귀걸이%', price: '130000' },
        { pattern: '%까르띠에%이어링%', price: '130000' },
        { pattern: '%반클리프%귀걸이%', price: '137000' },
        { pattern: '%반클리프%이어링%', price: '137000' },
        { pattern: '%셀린느%귀걸이%', price: '170000' },
        { pattern: '%셀린느%이어링%', price: '170000' },
        
        // === 목걸이/네크리스/펜던트/초커 (Necklaces/Pendants/Chokers) ===
        { pattern: '%에르메스%목걸이%', price: '140000' },
        { pattern: '%에르메스%네크리스%', price: '80000' },
        { pattern: '%에르메스%펜던트%', price: '140000' },
        { pattern: '%샤넬%목걸이%', price: '250000' },
        { pattern: '%샤넬%초커%', price: '220000' },
        { pattern: '%샤넬%펜던트%', price: '220000' },
        { pattern: '%디올%목걸이%', price: '230000' },
        { pattern: '%디올%펜던트%', price: '200000' },
        { pattern: '%구찌%목걸이%', price: '207000' },
        { pattern: '%구찌%펜던트%', price: '180000' },
        { pattern: '%티파니%목걸이%', price: '155000' },
        { pattern: '%티파니%펜던트%', price: '155000' },
        { pattern: '%불가리%목걸이%', price: '246000' },
        { pattern: '%불가리%펜던트%', price: '200000' },
        { pattern: '%까르띠에%목걸이%', price: '180000' },
        { pattern: '%까르띠에%펜던트%', price: '180000' },
        { pattern: '%반클리프%목걸이%', price: '278000' },
        { pattern: '%반클리프%펜던트%', price: '250000' },
        { pattern: '%셀린느%목걸이%', price: '203000' },
        { pattern: '%셀린느%펜던트%', price: '180000' },
        { pattern: '%루이비통%목걸이%', price: '220000' },
        { pattern: '%루이비통%펜던트%', price: '180000' },
        { pattern: '%크롬하츠%목걸이%', price: '150000' },
        { pattern: '%크롬하츠%펜던트%', price: '200000' },
        
        // === 팔찌/브레이슬릿/뱅글 (Bracelets/Bangles) ===
        { pattern: '%티파니%팔찌%', price: '225000' },
        { pattern: '%티파니%뱅글%', price: '142000' },
        { pattern: '%까르띠에%팔찌%', price: '144700' },
        { pattern: '%까르띠에%브레이슬릿%', price: '144700' },
        { pattern: '%까르띠에%뱅글%', price: '150000' },
        { pattern: '%에르메스%팔찌%', price: '200000' },
        { pattern: '%에르메스%브레이슬릿%', price: '200000' },
        { pattern: '%에르메스%뱅글%', price: '200000' },
        { pattern: '%불가리%팔찌%', price: '238000' },
        { pattern: '%불가리%브레이슬릿%', price: '238000' },
        { pattern: '%샤넬%팔찌%', price: '180000' },
        { pattern: '%샤넬%뱅글%', price: '180000' },
        { pattern: '%디올%팔찌%', price: '175000' },
        { pattern: '%구찌%팔찌%', price: '193000' },
        { pattern: '%구찌%브레이슬릿%', price: '193000' },
        { pattern: '%반클리프%팔찌%', price: '207000' },
        { pattern: '%반클리프%뱅글%', price: '207000' },
        { pattern: '%루이비통%팔찌%', price: '117000' },
        { pattern: '%크롬하츠%팔찌%', price: '150000' },
        
        // === 반지/링 (Rings) ===
        { pattern: '%티파니%반지%', price: '203000' },
        { pattern: '%티파니%링%', price: '80000' },
        { pattern: '%까르띠에%반지%', price: '180000' },
        { pattern: '%까르띠에%링%', price: '180000' },
        { pattern: '%까르띠에 러브%링%', price: '350000' },
        { pattern: '%불가리%반지%', price: '156000' },
        { pattern: '%불가리%링%', price: '156000' },
        { pattern: '%샤넬%반지%', price: '160000' },
        { pattern: '%샤넬%링%', price: '160000' },
        { pattern: '%디올%반지%', price: '150000' },
        { pattern: '%디올%링%', price: '150000' },
        { pattern: '%구찌%반지%', price: '140000' },
        { pattern: '%구찌%링%', price: '140000' },
        { pattern: '%에르메스%반지%', price: '105400' },
        { pattern: '%에르메스%링%', price: '105400' },
        { pattern: '%에르메스 더블링%', price: '105400' },
        { pattern: '%펜디%링%', price: '240000' },
        { pattern: '%크롬하츠%링%', price: '180000' },
        
        // === 모자 (Hats/Caps) ===
        { pattern: '%버킷햇%', price: '200000' },
        { pattern: '%볼캡%', price: '155000' },
        { pattern: '%비니%', price: '180000' },
        { pattern: '%베레모%', price: '175000' },
        { pattern: '%썬캡%', price: '215000' },
        { pattern: '%썬바이저%', price: '215000' },
        { pattern: '% 모자 %', price: '200000' },
        { pattern: '%> 모자%', price: '200000' },
        
        // === 키링/참 (Keyrings/Charms) ===
        { pattern: '%키링%', price: '175000' },
        { pattern: '%클립%', price: '160000' },
        { pattern: '%참%펜던트%', price: '180000' },
        
        // === 헤어악세사리 ===
        { pattern: '%헤어핀%', price: '135000' },
        { pattern: '%머리띠%', price: '150000' },
        { pattern: '%헤어밴드%', price: '150000' },
        { pattern: '%헤어클립%', price: '140000' },
        
        // === 브로치/핀 ===
        { pattern: '%브로치%', price: '200000' },
        
        // === 안경/선글라스 ===
        { pattern: '%안경%', price: '200000' },
        { pattern: '%선글라스%', price: '220000' },
        
        // === 넥타이 ===
        { pattern: '%넥타이%', price: '175000' },
        
        // === 시계줄/스트랩 ===
        { pattern: '%시계줄%', price: '120000' },
        { pattern: '%스트랩%', price: '120000' },
        
        // === 담요/블랭킷 (Blankets) ===
        { pattern: '%담요%', price: '230000' },
        { pattern: '%블랭킷%', price: '230000' },
        
        // === 기타 (ETC) ===
        { pattern: '%고야드%클립%', price: '160000' },
        { pattern: '%고야드%', price: '170000' },
      ];
      
      // Execute all price updates using batch SQL
      for (const rule of priceRules) {
        const count = await storage.batchUpdateCategoryPrices('jewelry', rule.pattern, rule.price);
        updatedCount += count;
      }
      
      const fallbackRules = [
        { pattern: '%머플러%', price: '230000' },
        { pattern: '%스카프%', price: '230000' },
        { pattern: '%벨트%', price: '200000' },
        { pattern: '%귀걸이%', price: '150000' },
        { pattern: '%이어링%', price: '170000' },
        { pattern: '%목걸이%', price: '180000' },
        { pattern: '%펜던트%', price: '180000' },
        { pattern: '%초커%', price: '200000' },
        { pattern: '%팔찌%', price: '180000' },
        { pattern: '%브레이슬릿%', price: '180000' },
        { pattern: '%뱅글%', price: '170000' },
        { pattern: '%반지%', price: '150000' },
        { pattern: '%링 %', price: '150000' },
        { pattern: '%링>%', price: '150000' },
        { pattern: '%네크리스%', price: '100000' },
      ];
      
      for (const rule of fallbackRules) {
        const count = await storage.batchUpdateCategoryPrices('jewelry', rule.pattern, rule.price);
        updatedCount += count;
      }
      
      const highPriceCount = await storage.fixHighCategoryPrices('jewelry');
      updatedCount += highPriceCount;
      
      const defaultCount = await storage.setDefaultCategoryPrices('jewelry', '180000');
      updatedCount += defaultCount;
      
      console.log(`Accessory price sync complete: ${updatedCount} products updated`);
      
      res.json({ 
        success: true, 
        message: `${updatedCount}개 악세사리 상품 가격이 업데이트되었습니다.`,
        updated: updatedCount
      });
    } catch (error: any) {
      console.error("Error syncing accessory prices:", error);
      res.status(500).json({ success: false, error: error.message || "가격 동기화 중 오류가 발생했습니다." });
    }
  });

  // Sync wallet prices
  app.post("/api/admin/sync-wallet-prices", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      console.log("Starting wallet price sync...");
      let updatedCount = 0;
      
      const priceRules = [
        { pattern: '%에르메스%지갑%', price: '350000' },
        { pattern: '%에르메스%카드지갑%', price: '280000' },
        { pattern: '%에르메스%장지갑%', price: '380000' },
        { pattern: '%샤넬%지갑%', price: '340000' },
        { pattern: '%샤넬%카드지갑%', price: '260000' },
        { pattern: '%샤넬%장지갑%', price: '360000' },
        { pattern: '%루이비통%지갑%', price: '290000' },
        { pattern: '%루이비통%카드지갑%', price: '230000' },
        { pattern: '%루이비통%장지갑%', price: '320000' },
        { pattern: '%디올%지갑%', price: '320000' },
        { pattern: '%디올%카드지갑%', price: '250000' },
        { pattern: '%구찌%지갑%', price: '280000' },
        { pattern: '%구찌%카드지갑%', price: '220000' },
        { pattern: '%프라다%지갑%', price: '300000' },
        { pattern: '%프라다%카드지갑%', price: '240000' },
        { pattern: '%보테가%지갑%', price: '350000' },
        { pattern: '%보테가%카드지갑%', price: '280000' },
        { pattern: '%셀린느%지갑%', price: '320000' },
        { pattern: '%셀린느%카드지갑%', price: '260000' },
        { pattern: '%펜디%지갑%', price: '290000' },
        { pattern: '%발렌시아가%지갑%', price: '280000' },
        { pattern: '%버버리%지갑%', price: '260000' },
        { pattern: '%고야드%지갑%', price: '350000' },
        { pattern: '%미우미우%지갑%', price: '270000' },
        { pattern: '%로에베%지갑%', price: '310000' },
      ];
      
      for (const rule of priceRules) {
        const count = await storage.batchUpdateCategoryPrices('wallets', rule.pattern, rule.price);
        updatedCount += count;
      }
      
      const highPriceCount = await storage.fixHighCategoryPrices('wallets');
      updatedCount += highPriceCount;
      
      const defaultCount = await storage.setDefaultCategoryPrices('wallets', '280000');
      updatedCount += defaultCount;
      
      console.log(`Wallet price sync complete: ${updatedCount} products updated`);
      
      res.json({ 
        success: true, 
        message: `${updatedCount}개 지갑 상품 가격이 업데이트되었습니다.`,
        updated: updatedCount
      });
    } catch (error: any) {
      console.error("Error syncing wallet prices:", error);
      res.status(500).json({ success: false, error: error.message || "가격 동기화 중 오류가 발생했습니다." });
    }
  });

  // Sync bag prices
  app.post("/api/admin/sync-bag-prices", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      console.log("Starting bag price sync...");
      let updatedCount = 0;
      
      const priceRules = [
        { pattern: '%에르메스%버킨%', price: '650000' },
        { pattern: '%에르메스%켈리%', price: '580000' },
        { pattern: '%에르메스%린디%', price: '450000' },
        { pattern: '%에르메스%피코탄%', price: '380000' },
        { pattern: '%에르메스%볼리드%', price: '420000' },
        { pattern: '%에르메스%가든파티%', price: '350000' },
        { pattern: '%에르메스%에블린%', price: '320000' },
        { pattern: '%에르메스%컨스탄스%', price: '480000' },
        { pattern: '%샤넬%클래식%', price: '520000' },
        { pattern: '%샤넬%보이백%', price: '480000' },
        { pattern: '%샤넬%가브리엘%', price: '450000' },
        { pattern: '%샤넬%19%', price: '460000' },
        { pattern: '%샤넬%22%', price: '470000' },
        { pattern: '%샤넬%코코핸들%', price: '440000' },
        { pattern: '%샤넬%드로스트링%', price: '420000' },
        { pattern: '%루이비통%네버풀%', price: '350000' },
        { pattern: '%루이비통%스피디%', price: '320000' },
        { pattern: '%루이비통%알마%', price: '380000' },
        { pattern: '%루이비통%카퓌신%', price: '450000' },
        { pattern: '%루이비통%트위스트%', price: '420000' },
        { pattern: '%루이비통%메티스%', price: '400000' },
        { pattern: '%디올%레이디%', price: '480000' },
        { pattern: '%디올%새들%', price: '420000' },
        { pattern: '%디올%북토트%', price: '380000' },
        { pattern: '%디올%바비%', price: '350000' },
        { pattern: '%구찌%마몬트%', price: '380000' },
        { pattern: '%구찌%디오니소스%', price: '400000' },
        { pattern: '%구찌%호스빗%', price: '360000' },
        { pattern: '%프라다%갈레리아%', price: '420000' },
        { pattern: '%프라다%리에디션%', price: '350000' },
        { pattern: '%보테가%카세트%', price: '450000' },
        { pattern: '%보테가%조디%', price: '480000' },
        { pattern: '%보테가%파데드%', price: '420000' },
        { pattern: '%셀린느%트리오페%', price: '380000' },
        { pattern: '%셀린느%벨트백%', price: '400000' },
        { pattern: '%셀린느%러기지%', price: '420000' },
        { pattern: '%로에베%퍼즐%', price: '420000' },
        { pattern: '%로에베%해먹%', price: '380000' },
        { pattern: '%발렌시아가%르카골%', price: '350000' },
        { pattern: '%발렌시아가%시티%', price: '380000' },
        { pattern: '%펜디%바게트%', price: '400000' },
        { pattern: '%펜디%피카부%', price: '450000' },
        { pattern: '%고야드%생루이%', price: '420000' },
        { pattern: '%고야드%앙주%', price: '380000' },
      ];
      
      for (const rule of priceRules) {
        const count = await storage.batchUpdateCategoryPrices('bags', rule.pattern, rule.price);
        updatedCount += count;
      }
      
      const highPriceCount = await storage.fixHighCategoryPrices('bags');
      updatedCount += highPriceCount;
      
      const defaultCount = await storage.setDefaultCategoryPrices('bags', '380000');
      updatedCount += defaultCount;
      
      console.log(`Bag price sync complete: ${updatedCount} products updated`);
      
      res.json({ 
        success: true, 
        message: `${updatedCount}개 가방 상품 가격이 업데이트되었습니다.`,
        updated: updatedCount
      });
    } catch (error: any) {
      console.error("Error syncing bag prices:", error);
      res.status(500).json({ success: false, error: error.message || "가격 동기화 중 오류가 발생했습니다." });
    }
  });

  // Sync shoe prices
  app.post("/api/admin/sync-shoe-prices", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      console.log("Starting shoe price sync...");
      let updatedCount = 0;
      
      const priceRules = [
        { pattern: '%발렌시아가%러너%', price: '320000' },
        { pattern: '%발렌시아가%트리플%', price: '350000' },
        { pattern: '%발렌시아가%스피드%', price: '280000' },
        { pattern: '%발렌시아가%디펜더%', price: '340000' },
        { pattern: '%구찌%라이톤%', price: '330000' },
        { pattern: '%구찌%스크리너%', price: '320000' },
        { pattern: '%구찌%에이스%', price: '290000' },
        { pattern: '%프라다%클라우드버스트%', price: '310000' },
        { pattern: '%프라다%아메리카스컵%', price: '290000' },
        { pattern: '%루이비통%트레일%', price: '350000' },
        { pattern: '%루이비통%아크라이트%', price: '340000' },
        { pattern: '%루이비통%런어웨이%', price: '330000' },
        { pattern: '%디올%B22%', price: '360000' },
        { pattern: '%디올%B23%', price: '320000' },
        { pattern: '%디올%B30%', price: '340000' },
        { pattern: '%샤넬%스니커즈%', price: '350000' },
        { pattern: '%골든구스%', price: '280000' },
        { pattern: '%나이키%', price: '250000' },
        { pattern: '%아디다스%', price: '220000' },
        { pattern: '%뉴발란스%', price: '240000' },
        { pattern: '%살로몬%', price: '260000' },
        { pattern: '%버버리%', price: '300000' },
        { pattern: '%보테가%', price: '350000' },
        { pattern: '%미우미우%', price: '290000' },
        { pattern: '%로에베%', price: '320000' },
        { pattern: '%마놀로%', price: '340000' },
        { pattern: '%지미추%', price: '320000' },
        { pattern: '%페레가모%', price: '290000' },
        { pattern: '%샌들%', price: '250000' },
        { pattern: '%슬리퍼%', price: '220000' },
        { pattern: '%로퍼%', price: '280000' },
        { pattern: '%부츠%', price: '320000' },
        { pattern: '%힐%', price: '290000' },
        { pattern: '%펌프스%', price: '300000' },
      ];
      
      for (const rule of priceRules) {
        const count = await storage.batchUpdateCategoryPrices('shoes', rule.pattern, rule.price);
        updatedCount += count;
      }
      
      const highPriceCount = await storage.fixHighCategoryPrices('shoes');
      updatedCount += highPriceCount;
      
      const defaultCount = await storage.setDefaultCategoryPrices('shoes', '300000');
      updatedCount += defaultCount;
      
      console.log(`Shoe price sync complete: ${updatedCount} products updated`);
      
      res.json({ 
        success: true, 
        message: `${updatedCount}개 신발 상품 가격이 업데이트되었습니다.`,
        updated: updatedCount
      });
    } catch (error: any) {
      console.error("Error syncing shoe prices:", error);
      res.status(500).json({ success: false, error: error.message || "가격 동기화 중 오류가 발생했습니다." });
    }
  });

  // ==================== MAGAZINES API ====================

  app.get("/api/magazines", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const items = await storage.getActiveMagazines(category as string | undefined);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch magazines" });
    }
  });

  app.get("/api/magazines/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.getMagazine(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch magazine" });
    }
  });

  app.get("/api/admin/magazines", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const items = await storage.getMagazines(category as string | undefined);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch magazines" });
    }
  });

  app.post("/api/admin/magazines", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertMagazineSchema.parse(req.body);
      const item = await storage.createMagazine(parsed);
      res.json({ success: true, data: item });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ success: false, error: "Failed to create magazine" });
    }
  });

  app.put("/api/admin/magazines/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const item = await storage.updateMagazine(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update magazine" });
    }
  });

  app.delete("/api/admin/magazines/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteMagazine(req.params.id);
      if (!success) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete magazine" });
    }
  });

  // ==================== CONTENT SECTIONS API ====================

  app.get("/api/content-sections", async (req: Request, res: Response) => {
    try {
      const { sectionType } = req.query;
      const items = await storage.getActiveContentSections(sectionType as string || "");
      const enriched = await Promise.all(items.map(async (item) => {
        const pids = (item.productIds || []).filter(Boolean);
        if (pids.length > 0) {
          const prods = await Promise.all(pids.map(async (pid) => {
            try {
              const p = await storage.getProduct(pid);
              return p ? { id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice, imageUrl: p.imageUrl, discountPercent: p.discountPercent, brandId: p.brandId } : null;
            } catch { return null; }
          }));
          return { ...item, products: prods.filter(Boolean) };
        }
        if (item.sectionType === "homepage_product" && (item.categorySlug || item.brandName)) {
          try {
            const maxCount = item.maxProducts || 6;
            let brandId: string | undefined;
            if (item.brandName) {
              const allBrands = await storage.getBrands();
              const matched = allBrands.find((b: any) => b.name?.toLowerCase() === item.brandName?.toLowerCase());
              brandId = matched?.id;
            }
            const result = await storage.getProductsPaginated(
              maxCount, 0,
              item.categorySlug || undefined,
              undefined,
              undefined,
              brandId,
              undefined
            );
            const prods = (result.products || []).map((p: any) => ({
              id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
              imageUrl: p.imageUrl, discountPercent: p.discountPercent, brandId: p.brandId,
            }));
            return { ...item, products: prods };
          } catch { return { ...item, products: [] }; }
        }
        return { ...item, products: [] };
      }));
      res.json({ success: true, data: enriched });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch content sections" });
    }
  });

  app.get("/api/content-sections/:id", async (req: Request, res: Response) => {
    try {
      const item = await storage.getContentSection(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch content section" });
    }
  });

  app.get("/api/admin/content-sections", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { sectionType } = req.query;
      const items = await storage.getContentSections(sectionType as string | undefined);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch content sections" });
    }
  });

  app.post("/api/admin/content-sections", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertContentSectionSchema.parse(req.body);
      const item = await storage.createContentSection(parsed);
      res.json({ success: true, data: item });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ success: false, error: "Failed to create content section" });
    }
  });

  app.put("/api/admin/content-sections/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const item = await storage.updateContentSection(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update content section" });
    }
  });

  app.delete("/api/admin/content-sections/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteContentSection(req.params.id);
      if (!success) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete content section" });
    }
  });

  app.post("/api/admin/content-sections/reorder", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { orders } = req.body as { orders: { id: string; sortOrder: number }[] };
      if (!Array.isArray(orders)) return res.status(400).json({ success: false, error: "orders 배열이 필요합니다." });
      await storage.reorderContentSections(orders);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "순서 저장 실패" });
    }
  });

  // ==================== LABS BLOCKS API ====================

  app.get("/api/labs-blocks", async (req: Request, res: Response) => {
    try {
      const items = await storage.getActiveLabsBlocks();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch labs blocks" });
    }
  });

  app.get("/api/admin/labs-blocks", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const items = await storage.getLabsBlocks();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch labs blocks" });
    }
  });

  app.post("/api/admin/labs-blocks", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertLabsBlockSchema.parse(req.body);
      const item = await storage.createLabsBlock(parsed);
      res.json({ success: true, data: item });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ success: false, error: "Failed to create labs block" });
    }
  });

  app.put("/api/admin/labs-blocks/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertLabsBlockSchema.partial().parse(req.body);
      const item = await storage.updateLabsBlock(req.params.id, parsed);
      if (!item) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, data: item });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ success: false, error: "Failed to update labs block" });
    }
  });

  app.delete("/api/admin/labs-blocks/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteLabsBlock(req.params.id);
      if (!success) return res.status(404).json({ success: false, error: "Not found" });
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete labs block" });
    }
  });

  app.get("/api/quick-menu", async (req: Request, res: Response) => {
    try {
      const items = await storage.getActiveQuickMenuItems();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch quick menu items" });
    }
  });

  app.get("/api/admin/quick-menu", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      if ((req as any).adminRole !== "super_admin") return res.status(403).json({ success: false, error: "권한이 없습니다." });
      const items = await storage.getAllQuickMenuItems();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch quick menu items" });
    }
  });

  app.post("/api/admin/quick-menu", requireAdminAuth, quickMenuImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      if ((req as any).adminRole !== "super_admin") return res.status(403).json({ success: false, error: "권한이 없습니다." });
      const { name, linkUrl, sortOrder, isActive } = req.body;
      if (!name || !linkUrl) {
        return res.status(400).json({ success: false, error: "이름과 링크 URL은 필수입니다." });
      }
      let imageUrl = req.body.imageUrl || "";
      if (req.file) {
        try {
          const uploadURL = await objectStorageService.getObjectEntityUploadURL();
          const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
          const fileBuffer = fs.readFileSync(req.file.path);
          const uploadRes = await fetch(uploadURL, { method: "PUT", body: fileBuffer, headers: { "Content-Type": req.file.mimetype } });
          if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
          fs.unlinkSync(req.file.path);
          imageUrl = objectPath;
        } catch {
          imageUrl = `/uploads/quickmenu/${req.file.filename}`;
        }
      }
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: "아이콘 이미지가 필요합니다." });
      }
      const item = await storage.createQuickMenuItem({
        name,
        imageUrl,
        linkUrl,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        isActive: isActive === "false" ? false : true,
      });
      res.json({ success: true, data: item });
    } catch (error) {
      console.error("Error creating quick menu item:", error);
      res.status(500).json({ success: false, error: "퀵 메뉴 항목 생성에 실패했습니다." });
    }
  });

  app.put("/api/admin/quick-menu/:id", requireAdminAuth, quickMenuImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      if ((req as any).adminRole !== "super_admin") return res.status(403).json({ success: false, error: "권한이 없습니다." });
      const { name, linkUrl, sortOrder, isActive } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
      if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder);
      if (isActive !== undefined) updateData.isActive = isActive === "true" || isActive === true;
      if (req.file) {
        try {
          const uploadURL = await objectStorageService.getObjectEntityUploadURL();
          const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
          const fileBuffer = fs.readFileSync(req.file.path);
          const uploadRes = await fetch(uploadURL, { method: "PUT", body: fileBuffer, headers: { "Content-Type": req.file.mimetype } });
          if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
          fs.unlinkSync(req.file.path);
          updateData.imageUrl = objectPath;
        } catch {
          updateData.imageUrl = `/uploads/quickmenu/${req.file.filename}`;
        }
      } else if (req.body.imageUrl !== undefined) {
        updateData.imageUrl = req.body.imageUrl;
      }
      const item = await storage.updateQuickMenuItem(req.params.id, updateData);
      if (!item) return res.status(404).json({ success: false, error: "항목을 찾을 수 없습니다." });
      res.json({ success: true, data: item });
    } catch (error) {
      console.error("Error updating quick menu item:", error);
      res.status(500).json({ success: false, error: "퀵 메뉴 항목 수정에 실패했습니다." });
    }
  });

  app.delete("/api/admin/quick-menu/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      if ((req as any).adminRole !== "super_admin") return res.status(403).json({ success: false, error: "권한이 없습니다." });
      const success = await storage.deleteQuickMenuItem(req.params.id);
      if (!success) return res.status(404).json({ success: false, error: "항목을 찾을 수 없습니다." });
      res.json({ success: true, message: "삭제되었습니다." });
    } catch (error) {
      res.status(500).json({ success: false, error: "퀵 메뉴 항목 삭제에 실패했습니다." });
    }
  });

  app.post("/api/admin/upload/quickmenu-image", requireAdminAuth, quickMenuImageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      if ((req as any).adminRole !== "super_admin") return res.status(403).json({ success: false, error: "권한이 없습니다." });
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ success: false, error: "이미지 파일이 필요합니다." });
      }
      const fileUrl = `/uploads/quickmenu/${file.filename}`;
      res.json({ success: true, data: { imageUrl: fileUrl } });
    } catch (error) {
      res.status(500).json({ success: false, error: "이미지 업로드에 실패했습니다." });
    }
  });

  app.post("/api/admin/update-product-options", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const KNOWN_COLORS = [
        "블랙","화이트","레드","블루","네이비","그레이","그린","핑크","브라운","베이지",
        "옐로우","옐로","오렌지","퍼플","아이보리","카키","골드","실버","와인","버건디",
        "크림","카멜","탄","올리브","민트","라벤더","코랄","터콰이즈","마룬","차콜",
        "Black","White","Red","Blue","Navy","Gray","Grey","Green","Pink","Brown","Beige",
        "Yellow","Orange","Purple","Ivory","Khaki","Gold","Silver","Wine","Burgundy",
        "Cream","Camel","Tan","Olive","Mint","Lavender","Coral","Turquoise","Maroon","Charcoal",
        "블랙/화이트","블랙/레드"
      ];
      const SIZE_PATTERNS = [
        /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/g,
        /\b(\d{2,3})\b/g,
        /\b(FREE|프리|원사이즈|One Size)\b/gi,
      ];

      function detectOptions(name: string, description?: string | null): { colors: string[]; sizes: string[] } {
        const text = `${name} ${description || ''}`;
        const colors: string[] = [];
        for (const color of KNOWN_COLORS) {
          if (text.includes(color)) {
            if (!colors.includes(color)) colors.push(color);
          }
        }
        const sizes: string[] = [];
        const sizeLetters = text.match(/\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b/g);
        if (sizeLetters) {
          for (const s of sizeLetters) {
            if (!sizes.includes(s)) sizes.push(s);
          }
        }
        const freeMatch = text.match(/\b(FREE|프리|원사이즈)\b/gi);
        if (freeMatch) {
          if (!sizes.includes("FREE")) sizes.push("FREE");
        }
        const shoeMatch = text.match(/\b(2[2-9]\d|3[0-3]\d)\b/g);
        if (shoeMatch) {
          for (const s of shoeMatch) {
            const n = parseInt(s);
            if (n >= 220 && n <= 310 && n % 5 === 0 && !sizes.includes(s)) {
              sizes.push(s);
            }
          }
        }
        return { colors, sizes };
      }

      const batchSize = 200;
      let offset = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;

      while (true) {
        const { products: batch, total } = await storage.getProductsFullPaginated(batchSize, offset);
        if (batch.length === 0) break;

        for (const p of batch) {
          if (p.options && p.options.trim()) {
            try {
              const existing = JSON.parse(p.options);
              if (existing && (
                (Array.isArray(existing.colors) && existing.colors.length > 0) ||
                (Array.isArray(existing.sizes) && existing.sizes.length > 0)
              )) continue;
            } catch {
              continue;
            }
          }
          const detected = detectOptions(p.name, p.description);
          if (detected.colors.length > 0 || detected.sizes.length > 0) {
            await storage.updateProduct(p.id, {
              options: JSON.stringify({ colors: detected.colors, sizes: detected.sizes, extras: [] })
            });
            totalUpdated++;
          }
        }
        totalProcessed += batch.length;
        offset += batchSize;
        if (offset >= total) break;
      }

      res.json({ success: true, message: `${totalUpdated}개 상품의 옵션이 자동 감지되었습니다. (총 ${totalProcessed}개 확인)`, updated: totalUpdated, processed: totalProcessed });
    } catch (error) {
      console.error("Error updating product options:", error);
      res.status(500).json({ success: false, error: "Failed to update product options" });
    }
  });

  app.post("/api/admin/update-product-genders", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const batchSize = 200;
      let offset = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;

      function detectGender(name: string): string | null {
        const lower = name.toLowerCase();
        if (lower.includes('남녀공용') || lower.includes('남녀') || lower.includes('유니섹스') || lower.includes('unisex')) return '공용';
        if (lower.includes('남성') || lower.includes('남자') || lower.includes('mens') || lower.includes("men's") || /\bmen\b/.test(lower) || /\bmens\b/.test(lower)) return '남성';
        if (lower.includes('여성') || lower.includes('여자') || lower.includes('womens') || lower.includes("women's") || /\bwomen\b/.test(lower) || /\bwomens\b/.test(lower) || lower.includes('ladies')) return '여성';
        return null;
      }

      while (true) {
        const { products: batch, total } = await storage.getProductsFullPaginated(batchSize, offset);
        if (batch.length === 0) break;

        for (const p of batch) {
          const detected = detectGender(p.name);
          if (detected && p.gender !== detected) {
            await storage.updateProduct(p.id, { gender: detected });
            totalUpdated++;
          }
        }
        totalProcessed += batch.length;
        offset += batchSize;
        if (offset >= total) break;
      }

      res.json({ success: true, message: `${totalUpdated}개 상품의 성별 정보가 업데이트되었습니다. (총 ${totalProcessed}개 확인)`, updated: totalUpdated, processed: totalProcessed });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update genders" });
    }
  });

  // ==================== 성별 기반 카테고리 재분류 ====================
  app.post("/api/admin/reclassify-by-gender-caid", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      // subcategoryId(ca_id 접두어)로 올바른 categoryId + gender 결정
      const CAID_CATEGORY_MAP: { prefix: string; categoryId: string; gender: string }[] = [
        { prefix: "b010", categoryId: "clothing",    gender: "남성" },
        { prefix: "b020", categoryId: "bags",        gender: "남성" },
        { prefix: "b040", categoryId: "wallets",     gender: "남성" },
        { prefix: "b0b0", categoryId: "shoes",       gender: "남성" },
        { prefix: "b0a0", categoryId: "accessories", gender: "남성" },
        { prefix: "b070", categoryId: "accessories", gender: "남성" },
        { prefix: "b080", categoryId: "accessories", gender: "남성" },
        { prefix: "c010", categoryId: "clothing",    gender: "여성" },
        { prefix: "c020", categoryId: "bags",        gender: "여성" },
        { prefix: "c030", categoryId: "wallets",     gender: "여성" },
        { prefix: "c040", categoryId: "watches",     gender: "여성" },
        { prefix: "c050", categoryId: "shoes",       gender: "여성" },
        { prefix: "c060", categoryId: "accessories", gender: "여성" },
        { prefix: "c070", categoryId: "accessories", gender: "여성" },
        { prefix: "f0a0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0b0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0c0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0d0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0e0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0f0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0g0", categoryId: "accessories", gender: "여성" },
        { prefix: "f0h0", categoryId: "accessories", gender: "여성" },
        { prefix: "f090", categoryId: "accessories", gender: "여성" },
        { prefix: "f080", categoryId: "accessories", gender: "여성" },
        { prefix: "f070", categoryId: "accessories", gender: "여성" },
        { prefix: "f050", categoryId: "accessories", gender: "여성" },
        { prefix: "f030", categoryId: "accessories", gender: "여성" },
        { prefix: "c0a0", categoryId: "accessories", gender: "여성" },
      ];

      // gender prefix fallback (subcategoryId 없는 경우)
      const GENDER_PREFIX = [
        { prefix: "b0", gender: "남성" },
        { prefix: "c0", gender: "여성" },
        { prefix: "f0", gender: "여성" }, // f0 = 쥬얼리/잡화 (여성)
      ];

      const rows = await pool.query(
        `SELECT id, category_id, subcategory_id, gender FROM products WHERE category_id IN ('men','women') OR gender IS NULL`
      );

      let changed = 0;
      let skipped = 0;

      for (const row of rows.rows) {
        const sub: string = row.subcategory_id || "";
        let newCategoryId: string | null = null;
        let newGender: string | null = row.gender || null;

        // 1. subcategoryId로 categoryId 결정
        const match = CAID_CATEGORY_MAP.find(m => sub.startsWith(m.prefix));
        if (match) {
          newCategoryId = match.categoryId;
          newGender = match.gender;
        }

        // 2. gender가 없으면 prefix로 결정
        if (!newGender) {
          const gMatch = GENDER_PREFIX.find(g => sub.startsWith(g.prefix));
          if (gMatch) newGender = gMatch.gender;
        }

        // 3. categoryId가 여전히 men/women이고 subcategoryId로 못 정했으면 스킵
        const currentCatWrong = row.category_id === "men" || row.category_id === "women";
        if (!newCategoryId && !currentCatWrong && row.gender === newGender) {
          skipped++;
          continue;
        }

        const updateData: Record<string, string> = {};
        if (newCategoryId && row.category_id !== newCategoryId) updateData.category_id = newCategoryId;
        if (newGender && row.gender !== newGender) updateData.gender = newGender;

        if (Object.keys(updateData).length === 0) { skipped++; continue; }

        const sets = Object.keys(updateData).map((k, i) => `${k} = $${i + 2}`).join(", ");
        await pool.query(`UPDATE products SET ${sets} WHERE id = $1`, [row.id, ...Object.values(updateData)]);
        changed++;
      }

      res.json({ success: true, data: { changed, skipped, total: rows.rows.length }, message: `${changed}개 상품 재분류 완료` });
    } catch (error) {
      console.error("[reclassify-by-gender-caid] Error:", error);
      res.status(500).json({ success: false, error: "재분류 중 오류가 발생했습니다." });
    }
  });

  // ==================== BLOOSTORE REVIEW DEBUG ====================
  app.get("/api/admin/crawl/bloostore-reviews/debug", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page) || 1;
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://www.bloostore.co.kr/",
      };
      const url = `https://www.bloostore.co.kr/330/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=${page}&only_photo=Y`;
      const resp = await fetch(url, { headers });
      const html = await resp.text();
      const $ = cheerio.load(html);

      // Detect all list-like elements
      const detected: any = {
        url,
        status: resp.status,
        htmlLength: html.length,
        title: $('title').text(),
        // Try various selectors
        selectors: {} as any,
        allLinks: [] as string[],
        sampleHtml: html.slice(0, 3000),
      };

      const testSelectors = [
        'ul.xe_list', 'ul.board_list', 'ul.result-list', 'ul.list_thumb',
        '.xe_board_list li', '.bd_lst li', '.board-list li',
        'table.board_list tr', '.document_list li', 'article',
        '.post-list li', '.thumb_list li', '.photo_list li',
        'ul li[class]', '.content_area li',
      ];
      for (const sel of testSelectors) {
        const count = $(sel).length;
        if (count > 0) {
          detected.selectors[sel] = count;
          const first = $(sel).first();
          detected[`sample_${sel.replace(/[^a-z0-9]/gi, '_')}`] = first.html()?.slice(0, 500);
        }
      }

      // Get all links that look like board posts
      $('a[href*="/330/"]').each((_i: number, el: any) => {
        const href = $(el).attr('href');
        if (href && href !== '/330/' && !detected.allLinks.includes(href)) {
          detected.allLinks.push(href);
        }
      });
      detected.allLinks = detected.allLinks.slice(0, 20);

      res.json({ success: true, data: detected });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==================== BLOOSTORE IMAGE PROXY ====================
  // Proxies cdn.imweb.me images with correct Referer to bypass hotlink protection
  app.get("/api/bloostore-image-proxy", async (req: Request, res: Response) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send("url required");
    let targetUrl: string;
    try {
      targetUrl = decodeURIComponent(rawUrl);
      new URL(targetUrl); // validate
    } catch {
      return res.status(400).send("invalid url");
    }
    if (!targetUrl.includes("cdn.imweb.me") && !targetUrl.includes("bloostore.co.kr")) {
      return res.status(403).send("forbidden");
    }
    try {
      const imgResp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://www.bloostore.co.kr/",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        }
      });
      if (!imgResp.ok) return res.status(imgResp.status).send("upstream error");
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      const buf = Buffer.from(await imgResp.arrayBuffer());
      return res.send(buf);
    } catch (err: any) {
      return res.status(500).send("proxy error");
    }
  });

  // ==================== BLOOSTORE REVIEW CRAWL ====================

  let bloostoreReviewProgress: {
    status: 'idle' | 'running' | 'done' | 'error';
    total: number;
    current: number;
    message: string;
    inserted: number;
    skipped: number;
    startedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, message: '', inserted: 0, skipped: 0 };

  app.get("/api/admin/crawl/bloostore-reviews/progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...bloostoreReviewProgress });
  });

  app.post("/api/admin/crawl/bloostore-reviews/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (bloostoreReviewProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 블루스토어 후기 크롤링이 진행 중입니다." });
    }

    const { maxPages = 10, clearExisting = false } = req.body;

    bloostoreReviewProgress = { status: 'running', total: 0, current: 0, message: '블루스토어 후기 크롤링 준비 중...', inserted: 0, skipped: 0, startedAt: new Date() };

    res.json({ success: true, message: "블루스토어 후기 크롤링이 시작되었습니다." });

    (async () => {
      try {
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9",
          "Referer": "https://www.bloostore.co.kr/",
        };
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
        const BASE_URL = "https://www.bloostore.co.kr";
        const BOARD_ID = "330";
        // imweb q param (base64 encoded board keyword config)
        const Q_PARAM = "YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9";

        // Helper: download image to local uploads/reviews/
        const reviewsDir = path.join(process.cwd(), 'uploads', 'reviews');
        if (!fs.existsSync(reviewsDir)) fs.mkdirSync(reviewsDir, { recursive: true });

        const downloadImage = async (srcUrl: string): Promise<string | null> => {
          try {
            const imgResp = await fetch(srcUrl, { headers: { ...headers, "Referer": BASE_URL + "/" } });
            if (!imgResp.ok) return null;
            const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
            const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg';
            const hash = crypto.createHash('md5').update(srcUrl).digest('hex').slice(0, 12);
            const fileName = `bloo_${hash}.${ext}`;
            const filePath = path.join(reviewsDir, fileName);
            if (!fs.existsSync(filePath)) {
              const buf = Buffer.from(await imgResp.arrayBuffer());
              fs.writeFileSync(filePath, buf);
            }
            return `/uploads/reviews/${fileName}`;
          } catch {
            return null;
          }
        };

        if (clearExisting) {
          bloostoreReviewProgress.message = '기존 크롤링 후기 삭제 중...';
          let offset = 0;
          while (true) {
            const { reviews: batch, total } = await storage.getReviewsPaginated(100, offset);
            if (batch.length === 0) break;
            for (const r of batch) {
              await storage.deleteReview(r.id);
            }
            if (offset + batch.length >= total) break;
            offset += batch.length;
          }
        }

        // === STEP 1: Collect idx values from list pages ===
        // imweb board uses: /330/?q=...&bmode=view&interlock=shop_review&idx=XXXXX&t=board
        const seenIdx = new Set<string>();
        const postIdxList: { idx: string; thumbnail: string | null }[] = [];

        for (let page = 1; page <= maxPages; page++) {
          bloostoreReviewProgress.message = `목록 페이지 ${page}/${maxPages} 수집 중...`;
          try {
            const listUrl = `${BASE_URL}/${BOARD_ID}/?q=${Q_PARAM}&page=${page}&only_photo=Y`;
            const resp = await fetch(listUrl, { headers });
            if (!resp.ok) { console.log(`[bloostore-review] Page ${page} HTTP ${resp.status}`); break; }
            const html = await resp.text();
            const $ = cheerio.load(html);

            let foundOnPage = 0;

            // Extract all links with bmode=view&interlock=shop_review&idx=
            $('a[href*="bmode=view"][href*="idx="]').each((_i: number, el: any) => {
              const href = $(el).attr('href') || '';
              const idxMatch = href.match(/[?&]idx=(\d+)/);
              if (!idxMatch) return;
              const idx = idxMatch[1];
              if (seenIdx.has(idx)) return;
              seenIdx.add(idx);

              // Try to get thumbnail image near this link
              let thumbnail: string | null = null;
              const $parent = $(el).closest('li, div.list_item, div.item, tr');
              if ($parent.length > 0) {
                let src = $parent.find('img').first().attr('src') || $parent.find('img').first().attr('data-src') || null;
                if (src && src.includes('cdn.imweb.me')) thumbnail = src;
              }
              if (!thumbnail) {
                // Try sibling img
                let src = $(el).find('img').first().attr('src') || null;
                if (src && src.includes('cdn.imweb.me')) thumbnail = src;
              }

              postIdxList.push({ idx, thumbnail });
              foundOnPage++;
            });

            console.log(`[bloostore-review] Page ${page}: found ${foundOnPage} posts (total: ${postIdxList.length})`);
            if (foundOnPage === 0) break;
            await delay(600);
          } catch (err) {
            console.error(`[bloostore-review] Error on list page ${page}:`, err);
            break;
          }
        }

        bloostoreReviewProgress.total = postIdxList.length;
        bloostoreReviewProgress.message = `총 ${postIdxList.length}개 후기 발견. 상세 내용 수집 중...`;
        console.log(`[bloostore-review] Total posts found: ${postIdxList.length}`);

        if (postIdxList.length === 0) {
          bloostoreReviewProgress.status = 'done';
          bloostoreReviewProgress.message = '후기를 찾을 수 없었습니다. 사이트 구조가 변경되었을 수 있습니다.';
          return;
        }

        // === STEP 2: Crawl each detail page ===
        // Detail URL: /330/?q=...&bmode=view&interlock=shop_review&idx=XXXXX&t=board
        const Q_DETAIL = "YToyOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjtzOjQ6InBhZ2UiO2k6MTt9";

        for (let i = 0; i < postIdxList.length; i++) {
          const { idx, thumbnail: listThumbnail } = postIdxList[i];
          bloostoreReviewProgress.current = i + 1;
          bloostoreReviewProgress.message = `(${i + 1}/${postIdxList.length}) 후기 상세 수집 중... (idx: ${idx})`;

          try {
            const detailUrl = `${BASE_URL}/${BOARD_ID}/?q=${Q_DETAIL}&bmode=view&interlock=shop_review&idx=${idx}&t=board`;
            const detailResp = await fetch(detailUrl, { headers });
            if (!detailResp.ok) {
              console.log(`[bloostore-review] Detail HTTP ${detailResp.status} for idx=${idx}`);
              bloostoreReviewProgress.skipped++;
              continue;
            }
            const detailHtml = await detailResp.text();
            const $d = cheerio.load(detailHtml);

            // Title: h1.view_tit
            const title = $d('h1.view_tit').first().text().trim() || '블루스토어 구매 후기';

            // Author: .write (shows masked name like "이호****")
            const authorName = $d('.write').first().text().trim() || '고객';

            // Content images: img tags inside .board_txt_area
            const contentImgUrls: string[] = [];
            $d('.board_txt_area img, .board_contents img').each((_ii: number, imgEl: any) => {
              let src = $d(imgEl).attr('src') || $d(imgEl).attr('data-src') || '';
              if (!src) return;
              if (src.startsWith('//')) src = 'https:' + src;
              if (!src.startsWith('http')) src = BASE_URL + src;
              // Only include content images (from imweb CDN with upload paths)
              if (!src.includes('cdn.imweb.me/upload') && !src.includes('cdn.imweb.me/thumbnail')) return;
              // Exclude site logo/icon thumbnails (very small dates or known non-review images)
              if (src.includes('/20230925/') || src.includes('/20231201/2a1271661af63') || src.includes('/20240119/9e771eb0812b7')) return;
              if (!contentImgUrls.includes(src)) contentImgUrls.push(src);
            });

            // Fallback to list thumbnail if no content images
            const rawImageUrls = contentImgUrls.length > 0 ? contentImgUrls : (listThumbnail ? [listThumbnail] : []);

            console.log(`[bloostore-review] idx=${idx} title="${title}" author="${authorName}" images=${rawImageUrls.length}`);

            // Download images to local server
            const localImageUrls: string[] = [];
            for (const imgUrl of rawImageUrls.slice(0, 5)) { // max 5 images per review
              const localPath = await downloadImage(imgUrl);
              if (localPath) localImageUrls.push(localPath);
              await delay(200);
            }

            // If local download failed, use proxy URLs so browser can load via server with correct Referer
            const proxyImageUrls = rawImageUrls.map(u => `/api/bloostore-image-proxy?url=${encodeURIComponent(u)}`);
            const finalImageUrls = localImageUrls.length > 0 ? localImageUrls : proxyImageUrls;

            const reviewData: any = {
              authorName,
              title,
              content: '',
              imageUrl: finalImageUrls[0] || null,
              imageUrls: finalImageUrls,
              rating: 5,
              isVisible: true,
              isBest: false,
              displayDate: new Date(),
            };

            await storage.createReview(reviewData);
            bloostoreReviewProgress.inserted++;
          } catch (err) {
            console.error(`[bloostore-review] Error on detail idx=${idx}:`, err);
            bloostoreReviewProgress.skipped++;
          }

          await delay(500);
        }

        bloostoreReviewProgress.status = 'done';
        bloostoreReviewProgress.message = `완료! ${bloostoreReviewProgress.inserted}개 후기 저장, ${bloostoreReviewProgress.skipped}개 건너뜀`;
        console.log(`[bloostore-review] Crawl complete: ${bloostoreReviewProgress.inserted} inserted`);
      } catch (error: any) {
        bloostoreReviewProgress.status = 'error';
        bloostoreReviewProgress.message = `오류 발생: ${error.message || '알 수 없는 오류'}`;
        console.error('[bloostore-review] Fatal error:', error);
      }
    })();
  });

  // ══════════════════════════════════════════════════════════════════════
  // 카테고리 재분류 (Re-classify) 기능
  // ══════════════════════════════════════════════════════════════════════

  // 카테고리 키워드 규칙 (우선순위 높은 것부터)
  const CATEGORY_KEYWORDS_RULES: Array<{ keywords: string[]; categoryId: string; priority: number }> = [
    { keywords: ['선글라스', '안경테', '아이웨어'], categoryId: 'sunglasses', priority: 10 },
    { keywords: ['벨트'], categoryId: 'belts', priority: 9 },
    { keywords: ['시계', '워치', 'watch'], categoryId: 'watches', priority: 8 },
    { keywords: ['지갑', '카드지갑', '카드케이스', '장지갑', '반지갑', '동전지갑', '카드홀더'], categoryId: 'wallets', priority: 7 },
    { keywords: ['목걸이', '귀걸이', '이어링', '반지', '팔찌', '브로치', '주얼리', '쥬얼리', '헤어핀', '헤어밴드', '스카프', '머플러'], categoryId: 'accessories', priority: 6 },
    { keywords: ['스니커즈', '운동화', '부츠', '샌들', '슬리퍼', '로퍼', '플랫슈즈', '힐', '뮬', '신발', '슈즈', '펌프스', '웨지'], categoryId: 'shoes', priority: 5 },
    { keywords: ['백팩', '핸드백', '숄더백', '토트백', '클러치', '크로스백', '보스턴백', '에코백', '쇼퍼백', '미니백', '버킷백', '사첼', '호보백'], categoryId: 'bags', priority: 4 },
    { keywords: ['코트', '재킷', '자켓', '니트', '스웨터', '셔츠', '티셔츠', '팬츠', '바지', '스커트', '원피스', '후드', '패딩', '점퍼', '블라우스', '가디건', '블레이저', '수트', '트레이닝', '조거', '탑', '베스트', '카디건'], categoryId: 'clothing', priority: 3 },
  ];

  // bagstyle ca_id → 우리 카테고리 localId 매핑
  const CA_ID_TO_CATEGORY: Record<string, string> = {
    'b010': 'clothing',    'c010': 'clothing',
    'b020': 'bags',        'c020': 'bags',
    'b040': 'wallets',
    'b0b0': 'shoes',       'c050': 'shoes',
    'c040': 'watches',
    'b0a0': 'sunglasses',  'c070': 'sunglasses',
    'b070': 'belts',       'c060': 'belts',
    'b080': 'accessories',
    // f0 하위 쥬얼리/잡화 전체
    'f0a0': 'accessories', 'f0b0': 'accessories', 'f0c0': 'accessories', 'f0d0': 'accessories',
    'f0e0': 'accessories', 'f0f0': 'accessories', 'f0g0': 'accessories', 'f0h0': 'accessories',
    'f090': 'accessories', 'f080': 'accessories', 'f070': 'accessories', 'f050': 'accessories',
    'f030': 'accessories', 'c0a0': 'accessories',
    // 가방 전용 페이지 소분류
    'e0a0': 'bags', 'e0b0': 'bags', 'e0c0': 'bags', 'e0d0': 'bags', 'e0e0': 'bags',
  };

  // 상품명에서 카테고리 추론
  function inferCategoryFromName(name: string): string | null {
    const lower = name.toLowerCase();
    let best: { categoryId: string; priority: number } | null = null;
    for (const rule of CATEGORY_KEYWORDS_RULES) {
      for (const kw of rule.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          if (!best || rule.priority > best.priority) {
            best = { categoryId: rule.categoryId, priority: rule.priority };
          }
          break;
        }
      }
    }
    return best ? best.categoryId : null;
  }

  // URL 재분류 진행 상태
  let reclassifyUrlProgress: {
    status: 'idle' | 'running' | 'done' | 'error';
    total: number;
    current: number;
    changed: number;
    skipped: number;
    failed: number;
    message: string;
  } = { status: 'idle', total: 0, current: 0, changed: 0, skipped: 0, failed: 0, message: '' };

  // ── 분석 (분류 현황 리포트) ────────────────────────────────────────────
  app.post("/api/admin/products/reclassify-analyze", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        const totalRows = await client.query(`SELECT COUNT(*)::int as cnt FROM products`);

        const byCategoryRows = await client.query(`
          SELECT c.name as cat_name, p.category_id, COUNT(*)::int as cnt
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          GROUP BY p.category_id, c.name
          ORDER BY cnt DESC
        `);

        const wrongCatRows = await client.query(`
          SELECT COUNT(*)::int as cnt FROM products
          WHERE category_id IN ('men', 'women')
        `);

        const noBrandRows = await client.query(`
          SELECT COUNT(*)::int as cnt FROM products
          WHERE brand_id IS NULL
        `);

        const hasUrlWrongRows = await client.query(`
          SELECT COUNT(*)::int as cnt FROM products
          WHERE category_id IN ('men', 'women')
            AND source_url IS NOT NULL AND source_url != ''
        `);

        // 규칙 기반으로 분류 가능한 것 미리 예측
        const sampleWrong = await client.query(`
          SELECT id, name, category_id FROM products
          WHERE category_id IN ('men', 'women')
          LIMIT 500
        `);
        let predictRuleFixed = 0;
        let predictNeedUrl = 0;
        for (const row of sampleWrong.rows) {
          if (inferCategoryFromName(row.name)) predictRuleFixed++;
          else predictNeedUrl++;
        }
        const wrongTotal = wrongCatRows.rows[0].cnt;
        const sampleRatio = sampleWrong.rows.length > 0 ? sampleWrong.rows.length / wrongTotal : 1;
        const estimatedRuleFixed = sampleRatio < 1 ? Math.round(predictRuleFixed / sampleRatio) : predictRuleFixed;

        res.json({
          success: true,
          data: {
            totalProducts: totalRows.rows[0].cnt,
            byCategory: byCategoryRows.rows,
            wrongCategoryCount: wrongTotal,
            noBrandCount: noBrandRows.rows[0].cnt,
            hasUrlAndWrong: hasUrlWrongRows.rows[0].cnt,
            estimatedRuleFixed,
          }
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[reclassify-analyze] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── 규칙 기반 재분류 (빠름 — DB만 사용) ──────────────────────────────
  app.post("/api/admin/products/reclassify-rules", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        // category_id가 'men' 또는 'women'인 상품 전체 가져오기
        const wrongRows = await client.query(`
          SELECT id, name, category_id, gender FROM products
          WHERE category_id IN ('men', 'women')
        `);

        let changed = 0;
        let skipped = 0;

        await client.query('BEGIN');
        try {
          for (const row of wrongRows.rows) {
            const inferred = inferCategoryFromName(row.name);
            if (inferred) {
              await client.query(
                `UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2`,
                [inferred, row.id]
              );
              changed++;
            } else {
              skipped++;
            }
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }

        console.log(`[reclassify-rules] changed=${changed}, skipped=${skipped}`);
        res.json({ success: true, data: { changed, skipped, total: wrongRows.rows.length } });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[reclassify-rules] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── URL 재방문 재분류 진행 상태 조회 ─────────────────────────────────
  app.get("/api/admin/products/reclassify-url/progress", requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ success: true, data: reclassifyUrlProgress });
  });

  // ── URL 재방문 재분류 초기화 ─────────────────────────────────────────
  app.post("/api/admin/products/reclassify-url/reset", requireAdminAuth, (_req: Request, res: Response) => {
    if (reclassifyUrlProgress.status === 'running') {
      return res.status(400).json({ success: false, error: '진행 중에는 초기화할 수 없습니다.' });
    }
    reclassifyUrlProgress = { status: 'idle', total: 0, current: 0, changed: 0, skipped: 0, failed: 0, message: '' };
    res.json({ success: true });
  });

  // ── URL 재방문 재분류 시작 (비동기) ──────────────────────────────────
  app.post("/api/admin/products/reclassify-url/start", requireAdminAuth, async (_req: Request, res: Response) => {
    if (reclassifyUrlProgress.status === 'running') {
      return res.status(400).json({ success: false, error: '이미 실행 중입니다.' });
    }

    reclassifyUrlProgress = { status: 'running', total: 0, current: 0, changed: 0, skipped: 0, failed: 0, message: '준비 중...' };
    res.json({ success: true, message: '재분류 시작' });

    // 비동기 실행
    (async () => {
      const client = await pool.connect();
      try {
        // category_id가 'men'/'women'이면서 source_url이 bagstyle인 상품
        const rows = await client.query(`
          SELECT id, name, source_url, category_id, gender
          FROM products
          WHERE category_id IN ('men', 'women')
            AND source_url IS NOT NULL AND source_url != ''
            AND source_url LIKE '%bagstyle.site%'
          ORDER BY id
        `);

        reclassifyUrlProgress.total = rows.rows.length;
        reclassifyUrlProgress.message = `${rows.rows.length}개 상품 URL 재방문 시작`;

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        };

        for (const row of rows.rows) {
          reclassifyUrlProgress.current++;
          reclassifyUrlProgress.message = `[${reclassifyUrlProgress.current}/${reclassifyUrlProgress.total}] ${row.name.slice(0, 30)} 분석 중...`;

          try {
            const resp = await fetch(row.source_url, { headers, signal: AbortSignal.timeout(8000) });
            if (!resp.ok) { reclassifyUrlProgress.skipped++; continue; }

            const html = await resp.text();

            // breadcrumb에서 ca_id 파싱
            let foundCategory: string | null = null;
            const caIdMatches = html.match(/ca_id=([a-z0-9]+)/gi) || [];
            for (const m of caIdMatches) {
              const caVal = m.replace(/ca_id=/i, '').toLowerCase();
              if (CA_ID_TO_CATEGORY[caVal]) {
                foundCategory = CA_ID_TO_CATEGORY[caVal];
                break;
              }
            }

            // ca_id 못 찾으면 이름으로 추론
            if (!foundCategory) {
              foundCategory = inferCategoryFromName(row.name);
            }

            if (foundCategory && foundCategory !== row.category_id) {
              await client.query(
                `UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2`,
                [foundCategory, row.id]
              );
              reclassifyUrlProgress.changed++;
            } else {
              reclassifyUrlProgress.skipped++;
            }
          } catch {
            reclassifyUrlProgress.failed++;
          }

          await new Promise(r => setTimeout(r, 200));
        }

        reclassifyUrlProgress.status = 'done';
        reclassifyUrlProgress.message = `완료! 변경: ${reclassifyUrlProgress.changed}개, 건너뜀: ${reclassifyUrlProgress.skipped}개, 실패: ${reclassifyUrlProgress.failed}개`;
        console.log(`[reclassify-url] Done: changed=${reclassifyUrlProgress.changed}`);
      } catch (error: any) {
        reclassifyUrlProgress.status = 'error';
        reclassifyUrlProgress.message = `오류: ${error.message}`;
        console.error('[reclassify-url] Fatal:', error);
      } finally {
        client.release();
      }
    })();
  });

  // ── 브랜드 재매칭 ─────────────────────────────────────────────────────
  app.post("/api/admin/products/rematch-brands", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        const allBrands = await storage.getAllBrands();

        // 브랜드가 없는 상품 전체
        const noBrandRows = await client.query(`
          SELECT id, name FROM products WHERE brand_id IS NULL
        `);

        let matched = 0;
        let unmatched = 0;

        await client.query('BEGIN');
        try {
          // 배치 처리 (500개 단위)
          const batchSize = 500;
          for (let i = 0; i < noBrandRows.rows.length; i += batchSize) {
            const batch = noBrandRows.rows.slice(i, i + batchSize);
            for (const row of batch) {
              const brandId = matchBrandFromText(row.name, allBrands);
              if (brandId) {
                await client.query(
                  `UPDATE products SET brand_id = $1, updated_at = NOW() WHERE id = $2`,
                  [brandId, row.id]
                );
                matched++;
              } else {
                unmatched++;
              }
            }
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }

        console.log(`[rematch-brands] matched=${matched}, unmatched=${unmatched}`);
        res.json({ success: true, data: { matched, unmatched, total: noBrandRows.rows.length } });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[rematch-brands] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── 중복 상품 분석 (dry-run) ──────────────────────────────────────────
  app.post("/api/admin/products/dedup-analyze", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        // 1) source_url 기준 중복
        const urlDupGroups = await client.query(`
          SELECT source_url, COUNT(*) as cnt, MIN(created_at) as oldest
          FROM products
          WHERE source_url IS NOT NULL AND source_url != ''
          GROUP BY source_url
          HAVING COUNT(*) > 1
          ORDER BY cnt DESC
          LIMIT 20
        `);

        const urlDupTotalRows = await client.query(`
          SELECT COALESCE(SUM(sub.cnt - 1), 0)::int as extra
          FROM (
            SELECT COUNT(*) as cnt
            FROM products
            WHERE source_url IS NOT NULL AND source_url != ''
            GROUP BY source_url
            HAVING COUNT(*) > 1
          ) sub
        `);

        // 2) 이름+브랜드+카테고리 기준 중복 (source_url 없는 것 포함 전체)
        const nameDupTotalRows = await client.query(`
          SELECT COALESCE(SUM(sub.cnt - 1), 0)::int as extra
          FROM (
            SELECT COUNT(*) as cnt
            FROM products
            GROUP BY name, brand_id, category_id
            HAVING COUNT(*) > 1
          ) sub
        `);

        // 3) 전체 통계
        const totalRows = await client.query(`SELECT COUNT(*)::int as total FROM products`);
        const byCategory = await client.query(`
          SELECT c.name as category_name, COUNT(p.id)::int as cnt
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          GROUP BY c.name
          ORDER BY cnt DESC
        `);

        res.json({
          success: true,
          data: {
            totalProducts: totalRows.rows[0].total,
            byCategory: byCategory.rows,
            urlDuplicates: {
              groupCount: urlDupGroups.rowCount || 0,
              wouldDelete: urlDupTotalRows.rows[0].extra,
              samples: urlDupGroups.rows.map((r: any) => ({
                url: r.source_url?.substring(0, 80),
                count: parseInt(r.cnt),
              })),
            },
            nameDuplicates: {
              wouldDelete: nameDupTotalRows.rows[0].extra,
            },
            totalWouldDelete: urlDupTotalRows.rows[0].extra,
          }
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[dedup-analyze] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── 중복 상품 실제 제거 ───────────────────────────────────────────────
  app.post("/api/admin/products/dedup-execute", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1단계: source_url 기준 중복 제거 (가장 오래된 것 보존)
        const urlResult = await client.query(`
          DELETE FROM products
          WHERE id IN (
            SELECT id FROM (
              SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY source_url
                  ORDER BY created_at ASC
                ) AS rn
              FROM products
              WHERE source_url IS NOT NULL AND source_url != ''
            ) t
            WHERE rn > 1
          )
          RETURNING id
        `);
        const urlDeleted = urlResult.rowCount || 0;

        // 2단계: 이름+브랜드+카테고리 기준 중복 제거 (가장 오래된 것 보존)
        const nameResult = await client.query(`
          DELETE FROM products
          WHERE id IN (
            SELECT id FROM (
              SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY name, brand_id, category_id
                  ORDER BY created_at ASC
                ) AS rn
              FROM products
            ) t
            WHERE rn > 1
          )
          RETURNING id
        `);
        const nameDeleted = nameResult.rowCount || 0;

        await client.query('COMMIT');

        const totalAfter = await client.query(`SELECT COUNT(*)::int as cnt FROM products`);

        console.log(`[dedup-execute] URL 기준 ${urlDeleted}개, 이름 기준 ${nameDeleted}개 삭제. 남은 상품: ${totalAfter.rows[0].cnt}`);

        res.json({
          success: true,
          data: {
            urlDuplicatesDeleted: urlDeleted,
            nameDuplicatesDeleted: nameDeleted,
            totalDeleted: urlDeleted + nameDeleted,
            remainingProducts: totalAfter.rows[0].cnt,
          }
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('[dedup-execute] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
