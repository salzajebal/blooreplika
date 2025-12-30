import type { Express, Request, Response } from "express";
import { type Server } from "http";
import * as cheerio from "cheerio";
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

const adminSessions = new Map<string, { expiresAt: Date }>();

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

function requireAdminAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !isValidSession(token)) {
    return res.status(401).json({ success: false, error: "인증이 필요합니다." });
  }
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
  app.use("/uploads", express.default.static(path.join(process.cwd(), "uploads")));
  
  // ==================== IMAGE PROXY API ====================
  
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: "URL parameter required" });
      }
      
      // Only allow proxying from cdamdong.co.kr
      if (!imageUrl.includes("cdamdong.co.kr")) {
        return res.status(403).json({ success: false, error: "Domain not allowed" });
      }
      
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://cdamdong.co.kr/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ success: false, error: "Failed to fetch image" });
      }
      
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = await response.arrayBuffer();
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ success: false, error: "Failed to proxy image" });
    }
  });
  
  // ==================== PRODUCTS API ====================
  
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category, categoryId, limit, offset } = req.query;
      
      // Default limit for production performance (always use pagination)
      const limitNum = limit ? parseInt(limit as string, 10) : 60;
      const offsetNum = offset ? parseInt(offset as string, 10) : 0;
      
      // Determine category filter
      const catFilter = (categoryId && categoryId !== "all") 
        ? categoryId as string 
        : (category && category !== "all") 
          ? category as string 
          : undefined;
      
      // Use database-level pagination for performance
      const { products: productList, total } = await storage.getProductsPaginated(limitNum, offsetNum, catFilter);
      
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

  app.get("/api/brands", async (req: Request, res: Response) => {
    try {
      const brandList = await storage.getAllBrands();
      res.json({ success: true, data: brandList });
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ success: false, error: "Failed to fetch brands" });
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
  
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateSessionToken();
      adminSessions.set(token, {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: "인증 실패" });
    }
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
      res.json({ success: true, valid: true });
    } else {
      res.status(401).json({ success: false, valid: false });
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
        phone
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
      const { email, password, name, phone, address } = req.body;
      
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
        address: address || null
      });
      
      res.status(201).json({ 
        success: true, 
        message: "회원가입이 완료되었습니다.",
        data: { id: member.id, email: member.email, name: member.name }
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ success: false, error: "회원가입 처리 중 오류가 발생했습니다." });
    }
  });

  app.post("/api/members/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." });
      }
      
      if (member.password !== password) {
        return res.status(401).json({ success: false, error: "비밀번호가 일치하지 않습니다." });
      }
      
      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      await storage.createMemberSession({
        token,
        memberId: member.id,
        email: member.email,
        name: member.name
      });
      
      await storage.updateMemberLastLogin(member.id);
      
      res.json({ 
        success: true, 
        token,
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
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
      const { name, phone, address, addressDetail, zipcode } = req.body;
      const member = await storage.updateMember(session.memberId, { name, phone, address, addressDetail, zipcode });
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
      const reviews = await storage.getVisibleReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "리뷰를 불러올 수 없습니다." });
    }
  });

  app.get("/api/admin/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ success: false, error: "리뷰를 불러올 수 없습니다." });
    }
  });

  app.post("/api/reviews", reviewImageUpload.array("images", 5), async (req: Request, res: Response) => {
    try {
      const { authorName, productId, productName, rating, title, content, displayDate } = req.body;
      const files = req.files as Express.Multer.File[];
      
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
      
      const review = await storage.createReview({
        authorName,
        productId: productId || null,
        productName: productName || null,
        rating: parseInt(rating) || 5,
        title: title || null,
        content,
        imageUrl: imageUrls[0] || null,
        imageUrls,
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

  // Crawl reviews from cdamdong.co.kr (bestreview board)
  app.post("/api/admin/crawl/reviews", requireAdminAuth, async (req: Request, res: Response) => {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://cdamdong.co.kr/bbs/board.php?bo_table=bestreview",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
    };
    
    try {
      const maxPages = req.body.maxPages || 5;
      const reviews: any[] = [];
      const seenIds = new Set<string>();
      
      console.log("Starting review crawl from bestreview board...");
      
      for (let page = 1; page <= maxPages; page++) {
        try {
          const listUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=bestreview&page=${page}`;
          console.log(`Fetching review list page ${page}: ${listUrl}`);
          
          const response = await fetch(listUrl, { headers });
          console.log(`Page ${page} response status: ${response.status}`);
          
          if (!response.ok) {
            console.log(`Page ${page} returned ${response.status}`);
            continue;
          }
          
          const html = await response.text();
          console.log(`Page ${page} HTML length: ${html.length}`);
          
          const $ = cheerio.load(html, { decodeEntities: true });
          
          // Method 1: Parse review list items using sct_li class
          const sctLiCount = $(".sct_li").length;
          console.log(`Page ${page}: Found ${sctLiCount} .sct_li elements`);
          
          $(".sct_li").each((_: number, el: any) => {
            const $el = $(el);
            
            // Try multiple selectors for the link
            let href = "";
            const $link = $el.find("a[href*='bestreview']").first();
            if ($link.length) {
              href = $link.attr("href") || "";
            }
            
            // Decode HTML entities in href
            href = href.replace(/&amp;/g, "&");
            
            const idMatch = href.match(/wr_id=(\d+)/);
            
            // Get title from the title div
            const title = $el.find(".sct_txt .title div").last().text().trim() || 
                         $el.find(".sct_txt a").text().trim() ||
                         $el.find("a").first().text().trim();
            
            // Get thumbnail image
            const thumbnail = $el.find(".prdImg img").attr("src") || $el.find("img").first().attr("src") || "";
            
            console.log(`Found item: href="${href.slice(0,50)}", id=${idMatch?.[1]}, title="${title.slice(0,30)}"`);
            
            if (idMatch && !seenIds.has(idMatch[1])) {
              seenIds.add(idMatch[1]);
              reviews.push({
                sourceId: idMatch[1],
                title,
                thumbnail,
              });
            }
          });
          
          // Method 2: Fallback - extract IDs directly from HTML using regex
          if (reviews.length === 0) {
            console.log("Method 1 failed, trying regex extraction...");
            const idRegex = /bestreview[^"]*wr_id=(\d+)/g;
            let match;
            while ((match = idRegex.exec(html)) !== null) {
              const id = match[1];
              if (!seenIds.has(id)) {
                seenIds.add(id);
                reviews.push({
                  sourceId: id,
                  title: `후기 #${id}`,
                  thumbnail: "",
                });
              }
            }
            console.log(`Regex method found ${seenIds.size} unique IDs`);
          }
          
          console.log(`Page ${page}: Found ${reviews.length} total reviews so far`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.error(`Error fetching page ${page}:`, e);
        }
      }
      
      console.log(`Total reviews found: ${reviews.length}`);
      
      // Fetch review details and save
      let savedCount = 0;
      for (const review of reviews.slice(0, 50)) {
        try {
          const detailUrl = `https://cdamdong.co.kr/bbs/board.php?bo_table=bestreview&wr_id=${review.sourceId}`;
          console.log(`Fetching review detail: ${detailUrl}`);
          
          const detailRes = await fetch(detailUrl, { 
            headers: {
              ...headers,
              "Referer": "https://cdamdong.co.kr/bbs/board.php?bo_table=bestreview"
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
          
          // Create review in database
          await storage.createReview({
            title: category ? `[${category}] ${fullTitle}` : fullTitle,
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

  return httpServer;
}
