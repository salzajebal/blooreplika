import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation, useParams } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

function ChoiceDetail({ id }: { id: string }) {
  const { data: allItems = [] } = useQuery({
    queryKey: ['/api/content-sections', 'celeb_style'],
    queryFn: async () => {
      const res = await fetch('/api/content-sections?sectionType=celeb_style');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const item = allItems.find((i: any) => i.id === id);
  const currentIndex = allItems.findIndex((i: any) => i.id === id);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Header />
        <main className="max-w-[1200px] mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-[#f0f0f0] mb-4">상품을 찾을 수 없습니다</h1>
          <Link href="/choice" className="text-[#c9a96e] hover:underline">목록으로 돌아가기</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      
      <main>
        <div className="bg-[#111111] border-b border-[#2a2a2a] py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-[#f0f0f0]">velour 초이스</h1>
            <div className="flex items-center gap-2 text-sm text-[#888888] mt-1">
              <Link href="/" className="hover:text-[#c9a96e]">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <Link href="/choice" className="hover:text-[#c9a96e]">velour 초이스</Link>
              <span>&gt;</span>
              <span className="truncate max-w-[200px]">{item.title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-[#2a2a2a]">
                {sideMenuItems.map((menuItem, index) => (
                  <Link
                    key={index}
                    href={menuItem.path}
                    className="block px-4 py-3 text-sm border-b border-[#2a2a2a] last:border-b-0 text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]"
                  >
                    {menuItem.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="border-b-2 border-[#c9a96e] pb-4 mb-6">
                <h2 className="text-xl font-bold text-[#f0f0f0]">{item.title}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="aspect-square bg-[#1a1a1a] overflow-hidden border border-[#2a2a2a]">
                  <img
                    src={getProxiedImageUrl(item.imageUrl || "")}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    data-testid="choice-detail-image"
                  />
                </div>
                <div>
                  {item.celebrity && (
                    <div className="mb-4">
                      <span className="inline-block bg-red-900/50 text-red-400 text-sm px-3 py-1 rounded-full border border-red-800">
                        {item.celebrity} PICK!!
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-[#f0f0f0] mb-4">{item.title}</h3>
                  <p className="text-[#aaaaaa] leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <div className="bg-[#1a1a1a] p-4 border border-[#2a2a2a]">
                    <p className="text-sm text-[#888888]">
                      셀럽들이 선택한 인기 아이템입니다. 구매 문의는 카카오톡으로 연락주세요.
                    </p>
                  </div>
                </div>
              </div>

              {item.products && item.products.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-[#f0f0f0] mb-4">연관 상품</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {item.products.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="block border border-[#2a2a2a] hover:border-[#c9a96e] transition-colors bg-[#161616]"
                        data-testid={`product-card-${product.id}`}
                      >
                        <div className="aspect-square bg-[#1a1a1a] overflow-hidden">
                          <img
                            src={getProxiedImageUrl(product.imageUrl || "")}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-[#aaaaaa] line-clamp-2 mb-1">{product.name}</p>
                          <p className="text-sm font-bold text-[#f0f0f0]">{product.price?.toLocaleString()}원</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-[#2a2a2a] pt-6">
                {prevItem ? (
                  <Link 
                    href={`/choice/${prevItem.id}`}
                    className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#c9a96e]"
                    data-testid="choice-prev-button"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>이전글</span>
                  </Link>
                ) : (
                  <div />
                )}
                <Link 
                  href="/choice" 
                  className="px-6 py-2 bg-[#c9a96e] text-black text-sm hover:bg-[#b8925a]"
                  data-testid="choice-list-button"
                >
                  목록
                </Link>
                {nextItem ? (
                  <Link 
                    href={`/choice/${nextItem.id}`}
                    className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#c9a96e]"
                    data-testid="choice-next-button"
                  >
                    <span>다음글</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ChoiceList() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const { data: items = [] } = useQuery({
    queryKey: ['/api/content-sections', 'celeb_style'],
    queryFn: async () => {
      const res = await fetch('/api/content-sections?sectionType=celeb_style');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const filteredItems = items.filter((item: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(searchLower) || (item.celebrity || "").toLowerCase().includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />
      
      <main>
        <div className="bg-[#111111] border-b border-[#2a2a2a] py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-[#f0f0f0]">velour 초이스</h1>
            <div className="flex items-center gap-2 text-sm text-[#888888] mt-1">
              <Link href="/" className="hover:text-[#c9a96e]">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>velour 초이스</span>
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

              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-[#999999]">
                  <p className="text-lg mb-2">등록된 콘텐츠가 없습니다.</p>
                  <p className="text-sm">관리자가 콘텐츠를 등록하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {filteredItems.map((item: any) => (
                    <Link
                      key={item.id}
                      href={`/choice/${item.id}`}
                      className="block bg-[#161616] border border-[#2a2a2a] hover:border-[#c9a96e] transition-colors"
                      data-testid={`choice-item-${item.id}`}
                    >
                      <div className="aspect-square bg-[#1a1a1a] overflow-hidden">
                        <img
                          src={getProxiedImageUrl(item.imageUrl || "")}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                        />
                      </div>
                      <div className="p-3">
                        {item.celebrity && (
                          <p className="text-xs text-red-400 font-medium mb-1">
                            ({item.celebrity} PICK!!)
                          </p>
                        )}
                        <p className="text-xs text-[#aaaaaa] line-clamp-2 leading-relaxed">
                          {item.title}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

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

      <Footer />
    </div>
  );
}

export default function Choice() {
  const params = useParams<{ id?: string }>();
  
  if (params.id) {
    return <ChoiceDetail id={params.id} />;
  }
  
  return <ChoiceList />;
}
