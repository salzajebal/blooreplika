import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomePopup } from "@/components/home/HomePopup";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Star, Heart, Package, Truck, Shield, Headphones } from "lucide-react";
import { useState, useEffect } from "react";

const categories = [
  { name: '아우터', slug: 'outer', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=400&fit=crop' },
  { name: '패딩', slug: 'padding', image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=400&h=400&fit=crop' },
  { name: '상의', slug: 'tops', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop' },
  { name: '하의', slug: 'bottoms', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop' },
  { name: '신발', slug: 'shoes', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop' },
  { name: '가방', slug: 'bags', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop' },
  { name: '지갑', slug: 'wallets', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop' },
  { name: '시계', slug: 'watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop' },
];

const bannerSlides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&h=600&fit=crop',
    title: 'NEW ARRIVAL',
    subtitle: '2025 S/S 신상품 컬렉션',
    link: '/products/outer'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=600&fit=crop',
    title: 'LUXURY COLLECTION',
    subtitle: '명품 레플리카 베스트 아이템',
    link: '/products/bags'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop',
    title: 'SPECIAL SALE',
    subtitle: '최대 50% 할인 이벤트',
    link: '/products/shoes'
  }
];

function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/product/${product.id}`} className="group block" data-testid={`product-card-${product.id}`}>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="w-12 h-12" />
          </div>
        )}
        {product.isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">SOLD OUT</span>
          </div>
        )}
        <button 
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          onClick={(e) => { e.preventDefault(); }}
          data-testid={`wishlist-btn-${product.id}`}
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase">{product.brandName || 'BRAND'}</p>
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-gray-600">{product.name}</h3>
        <div className="flex items-center gap-2">
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {Number(product.originalPrice).toLocaleString()}원
            </span>
          )}
          <span className="font-bold">{Number(product.price).toLocaleString()}원</span>
        </div>
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{product.avgRating?.toFixed(1) || '0.0'}</span>
            <span>({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4" data-testid={`review-card-${review.id}`}>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-700 line-clamp-3 mb-2">{review.content}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{review.authorName}</span>
        <span>{new Date(review.displayDate).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: productsData } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    queryFn: async () => {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: noticesData } = useQuery({
    queryKey: ['/api/notices'],
    queryFn: async () => {
      const res = await fetch('/api/notices');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const products = productsData || [];
  const reviews = reviewsData?.slice(0, 4) || [];
  const notices = noticesData?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-white">
      <HomePopup />
      <Header />
      
      <main>
        <section className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
          {bannerSlides.map((slide, index) => (
            <Link 
              key={slide.id} 
              href={slide.link}
              className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-2">{slide.title}</h2>
                <p className="text-lg md:text-xl">{slide.subtitle}</p>
              </div>
            </Link>
          ))}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                data-testid={`banner-dot-${index}`}
              />
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((cat) => (
              <Link 
                key={cat.slug} 
                href={`/products/${cat.slug}`}
                className="flex flex-col items-center gap-2 group"
                data-testid={`category-${cat.slug}`}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 overflow-hidden group-hover:ring-2 ring-black transition-all">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs md:text-sm font-medium text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">인기 상품</h2>
            <Link href="/products" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
        </section>

        <section className="bg-gray-50 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold">베스트 리뷰</h2>
              <Link href="/reviews" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reviews.map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {reviews.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>등록된 리뷰가 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">공지사항</h2>
            <Link href="/notices" className="text-sm text-gray-500 hover:text-black flex items-center gap-1">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="border-t border-gray-200">
            {notices.map((notice: any) => (
              <Link 
                key={notice.id} 
                href={`/notices/${notice.id}`}
                className="flex items-center justify-between py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2 -mx-2"
                data-testid={`notice-${notice.id}`}
              >
                <div className="flex items-center gap-3">
                  {notice.isPinned && (
                    <span className="bg-black text-white text-xs px-2 py-0.5 rounded">공지</span>
                  )}
                  <span className="text-sm md:text-base line-clamp-1">{notice.title}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                  {new Date(notice.displayDate).toLocaleDateString()}
                </span>
              </Link>
            ))}
            {notices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>등록된 공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-gray-100 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">무료배송</h3>
                <p className="text-xs text-gray-500">5만원 이상 무료배송</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">품질보증</h3>
                <p className="text-xs text-gray-500">최상급 퀄리티 보장</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">안전포장</h3>
                <p className="text-xs text-gray-500">꼼꼼한 안전포장</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">고객센터</h3>
                <p className="text-xs text-gray-500">1:1 맞춤 상담</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
