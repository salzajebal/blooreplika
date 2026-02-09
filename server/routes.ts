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
      
      // Allow proxying from approved domains
      const allowedDomains = ["pliki.wisacdn.com", "bagstyle.site"];
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
      const { couponPayment, isCartOrder, cartItems, ...orderData } = req.body;
      
      if (isCartOrder && Array.isArray(cartItems) && cartItems.length > 0) {
        const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const firstItem = cartItems[0];
        const productNames = cartItems.map((item: any) => item.productName).join(", ");
        
        const order = await storage.createOrder({
          memberId: orderData.memberId || null,
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
      const products = await storage.getAllProducts();
      for (const p of products) {
        await storage.deleteProduct(p.id);
      }
      res.json({ success: true, message: `${products.length}개 상품이 삭제되었습니다.` });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete products" });
    }
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

  // ============ bagstyle.site Crawling ============
  const bagstyleProgress: {
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    category: string;
    startedAt?: Date;
    completedAt?: Date;
  } = { status: 'idle', total: 0, current: 0, message: '', category: '' };

  app.get("/api/admin/crawl/bagstyle/progress", requireAdminAuth, async (_req: Request, res: Response) => {
    res.json({ success: true, ...bagstyleProgress });
  });

  app.post("/api/admin/crawl/bagstyle/banners", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://bagstyle.site/",
      };
      const response = await fetch("https://bagstyle.site/", { headers });
      if (!response.ok) return res.status(500).json({ success: false, error: "사이트 접속 실패" });
      const html = await response.text();
      const $ = cheerio.load(html);

      const existingBanners = await storage.getAllBanners();
      for (const b of existingBanners) {
        await storage.deleteBanner(b.id);
      }

      let bannerOrder = 0;
      $('div.eb-slide-item img, .eb-slider img').each((_i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('/data/ebslider/') && !src.includes('kakao')) {
          const fullUrl = src.startsWith('http') ? src : `https://bagstyle.site${src}`;
          const link = $(el).closest('a').attr('href') || '/';
          storage.createBanner({
            title: `배너 ${bannerOrder + 1}`,
            imageUrl: fullUrl,
            linkUrl: link.startsWith('http') ? link : (link.startsWith('/') ? link : `/${link}`),
            position: "main",
            sortOrder: bannerOrder,
            isActive: true,
          });
          bannerOrder++;
        }
      });

      if (bannerOrder === 0) {
        const sliderMatches = html.match(/https:\/\/bagstyle\.site\/data\/ebslider\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi) || [];
        const seen = new Set<string>();
        for (const url of sliderMatches) {
          if (!seen.has(url)) {
            seen.add(url);
            await storage.createBanner({
              title: `배너 ${bannerOrder + 1}`,
              imageUrl: url,
              linkUrl: "/",
              position: "main",
              sortOrder: bannerOrder,
              isActive: true,
            });
            bannerOrder++;
          }
        }
      }

      const existingCategories = await storage.getAllCategories();
      const categoryImages: { name: string; imageUrl: string; slug: string }[] = [];
      $('a').each((_i, el) => {
        const img = $(el).find('img');
        const src = img.attr('src') || img.attr('data-src');
        const text = $(el).text().trim();
        if (src && src.includes('/data/ebcontents/') && text) {
          const cleanText = text.replace(/\s+/g, ' ').trim();
          if (cleanText.length > 0 && cleanText.length < 30) {
            const fullUrl = src.startsWith('http') ? src : `https://bagstyle.site${src}`;
            categoryImages.push({
              name: cleanText,
              imageUrl: fullUrl,
              slug: cleanText.toLowerCase().replace(/[^a-z0-9가-힣]/g, ''),
            });
          }
        }
      });

      for (const cat of existingCategories) {
        const match = categoryImages.find(ci =>
          ci.name === cat.name ||
          ci.slug === cat.slug
        );
        if (match) {
          await storage.updateCategory(cat.id, { imageUrl: match.imageUrl });
        }
      }

      res.json({
        success: true,
        message: `${bannerOrder}개 배너, ${categoryImages.length}개 카테고리 이미지가 업데이트되었습니다.`,
        bannerCount: bannerOrder,
        categoryImageCount: categoryImages.length,
      });
    } catch (error: any) {
      console.error("Banner crawl error:", error);
      res.status(500).json({ success: false, error: error.message || "배너 크롤링 오류" });
    }
  });

  app.post("/api/admin/crawl/bagstyle/start", requireAdminAuth, async (req: Request, res: Response) => {
    if (bagstyleProgress.status === 'running') {
      return res.status(400).json({ success: false, error: "이미 크롤링이 진행 중입니다." });
    }

    const { clearExisting, selectedCategories } = req.body;

    bagstyleProgress.status = 'running';
    bagstyleProgress.total = 0;
    bagstyleProgress.current = 0;
    bagstyleProgress.message = '크롤링 준비 중...';
    bagstyleProgress.category = '';
    bagstyleProgress.startedAt = new Date();

    res.json({ success: true, message: "bagstyle.site 크롤링이 시작되었습니다." });

    (async () => {
      const ALL_CATEGORIES = [
        { caId: "j0", name: "신상품", localId: "new-arrivals" },
        { caId: "i0", name: "의류", localId: "clothing" },
        { caId: "e0", name: "가방/백", localId: "bags" },
        { caId: "g0", name: "신발", localId: "shoes" },
        { caId: "h0", name: "지갑", localId: "wallets" },
        { caId: "70", name: "골프", localId: "golf" },
        { caId: "f0", name: "쥬얼리/잡화", localId: "jewelry" },
        { caId: "d0", name: "하이앤드BEST", localId: "highend" },
        { caId: "80", name: "할인상품", localId: "sale" },
        { caId: "a0", name: "당일배송", localId: "sameday" },
      ];

      const SUBCATEGORY_MAP: Record<string, { id: string; name: string }[]> = {
        "j0": [
          { id: "j0d0", name: "이번달의신상" }, { id: "j0c0", name: "26년1월" }, { id: "j0b0", name: "25년12월" },
        ],
        "i0": [
          { id: "i010", name: "자켓/점퍼" }, { id: "i020", name: "패딩/털" }, { id: "i030", name: "가죽옷" },
          { id: "i040", name: "코트/정장" }, { id: "i050", name: "후드티/집업" }, { id: "i060", name: "셔츠/남방" },
          { id: "i070", name: "베스트/조끼" }, { id: "i080", name: "니트/스웨터" }, { id: "i090", name: "가디건" },
          { id: "i0a0", name: "반팔티/폴로티" }, { id: "i0b0", name: "긴팔티/맨투맨" }, { id: "i0c0", name: "운동복/추리닝" },
          { id: "i0d0", name: "팬츠/청바지" }, { id: "i0e0", name: "반바지" }, { id: "i0f0", name: "세트" },
          { id: "i0g0", name: "원피스" }, { id: "i0h0", name: "수영복" },
        ],
        "e0": [
          { id: "e010", name: "토트백" }, { id: "e020", name: "크로스백" }, { id: "e030", name: "숄더백" },
          { id: "e050", name: "백팩" }, { id: "e060", name: "파우치/클러치" }, { id: "e070", name: "여행가방" },
          { id: "e080", name: "캐리어" }, { id: "e090", name: "벨트백/새들/슬링" }, { id: "e0a0", name: "미니백" },
          { id: "e0b0", name: "기타" }, { id: "e0d0", name: "캐리어" }, { id: "e0e0", name: "서류가방/메신저" },
        ],
        "g0": [
          { id: "g010", name: "스니커즈" }, { id: "g020", name: "운동화" }, { id: "g030", name: "구두" },
          { id: "g040", name: "샌들/슬리퍼" }, { id: "g050", name: "부츠/워커" }, { id: "g060", name: "로퍼/슬립온" },
          { id: "g080", name: "단화/플랫" }, { id: "g090", name: "펌프스/힐" },
        ],
        "h0": [
          { id: "h010", name: "장지갑/소지갑" }, { id: "h020", name: "카드지갑" }, { id: "h030", name: "동전지갑" },
        ],
        "70": [
          { id: "7010", name: "골프의류" }, { id: "7020", name: "골프가방" }, { id: "7030", name: "골프신발" },
          { id: "7040", name: "골프잡화" }, { id: "7050", name: "골프용품" },
        ],
        "f0": [
          { id: "f010", name: "벨트" }, { id: "f020", name: "선글라스" }, { id: "f030", name: "스카프/머플러" },
          { id: "f040", name: "넥타이" }, { id: "f050", name: "만년필/볼팬" }, { id: "f060", name: "라이터/듀풍" },
          { id: "f070", name: "모자" }, { id: "f080", name: "장갑" }, { id: "f090", name: "백참/브로치" },
          { id: "f0a0", name: "목걸이" }, { id: "f0b0", name: "팔찌" }, { id: "f0c0", name: "반지" },
          { id: "f0d0", name: "귀걸이" }, { id: "f0e0", name: "키홀더" }, { id: "f0f0", name: "우산" },
          { id: "f0h0", name: "기타" },
        ],
        "d0": [],
        "80": [
          { id: "80b0", name: "가방/백" }, { id: "80c0", name: "의류" }, { id: "80f0", name: "지갑" },
          { id: "80g0", name: "신발" }, { id: "80i0", name: "벨트" }, { id: "80j0", name: "잡화/소품/ACC" },
        ],
        "a0": [
          { id: "a010", name: "의류" }, { id: "a020", name: "가방/백" }, { id: "a030", name: "클러치/지갑" },
          { id: "a040", name: "잡화/소품/ACC" }, { id: "a050", name: "바지/팬츠" }, { id: "a060", name: "신발" },
        ],
      };

      const CATEGORIES = selectedCategories && selectedCategories.length > 0
        ? ALL_CATEGORIES.filter(c => selectedCategories.includes(c.localId))
        : ALL_CATEGORIES;

      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://bagstyle.site/",
      };

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const brandCache = new Map<string, string>();

      const getOrCreateBrand = async (brandName: string): Promise<string | undefined> => {
        if (!brandName) return undefined;
        const key = brandName.toLowerCase().trim();
        if (brandCache.has(key)) return brandCache.get(key);

        const existingBrands = await storage.getAllBrands();
        let found = existingBrands.find(b =>
          b.name.toLowerCase() === key ||
          b.slug === key.replace(/\s+/g, '')
        );

        if (!found) {
          try {
            found = await storage.createBrand({
              name: brandName.trim(),
              slug: key.replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, ''),
              sortOrder: 100,
              isActive: true,
            });
          } catch {
            const retry = (await storage.getAllBrands()).find(b => b.slug === key.replace(/\s+/g, '').replace(/[^a-z0-9가-힣]/g, ''));
            if (retry) found = retry;
          }
        }

        if (found) {
          brandCache.set(key, found.id);
          return found.id;
        }
        return undefined;
      };

      const fetchProductList = async (caId: string, page: number): Promise<string[]> => {
        try {
          const url = `https://bagstyle.site/shop/list.php?ca_id=${caId}&page=${page}`;
          const response = await fetch(url, { headers });
          if (!response.ok) return [];
          const html = await response.text();
          const matches = (html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', ''));
          return Array.from(new Set(matches));
        } catch { return []; }
      };

      const fetchProductDetail = async (sourceId: string, categoryLocalId: string, categoryCaId: string) => {
        const url = `https://bagstyle.site/shop/item.php?it_id=${sourceId}`;
        try {
          const response = await fetch(url, { headers });
          if (!response.ok) return null;
          const html = await response.text();
          const $ = cheerio.load(html);

          let name = '';
          const h1 = $('h1.sit_tit');
          if (h1.length) {
            name = h1.text().trim();
          }
          if (!name) {
            const titleMatch = html.match(/<title>([^|<]+)/i);
            if (titleMatch) name = titleMatch[1].trim();
          }
          if (!name) name = `상품 ${sourceId}`;

          let brandName = '';
          const breadcrumbLinks = $('nav a, .breadcrumb a, ol.breadcrumb a');
          breadcrumbLinks.each((_i, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 1 && text.length < 30 && !text.includes('홈') && !text.includes('HOME')) {
              const href = $(el).attr('href') || '';
              if (!href.includes('ca_id=')) {
                brandName = text;
              }
            }
          });
          if (!brandName) {
            const brandEl = $('td:contains("브랜드")').next('td');
            if (brandEl.length) {
              brandName = brandEl.text().trim();
            }
          }
          if (!brandName) {
            const brandMatch = html.match(/브랜드[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
            if (brandMatch) brandName = brandMatch[1].trim();
          }

          let subcategoryId: string | undefined = undefined;
          const subcats = SUBCATEGORY_MAP[categoryCaId] || [];
          if (subcats.length > 0) {
            const breadcrumbText = $('nav, .breadcrumb, ol.breadcrumb').text();
            const caIdMatches = html.match(/ca_id=([a-z0-9]+)/gi) || [];
            for (const m of caIdMatches) {
              const caVal = m.replace('ca_id=', '');
              const matchedSub = subcats.find(s => s.id === caVal);
              if (matchedSub) {
                subcategoryId = matchedSub.id;
                break;
              }
            }
            if (!subcategoryId) {
              for (const sub of subcats) {
                if (breadcrumbText.includes(sub.name)) {
                  subcategoryId = sub.id;
                  break;
                }
              }
            }
          }

          let price = 0;
          let originalPrice = 0;
          const salePriceMatch = html.match(/판매가[^0-9]*(\d{1,3}(?:,\d{3})+)/);
          if (salePriceMatch) price = parseInt(salePriceMatch[1].replace(/,/g, ''), 10);
          const normalPriceMatch = html.match(/정상가[^0-9]*(\d{1,3}(?:,\d{3})+)/);
          if (normalPriceMatch) originalPrice = parseInt(normalPriceMatch[1].replace(/,/g, ''), 10);

          if (!price) {
            const anyPrice = html.match(/(\d{1,3}(?:,\d{3})+)원/);
            if (anyPrice) price = parseInt(anyPrice[1].replace(/,/g, ''), 10);
          }

          const colors: string[] = [];
          const sizes: string[] = [];
          const option1Label = $('label[for="it_option_1"]').text().trim();
          const option2Label = $('label[for="it_option_2"]').text().trim();

          if (option1Label.includes('컬러') || option1Label.includes('색상') || option1Label.includes('Color')) {
            $('select#it_option_1 option, select[name="it_opt[]"]:first option').each((_i, el) => {
              const val = $(el).attr('value');
              if (val && val !== '선택' && !val.startsWith('선택') && val.trim()) {
                colors.push(val.trim());
              }
            });
          }
          if (option2Label.includes('사이즈') || option2Label.includes('크기') || option2Label.includes('Size')) {
            $('select#it_option_2 option, select[name="it_opt[]"]:eq(1) option').each((_i, el) => {
              const val = $(el).attr('value');
              if (val && val !== '선택' && !val.startsWith('선택') && val.trim()) {
                sizes.push(val.trim());
              }
            });
          }

          if (colors.length === 0 && sizes.length === 0) {
            $('select[name^="it_opt"] option').each((_i, el) => {
              const val = $(el).attr('value');
              if (val && val !== '선택' && !val.startsWith('선택') && val.trim()) {
                sizes.push(val.trim());
              }
            });
          }

          let options = '';
          if (colors.length > 0 || sizes.length > 0) {
            options = JSON.stringify({ colors, sizes });
          }

          let description = '';
          const explanDiv = $('#sit_inf_explan');
          if (explanDiv.length) {
            description = explanDiv.text().trim().slice(0, 2000);
          }
          if (!description) {
            description = name;
          }

          const mainImages: string[] = [];
          const imgRegex = new RegExp(`https://bagstyle\\.site/data/item/${sourceId}/[^"'\\s]+\\.(jpg|jpeg|png|webp)`, 'gi');
          const mainImgMatches = html.match(imgRegex) || [];
          mainImgMatches.forEach(img => {
            const clean = img.replace(/thumb-/, '').replace(/_\d+x\d+/g, '').split('?')[0];
            if (!clean.includes('_77x82') && !clean.includes('_100x100') && !mainImages.includes(clean)) mainImages.push(clean);
          });

          const detailImages: string[] = [];
          const detailRegex = /https?:\/\/bagstyle\.site\/data\/editor\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/gi;
          const detailMatches = html.match(detailRegex) || [];
          detailMatches.forEach(img => {
            const clean = img.replace(/^http:/, 'https:');
            if (!detailImages.includes(clean)) detailImages.push(clean);
          });

          let detailContent = '';
          const detailContentDiv = $('#sit_inf_explan');
          if (detailContentDiv.length) {
            detailContent = detailContentDiv.html()?.trim() || '';
          }
          if (!detailContent) {
            detailContent = "프리미엄 명품 제품입니다.";
          }

          let discountPercent = 0;
          if (originalPrice > 0 && price > 0 && originalPrice > price) {
            discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
          }

          const isBest = html.includes('BEST') || html.includes('best_icon') || html.includes('베스트');

          return {
            sourceId,
            name,
            brandName,
            price,
            originalPrice: originalPrice > 0 ? originalPrice : undefined,
            description,
            detailContent,
            imageUrl: mainImages[0] || `https://bagstyle.site/data/item/${sourceId}/`,
            imageUrls: mainImages,
            detailImageUrls: detailImages,
            categoryId: categoryLocalId,
            subcategoryId,
            discountPercent,
            isBest,
            options,
          };
        } catch { return null; }
      };

      try {
        if (clearExisting) {
          bagstyleProgress.message = '기존 상품 삭제 중...';
          const existing = await storage.getAllProducts();
          for (const p of existing) {
            await storage.deleteProduct(p.id);
          }
        }

        for (const cat of ALL_CATEGORIES) {
          try {
            const existingCats = await storage.getAllCategories();
            if (!existingCats.find(c => c.id === cat.localId || c.slug === cat.localId)) {
              await storage.createCategory({
                id: cat.localId,
                name: cat.name,
                slug: cat.localId,
                sortOrder: ALL_CATEGORIES.indexOf(cat) * 10,
                isActive: true,
              });
            }
          } catch {}

          const subcats = SUBCATEGORY_MAP[cat.caId] || [];
          for (const sub of subcats) {
            try {
              const existingSubs = await storage.getAllSubcategories();
              if (!existingSubs.find(s => s.id === sub.id || (s.categoryId === cat.localId && s.slug === sub.id))) {
                await storage.createSubcategory({
                  categoryId: cat.localId,
                  name: sub.name,
                  slug: sub.id,
                  sortOrder: subcats.indexOf(sub) * 10,
                  isActive: true,
                });
              }
            } catch {}
          }
        }

        let totalInserted = 0;

        for (const category of CATEGORIES) {
          bagstyleProgress.category = category.name;
          bagstyleProgress.message = `[${category.name}] 상품 목록 수집 중...`;

          const allIds = new Set<string>();
          let page = 1;
          let emptyCount = 0;

          while (emptyCount < 3) {
            const ids = await fetchProductList(category.caId, page);
            let newCount = 0;
            ids.forEach(id => { if (!allIds.has(id)) { allIds.add(id); newCount++; } });
            if (newCount === 0) emptyCount++; else emptyCount = 0;
            page++;
            await delay(50);

            if (page % 10 === 0) {
              bagstyleProgress.message = `[${category.name}] 페이지 ${page} 스캔 중... (${allIds.size}개 발견)`;
            }
          }

          if (allIds.size === 0) continue;

          bagstyleProgress.message = `[${category.name}] ${allIds.size}개 상품 상세 정보 수집 중...`;
          bagstyleProgress.total = allIds.size;
          bagstyleProgress.current = 0;

          const idsArray = Array.from(allIds);

          for (let i = 0; i < idsArray.length; i += 10) {
            const batch = idsArray.slice(i, i + 10);
            const results = await Promise.all(batch.map(id => fetchProductDetail(id, category.localId, category.caId)));

            for (const p of results) {
              if (p && p.price > 0) {
                try {
                  const brandId = await getOrCreateBrand(p.brandName);
                  await storage.createProduct({
                    name: p.name,
                    categoryId: p.categoryId,
                    subcategoryId: p.subcategoryId,
                    brandId: brandId,
                    price: p.price,
                    originalPrice: p.originalPrice,
                    description: p.description,
                    detailContent: p.detailContent,
                    imageUrl: p.imageUrl,
                    imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
                    detailImageUrls: p.detailImageUrls,
                    options: p.options || undefined,
                    discountPercent: p.discountPercent,
                    isBest: p.isBest,
                    isNew: totalInserted % 10 === 0,
                    isActive: true,
                  });
                  totalInserted++;
                } catch {}
              }
            }

            bagstyleProgress.current = Math.min(i + 10, idsArray.length);
            bagstyleProgress.message = `[${category.name}] 상품 저장 중... (${bagstyleProgress.current}/${allIds.size})`;
            await delay(80);
          }

          console.log(`[bagstyle][${category.name}] ${allIds.size} products processed, total: ${totalInserted}`);
        }

        bagstyleProgress.status = 'completed';
        bagstyleProgress.message = `완료! 총 ${totalInserted}개 상품이 크롤링되었습니다.`;
        bagstyleProgress.completedAt = new Date();
        console.log(`Bagstyle crawl complete: ${totalInserted} products`);

      } catch (error: any) {
        bagstyleProgress.status = 'error';
        bagstyleProgress.message = `오류: ${error.message || '알 수 없는 오류'}`;
        console.error('Bagstyle crawl error:', error);
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
