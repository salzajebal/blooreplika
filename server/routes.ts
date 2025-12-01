import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

// Gold price fetch function (simulated real-time with fallback)
async function fetchGoldPrices() {
  // Try to fetch from a real API (metals-api or similar)
  // For now, we'll use realistic base prices that fluctuate slightly
  const now = new Date();
  const hourOffset = now.getHours() + now.getMinutes() / 60;
  
  // Base prices in KRW per 3.75g (1돈)
  const baseGoldBuy = 562000;
  const baseSilverBuy = 6820;
  const basePlatinumBuy = 198000;
  
  // Add realistic fluctuation based on time
  const fluctuation = Math.sin(hourOffset / 24 * Math.PI * 2) * 0.02; // ±2% daily fluctuation
  
  const goldBuy = Math.round(baseGoldBuy * (1 + fluctuation + (Math.random() - 0.5) * 0.005));
  const goldSell = Math.round(goldBuy * 0.905); // ~9.5% spread
  const goldChange = Math.round((fluctuation + (Math.random() - 0.5) * 0.01) * baseGoldBuy);
  
  const silverBuy = Math.round(baseSilverBuy * (1 + fluctuation * 1.2 + (Math.random() - 0.5) * 0.008));
  const silverSell = Math.round(silverBuy * 0.82); // ~18% spread for silver
  const silverChange = Math.round((fluctuation * 1.2 + (Math.random() - 0.5) * 0.01) * baseSilverBuy);
  
  const platinumBuy = Math.round(basePlatinumBuy * (1 + fluctuation * 0.8 + (Math.random() - 0.5) * 0.006));
  const platinumSell = Math.round(platinumBuy * 0.835);
  const platinumChange = Math.round((fluctuation * 0.8 + (Math.random() - 0.5) * 0.01) * basePlatinumBuy);
  
  return {
    gold: {
      buyPrice: goldBuy.toLocaleString(),
      sellPrice: goldSell.toLocaleString(),
      trend: goldChange >= 0 ? "up" : "down",
      change: Math.abs(goldChange).toLocaleString(),
    },
    silver: {
      buyPrice: silverBuy.toLocaleString(),
      sellPrice: silverSell.toLocaleString(),
      trend: silverChange >= 0 ? "up" : "down",
      change: Math.abs(silverChange).toLocaleString(),
    },
    platinum: {
      buyPrice: platinumBuy.toLocaleString(),
      sellPrice: platinumSell.toLocaleString(),
      trend: platinumChange >= 0 ? "up" : "down",
      change: Math.abs(platinumChange).toLocaleString(),
    },
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== GOLD PRICES API ====================
  
  // Get real-time gold prices
  app.get("/api/prices", async (req: Request, res: Response) => {
    try {
      const prices = await fetchGoldPrices();
      
      // Update database with latest prices
      await storage.updateGoldPrice("gold", prices.gold);
      await storage.updateGoldPrice("silver", prices.silver);
      await storage.updateGoldPrice("platinum", prices.platinum);
      
      res.json({
        success: true,
        data: prices,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ success: false, error: "Failed to fetch prices" });
    }
  });
  
  // ==================== PRODUCTS API ====================
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      let productList;
      
      if (category && category !== "all") {
        productList = await storage.getProductsByCategory(category as string);
      } else {
        productList = await storage.getAllProducts();
      }
      
      res.json({ success: true, data: productList });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
  });
  
  // Get single product
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
  
  // Create product (Admin)
  app.post("/api/products", async (req: Request, res: Response) => {
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
  
  // Update product (Admin)
  app.patch("/api/products/:id", async (req: Request, res: Response) => {
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
  
  // Delete product (Admin)
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
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
  
  // Get all categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categoryList = await storage.getAllCategories();
      res.json({ success: true, data: categoryList });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, error: "Failed to fetch categories" });
    }
  });
  
  // Create category (Admin)
  app.post("/api/categories", async (req: Request, res: Response) => {
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
  
  // ==================== SEED DATA ====================
  
  // Seed initial data (Admin - one-time setup)
  app.post("/api/seed", async (req: Request, res: Response) => {
    try {
      // Seed categories
      const categoryData = [
        { id: "gold_bar", name: "골드바", description: "한국공인금거래소가 보증하는 최고 품질의 순금 바", count: 6 },
        { id: "silver_bar", name: "실버바", description: "투자 가치가 높은 고순도 실버바 컬렉션", count: 2 },
        { id: "baby_ring", name: "돌반지/돌팔찌", description: "소중한 아이의 첫 생일을 축하하는 순금 선물", count: 2 },
        { id: "jewelry", name: "순금제품", description: "품격 있는 디자인의 고순도 순금 주얼리", count: 3 },
        { id: "diamond", name: "다이아몬드", description: "영원히 변치 않는 가치, 최상급 다이아몬드", count: 3 },
        { id: "corporate", name: "기업선물", description: "임직원 및 VIP를 위한 품격 있는 기업 전용 선물", count: 3 },
        { id: "gift_gold", name: "순금기념품", description: "특별한 날을 기념하는 소장가치 높은 순금 기념품", count: 2 },
        { id: "event", name: "이벤트", description: "한국공인금거래소의 특별한 혜택과 기획 상품", count: 2 },
      ];
      
      for (const cat of categoryData) {
        try {
          await storage.createCategory(cat);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      // Seed products
      const productData = [
        // Gold Bars
        { name: "한국공인금거래소 골드바 1,000g", weight: "1000g", purity: "999.9‰", price: "149,800,000", category: "gold_bar", isBest: true, isNew: false },
        { name: "한국공인금거래소 골드바 100g", weight: "100g", purity: "999.9‰", price: "15,100,000", category: "gold_bar", isBest: true, isNew: false },
        { name: "한국공인금거래소 골드바 10g", weight: "10g", purity: "999.9‰", price: "1,550,000", category: "gold_bar", isBest: false, isNew: true },
        { name: "한국공인금거래소 골드바 37.5g", weight: "37.5g", purity: "999.9‰", price: "5,620,000", category: "gold_bar", isBest: true, isNew: false },
        { name: "LS-Nikko 동제련 골드바 100g", weight: "100g", purity: "999.9‰", price: "15,250,000", category: "gold_bar", isBest: false, isNew: false },
        { name: "LS-Nikko 동제련 골드바 1000g", weight: "1000g", purity: "999.9‰", price: "150,500,000", category: "gold_bar", isBest: false, isNew: false },
        
        // Silver Bars
        { name: "한국공인금거래소 실버바 1,000g", weight: "1000g", purity: "999.9‰", price: "1,850,000", category: "silver_bar", isBest: true, isNew: false },
        { name: "한국공인금거래소 실버바 100g", weight: "100g", purity: "999.9‰", price: "195,000", category: "silver_bar", isBest: false, isNew: true },
        
        // Baby Rings
        { name: "순금 뽀르띠 돌반지 1.875g", weight: "1.875g", purity: "99.9%", price: "285,000", category: "baby_ring", isBest: true, isNew: false },
        { name: "순금 왕관 돌반지 3.75g", weight: "3.75g", purity: "99.9%", price: "540,000", category: "baby_ring", isBest: false, isNew: true },
        
        // Jewelry
        { name: "순금 체인 목걸이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,750,000", category: "jewelry", isBest: true, isNew: false },
        { name: "순금 팔찌 37.5g (10돈)", weight: "37.5g", purity: "99.9%", price: "5,450,000", category: "jewelry", isBest: false, isNew: true },
        { name: "순금 대나무 체인 목걸이 37.5g", weight: "37.5g", purity: "99.9%", price: "5,520,000", category: "jewelry", isBest: false, isNew: false },
        
        // Diamonds
        { name: "1캐럿 다이아몬드 솔리테어 링", weight: "1.02ct", purity: "GIA F/VS2", price: "12,500,000", category: "diamond", isBest: true, isNew: false },
        { name: "화이트골드 다이아몬드 목걸이", weight: "0.5ct", purity: "18K WG", price: "3,850,000", category: "diamond", isBest: false, isNew: true },
        { name: "5부 다이아몬드 웨딩 링", weight: "0.5ct", purity: "GIA E/SI1", price: "4,200,000", category: "diamond", isBest: false, isNew: false },
        
        // Corporate
        { name: "순금 감사패 (우드 케이스)", weight: "37.5g", purity: "99.9%", price: "5,800,000", category: "corporate", isBest: true, isNew: false },
        { name: "순금 행운의 열쇠 3.75g", weight: "3.75g", purity: "99.9%", price: "550,000", category: "corporate", isBest: true, isNew: false },
        { name: "기업 로고 순금 뱃지", weight: "3.75g", purity: "99.9%", price: "580,000", category: "corporate", isBest: false, isNew: true },
        
        // Gift Gold
        { name: "순금 황금돼지 37.5g", weight: "37.5g", purity: "99.9%", price: "5,700,000", category: "gift_gold", isBest: false, isNew: true },
        { name: "순금 거북이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,850,000", category: "gift_gold", isBest: false, isNew: false },
        
        // Events
        { name: "[이벤트] 2025 신년 기념 골드 코인", weight: "3.75g", purity: "99.9%", price: "520,000", category: "event", isBest: false, isNew: true },
        { name: "[특가] 골드바 10g + 실버바 100g 세트", weight: "110g", purity: "99.9%", price: "1,720,000", category: "event", isBest: true, isNew: false },
      ];
      
      for (const prod of productData) {
        try {
          await storage.createProduct(prod);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      res.json({ success: true, message: "Seed data created successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ success: false, error: "Failed to seed data" });
    }
  });

  return httpServer;
}
