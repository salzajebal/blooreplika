import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { setupChatWebSocket } from "./chatSocket";
import { storage } from "./storage";
import { pool } from "./db";

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error.message);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const httpServer = createServer(app);

setupChatWebSocket(httpServer);

// Serve attached_assets folder for generated images
app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Handle favicon.ico requests by redirecting to favicon.png
app.get("/favicon.ico", (_req, res) => {
  res.redirect(301, "/favicon.png");
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Global error handler - must always return JSON
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`[ERROR] ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }

    // Always return JSON response
    if (!res.headersSent) {
      res.status(status).json({ 
        success: false, 
        error: message,
        message: message 
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      runCategoryMigrations();
      runSubcategoryMigrations();
      runCriticalNameFixes();
      runJewelryCaIdFix();
      runWatchBrandsSeed();
      runGenderNormalization();
      runStartupMaintenance();
    },
  );
})();

async function runCategoryMigrations() {
  try {
    // 필수 카테고리 테이블 등록 (없으면 추가, 있으면 무시)
    const requiredCategories = [
      { id: 'clothing',   name: '의류',        slug: 'clothing',   sortOrder: 10 },
      { id: 'bags',       name: '가방',        slug: 'bags',       sortOrder: 20 },
      { id: 'wallets',    name: '지갑',        slug: 'wallets',    sortOrder: 30 },
      { id: 'shoes',      name: '신발',        slug: 'shoes',      sortOrder: 40 },
      { id: 'sunglasses', name: '선글라스',    slug: 'sunglasses', sortOrder: 50 },
      { id: 'belts',      name: '벨트',        slug: 'belts',      sortOrder: 60 },
      { id: 'jewelry',    name: '쥬얼리/잡화', slug: 'jewelry',    sortOrder: 70 },
      { id: 'watches',    name: '시계',        slug: 'watches',    sortOrder: 80 },
      { id: 'golf',       name: '골프',        slug: 'golf',       sortOrder: 90 },
      { id: 'accessories',name: '잡화',        slug: 'accessories',sortOrder: 95 },
    ];
    for (const cat of requiredCategories) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, description, sort_order, is_active)
         VALUES ($1, $2, $3, '', $4, true)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.name, cat.slug, cat.sortOrder]
      );
    }
    log('Category migrations completed (all required categories ensured)', 'migration');
  } catch (err: any) {
    console.error('[migration] Category migration error:', err.message);
  }
}

async function runWatchBrandsSeed() {
  try {
    const watchBrands = [
      { name: '오메가',         slug: 'omega' },
      { name: 'IWC',           slug: 'iwc' },
      { name: '파텍필립',       slug: 'patek-philippe' },
      { name: '태그호이어',     slug: 'tag-heuer' },
      { name: '브라이틀링',     slug: 'breitling' },
      { name: '위블로',         slug: 'hublot' },
      { name: '롱진',           slug: 'longines' },
      { name: '오데마 피게',    slug: 'audemars-piguet' },
      { name: '튜더',           slug: 'tudor' },
      { name: '예거 르쿨트르',  slug: 'jaeger-lecoultre' },
      { name: '바쉐론 콘스탄틴', slug: 'vacheron-constantin' },
      { name: '브레게',         slug: 'breguet' },
      { name: '블랑팡',         slug: 'blancpain' },
      { name: '피아제',         slug: 'piaget' },
      { name: '쇼파드',         slug: 'chopard' },
      { name: '제니스',         slug: 'zenith' },
      { name: '파네라이',       slug: 'panerai' },
      { name: '랑에 운트 죄네', slug: 'a-lange-sohne' },
      { name: '글라슈테 오리지날', slug: 'glashutte-original' },
      { name: '프랭크뮬러',     slug: 'franck-muller' },
      { name: '리차드밀',       slug: 'richard-mille' },
      { name: '세이코',         slug: 'seiko' },
      { name: '그랑세이코',     slug: 'grand-seiko' },
    ];
    for (const brand of watchBrands) {
      await pool.query(
        `INSERT INTO brands (id, name, slug, description, sort_order, is_active)
         VALUES (gen_random_uuid(), $1, $2, '명품 시계 브랜드', 100, true)
         ON CONFLICT (slug) DO NOTHING`,
        [brand.name, brand.slug]
      );
    }
    log('Watch brands seed completed', 'migration');
  } catch (err: any) {
    console.error('[migration] Watch brands seed error:', err.message);
  }
}

async function runSubcategoryMigrations() {
  try {
    // bagstyle.site 전체 소분류 99개를 subcategories 테이블에 시드
    // slug = caId (e.g. "b01010"), category_id = 상위 카테고리 ID (e.g. "clothing")
    const subcats: { categoryId: string; name: string; slug: string; sortOrder: number }[] = [
      // ── 남성의류 (clothing / b01xxx) ──
      { categoryId: "clothing", name: "자켓/점퍼",    slug: "b01010", sortOrder: 1  },
      { categoryId: "clothing", name: "패딩/털",      slug: "b01020", sortOrder: 2  },
      { categoryId: "clothing", name: "가죽옷",       slug: "b01030", sortOrder: 3  },
      { categoryId: "clothing", name: "코트/정장",    slug: "b01040", sortOrder: 4  },
      { categoryId: "clothing", name: "후드티/집업",   slug: "b01050", sortOrder: 5  },
      { categoryId: "clothing", name: "셔츠/남방",    slug: "b01060", sortOrder: 6  },
      { categoryId: "clothing", name: "베스트/조끼",  slug: "b01070", sortOrder: 7  },
      { categoryId: "clothing", name: "니트/스웨터",  slug: "b01080", sortOrder: 8  },
      { categoryId: "clothing", name: "가디건",       slug: "b01090", sortOrder: 9  },
      { categoryId: "clothing", name: "반팔티/폴로티", slug: "b010a0", sortOrder: 10 },
      { categoryId: "clothing", name: "긴팔티/맨투맨", slug: "b010b0", sortOrder: 11 },
      { categoryId: "clothing", name: "운동복/추리닝", slug: "b010c0", sortOrder: 12 },
      { categoryId: "clothing", name: "팬츠/청바지",  slug: "b010d0", sortOrder: 13 },
      { categoryId: "clothing", name: "반바지",       slug: "b010e0", sortOrder: 14 },
      { categoryId: "clothing", name: "세트",         slug: "b010f0", sortOrder: 15 },
      // ── 남성가방 (bags / b02xxx) ──
      { categoryId: "bags", name: "토트백",           slug: "b02010", sortOrder: 1  },
      { categoryId: "bags", name: "크로스백",         slug: "b02020", sortOrder: 2  },
      { categoryId: "bags", name: "숄더백",           slug: "b02030", sortOrder: 3  },
      { categoryId: "bags", name: "백팩",             slug: "b02040", sortOrder: 4  },
      { categoryId: "bags", name: "서류가방/메신져백", slug: "b02050", sortOrder: 5  },
      { categoryId: "bags", name: "파우치/클러치",    slug: "b02060", sortOrder: 6  },
      { categoryId: "bags", name: "여행가방",         slug: "b02070", sortOrder: 7  },
      { categoryId: "bags", name: "캐리어",           slug: "b02080", sortOrder: 8  },
      { categoryId: "bags", name: "벨트백/새들/슬링", slug: "b02090", sortOrder: 9  },
      { categoryId: "bags", name: "기타",             slug: "b020a0", sortOrder: 10 },
      // ── 남성지갑 (wallets / b04xxx) ──
      { categoryId: "wallets", name: "장지갑/소지갑", slug: "b04010", sortOrder: 1 },
      { categoryId: "wallets", name: "카드지갑",      slug: "b04020", sortOrder: 2 },
      { categoryId: "wallets", name: "동전지갑",      slug: "b04030", sortOrder: 3 },
      // ── 남성신발 (shoes / b0bxxx) ──
      { categoryId: "shoes", name: "스니커즈",        slug: "b0b010", sortOrder: 1 },
      { categoryId: "shoes", name: "운동화",          slug: "b0b020", sortOrder: 2 },
      { categoryId: "shoes", name: "정장구두",        slug: "b0b030", sortOrder: 3 },
      { categoryId: "shoes", name: "샌들/슬리퍼",    slug: "b0b040", sortOrder: 4 },
      { categoryId: "shoes", name: "부츠/워커",      slug: "b0b050", sortOrder: 5 },
      { categoryId: "shoes", name: "로퍼/슬립온",    slug: "b0b060", sortOrder: 6 },
      // ── 남성선글라스 (sunglasses / b0axxx) ──
      { categoryId: "sunglasses", name: "선글라스",  slug: "b0a010", sortOrder: 1 },
      { categoryId: "sunglasses", name: "안경태",    slug: "b0a020", sortOrder: 2 },
      // ── 남성벨트 (belts / b07xxx) ──
      { categoryId: "belts", name: "가죽벨트",        slug: "b07010", sortOrder: 1 },
      { categoryId: "belts", name: "메쉬벨트",        slug: "b07020", sortOrder: 2 },
      // ── 남성쥬얼리/잡화 (jewelry / b08xxx) ──
      { categoryId: "jewelry", name: "목걸이",        slug: "b08010", sortOrder: 1  },
      { categoryId: "jewelry", name: "팔찌",          slug: "b08020", sortOrder: 2  },
      { categoryId: "jewelry", name: "반지",          slug: "b08030", sortOrder: 3  },
      { categoryId: "jewelry", name: "백참/브로치",   slug: "b08040", sortOrder: 4  },
      { categoryId: "jewelry", name: "만년필/볼펜",   slug: "b08050", sortOrder: 5  },
      { categoryId: "jewelry", name: "장갑",          slug: "b08060", sortOrder: 6  },
      { categoryId: "jewelry", name: "라이터/듀퐁",   slug: "b08080", sortOrder: 7  },
      { categoryId: "jewelry", name: "스카프/머플러", slug: "b08090", sortOrder: 8  },
      { categoryId: "jewelry", name: "넥타이",        slug: "b080a0", sortOrder: 9  },
      { categoryId: "jewelry", name: "모자",          slug: "b080b0", sortOrder: 10 },
      { categoryId: "jewelry", name: "우산",          slug: "b080c0", sortOrder: 11 },
      { categoryId: "jewelry", name: "커프스",        slug: "b080d0", sortOrder: 12 },
      { categoryId: "jewelry", name: "키홀더",        slug: "b080e0", sortOrder: 13 },
      { categoryId: "jewelry", name: "기타",          slug: "b080f0", sortOrder: 14 },
      // ── 여성의류 (clothing / c01xxx) ──
      { categoryId: "clothing", name: "자켓/점퍼",    slug: "c01010", sortOrder: 1  },
      { categoryId: "clothing", name: "패딩/털",      slug: "c01020", sortOrder: 2  },
      { categoryId: "clothing", name: "코트",         slug: "c01030", sortOrder: 3  },
      { categoryId: "clothing", name: "후드티",       slug: "c01040", sortOrder: 4  },
      { categoryId: "clothing", name: "셔츠/남방",    slug: "c01050", sortOrder: 5  },
      { categoryId: "clothing", name: "조끼",         slug: "c01060", sortOrder: 6  },
      { categoryId: "clothing", name: "가죽옷",       slug: "c01070", sortOrder: 7  },
      { categoryId: "clothing", name: "니트/스웨터",  slug: "c01080", sortOrder: 8  },
      { categoryId: "clothing", name: "가디건",       slug: "c01090", sortOrder: 9  },
      { categoryId: "clothing", name: "반팔티/폴로",  slug: "c010a0", sortOrder: 10 },
      { categoryId: "clothing", name: "긴팔티/맨투맨", slug: "c010b0", sortOrder: 11 },
      { categoryId: "clothing", name: "운동복/추리닝", slug: "c010c0", sortOrder: 12 },
      { categoryId: "clothing", name: "팬츠/청바지",  slug: "c010d0", sortOrder: 13 },
      { categoryId: "clothing", name: "반바지/스커트", slug: "c010e0", sortOrder: 14 },
      { categoryId: "clothing", name: "원피스",       slug: "c010f0", sortOrder: 15 },
      { categoryId: "clothing", name: "수영복",       slug: "c010g0", sortOrder: 16 },
      // ── 여성가방 (bags / c02xxx) ──
      { categoryId: "bags", name: "숄더백",           slug: "c02010", sortOrder: 1  },
      { categoryId: "bags", name: "토트백",           slug: "c02020", sortOrder: 2  },
      { categoryId: "bags", name: "클러치백",         slug: "c02030", sortOrder: 3  },
      { categoryId: "bags", name: "백팩",             slug: "c02040", sortOrder: 4  },
      { categoryId: "bags", name: "파우치",           slug: "c02050", sortOrder: 5  },
      { categoryId: "bags", name: "크로스백",          slug: "c02060", sortOrder: 6  },
      { categoryId: "bags", name: "메신져백",         slug: "c02070", sortOrder: 7  },
      { categoryId: "bags", name: "여행가방",         slug: "c02080", sortOrder: 8  },
      { categoryId: "bags", name: "캐리어",           slug: "c02090", sortOrder: 9  },
      { categoryId: "bags", name: "벨트백/새들/슬링", slug: "c020a0", sortOrder: 10 },
      { categoryId: "bags", name: "미니백",           slug: "c020b0", sortOrder: 11 },
      { categoryId: "bags", name: "기타",             slug: "c020c0", sortOrder: 12 },
      // ── 여성지갑 (wallets / c03xxx) ──
      { categoryId: "wallets", name: "장지갑/소지갑", slug: "c03010", sortOrder: 1 },
      { categoryId: "wallets", name: "카드지갑",      slug: "c03020", sortOrder: 2 },
      { categoryId: "wallets", name: "동전지갑",      slug: "c03030", sortOrder: 3 },
      // ── 여성신발 (shoes / c05xxx, g0xx) ──
      { categoryId: "shoes", name: "스니커즈",        slug: "c05010", sortOrder: 1 },
      { categoryId: "shoes", name: "운동화",          slug: "c05020", sortOrder: 2 },
      { categoryId: "shoes", name: "정장구두",        slug: "g030",   sortOrder: 3 },
      { categoryId: "shoes", name: "샌들/슬리퍼",    slug: "c05030", sortOrder: 4 },
      { categoryId: "shoes", name: "펌프스/힐",      slug: "c05040", sortOrder: 5 },
      { categoryId: "shoes", name: "부츠/워커",      slug: "c05050", sortOrder: 6 },
      { categoryId: "shoes", name: "단화/플랫",      slug: "c05060", sortOrder: 7 },
      { categoryId: "shoes", name: "로퍼/슬립온",    slug: "c05070", sortOrder: 8 },
      // ── 여성선글라스 (sunglasses / c07xxx) ──
      { categoryId: "sunglasses", name: "선글라스",  slug: "c07010", sortOrder: 1 },
      { categoryId: "sunglasses", name: "안경태",    slug: "c07020", sortOrder: 2 },
      // ── 여성벨트 (belts / c06xxx) ──
      { categoryId: "belts", name: "가죽벨트",        slug: "c06010", sortOrder: 1 },
      { categoryId: "belts", name: "메쉬벨트",        slug: "c06020", sortOrder: 2 },
      // ── 여성쥬얼리/잡화 (f0 하위 각 독립 caId, 확인 완료) ──
      { categoryId: "jewelry", name: "목걸이",        slug: "f0a0",   sortOrder: 1  },
      { categoryId: "jewelry", name: "귀걸이",        slug: "f0d0",   sortOrder: 2  },
      { categoryId: "jewelry", name: "팔찌",          slug: "f0b0",   sortOrder: 3  },
      { categoryId: "jewelry", name: "반지",          slug: "f0c0",   sortOrder: 4  },
      { categoryId: "jewelry", name: "백참/브로치",   slug: "f090",   sortOrder: 5  },
      { categoryId: "jewelry", name: "스카프/머플러", slug: "f030",   sortOrder: 6  },
      { categoryId: "jewelry", name: "모자",          slug: "f070",   sortOrder: 7  },
      { categoryId: "jewelry", name: "키홀더",        slug: "f0e0",   sortOrder: 8  },
      { categoryId: "jewelry", name: "만년필/볼펜",   slug: "f050",   sortOrder: 9  },
      { categoryId: "jewelry", name: "장갑",          slug: "f080",   sortOrder: 10 },
      { categoryId: "jewelry", name: "우산",          slug: "f0f0",   sortOrder: 11 },
      { categoryId: "jewelry", name: "담요/쿠션",     slug: "f0g0",   sortOrder: 12 },
      { categoryId: "jewelry", name: "기타",          slug: "f0h0",   sortOrder: 13 },
      // ── 골프 남성의류 (clothing / 701xxx) ──
      { categoryId: "clothing", name: "자켓/점퍼",    slug: "701010", sortOrder: 1  },
      { categoryId: "clothing", name: "반팔티",       slug: "701020", sortOrder: 2  },
      { categoryId: "clothing", name: "긴팔티",       slug: "701030", sortOrder: 3  },
      { categoryId: "clothing", name: "긴바지",       slug: "701040", sortOrder: 4  },
      { categoryId: "clothing", name: "비옷",         slug: "701050", sortOrder: 5  },
      { categoryId: "clothing", name: "조끼",         slug: "701060", sortOrder: 6  },
      { categoryId: "clothing", name: "반바지",       slug: "701070", sortOrder: 7  },
      { categoryId: "clothing", name: "패딩/아우터",  slug: "701080", sortOrder: 8  },
      { categoryId: "clothing", name: "니트/스웨터",  slug: "701090", sortOrder: 9  },
      { categoryId: "clothing", name: "셋트",         slug: "7010a0", sortOrder: 10 },
      // ── 골프 여성의류 (clothing / 702xxx) ──
      { categoryId: "clothing", name: "자켓/점퍼",    slug: "702010", sortOrder: 1  },
      { categoryId: "clothing", name: "반팔티",       slug: "702020", sortOrder: 2  },
      { categoryId: "clothing", name: "긴팔티",       slug: "702030", sortOrder: 3  },
      { categoryId: "clothing", name: "긴바지",       slug: "702040", sortOrder: 4  },
      { categoryId: "clothing", name: "반바지",       slug: "702050", sortOrder: 5  },
      { categoryId: "clothing", name: "조끼",         slug: "702060", sortOrder: 6  },
      { categoryId: "clothing", name: "비옷",         slug: "702070", sortOrder: 7  },
      { categoryId: "clothing", name: "패딩아우터",   slug: "702080", sortOrder: 8  },
      { categoryId: "clothing", name: "원피스",       slug: "702090", sortOrder: 9  },
      { categoryId: "clothing", name: "스커트",       slug: "7020a0", sortOrder: 10 },
      { categoryId: "clothing", name: "니트/스웨터",  slug: "7020b0", sortOrder: 11 },
      { categoryId: "clothing", name: "셋트",         slug: "7020c0", sortOrder: 12 },
      // ── 골프 가방 (bags / 704xxx) ──
      { categoryId: "bags", name: "캐디백",           slug: "704010", sortOrder: 1 },
      { categoryId: "bags", name: "보스턴백",         slug: "704020", sortOrder: 2 },
      { categoryId: "bags", name: "토트백",           slug: "704030", sortOrder: 3 },
      { categoryId: "bags", name: "클러치백",         slug: "704040", sortOrder: 4 },
      { categoryId: "bags", name: "기타",             slug: "704050", sortOrder: 5 },
      // ── 골프 신발 (shoes / 703xxx) ──
      { categoryId: "shoes", name: "골프화",          slug: "703010", sortOrder: 1 },
      { categoryId: "shoes", name: "스니커즈",        slug: "703020", sortOrder: 2 },
    ];

    let inserted = 0, skipped = 0;
    for (const sub of subcats) {
      const res = await pool.query(
        `INSERT INTO subcategories (id, category_id, name, slug, sort_order, is_active)
         SELECT gen_random_uuid(), $1, $2, $3, $4, true
         WHERE NOT EXISTS (SELECT 1 FROM subcategories WHERE slug = $3)`,
        [sub.categoryId, sub.name, sub.slug, sub.sortOrder]
      );
      if (res.rowCount && res.rowCount > 0) inserted++;
      else skipped++;
    }
    log(`Subcategory migrations completed: ${inserted} inserted, ${skipped} already existed`, 'migration');
  } catch (err: any) {
    console.error('[migration] Subcategory migration error:', err.message);
  }
}

async function runCriticalNameFixes() {
  try {
    // 프로덕션 DB에서 잘못 저장된 서브카테고리 이름을 직접 수정
    const fixes: Array<[string, string]> = [
      ['c01010', '자켓/점퍼'],  // '자켓' → '자켓/점퍼'
      ['c02060', '크로스백'],   // '크로스' → '크로스백'
      ['c02090', '캐리어'],     // '케리어' → '캐리어'
      ['g030',   '정장구두'],   // 여성 정장구두 (bagstyle ca_id=g030)
    ];
    let fixed = 0;
    for (const [slug, correctName] of fixes) {
      const res = await pool.query(
        `UPDATE subcategories SET name = $1 WHERE slug = $2 AND name != $1`,
        [correctName, slug]
      );
      if (res.rowCount && res.rowCount > 0) {
        fixed++;
        log(`Fixed subcategory name: ${slug} → "${correctName}"`, 'migration');
      }
    }
    if (fixed > 0) log(`Critical name fixes applied: ${fixed} updated`, 'migration');
    else log('Critical name fixes: all names already correct', 'migration');
  } catch (err: any) {
    console.error('[migration] Critical name fix error:', err.message);
  }
}

async function runJewelryCaIdFix() {
  try {
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    // 잘못 저장된 c0a0xx → 올바른 f0a0xx 로 수정 (1회성 마이그레이션)
    // 잘못 저장된 subcategoryId → 올바른 f0xx caId로 수정
    const fixes: Array<[string, string]> = [
      // 이전 잘못된 마이그레이션(c0a0xx→f0a0xx)으로 옮겨진 것들을 올바른 f0xx로 재이동
      ["f0a050", "f050"],   // 만년필/볼펜
      ["f0a060", "f0e0"],   // 키홀더
      ["f0a070", "f070"],   // 모자
      ["f0a080", "f080"],   // 장갑
      ["f0a090", "f0f0"],   // 우산
      ["f0a0a0", "f090"],   // 백참/브로치
      ["f0a0b0", "f030"],   // 스카프/머플러
      ["f0a0c0", "f0h0"],   // 기타
      // c0a0xx(구버전 추정 caId)가 남아있는 경우 → 올바른 f0xx로 이동
      ["c0a010", "f050"],   // 만년필/볼펜
      ["c0a020", "f0e0"],   // 키홀더
      ["c0a030", "f070"],   // 모자
      ["c0a040", "f080"],   // 장갑
      ["c0a050", "f0f0"],   // 우산
      ["c0a060", "f090"],   // 백참/브로치
      ["c0a070", "f030"],   // 스카프/머플러
      ["c0a080", "f0h0"],   // 기타
      // 잘못된 f0a0xy 패턴 → 가장 가까운 올바른 caId로
      ["f0a010", "f0a0"],   // 목걸이로 귀속
      ["f0a020", "f0a0"],
      ["f0a030", "f0a0"],
      ["f0a040", "f0a0"],
    ];
    let totalFixed = 0;
    for (const [from, to] of fixes) {
      const result = await db.execute(
        sql`UPDATE products SET subcategory_id = ${to} WHERE subcategory_id = ${from}`
      );
      const count = (result as any).rowCount ?? 0;
      if (count > 0) {
        totalFixed += count;
        log(`[jewelry-fix] ${from} → ${to}: ${count}개 수정`, "migration");
      }
    }
    if (totalFixed > 0) log(`[jewelry-fix] 완료: ${totalFixed}개 subcategoryId 수정`, "migration");
  } catch (err: any) {
    console.error("[jewelry-fix] error:", err.message);
  }
}

async function runStartupMaintenance() {
  try {
    const allProducts = await storage.getAllProducts();
    if (allProducts.length === 0) return;

    const needsFix = allProducts.some(p => 
      p.name.includes('&gt;') || p.name.includes('&lt;') || p.name.includes('&amp;') || 
      p.name.includes('&quot;') || p.name.includes('&#') || !p.brandId
    );
    if (!needsFix) return;

    log(`Starting product data maintenance for ${allProducts.length} products...`, 'maintenance');

    const BRAND_KEYWORDS: Record<string, string[]> = {
      '구찌': ['구찌', 'gucci'], '루이비통': ['루이비통', 'louis vuitton', 'louisvuitton', 'lv'],
      '샤넬': ['샤넬', 'chanel'], '에르메스': ['에르메스', 'hermes', 'hermès'],
      '프라다': ['프라다', 'prada'], '디올': ['디올', 'dior', 'christian dior'],
      '버버리': ['버버리', 'burberry'], '발렌시아가': ['발렌시아가', 'balenciaga'],
      '셀린느': ['셀린느', '셀린', 'celine', 'céline'],
      '보테가 베네타': ['보테가', '보테가베네타', 'bottega', 'bottega veneta'],
      '펜디': ['펜디', 'fendi'], '미우미우': ['미우미우', 'miu miu', 'miumiu'],
      '몽클레어': ['몽클레어', 'moncler', 'moncler'], '톰브라운': ['톰브라운', 'thom browne', 'thombrowne'],
      '발렌티노': ['발렌티노', 'valentino'], '지방시': ['지방시', 'givenchy'],
      '로에베': ['로에베', 'loewe'], '생로랑': ['생로랑', 'saint laurent', 'ysl', 'yves saint laurent'],
      '베르사체': ['베르사체', 'versace'],
      '알렉산더 맥퀸': ['알렉산더맥퀸', '알렉산더 맥퀸', 'alexander mcqueen', 'mcqueen'],
      '톰포드': ['톰포드', 'tom ford', 'tomford'], '막스마라': ['막스마라', 'max mara', 'maxmara'],
      '페레가모': ['페레가모', 'ferragamo', 'salvatore ferragamo'],
      '골든구스': ['골든구스', 'golden goose', 'goldengoose', 'ggdb'],
      '마르니': ['마르니', 'marni'], '끌로에': ['끌로에', '클로에', 'chloe', 'chloé'],
      '자크뮈스': ['자크뮈스', 'jacquemus'], '아미': ['아미', 'ami', 'ami paris'],
      '메종키츠네': ['메종키츠네', 'maison kitsune', 'maisonkitsune', 'kitsuné'],
      '꼼데가르송': ['꼼데가르송', 'comme des garcons', 'commedesgarcons', 'cdg'],
      '오프화이트': ['오프화이트', 'off-white', 'off white', 'offwhite'],
      '스톤아일랜드': ['스톤아일랜드', 'stone island', 'stoneisland'],
      '아크네 스튜디오': ['아크네', '아크네스튜디오', 'acne studios', 'acne'],
      '이자벨마랑': ['이자벨마랑', 'isabel marant', 'isabelmarant'],
      '마르지엘라': ['마르지엘라', '메종마르지엘라', '메종 마르지엘라', 'margiela', 'maison margiela'],
      '릭오웬스': ['릭오웬스', 'rick owens', 'rickowens'],
      '베트멍': ['베트멍', 'vetements'], '팜엔젤스': ['팜엔젤스', 'palm angels', 'palmangels'],
      '아미리': ['아미리', 'amiri'],
      '지미추': ['지미추', '지미 추', 'jimmy choo', 'jimmychoo'],
      '마놀로 블라닉': ['마놀로블라닉', '마놀로 블라닉', 'manolo blahnik', 'manoloblahnik'],
      '크롬하츠': ['크롬하츠', 'chrome hearts', 'chromehearts'],
      '티파니': ['티파니', 'tiffany'], '반클리프': ['반클리프', 'van cleef', 'vancleef'],
      '불가리': ['불가리', 'bulgari', 'bvlgari'], '까르띠에': ['까르띠에', 'cartier'],
      '고야드': ['고야드', 'goyard'],
      '캐나다구스': ['캐나다구스', 'canada goose', 'canadagoose'],
      '무스너클': ['무스너클', 'moose knuckles', 'mooseknuckles'],
      '파라점퍼스': ['파라점퍼스', 'parajumpers'], '듀베티카': ['듀베티카', 'duvetica'],
      '헤르노': ['헤르노', 'herno'], '타티아스': ['타티아스', 'tatras'],
      '어그': ['어그', 'ugg'], '마린세르': ['마린세르', 'marine serre', 'marineserre'],
      '살로몬': ['살로몬', 'salomon'], '뉴발란스': ['뉴발란스', 'new balance', 'newbalance'],
      '나이키': ['나이키', 'nike'], '아디다스': ['아디다스', 'adidas'],
      '돌체앤가바나': ['돌체앤가바나', '돌체 앤 가바나', 'dolce & gabbana', 'dolce gabbana', 'd&g'],
      '겐조': ['겐조', 'kenzo'], '랑방': ['랑방', 'lanvin'],
      '로저비비에': ['로저비비에', 'roger vivier', 'rogervivier'],
      '멀버리': ['멀버리', 'mulberry'], '코치': ['코치', 'coach'],
      '마이클코어스': ['마이클코어스', '마이클 코어스', 'michael kors', 'michaelkors'],
      '몽블랑': ['몽블랑', 'montblanc', 'mont blanc'], '발리': ['발리', 'bally'],
      '토즈': ['토즈', "tod's", 'tods'],
      '브루넬로 쿠치넬리': ['브루넬로', '쿠치넬리', 'brunello cucinelli', 'brunellocucinelli'],
      '로로피아나': ['로로피아나', 'loro piana', 'loropiana'],
      '에트로': ['에트로', 'etro'],
      '아르마니': ['아르마니', 'armani', 'giorgio armani', 'emporio armani'],
      '휴고보스': ['휴고보스', 'hugo boss', 'hugoboss', 'boss'],
      '폴스미스': ['폴스미스', 'paul smith', 'paulsmith'],
      '르메르': ['르메르', 'lemaire'], '질샌더': ['질샌더', 'jil sander', 'jilsander'],
      '입생로랑': ['입생로랑', 'saint laurent', 'ysl'],
      // 시계 브랜드
      '롤렉스': ['롤렉스', 'rolex'],
      '오메가': ['오메가', 'omega'],
      'IWC': ['IWC', 'iwc'],
      '파텍필립': ['파텍필립', '파텍 필립', 'patek philippe', 'patekphilippe'],
      '태그호이어': ['태그호이어', '태그 호이어', 'tag heuer', 'tagheuer'],
      '브라이틀링': ['브라이틀링', 'breitling'],
      '위블로': ['위블로', 'hublot'],
      '롱진': ['롱진', 'longines'],
      '오데마 피게': ['오데마피게', '오데마 피게', 'audemars piguet', 'ap시계', 'audemarspiguet'],
      '튜더': ['튜더', 'tudor'],
      '예거 르쿨트르': ['예거르쿨트르', '예거 르쿨트르', 'jaeger lecoultre', 'jaeger-lecoultre'],
      '바쉐론 콘스탄틴': ['바쉐론콘스탄틴', '바쉐론 콘스탄틴', 'vacheron constantin', 'vacheron'],
      '브레게': ['브레게', 'breguet'],
      '블랑팡': ['블랑팡', 'blancpain'],
      '피아제': ['피아제', 'piaget'],
      '쇼파드': ['쇼파드', 'chopard'],
      '제니스': ['제니스', 'zenith'],
      '파네라이': ['파네라이', 'panerai'],
      '랑에 운트 죄네': ['랑에운트죄네', '랑에 운트 죄네', 'a. lange', 'lange sohne'],
      '글라슈테 오리지날': ['글라슈테오리지날', '글라슈테 오리지날', 'glashutte', 'glashütte'],
      '프랭크뮬러': ['프랭크뮬러', '프랭크 뮬러', 'franck muller', 'franckmuller'],
      '리차드밀': ['리차드밀', '리차드 밀', 'richard mille', 'richardmille'],
      '세이코': ['세이코', 'seiko'],
      '그랑세이코': ['그랑세이코', '그랑 세이코', 'grand seiko', 'grandseiko'],
    };

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
          } else {
            console.error(`[maintenance] Failed to create brand ${brandName}:`, e.message);
          }
        }
      }
    }
    log(`Created ${brandsCreated} new brands (${brandNameToId.size} total)`, 'maintenance');

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

    const decodeEntities = (text: string): string => {
      return text
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)));
    };

    let htmlFixed = 0, classified = 0;
    const batchSize = 50;

    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize);
      await Promise.all(batch.map(async (product) => {
        const updateData: Record<string, any> = {};
        const decoded = decodeEntities(product.name);
        if (decoded !== product.name) { updateData.name = decoded; htmlFixed++; }
        if (!product.brandId) {
          const brandId = matchBrand(decoded || product.name);
          if (brandId) { updateData.brandId = brandId; classified++; }
        }
        if (Object.keys(updateData).length > 0) {
          await storage.updateProduct(product.id, updateData);
        }
      }));
      if (i % 500 === 0 && i > 0) {
        log(`Processed ${i}/${allProducts.length} products...`, 'maintenance');
      }
    }

    log(`Maintenance done: ${brandsCreated} brands created, ${htmlFixed} names fixed, ${classified} brands classified out of ${allProducts.length} products`, 'maintenance');
  } catch (error) {
    console.error('[maintenance] Error:', error);
  }
}

// 성별 값 정규화: men → 남성, women → 여성
async function runGenderNormalization() {
  try {
    const { db } = await import('./db.js');
    const { products } = await import('../shared/schema.js');
    const { sql } = await import('drizzle-orm');

    const menResult = await db.execute(
      sql`UPDATE products SET gender = '남성' WHERE gender = 'men' OR gender = 'Men' OR gender = 'MEN'`
    );
    const womenResult = await db.execute(
      sql`UPDATE products SET gender = '여성' WHERE gender = 'women' OR gender = 'Women' OR gender = 'WOMEN'`
    );

    const menCount = (menResult as any).rowCount ?? 0;
    const womenCount = (womenResult as any).rowCount ?? 0;

    if (menCount > 0 || womenCount > 0) {
      log(`성별 정규화: men→남성 ${menCount}개, women→여성 ${womenCount}개 변환`, 'migration');
    } else {
      log('성별 정규화: 이미 모두 한국어로 설정됨', 'migration');
    }
  } catch (err: any) {
    console.error('[migration] 성별 정규화 오류:', err.message);
  }
}
