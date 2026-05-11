import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, ArrowUp, Star, Camera } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef, useCallback } from "react";

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

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


function maskName(name: string): string {
  if (!name) return "익명";
  if (name.length <= 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function toReviewProxyUrl(url: string): string {
  if (!url) return url;
  if (url.includes('cdn.imweb.me') || (url.includes('bloostore.co.kr') && !url.startsWith('/'))) {
    return `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function HomeReviewsSection() {
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

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews/home-preview'],
    queryFn: async () => {
      const res = await fetch('/api/reviews?limit=20&photoOnly=true');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 120000,
  });

  const reviews: any[] = reviewsData || [];
  if (reviews.length === 0) return null;

  return (
    <section className="bg-[#f8f8f8] py-10 md:py-16" data-testid="home-reviews-section">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2 text-gray-900">
          REVIEW
        </h2>
        <p className="text-center text-sm text-gray-400 mb-6 md:mb-10">고객님들의 솔직한 후기</p>

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 shadow items-center justify-center text-gray-700 hover:bg-gray-50 transition-all -translate-x-5"
              aria-label="이전"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-300 shadow items-center justify-center text-gray-700 hover:bg-gray-50 transition-all translate-x-5"
              aria-label="다음"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={rowRef}
            className="flex gap-4 md:gap-5 overflow-x-auto pb-2 select-none"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {reviews.map((review: any, idx: number) => {
              const thumb = review.imageUrls?.length > 0
                ? toReviewProxyUrl(review.imageUrls[0])
                : review.imageUrl
                  ? toReviewProxyUrl(review.imageUrl)
                  : review.productImageUrl || null;

              return (
                <Link
                  key={review.id}
                  href="/reviews"
                  draggable={false}
                  onClick={(e) => { if (hasDragged.current) e.preventDefault(); }}
                  className="flex-shrink-0 w-[220px] md:w-[260px] group block bg-white border border-gray-200 hover:shadow-md transition-all duration-200"
                  data-testid={`home-review-${review.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt="후기 사진"
                        draggable={false}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Camera className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-4xl font-black text-white/80 leading-none" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    {review.productName && (
                      <p className="text-[10px] text-gray-400 mb-0.5 truncate">({review.productName})</p>
                    )}
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{review.content || review.title}</p>
                    <div className="flex items-center gap-0.5 mt-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {canScrollRight && (
            <div className="md:hidden absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#f8f8f8]/80 to-transparent pointer-events-none" />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">↔ 손가락으로 좌우 스크롤해 주세요.</p>
        <div className="text-center mt-6">
          <Link
            href="/reviews"
            className="inline-block px-10 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            data-testid="home-reviews-more"
          >
            More view
          </Link>
        </div>
      </div>
    </section>
  );
}

function useSectionTitle(_key: string, defaultTitle: string, defaultSubtitle: string) {
  return { title: defaultTitle, subtitle: defaultSubtitle };
}

function TopBrandSection() {
  const { title, subtitle } = useSectionTitle("home_topBrand", "Top Brand", "인기 탑 브랜드");
  const { data: topBrandsData } = useQuery({
    queryKey: ['/api/brands/top'],
    queryFn: async () => {
      const res = await fetch('/api/brands/top?limit=15');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
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


function SectionProductCard({ product, getBrandName }: { product: any; getBrandName: (id: string) => string }) {
  const hasDiscount = product.discountPercent && product.discountPercent > 0;
  const discountedPrice = hasDiscount
    ? Math.round(Number(product.price) * (100 - product.discountPercent) / 100 / 1000) * 1000
    : Number(product.price);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block bg-white border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      data-testid={`section-product-${product.id}`}
    >
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
        <img
          src={getProxiedImageUrl(product.imageUrl, "medium")}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
        />
        <div className="absolute top-0 right-0 flex flex-col">
          {hasDiscount && (
            <span className="bg-[#5E9DC0] text-white text-[9px] px-1.5 py-1 font-bold leading-none">주간</span>
          )}
          {product.isNew && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-1 font-bold leading-none">신상</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wide truncate mb-0.5">{getBrandName(product.brandId)}</p>
        <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-2">{product.name}</p>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{Number(product.price).toLocaleString()}원</span>
          )}
          <span className="text-sm font-extrabold text-gray-900">{discountedPrice.toLocaleString()}원</span>
          {hasDiscount && (
            <span className="text-xs text-red-500 font-bold">{product.discountPercent}%</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function DynamicHomeSections({ brands }: { brands: any[] }) {
  const { data: sections } = useQuery({
    queryKey: ['/api/content-sections', 'homepage_product'],
    queryFn: async () => {
      const res = await fetch('/api/content-sections?sectionType=homepage_product');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
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
        <SectionBlock key={section.id} section={section} getMoreLink={getMoreLink} getBrandName={getBrandName} />
      ))}
    </>
  );
}

function SectionBlock({ section, getMoreLink, getBrandName }: { section: any; getMoreLink: (s: any) => string; getBrandName: (id: string) => string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <section
      ref={ref}
      className="bg-white border-b border-gray-100"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
      data-testid={`home-section-${section.id}`}
    >
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
        <div className="max-w-[1200px] mx-auto px-4 py-10 md:py-16">
          <h2 className="text-center text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2 text-gray-900">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-center text-sm text-gray-400 mb-8">{section.description}</p>
          )}
          {!section.description && <div className="mb-8" />}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {section.products.slice(0, 8).map((product: any) => (
              <SectionProductCard key={product.id} product={product} getBrandName={getBrandName} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href={getMoreLink(section)}
              className="inline-block px-12 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
              data-testid={`section-more-${section.id}`}
            >
              More view
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ['/api/products/home'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=24');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['/api/brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands');
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData || [];
  const brands = brandsData || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <TopBrandSection />
        <HomeReviewsSection />
        <DynamicHomeSections brands={brands} />
        <ForYouSection products={products} brands={brands} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
