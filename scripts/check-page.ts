import * as cheerio from 'cheerio';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://bloostore1.co.kr/'
};

const COMMON_HASHES = new Set([
  '91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23',
  'afdfe65a9ac1d', '885873f75d2c3', '59d659c00f76c',
]);

function imgHash(url: string): string {
  const m = url.match(/\/([^/.]+)\.\w+$/);
  return m ? m[1] : url;
}

function extractProductData(html: string) {
  const $ = cheerio.load(html);
  const images: string[] = [];

  const addImage = (url: string) => {
    const clean = url.split('?')[0].replace('cdn-optimized.imweb.me', 'cdn.imweb.me');
    if (!clean.includes('cdn.imweb.me')) return;
    const hash = imgHash(clean);
    if (COMMON_HASHES.has(hash)) return;
    if (images.some(e => imgHash(e) === hash)) return;
    images.push(clean);
  };

  // 1) #prodDetailPC template (cheerio .find()는 template 내부 탐색 불가 → regex)
  const tplHtml = $('#prodDetailPC').html() || '';
  if (tplHtml) {
    for (const m of tplHtml.matchAll(/src="([^"]*cdn[^"]*)"/g)) {
      addImage(m[1]);
    }
  }

  // 2) JSON-LD 메인 이미지 맨 앞에
  let jsonldImage = '';
  $('script[type="application/ld+json"]').each((_i, el) => {
    if (jsonldImage) return;
    try {
      const d = JSON.parse($(el).html() || '');
      if (d['@type'] === 'Product' && d.image) {
        const imgs = Array.isArray(d.image) ? d.image : [d.image];
        const first = (imgs as string[]).find(img => typeof img === 'string' && img.includes('cdn.imweb.me'));
        if (first) jsonldImage = first.split('?')[0];
      }
    } catch {}
  });
  if (jsonldImage) {
    const hash = imgHash(jsonldImage);
    if (!COMMON_HASHES.has(hash) && !images.some(e => imgHash(e) === hash)) {
      images.unshift(jsonldImage);
    }
  }

  if (images.length === 0) {
    const ogImg = $('meta[property="og:image"]').attr('content') || '';
    if (ogImg) addImage(ogImg);
  }

  return images;
}

async function test(url: string, label: string) {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  const html = await r.text();
  const imgs = extractProductData(html);
  console.log(`\n[${label}]`);
  console.log(`  URL: ${url}`);
  console.log(`  추출된 이미지 ${imgs.length}개:`);
  imgs.forEach((img, i) => console.log(`    ${i+1}. ${img}`));
}

(async () => {
  await test('https://bloostore1.co.kr/1212/?idx=29846', '루이비통 돕 키트 M12639');
  await test('https://bloostore1.co.kr/shop_view/?idx=272',   '디올 백 idx=272');
  await test('https://bloostore1.co.kr/shop_view/?idx=2815',  '롤렉스 idx=2815');
  await test('https://bloostore1.co.kr/shop_view/?idx=100',   '상품 idx=100');
})();
