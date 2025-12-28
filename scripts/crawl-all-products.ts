import { db } from "../server/db";
import { products } from "../shared/schema";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main categories from cdamdong.co.kr
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

async function fetchCategoryProducts(categoryId: string, page: number = 1): Promise<ProductData[]> {
  const foundProducts: ProductData[] = [];
  const url = `https://cdamdong.co.kr/shop/list.php?ca_id=${categoryId}&sort=it_order&sortodr=asc&page=${page}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://cdamdong.co.kr/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    
    if (!response.ok) {
      console.log(`  Failed to fetch category ${categoryId} page ${page}: ${response.status}`);
      return foundProducts;
    }
    
    const html = await response.text();
    const category = CATEGORIES.find(c => c.id === categoryId);
    
    // Extract product blocks using regex
    // Pattern: it_id=XXX followed by img src and alt, then brand and price
    const productBlockRegex = /it_id=(\d+)[^>]*>[\s\S]*?<img\s+src="([^"]+)"[^>]*alt="([^"]+)"[\s\S]*?<div class="list-brand[^"]*">([^<]*)<\/div>[\s\S]*?<div class="sct_cost">([0-9,]+)원/g;
    
    let match;
    const seenIds = new Set<string>();
    
    while ((match = productBlockRegex.exec(html)) !== null) {
      const [, sourceId, imageUrl, name, brand, priceStr] = match;
      
      // Skip duplicates within the same page
      if (seenIds.has(sourceId)) continue;
      seenIds.add(sourceId);
      
      const price = parseInt(priceStr.replace(/,/g, ''), 10) || 0;
      const isBest = html.includes(`it_id=${sourceId}`) && html.includes('BEST ITEM');
      
      foundProducts.push({
        sourceId,
        name: name.trim(),
        price,
        imageUrl: imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
        categoryId: category?.localId || "other",
        brand: brand.trim(),
        isBest,
      });
    }
    
    // If regex didn't match, try alternative parsing
    if (foundProducts.length === 0) {
      // Extract all unique product IDs
      const productIds = [...new Set(html.match(/it_id=(\d+)/g)?.map(m => m.replace('it_id=', '')) || [])];
      
      for (const sourceId of productIds) {
        // Find image for this product
        const imgMatch = html.match(new RegExp(`it_id=${sourceId}[\\s\\S]*?<img\\s+src="([^"]+)"[^>]*alt="([^"]+)"`, 'i'));
        
        if (imgMatch) {
          const imageUrl = imgMatch[1].startsWith('//') ? 'https:' + imgMatch[1] : imgMatch[1];
          const name = imgMatch[2].trim();
          
          // Find price - look for sct_cost after this product
          const priceMatch = html.match(new RegExp(`it_id=${sourceId}[\\s\\S]*?<div class="sct_cost">([0-9,]+)원`, 'i'));
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
          
          // Find brand
          const brandMatch = html.match(new RegExp(`it_id=${sourceId}[\\s\\S]*?<div class="list-brand[^"]*">([^<]+)</div>`, 'i'));
          const brand = brandMatch ? brandMatch[1].trim() : '';
          
          if (!seenIds.has(sourceId)) {
            seenIds.add(sourceId);
            foundProducts.push({
              sourceId,
              name,
              price,
              imageUrl,
              categoryId: category?.localId || "other",
              brand,
              isBest: false,
            });
          }
        }
      }
    }
    
    return foundProducts;
  } catch (error) {
    console.error(`  Error fetching category ${categoryId}:`, error);
    return foundProducts;
  }
}

async function fetchAllPagesForCategory(categoryId: string, categoryName: string): Promise<ProductData[]> {
  const allProducts: ProductData[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  let consecutiveEmpty = 0;
  
  while (consecutiveEmpty < 2) {
    console.log(`  Fetching ${categoryName} page ${page}...`);
    const pageProducts = await fetchCategoryProducts(categoryId, page);
    
    // Filter out products we've already seen
    const newProducts = pageProducts.filter(p => !seenIds.has(p.sourceId));
    
    if (newProducts.length === 0) {
      consecutiveEmpty++;
    } else {
      consecutiveEmpty = 0;
      for (const p of newProducts) {
        seenIds.add(p.sourceId);
        allProducts.push(p);
      }
    }
    
    page++;
    await delay(300);
    
    // Safety limit
    if (page > 100) {
      console.log(`  Reached page limit for ${categoryName}`);
      break;
    }
  }
  
  return allProducts;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Starting comprehensive product crawl from cdamdong.co.kr");
  console.log("=".repeat(60));
  
  const allProducts = new Map<string, ProductData>();
  
  for (const category of CATEGORIES) {
    console.log(`\nProcessing category: ${category.name} (${category.id})`);
    const categoryProducts = await fetchAllPagesForCategory(category.id, category.name);
    
    for (const product of categoryProducts) {
      if (!allProducts.has(product.sourceId)) {
        allProducts.set(product.sourceId, product);
      }
    }
    
    console.log(`  Found ${categoryProducts.length} new, total unique: ${allProducts.size}`);
    await delay(500);
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Total unique products found: ${allProducts.size}`);
  console.log(`${"=".repeat(60)}`);
  
  if (allProducts.size === 0) {
    console.log("No products found. Exiting without changes.");
    process.exit(1);
  }
  
  // Clear existing products
  console.log("\nClearing existing products...");
  await db.delete(products);
  
  // Insert new products
  console.log("Inserting products into database...");
  let insertedCount = 0;
  const productArray = Array.from(allProducts.values());
  
  // Batch insert for efficiency
  const batchSize = 20;
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
          isBest: p.isBest || (i + idx) % 7 === 0,
          isNew: (i + idx) % 5 === 0,
          isActive: true,
        }))
      );
      
      insertedCount += batch.length;
      console.log(`  Inserted ${insertedCount}/${productArray.length} products...`);
    } catch (error) {
      console.error(`  Failed to insert batch:`, error);
      // Try inserting one by one
      for (const p of batch) {
        try {
          await db.insert(products).values({
            name: p.name,
            categoryId: p.categoryId,
            price: p.price,
            description: p.brand ? `${p.brand} ${p.name}` : p.name,
            detailContent: "상세 이미지를 확인해 주세요. 프리미엄 품질의 명품 레플리카 제품입니다.",
            imageUrl: p.imageUrl,
            imageUrls: [p.imageUrl.replace(/thumb-/, '').replace(/_300x300/, '')],
            isBest: p.isBest,
            isNew: false,
            isActive: true,
          });
          insertedCount++;
        } catch (e) {
          console.error(`    Failed to insert ${p.name}:`, e);
        }
      }
    }
    
    await delay(50);
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Successfully inserted ${insertedCount} products!`);
  console.log(`${"=".repeat(60)}`);
  
  process.exit(0);
}

main().catch(console.error);
