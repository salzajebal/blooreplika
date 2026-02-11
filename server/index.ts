import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { setupChatWebSocket } from "./chatSocket";
import { storage } from "./storage";

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
      runStartupMaintenance();
    },
  );
})();

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
