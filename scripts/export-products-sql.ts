import { db } from "../server/db";
import { products } from "../shared/schema";
import * as fs from "fs";

async function main() {
  console.log("Exporting products to SQL...");
  
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products`);
  
  let sql = "-- Product data export\n";
  sql += "-- Run this in your production database\n\n";
  sql += "DELETE FROM products;\n\n";
  
  for (const p of allProducts) {
    const escape = (s: string | null) => s ? s.replace(/'/g, "''") : '';
    const arrayToSql = (arr: string[] | null) => {
      if (!arr || arr.length === 0) return "'{}'";
      return "ARRAY[" + arr.map(u => `'${escape(u)}'`).join(',') + "]";
    };
    
    sql += `INSERT INTO products (name, category_id, price, description, detail_content, image_url, image_urls, detail_image_urls, is_best, is_new, is_active) VALUES (`;
    sql += `'${escape(p.name)}', `;
    sql += `'${escape(p.categoryId)}', `;
    sql += `${p.price}, `;
    sql += `'${escape(p.description)}', `;
    sql += `'${escape(p.detailContent)}', `;
    sql += `'${escape(p.imageUrl)}', `;
    sql += `${arrayToSql(p.imageUrls)}, `;
    sql += `${arrayToSql(p.detailImageUrls)}, `;
    sql += `${p.isBest || false}, `;
    sql += `${p.isNew || false}, `;
    sql += `${p.isActive || true}`;
    sql += ");\n";
  }
  
  fs.writeFileSync("products_export.sql", sql);
  console.log(`Exported to products_export.sql (${(sql.length / 1024 / 1024).toFixed(2)} MB)`);
  
  process.exit(0);
}

main().catch(console.error);
