import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePopup } from "@/components/home/HomePopup";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, MessageCircle, HelpCircle } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

function filterValidImageUrls(urls: string[]): string[] {
  return urls.filter(url => {
    if (url.includes('/data/file/bestreview/') || url.includes('/data/file/kalreom/')) {
      return false;
    }
    return true;
  });
}

function FloatingButtons() {
  return (
    <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-2">
      <Link 
        href="/support"
        className="w-12 h-12 bg-white border border-gray-300 rounded shadow-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-50"
        data-testid="floating-support"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-[8px] mt-0.5">상담</span>
      </Link>
      <Link 
        href="/faq"
        className="w-12 h-12 bg-white border border-gray-300 rounded shadow-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-50"
        data-testid="floating-qa"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-[8px] mt-0.5">Q&A</span>
      </Link>
    </div>
  );
}

function MainBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bannerImages = [
    "https://cdamdong.co.kr/data/banner/25",
    "https://cdamdong.co.kr/data/banner/23",
    "https://cdamdong.co.kr/data/banner/24",
    "https://cdamdong.co.kr/data/banner/17",
    "https://cdamdong.co.kr/data/banner/16",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  return (
    <section className="relative w-full bg-gray-900 overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerImages.map((url, index) => (
          <div 
            key={index}
            className="w-full flex-shrink-0 aspect-[16/6] md:aspect-[16/5] bg-cover bg-center"
            style={{ backgroundImage: `url(${getProxiedImageUrl(url)})` }}
          />
        ))}
      </div>
      
      <button 
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerImages.length - 1 : prev - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-10"
        aria-label="이전"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerImages.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-10"
        aria-label="다음"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`슬라이드 ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function MiddleBanners() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex flex-col gap-2">
        <Link href="/category/choice" className="block">
          <img 
            src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/28")}
            alt="청담동초이스 배너"
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Link>
        <img 
          src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/14")}
          alt="중간 배너"
          className="w-full h-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    </section>
  );
}

function PurchaseReviewSection({ reviews }: { reviews: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getReviewImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    const validUrls = filterValidImageUrls(urls);
    return validUrls.length > 0 ? validUrls[0] : null;
  };

  const scrollReviews = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const validReviews = reviews.filter(r => getReviewImage(r) !== null);

  if (validReviews.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">- 고객님들의 소중한 리뷰 :)</p>
        <p className="text-xs text-gray-400">(실제 후기 20,000개 이상!)</p>
        <p className="text-xs text-gray-500 mt-1">- 간단한 텍스트 리뷰 작성하시고 포인트 적립 받아 가세요!!</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 구매후기
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => scrollReviews('left')}
            className="w-6 h-6 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scrollReviews('right')}
            className="w-6 h-6 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {validReviews.slice(0, 20).map((review: any) => {
          const imageUrl = getReviewImage(review);
          return (
            <Link 
              key={review.id}
              href={`/reviews/${review.id}`}
              className="flex-shrink-0 w-[230px] bg-white border border-gray-200 hover:border-gray-400 transition-colors"
              data-testid={`purchase-review-${review.id}`}
            >
              <div className="aspect-square bg-gray-100">
                <img 
                  src={getProxiedImageUrl(imageUrl!)}
                  alt={review.title || '후기'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                />
              </div>
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {review.content || review.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center mt-3">
        <Link 
          href="/reviews" 
          className="inline-block border border-gray-300 bg-white px-6 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          후기 더보기 +{reviews.length > 1000 ? '18988' : reviews.length}건
        </Link>
      </div>
    </section>
  );
}

function BestReviewSection({ reviews }: { reviews: any[] }) {
  const getReviewImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    return urls.length > 0 ? urls[0] : null;
  };

  const bestReviews = reviews.filter(r => getReviewImage(r) !== null).slice(0, 4);

  if (bestReviews.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 베스트후기
        </h2>
      </div>

      <div className="flex gap-4">
        <div className="hidden md:block w-[200px] flex-shrink-0">
          <img 
            src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/26")}
            alt="베스트후기 배너"
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestReviews.map((review: any) => {
            const imageUrl = getReviewImage(review);
            return (
              <Link 
                key={review.id}
                href={`/reviews/${review.id}`}
                className="bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                data-testid={`best-review-${review.id}`}
              >
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={getProxiedImageUrl(imageUrl!)}
                    alt={review.title || '베스트 후기'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 line-clamp-2">{review.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-4">
        <Link 
          href="/reviews" 
          className="inline-block border border-gray-300 bg-white px-6 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          베스트후기 더보기 +{bestReviews.length}건
        </Link>
      </div>
    </section>
  );
}

function NoticeSection({ notices }: { notices: any[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 공지사항
        </h2>
        <Link href="/notices" className="text-xs text-gray-500 hover:text-black">
          더보기 +
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {notices.slice(0, 8).map((notice: any) => (
          <Link 
            key={notice.id}
            href={`/notices/${notice.id}`}
            className="bg-white border border-gray-200 hover:border-gray-400 transition-colors"
            data-testid={`notice-card-${notice.id}`}
          >
            {notice.imageUrl && (
              <div className="aspect-video bg-gray-100">
                <img 
                  src={getProxiedImageUrl(notice.imageUrl)}
                  alt={notice.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-gray-700 line-clamp-2">{notice.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ products }: { products: any[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 신상품
        </h2>
        <Link href="/products" className="text-xs text-gray-500 hover:text-black">
          더보기 +
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 8).map((product: any) => (
          <Link 
            key={product.id}
            href={`/product/${product.id}`} 
            className="bg-white border border-gray-200 hover:border-gray-400 transition-colors" 
            data-testid={`product-card-${product.id}`}
          >
            <div className="aspect-square bg-gray-100 relative">
              <img 
                src={getProxiedImageUrl(product.imageUrl)} 
                alt={product.name} 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
              />
              {product.isSoldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SOLD OUT</span>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100">
              <h3 className="text-xs text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
              <div className="flex items-center gap-2">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {Number(product.originalPrice).toLocaleString()}원
                  </span>
                )}
                <span className="text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=8');
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
      const res = await fetch('/api/notices?limit=8');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const products = productsData || [];
  const reviews = reviewsData || [];
  const notices = noticesData || [];

  return (
    <div className="min-h-screen bg-white">
      <HomePopup />
      <Header />
      
      <main>
        <MainBannerSlider />
        <MiddleBanners />
        <PurchaseReviewSection reviews={reviews} />
        <BestReviewSection reviews={reviews} />
        <NoticeSection notices={notices} />
        <ProductSection products={products} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
