import type { Express, Request, Response } from "express";
import { type Server } from "http";
import * as cheerio from "cheerio";
import compression from "compression";
import { storage } from "./storage";
import { 
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
  insertCouponPaymentSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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

const ADMIN_USERNAME = "admin123";
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
  
  // ==================== IMAGE PROXY API ====================
  
  // In-memory image cache for faster subsequent loads
  const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();
  const IMAGE_CACHE_TTL = 600000; // 10 minutes in milliseconds
  const MAX_IMAGE_CACHE_SIZE = 100; // Maximum cached images
  
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
      
      // Allow proxying from cdamdong.co.kr and cdn.shopify.com
      const allowedDomains = ["cdamdong.co.kr", "cdn.shopify.com"];
      const isAllowed = allowedDomains.some(domain => imageUrl.includes(domain));
      if (!isAllowed) {
        return res.status(403).json({ success: false, error: "Domain not allowed" });
      }
      
      // Ensure URL is absolute
      if (!imageUrl.startsWith("http")) {
        imageUrl = `https://cdamdong.co.kr${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
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
          "Referer": imageUrl.includes("cdamdong.co.kr") ? "https://cdamdong.co.kr/" : "https://dittoholic.com/",
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
      const sharp = (await import("sharp")).default;
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
  const BRANDS_CACHE_TTL = 600000; // 10 minutes
  
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
        res.setHeader("Cache-Control", "public, max-age=600");
        return res.json({ success: true, data: cached.data });
      }
      
      const categoryBrands = await storage.getBrandsWithProductCount(catFilter);
      const brandsData = categoryBrands.map(cb => ({ ...cb.brand, productCount: cb.productCount }));
      
      brandsCache.set(cacheKey, { data: brandsData, timestamp: Date.now() });
      
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=600");
      res.json({ success: true, data: brandsData });
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ success: false, error: "Failed to fetch brands" });
    }
  });
  
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category, categoryId, subcategoryId, limit, offset, includeBrands, search, brandId } = req.query;
      
      // Default limit for production performance (keep 60 for backend compatibility)
      const limitNum = limit ? parseInt(limit as string, 10) : 60;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;
      const searchQuery = search ? (search as string).trim() : undefined;
      const brandFilter = brandId ? brandId as string : undefined;
      
      // Determine category filter
      const catFilter = (categoryId && categoryId !== "all") 
        ? categoryId as string 
        : (category && category !== "all") 
          ? category as string 
          : undefined;
      
      const subCatFilter = subcategoryId ? subcategoryId as string : undefined;
      
      // Check product cache first (without brands for speed)
      const productCacheKey = `products:${catFilter || 'all'}:${subCatFilter || 'all'}:${searchQuery || 'all'}:${brandFilter || 'all'}:${limitNum}:${offsetNum}`;
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
      
      // Fetch products with optional search and brand filter
      const { products: productList, total } = await storage.getProductsPaginated(limitNum, offsetNum, catFilter, subCatFilter, searchQuery, brandFilter);
      
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
      const { categoryId } = req.query;
      let subcategoryList;
      
      if (categoryId) {
        subcategoryList = await storage.getSubcategoriesByCategoryId(categoryId as string);
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
      const products = await storage.getAllProducts();
      const members = await storage.getAllMembers();
      const categories = await storage.getAllCategories();
      
      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          totalMembers: members.length,
          totalCategories: categories.length,
          productsByCategory: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            count: products.filter(p => p.categoryId === cat.id).length
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
      
      const allReviews = await storage.getVisibleReviews();
      const total = allReviews.length;
      const paginatedReviews = allReviews.slice(offset, offset + limit);
      
      res.json({ success: true, data: paginatedReviews, total });
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
      const { couponPayment, ...orderData } = req.body;
      const validatedData = insertOrderSchema.parse(orderData);
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const order = await storage.createOrder({
        ...validatedData,
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

  // Progress tracking for crawling
  const crawlProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    category: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, message: '', category: '' };
  
  // Get product count
  app.get("/api/admin/products/count", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json({ success: true, count: products.length });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get count" });
    }
  });

  // Get all products for admin with pagination and search
  app.get("/api/admin/products", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { search, category, page = "1", limit = "50" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      
      let allProducts = await storage.getAllProducts();
      
      // Apply search filter
      if (search && typeof search === "string" && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        allProducts = allProducts.filter(p => 
          p.name?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply category filter
      if (category && category !== "all") {
        allProducts = allProducts.filter(p => p.categoryId === category);
      }
      
      const total = allProducts.length;
      const totalPages = Math.ceil(total / limitNum);
      const paginatedProducts = allProducts.slice(offset, offset + limitNum);
      
      res.json({ 
        success: true, 
        data: paginatedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
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
      const products = await storage.getAllProducts();
      for (const p of products) {
        await storage.deleteProduct(p.id);
      }
      res.json({ success: true, message: `${products.length}개 상품이 삭제되었습니다.` });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete products" });
    }
  });

  // Get crawl progress
  app.get("/api/admin/crawl/progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...crawlProgress });
  });

  // Full crawl from cdamdong.co.kr (like the successful script)
  app.post("/api/admin/crawl/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (crawlProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 크롤링이 진행 중입니다." });
    }
    
    const { clearExisting, selectedCategories } = req.body;
    
    crawlProgress.status = 'running';
    crawlProgress.total = 0;
    crawlProgress.current = 0;
    crawlProgress.message = '크롤링 준비 중...';
    crawlProgress.category = '';
    crawlProgress.startedAt = new Date();
    
    res.json({ success: true, message: "크롤링이 시작되었습니다." });
    
    // Run crawl in background
    (async () => {
      const ALL_CATEGORIES = [
        { id: "10", name: "아우터", localId: "outer" },
        { id: "g0", name: "패딩", localId: "padding" },
        { id: "20", name: "상의", localId: "tops" },
        { id: "30", name: "하의", localId: "bottoms" },
        { id: "40", name: "신발", localId: "shoes" },
        { id: "70", name: "악세사리", localId: "accessories" },
        { id: "80", name: "지갑", localId: "wallets" },
        { id: "a0", name: "가방", localId: "bags" },
        { id: "c0", name: "시계", localId: "watches" },
        { id: "f0", name: "정품", localId: "genuine" },
      ];
      
      // Filter categories if selectedCategories is provided
      const CATEGORIES = selectedCategories && selectedCategories.length > 0
        ? ALL_CATEGORIES.filter(c => selectedCategories.includes(c.localId))
        : ALL_CATEGORIES;
      
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://cdamdong.co.kr/",
      };
      
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const fetchProductList = async (categoryId: string, page: number): Promise<string[]> => {
        try {
          const response = await fetch(`https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&page=${page}`, { headers });
          if (!response.ok) return [];
          const html = await response.text();
          return [...new Set((html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', '')))];
        } catch { return []; }
      };
      
      const fetchProductDetail = async (sourceId: string, categoryLocalId: string) => {
        const url = `https://cdamdong.co.kr/shop/item.php?it_id=${sourceId}`;
        try {
          const response = await fetch(url, { headers });
          if (!response.ok) return null;
          const html = await response.text();
          
          // Name extraction
          let name = '';
          const nameMatch = html.match(/<h1[^>]*class="sit_tit"[^>]*>([^<]+)<\/h1>/i);
          if (nameMatch) name = nameMatch[1].trim();
          if (!name) {
            const titleMatch = html.match(/<title>([^|<]+)/i);
            if (titleMatch) name = titleMatch[1].trim();
          }
          if (!name) name = `상품 ${sourceId}`;
          
          // Price extraction
          let price = 0;
          const priceText = html.match(/(\d{1,3}(?:,\d{3})+)원/);
          if (priceText) price = parseInt(priceText[1].replace(/,/g, ''), 10);
          
          // Main images from #sit_pvi
          const mainImages: string[] = [];
          const mainImgMatches = html.match(new RegExp(`https://cdamdong\\.co\\.kr/data/item/${sourceId}/[^"'\\s]+\\.(jpg|jpeg|png|webp)`, 'gi')) || [];
          mainImgMatches.forEach(img => {
            const clean = img.replace(/thumb-/, '').replace(/_300x300|_500x500/g, '').split('?')[0];
            if (!clean.includes('_77x82') && !mainImages.includes(clean)) mainImages.push(clean);
          });
          
          // Detail images from /data/editor/
          const detailImages: string[] = [];
          const detailMatches = html.match(/https?:\/\/cdamdong\.co\.kr\/data\/editor\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/gi) || [];
          detailMatches.forEach(img => {
            const clean = img.replace(/^http:/, 'https:');
            if (!detailImages.includes(clean)) detailImages.push(clean);
          });
          
          const isBest = html.includes('BEST') || html.includes('best_icon');
          
          return {
            sourceId,
            name,
            price,
            imageUrl: mainImages[0] || `https://cdamdong.co.kr/data/item/${sourceId}/`,
            imageUrls: mainImages,
            detailImageUrls: detailImages,
            categoryId: categoryLocalId,
            isBest,
          };
        } catch { return null; }
      };
      
      try {
        // Clear existing products if requested
        if (clearExisting) {
          crawlProgress.message = '기존 상품 삭제 중...';
          const existing = await storage.getAllProducts();
          for (const p of existing) {
            await storage.deleteProduct(p.id);
          }
        }
        
        let totalInserted = 0;
        
        for (const category of CATEGORIES) {
          crawlProgress.category = category.name;
          crawlProgress.message = `[${category.name}] 상품 목록 수집 중...`;
          
          // Collect all product IDs from category
          const allIds = new Set<string>();
          let page = 1;
          let emptyCount = 0;
          
          while (emptyCount < 3 && page <= 200) {
            const ids = await fetchProductList(category.id, page);
            let newCount = 0;
            ids.forEach(id => { if (!allIds.has(id)) { allIds.add(id); newCount++; } });
            if (newCount === 0) emptyCount++; else emptyCount = 0;
            page++;
            await delay(30);
            
            if (page % 20 === 0) {
              crawlProgress.message = `[${category.name}] 페이지 ${page} 스캔 중... (${allIds.size}개 발견)`;
            }
          }
          
          crawlProgress.message = `[${category.name}] ${allIds.size}개 상품 상세 정보 수집 중...`;
          crawlProgress.total = allIds.size;
          crawlProgress.current = 0;
          
          const idsArray = Array.from(allIds);
          
          // Process in batches of 15 (parallel)
          for (let i = 0; i < idsArray.length; i += 15) {
            const batch = idsArray.slice(i, i + 15);
            const results = await Promise.all(batch.map(id => fetchProductDetail(id, category.localId)));
            
            for (const p of results) {
              if (p) {
                try {
                  await storage.createProduct({
                    name: p.name,
                    categoryId: p.categoryId,
                    price: p.price,
                    description: p.name,
                    detailContent: "프리미엄 명품 레플리카 제품입니다.",
                    imageUrl: p.imageUrl,
                    imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
                    detailImageUrls: p.detailImageUrls,
                    isBest: p.isBest,
                    isNew: totalInserted % 8 === 0,
                    isActive: true,
                  });
                  totalInserted++;
                } catch {}
              }
            }
            
            crawlProgress.current = Math.min(i + 15, idsArray.length);
            crawlProgress.message = `[${category.name}] 상품 저장 중... (${crawlProgress.current}/${allIds.size})`;
            await delay(50);
          }
          
          console.log(`[${category.name}] ${allIds.size} products processed, total: ${totalInserted}`);
        }
        
        crawlProgress.status = 'completed';
        crawlProgress.message = `완료! 총 ${totalInserted}개 상품이 크롤링되었습니다.`;
        crawlProgress.completedAt = new Date();
        console.log(`Full crawl complete: ${totalInserted} products`);
        
      } catch (error: any) {
        crawlProgress.status = 'error';
        crawlProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('Crawl error:', error);
      }
    })();
  });

  // Progress tracking for dittoholic crawling
  const dittoholicProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    category: string;
  } = { status: 'idle', total: 0, current: 0, message: '', category: '' };

  // Get dittoholic crawl progress
  app.get("/api/admin/crawl/dittoholic/progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...dittoholicProgress });
  });

  // Delete all domestic category products
  app.delete("/api/admin/products/domestic", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const deletedCount = await storage.deleteProductsByCategory("domestic");
      invalidateProductCache();
      res.json({ success: true, deletedCount });
    } catch (error: any) {
      console.error("Error deleting domestic products:", error);
      res.status(500).json({ success: false, message: error.message || "삭제 중 오류가 발생했습니다." });
    }
  });

  // Get domestic product count for price adjustment preview
  app.get("/api/admin/products/domestic/count", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const count = await storage.getDomesticProductCount();
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error getting domestic product count:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Adjust domestic product prices by a fixed amount
  app.post("/api/admin/products/domestic/adjust-price", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { delta } = req.body;
      if (typeof delta !== 'number') {
        return res.status(400).json({ success: false, message: "delta는 숫자여야 합니다." });
      }
      const affectedCount = await storage.adjustDomesticPrices(delta);
      invalidateProductCache();
      res.json({ success: true, affectedCount });
    } catch (error: any) {
      console.error("Error adjusting domestic prices:", error);
      res.status(500).json({ success: false, message: error.message || "가격 조정 중 오류가 발생했습니다." });
    }
  });

  // Get genuine product count
  app.get("/api/admin/products/genuine/count", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const count = await storage.getGenuineProductCount();
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error getting genuine product count:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Apply discount to genuine products
  app.post("/api/admin/products/genuine/apply-discount", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { discountPercent } = req.body;
      if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({ success: false, message: "할인율은 0~100 사이의 숫자여야 합니다." });
      }
      const affectedCount = await storage.applyGenuineDiscount(discountPercent);
      invalidateProductCache();
      res.json({ success: true, affectedCount });
    } catch (error: any) {
      console.error("Error applying genuine discount:", error);
      res.status(500).json({ success: false, message: error.message || "할인 적용 중 오류가 발생했습니다." });
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

  // Crawl from dittoholic.com (Shopify store)
  app.post("/api/admin/crawl/dittoholic/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (dittoholicProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 크롤링이 진행 중입니다." });
    }
    
    const { clearExisting, selectedCategories } = req.body;
    
    dittoholicProgress.status = 'running';
    dittoholicProgress.total = 0;
    dittoholicProgress.current = 0;
    dittoholicProgress.message = '크롤링 준비 중...';
    dittoholicProgress.category = '';
    
    res.json({ success: true, message: "dittoholic.com 크롤링이 시작되었습니다." });
    
    // Run crawl in background
    (async () => {
      const DITTOHOLIC_CATEGORIES = [
        { handle: "국내배송-watch", name: "시계", subcategoryId: "domestic-watches" },
        { handle: "국내배송-top", name: "상의", subcategoryId: "domestic-tops" },
        { handle: "국내배송-outer", name: "아우터", subcategoryId: "domestic-outer" },
        { handle: "국내배송-acc", name: "악세사리", subcategoryId: "domestic-accessories" },
        { handle: "국내배송-pants", name: "하의", subcategoryId: "domestic-bottoms" },
        { handle: "국내배송-bag", name: "가방", subcategoryId: "domestic-bags" },
        { handle: "국내배송-wallet", name: "지갑", subcategoryId: "domestic-wallets" },
      ];
      
      const CATEGORIES = selectedCategories && selectedCategories.length > 0
        ? DITTOHOLIC_CATEGORIES.filter(c => selectedCategories.includes(c.subcategoryId))
        : DITTOHOLIC_CATEGORIES;
      
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      };
      
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Brand cache for performance
      const brandCache = new Map<string, string>();
      
      try {
        if (clearExisting) {
          dittoholicProgress.message = '기존 상품 삭제 중...';
          const existingProducts = await storage.getAllProducts();
          for (const p of existingProducts) {
            await storage.deleteProduct(p.id);
          }
        }
        
        let totalInserted = 0;
        
        for (const category of CATEGORIES) {
          dittoholicProgress.category = category.name;
          dittoholicProgress.message = `[${category.name}] 상품 수집 중...`;
          
          let page = 1;
          let hasMore = true;
          const allProducts: any[] = [];
          
          // Fetch all pages from Shopify JSON API
          while (hasMore) {
            try {
              const url = `https://dittoholic.com/collections/${encodeURIComponent(category.handle)}/products.json?page=${page}&limit=250`;
              const response = await fetch(url, { headers });
              
              if (!response.ok) {
                console.log(`[${category.name}] Page ${page} returned ${response.status}`);
                break;
              }
              
              const data = await response.json();
              
              if (!data.products || data.products.length === 0) {
                hasMore = false;
              } else {
                allProducts.push(...data.products);
                dittoholicProgress.message = `[${category.name}] 페이지 ${page} 수집... (${allProducts.length}개)`;
                page++;
                await delay(500); // Rate limiting
              }
            } catch (error) {
              console.error(`Error fetching page ${page}:`, error);
              break;
            }
          }
          
          console.log(`[${category.name}] Found ${allProducts.length} products`);
          dittoholicProgress.total = allProducts.length;
          dittoholicProgress.current = 0;
          
          // Insert products with full image fetch
          let insertErrors = 0;
          for (let i = 0; i < allProducts.length; i++) {
            const product = allProducts[i];
            try {
              const price = product.variants?.[0]?.price 
                ? Math.round(parseFloat(product.variants[0].price))
                : 0;
              
              const comparePrice = product.variants?.[0]?.compare_at_price
                ? Math.round(parseFloat(product.variants[0].compare_at_price))
                : undefined;
              
              // Main product image from images array
              const imageUrl = product.images?.[0]?.src || "";
              const imageUrls = product.images?.map((img: any) => img.src) || [];
              
              // Extract detail images from body_html (they are embedded as <img> tags)
              const bodyHtml = product.body_html || "";
              const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
              const detailImagesFromHtml: string[] = [];
              let match;
              while ((match = imgRegex.exec(bodyHtml)) !== null) {
                const imgSrc = match[1];
                // Filter out small icons and only keep cdn.shopify.com images
                if (imgSrc && imgSrc.includes('cdn.shopify.com') && !imgSrc.includes('icon')) {
                  detailImagesFromHtml.push(imgSrc);
                }
              }
              
              // Extract size options
              const sizeOptions = product.variants
                ?.map((v: any) => v.title)
                .filter((t: string) => t && t !== "Default Title") || [];
              
              // Extract brand from product vendor or title (using cached brands)
              let brandId: string | undefined = undefined;
              const vendorName = product.vendor?.trim();
              if (vendorName && vendorName.length > 0) {
                // Check cache first
                if (brandCache.has(vendorName.toLowerCase())) {
                  brandId = brandCache.get(vendorName.toLowerCase());
                } else {
                  // Try to find existing brand or create new one
                  const existingBrands = await storage.getAllBrands();
                  let foundBrand = existingBrands.find(b => 
                    b.name.toLowerCase() === vendorName.toLowerCase() ||
                    b.slug === vendorName.toLowerCase().replace(/\s+/g, '')
                  );
                  
                  if (!foundBrand) {
                    // Create new brand
                    try {
                      foundBrand = await storage.createBrand({
                        name: vendorName,
                        slug: vendorName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, ''),
                        sortOrder: 200,
                        isActive: true,
                      });
                    } catch {}
                  }
                  
                  if (foundBrand) {
                    brandId = foundBrand.id;
                    brandCache.set(vendorName.toLowerCase(), foundBrand.id);
                  }
                }
              }
              
              const domesticDetailContent = `명품 레플리카 사이트 1위 디토홀릭 이용해야 하는 이유!!

아직도 미러급 , SA급, 하이엔드급 제품이 있냐고 여쭤보시는 고객님들이 아직도 많으신데, 그건 전부 레플리카 판매자들이 만들어낸 이야기일 뿐입니다.
더 이상 속지 마시길 부탁 드리겠습니다. 

그리고 자체 제작 사이트 1:1비교제작 사이트라고 완벽한 퀄리티의 제품입니다. 라고 하면서 정품과 레플 비교 사진 찍어서 단가 조금 올려서 판매하면

사람들 인식은 자동으로 "아 여기 정말 좋은 곳이구나" 하면서 구입 하시고 저희에게 한탄 하시는 고객님들 정말 한 두 분이 아닙니다. 1:1제작? 자체 제작? 절대 불가능 하다고 말씀 드리고 싶습니다.

저희 사이트에 판매 중인 제품이 수 천 종류가 넘는데 아무리 큰 레플리카 판매 사이트라고 하더라도 직접 제작하는 품목이 100개 이상 넘길 수가 없습니다.

절,대,로,요 저희도 직접 제작하는 제품이 몇 가지 있기는 하지만 퀄리티 때문이 아닌 단가 절감을 위해서 인기 있는 종목의 제품만 직접 생산을 할 뿐 퀄리티와는 거리가 멀다고 보시면 됩니다.
저희 같은 영세업자가 명품 레플리카 사이트에 판매하는 제품 수가 수 백에서 수 천가지가 되는데 그걸 하나하나 직접 생산 한다구요? 정품과 1:1비교 제작을 해 가면서요?

절대~~ 말이 안되는 말들에 현혹되지 마시길 부탁 드리겠습니다.

퀄리티 좋은 사이트를 찾는 팁을 드리자면 좋은 사이트를 확인하실 때 레플리카사이트후기 보시면 바로 답이 나옵니다.

그리고 레플리카 사이트의 기본인 레플리카신발, 레플리카가방, 후기를 보시면 그 사이트의 기본 퀄리티를 느끼실 수 있으십니다.

저희 디토홀릭은 레플리카 구매대행을 시작으로 레플리카도매업, 레플리카쇼핑몰 병행하며 14년 동안의 경험을 바탕으로 거래처 공장들 300여 곳 그리고 대표님께서 직접 눈으로 본 후 다른 공장 제품들과 비교하고 최대한 저렴한 금액으로 고퀄리티의 제품을 받아보실 수 있도록 14년 째 발로 뛰고 계십니다.

저희가 롱런 할수있던 이유는 양심적이고 아직도 발로 뛰시는 운영진들이 있어서가 아닐까 싶습니다. 
정말 REAL 진심을 담은 디토홀릭의 운영진의 푸념 이었습니다 긴 글 읽어주셔서 감사합니다`;

              await storage.createProduct({
                name: `(국내배송) ${product.title}`,
                categoryId: "domestic",
                subcategoryId: category.subcategoryId,
                brandId: brandId,
                price: price,
                originalPrice: comparePrice,
                description: product.body_html?.replace(/<[^>]*>/g, '').slice(0, 500) || product.title,
                detailContent: domesticDetailContent,
                imageUrl: imageUrl,
                imageUrls: imageUrls.length > 0 ? imageUrls : [imageUrl],
                detailImageUrls: detailImagesFromHtml.length > 0 ? detailImagesFromHtml : undefined,
                options: sizeOptions.length > 0 ? JSON.stringify(sizeOptions) : undefined,
                isBest: false,
                isNew: i < 10,
                isActive: true,
                isSoldOut: false,
              });
              
              totalInserted++;
              
            } catch (error: any) {
              insertErrors++;
              console.error(`Error inserting product ${product.title}:`, error?.message || error);
            }
            
            dittoholicProgress.current = i + 1;
            dittoholicProgress.message = `[${category.name}] 저장 중... (${i + 1}/${allProducts.length})${insertErrors > 0 ? ` (오류: ${insertErrors})` : ''}`;
          }
          
          if (insertErrors > 0) {
            console.log(`[${category.name}] ${insertErrors} errors during insert`);
          }
          
          console.log(`[${category.name}] Inserted products, total: ${totalInserted}`);
        }
        
        dittoholicProgress.status = 'completed';
        dittoholicProgress.message = `완료! 총 ${totalInserted}개 상품이 크롤링되었습니다.`;
        console.log(`Dittoholic crawl complete: ${totalInserted} products`);
        
      } catch (error: any) {
        dittoholicProgress.status = 'error';
        dittoholicProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('Dittoholic crawl error:', error);
      }
    })();
  });

  // Crawl reviews from cdamdong.co.kr (bestreview and kalreom boards)
  app.post("/api/admin/crawl/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://cdamdong.co.kr/",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
    };
    
    try {
      const maxPages = req.body.maxPages || 20;
      const boards = req.body.boards || ["bestreview", "kalreom"];
      const reviews: any[] = [];
      const seenIds = new Set<string>();
      
      console.log(`Starting review crawl from boards: ${boards.join(", ")}, maxPages: ${maxPages}`);
      
      // Crawl from multiple boards
      for (const board of boards) {
        console.log(`\n=== Crawling board: ${board} ===`);
        let consecutiveEmptyPages = 0;
        
        for (let page = 1; page <= maxPages; page++) {
          try {
            const listUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=${board}&page=${page}`;
            console.log(`Fetching ${board} page ${page}: ${listUrl}`);
            
            const response = await fetch(listUrl, { headers });
            
            if (!response.ok) {
              console.log(`Page ${page} returned ${response.status}`);
              consecutiveEmptyPages++;
              if (consecutiveEmptyPages >= 3) break;
              continue;
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            let pageItemsFound = 0;
            
            // Method 1: Parse review list items using sct_li class
            $(".sct_li").each((_: number, el: any) => {
              const $el = $(el);
              
              let href = $el.find(`a[href*='${board}']`).first().attr("href") || "";
              href = href.replace(/&amp;/g, "&");
              
              const idMatch = href.match(/wr_id=(\d+)/);
              
              const title = $el.find(".sct_txt .title div").last().text().trim() || 
                           $el.find(".sct_txt a").text().trim() ||
                           $el.find("a").first().text().trim();
              
              const thumbnail = $el.find(".prdImg img").attr("src") || $el.find("img").first().attr("src") || "";
              
              const uniqueKey = `${board}_${idMatch?.[1]}`;
              if (idMatch && !seenIds.has(uniqueKey)) {
                seenIds.add(uniqueKey);
                reviews.push({
                  sourceId: idMatch[1],
                  board,
                  title,
                  thumbnail,
                });
                pageItemsFound++;
              }
            });
            
            // Method 2: Fallback - regex extraction
            if (pageItemsFound === 0) {
              const idRegex = new RegExp(`${board}[^"]*wr_id=(\\d+)`, 'g');
              let match;
              while ((match = idRegex.exec(html)) !== null) {
                const id = match[1];
                const uniqueKey = `${board}_${id}`;
                if (!seenIds.has(uniqueKey)) {
                  seenIds.add(uniqueKey);
                  reviews.push({
                    sourceId: id,
                    board,
                    title: `후기 #${id}`,
                    thumbnail: "",
                  });
                  pageItemsFound++;
                }
              }
            }
            
            console.log(`${board} page ${page}: Found ${pageItemsFound} new items, total: ${reviews.length}`);
            
            if (pageItemsFound === 0) {
              consecutiveEmptyPages++;
              if (consecutiveEmptyPages >= 2) {
                console.log(`No new items on ${board} page ${page}, stopping board crawl`);
                break;
              }
            } else {
              consecutiveEmptyPages = 0;
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (e) {
            console.error(`Error fetching ${board} page ${page}:`, e);
          }
        }
      }
      
      console.log(`\nTotal reviews found across all boards: ${reviews.length}`);
      
      // Fetch review details and save
      let savedCount = 0;
      const maxReviews = req.body.maxReviews || 200;
      for (const review of reviews.slice(0, maxReviews)) {
        try {
          const board = review.board || "bestreview";
          const detailUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=${board}&wr_id=${review.sourceId}`;
          console.log(`Fetching ${board} review detail: ${detailUrl}`);
          
          const detailRes = await fetch(detailUrl, { 
            headers: {
              ...headers,
              "Referer": `https://cdamdong.co.kr/bbs/board.php?bo_table=${board}`
            }
          });
          if (!detailRes.ok) {
            console.log(`Review ${review.sourceId} returned ${detailRes.status}`);
            continue;
          }
          
          const detailHtml = await detailRes.text();
          const $detail = cheerio.load(detailHtml);
          
          // Check if page redirected (no content)
          if (detailHtml.includes('document.location.replace') && !detailHtml.includes('bo_v_title')) {
            console.log(`Review ${review.sourceId} redirected, skipping`);
            continue;
          }
          
          // Get full title from detail page
          const fullTitle = $detail("#bo_v_title .bo_v_tit").text().trim() || review.title;
          
          // Get category/brand
          const category = $detail("#bo_v_title .bo_v_cate").text().trim();
          
          // Get author name - try multiple selectors
          let authorName = $detail("#bo_v_info .sv_member").text().trim();
          if (!authorName) {
            // Extract from title (format: "... 최**")
            const authorMatch = fullTitle.match(/\s+([가-힣]+\*+)$/);
            authorName = authorMatch ? authorMatch[1] : "베스트리뷰";
          }
          
          // Get view count from #bo_v_info (format: "조회 3,483회")
          const infoText = $detail("#bo_v_info").text();
          const viewCountMatch = infoText.match(/([\d,]+)회/);
          const viewCount = viewCountMatch ? parseInt(viewCountMatch[1].replace(/,/g, "")) : 0;
          
          // Get date from .if_date (format: "25-12-29 22:00")
          const dateText = $detail(".if_date").text().trim();
          console.log(`Review ${review.sourceId} dateText: "${dateText}"`);
          const dateMatch = dateText.match(/(\d{2})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})/);
          let displayDate: Date | undefined;
          if (dateMatch) {
            const year = 2000 + parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);
            const hour = parseInt(dateMatch[4]);
            const minute = parseInt(dateMatch[5]);
            displayDate = new Date(year, month, day, hour, minute);
            console.log(`Review ${review.sourceId} parsed date: ${displayDate}`);
          }
          
          // Get content text from article section
          let content = $detail("#bo_v_atc").text().trim();
          // Remove "본문" title if present
          content = content.replace(/^본문\s*/, "").trim();
          if (!content) content = fullTitle;
          
          // Extract all images from review - only from this review's content
          const images: string[] = [];
          const seenImageNames = new Set<string>();
          
          // Helper to normalize URL and extract unique image name
          const getImageName = (url: string): string => {
            const match = url.match(/([^\/]+)\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
            return match ? match[1].replace(/^thumb-/, "").replace(/_\d+x\d+$/, "") : url;
          };
          
          // Helper to add image if not duplicate
          const addImage = (src: string) => {
            if (!src || !src.includes("cdamdong.co.kr")) return;
            
            // Skip icons and small assets
            if (src.includes("/img/") || src.includes("/skin/") || src.includes("icon")) return;
            
            // Normalize relative URLs
            if (src.startsWith("/")) {
              src = `https://cdamdong.co.kr${src}`;
            }
            
            const imageName = getImageName(src);
            if (!seenImageNames.has(imageName)) {
              seenImageNames.add(imageName);
              images.push(src);
            }
          };
          
          // Get images from #bo_v_img section (main attached images - highest priority)
          $detail("#bo_v_img a").each((_: number, el: any) => {
            const href = $detail(el).attr("href") || "";
            if (href.includes("view_image.php")) {
              // Extract actual image filename from view_image URL
              const fnMatch = href.match(/fn=([^&]+)/);
              if (fnMatch) {
                const imagePath = decodeURIComponent(fnMatch[1]);
                addImage(`https://cdamdong.co.kr/data/file/bestreview/${imagePath}`);
              }
            }
          });
          
          // Fallback: get images directly from #bo_v_img if no links found
          if (images.length === 0) {
            $detail("#bo_v_img img").each((_: number, img: any) => {
              addImage($detail(img).attr("src") || "");
            });
          }
          
          // Get images from article content (editor images)
          $detail("#bo_v_atc img").each((_: number, img: any) => {
            const src = $detail(img).attr("src") || "";
            // Only include editor-uploaded images (in /data/editor/ or /data/file/)
            if (src.includes("/data/editor/") || src.includes("/data/file/")) {
              addImage(src);
            }
          });
          
          console.log(`Review ${review.sourceId}: title="${fullTitle.slice(0,30)}...", author=${authorName}, views=${viewCount}, date=${displayDate?.toISOString()}, images=${images.length}`);
          
          // Check for duplicate (same title and date)
          const existingReviews = await storage.getVisibleReviews();
          const titleToCheck = category ? `[${category}] ${fullTitle}` : fullTitle;
          const isDuplicate = existingReviews.some(r => 
            r.title === titleToCheck && 
            r.displayDate?.toISOString() === displayDate?.toISOString()
          );
          
          if (isDuplicate) {
            console.log(`Skipping duplicate review: ${titleToCheck.slice(0, 30)}...`);
            continue;
          }
          
          // Create review in database
          await storage.createReview({
            title: titleToCheck,
            authorName,
            rating: 5,
            content: content.slice(0, 2000),
            imageUrls: images.slice(0, 20),
            isVisible: true,
            displayDate,
          });
          
          savedCount++;
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          console.error("Error fetching review detail:", e);
        }
      }
      
      console.log(`Review crawl complete: ${savedCount} saved`);
      
      res.json({ 
        success: true, 
        message: `${savedCount}개의 후기가 크롤링되었습니다.`,
        total: reviews.length,
        saved: savedCount,
      });
    } catch (error: any) {
      console.error("Review crawl error:", error);
      res.status(500).json({ success: false, error: error.message || "후기 크롤링 중 오류가 발생했습니다." });
    }
  });

  // Crawl notices from cdamdong.co.kr
  app.post("/api/admin/crawl/notices", requireAdminAuth, async (req: Request, res: Response) => {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://cdamdong.co.kr/",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    };
    
    try {
      const maxPages = req.body.maxPages || 3;
      const notices: any[] = [];
      const seenIds = new Set<string>();
      
      console.log("Starting notice crawl...");
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          const listUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=notice&page=${page}`;
          console.log(`Fetching notice list page ${page}: ${listUrl}`);
          
          const response = await fetch(listUrl, { headers });
          if (!response.ok) {
            console.log(`Page ${page} returned ${response.status}`);
            continue;
          }
          
          const html = await response.text();
          const $ = cheerio.load(html);
          
          // Parse notice list items - look for links with wr_id in href
          $(".bo_tit a").each((_: number, el: any) => {
            const $el = $(el);
            const title = $el.text().trim();
            const href = $el.attr("href") || "";
            const idMatch = href.match(/wr_id=(\d+)/);
            
            if (title && idMatch && !seenIds.has(idMatch[1])) {
              seenIds.add(idMatch[1]);
              notices.push({
                sourceId: idMatch[1],
                title,
              });
            }
          });
          
          console.log(`Page ${page}: Found ${notices.length} total notices so far`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.error(`Error fetching page ${page}:`, e);
        }
      }
      
      console.log(`Total notices found: ${notices.length}`);
      
      // Fetch notice details and save
      let savedCount = 0;
      for (const notice of notices.slice(0, 30)) {
        try {
          const detailUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=notice&wr_id=${notice.sourceId}`;
          console.log(`Fetching notice detail: ${detailUrl}`);
          
          const detailRes = await fetch(detailUrl, { headers });
          if (!detailRes.ok) continue;
          
          const detailHtml = await detailRes.text();
          const $detail = cheerio.load(detailHtml);
          
          // Get view count (format: "57,356회")
          const viewCountText = $detail("#bo_v_info").text();
          const viewCountMatch = viewCountText.match(/조회.*?([\d,]+)회/);
          const viewCount = viewCountMatch ? parseInt(viewCountMatch[1].replace(/,/g, "")) : 0;
          
          // Get date (format: "25-12-01 07:52")
          const dateText = $detail(".if_date").text().trim();
          const dateMatch = dateText.match(/(\d{2})-(\d{2})-(\d{2})\s*(\d{2}):(\d{2})/);
          let displayDate: Date | undefined;
          if (dateMatch) {
            const year = 2000 + parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);
            const hour = parseInt(dateMatch[4]);
            const minute = parseInt(dateMatch[5]);
            displayDate = new Date(year, month, day, hour, minute);
          }
          
          // Get content HTML
          let content = $detail("#bo_v_con").html() || notice.title;
          
          // Clean up HTML
          content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
          
          console.log(`Notice ${notice.sourceId}: title="${notice.title.substring(0, 30)}...", views=${viewCount}, date=${displayDate}`);
          
          // Create notice in database using raw insert to include viewCount
          await storage.createNoticeWithViewCount({
            title: notice.title,
            content: content,
            isVisible: true,
            displayDate,
            viewCount,
          });
          
          savedCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.error("Error fetching notice detail:", e);
        }
      }
      
      console.log(`Notice crawl complete: ${savedCount} saved`);
      
      res.json({ 
        success: true, 
        message: `${savedCount}개의 공지사항이 크롤링되었습니다.`,
        total: notices.length,
        saved: savedCount,
      });
    } catch (error: any) {
      console.error("Notice crawl error:", error);
      res.status(500).json({ success: false, error: error.message || "공지사항 크롤링 중 오류가 발생했습니다." });
    }
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
        const count = await storage.batchUpdateAccessoryPrices(rule.pattern, rule.price);
        updatedCount += count;
      }
      
      // Apply default prices to ANY remaining accessories by type keyword
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
        const count = await storage.batchUpdateAccessoryPrices(rule.pattern, rule.price);
        updatedCount += count;
      }
      
      // Fix remaining products with unrealistic high prices
      const highPriceCount = await storage.fixHighAccessoryPrices();
      updatedCount += highPriceCount;
      
      // Set default price for any remaining accessories without valid prices
      const defaultCount = await storage.setDefaultAccessoryPrices('180000');
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

  // Crawl reviews from source site
  app.post("/api/admin/crawl-reviews", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { startPage = 1, endPage = 10, batchSize = 10 } = req.body;
      console.log(`Starting review crawl from page ${startPage} to ${endPage}...`);
      
      let totalCrawled = 0;
      let totalInserted = 0;
      const errors: string[] = [];
      
      for (let page = startPage; page <= endPage; page += batchSize) {
        const endBatch = Math.min(page + batchSize - 1, endPage);
        console.log(`Crawling pages ${page} to ${endBatch}...`);
        
        for (let p = page; p <= endBatch; p++) {
          try {
            const url = `https://cdamdong.co.kr/shop/itemuselist.php?page=${p}`;
            const response = await fetch(url);
            if (!response.ok) {
              errors.push(`Page ${p}: HTTP ${response.status}`);
              continue;
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Parse each review item - structure: ol > li
            $('ol > li').each((_, el) => {
              try {
                const $el = $(el);
                
                // Check if this is actually a review item (has .sps_img or .sps_section)
                if (!$el.find('.sps_img').length && !$el.find('.sps_section').length) {
                  return; // Skip non-review list items
                }
                
                // Extract product info from .sps_img a
                const productLink = $el.find('.sps_img a');
                const productName = productLink.find('span').text().trim() || '';
                
                // Extract title from h2
                const title = $el.find('.sps_section h2').text().trim() || '';
                
                // Extract author from .sps_dl dd (second dd after 작성자 dt)
                const authorDd = $el.find('.sps_dl dd').eq(1);
                const authorName = authorDd.text().trim().replace(/^\s*/, '') || '익명';
                
                // Extract date from .sps_dl dd (third dd after 작성일 dt)
                const dateDd = $el.find('.sps_dl dd').eq(2);
                const dateText = dateDd.text().trim();
                
                // Extract rating from star image
                const starImg = $el.find('.sps_dl img[src*="star"]').attr('src') || '';
                let rating = 5;
                const starMatch = starImg.match(/star(\d)/);
                if (starMatch) {
                  rating = parseInt(starMatch[1]);
                }
                
                // Extract content from hidden div (sps_con_X)
                const contentDiv = $el.find('[id^="sps_con_"]');
                const content = contentDiv.text().trim() || title;
                
                // Extract images from content div - get full-size images
                const imageUrls: string[] = [];
                contentDiv.find('img').each((_, img) => {
                  let src = $(img).attr('src');
                  if (src && !src.includes('star') && !src.includes('icon')) {
                    // Convert thumbnail URLs to full-size URLs
                    // Remove thumb- prefix and size suffix like _100x100 or _500x374
                    src = src.replace(/thumb-/, '').replace(/_\d+x\d+(\.\w+)$/, '$1');
                    
                    // Convert relative URLs to absolute
                    const fullUrl = src.startsWith('http') ? src : `https://cdamdong.co.kr${src.startsWith('/') ? '' : '/'}${src}`;
                    if (!imageUrls.includes(fullUrl)) {
                      imageUrls.push(fullUrl);
                    }
                  }
                });
                
                // Also check for images in view_image.php links (these are full size)
                contentDiv.find('a[href*="view_image.php"]').each((_, link) => {
                  const href = $(link).attr('href');
                  if (href) {
                    // Extract the actual image URL from view_image.php?fn=...
                    const fnMatch = href.match(/fn=([^&]+)/);
                    if (fnMatch) {
                      let imgPath = decodeURIComponent(fnMatch[1]);
                      // Convert to full URL
                      if (!imgPath.startsWith('http')) {
                        imgPath = `https://cdamdong.co.kr${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
                      }
                      if (!imageUrls.includes(imgPath)) {
                        imageUrls.push(imgPath);
                      }
                    }
                  }
                });
                
                // If no content images found, try to get from thumbnail (convert to full size)
                if (imageUrls.length === 0) {
                  let thumbImg = productLink.find('img').attr('src');
                  if (thumbImg && !thumbImg.includes('star')) {
                    // Convert thumbnail to full-size
                    thumbImg = thumbImg.replace(/thumb-/, '').replace(/_\d+x\d+(\.\w+)$/, '$1');
                    const fullThumbUrl = thumbImg.startsWith('http') ? thumbImg : `https://cdamdong.co.kr${thumbImg.startsWith('/') ? '' : '/'}${thumbImg}`;
                    imageUrls.push(fullThumbUrl);
                  }
                }
                
                // Parse date
                let displayDate = new Date();
                if (dateText) {
                  const dateParts = dateText.match(/(\d{4})-(\d{2})-(\d{2})/);
                  if (dateParts) {
                    displayDate = new Date(`${dateParts[1]}-${dateParts[2]}-${dateParts[3]}`);
                  }
                }
                
                if (title || content) {
                  // Insert into database
                  storage.createReview({
                    authorName,
                    productName,
                    rating,
                    title,
                    content,
                    imageUrls,
                    isVisible: true,
                    isBest: false,
                    displayDate,
                  });
                  totalInserted++;
                }
                
                totalCrawled++;
              } catch (itemError) {
                console.error('Error parsing review item:', itemError);
              }
            });
            
          } catch (pageError: any) {
            console.error(`Error crawling page ${p}:`, pageError);
            errors.push(`Page ${p}: ${pageError.message}`);
          }
        }
        
        // Small delay between batches to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Review crawl complete: ${totalCrawled} reviews processed, ${totalInserted} inserted`);
      
      res.json({ 
        success: true, 
        message: `${totalInserted}개 리뷰가 크롤링되었습니다.`,
        totalCrawled,
        totalInserted,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      });
    } catch (error: any) {
      console.error("Error crawling reviews:", error);
      res.status(500).json({ success: false, error: error.message || "리뷰 크롤링 중 오류가 발생했습니다." });
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

  return httpServer;
}
