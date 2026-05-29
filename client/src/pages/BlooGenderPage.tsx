import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { ChevronDown, ChevronRight, Menu, X, Loader2 } from "lucide-react";

// ─── Sidebar data ──────────────────────────────────────────────────────────────

const WOMEN_CLOTHING = ["티셔츠", "셔츠", "맨투맨", "후드/집업", "팬츠", "니트/가디건", "치마/원피스", "자켓", "패딩/베스트", "코트"];
const MEN_CLOTHING   = ["티셔츠", "셔츠", "맨투맨", "후드/후드집업", "팬츠", "니트", "가디건", "자켓", "패딩/베스트", "코트"];

// 여성 가방 브랜드 (bloostore1 /1447 기준)
const BAGS_BRANDS = [
  { label: "Hermes",          dbName: "에르메스" },
  { label: "Louis Vuitton",   dbName: "루이비통" },
  { label: "Dior",            dbName: "디올" },
  { label: "GUCCI",           dbName: "구찌" },
  { label: "PRADA",           dbName: "프라다" },
  { label: "Balenciaga",      dbName: "발렌시아가" },
  { label: "Bottega Veneta",  dbName: "보테가 베네타" },
  { label: "Goyard",          dbName: "고야드" },
  { label: "Burberry",        dbName: "버버리" },
  { label: "LOEWE",           dbName: "로에베" },
  { label: "CELINE",          dbName: "셀린느" },
  { label: "Chanel",          dbName: "샤넬" },
  { label: "Saint Laurent",   dbName: "생로랑" },
  { label: "FENDI",           dbName: "펜디" },
  { label: "miu miu",         dbName: "미우미우" },
];

// 남성 가방 브랜드 (bloostore1 /1212 기준)
const MEN_BAGS_BRANDS = [
  { label: "Louis Vuitton",  dbName: "루이비통" },
  { label: "Dior",           dbName: "디올" },
  { label: "GUCCI",          dbName: "구찌" },
  { label: "PRADA",          dbName: "프라다" },
  { label: "Balenciaga",     dbName: "발렌시아가" },
  { label: "Bottega Veneta", dbName: "보테가 베네타" },
  { label: "GOYARD",         dbName: "고야드" },
  { label: "Burberry",       dbName: "버버리" },
  { label: "LOEWE",          dbName: "로에베" },
  { label: "CELINE",         dbName: "셀린느" },
];

// 여성 신발 브랜드 (bloostore1 /656 기준)
const WOMEN_SHOES = ["샤넬", "에르메스", "디올", "구찌", "발렌시아가", "루이비통", "나이키", "뉴발란스", "프라다", "릭오웬스", "미하라 야스히로", "버버리", "이지부스트", "펜디"];
// 남성 신발 브랜드 (bloostore1 /220 기준)
const MEN_SHOES   = ["에르메스", "디올", "구찌", "발렌시아가", "루이비통", "나이키", "뉴발란스", "로로피아나", "프라다", "릭오웬스", "미하라 야스히로", "버버리", "이지부스트", "펜디"];

const ACCESSORIES = ["지갑", "모자", "벨트", "머플러", "팔찌", "목걸이", "반지", "키링"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterState {
  category?: string;
  search?: string;
  brandId?: string;
  label?: string; // display label for current selection
}

interface Brand { id: string; name: string; slug: string; }
interface Product {
  id: string; name: string; price: number; imageUrl: string;
  categoryId: string; brandId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function proxyImg(url: string) {
  if (!url) return "";
  if (url.includes("imweb.me") || url.includes("bloostore")) {
    return `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toLocaleString()}원` : "가격문의";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlooGenderPage({ gender }: { gender: "남성" | "여성" }) {
  const [location] = useLocation();
  const [filter, setFilter] = useState<FilterState>({});
  const [openL2, setOpenL2] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const isWomen = gender === "여성";
  const PAGE_SIZE = 60;

  // ── Brands data ──
  const { data: brandsData } = useQuery<{ success: boolean; data: Brand[] }>({
    queryKey: ["/api/brands"],
    queryFn: () => fetch("/api/brands").then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const brandNameMap = useMemo(() => {
    const map: Record<string, string> = {}; // name → id
    brandsData?.data?.forEach(b => { map[b.name] = b.id; });
    return map;
  }, [brandsData]);

  // ── Products data ──
  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("gender", gender);
    p.set("limit", String(PAGE_SIZE));
    p.set("offset", String(page * PAGE_SIZE));
    if (filter.category) p.set("category", filter.category);
    if (filter.search)   p.set("search", filter.search);
    if (filter.brandId)  p.set("brandId", filter.brandId);
    return p.toString();
  }, [gender, filter, page]);

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[]; total: number }>({
    queryKey: ["/api/products/gender", gender, filter, page],
    queryFn: () => fetch(`/api/products?${params}`).then(r => r.json()),
    staleTime: 30 * 1000,
  });

  const products = productsData?.data ?? [];
  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Sidebar helpers ──
  function selectAll() {
    setFilter({});
    setPage(0);
  }

  function selectCategory(cat: string, label: string) {
    setFilter({ category: cat, label });
    setPage(0);
    setOpenL2(prev => prev === cat ? null : cat);
  }

  function selectBrand(cat: string, brandItem: { label: string; dbName: string }) {
    const brandId = brandNameMap[brandItem.dbName];
    if (brandId) {
      setFilter({ category: cat, brandId, label: brandItem.label });
    } else {
      setFilter({ category: cat, search: brandItem.dbName, label: brandItem.label });
    }
    setPage(0);
  }

  function selectSearch(cat: string | undefined, search: string) {
    setFilter({ category: cat, search, label: search });
    setPage(0);
  }

  const isActive = (f: FilterState) => {
    if (!filter.category && !filter.search && !filter.brandId && !f.category && !f.search && !f.brandId) return true;
    if (filter.category !== f.category) return false;
    if (f.search && filter.search !== f.search && filter.label !== f.search) return false;
    if (f.brandId && filter.brandId !== f.brandId) return false;
    return true;
  };

  const clothing = isWomen ? WOMEN_CLOTHING : MEN_CLOTHING;
  const shoes = isWomen ? WOMEN_SHOES : MEN_SHOES;

  // ── Sidebar JSX ──
  const sidebarContent = (
    <nav className="text-[13px] text-gray-800 w-full">
      {/* 실시간 검수 사진 */}
      <Link href="/inspection">
        <div className="py-2 px-3 font-medium cursor-pointer hover:text-black flex items-center gap-1">
          실시간 검수 사진 <span className="text-green-600 font-bold">✓</span>
        </div>
      </Link>

      <div className="border-t border-gray-100 my-1" />

      {/* 남성 */}
      <Link href="/1212">
        <div className={`py-2 px-3 cursor-pointer hover:text-black flex items-center gap-1 ${!isWomen ? "font-bold border-l-2 border-black pl-2.5" : "text-gray-500"}`}>
          남성
        </div>
      </Link>

      {/* 여성 */}
      <div>
        <div
          className={`py-2 px-3 cursor-pointer hover:text-black flex items-center justify-between ${isWomen ? "font-bold" : "text-gray-500"}`}
          onClick={() => { if (!isWomen) return; setFilter({}); setPage(0); }}
        >
          <Link href="/537" className="flex-1">여성</Link>
        </div>

        {isWomen && (
          <div className="ml-3 border-l border-gray-200">
            {/* 여성 의류 */}
            <div>
              <div
                className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "clothing" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
                onClick={() => selectCategory("clothing", "여성 의류")}
              >
                <span>여성 의류</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "clothing" ? "rotate-180" : ""}`} />
              </div>
              {openL2 === "clothing" && (
                <div className="ml-3 border-l border-gray-100">
                  {clothing.map(sub => (
                    <div
                      key={sub}
                      className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.search === sub && filter.category === "clothing" ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                      onClick={() => selectSearch("clothing", sub)}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 여성 가방 */}
            <div>
              <div
                className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "bags" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
                onClick={() => selectCategory("bags", "여성 가방")}
              >
                <span>여성 가방</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "bags" ? "rotate-180" : ""}`} />
              </div>
              {openL2 === "bags" && (
                <div className="ml-3 border-l border-gray-100">
                  {BAGS_BRANDS.map(b => (
                    <div
                      key={b.label}
                      className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === b.label ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                      onClick={() => selectBrand("bags", b)}
                    >
                      {b.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 여성 신발 */}
            <div>
              <div
                className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "shoes" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
                onClick={() => selectCategory("shoes", "여성 신발")}
              >
                <span>여성 신발</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "shoes" ? "rotate-180" : ""}`} />
              </div>
              {openL2 === "shoes" && (
                <div className="ml-3 border-l border-gray-100">
                  {shoes.map(brand => (
                    <div
                      key={brand}
                      className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === brand ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                      onClick={() => {
                        const brandId = brandNameMap[brand];
                        if (brandId) setFilter({ category: "shoes", brandId, label: brand });
                        else setFilter({ category: "shoes", search: brand, label: brand });
                        setPage(0);
                      }}
                    >
                      {brand}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 여성 패션 잡화 */}
            <div>
              <div
                className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === undefined && filter.search && ACCESSORIES.includes(filter.search) ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
                onClick={() => setOpenL2(prev => prev === "accessories" ? null : "accessories")}
              >
                <span>여성 패션 잡화</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "accessories" ? "rotate-180" : ""}`} />
              </div>
              {openL2 === "accessories" && (
                <div className="ml-3 border-l border-gray-100">
                  {ACCESSORIES.map(item => (
                    <div
                      key={item}
                      className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === item ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                      onClick={() => selectSearch(undefined, item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 남성 sidebar (when on 남성 page) */}
      {!isWomen && (
        <div className="ml-3 border-l border-gray-200">
          {/* 남성 의류 */}
          <div>
            <div
              className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "clothing" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
              onClick={() => selectCategory("clothing", "남성 의류")}
            >
              <span>남성 의류</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "clothing" ? "rotate-180" : ""}`} />
            </div>
            {openL2 === "clothing" && (
              <div className="ml-3 border-l border-gray-100">
                {clothing.map(sub => (
                  <div
                    key={sub}
                    className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.search === sub && filter.category === "clothing" ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                    onClick={() => selectSearch("clothing", sub)}
                  >
                    {sub}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 남성 가방 */}
          <div>
            <div
              className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "bags" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
              onClick={() => selectCategory("bags", "남성 가방")}
            >
              <span>남성 가방</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "bags" ? "rotate-180" : ""}`} />
            </div>
            {openL2 === "bags" && (
              <div className="ml-3 border-l border-gray-100">
                {MEN_BAGS_BRANDS.map(b => (
                  <div
                    key={b.label}
                    className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === b.label ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                    onClick={() => selectBrand("bags", b)}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 남성 신발 */}
          <div>
            <div
              className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between ${filter.category === "shoes" ? "font-semibold border-l-2 border-black -ml-px pl-3" : ""}`}
              onClick={() => selectCategory("shoes", "남성 신발")}
            >
              <span>남성 신발</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "shoes" ? "rotate-180" : ""}`} />
            </div>
            {openL2 === "shoes" && (
              <div className="ml-3 border-l border-gray-100">
                {shoes.map(brand => (
                  <div
                    key={brand}
                    className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === brand ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                    onClick={() => {
                      const brandId = brandNameMap[brand];
                      if (brandId) setFilter({ category: "shoes", brandId, label: brand });
                      else setFilter({ category: "shoes", search: brand, label: brand });
                      setPage(0);
                    }}
                  >
                    {brand}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 남성 패션 잡화 */}
          <div>
            <div
              className="py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between"
              onClick={() => setOpenL2(prev => prev === "accessories" ? null : "accessories")}
            >
              <span>남성 패션 잡화</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openL2 === "accessories" ? "rotate-180" : ""}`} />
            </div>
            {openL2 === "accessories" && (
              <div className="ml-3 border-l border-gray-100">
                {ACCESSORIES.map(item => (
                  <div
                    key={item}
                    className={`py-1 px-3 cursor-pointer hover:text-black text-[12px] ${filter.label === item ? "font-semibold border-l-2 border-black -ml-px pl-3" : "text-gray-600"}`}
                    onClick={() => selectSearch(undefined, item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 my-1" />

      {/* 시계관 */}
      <Link href="/412">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">시계관</div>
      </Link>
      {/* 기획전 */}
      <Link href="/events">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">기획전</div>
      </Link>
      {/* 커뮤니티 */}
      <Link href="/notices">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">커뮤니티</div>
      </Link>
      {/* 오늘출발 */}
      <Link href="/products?same_day=true">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">오늘출발</div>
      </Link>
      {/* 썸머 */}
      <Link href="/choice">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">썸머</div>
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white" data-testid={`bloo-gender-page-${gender}`}>
      <Header />

      <div className="max-w-[1300px] mx-auto px-3 md:px-6 py-4">
        {/* ── 모바일 사이드바 토글 ── */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">
            {gender} {filter.label ? `> ${filter.label}` : "전체"}
          </div>
          <button
            data-testid="button-toggle-sidebar"
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
          >
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            카테고리
          </button>
        </div>

        {/* 모바일 사이드바 드로어 */}
        {sidebarOpen && (
          <div className="md:hidden border border-gray-200 rounded-lg mb-4 bg-white overflow-hidden">
            {sidebarContent}
          </div>
        )}

        {/* ── 데스크톱 2-panel 레이아웃 ── */}
        <div className="flex gap-8">
          {/* 사이드바 (데스크톱만) */}
          <aside className="hidden md:block w-[200px] flex-shrink-0 border-r border-gray-100 pr-4 pt-1">
            {sidebarContent}
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {/* 현재 경로 표시 */}
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 mb-4 border-b border-gray-100 pb-3">
              <span className="font-medium text-gray-700">{gender}</span>
              {filter.label && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>{filter.label}</span>
                </>
              )}
              <span className="ml-auto text-gray-400">{total.toLocaleString()}개 상품</span>
            </div>

            {/* 로딩 */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {/* 상품 그리드 */}
            {!isLoading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">해당 상품이 없습니다.</p>
                <button onClick={selectAll} className="mt-3 text-xs underline text-gray-500">
                  전체 상품 보기
                </button>
              </div>
            )}

            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map(product => {
                  const imgSrc = imgErrors[product.id]
                    ? product.imageUrl
                    : proxyImg(product.imageUrl);
                  return (
                    <Link key={product.id} href={`/product/${product.id}`}>
                      <div
                        data-testid={`product-card-${product.id}`}
                        className="group cursor-pointer"
                      >
                        <div
                          className="w-full bg-gray-100 overflow-hidden rounded-sm"
                          style={{ aspectRatio: "1/1" }}
                        >
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={() =>
                              setImgErrors(prev => ({ ...prev, [product.id]: true }))
                            }
                          />
                        </div>
                        <div className="mt-1.5 px-0.5">
                          <p className="text-[12px] md:text-[13px] text-gray-800 leading-tight line-clamp-2 break-keep">
                            {product.name}
                          </p>
                          <p className="text-[13px] md:text-[14px] font-semibold text-gray-900 mt-1">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const pageNum = page < 5
                    ? i
                    : page > totalPages - 6
                      ? totalPages - 10 + i
                      : page - 5 + i;
                  if (pageNum < 0 || pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1.5 text-xs border rounded ${
                        pageNum === page
                          ? "border-black bg-black text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
