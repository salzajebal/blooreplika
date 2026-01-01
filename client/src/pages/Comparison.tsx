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
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg"
    ],
    date: "2025-01-01"
  },
  {
    id: 80,
    brand: "샤넬",
    title: "가품 판별 = 자석? 이제는 옛말! 최근 스트랩 소재 변화",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg",
    content: "최근 스트랩 소재의 변화로 인해 기존 자석 판별법이 더 이상 유효하지 않게 되었습니다. 새로운 판별 방법을 알아봅니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg"
    ],
    date: "2025-01-01"
  },
  {
    id: 78,
    brand: "프라다",
    title: "[프라다] 프라다 리에디션 나일론 테수토 호보백",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg",
    content: "프라다 리에디션 나일론 테수토 호보백의 정품과 고퀄 제품을 비교해 보았습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg"
    ],
    date: "2024-12-15"
  },
  {
    id: 77,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 트렌디 cc woc 18SS 정품 VS 하이엔드 VS 고퀄 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_eNY4MzGD_af27bb6195a470f2e1d8d17620a380f5cd64621e.jpg",
    content: "샤넬 트렌디 CC WOC 18SS 정품, 하이엔드, 고퀄 3가지를 비교 분석했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_eNY4MzGD_af27bb6195a470f2e1d8d17620a380f5cd64621e.jpg"
    ],
    date: "2024-12-10"
  },
  {
    id: 76,
    brand: "샤넬",
    title: "[CHANEL - 샤넬] 샤넬 22백 스몰 고퀄 공장 VS 하이엔드급 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/987963447_IwztU218_25bd35f8ba527333a5d1aa6efa2ac280cfcd4167.jpg",
    content: "샤넬 22백 스몰 사이즈의 고퀄 공장 제품과 하이엔드급 제품을 비교했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/987963447_IwztU218_25bd35f8ba527333a5d1aa6efa2ac280cfcd4167.jpg"
    ],
    date: "2024-12-05"
  },
  {
    id: 75,
    brand: "디올",
    title: "[DIOR - 디올] 디올 레이디백 미디엄 정품 VS 하이엔드 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_IlguY7zf_2a2ec227823a23036fee8e87148bb55d989a01cb.jpg",
    content: "디올 레이디백 미디엄 사이즈의 정품과 하이엔드 제품을 비교 분석했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_IlguY7zf_2a2ec227823a23036fee8e87148bb55d989a01cb.jpg"
    ],
    date: "2024-11-28"
  },
  {
    id: 74,
    brand: "에르메스",
    title: "[HERMES - 에르메스] 버킨백 30 정품 VS 하이엔드 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg",
    content: "에르메스 버킨백 30 정품과 하이엔드 제품의 차이점을 분석했습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg"
    ],
    date: "2024-11-20"
  },
  {
    id: 73,
    brand: "루이비통",
    title: "[LV - 루이비통] 네버풀 MM 정품 VS 고퀄 비교!",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg",
    content: "루이비통 네버풀 MM 사이즈의 정품과 고퀄 제품을 비교해 보았습니다.",
    images: [
      "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg"
    ],
    date: "2024-11-15"
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
    if (searchType === "title") {
      return item.title.toLowerCase().includes(searchLower);
    }
    return item.title.toLowerCase().includes(searchLower) || item.brand.toLowerCase().includes(searchLower);
  });

  const currentIndex = currentItem ? comparisonItems.findIndex(item => item.id === currentItem.id) : -1;
  const prevItem = currentIndex > 0 ? comparisonItems[currentIndex - 1] : null;
  const nextItem = currentIndex < comparisonItems.length - 1 ? comparisonItems[currentIndex + 1] : null;

  if (currentItem) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main>
          <div className="bg-gray-100 py-4">
            <div className="max-w-[1200px] mx-auto px-4">
              <h1 className="text-lg font-bold text-gray-800">1:1 비교</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Link href="/" className="hover:text-black">홈</Link>
                <span>&gt;</span>
                <Link href="/comparison" className="hover:text-black">1:1 비교</Link>
                <span>&gt;</span>
                <span className="truncate max-w-[200px]">{currentItem.title}</span>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <div className="flex gap-8">
              <aside className="hidden md:block w-48 flex-shrink-0">
                <nav className="border border-gray-200">
                  {sideMenuItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.path}
                      className={`block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 ${
                        location.startsWith("/comparison")
                          ? item.path === "/comparison" ? 'bg-gray-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                          : location === item.path 
                            ? 'bg-gray-900 text-white font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </aside>

              <div className="flex-1">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 mb-2">
                    {currentItem.brand}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{currentItem.title}</h2>
                  <p className="text-sm text-gray-500">{currentItem.date}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {currentItem.images.map((img, index) => (
                    <div key={index} className="bg-gray-50 rounded overflow-hidden">
                      <img
                        src={getProxiedImageUrl(img)}
                        alt={`${currentItem.title} - ${index + 1}`}
                        className="w-full h-auto"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed">{currentItem.content}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  {prevItem ? (
                    <Link href={`/comparison/${prevItem.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">이전글</span>
                    </Link>
                  ) : <div />}
                  
                  <Link href="/comparison" className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
                    목록
                  </Link>
                  
                  {nextItem ? (
                    <Link href={`/comparison/${nextItem.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
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
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">1:1 비교</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>1:1 비교</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-gray-200">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 ${
                      location === item.path 
                        ? 'bg-gray-900 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Total : <strong>{filteredItems.length}</strong> items
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/comparison/${item.id}`}
                    className="block bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                    data-testid={`comparison-item-${item.id}`}
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={getProxiedImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                    <div className="p-3">
                      <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 mb-2">
                        {item.brand}
                      </span>
                      <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-center gap-2">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="border border-gray-300 px-3 py-2 text-sm rounded"
                  >
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="all">제목+내용</option>
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="검색어 필수"
                      className="border border-gray-300 px-3 py-2 text-sm rounded w-48"
                    />
                  </div>
                  <button className="bg-gray-800 text-white px-4 py-2 text-sm rounded hover:bg-gray-700 flex items-center gap-1">
                    <Search className="w-4 h-4" />
                    검색
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
