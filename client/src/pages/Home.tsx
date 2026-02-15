import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Eye, Search, ArrowUp } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

function TrustIcons() {
  return (
    <div className="flex items-center gap-1 my-1.5">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#2563eb" opacity="0.15"/>
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
        <path d="M9 12l2 2 4-4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#059669" opacity="0.15"/>
        <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="1.5"/>
        <path d="M8 12l3 3 5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" fill="#d97706" opacity="0.15"/>
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="#d97706" strokeWidth="1.5"/>
        <path d="M3 10h18" stroke="#d97706" strokeWidth="1.5"/>
        <path d="M7 15h4" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function formatManwon(price: number): string {
  const manwon = Math.round(price / 10000);
  return `${manwon}만원`;
}

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
    <section className="relative w-full overflow-hidden bg-white" data-testid="main-banner">
      <div className="relative w-full">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {bannerList.map((banner: any, index: number) => (
              <div key={index} className="w-full flex-shrink-0">
                <Link href={banner.linkUrl || "/products"}>
                  <img 
                    src={banner.imageUrl}
                    alt={banner.title || `배너 ${index + 1}`}
                    className="w-full h-auto object-cover"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {bannerList.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerList.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm z-10"
            aria-label="이전"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerList.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-800 shadow-sm z-10"
            aria-label="다음"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {bannerList.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-black w-5' : 'bg-gray-300'
                }`}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function QuickMenu() {
  const menuItems = [
    { name: "VIP 명품관", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/a6692c83da347f0d21bc8a69e8454926.jpg", path: "/products/best" },
    { name: "실시간 검수", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3e9e18a74415a93d2d754b39fa016482.jpg", path: "/comparison" },
    { name: "셀럽 스타일", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/d793e88d91fbb9d2084399161d0b7bee.jpg", path: "/choice" },
    { name: "요청 상품", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3c6041db246c4bbacf7d845b020c5f0a.jpg", path: "/support" },
    { name: "기획전", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/4a50b842d7ca0484c98270d3ac8306d7.jpg", path: "/events" },
    { name: "베스트", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/db8043b0c1b097a55628db5c992d42be.jpg", path: "/reviews" },
    { name: "라이브", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/9ae31c3dcae26a14f6d33e8f261915b7.jpg", path: "/blog" },
    { name: "2월 혜택", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/cb42e567c3a7d720530b7d4b5c8b1864.png", path: "/events" },
    { name: "구매 후기", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/3e60fc4da68ecc883a6de2887e24871a.jpg", path: "/reviews" },
    { name: "라이크잇 랩스", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/e18260c9937b029fd70a2365ed71c48b.jpg", path: "/blog" },
  ];

  return (
    <section className="bg-white py-6 md:py-10 border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-3 md:flex-wrap md:justify-center md:overflow-x-visible">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className="flex flex-col items-center gap-2.5 group flex-shrink-0"
              data-testid={`quick-menu-${item.name}`}
            >
              <div className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full overflow-hidden bg-gray-50 group-hover:opacity-90 transition-opacity flex items-center justify-center">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="text-xs md:text-sm text-gray-600 text-center whitespace-nowrap group-hover:text-black transition-colors font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForYouSection({ products, brands }: { products: any[]; brands: any[] }) {
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

  if (products.length === 0) return null;

  const getBrandName = (brandId: string) => {
    const brand = brands?.find((b: any) => b.id === brandId);
    return brand?.name || 'BRAND';
  };

  const handleWishlistToggle = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(String(product.id));
    toggleItem({
      id: String(product.id),
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
    });
    toast({
      title: wasInWishlist ? "관심상품 삭제" : "관심상품 등록",
      description: wasInWishlist ? "삭제되었습니다." : "등록되었습니다.",
    });
  };

  const brandGroups: Record<string, any[]> = {};
  products.forEach((p: any) => {
    const brand = p.brandId || "BRAND";
    if (!brandGroups[brand]) brandGroups[brand] = [];
    brandGroups[brand].push(p);
  });

  const brandEntries = Object.entries(brandGroups).filter(([, items]) => items.length >= 2);

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="mb-6 md:mb-8 pb-5 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 italic" style={{ fontFamily: "'Playfair Display', serif" }}>For You</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1.5">고객님을 위해 준비해 봤어요.</p>
        </div>

        <div className="space-y-12">
          {brandEntries.map(([brandId, items]) => {
            const brandName = getBrandName(brandId);
            return (
              <div key={brandId}>
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Search className="w-5 h-5 text-gray-400" />
                    <span className="text-base md:text-lg text-gray-600">지금 뜨는 <span className="text-black font-bold underline underline-offset-4">{brandName}</span> 의 인기상품</span>
                  </div>
                  <Link
                    href={`/products?brand=${encodeURIComponent(brandId)}`}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                    data-testid={`foryou-more-${brandId}`}
                  >
                    더보기
                  </Link>
                </div>

                <div className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-3">
                  {items.slice(0, 10).map((product: any, idx: number) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-[170px] md:w-[200px]"
                      data-testid={`foryou-product-${product.id}`}
                    >
                      <Link href={`/product/${product.id}`} className="block">
                        <div className="relative aspect-square bg-gray-50 overflow-hidden mb-2.5">
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                            <span className="text-lg font-black text-black/80">{idx + 1}</span>
                            {product.viewCount > 0 && (
                              <span className="text-[11px] text-gray-500">조회 {Number(product.viewCount).toLocaleString()}</span>
                            )}
                          </div>
                          <img
                            src={getProxiedImageUrl(product.imageUrl, "medium")}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">{brandName}</p>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-snug mt-1">{product.name}</p>
                        {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                          <p className="text-xs text-gray-400 mt-1.5">매장가 {formatManwon(Number(product.originalPrice))}</p>
                        )}
                        <TrustIcons />
                        <div className="flex items-center gap-1.5">
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <span className="text-xs text-red-500 font-bold">{product.discountPercent}%</span>
                          ) : (
                            <span className="text-xs text-gray-400">0%</span>
                          )}
                          <p className="text-sm md:text-base font-bold text-gray-900">{Number(product.price).toLocaleString()}원</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">즉시구매가</p>
                      </Link>
                      <div className="flex items-center gap-0 mt-2 border-t border-gray-100 pt-2">
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] hover:bg-gray-50 transition-colors ${
                            isInWishlist(String(product.id)) ? 'text-red-500' : 'text-gray-500'
                          }`}
                          data-testid={`foryou-wishlist-${product.id}`}
                        >
                          <Heart className={`w-3 h-3 ${isInWishlist(String(product.id)) ? 'fill-current' : ''}`} />
                          관심상품
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast({ title: "장바구니", description: "장바구니에 추가되었습니다." });
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
                          data-testid={`foryou-cart-${product.id}`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          장바구니
                        </button>
                        <span className="text-gray-200">|</span>
                        <Link
                          href={`/product/${product.id}`}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50 transition-colors"
                          data-testid={`foryou-preview-${product.id}`}
                        >
                          <Eye className="w-3 h-3" />
                          퀵프리뷰
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ['/api/products/home'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=50');
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
        <ForYouSection products={products} brands={brands} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
