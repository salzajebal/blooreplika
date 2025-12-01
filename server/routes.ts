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
  
  // Reset and seed comprehensive product data
  app.post("/api/seed-full", async (req: Request, res: Response) => {
    try {
      // Delete all existing products first
      const existingProducts = await storage.getAllProducts();
      for (const product of existingProducts) {
        await storage.deleteProduct(product.id);
      }

      // Seed categories
      const categoryData = [
        { id: "gold_bar", name: "골드바", description: "한국공인금거래소가 보증하는 최고 품질의 순금 바", count: 15 },
        { id: "silver_bar", name: "실버바", description: "투자 가치가 높은 고순도 실버바 컬렉션", count: 8 },
        { id: "baby_ring", name: "돌반지/돌팔찌", description: "소중한 아이의 첫 생일을 축하하는 순금 선물", count: 10 },
        { id: "jewelry", name: "순금제품", description: "품격 있는 디자인의 고순도 순금 주얼리", count: 12 },
        { id: "diamond", name: "다이아몬드", description: "영원히 변치 않는 가치, 최상급 다이아몬드", count: 8 },
        { id: "corporate", name: "기업선물", description: "임직원 및 VIP를 위한 품격 있는 기업 전용 선물", count: 10 },
        { id: "gift_gold", name: "순금기념품", description: "특별한 날을 기념하는 소장가치 높은 순금 기념품", count: 10 },
        { id: "event", name: "이벤트", description: "한국공인금거래소의 특별한 혜택과 기획 상품", count: 6 },
      ];
      
      for (const cat of categoryData) {
        try {
          await storage.createCategory(cat);
        } catch (e) {
          // Ignore duplicate errors
        }
      }
      
      // Comprehensive product data based on real Korean gold exchange offerings
      const productData = [
        // ==================== GOLD BARS (15 items) ====================
        { name: "한국금거래소 골드바 1kg", weight: "1000g", purity: "999.9‰", price: "149,800,000", category: "gold_bar", isBest: true, isNew: false, description: "LBMA 인증 국제 공인 순금 바" },
        { name: "한국금거래소 골드바 500g", weight: "500g", purity: "999.9‰", price: "75,200,000", category: "gold_bar", isBest: true, isNew: false, description: "투자용 대형 순금 바" },
        { name: "한국금거래소 골드바 100g", weight: "100g", purity: "999.9‰", price: "15,100,000", category: "gold_bar", isBest: true, isNew: false, description: "가장 인기있는 투자용 골드바" },
        { name: "한국금거래소 골드바 50g", weight: "50g", purity: "999.9‰", price: "7,580,000", category: "gold_bar", isBest: false, isNew: true, description: "중량 투자 입문용 골드바" },
        { name: "한국금거래소 골드바 37.5g (10돈)", weight: "37.5g", purity: "999.9‰", price: "5,620,000", category: "gold_bar", isBest: true, isNew: false, description: "전통 10돈 순금 바" },
        { name: "한국금거래소 골드바 30g", weight: "30g", purity: "999.9‰", price: "4,530,000", category: "gold_bar", isBest: false, isNew: false, description: "선물용 순금 바" },
        { name: "한국금거래소 골드바 18.75g (5돈)", weight: "18.75g", purity: "999.9‰", price: "2,850,000", category: "gold_bar", isBest: false, isNew: false, description: "5돈 순금 바" },
        { name: "한국금거래소 골드바 10g", weight: "10g", purity: "999.9‰", price: "1,550,000", category: "gold_bar", isBest: false, isNew: true, description: "소액 투자 입문용" },
        { name: "한국금거래소 골드바 5g", weight: "5g", purity: "999.9‰", price: "785,000", category: "gold_bar", isBest: false, isNew: true, description: "소형 투자용 골드바" },
        { name: "한국금거래소 골드바 3.75g (1돈)", weight: "3.75g", purity: "999.9‰", price: "590,000", category: "gold_bar", isBest: false, isNew: false, description: "1돈 순금 바" },
        { name: "한국금거래소 골드바 1g", weight: "1g", purity: "999.9‰", price: "165,000", category: "gold_bar", isBest: false, isNew: true, description: "미니 골드바 선물용" },
        { name: "LS-Nikko 동제련 골드바 1kg", weight: "1000g", purity: "999.9‰", price: "150,500,000", category: "gold_bar", isBest: false, isNew: false, description: "LS-Nikko 정제 순금" },
        { name: "LS-Nikko 동제련 골드바 100g", weight: "100g", purity: "999.9‰", price: "15,250,000", category: "gold_bar", isBest: false, isNew: false, description: "LS-Nikko 정제 순금" },
        { name: "PAMP 스위스 골드바 100g", weight: "100g", purity: "999.9‰", price: "15,450,000", category: "gold_bar", isBest: false, isNew: false, description: "스위스 PAMP 정제" },
        { name: "PAMP 스위스 골드바 50g", weight: "50g", purity: "999.9‰", price: "7,780,000", category: "gold_bar", isBest: false, isNew: true, description: "스위스 PAMP 정제" },

        // ==================== SILVER BARS (8 items) ====================
        { name: "한국금거래소 실버바 1kg", weight: "1000g", purity: "999.9‰", price: "1,850,000", category: "silver_bar", isBest: true, isNew: false, description: "투자용 대형 실버바" },
        { name: "한국금거래소 실버바 500g", weight: "500g", purity: "999.9‰", price: "950,000", category: "silver_bar", isBest: false, isNew: false, description: "중형 투자용 실버바" },
        { name: "한국금거래소 실버바 100g", weight: "100g", purity: "999.9‰", price: "195,000", category: "silver_bar", isBest: true, isNew: true, description: "인기 투자용 실버바" },
        { name: "한국금거래소 실버바 50g", weight: "50g", purity: "999.9‰", price: "105,000", category: "silver_bar", isBest: false, isNew: false, description: "소형 투자용 실버바" },
        { name: "한국금거래소 실버바 37.5g", weight: "37.5g", purity: "999.9‰", price: "82,000", category: "silver_bar", isBest: false, isNew: false, description: "10돈 실버바" },
        { name: "한국금거래소 실버바 10g", weight: "10g", purity: "999.9‰", price: "25,000", category: "silver_bar", isBest: false, isNew: true, description: "미니 실버바" },
        { name: "LS-Nikko 실버바 1kg", weight: "1000g", purity: "999.9‰", price: "1,870,000", category: "silver_bar", isBest: false, isNew: false, description: "LS-Nikko 정제 은" },
        { name: "LS-Nikko 실버바 100g", weight: "100g", purity: "999.9‰", price: "198,000", category: "silver_bar", isBest: false, isNew: false, description: "LS-Nikko 정제 은" },

        // ==================== BABY RINGS / 돌반지 (10 items) ====================
        { name: "순금 뽀로로 돌반지 1.875g", weight: "1.875g", purity: "99.9%", price: "285,000", category: "baby_ring", isBest: true, isNew: false, description: "뽀로로 캐릭터 돌반지" },
        { name: "순금 왕관 돌반지 3.75g", weight: "3.75g", purity: "99.9%", price: "540,000", category: "baby_ring", isBest: true, isNew: true, description: "왕관 모양 프리미엄 돌반지" },
        { name: "순금 하트 돌반지 1.875g", weight: "1.875g", purity: "99.9%", price: "290,000", category: "baby_ring", isBest: false, isNew: false, description: "하트 모양 돌반지" },
        { name: "순금 별 돌반지 1.875g", weight: "1.875g", purity: "99.9%", price: "288,000", category: "baby_ring", isBest: false, isNew: false, description: "별 모양 돌반지" },
        { name: "순금 토끼 돌반지 3.75g", weight: "3.75g", purity: "99.9%", price: "545,000", category: "baby_ring", isBest: false, isNew: true, description: "토끼 모양 돌반지" },
        { name: "순금 코끼리 돌팔찌 3.75g", weight: "3.75g", purity: "99.9%", price: "560,000", category: "baby_ring", isBest: true, isNew: false, description: "코끼리 모양 돌팔찌" },
        { name: "순금 클로버 돌팔찌 5.625g", weight: "5.625g", purity: "99.9%", price: "820,000", category: "baby_ring", isBest: false, isNew: false, description: "네잎클로버 돌팔찌" },
        { name: "순금 공주 돌반지 세트", weight: "5.625g", purity: "99.9%", price: "850,000", category: "baby_ring", isBest: false, isNew: true, description: "반지+팔찌 세트" },
        { name: "순금 왕자 돌반지 세트", weight: "5.625g", purity: "99.9%", price: "850,000", category: "baby_ring", isBest: false, isNew: true, description: "반지+팔찌 세트" },
        { name: "순금 곰돌이 돌반지 1.875g", weight: "1.875g", purity: "99.9%", price: "295,000", category: "baby_ring", isBest: false, isNew: false, description: "곰돌이 캐릭터 돌반지" },

        // ==================== JEWELRY / 순금제품 (12 items) ====================
        { name: "순금 체인 목걸이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,750,000", category: "jewelry", isBest: true, isNew: false, description: "클래식 체인 목걸이" },
        { name: "순금 팔찌 37.5g (10돈)", weight: "37.5g", purity: "99.9%", price: "5,450,000", category: "jewelry", isBest: true, isNew: true, description: "두꺼운 체인 팔찌" },
        { name: "순금 대나무 체인 목걸이 37.5g", weight: "37.5g", purity: "99.9%", price: "5,520,000", category: "jewelry", isBest: false, isNew: false, description: "대나무 마디 체인" },
        { name: "순금 로프 목걸이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,780,000", category: "jewelry", isBest: false, isNew: false, description: "로프 꼬임 디자인" },
        { name: "순금 뱅글 팔찌 18.75g", weight: "18.75g", purity: "99.9%", price: "2,820,000", category: "jewelry", isBest: false, isNew: true, description: "원형 뱅글 팔찌" },
        { name: "순금 커프 팔찌 15g", weight: "15g", purity: "99.9%", price: "2,280,000", category: "jewelry", isBest: false, isNew: false, description: "오픈형 커프 팔찌" },
        { name: "순금 하트 펜던트 3.75g", weight: "3.75g", purity: "99.9%", price: "580,000", category: "jewelry", isBest: false, isNew: false, description: "하트 모양 펜던트" },
        { name: "순금 십자가 펜던트 7.5g", weight: "7.5g", purity: "99.9%", price: "1,150,000", category: "jewelry", isBest: false, isNew: true, description: "십자가 펜던트" },
        { name: "순금 반지 3.75g", weight: "3.75g", purity: "99.9%", price: "565,000", category: "jewelry", isBest: false, isNew: false, description: "심플 순금 반지" },
        { name: "순금 커플링 세트 7.5g", weight: "7.5g", purity: "99.9%", price: "1,180,000", category: "jewelry", isBest: true, isNew: true, description: "커플 반지 2개 세트" },
        { name: "순금 귀걸이 3.75g", weight: "3.75g", purity: "99.9%", price: "590,000", category: "jewelry", isBest: false, isNew: false, description: "드롭형 귀걸이" },
        { name: "순금 브로치 7.5g", weight: "7.5g", purity: "99.9%", price: "1,180,000", category: "jewelry", isBest: false, isNew: false, description: "꽃 모양 브로치" },

        // ==================== DIAMOND (8 items) ====================
        { name: "1캐럿 다이아몬드 솔리테어 링", weight: "1.02ct", purity: "GIA F/VS2", price: "12,500,000", category: "diamond", isBest: true, isNew: false, description: "GIA 인증 1캐럿 링" },
        { name: "0.7캐럿 다이아몬드 링", weight: "0.71ct", purity: "GIA G/VS1", price: "7,800,000", category: "diamond", isBest: true, isNew: true, description: "GIA 인증 0.7캐럿" },
        { name: "0.5캐럿 다이아몬드 웨딩링", weight: "0.5ct", purity: "GIA E/SI1", price: "4,200,000", category: "diamond", isBest: false, isNew: false, description: "웨딩 다이아몬드 링" },
        { name: "0.3캐럿 다이아몬드 반지", weight: "0.31ct", purity: "GIA F/VS2", price: "2,100,000", category: "diamond", isBest: false, isNew: false, description: "데일리 다이아몬드" },
        { name: "화이트골드 다이아몬드 목걸이 0.5ct", weight: "0.5ct", purity: "18K WG", price: "3,850,000", category: "diamond", isBest: false, isNew: true, description: "18K 화이트골드 목걸이" },
        { name: "다이아몬드 테니스 팔찌 3ct", weight: "3.0ct", purity: "18K WG", price: "15,800,000", category: "diamond", isBest: false, isNew: false, description: "테니스 브레이슬릿" },
        { name: "다이아몬드 귀걸이 0.4ct", weight: "0.4ct", purity: "18K WG", price: "2,400,000", category: "diamond", isBest: false, isNew: true, description: "스터드 귀걸이" },
        { name: "다이아몬드 프로포즈 링 0.5ct", weight: "0.5ct", purity: "Pt950", price: "4,800,000", category: "diamond", isBest: true, isNew: false, description: "플래티넘 프로포즈 링" },

        // ==================== CORPORATE GIFTS (10 items) ====================
        { name: "순금 감사패 (우드 케이스) 37.5g", weight: "37.5g", purity: "99.9%", price: "5,800,000", category: "corporate", isBest: true, isNew: false, description: "고급 우드 케이스 포함" },
        { name: "순금 행운의 열쇠 3.75g", weight: "3.75g", purity: "99.9%", price: "550,000", category: "corporate", isBest: true, isNew: false, description: "성공 기원 열쇠" },
        { name: "순금 VIP 명패 18.75g", weight: "18.75g", purity: "99.9%", price: "2,850,000", category: "corporate", isBest: false, isNew: true, description: "VIP 고객 명패" },
        { name: "순금 우수사원상 7.5g", weight: "7.5g", purity: "99.9%", price: "1,150,000", category: "corporate", isBest: false, isNew: false, description: "우수사원 포상용" },
        { name: "순금 창립기념 메달 15g", weight: "15g", purity: "99.9%", price: "2,320,000", category: "corporate", isBest: false, isNew: true, description: "창립기념 메달" },
        { name: "기업 로고 순금 뱃지 3.75g", weight: "3.75g", purity: "99.9%", price: "580,000", category: "corporate", isBest: false, isNew: true, description: "맞춤 로고 제작 가능" },
        { name: "순금 근속패 11.25g", weight: "11.25g", purity: "99.9%", price: "1,720,000", category: "corporate", isBest: false, isNew: false, description: "10년 근속 기념패" },
        { name: "순금 골프공 마커 1.875g", weight: "1.875g", purity: "99.9%", price: "295,000", category: "corporate", isBest: false, isNew: false, description: "골프 기념품" },
        { name: "순금 볼펜 세트", weight: "3.75g", purity: "99.9%", price: "680,000", category: "corporate", isBest: false, isNew: true, description: "순금 장식 볼펜" },
        { name: "순금 명함케이스", weight: "7.5g", purity: "99.9%", price: "1,250,000", category: "corporate", isBest: false, isNew: false, description: "순금 장식 명함케이스" },

        // ==================== GIFT GOLD / 순금기념품 (10 items) ====================
        { name: "순금 황금돼지 37.5g", weight: "37.5g", purity: "99.9%", price: "5,700,000", category: "gift_gold", isBest: true, isNew: true, description: "복을 부르는 황금돼지" },
        { name: "순금 거북이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,850,000", category: "gift_gold", isBest: false, isNew: false, description: "장수 기원 거북이" },
        { name: "순금 용 37.5g", weight: "37.5g", purity: "99.9%", price: "5,850,000", category: "gift_gold", isBest: true, isNew: false, description: "2024년 용의 해 기념" },
        { name: "순금 뱀 18.75g", weight: "18.75g", purity: "99.9%", price: "2,900,000", category: "gift_gold", isBest: false, isNew: true, description: "2025년 뱀의 해 기념" },
        { name: "순금 두꺼비 11.25g", weight: "11.25g", purity: "99.9%", price: "1,750,000", category: "gift_gold", isBest: false, isNew: false, description: "재물 행운 두꺼비" },
        { name: "순금 코끼리 18.75g", weight: "18.75g", purity: "99.9%", price: "2,880,000", category: "gift_gold", isBest: false, isNew: false, description: "행운의 코끼리" },
        { name: "순금 부처님 37.5g", weight: "37.5g", purity: "99.9%", price: "5,750,000", category: "gift_gold", isBest: false, isNew: false, description: "평화와 복을 기원" },
        { name: "순금 호랑이 18.75g", weight: "18.75g", purity: "99.9%", price: "2,920,000", category: "gift_gold", isBest: false, isNew: true, description: "용맹한 호랑이 조각" },
        { name: "순금 잉어 11.25g", weight: "11.25g", purity: "99.9%", price: "1,780,000", category: "gift_gold", isBest: false, isNew: false, description: "출세 기원 잉어" },
        { name: "순금 봉황 37.5g", weight: "37.5g", purity: "99.9%", price: "5,900,000", category: "gift_gold", isBest: true, isNew: false, description: "부귀영화 봉황" },

        // ==================== EVENT / 이벤트 (6 items) ====================
        { name: "[이벤트] 2025 신년 기념 골드 코인 1돈", weight: "3.75g", purity: "99.9%", price: "520,000", category: "event", isBest: true, isNew: true, description: "2025년 한정판 코인" },
        { name: "[특가] 골드바 10g + 실버바 100g 세트", weight: "110g", purity: "99.9%", price: "1,720,000", category: "event", isBest: true, isNew: false, description: "세트 할인 상품" },
        { name: "[한정] 럭키백 순금 1돈", weight: "3.75g", purity: "99.9%", price: "550,000", category: "event", isBest: false, isNew: true, description: "랜덤 디자인 순금" },
        { name: "[이벤트] 결혼기념 골드바 세트", weight: "7.5g", purity: "99.9%", price: "1,180,000", category: "event", isBest: false, isNew: true, description: "커플 각인 서비스" },
        { name: "[특가] 돌반지 + 돌팔찌 세트", weight: "7.5g", purity: "99.9%", price: "1,100,000", category: "event", isBest: false, isNew: false, description: "돌잔치 세트 할인" },
        { name: "[한정] 설날 특선 황금 복주머니", weight: "3.75g", purity: "99.9%", price: "580,000", category: "event", isBest: true, isNew: true, description: "설날 한정 기획상품" },
      ];
      
      let createdCount = 0;
      for (const prod of productData) {
        try {
          await storage.createProduct(prod);
          createdCount++;
        } catch (e) {
          console.error("Error creating product:", prod.name, e);
        }
      }
      
      res.json({ success: true, message: `${createdCount}개의 상품이 생성되었습니다.` });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ success: false, error: "Failed to seed data" });
    }
  });

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
