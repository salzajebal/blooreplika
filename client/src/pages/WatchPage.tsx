import { useState, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Menu, X, Loader2 } from "lucide-react";

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

interface WatchBrand {
  name: string;
  nameKo: string;
  path: string;
  imageUrl: string;
}

const WATCH_BRANDS: WatchBrand[] = [
  {
    name: "롤렉스",
    nameKo: "롤렉스",
    path: "/412",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/04f4d58eb0545.jpg",
  },
  {
    name: "까르띠에",
    nameKo: "까르띠에",
    path: "/413",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/c706aed92c485.jpg",
  },
  {
    name: "IWC",
    nameKo: "IWC",
    path: "/415",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/67ef8062baf38.gif",
  },
  {
    name: "파텍필립",
    nameKo: "파텍필립",
    path: "/1337",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/f2876d4d47de7.gif",
  },
  {
    name: "오데마피게",
    nameKo: "오데마피게",
    path: "/416",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/d2f9fc444a8bc.gif",
  },
  {
    name: "브라이틀링",
    nameKo: "브라이틀링",
    path: "/417",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/01a71fce876f1.jpg",
  },
  {
    name: "오메가",
    nameKo: "오메가",
    path: "/418",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/a43026673fad5.gif",
  },
  {
    name: "샤넬",
    nameKo: "샤넬",
    path: "/419",
    imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/94a686e75e855.jpg",
  },
];

const PAGE_SIZE = 60;

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  brandId?: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

export default function WatchPage({ brandPath }: { brandPath: string }) {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Mouse drag-scroll for brand icon row
  const brandIconScrollRef = useRef<HTMLDivElement>(null);
  const brandIconIsDragging = useRef(false);
  const brandIconDidDrag = useRef(false);
  const brandIconStartX = useRef(0);
  const brandIconScrollLeft = useRef(0);
  const brandIconMouseDown = (e: React.MouseEvent) => {
    if (!brandIconScrollRef.current) return;
    brandIconIsDragging.current = true;
    brandIconDidDrag.current = false;
    brandIconStartX.current = e.clientX;
    brandIconScrollLeft.current = brandIconScrollRef.current.scrollLeft;
  };
  const brandIconMouseMove = (e: React.MouseEvent) => {
    if (!brandIconIsDragging.current || !brandIconScrollRef.current) return;
    const walk = e.clientX - brandIconStartX.current;
    if (Math.abs(walk) > 4) brandIconDidDrag.current = true;
    brandIconScrollRef.current.scrollLeft = brandIconScrollLeft.current - walk;
  };
  const brandIconMouseUp = () => { brandIconIsDragging.current = false; };

  const activeBrand = WATCH_BRANDS.find(b => b.path === brandPath) ?? WATCH_BRANDS[0];

  const { data: brandsData } = useQuery<{ success: boolean; data: Brand[] }>({
    queryKey: ["/api/brands"],
    queryFn: () => fetch("/api/brands").then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const brandId = useMemo(() => {
    const list = brandsData?.data ?? [];
    const match = list.find(b =>
      b.name === activeBrand.nameKo ||
      b.name.includes(activeBrand.nameKo) ||
      activeBrand.nameKo.includes(b.name)
    );
    return match?.id;
  }, [brandsData, activeBrand]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("category", "watches");
    p.set("limit", String(PAGE_SIZE));
    p.set("offset", String(page * PAGE_SIZE));
    if (brandId) p.set("brandId", brandId);
    else p.set("search", activeBrand.nameKo);
    return p.toString();
  }, [brandId, activeBrand, page]);

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[]; total: number }>({
    queryKey: ["/api/products/watches", brandPath, brandId, page],
    queryFn: () => fetch(`/api/products?${params}`).then(r => r.json()),
    staleTime: 30 * 1000,
  });

  const products = productsData?.data ?? [];
  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const sidebarContent = (
    <nav className="text-[13px] text-gray-800 w-full">
      <Link href="/inspection">
        <div className="py-2 px-3 font-medium cursor-pointer hover:text-black flex items-center gap-1">
          실시간 검수 사진 <span className="text-green-600 font-bold">✓</span>
        </div>
      </Link>
      <div className="border-t border-gray-100 my-1" />

      <Link href="/httpstheblooshop1496458051">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black font-semibold">남성</div>
      </Link>
      <Link href="/497">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black font-semibold">여성</div>
      </Link>

      <div className="border-t border-gray-100 my-1" />

      {/* 시계관 - 활성화 */}
      <div>
        <div className="py-2 px-3 font-bold text-black cursor-pointer">시계관</div>
        <div className="ml-3 border-l border-gray-200">
          {WATCH_BRANDS.map(brand => {
            const isActive = brand.path === brandPath;
            return (
              <div
                key={brand.path}
                onClick={() => setLocation(brand.path)}
                className={`py-1.5 px-3 cursor-pointer text-[12.5px] hover:text-black transition-colors ${
                  isActive
                    ? "font-bold text-black border-l-2 border-black -ml-px pl-3"
                    : "text-gray-500"
                }`}
              >
                {brand.nameKo}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 my-1" />
      <Link href="/events">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">기획전</div>
      </Link>
      <Link href="/notices">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">커뮤니티</div>
      </Link>
      <Link href="/choice">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">썸머</div>
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white" data-testid="watch-page">
      <Header />

      <div className="max-w-[1300px] mx-auto px-3 md:px-6 py-4">
        {/* 모바일 토글 */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">
            시계관 &gt; {activeBrand.nameKo}
          </div>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
          >
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            카테고리
          </button>
        </div>

        {sidebarOpen && (
          <div className="md:hidden border border-gray-200 rounded-lg mb-4 bg-white overflow-hidden">
            {sidebarContent}
          </div>
        )}

        {/* 2-panel 레이아웃 */}
        <div className="flex gap-8">
          {/* 사이드바 (데스크탑) */}
          <aside className="hidden md:block w-[200px] flex-shrink-0 border-r border-gray-100 pr-4 pt-1">
            {sidebarContent}
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-8">
            {/* 경로 표시 */}
            <div className="hidden md:flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>시계관</span>
                <span className="mx-1">&gt;</span>
                <span className="font-semibold text-gray-900">{activeBrand.nameKo}</span>
              </div>
              <span className="text-xs text-gray-400">{total.toLocaleString()}개 상품</span>
            </div>

            {/* ── 브랜드 아이콘 원형 (bloostore1 412 스타일) ── */}
            <div className="mb-6 -mx-3 md:mx-0">
              <div
                ref={brandIconScrollRef}
                className="flex gap-1 md:gap-3 overflow-x-auto px-3 md:px-0 pb-1 cursor-grab active:cursor-grabbing"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
                onMouseDown={brandIconMouseDown}
                onMouseMove={brandIconMouseMove}
                onMouseUp={brandIconMouseUp}
                onMouseLeave={brandIconMouseUp}
              >
                {WATCH_BRANDS.map(brand => {
                  const isActive = brand.path === brandPath;
                  return (
                    <div
                      key={brand.path}
                      onClick={() => { if (!brandIconDidDrag.current) setLocation(brand.path); }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
                      style={{ minWidth: 70 }}
                      data-testid={`watch-brand-icon-${brand.nameKo}`}
                    >
                      <div
                        className={`w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden border-2 transition-all ${
                          isActive
                            ? "border-gray-800 shadow-md"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={proxyImg(brand.imageUrl)}
                          alt={brand.nameKo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = brand.imageUrl;
                          }}
                        />
                      </div>
                      <span
                        className={`text-[11px] md:text-[12px] text-center leading-tight break-keep ${
                          isActive ? "font-bold text-black" : "text-gray-600"
                        }`}
                      >
                        {brand.nameKo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 정렬 */}
            <div className="flex items-center justify-end mb-3">
              <select className="text-xs border border-gray-200 px-2 py-1.5 text-gray-600 focus:outline-none">
                <option>등록순</option>
                <option>인기순</option>
                <option>가격 낮은순</option>
                <option>가격 높은순</option>
              </select>
            </div>

            {/* 로딩 */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {/* 상품 없음 */}
            {!isLoading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-4xl mb-3">⌚</div>
                <p className="text-sm">해당 상품이 없습니다.</p>
              </div>
            )}

            {/* 상품 그리드 */}
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
                          <div className="mt-1 text-gray-300 text-lg">🛒</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const pageNum = page < 4
                    ? i
                    : page > totalPages - 4
                    ? totalPages - 7 + i
                    : page - 3 + i;
                  if (pageNum < 0 || pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded ${
                        pageNum === page
                          ? "bg-black text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
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
