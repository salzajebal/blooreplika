import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, ArrowUp } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect } from "react";

function FloatingButtons() {
  const [kakaoLink, setKakaoLink] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    fetch("/api/settings/kakaoTalkLink")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.value) setKakaoLink(data.data.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openKakaoChat = () => {
    if (kakaoLink) window.open(kakaoLink, "_blank");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  return (
    <div className="fixed right-3 md:right-5 bottom-24 md:bottom-20 z-50 flex flex-col gap-2.5">
      <button 
        onClick={openKakaoChat}
        className="w-12 h-12 md:w-14 md:h-14 bg-[#FEE500] border-0 rounded-full shadow-lg flex flex-col items-center justify-center hover:bg-[#F5DC00] transition-all hover:scale-105"
        data-testid="floating-support"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.65 6.76l-.95 3.54c-.08.3.24.55.52.41l4.17-2.27c.53.06 1.07.09 1.61.09 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
        </svg>
      </button>
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-200 rounded-full shadow-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all hover:scale-105"
          data-testid="floating-scroll-top"
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      )}
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
                {banner.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                    <div className="p-5 md:p-10 text-white">
                      <h2 className="text-lg md:text-3xl font-bold mb-1 md:mb-2 drop-shadow-lg">{banner.title}</h2>
                      {banner.subtitle && (
                        <p className="text-xs md:text-base text-white/80 drop-shadow">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>
                )}
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

function QuickMenu() {
  const menuItems = [
    { name: "VIP 명품관", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/a6692c83da347f0d21bc8a69e8454926.jpg", path: "/products/best" },
    { name: "실시간 검수", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3e9e18a74415a93d2d754b39fa016482.jpg", path: "/inspection" },
    { name: "셀럽 스타일", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/d793e88d91fbb9d2084399161d0b7bee.jpg", path: "/choice" },
    { name: "요청 상품", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3c6041db246c4bbacf7d845b020c5f0a.jpg", path: "/support" },
    { name: "기획전", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/4a50b842d7ca0484c98270d3ac8306d7.jpg", path: "/events" },
    { name: "베스트", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/db8043b0c1b097a55628db5c992d42be.jpg", path: "/best" },
    { name: "라이브", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/9ae31c3dcae26a14f6d33e8f261915b7.jpg", path: "/live" },
    { name: "이달의 혜택", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/cb42e567c3a7d720530b7d4b5c8b1864.png", path: "/benefits" },
    { name: "구매 후기", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3e60fc4da68ecc883a6de2887e24871a.jpg", path: "/reviews" },
    { name: "라이크잇 랩스", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/e18260c9937b029fd70a2365ed71c48b.jpg", path: "https://xn--oi2bw61awb384c.kr/labs" },
  ];

  return (
    <section className="bg-white py-5 md:py-8 border-b border-gray-100">
      <div className="max-w-[600px] md:max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-5 gap-y-4 gap-x-2 md:gap-x-6 md:gap-y-6 md:flex md:flex-wrap md:justify-center">
          {menuItems.map((item) => {
            const isExternal = item.path.startsWith("http");
            if (isExternal) {
              return (
                <a
                  key={item.name}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 md:gap-2.5 group"
                  data-testid={`quick-menu-${item.name}`}
                >
                  <div className="w-[52px] h-[52px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden bg-gray-50 group-hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] md:text-xs text-gray-600 font-medium text-center leading-tight">{item.name}</span>
                </a>
              );
            }
            return (
            <Link
              key={item.name}
              href={item.path}
              className="flex flex-col items-center gap-1.5 md:gap-2.5 group"
              data-testid={`quick-menu-${item.name}`}
            >
              <div className="w-[52px] h-[52px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden bg-gray-50 group-hover:opacity-90 transition-opacity flex items-center justify-center shadow-sm">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="text-[11px] md:text-xs text-gray-600 text-center leading-tight group-hover:text-black transition-colors font-medium line-clamp-2 w-full">{item.name}</span>
            </Link>
          );
          })}
        </div>
      </div>
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

function InspectionSection() {
  const { data: inspections } = useQuery({
    queryKey: ['/api/inspections/home'],
    queryFn: async () => {
      const res = await fetch('/api/inspections');
      const data = await res.json();
      return data.data || [];
    }
  });

  const { data: shippingPhotos } = useQuery({
    queryKey: ['/api/shipping-photos/home'],
    queryFn: async () => {
      const res = await fetch('/api/shipping-photos');
      const data = await res.json();
      return data.data || [];
    }
  });

  const inspList = (inspections || []).slice(0, 8);
  const shipList = (shippingPhotos || []).slice(0, 8);

  if (inspList.length === 0 && shipList.length === 0) return null;

  const getMediaUrl = (url: string) => {
    if (!url) return DEFAULT_IMAGE;
    if (url.startsWith("/objects/") || url.startsWith("/uploads/")) return url;
    return getProxiedImageUrl(url);
  };

  return (
    <section className="bg-white py-8 md:py-12 border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold tracking-wide">실시간 검수</h2>
          <Link href="/inspection" className="text-xs md:text-sm text-gray-400 hover:text-black transition-colors">
            더보기 &gt;
          </Link>
        </div>

        {inspList.length > 0 && (
          <div className="overflow-x-auto pb-4 -mx-4 px-4 mb-8">
            <div className="flex gap-3 md:gap-4" style={{ minWidth: "min-content" }}>
              {inspList.map((item: any) => (
                <Link
                  key={item.id}
                  href="/inspection"
                  className="flex-shrink-0 w-[130px] md:w-[160px] group"
                  data-testid={`home-inspection-${item.id}`}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                    {item.mediaType === "video" ? (
                      <video
                        src={getMediaUrl(item.imageUrl)}
                        className="w-full h-full object-cover"
                        autoPlay loop muted playsInline
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.imageUrl)}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{item.productName}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {shipList.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold tracking-wide">발송전실사</h3>
            </div>
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-3 md:gap-4" style={{ minWidth: "min-content" }}>
                {shipList.map((item: any) => (
                  <Link
                    key={item.id}
                    href="/inspection"
                    className="flex-shrink-0 w-[130px] md:w-[160px] group"
                    data-testid={`home-shipping-${item.id}`}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                      {item.mediaType === "video" ? (
                        <video
                          src={getMediaUrl(item.imageUrl)}
                          className="w-full h-full object-cover"
                          autoPlay loop muted playsInline
                        />
                      ) : (
                        <img
                          src={getMediaUrl(item.imageUrl)}
                          alt={item.brandName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800">{item.brandName}</p>
                    <p className="text-[10px] text-gray-400">{item.photoDate} {item.customerName}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
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
    return brand?.name || '';
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section: any) => (
        <section key={section.id} className="bg-white" data-testid={`home-section-${section.id}`}>
          {section.imageUrl && (
            <Link href={section.linkUrl || "/products"} className="block w-full">
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
                  <h2 className="text-base md:text-xl font-bold tracking-wide uppercase">{section.title}</h2>
                  {section.description && (
                    <p className="text-xs md:text-sm text-gray-500 mt-1">{section.description}</p>
                  )}
                </div>
                <Link
                  href={section.linkUrl || `/products${section.categorySlug ? `?category=${section.categorySlug}` : ''}`}
                  className="text-xs md:text-sm text-gray-400 hover:text-black transition-colors"
                  data-testid={`section-more-${section.id}`}
                >
                  더보기
                </Link>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {section.products.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="block group"
                    data-testid={`section-product-${product.id}`}
                  >
                    <div className="aspect-square bg-gray-50 overflow-hidden mb-2">
                      <img
                        src={getProxiedImageUrl(product.imageUrl, "medium")}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase font-medium tracking-wide">{getBrandName(product.brandId)}</p>
                    <p className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                    <div className="mt-1">
                      <p className="text-xs md:text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</p>
                    </div>
                  </Link>
                ))}
              </div>
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
      const res = await fetch('/api/products?limit=200');
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
        <QuickMenu />
        <DynamicHomeSections />
        <InspectionSection />
        <TopBrandSection />
        <ForYouSection products={products} brands={brands} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
