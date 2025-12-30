import { db } from "../server/db";
import { products } from "../shared/schema";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CATEGORIES = [
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

interface ProductData {
  sourceId: string;
  name: string;
  price: number;
  imageUrl: string;
  imageUrls: string[];
  detailImageUrls: string[];
  categoryId: string;
  brand: string;
  isBest: boolean;
}

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://cdamdong.co.kr/",
};

async function fetchProductDetail(sourceId: string, categoryId: string): Promise<ProductData | null> {
  const url = `https://cdamdong.co.kr/shop/item.php?it_id=${sourceId}`;
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const name = $('h1.sit_tit').text().trim() || 
                 $('.sit_tit').text().trim() || 
                 $('title').text().split('|')[0].trim() ||
                 `상품 ${sourceId}`;
    
    let price = 0;
    const priceText = html.match(/(\d{1,3}(?:,\d{3})+)원/);
    if (priceText) {
      price = parseInt(priceText[1].replace(/,/g, ''), 10);
    }
    
    const mainImages: string[] = [];
    $('#sit_pvi img, .sit_pvi img, .item_photo_view img').each((_, el) => {
      let src = $(el).attr('src') || '';
      if (src && src.includes('/data/item/')) {
        if (!src.startsWith('http')) src = 'https://cdamdong.co.kr' + src;
        src = src.replace(/thumb-/, '').replace(/_300x300|_500x500/g, '');
        if (!mainImages.includes(src)) mainImages.push(src);
      }
    });
    
    if (mainImages.length === 0) {
      const imgMatch = html.match(new RegExp(`https://cdamdong\\.co\\.kr/data/item/${sourceId}/[^"']+\\.(jpg|jpeg|png|webp)`, 'gi'));
      if (imgMatch) {
        imgMatch.forEach(img => {
          const cleanImg = img.replace(/thumb-/, '').replace(/_300x300|_500x500/g, '');
          if (!mainImages.includes(cleanImg)) mainImages.push(cleanImg);
        });
      }
    }
    
    const detailImages: string[] = [];
    $('#sit_inf_explan img, #sit_int_top_explan img, .sit_desc img').each((_, el) => {
      let src = $(el).attr('src') || '';
      if (src) {
        if (!src.startsWith('http')) src = 'https://cdamdong.co.kr' + src;
        if (!detailImages.includes(src)) detailImages.push(src);
      }
    });
    
    const brand = $('.list-brand').first().text().trim() || '';
    const isBest = html.includes('BEST') || html.includes('best_icon');
    const category = CATEGORIES.find(c => c.id === categoryId);
    
    return {
      sourceId,
      name,
      price,
      imageUrl: mainImages[0] || `https://cdamdong.co.kr/data/item/${sourceId}/`,
      imageUrls: mainImages,
      detailImageUrls: detailImages,
      categoryId: category?.localId || "other",
      brand,
      isBest,
    };
  } catch {
    return null;
  }
}

async function fetchProductList(categoryId: string, page: number): Promise<string[]> {
  const url = `https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&page=${page}`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return [];
    const html = await response.text();
    return [...new Set((html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', '')))];
  } catch {
    return [];
  }
}

async function processInParallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number = 10
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    await delay(50);
  }
  return results;
}

async function main() {
  console.log("=".repeat(60));
  console.log("FAST PARALLEL PRODUCT CRAWL");
  console.log("=".repeat(60));
  
  const startTime = Date.now();
  const allProducts = new Map<string, ProductData>();
  
  for (const category of CATEGORIES) {
    console.log(`\n[${category.name}]`);
    
    const allIds = new Set<string>();
    let page = 1;
    let empty = 0;
    
    while (empty < 3 && page <= 200) {
      const ids = await fetchProductList(category.id, page);
      let newCount = 0;
      ids.forEach(id => { if (!allIds.has(id)) { allIds.add(id); newCount++; } });
      if (newCount === 0) empty++; else empty = 0;
      if (page % 30 === 0) console.log(`  Page ${page}: ${allIds.size} IDs`);
      page++;
      await delay(30);
    }
    
    console.log(`  Found ${allIds.size} IDs. Fetching details in parallel...`);
    
    const idsArray = Array.from(allIds);
    const results = await processInParallel(
      idsArray,
      (id) => fetchProductDetail(id, category.id),
      15
    );
    
    let valid = 0;
    for (const p of results) {
      if (p && !allProducts.has(p.sourceId)) {
        allProducts.set(p.sourceId, p);
        valid++;
      }
    }
    
    console.log(`  [${category.name}] Complete: ${valid} products, Total: ${allProducts.size}`);
  }
  
  const minutes = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`CRAWL DONE in ${minutes} min. Total: ${allProducts.size}`);
  console.log(`${"=".repeat(60)}`);
  
  console.log("\nClearing and inserting...");
  await db.delete(products);
  
  const arr = Array.from(allProducts.values());
  let inserted = 0;
  
  for (let i = 0; i < arr.length; i += 50) {
    const batch = arr.slice(i, i + 50);
    try {
      await db.insert(products).values(
        batch.map((p, idx) => ({
          name: p.name,
          categoryId: p.categoryId,
          price: p.price,
          description: p.brand ? `${p.brand} ${p.name}` : p.name,
          detailContent: "프리미엄 명품 레플리카 제품입니다.",
          imageUrl: p.imageUrl,
          imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
          detailImageUrls: p.detailImageUrls,
          isBest: p.isBest || (i + idx) % 10 === 0,
          isNew: (i + idx) % 8 === 0,
          isActive: true,
        }))
      );
      inserted += batch.length;
      if (inserted % 200 === 0) console.log(`  Inserted: ${inserted}`);
    } catch {
      for (const p of batch) {
        try {
          await db.insert(products).values({
            name: p.name,
            categoryId: p.categoryId,
            price: p.price,
            description: p.brand ? `${p.brand} ${p.name}` : p.name,
            detailContent: "상세 이미지를 확인해 주세요.",
            imageUrl: p.imageUrl,
            imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
            detailImageUrls: p.detailImageUrls,
            isBest: p.isBest,
            isNew: false,
            isActive: true,
          });
          inserted++;
        } catch {}
      }
    }
  }
  
  console.log(`\nDONE! Inserted ${inserted} products`);
  process.exit(0);
}

main().catch(console.error);
