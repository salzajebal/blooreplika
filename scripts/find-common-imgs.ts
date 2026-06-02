import * as cheerio from 'cheerio';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://bloostore1.co.kr/'
};

// 각기 다른 상품 (브랜드/카테고리 다양하게)
const testProducts = [
  { idx: 29846, name: '루이비통 돕 키트' },
  { idx: 272,   name: '디올 백' },
  { idx: 2815,  name: '롤렉스' },
  { idx: 100,   name: '상품100' },
  { idx: 500,   name: '상품500' },
  { idx: 5000,  name: '상품5000' },
];

function getTemplateImages(html: string): string[] {
  const $ = cheerio.load(html);
  const images: string[] = [];
  const tpl = $('#prodDetailPC');
  if (!tpl.length) return images;
  const content = tpl.html() || '';
  // template 내부 img src 추출
  const matches = [...new Set((content.match(/src="([^"]+cdn[^"]+)"/g) || []).map(m => m.slice(5, -1).split('?')[0]))];
  return matches;
}

async function main() {
  const productImages: Map<number, string[]> = new Map();
  for (const p of testProducts) {
    try {
      const url = `https://bloostore1.co.kr/shop_view/?idx=${p.idx}`;
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
      const html = await r.text();
      const imgs = getTemplateImages(html);
      productImages.set(p.idx, imgs);
      console.log(`[${p.name} idx=${p.idx}] template 이미지 ${imgs.length}개`);
    } catch (e: any) {
      console.log(`[idx=${p.idx}] ERROR:`, e.message);
      productImages.set(p.idx, []);
    }
  }

  // 2개 이상 상품에 공통으로 나타나는 이미지 = 공통 이미지
  const allImgs = [...productImages.values()].flat();
  const countMap = new Map<string, number>();
  for (const img of allImgs) {
    const hash = img.match(/\/([^/]+)\.\w+$/)?.[1] || img;
    countMap.set(hash, (countMap.get(hash) || 0) + 1);
  }

  console.log('\n=== 2개+ 상품에서 공통 발견된 이미지 (사이트 공통 자산) ===');
  for (const [hash, count] of [...countMap.entries()].filter(([, c]) => c >= 2).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${hash} (${count}개 상품)`);
  }

  console.log('\n=== 각 상품별 고유 이미지 (상품 전용) ===');
  const commonHashes = new Set([...countMap.entries()].filter(([, c]) => c >= 2).map(([h]) => h));
  for (const [idx, imgs] of productImages.entries()) {
    const unique = imgs.filter(img => {
      const hash = img.match(/\/([^/]+)\.\w+$/)?.[1] || img;
      return !commonHashes.has(hash);
    });
    const p = testProducts.find(x => x.idx === idx);
    console.log(`[${p?.name} idx=${idx}] 고유 이미지 ${unique.length}개:`);
    unique.forEach(u => console.log('   ', u));
  }
}

main().catch(console.error);
