import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, HelpCircle, Eye } from "lucide-react";
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
    <section className="relative w-full overflow-hidden bg-gray-100">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerList.map((banner: any, index: number) => (
          <div key={index} className="w-full flex-shrink-0">
            <Link href={banner.linkUrl || "/products"}>
              <img 
                src={banner.imageUrl?.startsWith('http') ? getProxiedImageUrl(banner.imageUrl, "large") : banner.imageUrl}
                alt={banner.title || `배너 ${index + 1}`}
                className="w-full h-auto max-h-[200px] md:max-h-[450px] object-cover"
              />
            </Link>
          </div>
        ))}
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
                  index === currentSlide ? 'bg-white w-5' : 'bg-white/50'
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
  const quickMenuItems = [
    { name: "VIP 명품관", icon: "👑", path: "/products/genuine" },
    { name: "실시간 검수", icon: "🔍", path: "/comparison" },
    { name: "셀럽 스타일", icon: "✨", path: "/choice" },
    { name: "요청 상품", icon: "📋", path: "/support" },
    { name: "기획전", icon: "🎯", path: "/events" },
    { name: "베스트", icon: "🏆", path: "/reviews" },
    { name: "이벤트", icon: "🎁", path: "/events" },
    { name: "구매 후기", icon: "💬", path: "/reviews" },
    { name: "공지사항", icon: "📢", path: "/notices" },
    { name: "블로그", icon: "📝", path: "/blog" },
  ];

  return (
    <section className="bg-white py-4 md:py-6 border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide gap-3 md:gap-6 md:justify-center">
          {quickMenuItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className="flex flex-col items-center gap-1.5 min-w-[60px] md:min-w-[70px] group"
              data-testid={`quick-menu-${item.name}`}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl md:text-2xl group-hover:bg-gray-100 group-hover:border-gray-200 transition-all">
                {item.icon}
              </div>
              <span className="text-[10px] md:text-xs text-gray-600 text-center whitespace-nowrap group-hover:text-black transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForYouSection({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
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
      description: wasInWishlist 
        ? `${product.name} 삭제되었습니다.` 
        : `${product.name} 등록되었습니다.`,
    });
  };

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
            For You
          </h2>
          <p className="text-sm text-gray-500">고객님을 위해 준비해 봤어요.</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm md:text-base font-bold text-gray-900">지금 뜨는 인기상품</span>
          </div>
          <Link href="/products" className="text-xs text-gray-500 hover:text-black transition-colors" data-testid="link-more-products">
            더보기
          </Link>
        </div>

        <div className="relative">
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div 
            ref={scrollRef}
            className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4"
          >
            {products.map((product: any, index: number) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="flex-shrink-0 w-[160px] md:w-[220px] group"
                data-testid={`foryou-product-${product.id}`}
              >
                <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2.5">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-bold">{index + 1}</span>
                  </div>
                  <img 
                    src={getProxiedImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                  />
                  {product.viewCount > 0 && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-600">{Number(product.viewCount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/30 to-transparent">
                    <button 
                      onClick={(e) => handleWishlistToggle(e, product)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
                      }`}
                      data-testid={`button-wishlist-${product.id}`}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlistToggle(e, product); }}
                      data-testid={`button-cart-foryou-${product.id}`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                  {product.isSoldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold px-3 py-1 bg-black/60 rounded">SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div className="px-0.5">
                  <p className="text-[11px] md:text-xs text-gray-500 mb-0.5 uppercase tracking-wide font-medium">
                    {product.brandId || "BRAND"}
                  </p>
                  <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-2 leading-snug">
                    {product.name}
                  </h3>
                  {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                    <p className="text-[10px] text-gray-400 mb-0.5">
                      매장가 <span className="line-through">{Number(product.originalPrice).toLocaleString()}원</span>
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    {product.discountPercent > 0 && (
                      <span className="text-red-500 text-sm font-bold">{product.discountPercent}%</span>
                    )}
                    <span className="text-sm md:text-base font-bold text-gray-900">
                      {Number(product.price).toLocaleString()}원
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">즉시구매가</p>
                </div>
              </Link>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
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
    <section className="bg-[#fafafa] py-8 md:py-12">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">신상품</h2>
            <p className="text-xs text-gray-500 mt-0.5">새로 입고된 상품을 확인해보세요</p>
          </div>
          <Link href="/products" className="text-xs text-gray-500 hover:text-black border border-gray-300 px-3 py-1.5 rounded-full transition-colors">
            전체보기
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {products.slice(0, 8).map((product: any) => (
            <Link 
              key={product.id}
              href={`/product/${product.id}`} 
              className="bg-white rounded-lg overflow-hidden group hover:shadow-md transition-all"
              data-testid={`product-card-${product.id}`}
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={getProxiedImageUrl(product.imageUrl)} 
                  alt={product.name} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
                {product.isBest && (
                  <span className="absolute top-2 left-2 bg-black text-white text-[9px] px-2 py-0.5 font-bold rounded-sm">BEST</span>
                )}
                {product.isNew && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-2 py-0.5 font-bold rounded-sm">NEW</span>
                )}
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">SOLD OUT</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button 
                    onClick={(e) => handleWishlistToggle(e, product)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                      isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    data-testid={`button-wishlist-new-${product.id}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5 font-medium">{product.brandId || "BRAND"}</p>
                <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-2 leading-snug">{product.name}</h3>
                <div className="flex items-baseline gap-1">
                  {product.discountPercent > 0 && (
                    <span className="text-red-500 text-xs font-bold">{product.discountPercent}%</span>
                  )}
                  <span className="text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
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
    <section className="bg-white py-8 md:py-12 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">구매후기</h2>
            <p className="text-xs text-gray-500 mt-0.5">고객님들의 소중한 리뷰</p>
          </div>
          <Link href="/reviews" className="text-xs text-gray-500 hover:text-black border border-gray-300 px-3 py-1.5 rounded-full transition-colors">
            전체보기
          </Link>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
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
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                  <img 
                    src={getProxiedImageUrl(imageUrl!)}
                    alt={review.title || '후기'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                  />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed px-0.5">
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
    <section className="bg-[#fafafa] py-8 md:py-12 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">공지사항</h2>
          <Link href="/notices" className="text-xs text-gray-500 hover:text-black transition-colors">
            더보기
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notices.slice(0, 6).map((notice: any) => (
            <Link 
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-sm transition-all group"
              data-testid={`notice-card-${notice.id}`}
            >
              {notice.imageUrl && (
                <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  <img 
                    src={getProxiedImageUrl(notice.imageUrl)}
                    alt={notice.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium line-clamp-1 group-hover:text-black transition-colors">{notice.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('ko-KR') : ''}
                </p>
              </div>
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
      const res = await fetch('/api/products?limit=16');
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

  const products = productsData || [];
  const reviews = reviewsData || [];
  const notices = noticesData || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <MainBannerSlider />
        <QuickMenu />
        <ForYouSection products={products.slice(0, 10)} />
        <NewArrivalsSection products={products.slice(0, 8)} />
        <ReviewSection reviews={reviews} />
        <NoticeSection notices={notices} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
