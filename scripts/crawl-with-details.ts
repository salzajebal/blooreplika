import { db } from "../server/db";
import { products } from "../shared/schema";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function detectGender(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('남녀공용') || lower.includes('남녀') || lower.includes('유니섹스') || lower.includes('unisex')) return '공용';
  if (lower.includes('남성') || lower.includes('남자') || lower.includes('men') || lower.includes('mens')) return '남성';
  if (lower.includes('여성') || lower.includes('여자') || lower.includes('women') || lower.includes('womens') || lower.includes('ladies')) return '여성';
  return null;
}

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
  description: string;
}

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Referer": "https://cdamdong.co.kr/",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

async function fetchProductList(categoryId: string, page: number): Promise<string[]> {
  const url = `https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&page=${page}`;
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return [];
    
    const html = await response.text();
    const productIds = [...new Set((html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', '')))];
    return productIds;
  } catch (error) {
    console.error(`  Error fetching list page ${page}:`, error);
    return [];
  }
}

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
    const priceText = $('.sit_tot_price em').text().trim() || 
                      $('.sit_price strong').text().trim() ||
                      $('.price strong').text().trim();
    if (priceText) {
      const priceMatch = priceText.match(/[\d,]+/);
      if (priceMatch) {
        price = parseInt(priceMatch[0].replace(/,/g, ''), 10);
      }
    }
    
    if (price === 0) {
      const priceMatch = html.match(/(\d{1,3}(?:,\d{3})+)원/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }
    }
    
    const mainImages: string[] = [];
    $('#sit_pvi img, .sit_pvi img, .item_photo_view img, .swiper-slide img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && src.includes('/data/item/')) {
        if (!src.startsWith('http')) {
          src = 'https://cdamdong.co.kr' + src;
        }
        src = src.replace(/thumb-/, '').replace(/_300x300/, '').replace(/_500x500/, '');
        if (!mainImages.includes(src)) {
          mainImages.push(src);
        }
      }
    });
    
    $('a[href*="/data/item/"], .sit_pvi a, .photo_view a').each((_, el) => {
      let href = $(el).attr('href') || '';
      if (href && href.includes('/data/item/') && href.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        if (!href.startsWith('http')) {
          href = 'https://cdamdong.co.kr' + href;
        }
        if (!mainImages.includes(href)) {
          mainImages.push(href);
        }
      }
    });
    
    if (mainImages.length === 0) {
      const imgMatch = html.match(new RegExp(`https://cdamdong\\.co\\.kr/data/item/${sourceId}/[^"']+\\.(jpg|jpeg|png|webp)`, 'gi'));
      if (imgMatch) {
        imgMatch.forEach(img => {
          const cleanImg = img.replace(/thumb-/, '').replace(/_300x300/, '').replace(/_500x500/, '');
          if (!mainImages.includes(cleanImg)) {
            mainImages.push(cleanImg);
          }
        });
      }
    }
    
    const detailImages: string[] = [];
    $('#sit_inf_explan img, #sit_int_top_explan img, .sit_inf_explan img, .sit_desc img, .detail_desc img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src) {
        if (!src.startsWith('http')) {
          src = 'https://cdamdong.co.kr' + src;
        }
        if (!detailImages.includes(src)) {
          detailImages.push(src);
        }
      }
    });
    
    const detailContent = $('#sit_inf_explan').html() || $('#sit_int_top_explan').html() || '';
    const detailImgMatches = detailContent.match(/src=["']([^"']+)["']/gi) || [];
    detailImgMatches.forEach(match => {
      let src = match.replace(/src=["']/, '').replace(/["']$/, '');
      if (src) {
        if (!src.startsWith('http')) {
          src = 'https://cdamdong.co.kr' + src;
        }
        if (!detailImages.includes(src)) {
          detailImages.push(src);
        }
      }
    });
    
    const brand = $('.list-brand').first().text().trim() ||
                  $('span:contains("브랜드")').next().text().trim() ||
                  '';
    
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
      description: brand ? `${brand} ${name}` : name,
    };
  } catch (error) {
    console.error(`  Error fetching product ${sourceId}:`, error);
    return null;
  }
}

async function crawlCategory(category: typeof CATEGORIES[0]): Promise<ProductData[]> {
  console.log(`\n[${category.name}] Starting...`);
  
  const allProductIds = new Set<string>();
  let page = 1;
  let emptyPages = 0;
  
  while (emptyPages < 3 && page <= 200) {
    const productIds = await fetchProductList(category.id, page);
    
    let newCount = 0;
    for (const id of productIds) {
      if (!allProductIds.has(id)) {
        allProductIds.add(id);
        newCount++;
      }
    }
    
    if (newCount === 0) {
      emptyPages++;
    } else {
      emptyPages = 0;
    }
    
    if (page % 20 === 0 || productIds.length === 0) {
      console.log(`  Page ${page}: found ${allProductIds.size} products total`);
    }
    
    page++;
    await delay(100);
  }
  
  console.log(`  [${category.name}] Found ${allProductIds.size} product IDs. Fetching details...`);
  
  const productDataList: ProductData[] = [];
  const productIdsArray = Array.from(allProductIds);
  
  for (let i = 0; i < productIdsArray.length; i++) {
    const sourceId = productIdsArray[i];
    const data = await fetchProductDetail(sourceId, category.id);
    
    if (data) {
      productDataList.push(data);
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`  [${category.name}] Details: ${i + 1}/${productIdsArray.length} (${productDataList.length} valid)`);
    }
    
    await delay(80);
  }
  
  console.log(`  [${category.name}] Complete: ${productDataList.length} products with details`);
  return productDataList;
}

async function main() {
  console.log("=".repeat(70));
  console.log("COMPREHENSIVE PRODUCT CRAWL with DETAIL IMAGES");
  console.log("Source: cdamdong.co.kr");
  console.log("=".repeat(70));
  
  const startTime = Date.now();
  const allProducts = new Map<string, ProductData>();
  
  for (const category of CATEGORIES) {
    const categoryProducts = await crawlCategory(category);
    
    for (const product of categoryProducts) {
      if (!allProducts.has(product.sourceId)) {
        allProducts.set(product.sourceId, product);
      }
    }
    
    console.log(`  Global unique: ${allProducts.size}`);
    await delay(500);
  }
  
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`CRAWL COMPLETE in ${duration} minutes`);
  console.log(`TOTAL UNIQUE PRODUCTS: ${allProducts.size}`);
  console.log(`${"=".repeat(70)}`);
  
  if (allProducts.size === 0) {
    console.log("No products found!");
    process.exit(1);
  }
  
  console.log("\nClearing database...");
  await db.delete(products);
  
  console.log("Inserting products with full details...");
  const productArray = Array.from(allProducts.values());
  let inserted = 0;
  
  const batchSize = 30;
  for (let i = 0; i < productArray.length; i += batchSize) {
    const batch = productArray.slice(i, i + batchSize);
    
    try {
      await db.insert(products).values(
        batch.map((p, idx) => ({
          name: p.name,
          categoryId: p.categoryId,
          price: p.price,
          description: p.description,
          detailContent: `<p>프리미엄 품질의 명품 레플리카 제품입니다.</p>`,
          imageUrl: p.imageUrl,
          imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
          detailImageUrls: p.detailImageUrls,
          gender: detectGender(p.name),
          isBest: p.isBest || (i + idx) % 10 === 0,
          isNew: (i + idx) % 8 === 0,
          isActive: true,
        }))
      );
      inserted += batch.length;
      
      if (inserted % 100 === 0) {
        console.log(`  Inserted: ${inserted}/${productArray.length}`);
      }
    } catch (error) {
      console.error(`  Batch error at ${i}, trying individually...`);
      for (const p of batch) {
        try {
          await db.insert(products).values({
            name: p.name,
            categoryId: p.categoryId,
            price: p.price,
            description: p.description,
            detailContent: "상세 이미지를 확인해 주세요.",
            imageUrl: p.imageUrl,
            imageUrls: p.imageUrls.length > 0 ? p.imageUrls : [p.imageUrl],
            detailImageUrls: p.detailImageUrls,
            gender: detectGender(p.name),
            isBest: p.isBest,
            isNew: false,
            isActive: true,
          });
          inserted++;
        } catch (e) {
          console.error(`    Failed: ${p.name}`);
        }
      }
    }
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`DONE! Inserted ${inserted} products in ${totalDuration} minutes`);
  console.log(`${"=".repeat(70)}`);
  
  process.exit(0);
}

main().catch(console.error);
