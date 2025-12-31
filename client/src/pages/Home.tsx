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

function BannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bannerSlides = [
    { id: 1, date: "2월 30일(목) - 주문대비안내...", timestamp: "21:04" },
    { id: 2, date: "2월 30일(목) - 신상품 입고", timestamp: "14:44" },
    { id: 3, date: "2월 30일(목) - 베스트 상품", timestamp: "18:30" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative bg-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {[0, 1].map((offset) => {
          const slideIndex = (currentSlide + offset) % bannerSlides.length;
          const slide = bannerSlides[slideIndex];
          return (
            <div 
              key={offset}
              className="relative aspect-[4/3] md:aspect-[16/11] bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 overflow-hidden"
            >
              <div className="absolute inset-0" style={{
                background: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 60px,
                    rgba(255,255,255,0.02) 60px,
                    rgba(255,255,255,0.02) 61px
                  )
                `
              }} />
              
              <div className="absolute inset-0 flex flex-wrap items-center justify-center overflow-hidden opacity-10">
                {Array(8).fill(null).map((_, i) => (
                  <div key={i} className="text-white text-[10px] tracking-[0.3em] whitespace-nowrap px-4 py-2 transform -rotate-3">
                    cdamdong cdamdong cdamdong cdamdong cdamdong
                  </div>
                ))}
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white/50 text-[10px] md:text-xs mb-2">{slide.date}</div>
                  <div className="text-white text-4xl md:text-6xl font-bold tracking-wider mb-4">{slide.timestamp}</div>
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-5 py-3 inline-block">
                    <div className="text-yellow-400 text-lg mb-0.5">👑</div>
                    <div className="text-white font-bold text-sm md:text-base tracking-wide">청담동에디션</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <div className="text-white/20 text-[8px] tracking-[0.2em]">
                  cdamdong cdamdong cdamdong cdamdong cdam
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1))}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white z-20"
        aria-label="이전 배너"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white z-20"
        aria-label="다음 배너"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </section>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link 
      href={`/product/${product.id}`} 
      className="block bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" 
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
      <div className="p-3">
        <p className="text-[10px] text-gray-500 uppercase mb-1">{product.brandName || 'BRAND'}</p>
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
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
  );
}

function ReviewCard({ review }: { review: any }) {
  const getFirstValidImage = (): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    const validUrls = filterValidImageUrls(urls);
    return validUrls.length > 0 ? validUrls[0] : null;
  };
  
  const imageUrl = getFirstValidImage();
  
  return (
    <Link 
      href={`/reviews/${review.id}`}
      className="flex-shrink-0 w-[200px] bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      data-testid={`review-card-${review.id}`}
    >
      {imageUrl && (
        <div className="aspect-square bg-gray-100">
          <img 
            src={getProxiedImageUrl(imageUrl)}
            alt={review.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-2">
        <div className="flex items-center gap-0.5 mb-1">
          {[1,2,3,4,5].map((star) => (
            <Star 
              key={star} 
              className={`w-2.5 h-2.5 ${star <= (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-gray-600 line-clamp-2">{review.content}</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const reviewScrollRef = useRef<HTMLDivElement>(null);

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

  const scrollReviews = (direction: 'left' | 'right') => {
    if (reviewScrollRef.current) {
      const scrollAmount = 220;
      reviewScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HomePopup />
      <Header />
      
      <main>
        <BannerSlider />

        {products.length > 0 && (
          <section className="py-8 bg-white">
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">인기 상품</h2>
                <Link href="/products" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.slice(0, 8).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="py-8 bg-gray-50">
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-500 text-sm">- 고객님들의 소중한 리뷰 :)</span>
              </div>
              <div className="text-xs text-gray-400 mb-4">(실제 후기 {reviews.length}개 이상!)</div>
              
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-800 border-b-2 border-gray-800 pb-1">구매후기</h2>
                <div className="flex gap-1">
                  <button 
                    onClick={() => scrollReviews('left')}
                    className="w-7 h-7 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
                    aria-label="이전 후기"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => scrollReviews('right')}
                    className="w-7 h-7 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
                    aria-label="다음 후기"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div 
                ref={reviewScrollRef}
                className="flex gap-3 overflow-x-auto pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {reviews.slice(0, 20).map((review: any) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              <div className="text-center mt-3">
                <Link 
                  href="/reviews" 
                  className="inline-block border border-gray-300 bg-white px-5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  후기 더보기 +{reviews.length}건
                </Link>
              </div>
            </div>
          </section>
        )}

        {notices.length > 0 && (
          <section className="py-8 bg-white">
            <div className="max-w-[1200px] mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 border-b-2 border-gray-800 pb-1">공지사항</h2>
                <Link href="/notices" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                  더보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {notices.slice(0, 8).map((notice: any) => (
                  <Link 
                    key={notice.id}
                    href={`/notices/${notice.id}`}
                    className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
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
                      <p className="text-[10px] text-gray-400 mt-1">
                        {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
