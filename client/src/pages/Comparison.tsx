import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation, useRoute } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const comparisonItems = [
  {
    id: 79,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 프리미에르 워치 하이엔드급 VS 고퀄 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_IlguY7zf_2a2ec227823a23036fee8e87148bb55d989a01cb.jpg",
    content: "샤넬 프리미에르 워치의 하이엔드급과 고퀄을 비교해 보았습니다. 케이스 마감, 다이얼 디테일, 스트랩 품질 등 세부 사항을 꼼꼼하게 비교 분석하였습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_IlguY7zf_2a2ec227823a23036fee8e87148bb55d989a01cb.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102432_2134.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102433_3774.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102434_3993.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102435_5256.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102436_6628.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102437_6177.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102438_6738.jpg",
      "https://cdamdong.co.kr/data/editor/2505/5240af4ea30bb2cac8a13d8a0f38c4ca_1747102439_8923.jpg"
    ],
    date: "2025-05-12"
  },
  {
    id: 80,
    brand: "샤넬",
    title: "가품 판별 = 자석? 이제는 옛말! 최근 스트랩 소재 변화",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg",
    content: "가방 스트랩, 자석에 붙는 게 정상일까?\n\n명품 가방을 구매하시려는 분들 사이에서 자주 오가는 이야기 중 하나가 있습니다.\n\n바로 \"가방 스트랩은 자석에 붙지 않는다\"는 말인데요. 예전에는 이 말이 정품 판별에 나름의 기준처럼 여겨지기도 했습니다.\n\n그러나 최근 명품 제품들을 살펴보면 이 기준이 더 이상 절대적이지 않다는 것을 알 수 있습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg"
    ],
    date: "2025-09-08"
  },
  {
    id: 78,
    brand: "프라다",
    title: "[프라다] 프라다 리에디션 나일론 테수토 호보백",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg",
    content: "안녕하세요, velour입니다!\n\n오늘은 매년 꾸준한 인기를 자랑하는 프라다 리에디션 나일론 테수토 호보백을 리뷰해보겠습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729476529_6543.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729477255_6869.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729477367_5096.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729477437_1148.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729477525_8744.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729477616_9624.jpg"
    ],
    date: "2024-10-21"
  },
  {
    id: 77,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 트렌디 cc woc 18SS 정품 VS 하이엔드 VS 고퀄 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_eNY4MzGD_af27bb6195a470f2e1d8d17620a380f5cd64621e.jpg",
    content: "안녕하세요, velour입니다!\n\n오늘은 많은 분들이 찾고 계시지만 여전히 구하기 어려운 희소템, 샤넬 트렌디 CC WOC – 18SS 시즌 제품 리뷰를 준비했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_eNY4MzGD_af27bb6195a470f2e1d8d17620a380f5cd64621e.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474193_8966.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474194_8261.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474579_2258.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474670_6515.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474671_8056.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474872_6333.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474828_1531.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729474826_5121.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729475001_2728.jpg",
      "https://cdamdong.co.kr/data/editor/2410/5753c156c874a99ed9f1a4bd45dae214_1729475035_3416.jpg"
    ],
    date: "2024-10-21"
  },
  {
    id: 76,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 22백 스몰 고퀄 공장 VS 하이엔드급 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/987963447_IwztU218_25bd35f8ba527333a5d1aa6efa2ac280cfcd4167.jpg",
    content: "velour은 제가 직접 들고 다니지 못할 제품은 절대 판매하지 않습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/987963447_IwztU218_25bd35f8ba527333a5d1aa6efa2ac280cfcd4167.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194096_2928.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194300_8909.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194420_5544.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194615_2138.gif",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194639_0539.gif",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194686_1316.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194692_1389.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728194829_7939.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728195019_7331.jpg",
      "https://cdamdong.co.kr/data/editor/2410/f247ef244b1176659c099245c24a93b8_1728195075_9586.jpg"
    ],
    date: "2024-10-06"
  },
  {
    id: 75,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 WOC 숄더 체인 월렛백 고퀄 공장 VS 하이엔드급 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_HzpnK7wX_6a1f7edf2721f7853ef2bb248a91b2cc698d3511.jpg",
    content: "안녕하세요, velour입니다.\n\n오늘은 많은 고객님들이 궁금해하시는 \"고퀄라인 제품과 하이엔드급 제품의 차이점\"을 직접 비교해보는 칼럼을 준비했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_HzpnK7wX_6a1f7edf2721f7853ef2bb248a91b2cc698d3511.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690403_8405.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690560_1876.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690619_3306.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690692_1581.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690696_1047.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690700_4038.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690803_4726.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727690868_876.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727691072_5371.jpg"
    ],
    date: "2024-09-30"
  },
  {
    id: 74,
    brand: "루이비통",
    title: "[LV - 루이비통] 알마 BB 타업체 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_L2nGkJ1m_9ec69a5c3f121e6e5363acbad7a3eac50fa4c441.jpg",
    content: "안녕하세요, velour입니다.\n\n오늘은 가볍지만 유익한 콘텐츠로 저희 velour 제품과 타 업체 제품의 실제 비교 리뷰를 준비해보았습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_L2nGkJ1m_9ec69a5c3f121e6e5363acbad7a3eac50fa4c441.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687952_1867.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687952_7875.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687953_3891.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687953_9905.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687954_5887.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687955_2954.jpg"
    ],
    date: "2024-09-30"
  },
  {
    id: 73,
    brand: "디올",
    title: "[DIOR] 디올 북토트 백 타업체 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_skqPKJZ0_61842b961dd008c94e27db168a27879f5de9807a.jpg",
    content: "안녕하세요, velour입니다.\n\n오늘은 가볍지만 유익한 콘텐츠로 저희 velour 제품과 타 업체 제품의 실제 비교 리뷰를 준비해보았습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_skqPKJZ0_61842b961dd008c94e27db168a27879f5de9807a.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687866_1153.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687866_7947.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687867_4751.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687868_1494.jpg",
      "https://cdamdong.co.kr/data/editor/2409/b133e2589ff8f1dcf61ed45b8c44e634_1727687868_8205.jpg"
    ],
    date: "2024-09-30"
  }
];

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

export default function Comparison() {
  const [location] = useLocation();
  const [match, params] = useRoute("/comparison/:id");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const itemId = match ? parseInt(params.id) : null;
  const currentItem = itemId ? comparisonItems.find(item => item.id === itemId) : null;

  const filteredItems = comparisonItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (searchType === "title") return item.title.toLowerCase().includes(searchLower);
    return item.title.toLowerCase().includes(searchLower) || item.brand.toLowerCase().includes(searchLower);
  });

  const currentIndex = currentItem ? comparisonItems.findIndex(item => item.id === currentItem.id) : -1;
  const prevItem = currentIndex > 0 ? comparisonItems[currentIndex - 1] : null;
  const nextItem = currentIndex < comparisonItems.length - 1 ? comparisonItems[currentIndex + 1] : null;

  const SideMenu = () => (
    <aside className="hidden md:block w-40 flex-shrink-0">
      <nav className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white">
        {sideMenuItems.map((item, index) => (
          <Link
            key={index}
            href={item.path}
            className={`block px-4 py-3 text-sm border-b border-[#e8e8e8] last:border-b-0 ${
              location.startsWith("/comparison")
                ? item.path === "/comparison" ? 'bg-[#FF6100] text-white font-medium' : 'text-[#666666] hover:bg-[#f8f8f8] hover:text-[#111111]'
                : location === item.path
                  ? 'bg-[#FF6100] text-white font-medium'
                  : 'text-[#666666] hover:bg-[#f8f8f8] hover:text-[#111111]'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );

  if (currentItem) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Header />

        <main>
          <div className="bg-white border-b border-[#e8e8e8] py-4">
            <div className="max-w-[640px] mx-auto px-4">
              <h1 className="text-base font-bold text-[#111111]">1:1 비교</h1>
              <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
                <Link href="/" className="hover:text-[#FF6100]">홈</Link>
                <span>&gt;</span>
                <Link href="/comparison" className="hover:text-[#FF6100]">1:1 비교</Link>
                <span>&gt;</span>
                <span className="truncate max-w-[160px] text-[#666666]">{currentItem.title}</span>
              </div>
            </div>
          </div>

          <div className="max-w-[640px] mx-auto px-4 py-5">
            <div className="flex gap-5">
              <SideMenu />

              <div className="flex-1 min-w-0">
                <div className="border-b border-[#e8e8e8] pb-4 mb-5">
                  <span className="inline-block bg-[#f5f5f5] text-[#666666] text-xs px-2 py-0.5 mb-2 rounded">
                    {currentItem.brand}
                  </span>
                  <h2 className="text-base font-bold text-[#111111] mb-1">{currentItem.title}</h2>
                  <p className="text-xs text-[#999999]">{currentItem.date}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {currentItem.images.map((img, index) => (
                    <div key={index} className="bg-[#f5f5f5] rounded-xl overflow-hidden">
                      <img
                        src={getProxiedImageUrl(img)}
                        alt={`${currentItem.title} - ${index + 1}`}
                        className="w-full h-auto"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <p className="text-sm text-[#444444] leading-relaxed whitespace-pre-line">{currentItem.content}</p>
                </div>

                <div className="border-t border-[#e8e8e8] pt-4 flex justify-between items-center">
                  {prevItem ? (
                    <Link href={`/comparison/${prevItem.id}`} className="flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#FF6100]">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">이전글</span>
                    </Link>
                  ) : <div />}

                  <Link href="/comparison" className="px-4 py-2 bg-[#FF6100] text-white text-sm rounded-lg hover:bg-[#e05500]">
                    목록
                  </Link>

                  {nextItem ? (
                    <Link href={`/comparison/${nextItem.id}`} className="flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#FF6100]">
                      <span className="hidden sm:inline">다음글</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main>
        <div className="bg-white border-b border-[#e8e8e8] py-4">
          <div className="max-w-[640px] mx-auto px-4">
            <h1 className="text-base font-bold text-[#111111]">1:1 비교</h1>
            <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
              <Link href="/" className="hover:text-[#FF6100]">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>1:1 비교</span>
            </div>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-4 py-5">
          <div className="flex gap-5">
            <SideMenu />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#999999]">
                  Total : <strong className="text-[#FF6100]">{filteredItems.length}</strong> items
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/comparison/${item.id}`}
                    className="block bg-white border border-[#e8e8e8] hover:border-[#FF6100] transition-colors rounded-xl overflow-hidden"
                    data-testid={`comparison-item-${item.id}`}
                  >
                    <div className="aspect-square bg-[#f5f5f5] overflow-hidden">
                      <img
                        src={getProxiedImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                    <div className="p-3">
                      <span className="inline-block bg-[#f5f5f5] text-[#666666] text-[10px] px-2 py-0.5 mb-1.5 rounded">
                        {item.brand}
                      </span>
                      <p className="text-xs text-[#444444] line-clamp-2 leading-relaxed">{item.title}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="border-t border-[#e8e8e8] pt-5">
                <div className="flex items-center justify-center gap-2">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="border border-[#e8e8e8] bg-white text-[#111111] px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#FF6100]"
                  >
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="all">제목+내용</option>
                  </select>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어 입력"
                    className="border border-[#e8e8e8] bg-white text-[#111111] placeholder:text-[#cccccc] px-3 py-2 text-sm rounded-lg w-40 focus:outline-none focus:border-[#FF6100]"
                  />
                  <button className="bg-[#FF6100] text-white px-4 py-2 text-sm rounded-lg hover:bg-[#e05500] flex items-center gap-1">
                    <Search className="w-4 h-4" />검색
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
