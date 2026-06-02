// JSON-LD 이미지와 img src 이미지가 같은 사진인지 다른 사진인지 확인
const pairs: Array<{ idx: number; label: string; jsonld: string; imgsrc: string }> = [
  {
    idx: 272, label: '의류-디올',
    jsonld: 'https://cdn.imweb.me/thumbnail/20240111/72bc026192980.jpg',
    imgsrc: 'https://cdn.imweb.me/thumbnail/20240111/1c9bead14183c.jpg',
  },
  {
    idx: 2815, label: '시계-롤렉스',
    jsonld: 'https://cdn.imweb.me/thumbnail/20231218/a86afd3466651.gif',
    imgsrc: 'https://cdn.imweb.me/thumbnail/20231218/c692b8a360e19.gif',
  },
  {
    idx: 31203, label: '가방-루이비통',
    jsonld: 'https://cdn.imweb.me/thumbnail/20250815/4eb9d110ebaf7.jpg',
    imgsrc: 'https://cdn.imweb.me/thumbnail/20250815/46a55fdd2f2d3.jpg',
  },
];

async function checkPair(p: typeof pairs[0]) {
  const [r1, r2] = await Promise.all([
    fetch(p.jsonld, { signal: AbortSignal.timeout(10000) }),
    fetch(p.imgsrc, { signal: AbortSignal.timeout(10000) }),
  ]);
  const [buf1, buf2] = await Promise.all([r1.arrayBuffer(), r2.arrayBuffer()]);
  const size1 = buf1.byteLength;
  const size2 = buf2.byteLength;
  const same = size1 === size2;
  console.log(`\n[${p.label}] idx=${p.idx}`);
  console.log(`  JSON-LD : ${size1.toLocaleString()} bytes  → ${p.jsonld.split('/').pop()}`);
  console.log(`  img src : ${size2.toLocaleString()} bytes  → ${p.imgsrc.split('/').pop()}`);
  console.log(`  동일 파일 여부: ${same ? '⚠️  같은 크기 (동일 가능성 높음)' : '✅  다른 크기 → 다른 사진'}`);
  console.log(`  크기 비율: ${(size1 / size2).toFixed(2)}x`);
}

(async () => {
  for (const p of pairs) await checkPair(p);
})();
