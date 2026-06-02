import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  const check = await db.execute(
    sql`SELECT COUNT(*) as cnt FROM products WHERE detail_image_urls IS NOT NULL AND detail_image_urls::text != '[]'`
  );
  console.log('현재 detail_image_urls 있는 상품:', (check.rows[0] as any).cnt);

  const reset = await db.execute(
    sql`UPDATE products SET detail_image_urls = ARRAY[]::text[] WHERE source_idx IS NOT NULL AND source_idx > 0`
  );
  console.log('초기화 완료:', (reset as any).rowCount, '개 상품');

  await pool.end();
}

main().catch(console.error);
