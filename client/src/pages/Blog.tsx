import { Header } from "@/components/layout/Header";
import { Link, useLocation, useRoute } from "wouter";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const blogItems = [
  {
    id: 18,
    title: "가품 판별 = 자석? 이제는 옛말! 최근 스트랩 소재 변화",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    content: "최근 스트랩 소재의 변화로 인해 기존 자석 판별법이 더 이상 유효하지 않게 되었습니다. 새로운 기술과 소재가 도입되면서 정품과 동일한 소재를 사용하는 제품들이 늘어나고 있습니다. 이 글에서는 최신 스트랩 소재 트렌드와 변화에 대해 알아봅니다.",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"],
    date: "2025-01-01"
  },
  {
    id: 15,
    title: "명품 브랜드의 현실, 알고 계셨나요?",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
    content: "명품 브랜드의 실제 생산 비용과 판매 가격 사이의 마진에 대해 알아봅니다. 많은 분들이 모르시는 명품 산업의 현실을 공개합니다.",
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"],
    date: "2024-12-28"
  },
  {
    id: 19,
    title: "BLOO의 몽클제품은 NFC 접속이 가능합니다.",
    imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&q=80",
    content: "BLOO의 몽클레르 제품은 정품과 동일한 NFC 칩이 내장되어 있어 스마트폰으로 정품 인증이 가능합니다.",
    images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80"],
    date: "2024-12-25"
  },
  {
    id: 17,
    title: "변색 제거 하는 방법!",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    content: "실버 악세사리의 변색을 간단하게 제거하는 방법을 알려드립니다. 집에서 쉽게 할 수 있는 방법들을 소개합니다.",
    images: ["https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80"],
    date: "2024-12-20"
  },
  {
    id: 16,
    title: "변색? 실버925 완벽 복원 전후 공개!",
    imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",
    content: "실버925 제품의 변색 전후 비교 사진을 공개합니다. 완벽한 복원 과정을 보여드립니다.",
    images: ["https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80"],
    date: "2024-12-18"
  },
  {
    id: 14,
    title: "불쾌한 구스다운 패딩 냄새 원인과 제거 방법!",
    imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80",
    content: "구스다운 패딩에서 나는 불쾌한 냄새의 원인과 제거 방법을 알려드립니다.",
    images: ["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80"],
    date: "2024-12-15"
  },
  {
    id: 13,
    title: "저스트 앵끌루 못팔찌 사용방법!",
    imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffbb2b0a35f?w=600&q=80",
    content: "까르띠에 저스트 앵끌루 못팔찌의 올바른 착용 방법과 사용법을 안내합니다.",
    images: ["https://images.unsplash.com/photo-1588776814546-1ffbb2b0a35f?w=800&q=80"],
    date: "2024-12-10"
  },
  {
    id: 12,
    title: "국내배송 특성상 안전하게 배송되는 이유!",
    imageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
    content: "국내 배송 시 제품 보호 방법과 안전한 포장에 대해 설명드립니다.",
    images: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80"],
    date: "2024-12-05"
  },
  {
    id: 11,
    title: "14k 금, 18k 금도 변색 된다는 사실 알고 계시나요?",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    content: "14K, 18K 금도 변색될 수 있다는 사실을 알고 계셨나요? 금 제품 관리법을 알려드립니다.",
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80"],
    date: "2024-12-01"
  },
  {
    id: 10,
    title: "명품도 피해 갈 수 없다? 정품 가죽 냄새의 근본 원인과 제거 팁",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    content: "정품 가죽에서 나는 특유의 냄새 원인과 제거 방법을 알려드립니다.",
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"],
    date: "2024-11-28"
  },
  {
    id: 9,
    title: "오리지널 동일 가죽에도 급이 있다는 사실 알고 계셨나요?",
    imageUrl: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=600&q=80",
    content: "같은 오리지널 가죽이라도 등급이 다르다는 사실을 알려드립니다.",
    images: ["https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=800&q=80"],
    date: "2024-11-25"
  },
  {
    id: 8,
    title: "BLOO 제품 VS 타 업체 제품 비교",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    content: "BLOO 제품과 타 업체 제품의 품질 차이를 비교해 보았습니다.",
    images: ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"],
    date: "2024-11-20"
  },
  {
    id: 7,
    title: "왜 BLOO 악세사리는 타 업체보다 비싸요? (중금속 관련 이슈)",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    content: "BLOO 악세사리가 다른 업체보다 비싼 이유를 설명드립니다. 중금속 이슈와 품질 차이에 대해 알아봅니다.",
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80"],
    date: "2024-11-15"
  },
  {
    id: 6,
    title: "왜? BLOO가 프리미엄 패션 사이트 1등인가요?",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
    content: "BLOO가 프리미엄 패션 업계에서 1등인 이유를 설명드립니다.",
    images: ["https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"],
    date: "2024-11-10"
  },
  {
    id: 5,
    title: "(TIP) 저품질 제품이라면 너무 뻔한 실수! 내부 택을 꼭 확인하세요",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    content: "저품질 제품의 흔한 실수 중 하나인 내부 택 문제에 대해 알려드립니다.",
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
    date: "2024-11-05"
  },
  {
    id: 4,
    title: "BLOO 패딩의 품질 보증에 대해서",
    imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&q=80",
    content: "BLOO 패딩 제품의 품질 보증 정책에 대해 안내드립니다.",
    images: ["https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&q=80"],
    date: "2024-11-01"
  },
  {
    id: 3,
    title: "BLOO만의 특별한 포장 서비스",
    imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&q=80",
    content: "BLOO만의 특별한 포장 서비스를 소개합니다.",
    images: ["https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&q=80"],
    date: "2024-10-28"
  },
  {
    id: 2,
    title: "시계 스트랩 조절 방법 안내",
    imageUrl: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=600&q=80",
    content: "시계 스트랩 길이 조절 방법을 안내드립니다.",
    images: ["https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80"],
    date: "2024-10-25"
  },
  {
    id: 1,
    title: "BLOO 신규 회원 가입 혜택 안내",
    imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=80",
    content: "BLOO 신규 회원 가입 시 받을 수 있는 혜택을 안내드립니다.",
    images: ["https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80"],
    date: "2024-10-20"
  },
];

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

export default function Blog() {
  const [location] = useLocation();
  const [match, params] = useRoute("/blog/:id");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const itemId = match ? parseInt(params.id) : null;
  const currentItem = itemId ? blogItems.find(item => item.id === itemId) : null;

  const filteredItems = blogItems.filter(item => {
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentIndex = currentItem ? blogItems.findIndex(item => item.id === currentItem.id) : -1;
  const prevItem = currentIndex > 0 ? blogItems[currentIndex - 1] : null;
  const nextItem = currentIndex < blogItems.length - 1 ? blogItems[currentIndex + 1] : null;

  if (currentItem) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Header />
        
        <main className="pb-20 md:pb-8">
          <div className="bg-[#111111] border-b border-[#2a2a2a] py-4">
            <div className="max-w-[1200px] mx-auto px-4">
              <h1 className="text-lg font-bold text-[#f0f0f0]">블로그</h1>
              <div className="flex items-center gap-2 text-sm text-[#888888] mt-1">
                <Link href="/" className="hover:text-[#c9a96e]">홈</Link>
                <span>&gt;</span>
                <Link href="/blog" className="hover:text-[#c9a96e]">블로그</Link>
                <span>&gt;</span>
                <span className="truncate max-w-[200px]">{currentItem.title}</span>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-4 py-8">
            <div className="flex gap-8">
              <aside className="hidden md:block w-48 flex-shrink-0">
                <nav className="border border-[#2a2a2a]">
                  {sideMenuItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.path}
                      className="block px-4 py-3 text-sm border-b border-[#2a2a2a] last:border-b-0 text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </aside>

              <div className="flex-1">
                <div className="border-b border-[#2a2a2a] pb-4 mb-6">
                  <h2 className="text-xl font-bold text-[#f0f0f0] mb-2">{currentItem.title}</h2>
                  <p className="text-sm text-[#888888]">{currentItem.date}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {currentItem.images.map((img, index) => (
                    <div key={index} className="bg-[#1a1a1a] rounded overflow-hidden">
                      <img
                        src={img}
                        alt={`${currentItem.title} - ${index + 1}`}
                        className="w-full h-auto"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    </div>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none mb-8">
                  <p className="text-[#aaaaaa] leading-relaxed whitespace-pre-line">{currentItem.content}</p>
                </div>

                <div className="border-t border-[#2a2a2a] pt-4 flex justify-between items-center">
                  {prevItem ? (
                    <Link href={`/blog/${prevItem.id}`} className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#c9a96e]">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">이전글</span>
                    </Link>
                  ) : <div />}
                  
                  <Link href="/blog" className="px-4 py-2 bg-[#c9a96e] text-black text-sm rounded hover:bg-[#b8925a]">
                    목록
                  </Link>
                  
                  {nextItem ? (
                    <Link href={`/blog/${nextItem.id}`} className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#c9a96e]">
                      <span className="hidden sm:inline">다음글</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      
      <main className="pb-20 md:pb-8">
        <div className="bg-[#111111] border-b border-[#2a2a2a] py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-[#f0f0f0]">블로그</h1>
            <div className="flex items-center gap-2 text-sm text-[#888888] mt-1">
              <Link href="/" className="hover:text-[#c9a96e]">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>블로그</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-[#2a2a2a]">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-[#2a2a2a] last:border-b-0 ${
                      location === item.path 
                        ? 'bg-[#c9a96e] text-black font-medium' 
                        : 'text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[#888888]">
                  Total : <strong className="text-[#f0f0f0]">{filteredItems.length}</strong> items
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.id}`}
                    className="block bg-[#161616] border border-[#2a2a2a] hover:border-[#c9a96e] transition-colors"
                    data-testid={`blog-item-${item.id}`}
                  >
                    <div className="aspect-square bg-[#1a1a1a] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-[#aaaaaa] line-clamp-2 leading-relaxed">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="flex items-center gap-2 border border-[#2a2a2a] rounded overflow-hidden">
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-3 py-2 text-sm bg-[#161616] text-[#f0f0f0] border-r border-[#2a2a2a] outline-none"
                  >
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="title_content">제목+내용</option>
                  </select>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어 필수"
                    className="px-3 py-2 text-sm bg-[#161616] text-[#f0f0f0] placeholder:text-[#444444] outline-none w-40"
                  />
                  <button className="px-4 py-2 bg-[#c9a96e] text-black text-sm hover:bg-[#b8925a]">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
