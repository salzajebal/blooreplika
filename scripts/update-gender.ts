import { db } from "../server/db";
import { products } from "../shared/schema";
import { sql, isNull } from "drizzle-orm";

function detectGender(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('남녀공용') || lower.includes('남녀') || lower.includes('유니섹스') || lower.includes('unisex')) return '공용';
  if (lower.includes('남성') || lower.includes('남자') || lower.includes('mens') || lower.includes("men's") || lower.match(/\bmen\b/) || lower.match(/\bmens\b/)) return '남성';
  if (lower.includes('여성') || lower.includes('여자') || lower.includes('womens') || lower.includes("women's") || lower.match(/\bwomen\b/) || lower.match(/\bwomens\b/) || lower.includes('ladies')) return '여성';
  return null;
}

async function main() {
  console.log("=== Gender Update Script ===");
  
  const allProducts = await db.select({ id: products.id, name: products.name, gender: products.gender }).from(products);
  console.log(`Total products: ${allProducts.length}`);
  
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  
  for (const p of allProducts) {
    const detected = detectGender(p.name);
    if (!detected) {
      noMatch++;
      continue;
    }
    if (p.gender === detected) {
      skipped++;
      continue;
    }
    await db.update(products).set({ gender: detected }).where(sql`${products.id} = ${p.id}`);
    updated++;
  }
  
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already correct): ${skipped}`);
  console.log(`No gender detected: ${noMatch}`);
  console.log("=== Done ===");
  
  process.exit(0);
}

main().catch(console.error);
