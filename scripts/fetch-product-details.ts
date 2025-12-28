import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchProductDetail(sourceUrl: string, currentImageUrl: string): Promise<{ detailContent: string; imageUrls: string[] }> {
  try {
    const url = `https://cdamdong.co.kr/shop/item.php?it_id=${sourceUrl}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://cdamdong.co.kr/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return { detailContent: "", imageUrls: [] };
    }

    const html = await response.text();
    
    const productImages: string[] = [];
    
    // Find all images from this specific product's folder
    const productItemFolder = `/data/item/${sourceUrl}/`;
    const imgRegex = new RegExp(`https://cdamdong\\.co\\.kr${productItemFolder.replace(/\//g, '\\/')}[^"']+\\.(jpg|jpeg|png|webp)`, 'gi');
    
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let imgUrl = match[0];
      
      // Skip thumbnail versions, get large versions
      if (imgUrl.includes("_77x82") || imgUrl.includes("_100x")) {
        continue;
      }
      
      // Convert to 500x500 version if it's a thumb
      if (imgUrl.includes("thumb-")) {
        imgUrl = imgUrl.replace("thumb-", "").replace("_300x300", "_500x500");
      }
      
      // Make sure it's a 500x500 version
      if (!imgUrl.includes("_500x500")) {
        imgUrl = imgUrl.replace(/(\.[a-z]+)$/i, "_500x500$1");
      }
      
      if (!productImages.includes(imgUrl)) {
        productImages.push(imgUrl);
      }
    }
    
    // Fallback: use current image in large format
    if (productImages.length === 0 && currentImageUrl) {
      const largeImg = currentImageUrl.replace("_300x300", "_500x500").replace("thumb-", "");
      productImages.push(largeImg);
    }

    return {
      detailContent: "프리미엄 품질의 명품 레플리카 제품입니다. 정품과 동일한 소재와 공법으로 제작되었습니다. 상세 이미지를 참고해 주세요.",
      imageUrls: productImages.slice(0, 10)
    };
  } catch (error) {
    console.error(`Error fetching detail for ${sourceUrl}:`, error);
    return { detailContent: "", imageUrls: [] };
  }
}

async function main() {
  console.log("Fetching product details from cdamdong.co.kr...");
  
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products to update`);
  
  let updated = 0;
  
  for (const product of allProducts) {
    const imageUrl = product.imageUrl;
    if (!imageUrl || !imageUrl.includes("cdamdong.co.kr")) {
      continue;
    }
    
    const sourceMatch = imageUrl.match(/\/data\/item\/(\d+)\//);
    if (!sourceMatch) {
      continue;
    }
    
    const sourceUrl = sourceMatch[1];
    console.log(`Fetching details for: ${product.name} (${sourceUrl})`);
    
    const { detailContent, imageUrls } = await fetchProductDetail(sourceUrl, imageUrl);
    
    if (detailContent || imageUrls.length > 0) {
      await db.update(products)
        .set({
          detailContent: detailContent || "프리미엄 품질의 명품 레플리카 제품입니다. 정품과 동일한 소재와 공법으로 제작되었습니다.",
          imageUrls: imageUrls.length > 0 ? imageUrls : [imageUrl.replace("thumb-", "").replace("_300x300", "")]
        })
        .where(eq(products.id, product.id));
      
      updated++;
      console.log(`  Updated with ${imageUrls.length} images`);
    }
    
    await delay(500);
  }
  
  console.log(`\nCompleted! Updated ${updated} products.`);
  process.exit(0);
}

main().catch(console.error);
