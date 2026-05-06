import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, ArrowUp } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef, useCallback } from "react";

function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!showScrollTop) return null;

  return (
    <div className="fixed right-3 md:right-5 bottom-32 md:bottom-28 z-40 flex flex-col gap-2.5">
      <button
        onClick={scrollToTop}
        className="w-11 h-11 md:w-12 md:h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all hover:scale-105"
        data-testid="floating-scroll-top"
        aria-label="맨 위로"
      >
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    </div>
  );
}

function MainBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data: banners } = useQuery({
    queryKey: ['/api/banners'],
    queryFn: async () => {
      const res = await fetch('/api/banners');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const bannerList = banners && banners.length > 0 ? banners : [];

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerList.length]);

  if (bannerList.length === 0) {
    return (
      <section className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-[1200px] mx-auto px-4 py-16 md:py-24 text-center">
          <p className="text-white/60 text-sm">관리자 페이지에서 배너를 등록해주세요</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden" data-testid="main-banner">
      <div className="relative w-full overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {bannerList.map((banner: any, index: number) => (
            <div key={index} className="w-full flex-shrink-0 relative">
              <Link href={banner.linkUrl || "/products"} className="block w-full">
                <div className="block md:hidden leading-[0]">
                  <img 
                    src={banner.imageUrl}
                    alt={banner.title || `배너 ${index + 1}`}
                    className="w-full h-auto block"
                    loading="eager"
                  />
                </div>
                <div className="hidden md:block relative overflow-hidden" style={{ height: '480px' }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${banner.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(30px) brightness(0.7)',
                      transform: 'scale(1.2)',
                    }}
                  />
                  <div className="relative h-full flex items-center justify-center">
                    <img 
                      src={banner.imageUrl}
                      alt={banner.title || `배너 ${index + 1}`}
                      className="h-full w-auto max-w-none object-contain"
                      loading="eager"
                    />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {bannerList.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 bg-white/70 hover:bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm z-10"
            aria-label="이전"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerList.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 bg-white/70 hover:bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm z-10"
            aria-label="다음"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
        </>
      )}
    </section>
  );
}


function useSectionTitle(key: string, defaultTitle: string, defaultSubtitle: string) {
  const { data } = useQuery({
    queryKey: [`/api/settings/${key}`],
    queryFn: async () => {
      const res = await fetch(`/api/settings/${key}`);
      const data = await res.json();
      if (data.success && data.data?.value) {
        try { return JSON.parse(data.data.value); } catch { return null; }
      }
      return null;
    },
    staleTime: 60000,
  });
  return {
    title: data?.title || defaultTitle,
    subtitle: data?.subtitle || defaultSubtitle,
  };
}

function TopBrandSection() {
  const { title, subtitle } = useSectionTitle("home_topBrand", "Top Brand", "인기 탑 브랜드");
  const { data: topBrandsData } = useQuery({
    queryKey: ['/api/brands/top'],
    queryFn: async () => {
      const res = await fetch('/api/brands/top?limit=15');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const brandDisplayData = (topBrandsData || []).map((brand: any) => ({
    name: brand.name,
    displayImage: brand.representativeImage ? getProxiedImageUrl(brand.representativeImage, 'thumb') : '',
    brandId: brand.id,
    path: `/products?brand=${encodeURIComponent(brand.id)}`,
  }));

  return (
    <section className="bg-white py-6 md:py-8 border-b border-gray-100" data-testid="top-brand-section">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {brandDisplayData.slice(0, 15).map((brand: any) => (
            <Link
              key={brand.name}
              href={brand.path}
              className="flex flex-col items-center group"
              data-testid={`top-brand-${brand.name}`}
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                {brand.displayImage ? (
                  <img
                    src={brand.displayImage}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    loading="lazy"
                  />
                ) : (
                  <span className="text-gray-300 text-xs text-center">{brand.name}</span>
                )}
              </div>
              <span className="text-[10px] md:text-xs text-gray-600 mt-1.5 text-center group-hover:text-black transition-colors">{brand.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForYouSection({ products, brands }: { products: any[]; brands: any[] }) {
  const { title: sectionTitle, subtitle: sectionSubtitle } = useSectionTitle("home_forYou", "For You", "고객님을 위해 준비해 봤어요.");
  const [currentPage, setCurrentPage] = useState(0);

  if (products.length === 0) return null;

  const getBrandName = (brandId: string) => {
    const brand = brands?.find((b: any) => b.id === brandId);
    return brand?.name || 'BRAND';
  };

  const brandGroups: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const brand = p.brandId || "BRAND";
    if (!brandGroups[brand]) brandGroups[brand] = [];
    brandGroups[brand].push(p);
  });

  const diversifyProducts = (items: any[], count: number): any[] => {
    const categoryGroups: Record<string, any[]> = {};
    items.forEach((item) => {
      const cat = item.categoryId || item.subcategoryId || 'other';
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(item);
    });
    const categories = Object.keys(categoryGroups);
    if (categories.length <= 1) return items.slice(0, count);
    const result: any[] = [];
    const usedIds = new Set<string>();
    let catIndex = 0;
    while (result.length < count && usedIds.size < items.length) {
      const cat = categories[catIndex % categories.length];
      const catItems = categoryGroups[cat];
      const next = catItems.find((item: any) => !usedIds.has(String(item.id)));
      if (next) {
        usedIds.add(String(next.id));
        result.push(next);
      }
      catIndex++;
      if (catIndex >= categories.length * items.length) break;
    }
    return result;
  };

  const brandEntries: [string, any[]][] = Object.entries(brandGroups)
    .filter(([, items]) => items.length >= 2)
    .map(([brandId, items]) => [brandId, diversifyProducts(items, 6)]);

  const pairsPerPage = 2;
  const brandPairs: [string, any[]][][] = [];
  for (let i = 0; i < brandEntries.length; i += pairsPerPage) {
    brandPairs.push(brandEntries.slice(i, i + pairsPerPage));
  }

  const totalPages = brandPairs.length;

  const goToPrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };
  const goToNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const currentPairs = brandPairs[currentPage] || [];

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-end justify-between mb-6 md:mb-8 pb-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 italic" style={{ fontFamily: "'Playfair Display', serif" }}>{sectionTitle}</h2>
            <p className="text-sm md:text-base text-gray-500 mt-1.5">{sectionSubtitle}</p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{currentPage + 1} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPrev}
                  className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="foryou-prev"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={goToNext}
                  className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  data-testid="foryou-next"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {currentPairs.map(([brandId, items]) => {
            const brandName = getBrandName(brandId);
            return (
              <div key={brandId} className="border border-gray-100 rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm md:text-base text-gray-600">지금 뜨는 <span className="text-black font-bold underline underline-offset-4">{brandName}</span> 의 인기상품</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {items.slice(0, 6).map((product: any, idx: number) => (
                    <div
                      key={product.id}
                      data-testid={`foryou-product-${product.id}`}
                    >
                      <Link href={`/product/${product.id}`} className="block">
                        <div className="relative aspect-square bg-gray-50 overflow-hidden mb-2">
                          <div className="absolute top-1.5 right-1.5 z-10">
                            {product.viewCount > 0 && (
                              <span className="text-[10px] text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">조회 {Number(product.viewCount).toLocaleString()}</span>
                            )}
                          </div>
                          <img
                            src={getProxiedImageUrl(product.imageUrl, "medium")}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 uppercase font-medium tracking-wide">{brandName}</p>
                        <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{Number(product.price).toLocaleString()}원</p>
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                  <Link
                    href={`/products?brand=${encodeURIComponent(brandId)}`}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors border border-gray-200 px-6 py-2 rounded-sm hover:border-gray-400"
                    data-testid={`foryou-more-${brandId}`}
                  >
                    더보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


function ProductScrollRow({ products, getBrandName }: { products: any[]; getBrandName: (id: string) => string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - rowRef.current.offsetLeft;
    scrollLeft.current = rowRef.current.scrollLeft;
    rowRef.current.style.cursor = "grabbing";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    if (Math.abs(walk) > 4) hasDragged.current = true;
    rowRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (rowRef.current) rowRef.current.style.cursor = "grab";
  };

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  return (
    <div className="relative group/row">
      {/* 왼쪽 화살표 */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white border border-gray-200 shadow-md rounded-full items-center justify-center text-gray-600 hover:text-black transition-all -translate-x-3"
          aria-label="이전"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* 오른쪽 화살표 */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 hover:bg-white border border-gray-200 shadow-md rounded-full items-center justify-center text-gray-600 hover:text-black transition-all translate-x-3"
          aria-label="다음"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* 스크롤 행 */}
      <div
        ref={rowRef}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-3 select-none"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "grab",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {products.map((product: any) => {
          const hasDiscount = product.discountPercent && product.discountPercent > 0;
          const discountedPrice = hasDiscount
            ? Math.round(Number(product.price) * (100 - product.discountPercent) / 100 / 1000) * 1000
            : Number(product.price);

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              draggable={false}
              className="block group flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px]"
              data-testid={`section-product-${product.id}`}
              onClick={(e) => { if (hasDragged.current) e.preventDefault(); }}
            >
              <div className="aspect-square bg-gray-50 overflow-hidden mb-2 rounded-lg pointer-events-none">
                <img
                  src={getProxiedImageUrl(product.imageUrl, "medium")}
                  alt={product.name}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 uppercase font-semibold tracking-wide pointer-events-none">{getBrandName(product.brandId)}</p>
              <p className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-snug mt-0.5 pointer-events-none">{product.name}</p>
              {product.originalPrice && Number(product.originalPrice) > 0 && (
                <p className="text-[10px] md:text-xs text-gray-400 mt-1 pointer-events-none">매장가 {Math.round(Number(product.originalPrice) / 10000)}만원</p>
              )}
              <div className="mt-0.5 flex items-center gap-1.5 pointer-events-none">
                {hasDiscount && (
                  <span className="text-xs md:text-sm font-bold text-red-500">{product.discountPercent}%</span>
                )}
                <p className="text-xs md:text-sm font-bold text-gray-900">{discountedPrice.toLocaleString()}원</p>
              </div>
              <div className="flex gap-1 mt-1.5 pointer-events-none">
                <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">적립</span>
                <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-medium">무료배송</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 모바일 스크롤 힌트 (처음 한 번만) */}
      {canScrollRight && (
        <div className="md:hidden absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

function DynamicHomeSections() {
  const { data: sections } = useQuery({
    queryKey: ['/api/content-sections', 'homepage_product'],
    queryFn: async () => {
      const res = await fetch('/api/content-sections?sectionType=homepage_product');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: brandsData } = useQuery({
    queryKey: ['/api/brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const brands = brandsData || [];
  const getBrandName = (brandId: string) => {
    const brand = brands.find((b: any) => b.id === brandId);
    return brand?.name?.toUpperCase() || '';
  };

  const getMoreLink = (section: any) => {
    if (section.linkUrl) return section.linkUrl;
    if (section.brandName) {
      const brand = brands.find((b: any) => b.name?.toLowerCase() === section.brandName?.toLowerCase());
      if (brand) return `/products?brand=${encodeURIComponent(brand.id)}`;
    }
    if (section.categorySlug) return `/products/${section.categorySlug}`;
    return "/products";
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section: any) => (
        <section key={section.id} className="bg-white border-b border-gray-100" data-testid={`home-section-${section.id}`}>
          {section.imageUrl && (
            <Link href={getMoreLink(section)} className="block w-full">
              <img
                src={section.imageUrl}
                alt={section.title}
                className="w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </Link>
          )}

          {section.products && section.products.length > 0 && (
            <div className="max-w-[1200px] mx-auto px-4 py-6 md:py-10">
              <div className="flex items-end justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-base md:text-xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>{section.title}</h2>
                  {section.description && (
                    <p className="text-xs md:text-sm text-gray-500 mt-1">{section.description}</p>
                  )}
                </div>
                <Link
                  href={getMoreLink(section)}
                  className="text-xs md:text-sm text-gray-400 hover:text-black transition-colors flex-shrink-0"
                  data-testid={`section-more-${section.id}`}
                >
                  더보기
                </Link>
              </div>

              <ProductScrollRow products={section.products} getBrandName={getBrandName} />
            </div>
          )}
        </section>
      ))}
    </>
  );
}

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ['/api/products/home'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=60');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: brandsData } = useQuery({
    queryKey: ['/api/brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const products = productsData || [];
  const brands = brandsData || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <MainBannerSlider />
        <DynamicHomeSections />
        <TopBrandSection />
        <ForYouSection products={products} brands={brands} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
