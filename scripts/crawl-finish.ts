import { db } from "../server/db";
import { products } from "../shared/schema";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const JOBS = [
  { id: "a0", name: "지갑", localId: "wallets", startChunk: 52 },
  { id: "c0", name: "가방", localId: "bags", startChunk: 0 },
  { id: "f0", name: "시계", localId: "watches", startChunk: 0 },
  { id: "g0", name: "정품", localId: "genuine", startChunk: 0 },
];

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Referer": "https://cdamdong.co.kr/",
};

async function fetchProductDetail(sourceId: string, category: typeof JOBS[0]) {
  const url = `https://cdamdong.co.kr/shop/item.php?it_id=${sourceId}`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const name = $('h1.sit_tit').text().trim() || $('.sit_tit').text().trim() || `상품 ${sourceId}`;
    let price = 0;
    const priceText = html.match(/(\d{1,3}(?:,\d{3})+)원/);
    if (priceText) price = parseInt(priceText[1].replace(/,/g, ''), 10);
    
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
      if (imgMatch) imgMatch.forEach(img => {
        const clean = img.replace(/thumb-/, '').replace(/_300x300|_500x500/g, '');
        if (!mainImages.includes(clean)) mainImages.push(clean);
      });
    }
    
    const detailImages: string[] = [];
    $('#sit_inf_explan img, #sit_int_top_explan img').each((_, el) => {
      let src = $(el).attr('src') || '';
      if (src) {
        if (!src.startsWith('http')) src = 'https://cdamdong.co.kr' + src;
        if (!detailImages.includes(src)) detailImages.push(src);
      }
    });
    
    const brand = $('.list-brand').first().text().trim() || '';
    const isBest = html.includes('BEST');
    
    return {
      sourceId, name, price,
      imageUrl: mainImages[0] || `https://cdamdong.co.kr/data/item/${sourceId}/`,
      imageUrls: mainImages,
      detailImageUrls: detailImages,
      categoryId: category.localId,
      brand, isBest,
    };
  } catch { return null; }
}

async function fetchProductList(categoryId: string, page: number): Promise<string[]> {
  try {
    const response = await fetch(`https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&page=${page}`, { headers });
    if (!response.ok) return [];
    const html = await response.text();
    return [...new Set((html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', '')))];
  } catch { return []; }
}

async function processWithConcurrency<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    results.push(...await Promise.all(batch.map(fn)));
    await delay(5);
  }
  return results;
}

async function saveProducts(productList: any[]) {
  if (productList.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < productList.length; i += 50) {
    const batch = productList.slice(i, i + 50);
    try {
      await db.insert(products).values(
        batch.map((p, idx) => ({
          name: p.name, categoryId: p.categoryId, price: p.price,
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
    } catch {
      for (const p of batch) {
        try {
          await db.insert(products).values({
            name: p.name, categoryId: p.categoryId, price: p.price,
            description: p.brand ? `${p.brand} ${p.name}` : p.name,
            detailContent: "상세 이미지를 확인해 주세요.",
            imageUrl: p.imageUrl,
            imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
            detailImageUrls: p.detailImageUrls,
            isBest: p.isBest, isNew: false, isActive: true,
          });
          inserted++;
        } catch {}
      }
    }
  }
  return inserted;
}

async function main() {
  console.log("FINISHING CRAWL...");
  let totalInserted = 0;
  
  for (const category of JOBS) {
    console.log(`\n[${category.name}]`);
    const allIds = new Set<string>();
    let page = 1, empty = 0;
    while (empty < 3 && page <= 200) {
      const ids = await fetchProductList(category.id, page);
      let newCount = 0;
      ids.forEach(id => { if (!allIds.has(id)) { allIds.add(id); newCount++; } });
      if (newCount === 0) empty++; else empty = 0;
      if (page % 30 === 0) console.log(`  Page ${page}: ${allIds.size} IDs`);
      page++;
      await delay(5);
    }
    
    console.log(`  Found ${allIds.size} IDs. Starting from chunk ${category.startChunk}...`);
    const idsArray = Array.from(allIds);
    const CHUNK_SIZE = 100;
    
    for (let i = category.startChunk * CHUNK_SIZE; i < idsArray.length; i += CHUNK_SIZE) {
      const chunk = idsArray.slice(i, i + CHUNK_SIZE);
      const results = await processWithConcurrency(chunk, (id) => fetchProductDetail(id, category), 45);
      const valid = results.filter(r => r !== null);
      const inserted = await saveProducts(valid);
      totalInserted += inserted;
      console.log(`  Chunk ${Math.floor(i/CHUNK_SIZE) + 1}: +${inserted} (Session: ${totalInserted})`);
    }
    console.log(`  [${category.name}] Complete.`);
  }
  
  console.log(`\nDONE! Added ${totalInserted} products`);
  process.exit(0);
}

main().catch(console.error);
