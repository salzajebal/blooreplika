import { db } from "../server/db";
import { products } from "../shared/schema";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CATEGORIES = [
  { id: "10", name: "아우터", localId: "outer" },
  { id: "20", name: "패딩", localId: "padding" },
  { id: "30", name: "상의", localId: "tops" },
  { id: "40", name: "하의", localId: "bottoms" },
  { id: "70", name: "신발", localId: "shoes" },
  { id: "80", name: "악세사리", localId: "accessories" },
  { id: "a0", name: "지갑", localId: "wallets" },
  { id: "c0", name: "가방", localId: "bags" },
  { id: "f0", name: "시계", localId: "watches" },
  { id: "g0", name: "정품", localId: "genuine" },
];

interface ProductData {
  sourceId: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  brand: string;
  isBest: boolean;
}

async function fetchPage(categoryId: string, page: number): Promise<{ products: ProductData[], hasMore: boolean }> {
  const foundProducts: ProductData[] = [];
  const url = `https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&page=${page}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://cdamdong.co.kr/",
      },
    });
    
    if (!response.ok) return { products: [], hasMore: false };
    
    const html = await response.text();
    const category = CATEGORIES.find(c => c.id === categoryId);
    
    // Find all product IDs
    const productIds = [...new Set((html.match(/it_id=(\d+)/g) || []).map(m => m.replace('it_id=', '')))];
    
    for (const sourceId of productIds) {
      // Find image and name from img tag with alt
      const imgRegex = new RegExp(`/data/item/${sourceId}/[^"]+\\.(?:jpg|jpeg|png|webp)["'][^>]*alt=["']([^"']+)["']`, 'i');
      const imgMatch = html.match(imgRegex);
      
      if (!imgMatch) {
        // Try alternative pattern
        const altImgRegex = new RegExp(`alt=["']([^"']+)["'][^>]*src=["']([^"]*${sourceId}[^"]+)["']`, 'i');
        const altMatch = html.match(altImgRegex);
        if (!altMatch) continue;
      }
      
      // Get image URL
      const imageUrlMatch = html.match(new RegExp(`https://cdamdong\\.co\\.kr/data/item/${sourceId}/[^"']+\\.(jpg|jpeg|png|webp)`, 'i'));
      if (!imageUrlMatch) continue;
      
      let imageUrl = imageUrlMatch[0];
      const name = imgMatch ? imgMatch[1].trim() : '';
      if (!name) continue;
      
      // Get price - look for pattern near this product
      const priceSection = html.substring(html.indexOf(`it_id=${sourceId}`), html.indexOf(`it_id=${sourceId}`) + 2000);
      const priceMatch = priceSection.match(/(\d{1,3}(?:,\d{3})+)원/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
      
      // Get brand
      const brandMatch = priceSection.match(/<div class="list-brand[^"]*">([^<]+)<\/div>/i);
      const brand = brandMatch ? brandMatch[1].trim() : '';
      
      // Check if BEST
      const isBest = priceSection.includes('BEST') || priceSection.includes('best_icon');
      
      foundProducts.push({
        sourceId,
        name,
        price,
        imageUrl,
        categoryId: category?.localId || "other",
        brand,
        isBest,
      });
    }
    
    // Check if there's a next page
    const hasMore = html.includes(`page=${page + 1}`);
    
    return { products: foundProducts, hasMore };
  } catch (error) {
    console.error(`  Error page ${page}:`, error);
    return { products: [], hasMore: false };
  }
}

async function fetchAllCategoryProducts(categoryId: string, categoryName: string): Promise<ProductData[]> {
  const allProducts = new Map<string, ProductData>();
  let page = 1;
  let emptyPages = 0;
  
  console.log(`  Starting ${categoryName}...`);
  
  while (emptyPages < 3) {
    const { products: pageProducts, hasMore } = await fetchPage(categoryId, page);
    
    let newCount = 0;
    for (const p of pageProducts) {
      if (!allProducts.has(p.sourceId)) {
        allProducts.set(p.sourceId, p);
        newCount++;
      }
    }
    
    if (newCount === 0) {
      emptyPages++;
    } else {
      emptyPages = 0;
    }
    
    if (page % 10 === 0 || !hasMore) {
      console.log(`    Page ${page}: +${newCount} (total: ${allProducts.size})`);
    }
    
    if (!hasMore && pageProducts.length === 0) break;
    
    page++;
    await delay(150); // Fast but polite
    
    if (page > 200) break; // Safety limit
  }
  
  console.log(`  Completed ${categoryName}: ${allProducts.size} products`);
  return Array.from(allProducts.values());
}

async function main() {
  console.log("=".repeat(60));
  console.log("FULL PRODUCT CRAWL - cdamdong.co.kr");
  console.log("=".repeat(60));
  
  const allProducts = new Map<string, ProductData>();
  
  for (const category of CATEGORIES) {
    console.log(`\n[${category.name}]`);
    const categoryProducts = await fetchAllCategoryProducts(category.id, category.name);
    
    for (const product of categoryProducts) {
      if (!allProducts.has(product.sourceId)) {
        allProducts.set(product.sourceId, product);
      }
    }
    
    console.log(`  Category total: ${categoryProducts.length}, Global unique: ${allProducts.size}`);
    await delay(300);
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TOTAL UNIQUE PRODUCTS: ${allProducts.size}`);
  console.log(`${"=".repeat(60)}`);
  
  if (allProducts.size === 0) {
    console.log("No products found!");
    process.exit(1);
  }
  
  console.log("\nClearing database...");
  await db.delete(products);
  
  console.log("Inserting products...");
  const productArray = Array.from(allProducts.values());
  let inserted = 0;
  
  const batchSize = 50;
  for (let i = 0; i < productArray.length; i += batchSize) {
    const batch = productArray.slice(i, i + batchSize);
    
    try {
      await db.insert(products).values(
        batch.map((p, idx) => ({
          name: p.name,
          categoryId: p.categoryId,
          price: p.price,
          description: p.brand ? `${p.brand} ${p.name}` : p.name,
          detailContent: "상세 이미지를 확인해 주세요. 프리미엄 품질의 명품 레플리카 제품입니다.",
          imageUrl: p.imageUrl,
          imageUrls: [p.imageUrl.replace(/thumb-/, '').replace(/_300x300/, '')],
          isBest: p.isBest || (i + idx) % 8 === 0,
          isNew: (i + idx) % 6 === 0,
          isActive: true,
        }))
      );
      inserted += batch.length;
      
      if (inserted % 200 === 0) {
        console.log(`  Inserted: ${inserted}/${productArray.length}`);
      }
    } catch (error) {
      console.error(`  Batch error, trying individually...`);
      for (const p of batch) {
        try {
          await db.insert(products).values({
            name: p.name,
            categoryId: p.categoryId,
            price: p.price,
            description: p.brand ? `${p.brand} ${p.name}` : p.name,
            detailContent: "상세 이미지를 확인해 주세요.",
            imageUrl: p.imageUrl,
            imageUrls: [p.imageUrl.replace(/thumb-/, '').replace(/_300x300/, '')],
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
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE! Inserted ${inserted} products`);
  console.log(`${"=".repeat(60)}`);
  
  process.exit(0);
}

main().catch(console.error);
