import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, HelpCircle, Eye, Search } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

function FloatingButtons() {
  const [kakaoLink, setKakaoLink] = useState("");
  
  useEffect(() => {
    fetch("/api/settings/kakaoTalkLink")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.value) setKakaoLink(data.data.value);
      })
      .catch(() => {});
  }, []);

  const openKakaoChat = () => {
    if (kakaoLink) window.open(kakaoLink, "_blank");
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
      <Link 
        href="/notices"
        className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-200 rounded-full shadow-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-all hover:scale-105"
        data-testid="floating-qa"
      >
        <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
      </Link>
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
                    style={{ minHeight: '300px', maxHeight: '600px' }}
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
    { name: "이벤트", image: "https://pliki.wisacdn.com/_data/banner/user_group_banner/pliki_202405/84/cb42e567c3a7d720530b7d4b5c8b1864.png", path: "/events" },
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

  const brandEntries = Object.entries(brandGroups).filter(([, items]) => items.length >= 2);

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 italic" style={{ fontFamily: "'Playfair Display', serif" }}>For You</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1.5">고객님을 위해 준비해 봤어요.</p>
        </div>

        <div className="space-y-10">
          {brandEntries.map(([brandId, items]) => {
            const brandName = getBrandName(brandId);
            return (
              <div key={brandId} className="border border-gray-100 rounded-lg p-5 md:p-8">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
                  <Search className="w-5 h-5 text-gray-400" />
                  <span className="text-base md:text-lg text-gray-600">지금 뜨는 <span className="text-black font-bold underline underline-offset-4">{brandName}</span> 의 인기상품</span>
                </div>

                <div className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-3">
                  {items.slice(0, 10).map((product: any, idx: number) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="flex-shrink-0 w-[160px] md:w-[200px] group"
                      data-testid={`foryou-product-${product.id}`}
                    >
                      <div className="relative aspect-square bg-gray-50 rounded overflow-hidden mb-2.5">
                        <div className="absolute top-2 left-2 w-7 h-7 bg-black/70 text-white text-xs font-bold rounded-full flex items-center justify-center z-10">
                          {idx + 1}
                        </div>
                        <img
                          src={getProxiedImageUrl(product.imageUrl, "medium")}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                        {product.viewCount > 0 && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-500 bg-white/90 rounded px-2 py-1">
                            <Eye className="w-3.5 h-3.5" />
                            {Number(product.viewCount).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">{brandName}</p>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-snug mt-1">{product.name}</p>
                      <div className="mt-1.5">
                        <span className="text-xs text-gray-400">즉시구매가</span>
                        <p className="text-sm md:text-base font-bold text-gray-900">{Number(product.price).toLocaleString()}원</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="flex justify-center mt-5">
                  <Link
                    href={`/products?brand=${encodeURIComponent(brandId)}`}
                    className="text-sm text-gray-500 border border-gray-200 rounded px-8 py-2.5 hover:border-gray-400 hover:text-black transition-colors"
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

function NewArrivalsSection({ products }: { products: any[] }) {
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const handleWishlistToggle = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(product.id);
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    toast({
      title: wasInWishlist ? "관심상품 삭제" : "관심상품 등록",
      description: wasInWishlist ? "삭제되었습니다." : "등록되었습니다.",
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-14 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">신상품</h2>
            <p className="text-sm text-gray-500 mt-1">새로 입고된 상품을 확인해보세요</p>
          </div>
          <Link href="/products" className="text-sm text-gray-500 hover:text-black border border-gray-300 px-5 py-2 rounded-full transition-colors">
            전체보기
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {products.slice(0, 8).map((product: any) => (
            <Link 
              key={product.id}
              href={`/product/${product.id}`} 
              className="bg-white overflow-hidden group hover:shadow-md transition-all border border-gray-100"
              data-testid={`product-card-${product.id}`}
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={getProxiedImageUrl(product.imageUrl, "medium")} 
                  alt={product.name} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
                {product.isBest && (
                  <span className="absolute top-2 left-2 bg-black text-white text-[10px] px-2.5 py-1 font-bold">BEST</span>
                )}
                {product.isNew && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2.5 py-1 font-bold">NEW</span>
                )}
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">SOLD OUT</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button 
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                      isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    data-testid={`button-wishlist-new-${product.id}`}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">{product.brandId || "BRAND"}</p>
                <h3 className="text-sm md:text-base text-gray-800 line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                <div className="flex items-baseline gap-1.5">
                  {product.discountPercent > 0 && (
                    <span className="text-red-500 text-sm font-bold">{product.discountPercent}%</span>
                  )}
                  <span className="text-base md:text-lg font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewSection({ reviews }: { reviews: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getReviewImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    const validUrls = urls.filter((url: string) => !url.includes('/data/file/bestreview/') && !url.includes('/data/file/kalreom/'));
    return validUrls.length > 0 ? validUrls[0] : null;
  };

  const validReviews = reviews.filter(r => getReviewImage(r) !== null);
  if (validReviews.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-14 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">구매후기</h2>
            <p className="text-sm text-gray-500 mt-1">고객님들의 소중한 리뷰</p>
          </div>
          <Link href="/reviews" className="text-sm text-gray-500 hover:text-black border border-gray-300 px-5 py-2 rounded-full transition-colors">
            전체보기
          </Link>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-3"
        >
          {validReviews.slice(0, 20).map((review: any) => {
            const imageUrl = getReviewImage(review);
            return (
              <Link 
                key={review.id}
                href={`/reviews/${review.id}`}
                className="flex-shrink-0 w-[180px] md:w-[220px] group"
                data-testid={`purchase-review-${review.id}`}
              >
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2.5">
                  <img 
                    src={getProxiedImageUrl(imageUrl!, "medium")}
                    alt={review.title || '후기'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                  />
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed px-0.5">
                  {review.content || review.title}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NoticeSection({ notices }: { notices: any[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-14 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">공지사항</h2>
          <Link href="/notices" className="text-sm text-gray-500 hover:text-black transition-colors">
            더보기
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {notices.slice(0, 6).map((notice: any) => (
            <Link 
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="flex items-center justify-between py-4 hover:bg-gray-50 transition-colors group px-2"
              data-testid={`notice-card-${notice.id}`}
            >
              <p className="text-base text-gray-800 line-clamp-1 group-hover:text-black transition-colors flex-1 mr-4">{notice.title}</p>
              <span className="text-sm text-gray-400 flex-shrink-0">
                {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : ''}
              </span>
            </Link>
          ))}
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

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    queryFn: async () => {
      const res = await fetch('/api/reviews?limit=50');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: noticesData } = useQuery({
    queryKey: ['/api/notices'],
    queryFn: async () => {
      const res = await fetch('/api/notices?limit=6');
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
  const reviews = reviewsData || [];
  const notices = noticesData || [];
  const brands = brandsData || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <MainBannerSlider />
        <QuickMenu />
        <ForYouSection products={products} brands={brands} />
        <NewArrivalsSection products={products.slice(0, 8)} />
        <ReviewSection reviews={reviews} />
        <NoticeSection notices={notices} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
