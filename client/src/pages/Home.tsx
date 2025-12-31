import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePopup } from "@/components/home/HomePopup";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, Package } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

const bannerSlides = [
  { id: 1, title: "LUXURY BAGS", subtitle: "명품 가방 컬렉션", gradient: "from-gray-800 to-gray-900", link: "/products/bags" },
  { id: 2, title: "WINTER PADDING", subtitle: "프리미엄 패딩 신상품", gradient: "from-gray-700 to-gray-800", link: "/products/padding" },
  { id: 3, title: "ACCESSORIES", subtitle: "럭셔리 악세사리", gradient: "from-gray-900 to-black", link: "/products/accessories" },
];

function filterValidImageUrls(urls: string[]): string[] {
  return urls.filter(url => {
    if (url.includes('/data/file/bestreview/') || url.includes('/data/file/kalreom/')) {
      return false;
    }
    return true;
  });
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/product/${product.id}`} className="block bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" data-testid={`product-card-${product.id}`}>
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

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const products = productsData || [];
  const reviews = reviewsData || [];
  const bestReviews = reviews.slice(0, 4);
  const notices = noticesData || [];

  const scrollReviews = (direction: 'left' | 'right') => {
    if (reviewScrollRef.current) {
      const scrollAmount = 320;
      reviewScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getFirstValidImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    const validUrls = filterValidImageUrls(urls);
    return validUrls.length > 0 ? validUrls[0] : null;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <HomePopup />
      <Header />
      
      <main>
        <section className="relative bg-gray-200 overflow-hidden" style={{ height: 'clamp(250px, 40vw, 450px)' }}>
          {bannerSlides.map((slide, index) => (
            <Link 
              key={slide.id} 
              href={slide.link}
              className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-r ${slide.gradient} flex items-center justify-center ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              <div className="text-center text-white px-4">
                <h2 className="text-3xl md:text-5xl font-bold tracking-wider mb-3">{slide.title}</h2>
                <p className="text-lg md:text-xl text-white/80">{slide.subtitle}</p>
              </div>
            </Link>
          ))}
          
          <button 
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-20"
            aria-label="이전 배너"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-20"
            aria-label="다음 배너"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 px-3 py-1.5 rounded-full">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/40'}`}
                aria-label={`배너 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </section>

        <section className="bg-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-800 pb-1">인기 상품</h2>
              <Link href="/products" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>등록된 상품이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#f5f5f5] py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-600 text-sm">- 고객님들의 소중한 리뷰 :)</span>
            </div>
            <div className="text-xs text-gray-500 mb-4">(실제 후기 {reviews.length}개 이상!)</div>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-800 pb-1">구매후기</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => scrollReviews('left')}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
                  aria-label="이전 후기"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => scrollReviews('right')}
                  className="w-8 h-8 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
                  aria-label="다음 후기"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div 
              ref={reviewScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.slice(0, 20).map((review: any) => {
                const imageUrl = getFirstValidImage(review);
                return (
                  <Link 
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="flex-shrink-0 w-[260px] bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
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
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{review.content}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-4">
              <Link 
                href="/reviews" 
                className="inline-block border border-gray-300 bg-white px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                후기 더보기 +{reviews.length}건
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-800 pb-1">베스트후기</h2>
              <Link href="/reviews" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                더보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bestReviews.map((review: any) => {
                const imageUrl = getFirstValidImage(review);
                return (
                  <Link 
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`best-review-${review.id}`}
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
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2 font-medium">{review.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {bestReviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>등록된 후기가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#f5f5f5] py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-800 pb-1">공지사항</h2>
              <Link href="/notices" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                더보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {notices.map((notice: any) => (
                <Link 
                  key={notice.id}
                  href={`/notices/${notice.id}`}
                  className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  data-testid={`notice-card-${notice.id}`}
                >
                  {notice.imageUrl && (
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={getProxiedImageUrl(notice.imageUrl)}
                        alt={notice.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-700 line-clamp-2">{notice.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {notices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
