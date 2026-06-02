import * as fs from 'fs';
import * as cheerio from 'cheerio';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Referer': 'https://bloostore1.co.kr/',
};

async function main() {
  const url = 'https://bloostore1.co.kr/1212/?idx=29846';
  console.log('Fetching:', url);
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  const html = await r.text();

  // 원본 HTML 저장
  fs.writeFileSync('/tmp/bloo-product.html', html);
  console.log('HTML 저장: /tmp/bloo-product.html');
  console.log('HTML 길이:', html.length);

  // 1. 모든 cdn URL 추출
  const cdnUrls = [...new Set((html.match(/https?:\/\/cdn[^\s"'<>\\]+/g) || []).map(u => u.split('?')[0]))];
  console.log('\n=== CDN URLs (' + cdnUrls.length + '개) ===');
  cdnUrls.forEach(u => console.log(' ', u));

  // 2. 상세정보 관련 섹션 파악
  const $ = cheerio.load(html);
  console.log('\n=== 모든 div/section id/class (상세 관련) ===');
  $('[id]').each((_i, el) => {
    const id = $(el).attr('id') || '';
    console.log(`  #${id} (${el.name})`);
  });

  // 3. script 내 JSON 데이터 중 이미지 URL 포함된 것 추출
  console.log('\n=== Script 내 이미지/상품 데이터 ===');
  $('script:not([src])').each((_i, el) => {
    const text = $(el).html() || '';
    if (text.includes('thumbnail') || text.includes('goods_detail') || text.includes('detail_content') || text.includes('imweb')) {
      console.log('--- script snippet ---');
      console.log(text.substring(0, 500));
    }
  });

  // 4. imweb API 탐색
  console.log('\n=== imweb API 탐색 ===');
  const apis = [
    `https://bloostore1.co.kr/api/shop/goods/detail/?idx=29846`,
    `https://bloostore1.co.kr/api/shop/goods/?idx=29846`,
    `https://api.imweb.me/v2/shop/goods/29846`,
  ];
  for (const api of apis) {
    try {
      const ar = await fetch(api, { headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' }, signal: AbortSignal.timeout(5000) });
      const text = await ar.text();
      console.log(`${api} -> ${ar.status}: ${text.substring(0, 200)}`);
    } catch (e: any) {
      console.log(`${api} -> ERROR: ${e.message}`);
    }
  }
}

main().catch(console.error);
